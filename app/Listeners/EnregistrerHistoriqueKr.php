<?php

namespace App\Listeners;

use App\Events\ProgressionKrMiseAJour;
use App\Services\HistoriqueService;
use App\Services\OkrService;

class EnregistrerHistoriqueKr
{
    public function __construct(
        private HistoriqueService $historiqueService,
        private OkrService $okrService
    ) {}

    public function handle(ProgressionKrMiseAJour $event): void
    {
        // 1. Enregistrer l'historique
        $this->historiqueService->enregistrerChangementKr(
            $event->resultatCle,
            $event->ancienneValeur,
            $event->nouvelleValeur,
            $event->justification,
            $event->collaborateurId
        );

        // 2. Recalculer l'objectif parent
        $objectif = $event->resultatCle->objectif;
        if ($objectif) {
            $this->okrService->recalculerStatutObjectif($objectif);
        }
    }
}
