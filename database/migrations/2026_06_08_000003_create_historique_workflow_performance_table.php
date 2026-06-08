<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historique_workflow_performance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiche_performance_id')->constrained('fiches_performance')->cascadeOnDelete();
            $table->string('de_statut')->nullable();
            $table->string('vers_statut');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('commentaire')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_workflow_performance');
    }
};
