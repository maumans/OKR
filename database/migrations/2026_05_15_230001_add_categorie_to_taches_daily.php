<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->enum('categorie', ['prospection', 'rdv', 'delivery', 'seminaire', 'recherche', 'autre'])
                  ->nullable()
                  ->after('type_tache');
        });
    }

    public function down(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->dropColumn('categorie');
        });
    }
};
