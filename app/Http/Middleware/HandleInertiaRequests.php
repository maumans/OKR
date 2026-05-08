<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $collaborateur = $user?->collaborateurActuel();
        $societe = $collaborateur?->societe;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'collaborateur' => $collaborateur ? [
                    'id' => $collaborateur->id,
                    'nom' => $collaborateur->nom,
                    'prenom' => $collaborateur->prenom,
                    'poste' => $collaborateur->poste,
                    'role' => $collaborateur->role,
                    'actif' => $collaborateur->actif,
                    'nom_complet' => $collaborateur->nomComplet(),
                ] : null,
                'societe' => $societe ? [
                    'id' => $societe->id,
                    'nom' => $societe->nom,
                    'logo' => $societe->logo,
                    'couleur_primaire' => $societe->couleur_primaire,
                    'couleur_secondaire' => $societe->couleur_secondaire,
                    'mode_sombre' => $societe->mode_sombre,
                    'layout_mode' => $societe->layout_mode ?? 'sidebar',
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
