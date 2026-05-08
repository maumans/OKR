<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('types_taches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom');                    // "Travail Profond", "Administration", etc.
            $table->string('slug');                    // travail_profond, administration, etc.
            $table->string('couleur', 7)->default('#6b7280');
            $table->string('icone')->nullable();       // emoji ou icon name
            $table->integer('score_base')->default(1); // multiplicateur de score
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();

            $table->unique(['societe_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('types_taches');
    }
};
