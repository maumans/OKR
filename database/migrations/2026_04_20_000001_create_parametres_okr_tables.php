<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── 1. Axes stratégiques ────────────────────────────────
        Schema::create('axes_objectifs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('description')->nullable();
            $table->string('couleur', 7)->default('#00c9ff');
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        // ─── 2. Périodes OKR ─────────────────────────────────────
        Schema::create('periodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom'); // Q1 2026, Mars 2026...
            $table->date('date_debut');
            $table->date('date_fin');
            $table->string('type'); // mensuel, trimestriel, annuel
            $table->string('statut')->default('actif'); // actif, cloture
            $table->timestamps();
        });

        // ─── 3. Types d'objectifs ────────────────────────────────
        Schema::create('types_objectifs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('description')->nullable();
            $table->string('niveau'); // entreprise, equipe, individuel
            $table->timestamps();
        });

        // ─── 4. Types de résultats clés ──────────────────────────
        Schema::create('types_resultats_cles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('type_valeur'); // number, percent, boolean, currency
            $table->string('unite')->nullable(); // GNF, %, unités...
            $table->timestamps();
        });

        // ─── 5. Statuts des objectifs ────────────────────────────
        Schema::create('statuts_objectifs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom'); // brouillon, actif, en_pause, termine, abandonne
            $table->string('couleur', 7)->default('#6b7280');
            $table->integer('ordre')->default(0);
            $table->boolean('est_final')->default(false);
            $table->timestamps();
        });

        // ─── 6. Seuils de performance ───────────────────────────
        Schema::create('seuils_performance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom'); // Critique, En retard, En bonne voie, Atteint
            $table->string('couleur', 7);
            $table->decimal('seuil_min', 5, 2); // 0, 50, 70
            $table->decimal('seuil_max', 5, 2); // 50, 70, 100
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });

        // ─── 7. Configuration OKR globale ────────────────────────
        Schema::create('configurations_okr', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('mode_calcul')->default('moyenne'); // moyenne, pondere, manuel
            $table->string('frequence_update')->default('hebdomadaire'); // quotidien, hebdomadaire, mensuel
            $table->boolean('rappel_automatique')->default(true);
            $table->string('visibilite_defaut')->default('equipe'); // tous, equipe, prive
            $table->timestamps();
        });

        // ─── 8. Configuration des primes ─────────────────────────
        Schema::create('configurations_primes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('actif')->default(false);
            $table->decimal('montant_max', 12, 2)->nullable();
            $table->decimal('seuil_minimum', 5, 2)->default(70); // % minimum pour déclencher
            $table->string('mode_calcul')->default('proportionnel'); // fixe, proportionnel, palier
            $table->timestamps();
        });

        // ─── 9. Paliers de primes ────────────────────────────────
        Schema::create('paliers_primes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('configuration_prime_id')->constrained('configurations_primes')->cascadeOnDelete();
            $table->decimal('seuil_min', 5, 2);
            $table->decimal('seuil_max', 5, 2);
            $table->decimal('pourcentage_prime', 5, 2); // % de la prime attribuée
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });

        // ─── 10. Templates d'OKR ─────────────────────────────────
        Schema::create('templates_objectifs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('description')->nullable();
            $table->string('poste')->nullable();
            $table->json('contenu'); // { titre, axe, resultats_cles: [...] }
            $table->timestamps();
        });

        // ─── 11. Modifier la table objectifs existante ───────────
        Schema::table('objectifs', function (Blueprint $table) {
            $table->foreignId('axe_objectif_id')->nullable()->after('collaborateur_id')->constrained('axes_objectifs')->nullOnDelete();
            $table->foreignId('periode_id')->nullable()->after('axe_objectif_id')->constrained('periodes')->nullOnDelete();
            $table->foreignId('type_objectif_id')->nullable()->after('periode_id')->constrained('types_objectifs')->nullOnDelete();
            $table->foreignId('statut_objectif_id')->nullable()->after('statut')->constrained('statuts_objectifs')->nullOnDelete();
            $table->string('visibilite')->default('equipe')->after('statut'); // tous, equipe, prive
        });

        // ─── 12. Modifier la table resultats_cles existante ─────
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->foreignId('type_resultat_cle_id')->nullable()->after('objectif_id')->constrained('types_resultats_cles')->nullOnDelete();
            $table->decimal('valeur_cible', 12, 2)->default(100)->after('progression');
            $table->decimal('valeur_actuelle', 12, 2)->default(0)->after('valeur_cible');
            $table->decimal('poids', 5, 2)->default(1)->after('valeur_actuelle');
            $table->string('unite')->nullable()->after('poids');
        });
    }

    public function down(): void
    {
        // Revert objectifs columns
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('type_resultat_cle_id');
            $table->dropColumn(['valeur_cible', 'valeur_actuelle', 'poids', 'unite']);
        });

        Schema::table('objectifs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('axe_objectif_id');
            $table->dropConstrainedForeignId('periode_id');
            $table->dropConstrainedForeignId('type_objectif_id');
            $table->dropConstrainedForeignId('statut_objectif_id');
            $table->dropColumn('visibilite');
        });

        Schema::dropIfExists('templates_objectifs');
        Schema::dropIfExists('paliers_primes');
        Schema::dropIfExists('configurations_primes');
        Schema::dropIfExists('configurations_okr');
        Schema::dropIfExists('seuils_performance');
        Schema::dropIfExists('statuts_objectifs');
        Schema::dropIfExists('types_resultats_cles');
        Schema::dropIfExists('types_objectifs');
        Schema::dropIfExists('periodes');
        Schema::dropIfExists('axes_objectifs');
    }
};
