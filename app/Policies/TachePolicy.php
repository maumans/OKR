<?php

namespace App\Policies;

use App\Models\Tache;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TachePolicy
{
    private function belongsToSameSociete(User $user, Tache $tache): bool
    {
        return $user->collaborateurActuel()?->societe_id === $tache->societe_id;
    }

    public function viewAny(User $user): bool
    {
        return $user->collaborateurActuel() !== null;
    }

    public function view(User $user, Tache $tache): Response
    {
        return $this->belongsToSameSociete($user, $tache)
            ? Response::allow()
            : Response::deny('Vous n\'avez pas accès à cette tâche.');
    }

    public function create(User $user): bool
    {
        return $user->collaborateurActuel() !== null;
    }

    public function update(User $user, Tache $tache): Response
    {
        if (!$this->belongsToSameSociete($user, $tache)) {
            return Response::deny('Action non autorisée.');
        }

        $collabId = $user->collaborateurActuel()->id;

        // Assigné à la tâche ou responsable
        if ($tache->collaborateur_id === $collabId || $user->estResponsable()) {
            return Response::allow();
        }

        return Response::deny('Vous n\'êtes pas autorisé à modifier cette tâche.');
    }

    public function delete(User $user, Tache $tache): Response
    {
        return $this->update($user, $tache);
    }
}
