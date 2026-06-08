<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Modifier l'enum statut pour ajouter 'revision_demandee'
        // MySQL ne supporte pas ALTER ENUM directement → on passe par MODIFY
        DB::statement("ALTER TABLE fiches_performance MODIFY COLUMN statut ENUM('brouillon','en_revision','attente_drh','confirme','revision_demandee') NOT NULL DEFAULT 'brouillon'");

        Schema::table('fiches_performance', function (Blueprint $table) {
            // 2) Appréciation normalisée calculée (ex. "Au niveau des attentes")
            $table->string('appreciation', 100)->nullable()->after('score_global');

            // 3) Verrou explicite (true quand confirme ou après signature DRH)
            $table->boolean('verrouille')->default(false)->after('appreciation');

            // 4) Champs Évaluation finale (distincts des commentaires généraux)
            $table->boolean('final_done')->default(false)->after('forecast_revision');
            $table->timestamp('final_date')->nullable()->after('final_done');
            $table->decimal('final_score_global', 4, 2)->nullable()->after('final_date');
            $table->string('final_appreciation', 100)->nullable()->after('final_score_global');
            $table->decimal('final_prime_calculee', 14, 2)->nullable()->after('final_appreciation');
            $table->text('final_commentaire_manager')->nullable()->after('final_prime_calculee');
            $table->text('final_commentaire_collaborateur')->nullable()->after('final_commentaire_manager');

            // 5) Auto-évaluation collaborateur /5 par dimension
            $table->tinyInteger('score_collab_commercial')->unsigned()->nullable()->after('commentaire_collaborateur_commercial');
            $table->tinyInteger('score_collab_delivery')->unsigned()->nullable()->after('commentaire_collaborateur_delivery');
            $table->tinyInteger('score_collab_developpement')->unsigned()->nullable()->after('commentaire_collaborateur_developpement');
            $table->tinyInteger('score_collab_comportemental')->unsigned()->nullable()->after('commentaire_collaborateur_comportemental');

            // 6) Liaison OKR (stub Chantier 0 — colonnes prêtes, calcul auto plus tard)
            $table->unsignedBigInteger('objectif_okr_id_commercial')->nullable()->after('cible_commercial');
            $table->unsignedBigInteger('objectif_okr_id_delivery')->nullable()->after('cible_delivery');
        });

        // Ajouter les FK séparément (plus safe que dans le Blueprint)
        if (Schema::hasTable('objectifs')) {
            Schema::table('fiches_performance', function (Blueprint $table) {
                $table->foreign('objectif_okr_id_commercial')->references('id')->on('objectifs')->nullOnDelete();
                $table->foreign('objectif_okr_id_delivery')->references('id')->on('objectifs')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('fiches_performance', function (Blueprint $table) {
            if (Schema::hasTable('objectifs')) {
                $table->dropForeign(['objectif_okr_id_commercial']);
                $table->dropForeign(['objectif_okr_id_delivery']);
            }
            $table->dropColumn([
                'appreciation', 'verrouille',
                'final_done', 'final_date', 'final_score_global', 'final_appreciation',
                'final_prime_calculee', 'final_commentaire_manager', 'final_commentaire_collaborateur',
                'score_collab_commercial', 'score_collab_delivery',
                'score_collab_developpement', 'score_collab_comportemental',
                'objectif_okr_id_commercial', 'objectif_okr_id_delivery',
            ]);
        });

        DB::statement("ALTER TABLE fiches_performance MODIFY COLUMN statut ENUM('brouillon','en_revision','attente_drh','confirme') NOT NULL DEFAULT 'brouillon'");
    }
};
