<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('responsable_id')->nullable()->constrained('collaborateurs')->nullOnDelete();
            $table->string('client');
            $table->string('titre');
            $table->enum('type', ['audit', 'automation', 'transformation', 'formation', 'integration'])->default('transformation');
            $table->string('practice')->nullable();
            $table->enum('statut', ['draft', 'active', 'on_hold', 'completed', 'archived'])->default('draft');
            $table->date('deadline')->nullable();
            $table->text('note')->nullable();
            $table->string('next_action')->nullable();
            $table->date('next_action_date')->nullable();
            $table->enum('last_channel', ['whatsapp', 'email', 'call', 'meeting'])->nullable();
            $table->timestamp('last_contact_at')->nullable();
            $table->timestamps();
        });

        Schema::create('livrables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('responsable_id')->nullable()->constrained('collaborateurs')->nullOnDelete();
            $table->string('nom');
            $table->string('type_livrable')->nullable();
            $table->string('version')->default('v1');
            $table->enum('statut', ['draft', 'review', 'validated', 'sent', 'feedback', 'approved', 'archived'])->default('draft');
            $table->boolean('dir_validated')->default(false);
            $table->unsignedSmallInteger('ar_count')->default(0);
            $table->string('url')->nullable();
            $table->date('deadline_envoi')->nullable();
            $table->date('deadline_validation')->nullable();
            $table->timestamps();
        });

        Schema::create('mission_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collaborateur_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['action', 'note', 'status', 'livrable'])->default('note');
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mission_logs');
        Schema::dropIfExists('livrables');
        Schema::dropIfExists('missions');
    }
};
