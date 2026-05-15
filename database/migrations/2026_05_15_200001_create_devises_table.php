<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devises', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();        // GNF, XOF, EUR, USD...
            $table->string('nom', 100);                  // Franc Guinéen, Euro...
            $table->string('symbole', 10)->nullable();   // GF, €, $... (optionnel)
            $table->unsignedTinyInteger('decimales')->default(0); // 0 pour GNF, 2 pour EUR
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devises');
    }
};
