<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    public function updated(User $user): void
    {
        if ($user->wasChanged('is_superadmin')) {
            $action = $user->is_superadmin ? 'user.promouvoir_superadmin' : 'user.revoquer_superadmin';
            $desc = $user->is_superadmin
                ? "Utilisateur « {$user->name} » promu super-administrateur."
                : "Droits super-administrateur révoqués pour « {$user->name} ».";

            audit($action, $desc, ['user_id' => $user->id]);
        }
    }
}
