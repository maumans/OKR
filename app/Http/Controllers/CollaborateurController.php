<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
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

        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->with('user:id,email')
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
            ->when($request->has('actif'), function ($query) use ($request) {
                $query->where('actif', $request->boolean('actif'));
            })
            ->orderBy('prenom')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Collaborateurs/Index', [
            'collaborateurs' => $collaborateurs,
            'filters' => $request->only(['search', 'role', 'actif']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Collaborateurs/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'poste' => 'nullable|string|max:255',
            'role' => 'required|in:admin,manager,collaborateur',
        ]);

        $societeId = session('societe_id');

        // Créer le user
        $user = User::create([
            'name' => "{$validated['prenom']} {$validated['nom']}",
            'email' => $validated['email'],
            'password' => Hash::make('password'), // Mot de passe par défaut
        ]);

        // Créer le collaborateur
        Collaborateur::create([
            'user_id' => $user->id,
            'societe_id' => $societeId,
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'poste' => $validated['poste'],
            'role' => $validated['role'],
        ]);

        return redirect()
            ->route('collaborateurs.index')
            ->with('success', 'Collaborateur créé avec succès.');
    }

    public function show(Collaborateur $collaborateur)
    {
        $collaborateur->load([
            'user:id,email',
            'objectifs' => fn ($q) => $q->with('resultatsCles')->latest()->take(5),
            'taches' => fn ($q) => $q->latest()->take(10),
        ]);

        // Statistiques du collaborateur
        $stats = [
            'objectifs_actifs' => $collaborateur->objectifs()->where('statut', 'actif')->count(),
            'objectifs_termines' => $collaborateur->objectifs()->where('statut', 'termine')->count(),
            'taches_en_cours' => $collaborateur->taches()->where('statut', 'en_cours')->count(),
            'taches_terminees' => $collaborateur->taches()->where('statut', 'termine')->count(),
        ];

        return Inertia::render('Collaborateurs/Show', [
            'collaborateur' => $collaborateur,
            'stats' => $stats,
        ]);
    }

    public function edit(Collaborateur $collaborateur)
    {
        $collaborateur->load('user:id,email');

        return Inertia::render('Collaborateurs/Edit', [
            'collaborateur' => $collaborateur,
        ]);
    }

    public function update(Request $request, Collaborateur $collaborateur)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($collaborateur->user_id)],
            'poste' => 'nullable|string|max:255',
            'role' => 'required|in:admin,manager,collaborateur',
            'actif' => 'boolean',
        ]);

        $collaborateur->update([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'poste' => $validated['poste'],
            'role' => $validated['role'],
            'actif' => $validated['actif'] ?? $collaborateur->actif,
        ]);

        $collaborateur->user->update([
            'name' => "{$validated['prenom']} {$validated['nom']}",
            'email' => $validated['email'],
        ]);

        return redirect()
            ->route('collaborateurs.index')
            ->with('success', 'Collaborateur mis à jour.');
    }

    public function destroy(Collaborateur $collaborateur)
    {
        $collaborateur->delete();

        return redirect()
            ->route('collaborateurs.index')
            ->with('success', 'Collaborateur supprimé.');
    }
}
