<?php

namespace App\Listeners;

use App\Events\TacheStatutChange;
use App\Services\HistoriqueService;

class LoggerChangementStatut
{
    public function __construct(
        private HistoriqueService $historiqueService
    ) {}

    public function handle(TacheStatutChange $event): void
    {
        $this->historiqueService->enregistrerAction(
            'tache.statut_change',
            $event->tache,
            [
                'ancien' => $event->ancienStatut,
                'nouveau' => $event->nouveauStatut,
                'titre' => $event->tache->titre
            ],
            $event->collaborateurId
        );
    }
}
