<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->foreignId('mission_id')
                ->nullable()
                ->after('tache_id')
                ->constrained('missions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Mission::class);
            $table->dropColumn('mission_id');
        });
    }
};
