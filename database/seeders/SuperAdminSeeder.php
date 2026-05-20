<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@addvalis.com'],
            [
                'name'         => 'Super Admin Addvalis',
                'password'     => Hash::make('Addvalis2026!'),
                'is_superadmin' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
