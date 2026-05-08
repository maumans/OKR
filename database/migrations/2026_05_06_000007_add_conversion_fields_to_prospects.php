<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dateTime('date_premier_contact')->nullable()->after('prochain_rdv');
            $table->dateTime('date_conversion')->nullable()->after('date_premier_contact');
            $table->string('source')->nullable()->after('date_conversion');         // site_web, referral, appel_froid, salon
            $table->decimal('montant_final', 12, 2)->nullable()->after('source');   // montant réel signé
        });
    }

    public function down(): void
    {
        Schema::table('prospects', function (Blueprint $table) {
            $table->dropColumn(['date_premier_contact', 'date_conversion', 'source', 'montant_final']);
        });
    }
};
