<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->text('description_detaillee')->nullable()->after('description');
        });

        Schema::create('objectif_periode', function (Blueprint $table) {
            $table->foreignId('objectif_id')->constrained('objectifs')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periodes')->cascadeOnDelete();
            $table->primary(['objectif_id', 'periode_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('objectif_periode');
        
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->dropColumn('description_detaillee');
        });
    }
};
