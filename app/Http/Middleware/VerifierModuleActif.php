<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifierModuleActif
{
    public function handle(Request $request, Closure $next, string $codeModule): Response
    {
        $societe = $request->user()?->collaborateurActuel()?->societe;

        if (!$societe) {
            abort(403, 'Société non identifiée.');
        }

        if (!$societe->aModule($codeModule)) {
            abort(403, "Le module « {$codeModule} » n'est pas activé pour votre société.");
        }

        return $next($request);
    }
}
