<?php

namespace Database\Seeders;

use App\Models\Prospect;
use App\Models\Societe;
use Illuminate\Database\Seeder;

class ProspectSeeder extends Seeder
{
    public function run(): void
    {
        $societe = Societe::first();

        $prospects = [
            ['nom' => 'TechCorp Guinée', 'contact' => '+224 622 111 111', 'secteur' => 'Technologie', 'statut' => 'qualifie'],
            ['nom' => 'BanquePlus SA', 'contact' => '+224 623 222 222', 'secteur' => 'Finance', 'statut' => 'proposition'],
            ['nom' => 'MinesStar', 'contact' => '+224 624 333 333', 'secteur' => 'Mines', 'statut' => 'nouveau'],
            ['nom' => 'AgriVert', 'contact' => '+224 625 444 444', 'secteur' => 'Agriculture', 'statut' => 'contacte'],
            ['nom' => 'EduForward', 'contact' => '+224 626 555 555', 'secteur' => 'Éducation', 'statut' => 'gagne'],
            ['nom' => 'SantéPlus', 'contact' => '+224 627 666 666', 'secteur' => 'Santé', 'statut' => 'nouveau'],
            ['nom' => 'LogiTrans SARL', 'contact' => '+224 628 777 777', 'secteur' => 'Transport', 'statut' => 'contacte'],
        ];

        foreach ($prospects as $data) {
            Prospect::create([
                'societe_id' => $societe->id,
                'nom' => $data['nom'],
                'contact' => $data['contact'],
                'secteur' => $data['secteur'],
                'statut' => $data['statut'],
                'prochain_rdv' => now()->addDays(rand(1, 14)),
            ]);
        }
    }
}
