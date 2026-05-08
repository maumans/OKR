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
        Schema::table('prospects', function (Blueprint $table) {
            $table->decimal('valeur', 15, 2)->nullable()->after('secteur');
            $table->foreignId('collaborateur_id')->nullable()->after('societe_id')->constrained('collaborateurs')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropForeign(['collaborateur_id']);
            $table->dropColumn(['valeur', 'collaborateur_id']);
        });
    }
};
