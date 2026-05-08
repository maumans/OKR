<?php

namespace App\Listeners;

use App\Events\ProspectStatutChange;
use App\Services\HistoriqueService;
use Carbon\Carbon;

class LoggerConversionProspect
{
    public function __construct(
        private HistoriqueService $historiqueService
    ) {}

    public function handle(ProspectStatutChange $event): void
    {
        $prospect = $event->prospect;

        // 1. Mettre à jour les dates de conversion si nécessaire
        if ($event->nouveauStatut === 'gagne' && $prospect->date_conversion === null) {
            $prospect->update([
                'date_conversion' => Carbon::now(),
                'montant_final' => $prospect->valeur // Par défaut, on peut l'ajuster plus tard
            ]);
        }

        // 2. Loguer l'activité
        $this->historiqueService->enregistrerAction(
            'prospect.statut_change',
            $prospect,
            [
                'ancien' => $event->ancienStatut,
                'nouveau' => $event->nouveauStatut,
                'nom' => $prospect->nom
            ],
            $event->collaborateurId
        );
    }
}
