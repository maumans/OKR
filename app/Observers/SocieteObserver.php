<?php

namespace App\Observers;

use App\Models\Societe;
use Database\Seeders\ScoringProspectSeeder;

class SocieteObserver
{
    public function created(Societe $societe): void
    {
        ScoringProspectSeeder::seedForSociete($societe->id);
    }

    public function updated(Societe $societe): void
    {
        // Enregistrer seulement les changements de statut
        if ($societe->wasChanged('statut')) {
            $ancien = $societe->getOriginal('statut');
            $nouveau = $societe->statut;

            $action = match($nouveau) {
                'suspendu' => 'societe.suspendre',
                'actif'    => 'societe.reactiver',
                default    => 'societe.modifier',
            };

            audit($action, "Statut de « {$societe->nom} » changé de « {$ancien} » à « {$nouveau} ».", [
                'societe_id' => $societe->id,
                'ancien'     => $ancien,
                'nouveau'    => $nouveau,
            ], $societe->id);
        }
    }

    public function deleted(Societe $societe): void
    {
        audit('societe.supprimer', "Société « {$societe->nom} » supprimée.", [
            'societe_id' => $societe->id,
        ]);
    }
}
