<?php

namespace Database\Seeders;

use App\Models\Collaborateur;
use App\Models\PrimeMensuelle;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PrimeMensuelleSeeder extends Seeder
{
    public function run(): void
    {
        $collaborateurs = Collaborateur::with('societe')->get();
        $adminUser = User::where('email', 'admin@addvalis.com')->first();

        // 3 mois : mois en cours + 2 précédents
        $mois = [
            Carbon::now()->startOfMonth(),
            Carbon::now()->subMonths(1)->startOfMonth(),
            Carbon::now()->subMonths(2)->startOfMonth(),
        ];

        foreach ($collaborateurs as $collab) {
            foreach ($mois as $moisDate) {
                // 60% validées, 40% non validées
                $validee = (rand(1, 10) <= 6);
                $montantMax = rand(200_000, 800_000);
                $scoreGlobal = round(rand(30, 100), 2);
                $seuil = 80;
                $primeAcquise = $scoreGlobal >= $seuil;

                PrimeMensuelle::updateOrCreate(
                    [
                        'societe_id'       => $collab->societe_id,
                        'collaborateur_id' => $collab->id,
                        'mois'             => $moisDate->format('Y-m-d'),
                    ],
                    [
                        'montant_max'         => $montantMax,
                        'seuil_pourcentage'   => $seuil,
                        'score_global'        => $validee ? $scoreGlobal : null,
                        'montant_accorde'     => $validee ? ($primeAcquise ? $montantMax : 0) : null,
                        'validee'             => $validee,
                        'commentaire_manager' => $validee
                            ? ($primeAcquise ? 'Excellent travail ce mois-ci !' : 'Objectifs non atteints pour ce mois.')
                            : null,
                        'validee_par_user_id' => $validee ? $adminUser?->id : null,
                        'validee_le'          => $validee ? now() : null,
                    ]
                );
            }
        }
    }
}
