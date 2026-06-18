<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('nom', 150);
            $table->string('categorie', 80)->nullable();
            $table->text('description')->nullable();
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('collaborateur_competence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->foreignId('competence_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('niveau')->default(1); // 1-5
            $table->text('commentaire')->nullable();
            $table->timestamps();

            $table->unique(['collaborateur_id', 'competence_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collaborateur_competence');
        Schema::dropIfExists('competences');
    }
};
