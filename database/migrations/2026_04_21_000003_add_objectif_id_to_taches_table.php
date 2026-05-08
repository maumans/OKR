<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches', function (Blueprint $table) {
            if (!Schema::hasColumn('taches', 'objectif_id')) {
                $table->foreignId('objectif_id')
                    ->nullable()
                    ->after('collaborateur_id')
                    ->constrained('objectifs')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('taches', 'resultat_cle_id')) {
                $table->foreignId('resultat_cle_id')
                    ->nullable()
                    ->after('objectif_id')
                    ->constrained('resultats_cles')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('taches', function (Blueprint $table) {
            if (Schema::hasColumn('taches', 'resultat_cle_id')) {
                $table->dropForeignIdFor(\App\Models\ResultatCle::class);
                $table->dropColumn('resultat_cle_id');
            }
            if (Schema::hasColumn('taches', 'objectif_id')) {
                $table->dropForeignIdFor(\App\Models\Objectif::class);
                $table->dropColumn('objectif_id');
            }
        });
    }
};
