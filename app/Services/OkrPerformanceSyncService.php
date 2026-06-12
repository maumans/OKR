<?php

namespace App\Services;

use App\Models\FichePerformance;
use App\Models\Objectif;

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
            $objectifs = Objectif::with('resultatsCles')
                ->where('collaborateur_id', $collaborateurId)
                ->where('societe_id', $societeId)
                ->whereHas('axeObjectif', fn ($q) =>
                    $q->where('categorie_performance', $dim)
                )
                ->get();

            if ($objectifs->isEmpty()) {
                $details[$dim] = null;
                continue;
            }

            // Moyenne des progressions de chaque OKR (pondérée par ses KRs)
            $progressions = $objectifs->map(fn ($o) =>
                $this->okrService->calculerProgressionObjectif($o)
            );

            $progression = round($progressions->avg(), 2);
            $score       = FichePerformance::normaliserScore($progression);

            $fiche->{"score_auto_{$dim}"} = $score;
            $fiche->{"score_{$dim}"}      = $score;

            $details[$dim] = [
                'objectif_count' => $objectifs->count(),
                'kr_count'       => $objectifs->sum(fn ($o) => $o->resultatsCles->count()),
                'progression'    => $progression,
                'score_auto'     => $score,
            ];
        }

        $fiche->okr_synced_at = now();
        $fiche->recalculerScoreGlobal();

        return $details;
    }
}
