<?php

namespace App\Services;

use App\Models\Collaborateur;
use App\Models\Objectif;
use App\Models\ScoreIndividuel;
use App\Models\TacheDaily;
use App\Models\ActionCommerciale;
use Carbon\Carbon;
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

