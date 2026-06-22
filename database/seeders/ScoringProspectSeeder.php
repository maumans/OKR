<?php

namespace Database\Seeders;

use App\Models\RegleScoring;
use App\Models\Societe;
use Illuminate\Database\Seeder;

class ScoringProspectSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Societe::all() as $societe) {
            self::seedForSociete($societe->id);
        }
    }

    public static function seedForSociete(int $societeId): void
    {
        foreach (RegleScoring::DEFAULTS as $contexte => $criteres) {
            foreach ($criteres as $critere => $points) {
                RegleScoring::firstOrCreate(
                    [
                        'societe_id' => $societeId,
                        'contexte'   => $contexte,
                        'critere'    => $critere,
                    ],
                    [
                        'points' => $points,
                        'actif'  => true,
                    ]
                );
            }
        }
    }
}
