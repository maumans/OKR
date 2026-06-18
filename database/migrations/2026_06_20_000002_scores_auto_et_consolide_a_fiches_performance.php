<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fiches_performance', function (Blueprint $table) {
            // score_auto_developpement et score_auto_comportemental existent déjà
            // On ajoute uniquement consolide_at (timestamp de dernière consolidation automatique)
            if (! Schema::hasColumn('fiches_performance', 'consolide_at')) {
                $table->timestamp('consolide_at')->nullable()->after('okr_synced_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fiches_performance', function (Blueprint $table) {
            if (Schema::hasColumn('fiches_performance', 'consolide_at')) {
                $table->dropColumn('consolide_at');
            }
        });
    }
};
