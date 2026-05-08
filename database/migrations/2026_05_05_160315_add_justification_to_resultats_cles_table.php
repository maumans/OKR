<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->text('justification')->nullable()->after('progression');
        });
    }

    public function down(): void
    {
        Schema::table('resultats_cles', function (Blueprint $table) {
            $table->dropColumn('justification');
        });
    }
};
