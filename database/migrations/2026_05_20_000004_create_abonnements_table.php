<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abonnements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('plan')->default('starter'); // starter, pro, enterprise
            $table->decimal('prix_mensuel', 10, 2)->default(0);
            $table->foreignId('devise_id')->nullable()->constrained('devises')->nullOnDelete();
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->string('statut')->default('actif'); // actif, suspendu, annule
            $table->integer('limite_utilisateurs')->default(5);
            $table->integer('limite_okr')->nullable(); // null = illimité
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abonnements');
    }
};
