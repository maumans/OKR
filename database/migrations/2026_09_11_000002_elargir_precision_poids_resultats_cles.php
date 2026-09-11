<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Les poids issus de l'import sont des fractions normalisées (0.053, 0.046...).
     * decimal(5,2) les arrondissait à 2 décimales et faussait la pondération.
     */
    public function up(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->decimal('poids', 8, 4)->default(1)->change();
        });
    }

    public function down(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->decimal('poids', 5, 2)->default(1)->change();
        });
    }
};
