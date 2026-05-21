<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\Departement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CollaborateurController extends Controller
{
    public function index(Request $request)
    {
        $societeId = session('societe_id');
        $collab = $request->user()->collaborateurActuel();
        $isManager = $collab?->estManager();
        $deptId = $collab?->departement_id;

        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->with(['user:id,email', 'departement:id,nom,couleur'])
            // Manager : seulement son département
            ->when($isManager && $deptId, fn ($q) => $q->where('departement_id', $deptId))
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%")
                      ->orWhere('poste', 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role', $role);
            })
            ->when($request->departement_id, function ($query, $departementId) {
                $query->where('departement_id', $departementId);
            })
            ->when($request->has('actif'), function ($query) use ($request) {
                $query->where('actif', $request->boolean('actif'));
            })
            ->orderBy('prenom')
            ->paginate(15)
            ->withQueryString();

        $baseQuery = Collaborateur::where('societe_id', $societeId)
            ->when($isManager && $deptId, fn ($q) => $q->where('departement_id', $deptId));

        $stats = [
            'total'         => (clone $baseQuery)->count(),
            'actifs'        => (clone $baseQuery)->where('actif', true)->count(),
            'admins'        => (clone $baseQuery)->where('role', 'admin')->count(),
            'directeurs'    => (clone $baseQuery)->where('role', 'directeur')->count(),
            'managers'      => (clone $baseQuery)->where('role', 'manager')->count(),
            'collaborateurs'=> (clone $baseQuery)->where('role', 'collaborateur')->count(),
        ];

        $departements = Departement::where('societe_id', $societeId)->actifs()->ordonne()->get(['id', 'nom', 'couleur']);

        return Inertia::render('Collaborateurs/Index', [
            'collaborateurs' => $collaborateurs,
            'filters'        => $request->only(['search', 'role', 'actif', 'departement_id']),
            'stats'          => $stats,
            'departements'   => $departements,
        ]);
    }

    public function create()
    {
        $societeId = session('societe_id');
        $departements = Departement::where('societe_id', $societeId)->actifs()->ordonne()->get(['id', 'nom', 'couleur']);

        return Inertia::render('Collaborateurs/Create', [
            'departements' => $departements,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'            => 'required|string|max:255',
            'prenom'         => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'poste'          => 'nullable|string|max:255',
            'role'           => 'required|in:admin,directeur,manager,collaborateur',
            'departement_id' => 'nullable|exists:departements,id',
        ]);

        $societeId = session('societe_id');

        // Manager ne peut créer que des collaborateurs dans son propre département
        $currentCollab = $request->user()->collaborateurActuel();
        if ($currentCollab?->estManager()) {
            $validated['departement_id'] = $currentCollab->departement_id;
            if (!in_array($validated['role'], ['collaborateur'])) {
                abort(403, 'Un manager ne peut créer que des collaborateurs.');
            }
        }

        $user = User::create([
            'name'     => "{$validated['prenom']} {$validated['nom']}",
            'email'    => $validated['email'],
            'password' => Hash::make('password'),
        ]);

        Collaborateur::create([
            'user_id'        => $user->id,
            'societe_id'     => $societeId,
            'departement_id' => $validated['departement_id'] ?? null,
            'nom'            => $validated['nom'],
            'prenom'         => $validated['prenom'],
            'poste'          => $validated['poste'] ?? null,
            'role'           => $validated['role'],
        ]);

        return redirect()
            ->route('collaborateurs.index')
            ->with('success', 'Collaborateur créé avec succès.');
    }

    public function show(Collaborateur $collaborateur)
    {
        $this->authorizeAccess($collaborateur);

        $collaborateur->load([
            'user:id,email',
            'departement:id,nom,couleur',
            'objectifs' => fn ($q) => $q->with('resultatsCles')->latest()->take(5),
            'taches' => fn ($q) => $q->latest()->take(10),
        ]);

        $stats = [
            'objectifs_actifs'   => $collaborateur->objectifs()->where('statut', 'actif')->count(),
            'objectifs_termines' => $collaborateur->objectifs()->where('statut', 'termine')->count(),
            'taches_en_cours'    => $collaborateur->taches()->where('statut', 'en_cours')->count(),
            'taches_terminees'   => $collaborateur->taches()->where('statut', 'termine')->count(),
        ];

        return Inertia::render('Collaborateurs/Show', [
            'collaborateur' => $collaborateur,
            'stats'         => $stats,
        ]);
    }

    public function edit(Collaborateur $collaborateur)
    {
        $this->authorizeAccess($collaborateur);

        $societeId = session('societe_id');
        $collaborateur->load('user:id,email');
        $departements = Departement::where('societe_id', $societeId)->actifs()->ordonne()->get(['id', 'nom', 'couleur']);

        return Inertia::render('Collaborateurs/Edit', [
            'collaborateur' => $collaborateur,
            'departements'  => $departements,
        ]);
    }

    public function update(Request $request, Collaborateur $collaborateur)
    {
        $this->authorizeAccess($collaborateur);

        $validated = $request->validate([
            'nom'            => 'required|string|max:255',
            'prenom'         => 'required|string|max:255',
            'email'          => ['required', 'email', Rule::unique('users', 'email')->ignore($collaborateur->user_id)],
            'poste'          => 'nullable|string|max:255',
            'role'           => 'required|in:admin,directeur,manager,collaborateur',
            'departement_id' => 'nullable|exists:departements,id',
            'actif'          => 'boolean',
        ]);

        // Manager : ne peut pas changer le département ni élever le rôle
        $currentCollab = $request->user()->collaborateurActuel();
        if ($currentCollab?->estManager()) {
            $validated['departement_id'] = $currentCollab->departement_id;
            if (!in_array($validated['role'], ['collaborateur'])) {
                abort(403, 'Un manager ne peut pas modifier le rôle en dehors de collaborateur.');
            }
        }

        $collaborateur->update([
            'nom'            => $validated['nom'],
            'prenom'         => $validated['prenom'],
            'poste'          => $validated['poste'] ?? null,
            'role'           => $validated['role'],
            'departement_id' => $validated['departement_id'] ?? null,
            'actif'          => $validated['actif'] ?? $collaborateur->actif,
        ]);

        if ($collaborateur->user) {
            $collaborateur->user->update([
                'name'  => "{$validated['prenom']} {$validated['nom']}",
                'email' => $validated['email'],
            ]);
        }

        return redirect()
            ->route('collaborateurs.index')
            ->with('success', 'Collaborateur mis à jour.');
    }

    public function toggleActif(Collaborateur $collaborateur)
    {
        $this->authorizeAccess($collaborateur);

        $collaborateur->update(['actif' => !$collaborateur->actif]);

        $msg = $collaborateur->actif ? 'Collaborateur activé.' : 'Collaborateur désactivé.';

        return redirect()->back()->with('success', $msg);
    }

    public function destroy(Collaborateur $collaborateur)
    {
        $this->authorizeAccess($collaborateur);

        $collaborateur->delete();

        return redirect()
            ->route('collaborateurs.index')
            ->with('success', 'Collaborateur supprimé.');
    }

    /**
     * Vérifie que l'utilisateur courant a le droit d'accéder à ce collaborateur.
     * Un manager ne peut accéder qu'aux collaborateurs de son département.
     */
    private function authorizeAccess(Collaborateur $collaborateur): void
    {
        $societeId = session('societe_id');

        // Doit appartenir à la même société
        if ($collaborateur->societe_id !== $societeId) {
            abort(403);
        }

        $currentCollab = auth()->user()->collaborateurActuel();

        // Admin/Directeur : accès global
        if ($currentCollab?->aAccesGlobal()) return;

        // Manager : seulement son département
        if ($currentCollab?->estManager()) {
            if ($collaborateur->departement_id !== $currentCollab->departement_id) {
                abort(403, 'Vous ne pouvez accéder qu\'aux collaborateurs de votre département.');
            }
            return;
        }

        // Collaborateur simple : uniquement son propre profil
        if ($collaborateur->id !== $currentCollab?->id) {
            abort(403);
        }
    }
}
