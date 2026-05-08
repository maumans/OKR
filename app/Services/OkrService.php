<?php

namespace App\Services;

use App\Models\Objectif;
use App\Models\ConfigurationOkr;

class OkrService
{
    /**
     * Calcule la progression globale d'un objectif en fonction des paramètres de la société.
     * Supporte les modes: pourcentage (défaut), boolean (0 ou 100), milestone (étapes discrètes).
     */
    public function calculerProgressionObjectif(Objectif $objectif): float
    {
        $resultats = $objectif->resultatsCles;

        if ($resultats->isEmpty()) {
            return 0;
        }

        $config = ConfigurationOkr::where('societe_id', $objectif->societe_id)->first();
        $mode = $config?->mode_calcul ?? 'moyenne';

        // Calculer la progression effective de chaque KR selon son mode_calcul
        $progressions = $resultats->map(function ($r) {
            return [
                'progression' => $this->calculerProgressionKr($r),
                'poids' => $r->poids ?? 1,
            ];
        });

        if ($mode === 'pondere') {
            $totalPoids = $progressions->sum('poids');
            if ($totalPoids <= 0) {
                return round($progressions->avg('progression'), 2);
            }
            $somme = $progressions->sum(fn ($p) => $p['progression'] * $p['poids']);
            return round($somme / $totalPoids, 2);
        }

        return round($progressions->avg('progression'), 2);
    }

    /**
     * Calcule la progression d'un KR selon son mode_calcul.
     * - pourcentage : utilise la valeur progression directement
     * - boolean : 0% ou 100%
     * - milestone : % = (étapes atteintes / total étapes) * 100
     */
    public function calculerProgressionKr(\App\Models\ResultatCle $kr): float
    {
        return match ($kr->mode_calcul ?? 'pourcentage') {
            'boolean' => (float) $kr->progression >= 100 ? 100 : 0,
            'milestone' => $this->calculerProgressionMilestone($kr),
            default => (float) $kr->progression,
        };
    }

    /**
     * Calcule la progression d'un KR milestone (étapes discrètes).
     */
    private function calculerProgressionMilestone(\App\Models\ResultatCle $kr): float
    {
        $milestones = $kr->milestones;
        if (empty($milestones) || !is_array($milestones)) {
            return (float) $kr->progression;
        }

        $total = count($milestones);
        $atteints = collect($milestones)->where('atteint', true)->count();

        return $total > 0 ? round(($atteints / $total) * 100, 2) : 0;
    }

    /**
     * Vérifie et met à jour le statut de l'objectif selon sa progression.
     */
    public function recalculerStatutObjectif(Objectif $objectif): void
    {
        $progression = $this->calculerProgressionObjectif($objectif);
        
        if ($progression >= 100 && $objectif->statut !== 'termine') {
            $objectif->update(['statut' => 'termine']);
        } elseif ($progression < 100 && $objectif->statut === 'termine') {
            $objectif->update(['statut' => 'actif']);
        }
    }

    /**
     * Calcule la progression globale de la société pour une période donnée.
     */
    public function calculerProgressionGlobale(int $societeId, ?int $periodeId = null): float
    {
        $objectifs = Objectif::where('societe_id', $societeId)
            ->where('statut', 'actif')
            ->when($periodeId, fn($q) => $q->where('periode_id', $periodeId))
            ->get();

        if ($objectifs->isEmpty()) {
            return 0;
        }

        return round($objectifs->avg(fn ($o) => $this->calculerProgressionObjectif($o)), 1);
    }
}
