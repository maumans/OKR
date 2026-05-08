<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifierRole
{
    /**
     * Vérifie que l'utilisateur a le rôle requis dans la société courante.
     *
     * Usage : ->middleware('role:admin') ou ->middleware('role:admin,manager')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Non authentifié.');
        }

        $collaborateur = $user->collaborateurActuel();

        if (!$collaborateur) {
            abort(403, 'Aucune société associée.');
        }

        if (!in_array($collaborateur->role, $roles)) {
            abort(403, 'Accès non autorisé pour ce rôle.');
        }

        return $next($request);
    }
}
