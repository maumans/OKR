<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications_app', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 60);          // livrable_deadline, livrable_statut, mission_critique...
            $table->string('titre');
            $table->text('body')->nullable();
            $table->json('data')->nullable();     // {mission_id, livrable_id, url}
            $table->boolean('lue')->default(false);
            $table->timestamp('lue_le')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'societe_id', 'lue']);
            $table->index(['societe_id', 'type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications_app');
    }
};
