<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bilans_journaliers', function (Blueprint $table) {
            $table->unsignedInteger('seminaires')->default(0)->after('blocages');
            $table->unsignedInteger('recherches')->default(0)->after('seminaires');
            $table->unsignedInteger('prospection')->default(0)->after('recherches');
            $table->unsignedInteger('rdv')->default(0)->after('prospection');
            $table->unsignedInteger('delivery')->default(0)->after('rdv');
        });
    }

    public function down(): void
    {
        Schema::table('bilans_journaliers', function (Blueprint $table) {
            $table->dropColumn(['seminaires', 'recherches', 'prospection', 'rdv', 'delivery']);
        });
    }
};
