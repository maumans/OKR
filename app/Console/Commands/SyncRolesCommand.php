<?php

namespace App\Console\Commands;

use App\Models\Collaborateur;
use App\Models\Role;
use Illuminate\Console\Command;

class SyncRolesCommand extends Command
{
    protected $signature = 'roles:sync';
    protected $description = 'Synchronise et attribue les rôles par défaut aux collaborateurs sans rôle';

    public function handle(): int
    {
        $roleAdmin = Role::where('code', 'admin')->first();
        $roleCollab = Role::where('code', 'collaborateur')->first();

        if (!$roleCollab) {
            $this->error("Le rôle 'collaborateur' est manquant dans la table roles.");
            return self::FAILURE;
        }

        $collabsSansRole = Collaborateur::doesntHave('roles')->get();
        $this->info("Collaborateurs sans rôle trouvés : " . $collabsSansRole->count());

        $count = 0;
        foreach ($collabsSansRole as $collab) {
            $estAdmin = false;

            // Détecter si le collaborateur est admin (poste ou nom ou user)
            if ($collab->poste && stripos($collab->poste, 'admin') !== false) {
                $estAdmin = true;
            } elseif ($collab->user && (stripos($collab->user->name, 'admin') !== false || stripos($collab->user->email, 'admin') !== false)) {
                $estAdmin = true;
            }

            if ($estAdmin && $roleAdmin) {
                $collab->roles()->sync([$roleAdmin->id]);
                $this->line("Collaborateur #{$collab->id} ({$collab->nomComplet()}) -> rôle [ADMIN]");
            } else {
                $collab->roles()->sync([$roleCollab->id]);
                $this->line("Collaborateur #{$collab->id} ({$collab->nomComplet()}) -> rôle [COLLABORATEUR]");
            }
            $count++;
        }

        $this->info("Synchronisation terminée : {$count} collaborateur(s) mis à jour.");
        return self::SUCCESS;
    }
}
