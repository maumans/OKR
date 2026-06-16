<?php

namespace App\Services;

use App\Models\FichePerformance;
use App\Models\Objectif;
use App\Models\ResultatCle;

class OkrPerformanceSyncService
{
    public function __construct(private OkrService $okrService) {}

    /**
     * Synchronise les scores Commercial et Delivery d'une fiche depuis les OKR.
     *
     * Commercial → tous les OKRs du collaborateur dont l'axe a categorie_performance = 'commercial'
     * Delivery   → tous les OKRs du collaborateur dont l'axe a categorie_performance = 'delivery'
     *
     * @return array{commercial: array|null, delivery: array|null}
     */
    public function syncFiche(FichePerformance $fiche): array
    {
        $collaborateurId = $fiche->collaborateur_id;
        $societeId       = $fiche->societe_id;
        $details         = [];

        foreach (['commercial', 'delivery'] as $dim) {
            // KRs dont ce collaborateur est responsable, dans un axe de cette dimension
            $krs = ResultatCle::where('responsable_id', $collaborateurId)
                ->whereHas('objectif', fn ($q) =>
                    $q->where('societe_id', $societeId)
                      ->whereHas('axeObjectif', fn ($q2) =>
                          $q2->where('categorie_performance', $dim)
                      )
                )
                ->get();

            if ($krs->isEmpty()) {
                $details[$dim] = null;
                continue;
            }

            $progression = round($krs->avg('progression'), 2);
            $score       = FichePerformance::normaliserScore($progression);

            $fiche->{"score_auto_{$dim}"} = $score;
            $fiche->{"score_{$dim}"}      = $score;

            $details[$dim] = [
                'kr_count'    => $krs->count(),
                'progression' => $progression,
                'score_auto'  => $score,
            ];
        }

        $fiche->okr_synced_at = now();
        $fiche->recalculerScoreGlobal();

        return $details;
    }
}
