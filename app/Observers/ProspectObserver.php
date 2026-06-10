<?php

namespace App\Observers;

use App\Models\Prospect;
use App\Services\CrmOkrSyncService;

class ProspectObserver
{
    public function __construct(private CrmOkrSyncService $crmOkrSyncService) {}

    /**
     * Quand un deal passe à "gagné", recalcule tous les KR CRM de la société.
     */
    public function updated(Prospect $prospect): void
    {
        if ($prospect->isDirty('statut') && $prospect->statut === 'gagne') {
            $this->crmOkrSyncService->syncSociete($prospect->societe_id);
        }
    }
}
