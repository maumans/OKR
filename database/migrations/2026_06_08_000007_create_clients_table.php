<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('societe_id')->constrained('societes')->cascadeOnDelete();
            $table->string('nom', 255);
            $table->string('contact', 255)->nullable();
            $table->string('secteur', 255)->nullable();
            $table->string('site_web', 255)->nullable();
            $table->text('adresse')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('societe_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
