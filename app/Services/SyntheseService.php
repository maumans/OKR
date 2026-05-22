<?php

namespace App\Services;

use App\Models\Collaborateur;
use App\Models\ConfigurationOkr;
use App\Models\Objectif;
use App\Models\PrimeMensuelle;
use App\Models\Prospect;
use App\Models\Synthese;
use Carbon\Carbon;
use Illuminate\Auth\AuthManager;

class SyntheseService
{
    public function __construct(private AuthManager $auth) {}

    /**
     * Calcule le score global d'un collaborateur pour un mois donné.
     * Score = moyenne des progressions_globales de ses objectifs individuels du mois.
     */
    public function calculerScoreGlobalCollaborateur(int $collaborateurId, string $mois): float
    {
        $moisDate = Carbon::createFromFormat('Y-m', $mois)->startOfMonth()->format('Y-m-d');

        $objectifs = Objectif::where('collaborateur_id', $collaborateurId)
            ->where('mois', $moisDate)
            ->with('resultatsCles')
            ->get();

        if ($objectifs->isEmpty()) {
            return 0.0;
        }

        $config = ConfigurationOkr::where('societe_id', session('societe_id'))->first();
        $mode = $config?->mode_calcul ?? 'moyenne';

        $scores = $objectifs->map(function ($objectif) use ($mode) {
            $krs = $objectif->resultatsCles;
            if ($krs->isEmpty()) return 0.0;

            if ($mode === 'pondere') {
                $totalPoids = $krs->sum('poids');
                if ($totalPoids > 0) {
                    return round($krs->sum(fn($r) => $r->progression * $r->poids) / $totalPoids, 2);
                }
            }

            return round($krs->avg('progression'), 2);
        });

        return round($scores->avg(), 2);
    }

    /**
     * Retourne le tableau de données consolidées d'un collaborateur pour un mois.
     */
    public function getDonneesCollaborateur(Collaborateur $collab, string $mois): array
    {
        $moisDate = Carbon::createFromFormat('Y-m', $mois)->startOfMonth();
        $moisStr = $moisDate->format('Y-m-d');

        $objectifs = Objectif::where('collaborateur_id', $collab->id)
            ->where('mois', $moisStr)
            ->with(['resultatsCles', 'axeObjectif'])
            ->get()
            ->map(function ($o) {
                $krs = $o->resultatsCles;
                $progression = $krs->isEmpty() ? 0 : round($krs->avg('progression'), 1);
                return [
                    'id'          => $o->id,
                    'titre'       => $o->titre,
                    'axe'         => $o->axeObjectif?->nom ?? $o->axe,
                    'axe_couleur' => $o->axeObjectif?->couleur,
                    'score'       => $progression,
                    'nb_krs'      => $krs->count(),
                ];
            });

        $scoreGlobal = $this->calculerScoreGlobalCollaborateur($collab->id, $mois);

        $prime = PrimeMensuelle::where('collaborateur_id', $collab->id)
            ->where('mois', $moisStr)
            ->first();

        $seuilPourcentage = $prime?->seuil_pourcentage ?? 80;
        $primeAcquise = $scoreGlobal >= $seuilPourcentage;

        // Prospection du mois via date_premier_contact ou created_at
        $debutMois = $moisDate->copy()->startOfMonth();
        $finMois   = $moisDate->copy()->endOfMonth();

        $prospectsQuery = Prospect::where('collaborateur_id', $collab->id)
            ->where(function ($q) use ($debutMois, $finMois) {
                $q->whereBetween('date_premier_contact', [$debutMois, $finMois])
                  ->orWhere(function ($q2) use ($debutMois, $finMois) {
                      $q2->whereNull('date_premier_contact')
                         ->whereBetween('created_at', [$debutMois, $finMois]);
                  });
            });

        $totalProspects = $prospectsQuery->count();
        $signes = (clone $prospectsQuery)->where('statut', 'gagne')->count();

        return [
            'collaborateur' => [
                'id'       => $collab->id,
                'nom'      => $collab->nom,
                'prenom'   => $collab->prenom,
                'poste'    => $collab->poste,
                'couleur'  => $this->genererCouleur($collab->nom . $collab->prenom),
                'initiales' => $this->genererInitiales($collab->prenom, $collab->nom),
            ],
            'score_global'  => $scoreGlobal,
            'nb_objectifs'  => $objectifs->count(),
            'objectifs'     => $objectifs,
            'prime'         => $prime,
            'prime_acquise' => $primeAcquise,
            'prospection'   => [
                'total'  => $totalProspects,
                'signes' => $signes,
            ],
        ];
    }

    /**
     * Génère et persiste un snapshot mensuel dans la table syntheses.
     */
    public function genererSnapshot(string $mois): Synthese
    {
        $societeId = session('societe_id');
        $moisDate = Carbon::createFromFormat('Y-m', $mois)->startOfMonth()->format('Y-m-d');

        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->orderBy('nom')
            ->get();

        $payload = [];
        $budgetTotal = 0;
        $nbPrimesAccordees = 0;

        foreach ($collaborateurs as $collab) {
            $donnees = $this->getDonneesCollaborateur($collab, $mois);
            $payload[] = $donnees;

            if ($donnees['prime']?->validee) {
                $budgetTotal += (float) ($donnees['prime']->montant_accorde ?? 0);
                $nbPrimesAccordees++;
            }
        }

        return Synthese::updateOrCreate(
            ['societe_id' => $societeId, 'mois' => $moisDate],
            [
                'payload'             => $payload,
                'budget_primes_total' => $budgetTotal,
                'nb_primes_accordees' => $nbPrimesAccordees,
                'nb_collaborateurs'   => $collaborateurs->count(),
                'genere_par_user_id'  => $this->auth->id(),
            ]
        );
    }

    // ─── Helpers ───────────────────────────────────────────

    private function genererInitiales(string $prenom, string $nom): string
    {
        return mb_strtoupper(mb_substr($prenom, 0, 1) . mb_substr($nom, 0, 1));
    }

    private function genererCouleur(string $seed): string
    {
        $colors = [
            '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
            '#f59e0b', '#06b6d4', '#f43f5e', '#a855f7',
            '#0ea5e9', '#22c55e', '#d946ef', '#64748b',
        ];
        $index = abs(crc32($seed)) % count($colors);
        return $colors[$index];
    }
}
