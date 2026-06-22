<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->string('poste_contact')->nullable()->after('contact');
            $table->unsignedTinyInteger('score_fit')->nullable()->after('probabilite');
            $table->unsignedTinyInteger('score_engagement')->nullable()->after('score_fit');
        });
    }

    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropColumn(['poste_contact', 'score_fit', 'score_engagement']);
        });
    }
};
