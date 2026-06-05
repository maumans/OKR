<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->decimal('montant', 15, 2)->nullable()->after('deadline');
            $table->string('email_nps_client')->nullable()->after('montant');
            $table->boolean('dir_validated')->default(false)->after('email_nps_client');
            $table->tinyInteger('nps_score')->nullable()->after('dir_validated');
        });

        // Ajoute 'en_attente_dir' à l'enum statut
        DB::statement("ALTER TABLE missions MODIFY COLUMN statut ENUM('en_attente_dir','draft','active','on_hold','completed','archived') NOT NULL DEFAULT 'en_attente_dir'");
    }

    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->dropColumn(['montant', 'email_nps_client', 'dir_validated', 'nps_score']);
        });

        DB::statement("ALTER TABLE missions MODIFY COLUMN statut ENUM('draft','active','on_hold','completed','archived') NOT NULL DEFAULT 'draft'");
    }
};
