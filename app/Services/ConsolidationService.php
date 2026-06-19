<?php

namespace App\Services;

use App\Models\ActiviteCommerciale;
use App\Models\FichePerformance;
use App\Models\Livrable;
use App\Models\Mission;
use App\Models\OpsSaisie;
use App\Models\Prospect;
use App\Models\ResultatCle;

/**
 * Moteur de consolidation automatique.
 *
 * Orchestre la mise à jour des KRs OKR depuis les sources externes (CRM, Missions)
 * et propage les progressions vers les fiches de performance.
 *
 * Sources supportées :
 *   crm_activites     — compte les ActiviteCommerciale par type/cycle
 *   crm_deals         — somme les montants des deals gagnés
 *   crm_pipeline      — valeur pipeline (pondérée ou brute)
 *   missions_nps      — moyenne NPS des missions du responsable
 *   missions_livrables — count de livrables dans un statut cible
 */
class ConsolidationService
{
    public function __construct(private OkrPerformanceSyncService $perfSync) {}

    // ─── Points d'entrée publics ─────────────────────────────────────────────

    /**
     * Recalcule tous les KRs automatiques de la société.
     * Appelé par la commande artisan okr:consolider.
     */
    public function syncSociete(int $societeId): int
    {
        $krs = ResultatCle::with('objectif.axeObjectif')
            ->where(fn ($q) =>
                $q->whereNotNull('source_auto')
                  ->orWhere('source_crm', true)
            )
            ->whereNotNull('responsable_id')
            ->whereHas('objectif', fn ($q) => $q->where('societe_id', $societeId))
            ->get();

        foreach ($krs as $kr) {
            $this->recalculerKr($kr, false); // false = ne pas cascader vers perf (fait en fin de boucle)
        }

        // Propager vers toutes les fiches non verrouillées de la société en une fois
        $collaborateurIds = $krs->pluck('responsable_id')->filter()->unique();
        foreach ($collaborateurIds as $collabId) {
            $this->syncPerformancePourCollaborateur($collabId, $societeId);
        }

        return $krs->count();
    }

    /**
     * Recalcule les KRs d'un collaborateur pour une source donnée.
     * Appelé après storeActivite (crm_activites).
     */
    public function syncKrsParCollaborateur(int $collaborateurId, string $source, int $societeId): int
    {
        $krs = ResultatCle::with('objectif.axeObjectif')
            ->where('responsable_id', $collaborateurId)
            ->where(fn ($q) =>
                $q->where('source_auto', $source)
                  ->orWhere(fn ($q2) =>
                      $q2->whereNull('source_auto')
                         ->where('source_crm', true)
                  )
            )
            ->whereHas('objectif', fn ($q) => $q->where('societe_id', $societeId))
            ->get();

        foreach ($krs as $kr) {
            $this->recalculerKr($kr, false);
        }

        $this->syncPerformancePourCollaborateur($collaborateurId, $societeId);

        return $krs->count();
    }

    /**
     * Recalcule les KRs d'un type de source pour toute la société.
     * Appelé depuis les observers Prospect/Mission/Livrable.
     */
    public function syncKrsParSociete(int $societeId, string $source): int
    {
        $query = ResultatCle::with('objectif.axeObjectif')
            ->whereNotNull('responsable_id')
            ->whereHas('objectif', fn ($q) => $q->where('societe_id', $societeId));

        if ($source === 'crm_deals') {
            // Inclut les KRs legacy (source_crm=true sans type_activite) + nouveaux crm_deals
            $query->where(fn ($q) =>
                $q->where('source_auto', 'crm_deals')
                  ->orWhere(fn ($q2) =>
                      $q2->whereNull('source_auto')
                         ->where('source_crm', true)
                         ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(source_crm_filtre, '$.type_activite')) IS NULL")
                  )
            );
        } else {
            $query->where('source_auto', $source);
        }

        $krs = $query->get();

        foreach ($krs as $kr) {
            $this->recalculerKr($kr, false);
        }

        $collaborateurIds = $krs->pluck('responsable_id')->filter()->unique();
        foreach ($collaborateurIds as $collabId) {
            $this->syncPerformancePourCollaborateur($collabId, $societeId);
        }

        return $krs->count();
    }

    /**
     * Recalcule un seul KR et propage vers la fiche de performance.
     * Appelé par le bouton de sync manuel (route objectifs.kr.sync).
     */
    public function recalculerKr(ResultatCle $kr, bool $propagerPerf = true): void
    {
        $societeId = $kr->objectif?->societe_id;
        if (! $societeId) {
            return;
        }

        $source = $this->detecterSource($kr);
        if ($source === null) {
            return;
        }

        $valeurActuelle = match ($source) {
            'crm_activites'      => $this->calculerDepuisActivites($kr, $societeId),
            'crm_deals'          => $this->calculerDepuisDeals($kr, $societeId),
            'crm_pipeline'       => $this->calculerDepuisPipeline($kr, $societeId),
            'missions_nps'       => $this->calculerDepuisNps($kr, $societeId),
            'missions_livrables' => $this->calculerDepuisLivrables($kr, $societeId),
            'ops'                => $this->calculerDepuisOps($kr, $societeId),
            default              => null,
        };

        if ($valeurActuelle === null) {
            return;
        }

        $progression = $this->calculerProgression($kr, $valeurActuelle);

        $kr->valeur_actuelle = $valeurActuelle;
        $kr->progression     = $progression;
        $kr->saveQuietly();

        if ($propagerPerf && $kr->responsable_id) {
            $this->syncPerformancePourCollaborateur($kr->responsable_id, $societeId);
        }
    }

    /**
     * Propage les KRs OKR vers la fiche de performance d'un collaborateur.
     * Ne touche que les fiches non verrouillées.
     */
    public function syncPerformancePourCollaborateur(int $collaborateurId, int $societeId): void
    {
        $fiches = FichePerformance::where('societe_id', $societeId)
            ->where('collaborateur_id', $collaborateurId)
            ->where('verrouille', false)
            ->get();

        foreach ($fiches as $fiche) {
            $this->perfSync->syncFiche($fiche);
            $fiche->consolide_at = now();
            $fiche->saveQuietly();
        }
    }

    // ─── Détection de la source ──────────────────────────────────────────────

    private function detecterSource(ResultatCle $kr): ?string
    {
        if ($kr->source_auto !== null) {
            return $kr->source_auto;
        }

        // Rétrocompatibilité : source_crm=true → inférer depuis les clés du filtre
        if ($kr->source_crm) {
            $filtre = $kr->source_crm_filtre ?? [];
            return isset($filtre['type_activite']) ? 'crm_activites' : 'crm_deals';
        }

        return null;
    }

    // ─── Stratégies de calcul ────────────────────────────────────────────────

    /**
     * Compte ou somme les ActiviteCommerciale du cycle courant.
     * filtre.type_activite : type à filtrer — null/'' = tous les types
     * filtre.agregat       : 'count' (défaut) = nombre d'activités | 'sum' = somme des montants
     * filtre.cycle         : 'courant' (défaut) ou cycle fixe ex "Q2 2026"
     */
    private function calculerDepuisActivites(ResultatCle $kr, int $societeId): float
    {
        $filtre       = $kr->source_crm_filtre ?? [];
        $typeActivite = $filtre['type_activite'] ?? null;
        $agregat      = $filtre['agregat'] ?? 'count';

        $cycle = (isset($filtre['cycle']) && $filtre['cycle'] !== 'courant')
            ? $filtre['cycle']
            : 'Q' . (int) ceil(now()->month / 3) . ' ' . now()->year;

        $query = ActiviteCommerciale::where('societe_id', $societeId)
            ->where('collaborateur_id', $kr->responsable_id)
            ->where('cycle', $cycle);

        // Support multi-valeur (type_activites) + fallback legacy (type_activite)
        $typeActivites = $filtre['type_activites'] ?? null;
        if (! empty($typeActivites)) {
            $query->whereIn('type', (array) $typeActivites);
        } elseif ($typeActivite) {
            $query->where('type', $typeActivite);
        }

        return $agregat === 'sum'
            ? (float) $query->sum('montant')
            : (float) $query->count();
    }

    /**
     * Somme le montant_final des deals gagnés.
     * filtre.type_deal         : filtrer par type de deal (optionnel)
     * filtre.collaborateur_ids : filtrer par responsable(s) (optionnel)
     * filtre.date_debut / date_fin : filtrer par date_conversion (optionnel)
     */
    private function calculerDepuisDeals(ResultatCle $kr, int $societeId): float
    {
        $filtre = $kr->source_crm_filtre ?? [];

        $query = Prospect::where('societe_id', $societeId)
            ->where('statut', 'gagne')
            ->whereNotNull('montant_final');

        if (! empty($filtre['type_deal'])) {
            $query->where('type_deal', $filtre['type_deal']);
        }

        if (! empty($filtre['collaborateur_ids']) && is_array($filtre['collaborateur_ids'])) {
            $query->whereIn('collaborateur_id', $filtre['collaborateur_ids']);
        }

        if (! empty($filtre['date_debut'])) {
            $query->where('date_conversion', '>=', $filtre['date_debut']);
        }

        if (! empty($filtre['date_fin'])) {
            $query->where('date_conversion', '<=', $filtre['date_fin']);
        }

        return (float) $query->sum('montant_final');
    }

    /**
     * Calcule la valeur du pipeline CRM.
     * filtre.type_deal : filtrer par type de deal (optionnel)
     * filtre.statuts   : statuts à inclure (défaut : decouverte, proposition, negociation)
     * filtre.ponderer  : true = pondéré par probabilité, false = brut (défaut : true)
     */
    private function calculerDepuisPipeline(ResultatCle $kr, int $societeId): float
    {
        $filtre  = $kr->source_crm_filtre ?? [];
        $statuts = $filtre['statuts'] ?? ['decouverte', 'proposition', 'negociation'];
        $ponderer = $filtre['ponderer'] ?? true;

        $deals = Prospect::where('societe_id', $societeId)
            ->whereIn('statut', $statuts)
            ->when(! empty($filtre['type_deal']), fn ($q) => $q->where('type_deal', $filtre['type_deal']))
            ->get(['valeur', 'probabilite']);

        if ($ponderer) {
            return (float) $deals->sum(fn ($p) =>
                (float) ($p->valeur ?? 0) * ((int) ($p->probabilite ?? 0) / 100)
            );
        }

        return (float) $deals->sum(fn ($p) => (float) ($p->valeur ?? 0));
    }

    /**
     * Calcule la moyenne NPS des missions du responsable.
     * filtre.statuts_mission : statuts de mission inclus (défaut : active, completed)
     * filtre.periode_mois    : fenêtre temporelle en mois (optionnel)
     */
    private function calculerDepuisNps(ResultatCle $kr, int $societeId): float
    {
        $filtre  = $kr->source_crm_filtre ?? [];
        $statuts = $filtre['statuts_mission'] ?? ['active', 'completed'];

        $query = Mission::where('societe_id', $societeId)
            ->where('responsable_id', $kr->responsable_id)
            ->whereIn('statut', $statuts)
            ->whereNotNull('nps_score');

        if (! empty($filtre['periode_mois'])) {
            $query->where('created_at', '>=', now()->subMonths((int) $filtre['periode_mois']));
        }

        return (float) ($query->avg('nps_score') ?? 0);
    }

    /**
     * Calcule la progression des livrables pour le responsable, pondérée par leur poids.
     * Retourne sum(poids approved) / sum(poids total) × 100 si les poids sont configurés,
     * sinon compte brut des livrables dans le statut cible.
     * filtre.statut_cible : statut à compter (défaut : approved)
     */
    private function calculerDepuisLivrables(ResultatCle $kr, int $societeId): float
    {
        $filtre      = $kr->source_crm_filtre ?? [];
        $statutCible = $filtre['statut_cible'] ?? 'approved';

        $livrables = Livrable::whereHas('mission', fn ($q) =>
            $q->where('societe_id', $societeId)
              ->where('responsable_id', $kr->responsable_id)
        )->get(['statut', 'poids']);

        if ($livrables->isEmpty()) {
            return 0.0;
        }

        $poidsTotal    = $livrables->sum('poids');
        $poidsApproved = $livrables->where('statut', $statutCible)->sum('poids');

        // Si tous les poids sont à 1, retourner le count brut (rétrocompatibilité)
        $tousEgaux = $livrables->every(fn ($l) => (float) $l->poids === 1.0);
        if ($tousEgaux) {
            return (float) $livrables->where('statut', $statutCible)->count();
        }

        // Retourner le % pondéré (0-100) pour que valeur_actuelle soit directement la progression
        return $poidsTotal > 0
            ? round(($poidsApproved / $poidsTotal) * 100, 2)
            : 0.0;
    }

    /**
     * Lit la dernière saisie d'un indicateur opérationnel pour le KR.
     * filtre.indicateur_id : ID de l'ops_indicateur à lire
     * filtre.periode       : 'courant' (défaut) ou période fixe ex "2026-06"
     * filtre.agregat       : 'last' (défaut) | 'sum' | 'avg' sur la période
     */
    private function calculerDepuisOps(ResultatCle $kr, int $societeId): float
    {
        $filtre       = $kr->source_crm_filtre ?? [];
        $indicateurId = $filtre['indicateur_id'] ?? null;

        if (! $indicateurId) {
            return 0.0;
        }

        $periode = isset($filtre['periode']) && $filtre['periode'] !== 'courant'
            ? $filtre['periode']
            : now()->format('Y-m');

        $agregat = $filtre['agregat'] ?? 'last';

        $query = OpsSaisie::where('societe_id', $societeId)
            ->where('ops_indicateur_id', $indicateurId)
            ->where('periode', $periode);

        if ($kr->responsable_id) {
            $query->where('collaborateur_id', $kr->responsable_id);
        }

        return match ($agregat) {
            'sum'  => (float) $query->sum('valeur'),
            'avg'  => (float) ($query->avg('valeur') ?? 0),
            default => (float) ($query->orderByDesc('updated_at')->value('valeur') ?? 0),
        };
    }

    // ─── Calcul de la progression depuis la valeur actuelle ─────────────────

    private function calculerProgression(ResultatCle $kr, float $valeurActuelle): float
    {
        $cible = (float) ($kr->valeur_cible ?? 0);

        if ($cible <= 0) {
            return 0.0;
        }

        return match ($kr->mode_calcul ?? 'pourcentage') {
            'boolean' => $valeurActuelle >= $cible ? 100.0 : 0.0,
            default   => min(100.0, round(($valeurActuelle / $cible) * 100, 2)),
        };
    }
}
