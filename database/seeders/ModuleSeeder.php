<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Societe;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'code'        => 'dashboard',
                'nom'         => 'Tableau de bord',
                'description' => 'Vue d\'ensemble des indicateurs clés de performance.',
                'categorie'   => 'CORE',
                'est_core'    => true,
                'icone'       => 'LayoutDashboard',
                'couleur'     => '#3b82f6',
                'ordre'       => 0,
                'routes'      => ['dashboard'],
            ],
            [
                'code'        => 'okr',
                'nom'         => 'Objectifs (OKR)',
                'description' => 'Définissez et suivez vos objectifs stratégiques et résultats clés.',
                'categorie'   => 'MANAGEMENT',
                'icone'       => 'Target',
                'couleur'     => '#8b5cf6',
                'ordre'       => 10,
                'routes'      => ['objectifs.*', 'parametres.okr.*'],
            ],
            [
                'code'        => 'individuels',
                'nom'         => 'Individuels',
                'description' => 'Suivi des objectifs individuels mensuels par collaborateur.',
                'categorie'   => 'MANAGEMENT',
                'icone'       => 'User',
                'couleur'     => '#ec4899',
                'ordre'       => 20,
                'routes'      => ['individuels.*'],
                'dependances' => ['okr'],
            ],
            [
                'code'        => 'taches',
                'nom'         => 'Tâches (Kanban)',
                'description' => 'Gestion des tâches en vue Kanban avec drag & drop.',
                'categorie'   => 'MANAGEMENT',
                'icone'       => 'ListChecks',
                'couleur'     => '#10b981',
                'ordre'       => 30,
                'routes'      => ['taches.*'],
            ],
            [
                'code'        => 'daily',
                'nom'         => 'Bilan Daily',
                'description' => 'Bilans journaliers d\'activité et compteurs par collaborateur.',
                'categorie'   => 'MANAGEMENT',
                'icone'       => 'CalendarCheck',
                'couleur'     => '#f59e0b',
                'ordre'       => 40,
                'routes'      => ['daily.*'],
            ],
            [
                'code'        => 'performance',
                'nom'         => 'Performance',
                'description' => 'Fiches de performance, workflow de validation et cycles d\'évaluation annuels.',
                'categorie'   => 'MANAGEMENT',
                'icone'       => 'ClipboardCheck',
                'couleur'     => '#8b5cf6',
                'ordre'       => 45,
                'routes'      => ['performance.*'],
                'dependances' => ['okr'],
            ],
            [
                'code'        => 'matrice',
                'nom'         => 'Matrice Eisenhower',
                'description' => 'Priorisez vos tâches selon les quadrants Urgent/Important.',
                'categorie'   => 'MANAGEMENT',
                'icone'       => 'Grid3x3',
                'couleur'     => '#d946ef',
                'ordre'       => 50,
                'routes'      => ['matrice.*'],
                'dependances' => ['taches'],
            ],
            [
                'code'        => 'prospection',
                'nom'         => 'Prospection (CRM)',
                'description' => 'Pipeline CRM Kanban pour le suivi des prospects et opportunités.',
                'categorie'   => 'BUSINESS',
                'icone'       => 'TrendingUp',
                'couleur'     => '#06b6d4',
                'ordre'       => 60,
                'routes'      => ['prospects.*'],
            ],
            [
                'code'        => 'missions',
                'nom'         => 'Missions & Delivery',
                'description' => 'War Room pour le suivi des missions clients et livrables.',
                'categorie'   => 'BUSINESS',
                'icone'       => 'Briefcase',
                'couleur'     => '#0ea5e9',
                'ordre'       => 70,
                'routes'      => ['missions.*'],
            ],
            [
                'code'        => 'incentives',
                'nom'         => 'Primes & Incentives',
                'description' => 'Gestion des objectifs rémunérés et calcul automatique des primes.',
                'categorie'   => 'BUSINESS',
                'icone'       => 'Gift',
                'couleur'     => '#f43f5e',
                'ordre'       => 80,
                'routes'      => ['incentives.*'],
                'est_premium' => true,
            ],
            [
                'code'        => 'lms',
                'nom'         => 'Formations (LMS)',
                'description' => 'Plateforme d\'apprentissage pour les formations et modules pédagogiques.',
                'categorie'   => 'BUSINESS',
                'icone'       => 'GraduationCap',
                'couleur'     => '#a855f7',
                'ordre'       => 90,
                'routes'      => ['formations.*'],
                'est_premium' => true,
            ],
            [
                'code'        => 'reporting',
                'nom'         => 'Reporting & Analytique',
                'description' => 'Tableaux de bord analytiques et rapports avancés.',
                'categorie'   => 'ANALYTIQUE',
                'icone'       => 'BarChart3',
                'couleur'     => '#22c55e',
                'ordre'       => 100,
                'routes'      => ['syntheses.*'],
            ],
            [
                'code'        => 'equipe',
                'nom'         => 'Équipe / Collaborateurs',
                'description' => 'Gestion des collaborateurs, rôles et profils de la société.',
                'categorie'   => 'CORE',
                'est_core'    => true,
                'icone'       => 'Users',
                'couleur'     => '#64748b',
                'ordre'       => 110,
                'routes'      => ['collaborateurs.*'],
            ],
            [
                'code'        => 'parametres',
                'nom'         => 'Paramètres',
                'description' => 'Configuration de la société, de l\'OKR et des modules.',
                'categorie'   => 'CORE',
                'est_core'    => true,
                'icone'       => 'Settings',
                'couleur'     => '#64748b',
                'ordre'       => 120,
                'routes'      => ['parametres.*'],
            ],
            [
                'code'        => 'import',
                'nom'         => 'Import de données',
                'description' => 'Import Excel d\'objectifs, KRs et tâches en masse.',
                'categorie'   => 'ADMINISTRATION',
                'icone'       => 'Upload',
                'couleur'     => '#10b981',
                'ordre'       => 130,
                'routes'      => ['import.*'],
            ],
            [
                'code'        => 'synthese',
                'nom'         => 'Synthèse',
                'description' => 'Pilotage mensuel des primes : scores, validation manager, export CSV.',
                'categorie'   => 'MANAGEMENT',
                'icone'       => 'BarChart3',
                'couleur'     => '#7c3aed',
                'ordre'       => 85,
                'routes'      => ['synthese.*'],
                'est_premium' => false,
            ],
        ];

        foreach ($modules as $data) {
            Module::updateOrCreate(
                ['code' => $data['code']],
                array_merge([
                    'est_core'    => false,
                    'est_premium' => false,
                    'actif'       => true,
                    'routes'      => null,
                    'dependances' => null,
                    'description' => null,
                ], $data)
            );
        }

        // Synchronise les modules manquants sur les sociétés existantes
        // Un module absent de societe_module est invisible même s'il existe dans modules
        if (!Schema::hasTable('societe_module') || !Schema::hasTable('societes')) {
            return;
        }

        $allModules = Module::where('actif', true)->get();
        $societes   = Societe::all();
        $now        = now();

        foreach ($societes as $societe) {
            $modulesActifs = $societe->modules()->pluck('modules.id')->toArray();
            foreach ($allModules as $module) {
                if (!in_array($module->id, $modulesActifs)) {
                    $societe->modules()->attach($module->id, [
                        'actif'               => $module->est_core,
                        'active_le'           => $module->est_core ? $now : null,
                        'desactive_le'        => null,
                        'active_par_user_id'  => null,
                        'parametres'          => null,
                        'created_at'          => $now,
                        'updated_at'          => $now,
                    ]);
                }
            }
        }
    }
}
