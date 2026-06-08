<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fiches_performance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained('societes')->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->constrained('collaborateurs')->cascadeOnDelete();
            $table->foreignId('manager_id')->nullable()->constrained('collaborateurs')->nullOnDelete();
            $table->string('cycle', 20);
            $table->enum('type_cycle', ['trimestriel', 'annuel'])->default('trimestriel');
            $table->date('periode_debut')->nullable();
            $table->date('periode_fin')->nullable();
            $table->enum('statut', ['brouillon', 'en_revision', 'attente_drh', 'confirme'])->default('brouillon');
            $table->tinyInteger('nb_aller_retour')->unsigned()->default(0);

            // Scores /5 par dimension
            $table->decimal('score_commercial', 4, 2)->nullable();
            $table->decimal('poids_commercial', 4, 2)->default(0.50);
            $table->decimal('score_delivery', 4, 2)->nullable();
            $table->decimal('poids_delivery', 4, 2)->default(0.25);
            $table->decimal('score_developpement', 4, 2)->nullable();
            $table->decimal('poids_developpement', 4, 2)->default(0.15);
            $table->decimal('score_comportemental', 4, 2)->nullable();
            $table->decimal('poids_comportemental', 4, 2)->default(0.10);

            // Score global pondéré (recalculé à chaque update)
            $table->decimal('score_global', 4, 2)->nullable();

            // Commentaires par rôle
            $table->text('commentaire_manager')->nullable();
            $table->text('commentaire_collaborateur')->nullable();
            $table->text('commentaire_drh')->nullable();

            // Validation finale
            $table->timestamp('validated_at')->nullable();
            $table->foreignId('validated_by_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index('societe_id');
            $table->unique(['collaborateur_id', 'cycle']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiches_performance');
    }
};
