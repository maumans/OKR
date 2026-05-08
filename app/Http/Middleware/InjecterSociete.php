<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InjecterSociete
{
    /**
     * Injecte la société courante dans la request.
     * Si l'utilisateur n'a pas de société, redirige vers un écran de setup.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $collaborateur = $user->collaborateurActuel();

        if (!$collaborateur) {
            // L'utilisateur n'appartient à aucune société
            // On laisse passer pour le moment (sera géré côté frontend)
            return $next($request);
        }

        // Stocker en session si pas encore fait
        if (!session()->has('societe_id')) {
            session(['societe_id' => $collaborateur->societe_id]);
        }

        // Injecter dans la request pour accès facile
        $request->merge([
            'societe_courante' => $collaborateur->societe,
            'collaborateur_courant' => $collaborateur,
        ]);

        return $next($request);
    }
}
