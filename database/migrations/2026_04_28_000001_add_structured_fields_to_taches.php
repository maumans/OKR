<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches', function (Blueprint $table) {
            $table->string('eisenhower')->nullable()->after('priorite'); // Q1, Q2, Q3, Q4
            $table->text('mode_operatoire')->nullable()->after('description'); // JSON array of steps
            $table->text('outils')->nullable()->after('mode_operatoire'); // comma-separated or JSON
            $table->text('definition_done')->nullable()->after('outils'); // JSON array of items
        });
    }

    public function down(): void
    {
        Schema::table('taches', function (Blueprint $table) {
            $table->dropColumn(['eisenhower', 'mode_operatoire', 'outils', 'definition_done']);
        });
    }
};
