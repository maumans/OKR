<?php

namespace App\Services;

use App\Models\Prospect;
use App\Models\ActionCommerciale;

class ProspectionService
{
    /**
     * Calcule le taux de conversion du pipeline.
     */
    public function calculerTauxConversion(int $societeId): array
    {
        $prospects = Prospect::where('societe_id', $societeId)->get();
        $total = $prospects->count();
        
        if ($total === 0) {
            return ['taux_conversion' => 0, 'cycle_vente_moyen' => 0, 'total' => 0, 'gagnes' => 0, 'perdus' => 0, 'en_cours' => 0];
        }

        $gagnes = $prospects->where('statut', 'gagne')->count();
        $perdus = $prospects->where('statut', 'perdu')->count();
        $enCours = $total - $gagnes - $perdus;
        
        // Calcul du cycle de vente moyen (jours entre création et conversion)
        $cycleVenteMoyen = 0;
        $prospectsConverti = $prospects->where('statut', 'gagne')->filter(fn($p) => $p->date_conversion !== null);
        if ($prospectsConverti->count() > 0) {
            $totalJours = $prospectsConverti->sum(function ($p) {
                return $p->created_at->diffInDays($p->date_conversion);
            });
            $cycleVenteMoyen = round($totalJours / $prospectsConverti->count());
        }
        
        return [
            'taux_conversion' => round(($gagnes / $total) * 100, 1),
            'cycle_vente_moyen' => $cycleVenteMoyen,
            'total' => $total,
            'gagnes' => $gagnes,
            'perdus' => $perdus,
            'en_cours' => $enCours,
        ];
    }

    /**
     * Récupère la valeur totale du pipeline actif.
     */
    public function getValeurPipeline(int $societeId): float
    {
        return Prospect::where('societe_id', $societeId)
            ->whereIn('statut', ['contacte', 'qualifie', 'proposition', 'negocie'])
            ->sum('valeur');
    }

    /**
     * Obtient les statistiques d'un commercial spécifique.
     */
    public function getStatistiquesCommerciales(int $collabId): array
    {
        $prospects = Prospect::where('collaborateur_id', $collabId)->get();
        $total = $prospects->count();
        $gagnes = $prospects->where('statut', 'gagne')->count();
        
        return [
            'prospects_assignes' => $total,
            'taux_conversion' => $total > 0 ? round(($gagnes / $total) * 100, 1) : 0,
            'valeur_gagne' => $prospects->where('statut', 'gagne')->sum('montant_final'),
            'actions_effectuees' => ActionCommerciale::where('collaborateur_id', $collabId)->count()
        ];
    }
}
