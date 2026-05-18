<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('objectifs', function (Blueprint $table) {
            $table->foreignId('mission_id')->nullable()->after('type_objectif_id')->constrained('missions')->nullOnDelete();
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->foreignId('mission_id')->nullable()->after('resultat_cle_id')->constrained('missions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('objectifs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mission_id');
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mission_id');
        });
    }
};
