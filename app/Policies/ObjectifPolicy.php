<?php

namespace App\Policies;

use App\Models\Objectif;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ObjectifPolicy
{
    /**
     * S'assure que l'objectif appartient à la même société que l'utilisateur.
     */
    private function belongsToSameSociete(User $user, Objectif $objectif): bool
    {
        return $user->collaborateurActuel()?->societe_id === $objectif->societe_id;
    }

    public function viewAny(User $user): bool
    {
        return $user->collaborateurActuel() !== null;
    }

    public function view(User $user, Objectif $objectif): Response
    {
        if (!$this->belongsToSameSociete($user, $objectif)) {
            return Response::deny('Vous n\'avez pas accès à cet objectif.');
        }

        $collabId = $user->collaborateurActuel()->id;

        // Si l'objectif est privé, seul le propriétaire (ou un admin/manager) peut le voir
        if ($objectif->visibilite === 'prive' && $objectif->collaborateur_id !== $collabId && !$user->estResponsable()) {
            return Response::deny('Cet objectif est privé.');
        }

        return Response::allow();
    }

    public function create(User $user): bool
    {
        return $user->collaborateurActuel() !== null;
    }

    public function update(User $user, Objectif $objectif): Response
    {
        if (!$this->belongsToSameSociete($user, $objectif)) {
            return Response::deny('Action non autorisée.');
        }

        $collabId = $user->collaborateurActuel()->id;

        // Le propriétaire ou un responsable peut modifier
        if ($objectif->collaborateur_id === $collabId || $user->estResponsable()) {
            return Response::allow();
        }

        return Response::deny('Vous n\'êtes pas autorisé à modifier cet objectif.');
    }

    public function delete(User $user, Objectif $objectif): Response
    {
        return $this->update($user, $objectif);
    }
}
