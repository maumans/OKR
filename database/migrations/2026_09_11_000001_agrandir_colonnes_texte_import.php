<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Les libellés issus de l'import Excel (énoncé + description + résultat attendu)
     * dépassent régulièrement 255 caractères. On passe les colonnes concernées en TEXT.
     */
    public function up(): void
    {
        Schema::table('objectifs', function (Blueprint $table) {
            $table->text('titre')->change();
        });

        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->text('description')->change();
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->text('titre')->change();
        });
    }

    public function down(): void
    {
        Schema::table('objectifs', function (Blueprint $table) {
            $table->string('titre')->change();
        });

        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->string('description')->change();
        });

        Schema::table('taches', function (Blueprint $table) {
            $table->string('titre')->change();
        });
    }
};
