<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('secteurs_activite', function (Blueprint $table) {
            $table->boolean('est_cible')->default(false)->after('actif');
        });
    }

    public function down(): void
    {
        Schema::table('secteurs_activite', function (Blueprint $table) {
            $table->dropColumn('est_cible');
        });
    }
};
