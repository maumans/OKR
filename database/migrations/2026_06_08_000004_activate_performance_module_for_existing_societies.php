<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Sécurité : tables requises
        if (!Schema::hasTable('modules') || !Schema::hasTable('societe_module') || !Schema::hasTable('societes')) {
            return;
        }

        $module = DB::table('modules')->where('code', 'performance')->first();
        if (!$module) {
            return; // Module pas encore seedé
        }

        $societes = DB::table('societes')->get(['id']);
        $now = now();

        foreach ($societes as $societe) {
            $exists = DB::table('societe_module')
                ->where('societe_id', $societe->id)
                ->where('module_id', $module->id)
                ->exists();

            if (!$exists) {
                DB::table('societe_module')->insert([
                    'societe_id'          => $societe->id,
                    'module_id'           => $module->id,
                    'actif'               => true,
                    'active_le'           => $now,
                    'desactive_le'        => null,
                    'active_par_user_id'  => null,
                    'parametres'          => null,
                    'created_at'          => $now,
                    'updated_at'          => $now,
                ]);
            } else {
                // Si la ligne existe mais inactif, l'activer
                DB::table('societe_module')
                    ->where('societe_id', $societe->id)
                    ->where('module_id', $module->id)
                    ->update(['actif' => true, 'active_le' => $now, 'updated_at' => $now]);
            }
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('modules') || !Schema::hasTable('societe_module')) {
            return;
        }

        $module = DB::table('modules')->where('code', 'performance')->first();
        if (!$module) {
            return;
        }

        DB::table('societe_module')
            ->where('module_id', $module->id)
            ->update(['actif' => false, 'desactive_le' => now(), 'updated_at' => now()]);
    }
};
