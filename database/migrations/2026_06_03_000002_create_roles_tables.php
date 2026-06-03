<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('nom');
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });

        DB::table('roles')->insert([
            ['code' => 'admin',         'nom' => 'Administrateur',    'ordre' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'directeur',     'nom' => 'Directeur Général', 'ordre' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'manager',       'nom' => 'Manager',           'ordre' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'collaborateur', 'nom' => 'Collaborateur',     'ordre' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::create('collaborateur_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collaborateur_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->unique(['collaborateur_id', 'role_id']);
            $table->timestamps();
        });

        // Migrer les données existantes du champ role vers la table pivot
        $roleIds = DB::table('roles')->pluck('id', 'code');
        $collaborateurs = DB::table('collaborateurs')->select('id', 'role')->get();

        $pivotData = [];
        foreach ($collaborateurs as $collab) {
            $code = $collab->role ?? 'collaborateur';
            $roleId = $roleIds[$code] ?? $roleIds['collaborateur'];
            $pivotData[] = [
                'collaborateur_id' => $collab->id,
                'role_id'          => $roleId,
                'created_at'       => now(),
                'updated_at'       => now(),
            ];
        }

        if (!empty($pivotData)) {
            DB::table('collaborateur_role')->insert($pivotData);
        }

        Schema::table('collaborateurs', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }

    public function down(): void
    {
        Schema::table('collaborateurs', function (Blueprint $table) {
            $table->string('role', 50)->default('collaborateur');
        });

        // Restaurer le premier rôle trouvé pour chaque collaborateur
        $pivots = DB::table('collaborateur_role')
            ->join('roles', 'roles.id', '=', 'collaborateur_role.role_id')
            ->orderBy('roles.ordre')
            ->select('collaborateur_role.collaborateur_id', 'roles.code')
            ->get()
            ->groupBy('collaborateur_id');

        foreach ($pivots as $collabId => $roles) {
            DB::table('collaborateurs')
                ->where('id', $collabId)
                ->update(['role' => $roles->first()->code]);
        }

        Schema::dropIfExists('collaborateur_role');
        Schema::dropIfExists('roles');
    }
};
