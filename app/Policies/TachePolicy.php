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

    /**
     * Un manager ne peut voir/modifier que les tâches de son département.
     * Un admin/directeur voit tout.
     */
    private function peutAcceder(User $user, Tache $tache): bool
    {
        $collab = $user->collaborateurActuel();
        if (!$collab) return false;

        if ($collab->aAccesGlobal()) return true;

        if ($collab->estManager()) {
            $cible = $tache->collaborateur;
            return $cible && $cible->departement_id === $collab->departement_id;
        }

        return $tache->collaborateur_id === $collab->id;
    }

    public function viewAny(User $user): bool
    {
        return $user->collaborateurActuel() !== null;
    }

    public function view(User $user, Tache $tache): Response
    {
        if (!$this->belongsToSameSociete($user, $tache)) {
            return Response::deny('Vous n\'avez pas accès à cette tâche.');
        }

        if (!$this->peutAcceder($user, $tache)) {
            return Response::deny('Vous n\'avez pas accès à cette tâche.');
        }

        return Response::allow();
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

        $collab = $user->collaborateurActuel();

        // Assigné à la tâche peut toujours modifier
        if ($tache->collaborateur_id === $collab->id) {
            return Response::allow();
        }

        // Responsable avec accès au département peut modifier
        if ($user->estResponsable() && $this->peutAcceder($user, $tache)) {
            return Response::allow();
        }

        return Response::deny('Vous n\'êtes pas autorisé à modifier cette tâche.');
    }

    public function delete(User $user, Tache $tache): Response
    {
        return $this->update($user, $tache);
    }
}
