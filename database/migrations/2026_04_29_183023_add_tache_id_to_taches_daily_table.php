<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->foreignId('tache_id')->nullable()->constrained('taches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->dropForeign(['tache_id']);
            $table->dropColumn('tache_id');
        });
    }
};
