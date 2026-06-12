<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter le rôle DRH s'il n'existe pas déjà
        if (!DB::table('roles')->where('code', 'drh')->exists()) {
            DB::table('roles')->insert([
                'code'       => 'drh',
                'nom'        => 'DRH',
                'ordre'      => 25,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('roles')->where('code', 'drh')->delete();
    }
};
