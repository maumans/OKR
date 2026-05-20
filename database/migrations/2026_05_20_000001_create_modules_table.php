<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->string('icone')->nullable();
            $table->string('couleur', 20)->default('#3b82f6');
            $table->string('categorie'); // CORE, MANAGEMENT, BUSINESS, ANALYTIQUE, ADMINISTRATION
            $table->json('routes')->nullable();       // patterns de routes protégées
            $table->json('dependances')->nullable();  // codes des modules requis
            $table->boolean('est_core')->default(false);
            $table->boolean('est_premium')->default(false);
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
