<?php

namespace Database\Seeders;

use App\Models\Societe;
use Illuminate\Database\Seeder;

class ParametreOKRSeeder extends Seeder
{
    /**
     * Seed les paramètres OKR par défaut pour chaque société.
     * Délègue au DefaultOkrConfigSeeder qui contient toute la logique.
     */
    public function run(): void
    {
        $societes = Societe::all();

        foreach ($societes as $societe) {
            (new DefaultOkrConfigSeeder)->seedForSociete($societe->id);
        }
    }
}
