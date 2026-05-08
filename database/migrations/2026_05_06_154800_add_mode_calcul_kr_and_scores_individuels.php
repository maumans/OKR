<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute la colonne mode_calcul sur resultats_cles pour les KR boolean/milestone,
     * et crée la table scores_individuels pour historiser les scores mensuels.
     */
    public function up(): void
    {
        // ─── 1. Ajouter mode_calcul aux KR (boolean, milestone, etc.) ───
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->string('mode_calcul', 20)->default('pourcentage')->after('description');
            // pourcentage (défaut), boolean (0 ou 100), milestone (étapes discrètes)
            $table->json('milestones')->nullable()->after('mode_calcul');
            // Pour mode milestone: [{"label": "Étape 1", "atteint": false}, ...]
        });

        // ─── 2. Table d'historisation des scores individuels mensuels ────
        Schema::create('scores_individuels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->date('mois'); // Premier jour du mois (2026-05-01)
            $table->decimal('score_global', 5, 2)->default(0);
            $table->unsignedInteger('objectifs_count')->default(0);
            $table->decimal('prime_acquise', 10, 2)->default(0);
            $table->json('detail_axes')->nullable();
            // Ex: [{"axe": "Commercial", "progression": 75}, {"axe": "Opérationnel", "progression": 60}]
            $table->timestamps();

            $table->unique(['collaborateur_id', 'mois']);
        });
    }

    public function down(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->dropColumn(['mode_calcul', 'milestones']);
        });

        Schema::dropIfExists('scores_individuels');
    }
};
