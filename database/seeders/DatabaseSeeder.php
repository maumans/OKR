<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DeviseSeeder::class,
            SocieteSeeder::class,
            CollaborateurSeeder::class,
            ParametreOKRSeeder::class,
            OKRSeeder::class,
            TacheSeeder::class,
            ProspectSeeder::class,
        ]);
    }
}
