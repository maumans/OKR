<?php

namespace App\Services;

use App\Models\FichePerformance;
use App\Models\Objectif;
use App\Models\ResultatCle;

class OkrPerformanceSyncService
{
    public function __construct(private OkrService $okrService) {}

    /**
     * Synchronise les 4 dimensions de performance depuis les KRs OKR.
     *
     * commercial     → KRs du collaborateur dans un axe categorie_performance = 'commercial'
     * delivery       → KRs dans un axe categorie_performance = 'delivery'
     * developpement  → KRs dans un axe categorie_performance = 'developpement'
     * comportemental → KRs dans un axe categorie_performance = 'comportemental'
     *
     * Pour commercial/delivery : le score auto écrase le score (source authoritative).
     * Pour developpement/comportemental : le score auto est stocké mais ne remplace
     * le score manager que s'il est encore null (scores subjectifs, ne pas écraser).
     *
     * @return array<string, array|null>
     */
    public function syncFiche(FichePerformance $fiche): array
    {
        $collaborateurId = $fiche->collaborateur_id;
        $societeId       = $fiche->societe_id;
        $details         = [];

        foreach (['commercial', 'delivery', 'developpement', 'comportemental'] as $dim) {
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

            // Pour commercial/delivery : source authoritative → on écrase toujours.
            // Pour developpement/comportemental : on ne remplace que si le manager
            // n'a pas encore saisi de score (null).
            if (in_array($dim, ['commercial', 'delivery']) || $fiche->{"score_{$dim}"} === null) {
                $fiche->{"score_{$dim}"} = $score;
            }

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
