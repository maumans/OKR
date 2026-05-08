<?php

namespace App\Policies;

use App\Models\Prospect;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ProspectPolicy
{
    private function belongsToSameSociete(User $user, Prospect $prospect): bool
    {
        return $user->collaborateurActuel()?->societe_id === $prospect->societe_id;
    }

    public function viewAny(User $user): bool
    {
        return $user->collaborateurActuel() !== null;
    }

    public function view(User $user, Prospect $prospect): Response
    {
        return $this->belongsToSameSociete($user, $prospect)
            ? Response::allow()
            : Response::deny('Vous n\'avez pas accès à ce prospect.');
    }

    public function create(User $user): bool
    {
        return $user->collaborateurActuel() !== null;
    }

    public function update(User $user, Prospect $prospect): Response
    {
        if (!$this->belongsToSameSociete($user, $prospect)) {
            return Response::deny('Action non autorisée.');
        }

        $collabId = $user->collaborateurActuel()->id;

        // Si le prospect est assigné, seul l'assigné ou un manager peut le modifier
        if ($prospect->collaborateur_id !== null && $prospect->collaborateur_id !== $collabId && !$user->estResponsable()) {
            return Response::deny('Ce prospect est assigné à un autre commercial.');
        }

        return Response::allow();
    }

    public function delete(User $user, Prospect $prospect): Response
    {
        if (!$this->belongsToSameSociete($user, $prospect)) {
            return Response::deny('Action non autorisée.');
        }

        return $user->estResponsable() 
            ? Response::allow() 
            : Response::deny('Seul un manager peut supprimer un prospect.');
    }
}
