<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->string('categorie_autre')->nullable()->after('categorie');
        });
    }

    public function down(): void
    {
        Schema::table('taches_daily', function (Blueprint $table) {
            $table->dropColumn('categorie_autre');
        });
    }
};
