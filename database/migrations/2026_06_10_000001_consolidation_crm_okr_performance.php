<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. resultats_cles : source CRM ──────────────────────────────────────
        Schema::table('resultats_cles', function (Blueprint $table) {
            if (!Schema::hasColumn('resultats_cles', 'source_crm')) {
                $table->boolean('source_crm')->default(false)->after('mode_calcul');
            }
            if (!Schema::hasColumn('resultats_cles', 'source_crm_filtre')) {
                $table->json('source_crm_filtre')->nullable()->after('source_crm');
            }
        });

        // ── 2. fiches_performance : scores auto depuis OKR ───────────────────────
        Schema::table('fiches_performance', function (Blueprint $table) {
            if (!Schema::hasColumn('fiches_performance', 'score_auto_commercial')) {
                $table->decimal('score_auto_commercial', 4, 2)->nullable()->after('score_commercial');
            }
            if (!Schema::hasColumn('fiches_performance', 'score_auto_delivery')) {
                $table->decimal('score_auto_delivery', 4, 2)->nullable()->after('score_delivery');
            }
        });
    }

    public function down(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->dropColumn(['source_crm', 'source_crm_filtre']);
        });

        Schema::table('fiches_performance', function (Blueprint $table) {
            $table->dropColumn(['score_auto_commercial', 'score_auto_delivery']);
        });
    }
};
