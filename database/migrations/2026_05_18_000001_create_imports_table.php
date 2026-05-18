<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained('societes')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('fichier_nom');
            $table->string('statut')->default('brouillon'); // brouillon, importe, annule
            $table->unsignedInteger('nb_objectifs_crees')->default(0);
            $table->unsignedInteger('nb_kr_crees')->default(0);
            $table->unsignedInteger('nb_taches_crees')->default(0);
            $table->unsignedInteger('nb_collaborateurs_crees')->default(0);
            $table->json('payload_json')->nullable();
            $table->json('ids_crees')->nullable(); // Pour rollback : {objectif_ids, kr_ids, tache_ids, collaborateur_ids, axe_ids}
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imports');
    }
};
