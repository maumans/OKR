<?php

namespace App\Observers;

use App\Models\Livrable;
use App\Services\ConsolidationService;

class LivrableObserver
{
    public function updated(Livrable $livrable): void
    {
        if (! $livrable->isDirty('statut')) {
            return;
        }

        if (! in_array($livrable->statut, ['approved', 'archived'])) {
            return;
        }

        $responsableId = $livrable->responsable_id ?? $livrable->mission?->responsable_id;
        $societeId     = $livrable->mission?->societe_id;

        if (! $responsableId || ! $societeId) {
            return;
        }

        app(ConsolidationService::class)->syncKrsParCollaborateur(
            $responsableId,
            'missions_livrables',
            $societeId
        );
    }
}
