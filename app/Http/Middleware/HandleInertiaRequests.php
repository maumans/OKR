<?php

namespace App\Http\Middleware;

use App\Models\NotificationApp;
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
        $collaborateur = $user?->collaborateurActuel()?->load(['departement', 'roles']);
        $societe = $collaborateur?->societe?->load('devise');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'is_superadmin' => $user->is_superadmin,
                ]) : null,
                'collaborateur' => $collaborateur ? [
                    'id'              => $collaborateur->id,
                    'nom'             => $collaborateur->nom,
                    'prenom'          => $collaborateur->prenom,
                    'poste'           => $collaborateur->poste,
                    'roles'           => $collaborateur->roles->pluck('code')->toArray(),
                    'actif'           => $collaborateur->actif,
                    'nom_complet'     => $collaborateur->nomComplet(),
                    'departement_id'  => $collaborateur->departement_id,
                    'departement'     => $collaborateur->departement ? [
                        'id'     => $collaborateur->departement->id,
                        'nom'    => $collaborateur->departement->nom,
                        'couleur'=> $collaborateur->departement->couleur,
                    ] : null,
                    'isResponsable'   => $collaborateur->estResponsable(),
                    'isAdmin'         => $collaborateur->estAdmin(),
                    'isDirecteur'     => $collaborateur->estDirecteur(),
                    'isManager'       => $collaborateur->estManager(),
                    'aAccesGlobal'    => $collaborateur->aAccesGlobal(),
                ] : null,
                'societe' => $societe ? [
                    'id'                 => $societe->id,
                    'nom'                => $societe->nom,
                    'logo'               => $societe->logo,
                    'couleur_primaire'   => $societe->couleur_primaire,
                    'couleur_secondaire' => $societe->couleur_secondaire,
                    'mode_sombre'        => $societe->mode_sombre,
                    'layout_mode'        => $societe->layout_mode ?? 'sidebar',
                    'devise' => $societe->devise ? [
                        'id'        => $societe->devise->id,
                        'code'      => $societe->devise->code,
                        'nom'       => $societe->devise->nom,
                        'symbole'   => $societe->devise->symbole,
                        'decimales' => $societe->devise->decimales,
                    ] : ['id' => null, 'code' => 'GNF', 'nom' => 'Franc Guinéen', 'symbole' => 'GF', 'decimales' => 0],
                ] : null,
            ],
            'modulesActifs' => fn () => $societe
                ? $societe->modulesActifs()->orderBy('ordre')->get(['code', 'nom', 'icone', 'couleur', 'categorie'])->toArray()
                : [],
            'impersonation' => fn () => $request->session()->has('impersonator_id') ? [
                'actif'   => true,
                'user'    => $user?->only(['id', 'name', 'email']),
                'societe' => $societe ? $societe->only(['id', 'nom']) : null,
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
            'notifications' => fn () => $user && $societe ? [
                'count' => NotificationApp::where('societe_id', $societe->id)
                    ->pourUser($user->id)
                    ->nonLues()
                    ->count(),
                'items' => NotificationApp::where('societe_id', $societe->id)
                    ->pourUser($user->id)
                    ->latest()
                    ->limit(10)
                    ->get()
                    ->map(fn ($n) => [
                        'id'         => $n->id,
                        'type'       => $n->type,
                        'titre'      => $n->titre,
                        'body'       => $n->body,
                        'data'       => $n->data,
                        'lue'        => $n->lue,
                        'created_at' => $n->created_at->toISOString(),
                        'ago'        => $n->created_at->diffForHumans(),
                    ])
                    ->toArray(),
            ] : ['count' => 0, 'items' => []],
        ];
    }
}
