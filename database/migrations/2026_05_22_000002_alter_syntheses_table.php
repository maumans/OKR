<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Reconstruire la table syntheses avec le bon schéma (était un placeholder)
        Schema::dropIfExists('syntheses');

        Schema::create('syntheses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->date('mois'); // 1er du mois : 2026-05-01
            $table->json('payload'); // snapshot complet : scores, primes, prospection
            $table->decimal('budget_primes_total', 14, 2)->default(0);
            $table->unsignedInteger('nb_primes_accordees')->default(0);
            $table->unsignedInteger('nb_collaborateurs')->default(0);
            $table->foreignId('genere_par_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Un seul snapshot par mois par société
            $table->unique(['societe_id', 'mois']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('syntheses');

        Schema::create('syntheses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->string('mois');
            $table->decimal('total_primes', 12, 2)->default(0);
            $table->json('donnees')->nullable();
            $table->timestamps();
            $table->unique(['societe_id', 'mois']);
        });
    }
};
