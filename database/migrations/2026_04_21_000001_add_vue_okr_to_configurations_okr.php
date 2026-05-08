<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configurations_okr', function (Blueprint $table) {
            $table->string('vue_okr')->default('cards')->after('visibilite_defaut');
        });
    }

    public function down(): void
    {
        Schema::table('configurations_okr', function (Blueprint $table) {
            $table->dropColumn('vue_okr');
        });
    }
};
