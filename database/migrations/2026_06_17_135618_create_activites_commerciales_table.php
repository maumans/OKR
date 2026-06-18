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
        Schema::create('activites_commerciales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained('societes')->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->constrained('collaborateurs')->cascadeOnDelete();
            $table->enum('type', [
                'contact_initie', 'demo_realisee', 'proposition_envoyee',
                'relance_effectuee', 'negociation_engagee', 'deal_signe', 'deal_perdu',
            ]);
            $table->foreignId('prospect_id')->nullable()->constrained('prospects')->nullOnDelete();
            $table->string('prospect_client')->nullable();
            $table->decimal('montant', 18, 2)->nullable();
            $table->string('cycle', 20);
            $table->text('note')->nullable();
            $table->date('date_activite');
            $table->timestamps();

            $table->index(['societe_id', 'cycle']);
            $table->index(['collaborateur_id', 'cycle']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activites_commerciales');
    }
};
