<?php

namespace Database\Seeders;

use App\Models\AxeObjectif;
use App\Models\ConfigurationOkr;
use App\Models\ConfigurationPrime;
use App\Models\Periode;
use App\Models\SeuilPerformance;
use App\Models\StatutObjectif;
use App\Models\TypeObjectif;
use App\Models\TypeResultatCle;
use Illuminate\Database\Seeder;

class DefaultOkrConfigSeeder extends Seeder
{
    /**
     * Crée la configuration OKR par défaut pour une société.
     * Appeler avec : (new DefaultOkrConfigSeeder)->seedForSociete($societeId)
     */
    public function run(): void
    {
        // À utiliser via seedForSociete()
    }

    public function seedForSociete(int $societeId): void
    {
        // ─── Axes stratégiques par défaut ────────────────────
        $axes = [
            ['nom' => 'Croissance', 'description' => 'Objectifs liés à la croissance du CA et des parts de marché', 'couleur' => '#10b981', 'ordre' => 1],
            ['nom' => 'Qualité', 'description' => 'Objectifs liés à la qualité des produits et services', 'couleur' => '#3b82f6', 'ordre' => 2],
            ['nom' => 'Finance', 'description' => 'Objectifs financiers et de rentabilité', 'couleur' => '#f59e0b', 'ordre' => 3],
            ['nom' => 'Équipe', 'description' => 'Objectifs RH, culture et développement des talents', 'couleur' => '#8b5cf6', 'ordre' => 4],
        ];
        foreach ($axes as $axe) {
            AxeObjectif::create(array_merge($axe, ['societe_id' => $societeId]));
        }

        // ─── Périodes par défaut (année en cours) ────────────
        $year = now()->year;
        $periodes = [
            ['nom' => "Q1 {$year}", 'date_debut' => "{$year}-01-01", 'date_fin' => "{$year}-03-31", 'type' => 'trimestriel'],
            ['nom' => "Q2 {$year}", 'date_debut' => "{$year}-04-01", 'date_fin' => "{$year}-06-30", 'type' => 'trimestriel'],
            ['nom' => "Q3 {$year}", 'date_debut' => "{$year}-07-01", 'date_fin' => "{$year}-09-30", 'type' => 'trimestriel'],
            ['nom' => "Q4 {$year}", 'date_debut' => "{$year}-10-01", 'date_fin' => "{$year}-12-31", 'type' => 'trimestriel'],
        ];
        foreach ($periodes as $periode) {
            Periode::create(array_merge($periode, ['societe_id' => $societeId]));
        }

        // ─── Types d'objectifs par défaut ────────────────────
        $types = [
            ['nom' => 'Objectif individuel', 'description' => 'Objectif assigné à un collaborateur', 'niveau' => 'individuel'],
            ['nom' => 'Objectif équipe', 'description' => 'Objectif partagé par une équipe', 'niveau' => 'equipe'],
            ['nom' => 'Objectif entreprise', 'description' => 'Objectif stratégique de l\'entreprise', 'niveau' => 'entreprise'],
        ];
        foreach ($types as $type) {
            TypeObjectif::create(array_merge($type, ['societe_id' => $societeId]));
        }

        // ─── Types de résultats clés par défaut ──────────────
        $typesKR = [
            ['nom' => 'Quantitatif', 'type_valeur' => 'number', 'unite' => 'unités'],
            ['nom' => 'Pourcentage', 'type_valeur' => 'percent', 'unite' => '%'],
            ['nom' => 'Booléen', 'type_valeur' => 'boolean', 'unite' => null],
            ['nom' => 'Financier', 'type_valeur' => 'currency', 'unite' => 'GNF'],
        ];
        foreach ($typesKR as $tkr) {
            TypeResultatCle::create(array_merge($tkr, ['societe_id' => $societeId]));
        }

        // ─── Statuts par défaut ──────────────────────────────
        $statuts = [
            ['nom' => 'Brouillon', 'couleur' => '#9ca3af', 'ordre' => 1, 'est_final' => false],
            ['nom' => 'Actif', 'couleur' => '#3b82f6', 'ordre' => 2, 'est_final' => false],
            ['nom' => 'En pause', 'couleur' => '#f59e0b', 'ordre' => 3, 'est_final' => false],
            ['nom' => 'Terminé', 'couleur' => '#10b981', 'ordre' => 4, 'est_final' => true],
            ['nom' => 'Abandonné', 'couleur' => '#ef4444', 'ordre' => 5, 'est_final' => true],
        ];
        foreach ($statuts as $statut) {
            StatutObjectif::create(array_merge($statut, ['societe_id' => $societeId]));
        }

        // ─── Seuils de performance par défaut ────────────────
        $seuils = [
            ['nom' => 'Critique', 'couleur' => '#ef4444', 'seuil_min' => 0, 'seuil_max' => 30, 'ordre' => 1],
            ['nom' => 'En retard', 'couleur' => '#f97316', 'seuil_min' => 30, 'seuil_max' => 50, 'ordre' => 2],
            ['nom' => 'En bonne voie', 'couleur' => '#f59e0b', 'seuil_min' => 50, 'seuil_max' => 70, 'ordre' => 3],
            ['nom' => 'Bon', 'couleur' => '#22c55e', 'seuil_min' => 70, 'seuil_max' => 90, 'ordre' => 4],
            ['nom' => 'Excellent', 'couleur' => '#10b981', 'seuil_min' => 90, 'seuil_max' => 100, 'ordre' => 5],
        ];
        foreach ($seuils as $seuil) {
            SeuilPerformance::create(array_merge($seuil, ['societe_id' => $societeId]));
        }

        // ─── Configuration OKR par défaut ────────────────────
        ConfigurationOkr::create([
            'societe_id' => $societeId,
            'mode_calcul' => 'moyenne',
            'frequence_update' => 'hebdomadaire',
            'rappel_automatique' => true,
            'visibilite_defaut' => 'equipe',
        ]);

        // ─── Configuration primes par défaut ─────────────────
        ConfigurationPrime::create([
            'societe_id' => $societeId,
            'actif' => false,
            'montant_max' => null,
            'seuil_minimum' => 70,
            'mode_calcul' => 'proportionnel',
        ]);
    }
}
