<?php

namespace Database\Seeders;

use App\Models\Collaborateur;
use App\Models\Objectif;
use App\Models\ResultatCle;
use App\Models\Societe;
use App\Models\Tache;
use Illuminate\Database\Seeder;

class TacheSeeder extends Seeder
{
    public function run(): void
    {
        $societe = Societe::first();
        $collaborateurs = Collaborateur::where('societe_id', $societe->id)->get();

        // Récupérer les objectifs et leurs KRs pour lier les tâches
        $objectifs = Objectif::where('societe_id', $societe->id)->with('resultatsCles')->get();

        if ($objectifs->isEmpty()) {
            return;
        }

        // ── Tâches liées aux KRs du premier objectif (CA +30%) ──
        $obj1 = $objectifs[0] ?? null;
        $krs1 = $obj1?->resultatsCles ?? collect();

        if ($obj1 && $krs1->count() >= 3) {
            // KR1 : Signer 5 nouveaux contrats
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj1->collaborateur_id,
                'objectif_id' => $obj1->id,
                'resultat_cle_id' => $krs1[0]->id,
                'titre' => 'Préparer la présentation client',
                'description' => 'Créer un deck de présentation commerciale adapté au prospect, incluant les cas d\'usage et le ROI estimé.',
                'mode_operatoire' => json_encode([
                    'Récupérer les infos du prospect (secteur, taille, besoins)',
                    'Dupliquer le template de présentation',
                    'Personnaliser les slides avec les cas d\'usage pertinents',
                    'Ajouter les chiffres ROI estimés',
                    'Relecture et validation par le manager',
                ]),
                'outils' => 'Google Slides, CRM Addvalis, Notion',
                'definition_done' => json_encode([
                    'Deck finalisé avec 10-15 slides',
                    'Validé par le manager',
                    'Envoyé au prospect en PDF',
                ]),
                'statut' => 'a_faire',
                'priorite' => 'urgente',
                'eisenhower' => 'Q1',
                'date' => now()->addDays(3),
            ]);
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj1->collaborateur_id,
                'objectif_id' => $obj1->id,
                'resultat_cle_id' => $krs1[0]->id,
                'titre' => 'Appeler le prospect TechCorp',
                'description' => 'Premier appel de découverte avec TechCorp pour qualifier le besoin et proposer une démo.',
                'mode_operatoire' => json_encode([
                    'Préparer la fiche prospect dans le CRM',
                    'Appeler le contact principal',
                    'Qualifier le besoin (budget, timeline, décideur)',
                    'Proposer un créneau de démo',
                ]),
                'outils' => 'CRM Addvalis, Téléphone, Calendly',
                'definition_done' => json_encode([
                    'Appel effectué et noté dans le CRM',
                    'Besoin qualifié',
                    'Démo planifiée ou relance programmée',
                ]),
                'statut' => 'a_faire',
                'priorite' => 'haute',
                'eisenhower' => 'Q1',
                'date' => now()->addDays(5),
            ]);

            // KR2 : Atteindre 150M GNF de CA
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj1->collaborateur_id,
                'objectif_id' => $obj1->id,
                'resultat_cle_id' => $krs1[1]->id,
                'titre' => 'Préparer le rapport trimestriel',
                'description' => 'Compiler les chiffres de vente du trimestre et produire un rapport de synthèse pour la direction.',
                'mode_operatoire' => json_encode([
                    'Extraire les données du CRM (CA par client, par produit)',
                    'Consolider dans le template de rapport trimestriel',
                    'Ajouter les graphiques d\'évolution',
                    'Rédiger l\'analyse et les recommandations',
                    'Présenter en réunion de direction',
                ]),
                'outils' => 'CRM Addvalis, Google Sheets, Google Slides',
                'definition_done' => json_encode([
                    'Rapport finalisé avec tous les indicateurs clés',
                    'Présenté et validé en comité de direction',
                ]),
                'statut' => 'a_faire',
                'priorite' => 'haute',
                'eisenhower' => 'Q2',
                'date' => now()->addDays(7),
            ]);

            // KR3 : Réduire le churn
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj1->collaborateur_id,
                'objectif_id' => $obj1->id,
                'resultat_cle_id' => $krs1[2]->id,
                'titre' => 'Envoyer la newsletter mensuelle',
                'description' => 'Rédiger et envoyer la newsletter de fidélisation aux clients actifs.',
                'mode_operatoire' => json_encode([
                    'Sélectionner les actualités et offres du mois',
                    'Rédiger le contenu dans Mailchimp',
                    'Faire valider par le responsable marketing',
                    'Programmer l\'envoi',
                ]),
                'outils' => 'Mailchimp, Canva, CRM Addvalis',
                'definition_done' => json_encode([
                    'Newsletter envoyée à toute la base clients actifs',
                    'Taux d\'ouverture suivi dans Mailchimp',
                ]),
                'statut' => 'termine',
                'priorite' => 'normale',
                'eisenhower' => 'Q3',
                'date' => now()->subDays(2),
            ]);
        }

        // ── Tâches liées aux KRs du deuxième objectif (Équipe) ──
        $obj2 = $objectifs[1] ?? null;
        $krs2 = $obj2?->resultatsCles ?? collect();

        if ($obj2 && $krs2->count() >= 2) {
            // KR1 : Recruter 2 commerciaux
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj2->collaborateur_id,
                'objectif_id' => $obj2->id,
                'resultat_cle_id' => $krs2[0]->id,
                'titre' => 'Publier l\'annonce de recrutement',
                'description' => 'Rédiger et publier l\'offre de poste de commercial junior sur les plateformes de recrutement.',
                'mode_operatoire' => json_encode([
                    'Définir le profil recherché avec le manager',
                    'Rédiger l\'annonce (fiche de poste)',
                    'Publier sur LinkedIn, Indeed et le site carrières',
                    'Paramétrer les alertes de candidatures',
                ]),
                'outils' => 'LinkedIn Recruiter, Indeed, Google Docs',
                'definition_done' => json_encode([
                    'Annonce publiée sur au moins 3 plateformes',
                    'Premières candidatures reçues',
                ]),
                'statut' => 'en_cours',
                'priorite' => 'haute',
                'eisenhower' => 'Q2',
                'date' => now()->addDays(2),
            ]);

            // KR2 : Former l'équipe au CRM
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj2->collaborateur_id,
                'objectif_id' => $obj2->id,
                'resultat_cle_id' => $krs2[1]->id,
                'titre' => 'Mettre à jour les visuels du site',
                'description' => 'Actualiser les visuels et captures d\'écran sur le site web pour refléter la nouvelle version du produit.',
                'outils' => 'Figma, Photoshop, WordPress',
                'definition_done' => json_encode([
                    'Tous les visuels du site mis à jour',
                    'Pages testées sur mobile et desktop',
                ]),
                'statut' => 'bloque',
                'priorite' => 'basse',
                'eisenhower' => 'Q4',
                'date' => now()->addDays(10),
            ]);
        }

        // ── Tâches liées aux KRs du troisième objectif (OKR v1) ──
        $obj3 = $objectifs[2] ?? null;
        $krs3 = $obj3?->resultatsCles ?? collect();

        if ($obj3 && $krs3->count() >= 2) {
            // KR1 : Développer les 8 modules
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj3->collaborateur_id,
                'objectif_id' => $obj3->id,
                'resultat_cle_id' => $krs3[0]->id,
                'titre' => 'Finaliser le dashboard',
                'description' => 'Terminer le développement du tableau de bord principal avec les KPIs et graphiques.',
                'mode_operatoire' => json_encode([
                    'Intégrer les composants de graphiques (Chart.js)',
                    'Connecter les données backend via API',
                    'Ajouter les filtres par période et collaborateur',
                    'Tester le responsive',
                    'Faire une revue de code',
                ]),
                'outils' => 'VS Code, Laravel, React, Chart.js',
                'definition_done' => json_encode([
                    'Dashboard fonctionnel avec données en temps réel',
                    'Responsive mobile/desktop',
                    'Revue de code validée',
                ]),
                'statut' => 'en_cours',
                'priorite' => 'haute',
                'eisenhower' => 'Q1',
                'date' => now()->addDays(4),
            ]);
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj3->collaborateur_id,
                'objectif_id' => $obj3->id,
                'resultat_cle_id' => $krs3[0]->id,
                'titre' => 'Rédiger la documentation API',
                'description' => 'Documenter tous les endpoints de l\'API REST pour les développeurs front-end.',
                'mode_operatoire' => json_encode([
                    'Lister tous les endpoints existants',
                    'Documenter les paramètres et réponses',
                    'Ajouter des exemples de requêtes (cURL, JS)',
                    'Publier sur Swagger/Postman',
                ]),
                'outils' => 'Swagger, Postman, Notion',
                'definition_done' => json_encode([
                    'Documentation publiée et accessible',
                    'Tous les endpoints documentés avec exemples',
                ]),
                'statut' => 'en_cours',
                'priorite' => 'normale',
                'eisenhower' => 'Q2',
                'date' => now()->addDays(6),
            ]);

            // KR2 : Tests utilisateurs
            Tache::create([
                'societe_id' => $societe->id,
                'collaborateur_id' => $obj3->collaborateur_id,
                'objectif_id' => $obj3->id,
                'resultat_cle_id' => $krs3[1]->id,
                'titre' => 'Corriger le bug d\'export PDF',
                'description' => 'Le bouton d\'export PDF génère un fichier vide sur certains navigateurs. Investiguer et corriger.',
                'mode_operatoire' => json_encode([
                    'Reproduire le bug sur Chrome et Firefox',
                    'Identifier la cause dans le code de génération PDF',
                    'Appliquer le correctif',
                    'Tester sur tous les navigateurs',
                ]),
                'outils' => 'VS Code, DevTools, Laravel DomPDF',
                'definition_done' => json_encode([
                    'Export PDF fonctionnel sur Chrome, Firefox et Safari',
                    'Test de non-régression passé',
                ]),
                'statut' => 'en_cours',
                'priorite' => 'urgente',
                'eisenhower' => 'Q1',
                'date' => now()->addDays(1),
            ]);
        }
    }
}
