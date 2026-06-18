<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Référentiel des indicateurs opérationnels
        Schema::create('ops_indicateurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom', 150);
            $table->string('categorie', 80)->nullable();
            $table->string('unite', 50)->nullable();       // ex. "K GNF", "%", "nb"
            $table->string('frequence', 20)->default('mensuel'); // mensuel | trimestriel | annuel
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });

        // Saisies des valeurs par indicateur / collaborateur / période
        Schema::create('ops_saisies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ops_indicateur_id')->constrained('ops_indicateurs')->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->nullable()->constrained()->nullOnDelete();
            $table->string('periode', 20);           // ex. "2026-06", "Q2 2026", "2026"
            $table->decimal('valeur', 14, 2)->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();

            $table->unique(['ops_indicateur_id', 'collaborateur_id', 'periode'], 'ops_saisies_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ops_saisies');
        Schema::dropIfExists('ops_indicateurs');
    }
};
