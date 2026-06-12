<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('fiches_performance', function (Blueprint $table) {
            $table->timestamp('okr_synced_at')->nullable()->after('score_auto_delivery');
        });
    }

    public function down(): void
    {
        Schema::table('fiches_performance', function (Blueprint $table) {
            $table->dropColumn('okr_synced_at');
        });
    }
};
