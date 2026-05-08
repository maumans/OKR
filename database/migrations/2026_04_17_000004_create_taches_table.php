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
        Schema::create('taches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->enum('statut', ['a_faire', 'en_cours', 'termine', 'bloque'])->default('a_faire');
            $table->enum('priorite', ['basse', 'normale', 'haute', 'urgente'])->default('normale');
            $table->date('date')->nullable();
            $table->timestamps();
        });

        Schema::create('bilans_journaliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->text('blocages')->nullable();
            $table->date('date');
            $table->timestamps();

            $table->unique(['collaborateur_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bilans_journaliers');
        Schema::dropIfExists('taches');
    }
};
