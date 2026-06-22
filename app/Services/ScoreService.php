<?php

namespace App\Services;

use App\Models\Collaborateur;
use App\Models\Objectif;
use App\Models\Prospect;
use App\Models\RegleScoring;
use App\Models\SecteurActivite;
use App\Models\ScoreIndividuel;
use App\Models\TacheDaily;
use App\Models\ActionCommerciale;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ScoreService
{
    /**
     * Calcule le score KPI mensuel d'un collaborateur (module Individuel).
     */
    public function calculerScoreIndividuel(Collaborateur $collab, Carbon $mois): array
    {
        $moisDebut = $mois->copy()->startOfMonth();
        
        $objectifs = Objectif::where('collaborateur_id', $collab->id)
            ->where('mois', $moisDebut->format('Y-m-d'))
            ->get();

        $scoreGlobal = $objectifs->count() > 0 
            ? round($objectifs->avg(fn($o) => app(OkrService::class)->calculerProgressionObjectif($o)), 1)
            : 0;
            
        return [
            'score_global' => $scoreGlobal,
            'objectifs_count' => $objectifs->count(),
            'prime_potentielle' => $objectifs->sum('prime'),
        ];
    }

    /**
     * Historise le score mensuel d'un collaborateur dans la table scores_individuels.
     */
    public function historiserScoreMensuel(Collaborateur $collab, Carbon $mois, float $scoreGlobal, array $detailAxes = [], float $primeAcquise = 0): ScoreIndividuel
    {
        return ScoreIndividuel::updateOrCreate(
            [
                'collaborateur_id' => $collab->id,
                'mois' => $mois->copy()->startOfMonth()->format('Y-m-d'),
            ],
            [
                'societe_id' => $collab->societe_id,
                'score_global' => $scoreGlobal,
                'objectifs_count' => Objectif::where('collaborateur_id', $collab->id)
                    ->where('mois', $mois->copy()->startOfMonth()->format('Y-m-d'))
                    ->count(),
                'prime_acquise' => $primeAcquise,
                'detail_axes' => $detailAxes,
            ]
        );
    }

    /**
     * Récupère l'historique des scores mensuels d'un collaborateur (pour graphique).
     */
    public function getHistoriqueScores(int $collaborateurId, int $nombreMois = 6): array
    {
        return ScoreIndividuel::where('collaborateur_id', $collaborateurId)
            ->orderBy('mois', 'desc')
            ->limit($nombreMois)
            ->get()
            ->reverse()
            ->values()
            ->map(fn($s) => [
                'mois' => $s->mois->translatedFormat('M Y'),
                'score' => (float) $s->score_global,
                'objectifs' => $s->objectifs_count,
                'prime' => (float) $s->prime_acquise,
                'axes' => $s->detail_axes,
            ])
            ->toArray();
    }

    /**
     * Calcule les scores Fit et Engagement d'un prospect/deal.
     * Retourne ['fit' => int, 'engagement' => int] (chacun 0-100).
     *
     * @param  Prospect    $prospect  Le deal à scorer (doit avoir actionsCommerciales chargées)
     * @param  Collection  $regles    Règles prospect_fit + prospect_engagement de la société
     * @param  Collection  $secteursCibles  Noms des secteurs marqués est_cible=true
     */
    public function calculerScoresProspect(Prospect $prospect, Collection $regles, Collection $secteursCibles): array
    {
        // ── Mots-clés de détection du poste ──────────────────────────
        $poste = mb_strtolower(trim($prospect->poste_contact ?? ''));

        $estExecutif  = (bool) preg_match('/pdg|dg\b|ceo|président|présidente|directeur[\s\-]général|directrice[\s\-]générale|p\.?d\.?g/', $poste);
        $estDirecteur = !$estExecutif && (bool) preg_match('/directeur|directrice|\bdaf\b|\bdsi\b|\bdrh\b|\bvp\b|vice[\s\-]?président|vice[\s\-]?présidente/', $poste);
        $estManager   = !$estExecutif && !$estDirecteur && (bool) preg_match('/manager|chef\b|responsable|lead\b|coordinateur|superviseur|head\b/', $poste);

        // ── Actions commerciales ──────────────────────────────────────
        $actionsCount  = $prospect->actionsCommerciales ? $prospect->actionsCommerciales->count() : 0;
        $derniereAction = $prospect->actionsCommerciales && $prospect->actionsCommerciales->count()
            ? $prospect->actionsCommerciales->max('date_action')
            : null;

        $joursInactif = $derniereAction
            ? now()->diffInDays(\Carbon\Carbon::parse($derniereAction))
            : ($prospect->date_premier_contact
                ? now()->diffInDays($prospect->date_premier_contact)
                : 0); // nouveau deal sans historique → neutre, pas de pénalité

        // ── Secteur cible ──────────────────────────────────────────
        $secteurProspect = mb_strtolower(trim($prospect->secteur ?? ''));
        $estSecteurCible = $secteursCibles->contains(fn($s) => mb_strtolower(trim($s)) === $secteurProspect);

        // ── Valeur du deal ─────────────────────────────────────────
        $valeur = (float) ($prospect->valeur ?? 0);

        // Indexer les règles actives par critere pour accès O(1)
        $pts = fn(string $critere): int => (int) ($regles->where('critere', $critere)->first()?->points ?? 0);

        // ── FIT SCORE ────────────────────────────────────────────────
        $fit = 0;
        if ($estExecutif)                   $fit += $pts('poste_executif');
        elseif ($estDirecteur)              $fit += $pts('poste_directeur');
        elseif ($estManager)                $fit += $pts('poste_manager');

        if ($prospect->source === 'referral')           $fit += $pts('source_referral');
        elseif ($prospect->source === 'salon')          $fit += $pts('source_salon');
        elseif ($prospect->source === 'site_web')       $fit += $pts('source_site_web');
        elseif ($prospect->source === 'appel_froid')    $fit += $pts('source_appel_froid');

        if ($estSecteurCible)               $fit += $pts('secteur_cible');
        if ($valeur >= 50000)               $fit += $pts('valeur_haute');
        elseif ($valeur >= 10000)           $fit += $pts('valeur_moyenne');

        // ── ENGAGEMENT SCORE ─────────────────────────────────────────
        $engagement = 0;
        if ($prospect->statut === 'negociation')        $engagement += $pts('statut_negociation');
        elseif ($prospect->statut === 'proposition')    $engagement += $pts('statut_proposition');
        elseif ($prospect->statut === 'decouverte')     $engagement += $pts('statut_decouverte');

        if ($actionsCount >= 5)             $engagement += $pts('actions_cinq_plus');
        elseif ($actionsCount >= 2)         $engagement += $pts('actions_deux_quatre');
        elseif ($actionsCount === 1)        $engagement += $pts('actions_une');

        if ($prospect->prochain_rdv && $prospect->prochain_rdv->gte(today())) {
            $engagement += $pts('rdv_planifie');
        }

        if ($joursInactif <= 7)             $engagement += $pts('inactivite_faible');
        elseif ($joursInactif > 30)         $engagement += $pts('inactivite_elevee'); // peut être négatif

        return [
            'fit'        => max(0, min(100, $fit)),
            'engagement' => max(0, min(100, $engagement)),
        ];
    }

    /**
     * Recalcule et persiste les scores d'un prospect depuis sa société.
     * Charge les règles + secteurs cibles en une seule requête si non fournis.
     */
    public function recalculerEtSauvegarder(Prospect $prospect): void
    {
        if (!$prospect->relationLoaded('actionsCommerciales')) {
            $prospect->load('actionsCommerciales');
        }

        $societeId      = $prospect->societe_id;
        $regles         = RegleScoring::where('societe_id', $societeId)
            ->whereIn('contexte', [RegleScoring::CTX_PROSPECT_FIT, RegleScoring::CTX_PROSPECT_ENGAGEMENT])
            ->where('actif', true)
            ->get();
        $secteursCibles = SecteurActivite::where('societe_id', $societeId)
            ->where('est_cible', true)
            ->pluck('nom');

        $scores = $this->calculerScoresProspect($prospect, $regles, $secteursCibles);
        $prospect->updateQuietly(['score_fit' => $scores['fit'], 'score_engagement' => $scores['engagement']]);
    }

    /**
     * Recalcule les scores de tous les deals actifs d'une société.
     * Retourne le nombre de deals recalculés.
     */
    public function recalculerTousActifs(int $societeId): int
    {
        $actifStatuts   = ['decouverte', 'proposition', 'negociation'];
        $regles         = RegleScoring::where('societe_id', $societeId)
            ->whereIn('contexte', [RegleScoring::CTX_PROSPECT_FIT, RegleScoring::CTX_PROSPECT_ENGAGEMENT])
            ->where('actif', true)
            ->get();
        $secteursCibles = SecteurActivite::where('societe_id', $societeId)
            ->where('est_cible', true)
            ->pluck('nom');

        $count = 0;
        Prospect::where('societe_id', $societeId)
            ->whereIn('statut', $actifStatuts)
            ->with('actionsCommerciales')
            ->each(function (Prospect $p) use ($regles, $secteursCibles, &$count) {
                $scores = $this->calculerScoresProspect($p, $regles, $secteursCibles);
                $p->updateQuietly(['score_fit' => $scores['fit'], 'score_engagement' => $scores['engagement']]);
                $count++;
            });

        return $count;
    }

    /**
     * Calcule le score d'activité CRM d'un commercial sur une période.
     */
    public function calculerScoreCommercial(Collaborateur $collab, ?Carbon $debut = null, ?Carbon $fin = null): array
    {
        $query = ActionCommerciale::where('collaborateur_id', $collab->id);
        
        if ($debut && $fin) {
            $query->whereBetween('date_action', [$debut, $fin]);
        }
        
        $actions = $query->get();
        
        // Poids simple des actions (configurable idéalement)
        $poids = [
            'reunion' => 5,
            'appel' => 2,
            'email' => 1,
            'note' => 0.5,
            'relance' => 1
        ];
        
        $score = $actions->sum(fn($a) => $poids[$a->type] ?? 1);
        
        return [
            'score' => $score,
            'actions_count' => $actions->count(),
            'reunions' => $actions->where('type', 'reunion')->count(),
        ];
    }
}

