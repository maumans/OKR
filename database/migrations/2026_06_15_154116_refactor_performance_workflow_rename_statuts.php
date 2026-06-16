<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Étendre l'ENUM pour inclure temporairement anciens + nouveaux noms
        DB::statement("ALTER TABLE fiches_performance MODIFY COLUMN statut ENUM(
            'brouillon','en_revision','auto_evaluation','attente_drh','confirme','revision_demandee','contestation'
        ) NOT NULL DEFAULT 'brouillon'");

        // 2. Migrer les données existantes vers les nouveaux noms
        DB::table('fiches_performance')->where('statut', 'en_revision')->update(['statut' => 'auto_evaluation']);
        DB::table('fiches_performance')->where('statut', 'revision_demandee')->update(['statut' => 'contestation']);

        // 3. Restreindre l'ENUM aux nouvelles valeurs uniquement
        DB::statement("ALTER TABLE fiches_performance MODIFY COLUMN statut ENUM(
            'brouillon','auto_evaluation','attente_drh','confirme','contestation'
        ) NOT NULL DEFAULT 'brouillon'");

        // 4. Ajouter les colonnes accord_collab (si elles n'existent pas déjà)
        Schema::table('fiches_performance', function (Blueprint $table) {
            if (!Schema::hasColumn('fiches_performance', 'accord_collab')) {
                $table->boolean('accord_collab')->default(false)->after('nb_aller_retour');
            }
            if (!Schema::hasColumn('fiches_performance', 'accord_collab_at')) {
                $table->timestamp('accord_collab_at')->nullable()->after('accord_collab');
            }
        });

        // 5. Mettre à jour l'historique workflow pour cohérence des libellés
        DB::table('historique_workflow_performance')
            ->where('de_statut', 'en_revision')->update(['de_statut' => 'auto_evaluation']);
        DB::table('historique_workflow_performance')
            ->where('vers_statut', 'en_revision')->update(['vers_statut' => 'auto_evaluation']);
        DB::table('historique_workflow_performance')
            ->where('de_statut', 'revision_demandee')->update(['de_statut' => 'contestation']);
        DB::table('historique_workflow_performance')
            ->where('vers_statut', 'revision_demandee')->update(['vers_statut' => 'contestation']);
    }

    public function down(): void
    {
        Schema::table('fiches_performance', function (Blueprint $table) {
            $table->dropColumn(['accord_collab', 'accord_collab_at']);
        });

        DB::statement("ALTER TABLE fiches_performance MODIFY COLUMN statut ENUM(
            'brouillon','auto_evaluation','contestation','en_revision','attente_drh','confirme','revision_demandee'
        ) NOT NULL DEFAULT 'brouillon'");

        DB::table('fiches_performance')->where('statut', 'auto_evaluation')->update(['statut' => 'en_revision']);
        DB::table('fiches_performance')->where('statut', 'contestation')->update(['statut' => 'revision_demandee']);

        DB::statement("ALTER TABLE fiches_performance MODIFY COLUMN statut ENUM(
            'brouillon','en_revision','attente_drh','confirme','revision_demandee'
        ) NOT NULL DEFAULT 'brouillon'");
    }
};
