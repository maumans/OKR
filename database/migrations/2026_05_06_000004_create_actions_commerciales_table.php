<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actions_commerciales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prospect_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['appel', 'email', 'reunion', 'note', 'relance']);
            $table->text('description')->nullable();
            $table->dateTime('date_action');
            $table->integer('duree')->nullable();          // en minutes
            $table->string('resultat')->nullable();        // positif, neutre, negatif
            $table->timestamps();

            $table->index(['prospect_id', 'created_at']);
            $table->index(['collaborateur_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actions_commerciales');
    }
};
