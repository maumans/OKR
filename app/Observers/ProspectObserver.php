<?php

namespace App\Observers;

use App\Models\Prospect;
use App\Services\ConsolidationService;

class ProspectObserver
{
    /**
     * Quand un deal passe à "gagné" ou que son montant_final change,
     * recalcule les KRs crm_deals de la société.
     */
    public function updated(Prospect $prospect): void
    {
        $demandeSync = ($prospect->isDirty('statut') && $prospect->statut === 'gagne')
            || $prospect->isDirty('montant_final');

        if ($demandeSync) {
            app(ConsolidationService::class)->syncKrsParSociete($prospect->societe_id, 'crm_deals');
        }
    }
}
