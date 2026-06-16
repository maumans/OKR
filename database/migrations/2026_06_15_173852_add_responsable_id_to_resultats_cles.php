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
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->foreignId('responsable_id')
                ->nullable()
                ->after('objectif_id')
                ->constrained('collaborateurs')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->dropForeign(['responsable_id']);
            $table->dropColumn('responsable_id');
        });
    }
};
