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
        Schema::create('objectifs_remuneres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->string('titre');
            $table->string('type')->nullable();
            $table->string('indicateur')->nullable();
            $table->string('periode')->nullable();
            $table->decimal('prime', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('validations_objectifs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('objectif_remunere_id')->constrained('objectifs_remuneres')->cascadeOnDelete();
            $table->decimal('taux_atteinte', 5, 2)->default(0);
            $table->decimal('prime_versee', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('validations_objectifs');
        Schema::dropIfExists('objectifs_remuneres');
    }
};
