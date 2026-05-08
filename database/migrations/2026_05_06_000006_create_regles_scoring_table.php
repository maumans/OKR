<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('regles_scoring', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('contexte');       // daily, individuel, commercial
            $table->string('critere');         // priorite_haute, type_travail_profond, completion, etc.
            $table->integer('points')->default(1);
            $table->boolean('actif')->default(true);
            $table->timestamps();

            $table->unique(['societe_id', 'contexte', 'critere']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('regles_scoring');
    }
};
