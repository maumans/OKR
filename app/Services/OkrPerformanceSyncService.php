<?php

namespace App\Services;

use App\Models\FichePerformance;
use App\Models\Objectif;

class OkrPerformanceSyncService
{
    public function __construct(private OkrService $okrService) {}

    /**
     * Synchronise les scores Commercial et Delivery d'une fiche depuis les OKR liés.
     * Retourne un tableau de détails par dimension pour affichage frontend.
     */
    public function syncFiche(FichePerformance $fiche): array
    {
        $details = [];

        foreach (['commercial', 'delivery'] as $dim) {
            $okrIdKey = "objectif_okr_id_{$dim}";
            $scoreAutoKey = "score_auto_{$dim}";
            $scoreKey = "score_{$dim}";

            $okrId = $fiche->$okrIdKey;
            if (! $okrId) {
                $details[$dim] = null;
                continue;
            }

            $objectif = Objectif::with('resultatsCles')->find($okrId);
            if (! $objectif) {
                $details[$dim] = null;
                continue;
            }

            $progression = $this->okrService->calculerProgressionObjectif($objectif);
            $score = FichePerformance::normaliserScore($progression);

            $fiche->$scoreAutoKey = $score;
            $fiche->$scoreKey     = $score;

            $details[$dim] = [
                'objectif_titre' => $objectif->titre,
                'progression'    => $progression,
                'score_auto'     => $score,
            ];
        }

        $fiche->recalculerScoreGlobal();

        return $details;
    }
}
