<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('societe_module', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->boolean('actif')->default(true);
            $table->timestamp('active_le')->nullable();
            $table->timestamp('desactive_le')->nullable();
            $table->foreignId('active_par_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('parametres')->nullable();
            $table->timestamps();
            $table->unique(['societe_id', 'module_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('societe_module');
    }
};
