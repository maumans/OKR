<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collaborateurs', function (Blueprint $table) {
            $table->foreignId('responsable_id')->nullable()->after('departement_id')
                  ->constrained('collaborateurs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('collaborateurs', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Collaborateur::class, 'responsable_id');
            $table->dropColumn('responsable_id');
        });
    }
};
