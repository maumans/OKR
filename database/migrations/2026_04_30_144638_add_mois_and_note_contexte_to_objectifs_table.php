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
        Schema::table('objectifs', function (Blueprint $table) {
            $table->date('mois')->nullable()->after('periode')->comment('Premier jour du mois (ex: 2026-04-01) pour objectifs individuels');
            $table->text('note_contexte')->nullable()->after('prime')->comment('Note / Contexte de l\'objectif');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('objectifs', function (Blueprint $table) {
            $table->dropColumn(['mois', 'note_contexte']);
        });
    }
};
