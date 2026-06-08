<?php

namespace Database\Seeders;

use App\Models\Collaborateur;
use App\Models\FichePerformance;
use App\Models\HistoriqueWorkflowPerformance;
use App\Models\Societe;
use App\Models\User;
use Illuminate\Database\Seeder;

class PerformanceSeeder extends Seeder
{
    public function run(): void
    {
        $societe = Societe::first();
        if (!$societe) {
            return;
        }

        // Récupère le premier utilisateur admin (pour les logs workflow)
        $adminUser = User::where('email', 'admin@addvalis.com')->first()
            ?? User::first();

        if (!$adminUser) {
            return;
        }

        $collaborateurs = Collaborateur::where('societe_id', $societe->id)
            ->where('actif', true)
            ->orderBy('id')
            ->get();

        if ($collaborateurs->isEmpty()) {
            return;
        }

        $manager = $collaborateurs->first();

        // Mise à jour des champs grade/practice sur les collaborateurs de démo
        $practiceData = [
            0 => ['grade' => 'Manager',             'practice' => 'Intégration'],
            1 => ['grade' => 'Manager',             'practice' => 'Dev & IA'],
            2 => ['grade' => 'Manager',             'practice' => 'GED & MPS'],
            3 => ['grade' => 'Consultant Senior',   'practice' => 'Intégration'],
            4 => ['grade' => 'Développeur',         'practice' => 'Dev & IA'],
        ];

        foreach ($collaborateurs->take(5) as $index => $collab) {
            if (isset($practiceData[$index])) {
                $collab->update($practiceData[$index]);
            }
        }

        // Fiches de démo pour le cycle "Q3 2026" — données alignées avec la maquette Laawol
        $fichesData = [
            [
                'index'                => 0,
                'statut'               => 'confirme',
                'score_commercial'     => 1.0,
                'score_delivery'       => 4.0,
                'score_developpement'  => 3.0,
                'score_comportemental' => 4.0,
                // score_global = 1×0.50 + 4×0.25 + 3×0.15 + 4×0.10 = 2.35 → 2.4
            ],
            [
                'index'                => 1,
                'statut'               => 'confirme',
                'score_commercial'     => 2.0,
                'score_delivery'       => 4.0,
                'score_developpement'  => 3.0,
                'score_comportemental' => 5.0,
                // score_global = 2×0.50 + 4×0.25 + 3×0.15 + 5×0.10 = 1.0+1.0+0.45+0.5 = 2.95 → 3.0
            ],
            [
                'index'                => 2,
                'statut'               => 'confirme',
                'score_commercial'     => 1.0,
                'score_delivery'       => 4.0,
                'score_developpement'  => 4.0,
                'score_comportemental' => 3.0,
                // score_global = 1×0.50 + 4×0.25 + 4×0.15 + 3×0.10 = 0.5+1.0+0.6+0.3 = 2.4
            ],
            [
                'index'                => 3,
                'statut'               => 'brouillon',
                'score_commercial'     => 3.0,
                'score_delivery'       => 3.0,
                'score_developpement'  => 3.0,
                'score_comportemental' => 3.0,
                // score_global = 3.0
            ],
            // Le 5e collaborateur (index 4) n'a pas de fiche → affiche "Créer la fiche"
        ];

        foreach ($fichesData as $data) {
            $collab = $collaborateurs->get($data['index']);
            if (!$collab) {
                continue;
            }

            // Éviter les doublons si le seeder est rejoué
            $fiche = FichePerformance::firstOrCreate(
                ['collaborateur_id' => $collab->id, 'cycle' => 'Q3 2026'],
                [
                    'societe_id'           => $societe->id,
                    'manager_id'           => $manager->id,
                    'type_cycle'           => 'trimestriel',
                    'periode_debut'        => '2026-07-01',
                    'periode_fin'          => '2026-09-30',
                    'statut'               => $data['statut'],
                    'score_commercial'     => $data['score_commercial'],
                    'poids_commercial'     => 0.50,
                    'score_delivery'       => $data['score_delivery'],
                    'poids_delivery'       => 0.25,
                    'score_developpement'  => $data['score_developpement'],
                    'poids_developpement'  => 0.15,
                    'score_comportemental' => $data['score_comportemental'],
                    'poids_comportemental' => 0.10,
                ]
            );

            // Calcule et persiste le score global
            $fiche->recalculerScoreGlobal();

            // Historique workflow minimal
            if (!$fiche->historiqueWorkflow()->exists()) {
                HistoriqueWorkflowPerformance::create([
                    'fiche_performance_id' => $fiche->id,
                    'de_statut'            => null,
                    'vers_statut'          => 'brouillon',
                    'user_id'              => $adminUser->id,
                    'commentaire'          => 'Fiche créée',
                ]);

                if ($data['statut'] === 'confirme') {
                    HistoriqueWorkflowPerformance::create([
                        'fiche_performance_id' => $fiche->id,
                        'de_statut'            => 'brouillon',
                        'vers_statut'          => 'en_revision',
                        'user_id'              => $adminUser->id,
                        'commentaire'          => 'Envoyé pour révision',
                    ]);
                    HistoriqueWorkflowPerformance::create([
                        'fiche_performance_id' => $fiche->id,
                        'de_statut'            => 'en_revision',
                        'vers_statut'          => 'attente_drh',
                        'user_id'              => $adminUser->id,
                        'commentaire'          => 'Soumis à la DRH',
                    ]);
                    HistoriqueWorkflowPerformance::create([
                        'fiche_performance_id' => $fiche->id,
                        'de_statut'            => 'attente_drh',
                        'vers_statut'          => 'confirme',
                        'user_id'              => $adminUser->id,
                        'commentaire'          => 'Fiche confirmée',
                    ]);

                    $fiche->update([
                        'validated_at'     => now(),
                        'validated_by_id'  => $adminUser->id,
                    ]);
                }
            }
        }
    }
}
