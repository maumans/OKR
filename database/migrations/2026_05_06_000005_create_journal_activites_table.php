<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_activites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');                        // objectif.cree, kr.progression, tache.terminee, prospect.statut
            $table->string('entite_type');                 // App\Models\Objectif, etc.
            $table->unsignedBigInteger('entite_id');
            $table->json('details')->nullable();           // données contextuelles
            $table->timestamps();

            $table->index(['societe_id', 'type', 'created_at']);
            $table->index(['entite_type', 'entite_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_activites');
    }
};
