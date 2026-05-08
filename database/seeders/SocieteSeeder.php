<?php

namespace Database\Seeders;

use App\Models\Societe;
use Illuminate\Database\Seeder;

class SocieteSeeder extends Seeder
{
    public function run(): void
    {
        Societe::withoutEvents(function () {
            Societe::create([
                'nom' => 'Addvalis',
                'email' => 'contact@addvalis.com',
                'telephone' => '+224 621 000 000',
                'couleur_primaire' => '#00c9ff',
                'couleur_secondaire' => '#FEAC00',
                'mode_sombre' => true,
            ]);
        });
    }
}
