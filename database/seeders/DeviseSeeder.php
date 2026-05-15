<?php

namespace Database\Seeders;

use App\Models\Devise;
use Illuminate\Database\Seeder;

class DeviseSeeder extends Seeder
{
    public function run(): void
    {
        $devises = [
            ['code' => 'GNF', 'nom' => 'Franc Guinéen',          'symbole' => 'GF',  'decimales' => 0, 'actif' => true],
            ['code' => 'XOF', 'nom' => 'Franc CFA (UEMOA)',       'symbole' => 'FCFA','decimales' => 0, 'actif' => true],
            ['code' => 'XAF', 'nom' => 'Franc CFA (CEMAC)',       'symbole' => 'FCFA','decimales' => 0, 'actif' => true],
            ['code' => 'CDF', 'nom' => 'Franc Congolais',         'symbole' => 'FC',  'decimales' => 0, 'actif' => true],
            ['code' => 'MAD', 'nom' => 'Dirham Marocain',         'symbole' => 'DH',  'decimales' => 2, 'actif' => true],
            ['code' => 'DZD', 'nom' => 'Dinar Algérien',          'symbole' => 'DA',  'decimales' => 2, 'actif' => true],
            ['code' => 'TND', 'nom' => 'Dinar Tunisien',          'symbole' => 'DT',  'decimales' => 3, 'actif' => true],
            ['code' => 'EUR', 'nom' => 'Euro',                    'symbole' => '€',   'decimales' => 2, 'actif' => true],
            ['code' => 'USD', 'nom' => 'Dollar Américain',        'symbole' => '$',   'decimales' => 2, 'actif' => true],
        ];

        foreach ($devises as $devise) {
            Devise::firstOrCreate(['code' => $devise['code']], $devise);
        }
    }
}
