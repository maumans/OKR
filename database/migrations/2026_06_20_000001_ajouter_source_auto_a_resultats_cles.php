<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            // source_auto : type de consolidation automatique
            // Valeurs : crm_activites | crm_deals | crm_pipeline | missions_nps | missions_livrables | null (manuel)
            $table->string('source_auto', 50)->nullable()->after('source_crm_filtre');
        });
    }

    public function down(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->dropColumn('source_auto');
        });
    }
};
