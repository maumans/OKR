<?php

namespace App\Services;

use App\Models\ConfigurationPrime;
use App\Models\FichePerformance;
use App\Models\Mission;

class PrimeService
{
    /**
     * Calcule la prime estimée pour une fiche de performance.
     *
     * Retourne null si les primes ne sont pas configurées ou activées.
     * Retourne un tableau avec :
     *   - montant_brut      : prime avant malus NPS
     *   - montant_net       : prime après malus NPS (= montant affiché)
     *   - malus_nps         : bool — si un malus NPS s'applique
     *   - mode_calcul       : 'proportionnel' | 'palier' | 'fixe'
     *   - score_pct         : pourcentage du score (0-100)
     *   - seuil_atteint     : bool — score >= seuil_minimum
     */
    public function calculerPrime(FichePerformance $fiche): ?array
    {
        $config = ConfigurationPrime::where('societe_id', $fiche->societe_id)
            ->with('paliers')
            ->first();

        if (! $config || ! $config->actif) {
            return null;
        }

        // Score de référence : si l'évaluation finale est clôturée, utilise le score figé
        $scoreGlobal = $fiche->final_done
            ? ($fiche->final_score_global ?? $fiche->score_global)
            : $fiche->score_global;

        if ($scoreGlobal === null) {
            return null;
        }

        $scorePct = ($scoreGlobal / 5) * 100;
        $montantMax = (float) $config->montant_max;
        $seuilMin = (float) $config->seuil_minimum;

        // Seuil minimum non atteint → pas de prime
        if ($scorePct < $seuilMin) {
            return [
                'montant_brut'  => 0,
                'montant_net'   => 0,
                'malus_nps'     => false,
                'mode_calcul'   => $config->mode_calcul,
                'score_pct'     => round($scorePct, 1),
                'seuil_atteint' => false,
            ];
        }

        $montantBrut = match ($config->mode_calcul) {
            'palier'        => $this->calculerParPalier($config->paliers, $scorePct, $montantMax),
            'fixe'          => $montantMax,
            default         => round($montantMax * $scorePct / 100),
        };

        // Règle NPS : si au moins une mission du collaborateur dans la période a un NPS < 6 → malus -30%
        $malusNps = $this->verifierMalusNps($fiche);
        $montantNet = $malusNps ? round($montantBrut * 0.70) : $montantBrut;

        return [
            'montant_brut'  => $montantBrut,
            'montant_net'   => $montantNet,
            'malus_nps'     => $malusNps,
            'mode_calcul'   => $config->mode_calcul,
            'score_pct'     => round($scorePct, 1),
            'seuil_atteint' => true,
        ];
    }

    private function calculerParPalier($paliers, float $scorePct, float $montantMax): float
    {
        foreach ($paliers as $palier) {
            if ($scorePct >= (float) $palier->seuil_min && $scorePct <= (float) $palier->seuil_max) {
                return round($montantMax * ((float) $palier->pourcentage_prime / 100));
            }
        }
        // Aucun palier trouvé → proportionnel par défaut
        return round($montantMax * $scorePct / 100);
    }

    private function verifierMalusNps(FichePerformance $fiche): bool
    {
        if (! $fiche->collaborateur_id) {
            return false;
        }

        // Fenêtre temporelle : année du cycle (ex. "Q2 2026" → 2026)
        $annee = null;
        if ($fiche->periode_debut) {
            $annee = $fiche->periode_debut->year;
        } elseif (preg_match('/(\d{4})/', $fiche->cycle ?? '', $m)) {
            $annee = (int) $m[1];
        }

        $query = Mission::where('societe_id', $fiche->societe_id)
            ->where('responsable_id', $fiche->collaborateur_id)
            ->whereNotNull('nps_score')
            ->where('nps_score', '<', 6);

        if ($annee) {
            $query->whereYear('created_at', $annee);
        }

        return $query->exists();
    }
}
