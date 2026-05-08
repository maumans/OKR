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
        Schema::create('objectifs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->string('titre');
            $table->string('axe')->nullable();
            $table->string('periode'); // Q1-2026, Q2-2026...
            $table->decimal('prime', 10, 2)->default(0);
            $table->enum('statut', ['brouillon', 'actif', 'termine', 'annule'])->default('brouillon');
            $table->timestamps();
        });

        Schema::create('resultats_cles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('objectif_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('progression', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resultats_cles');
        Schema::dropIfExists('objectifs');
    }
};
