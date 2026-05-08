<?php

namespace Database\Seeders;

use App\Models\Collaborateur;
use App\Models\Societe;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CollaborateurSeeder extends Seeder
{
    public function run(): void
    {
        $societe = Societe::first();

        // ─── SuperAdmin ──────────────────────────────────────────
        User::create([
            'name' => 'Addvalis SuperAdmin',
            'email' => 'superadmin@addvalis.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'is_superadmin' => true,
        ]);

        // ─── Admin ───────────────────────────────────────────
        $adminUser = User::create([
            'name' => 'Maurice Admin',
            'email' => 'admin@addvalis.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        Collaborateur::create([
            'user_id' => $adminUser->id,
            'societe_id' => $societe->id,
            'nom' => 'Diallo',
            'prenom' => 'Mamadou',
            'poste' => 'Directeur Général',
            'role' => 'admin',
            'actif' => true,
        ]);

        // ─── Manager ────────────────────────────────────────
        $managerUser = User::create([
            'name' => 'Sophie Martin',
            'email' => 'manager@addvalis.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        Collaborateur::create([
            'user_id' => $managerUser->id,
            'societe_id' => $societe->id,
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'poste' => 'Directrice Commerciale',
            'role' => 'manager',
            'actif' => true,
        ]);

        // ─── Collaborateurs ─────────────────────────────────
        $collabData = [
            ['nom' => 'Diallo', 'prenom' => 'Amadou', 'poste' => 'Développeur Senior', 'email' => 'amadou@addvalis.com'],
            ['nom' => 'Camara', 'prenom' => 'Fatou', 'poste' => 'Chargée Marketing', 'email' => 'fatou@addvalis.com'],
            ['nom' => 'Barry', 'prenom' => 'Ibrahima', 'poste' => 'Commercial', 'email' => 'ibrahima@addvalis.com'],
        ];

        foreach ($collabData as $data) {
            $user = User::create([
                'name' => "{$data['prenom']} {$data['nom']}",
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);

            Collaborateur::create([
                'user_id' => $user->id,
                'societe_id' => $societe->id,
                'nom' => $data['nom'],
                'prenom' => $data['prenom'],
                'poste' => $data['poste'],
                'role' => 'collaborateur',
                'actif' => true,
            ]);
        }
    }
}
