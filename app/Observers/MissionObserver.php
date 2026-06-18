<?php

namespace App\Observers;

use App\Models\Mission;
use App\Services\ConsolidationService;

class MissionObserver
{
    public function updated(Mission $mission): void
    {
        if (! $mission->isDirty('nps_score') || $mission->nps_score === null) {
            return;
        }

        if (! $mission->responsable_id || ! $mission->societe_id) {
            return;
        }

        app(ConsolidationService::class)->syncKrsParCollaborateur(
            $mission->responsable_id,
            'missions_nps',
            $mission->societe_id
        );
    }
}
