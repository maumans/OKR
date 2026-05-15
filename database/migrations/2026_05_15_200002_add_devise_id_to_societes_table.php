<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('societes', function (Blueprint $table) {
            $table->foreignId('devise_id')->nullable()->after('layout_mode')
                  ->constrained('devises')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('societes', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Devise::class);
            $table->dropColumn('devise_id');
        });
    }
};
