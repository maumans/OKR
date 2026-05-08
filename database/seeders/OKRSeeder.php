<?php

namespace Database\Seeders;

use App\Models\AxeObjectif;
use App\Models\Collaborateur;
use App\Models\Objectif;
use App\Models\Periode;
use App\Models\ResultatCle;
use App\Models\Societe;
use App\Models\TypeResultatCle;
use Illuminate\Database\Seeder;

class OKRSeeder extends Seeder
{
    public function run(): void
    {
        $societe = Societe::first();
        $collaborateurs = Collaborateur::where('societe_id', $societe->id)->get();

        // Récupérer les données paramétrables
        $axeCroissance = AxeObjectif::where('societe_id', $societe->id)->where('nom', 'Croissance')->first();
        $axeQualite = AxeObjectif::where('societe_id', $societe->id)->where('nom', 'Qualité')->first();
        $axeEquipe = AxeObjectif::where('societe_id', $societe->id)->where('nom', 'Équipe')->first();
        $periode = Periode::where('societe_id', $societe->id)->where('statut', 'actif')->first();
        $typeQuantitatif = TypeResultatCle::where('societe_id', $societe->id)->where('type_valeur', 'number')->first();
        $typePourcent = TypeResultatCle::where('societe_id', $societe->id)->where('type_valeur', 'percent')->first();
        $typeCurrency = TypeResultatCle::where('societe_id', $societe->id)->where('type_valeur', 'currency')->first();

        $objectifsData = [
            [
                'collaborateur' => $collaborateurs[0], // Admin
                'titre' => 'Augmenter le chiffre d\'affaires de 30%',
                'axe_objectif_id' => $axeCroissance?->id,
                'periode_id' => $periode?->id,
                'axe' => 'Croissance',
                'periode' => $periode?->nom ?? 'Q2-2026',
                'prime' => 500000,
                'statut' => 'actif',
                'resultats' => [
                    ['description' => 'Signer 5 nouveaux contrats', 'progression' => 60, 'poids' => 40, 'valeur_cible' => 5, 'type_id' => $typeQuantitatif?->id, 'unite' => 'contrats'],
                    ['description' => 'Atteindre 150M GNF de CA mensuel', 'progression' => 45, 'poids' => 40, 'valeur_cible' => 150000000, 'type_id' => $typeCurrency?->id, 'unite' => 'GNF'],
                    ['description' => 'Réduire le churn client à < 5%', 'progression' => 80, 'poids' => 20, 'valeur_cible' => 5, 'type_id' => $typePourcent?->id, 'unite' => '%'],
                ],
            ],
            [
                'collaborateur' => $collaborateurs[1], // Manager
                'titre' => 'Structurer l\'équipe commerciale',
                'axe_objectif_id' => $axeEquipe?->id,
                'periode_id' => $periode?->id,
                'axe' => 'Équipe',
                'periode' => $periode?->nom ?? 'Q2-2026',
                'prime' => 300000,
                'statut' => 'actif',
                'resultats' => [
                    ['description' => 'Recruter 2 commerciaux', 'progression' => 50, 'poids' => 30, 'valeur_cible' => 2, 'type_id' => $typeQuantitatif?->id, 'unite' => 'personnes'],
                    ['description' => 'Former l\'équipe au nouveau CRM', 'progression' => 75, 'poids' => 30, 'valeur_cible' => 100, 'type_id' => $typePourcent?->id, 'unite' => '%'],
                    ['description' => 'Mettre en place un daily standup', 'progression' => 100, 'poids' => 40, 'valeur_cible' => 1, 'type_id' => $typeQuantitatif?->id, 'unite' => null],
                ],
            ],
            [
                'collaborateur' => $collaborateurs[2], // Amadou
                'titre' => 'Livrer la plateforme OKR v1',
                'axe_objectif_id' => $axeQualite?->id,
                'periode_id' => $periode?->id,
                'axe' => 'Qualité',
                'periode' => $periode?->nom ?? 'Q2-2026',
                'prime' => 400000,
                'statut' => 'actif',
                'resultats' => [
                    ['description' => 'Développer les 8 modules principaux', 'progression' => 30, 'poids' => 50, 'valeur_cible' => 8, 'type_id' => $typeQuantitatif?->id, 'unite' => 'modules'],
                    ['description' => 'Tests utilisateurs avec 3 entreprises pilotes', 'progression' => 10, 'poids' => 30, 'valeur_cible' => 3, 'type_id' => $typeQuantitatif?->id, 'unite' => 'entreprises'],
                    ['description' => 'Taux de bugs critiques < 1%', 'progression' => 65, 'poids' => 20, 'valeur_cible' => 1, 'type_id' => $typePourcent?->id, 'unite' => '%'],
                ],
            ],
        ];

        foreach ($objectifsData as $data) {
            $objectif = Objectif::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $data['collaborateur']->id,
                'titre' => $data['titre'],
                'axe' => $data['axe'],
                'axe_objectif_id' => $data['axe_objectif_id'],
                'periode' => $data['periode'],
                'periode_id' => $data['periode_id'],
                'prime' => $data['prime'],
                'statut' => $data['statut'],
                'visibilite' => 'equipe',
            ]);

            foreach ($data['resultats'] as $resultat) {
                ResultatCle::create([
                    'objectif_id' => $objectif->id,
                    'description' => $resultat['description'],
                    'progression' => $resultat['progression'],
                    'poids' => $resultat['poids'],
                    'valeur_cible' => $resultat['valeur_cible'],
                    'type_resultat_cle_id' => $resultat['type_id'],
                    'unite' => $resultat['unite'],
                ]);
            }
        }
    }
}
