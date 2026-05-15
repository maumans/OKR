<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bilans_journaliers', function (Blueprint $table) {
            $table->text('priorites_demain')->nullable()->after('blocages');
        });
    }

    public function down(): void
    {
        Schema::table('bilans_journaliers', function (Blueprint $table) {
            $table->dropColumn('priorites_demain');
        });
    }
};
