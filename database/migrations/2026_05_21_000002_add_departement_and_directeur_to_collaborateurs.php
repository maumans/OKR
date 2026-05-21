<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Étape 1 : ajouter la colonne departement_id
        Schema::table('collaborateurs', function (Blueprint $table) {
            $table->foreignId('departement_id')
                ->nullable()
                ->after('societe_id')
                ->constrained('departements')
                ->nullOnDelete();
        });

        // Étape 2 : modifier la colonne role pour inclure 'directeur'
        // MySQL ne supporte pas ALTER COLUMN sur ENUM directement, on passe par une string avec contrainte CHECK
        DB::statement("ALTER TABLE collaborateurs MODIFY COLUMN role ENUM('admin','directeur','manager','collaborateur') NOT NULL DEFAULT 'collaborateur'");
    }

    public function down(): void
    {
        Schema::table('collaborateurs', function (Blueprint $table) {
            $table->dropForeign(['departement_id']);
            $table->dropColumn('departement_id');
        });

        DB::statement("ALTER TABLE collaborateurs MODIFY COLUMN role ENUM('admin','manager','collaborateur') NOT NULL DEFAULT 'collaborateur'");
    }
};
