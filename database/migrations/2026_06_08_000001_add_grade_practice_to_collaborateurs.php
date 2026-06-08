<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collaborateurs', function (Blueprint $table) {
            $table->string('grade', 100)->nullable()->after('poste');
            $table->string('practice', 100)->nullable()->after('grade');
        });
    }

    public function down(): void
    {
        Schema::table('collaborateurs', function (Blueprint $table) {
            $table->dropColumn(['grade', 'practice']);
        });
    }
};
