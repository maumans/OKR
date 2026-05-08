<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->string('type_tache')->nullable()->after('priorite');       // slug du type
            $table->integer('temps_estime')->nullable()->after('type_tache');  // en minutes
            $table->integer('temps_reel')->nullable()->after('temps_estime');  // en minutes
            $table->integer('score')->nullable()->after('temps_reel');         // score calculé
        });
    }

    public function down(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->dropColumn(['type_tache', 'temps_estime', 'temps_reel', 'score']);
        });
    }
};
