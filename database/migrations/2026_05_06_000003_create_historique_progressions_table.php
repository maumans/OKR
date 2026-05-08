<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historique_progressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resultat_cle_id')->constrained('resultats_cles')->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->decimal('ancienne_valeur', 5, 2);
            $table->decimal('nouvelle_valeur', 5, 2);
            $table->text('justification')->nullable();
            $table->timestamps();

            $table->index(['resultat_cle_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_progressions');
    }
};
