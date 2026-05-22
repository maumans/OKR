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
     * Admin/Directeur : accès global à la société.
     * Manager : accès à toute la société (ou à son département si configuré).
     * Collaborateur : uniquement ses propres objectifs.
     */
    private function peutAcceder(User $user, Objectif $objectif): bool
    {
        $collab = $user->collaborateurActuel();
        if (!$collab) return false;

        // Admin ou Directeur : accès global
        if ($collab->aAccesGlobal()) return true;

        // Manager : accès à tout son département ; si les départements ne sont pas configurés
        // (departement_id null), accès à toute la société pour ne pas bloquer les PME
        if ($collab->estManager()) {
            $cible = $objectif->collaborateur;
            if (!$cible) return false;

            // Pas de département configuré → accès à toute la société
            if (!$collab->departement_id || !$cible->departement_id) return true;

            // Même département
            return $cible->departement_id === $collab->departement_id;
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
        if (!$collab) {
            return Response::deny('Collaborateur non trouvé.');
        }

        // Propriétaire peut toujours modifier son propre objectif
        if ($objectif->collaborateur_id === $collab->id) {
            return Response::allow();
        }

        // Responsable avec accès peut modifier
        if ($this->peutAcceder($user, $objectif)) {
            return Response::allow();
        }

        return Response::deny('Vous n\'êtes pas autorisé à modifier cet objectif.');
    }

    public function delete(User $user, Objectif $objectif): Response
    {
        return $this->update($user, $objectif);
    }
}
