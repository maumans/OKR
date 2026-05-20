<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('societes', function (Blueprint $table) {
            $table->string('statut')->default('actif')->after('devise_id');
        });

        // Mettre toutes les sociétés existantes comme actives
        DB::table('societes')->update(['statut' => 'actif']);
    }

    public function down(): void
    {
        Schema::table('societes', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
