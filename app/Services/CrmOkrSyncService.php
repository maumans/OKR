<?php

namespace App\Services;

use App\Models\Prospect;
use App\Models\ResultatCle;
use Illuminate\Support\Facades\DB;

class CrmOkrSyncService
{
    /**
     * Recalcule la valeur_actuelle et la progression d'un KR lié au CRM.
     */
    public function recalculerKr(ResultatCle $kr): void
    {
        if (! $kr->source_crm) {
            return;
        }

        $filtre  = $kr->source_crm_filtre ?? [];
        $societeId = $kr->objectif?->societe_id;

        if (! $societeId) {
            return;
        }

        $query = Prospect::where('societe_id', $societeId)
            ->where('statut', 'gagne')
            ->whereNotNull('montant_final');

        // Filtre par type de deal
        if (!empty($filtre['type_deal'])) {
            $query->where('type_deal', $filtre['type_deal']);
        }

        // Filtre par collaborateur(s)
        if (!empty($filtre['collaborateur_ids']) && is_array($filtre['collaborateur_ids'])) {
            $query->whereIn('collaborateur_id', $filtre['collaborateur_ids']);
        }

        // Filtre par période (dates du deal)
        if (!empty($filtre['date_debut'])) {
            $query->where('date_conversion', '>=', $filtre['date_debut']);
        }
        if (!empty($filtre['date_fin'])) {
            $query->where('date_conversion', '<=', $filtre['date_fin']);
        }

        $total = (float) $query->sum('montant_final');

        $cible = (float) ($kr->valeur_cible ?? 0);
        $progression = $cible > 0 ? min(100, round(($total / $cible) * 100, 2)) : 0;

        $kr->valeur_actuelle = $total;
        $kr->progression     = $progression;
        $kr->saveQuietly();
    }

    /**
     * Synchronise tous les KR liés au CRM pour une société donnée.
     * Appelé automatiquement quand un deal passe à "gagné".
     */
    public function syncSociete(int $societeId): void
    {
        ResultatCle::whereHas('objectif', fn ($q) => $q->where('societe_id', $societeId))
            ->where('source_crm', true)
            ->with('objectif')
            ->get()
            ->each(fn (ResultatCle $kr) => $this->recalculerKr($kr));
    }
}
