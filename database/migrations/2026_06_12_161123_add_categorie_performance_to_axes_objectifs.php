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
        Schema::table('axes_objectifs', function (Blueprint $table) {
            // Dimension de performance alimentée par cet axe OKR (null = non mappé)
            $table->enum('categorie_performance', ['commercial', 'delivery'])
                  ->nullable()
                  ->default(null)
                  ->after('actif');
        });
    }

    public function down(): void
    {
        Schema::table('axes_objectifs', function (Blueprint $table) {
            $table->dropColumn('categorie_performance');
        });
    }
};
