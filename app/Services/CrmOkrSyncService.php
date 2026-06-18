<?php

namespace App\Services;

use App\Models\ResultatCle;

/**
 * @deprecated Délègue maintenant à ConsolidationService.
 * Maintenu pour compatibilité avec ProspectObserver.
 */
class CrmOkrSyncService
{
    public function __construct(private ConsolidationService $consolidation) {}

    public function recalculerKr(ResultatCle $kr): void
    {
        $kr->load('objectif');
        $this->consolidation->recalculerKr($kr);
    }

    public function syncSociete(int $societeId): void
    {
        $this->consolidation->syncKrsParSociete($societeId, 'crm_deals');
    }
}
