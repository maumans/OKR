<?php

namespace App\Policies;

use App\Models\Objectif;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ObjectifPolicy
{
    private function belongsToSameSociete(User $user, Objectif $objectif): bool
    {
        return $user->collaborateurActuel()?->societe_id === $objectif->societe_id;
    }

    /**
     * Un manager ne peut voir/modifier que les objectifs de son département.
     * Un admin/directeur voit tout. Un simple collaborateur voit ses propres objectifs.
     */
    private function peutAcceder(User $user, Objectif $objectif): bool
    {
        $collab = $user->collaborateurActuel();
        if (!$collab) return false;

        // Admin ou Directeur : accès global
        if ($collab->aAccesGlobal()) return true;

        // Manager : seulement son département
        if ($collab->estManager()) {
            $cible = $objectif->collaborateur;
            return $cible && $cible->departement_id === $collab->departement_id;
        }

        // Collaborateur : uniquement ses propres objectifs
        return $objectif->collaborateur_id === $collab->id;
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

        $collab = $user->collaborateurActuel();

        // Objectif privé : seul le propriétaire ou un responsable avec accès peut voir
        if ($objectif->visibilite === 'prive' && $objectif->collaborateur_id !== $collab->id && !$user->estResponsable()) {
            return Response::deny('Cet objectif est privé.');
        }

        if (!$this->peutAcceder($user, $objectif)) {
            return Response::deny('Vous n\'avez pas accès à cet objectif.');
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

        $collab = $user->collaborateurActuel();

        // Propriétaire peut toujours modifier son propre objectif
        if ($objectif->collaborateur_id === $collab->id) {
            return Response::allow();
        }

        // Responsable avec accès peut modifier
        if ($user->estResponsable() && $this->peutAcceder($user, $objectif)) {
            return Response::allow();
        }

        return Response::deny('Vous n\'êtes pas autorisé à modifier cet objectif.');
    }

    public function delete(User $user, Objectif $objectif): Response
    {
        return $this->update($user, $objectif);
    }
}
