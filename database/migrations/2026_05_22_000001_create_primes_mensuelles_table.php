<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('primes_mensuelles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained('societes')->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->constrained('collaborateurs')->cascadeOnDelete();
            $table->date('mois'); // toujours 1er du mois : 2026-05-01
            $table->decimal('montant_max', 12, 2)->default(0);
            $table->unsignedTinyInteger('seuil_pourcentage')->default(80); // 50-100
            $table->decimal('score_global', 5, 2)->nullable(); // figé à la validation
            $table->decimal('montant_accorde', 12, 2)->nullable();
            $table->boolean('validee')->default(false);
            $table->text('commentaire_manager')->nullable();
            $table->foreignId('validee_par_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validee_le')->nullable();
            $table->timestamps();

            // 1 seule ligne par collaborateur × mois × société
            $table->unique(['societe_id', 'collaborateur_id', 'mois']);
            $table->index(['societe_id', 'mois']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('primes_mensuelles');
    }
};
