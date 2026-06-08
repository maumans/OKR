<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Passer statut de ENUM à VARCHAR pour supporter les nouvelles valeurs
        DB::statement("ALTER TABLE prospects MODIFY COLUMN statut VARCHAR(20) NOT NULL DEFAULT 'decouverte'");

        // 2. Migrer les anciens statuts vers les nouveaux
        DB::statement("UPDATE prospects SET statut = 'decouverte'  WHERE statut IN ('nouveau', 'contacte', 'qualifie')");
        DB::statement("UPDATE prospects SET statut = 'negociation' WHERE statut = 'negocie'");

        // 3. Ajouter les nouveaux champs
        Schema::table('prospects', function (Blueprint $table) {
            $table->string('titre', 255)->nullable()->after('nom');
            $table->unsignedTinyInteger('probabilite')->default(20)->after('valeur');
            $table->string('type_deal', 20)->default('nouveau_client')->after('probabilite');
        });
    }

    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropColumn(['titre', 'probabilite', 'type_deal']);
        });

        DB::statement("UPDATE prospects SET statut = 'nouveau'  WHERE statut = 'decouverte'");
        DB::statement("UPDATE prospects SET statut = 'negocie'  WHERE statut = 'negociation'");
        DB::statement("ALTER TABLE prospects MODIFY COLUMN statut ENUM('nouveau','contacte','qualifie','proposition','negocie','gagne','perdu') NOT NULL DEFAULT 'nouveau'");
    }
};
