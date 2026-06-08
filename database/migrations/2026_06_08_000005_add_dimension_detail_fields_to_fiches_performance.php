<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fiches_performance', function (Blueprint $table) {
            // Champs par dimension : objectif (titre OKR), cible, score auto (Chantier 0), commentaires
            foreach (['commercial', 'delivery', 'developpement', 'comportemental'] as $dim) {
                $table->text("objectif_{$dim}")->nullable()->after("poids_{$dim}");
                $table->string("cible_{$dim}", 255)->nullable()->after("objectif_{$dim}");
                $table->decimal("score_auto_{$dim}", 4, 2)->nullable()->after("cible_{$dim}");
                $table->text("commentaire_manager_{$dim}")->nullable()->after("score_auto_{$dim}");
                $table->text("commentaire_collaborateur_{$dim}")->nullable()->after("commentaire_manager_{$dim}");
            }

            // Champs Mid-Year Review
            $table->text('commentaire_mid_year_manager')->nullable()->after('commentaire_drh');
            $table->text('commentaire_mid_year_collaborateur')->nullable()->after('commentaire_mid_year_manager');
            $table->text('forecast_revision')->nullable()->after('commentaire_mid_year_collaborateur');
        });
    }

    public function down(): void
    {
        Schema::table('fiches_performance', function (Blueprint $table) {
            $cols = [];
            foreach (['commercial', 'delivery', 'developpement', 'comportemental'] as $dim) {
                $cols[] = "objectif_{$dim}";
                $cols[] = "cible_{$dim}";
                $cols[] = "score_auto_{$dim}";
                $cols[] = "commentaire_manager_{$dim}";
                $cols[] = "commentaire_collaborateur_{$dim}";
            }
            $cols[] = 'commentaire_mid_year_manager';
            $cols[] = 'commentaire_mid_year_collaborateur';
            $cols[] = 'forecast_revision';
            $table->dropColumn($cols);
        });
    }
};
