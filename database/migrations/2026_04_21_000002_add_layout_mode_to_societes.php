<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('societes', function (Blueprint $table) {
            $table->string('layout_mode')->default('sidebar')->after('mode_sombre');
        });
    }

    public function down(): void
    {
        Schema::table('societes', function (Blueprint $table) {
            $table->dropColumn('layout_mode');
        });
    }
};
