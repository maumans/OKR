<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\Collaborateur;
use App\Models\Module;
use App\Models\Role;
use App\Models\Societe;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class SocieteController extends Controller
{
    public function index(Request $request)
    {
        $query = Societe::withCount('collaborateurs')
            ->with(['abonnementActif', 'modulesActifs'])
            ->latest();

        if ($request->search) {
            $query->where('nom', 'like', "%{$request->search}%");
        }
        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        $societes = $query->paginate(20)->withQueryString();

        return Inertia::render('SuperAdmin/Societes/Index', [
            'societes' => $societes,
            'filters'  => $request->only(['search', 'statut']),
        ]);
    }

    public function create()
    {
        $modules = Module::where('actif', true)->orderBy('ordre')->get();
        $devises = \App\Models\Devise::where('actif', true)->orderBy('code')->get();
        $utilisateurs = User::orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('SuperAdmin/Societes/Create', [
            'modules'      => $modules,
            'devises'      => $devises,
            'utilisateurs' => $utilisateurs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'                 => 'required|string|max:255',
            'email'               => 'nullable|email|max:255',
            'layout_mode'         => 'nullable|in:sidebar,topbar',
            'devise_id'           => 'nullable|exists:devises,id',
            'couleur_primaire'    => 'nullable|string|max:20',
            'modules_actifs'      => 'nullable|array',
            'modules_actifs.*'    => 'exists:modules,id',
            // Plan
            'plan'                => 'nullable|in:starter,pro,enterprise',
            'prix_mensuel'        => 'nullable|numeric|min:0',
            'limite_utilisateurs' => 'nullable|integer|min:1',
            'limite_okr'          => 'nullable|integer|min:1',
            // Admin
            'user_id'             => 'nullable|exists:users,id',
            'admin_prenom'        => 'required_without:user_id|nullable|string|max:255',
            'admin_nom'           => 'required_without:user_id|nullable|string|max:255',
            'admin_email'         => 'required_without:user_id|nullable|email|max:255',
            'admin_password'      => 'required_without:user_id|nullable|string|min:6',
            'envoyer_email'       => 'boolean',
        ]);

        $societe = null;
        $userCreated = null;
        $newUserCreated = false;
        $password = $validated['admin_password'] ?? null;

        DB::transaction(function () use ($validated, &$societe, &$userCreated, &$newUserCreated, $password) {
            // 1. Créer la société
            $societe = Societe::create([
                'nom'              => $validated['nom'],
                'email'            => $validated['email'] ?? null,
                'layout_mode'      => $validated['layout_mode'] ?? 'sidebar',
                'devise_id'        => $validated['devise_id'] ?? null,
                'couleur_primaire' => $validated['couleur_primaire'] ?? '#3b82f6',
                'mode_sombre'      => false,
                'statut'           => 'actif',
            ]);

            // 2. Activer/désactiver les modules selon la sélection du wizard
            if (!empty($validated['modules_actifs'])) {
                $modulesActifsIds = $validated['modules_actifs'];
                foreach ($societe->modules as $module) {
                    $shouldBeActif = $module->est_core || in_array($module->id, $modulesActifsIds);
                    $societe->modules()->updateExistingPivot($module->id, [
                        'actif'     => $shouldBeActif,
                        'active_le' => $shouldBeActif ? now() : null,
                    ]);
                }
            }

            // 3. Abonnement
            if (!empty($validated['plan'])) {
                Abonnement::create([
                    'societe_id'          => $societe->id,
                    'plan'                => $validated['plan'],
                    'prix_mensuel'        => $validated['prix_mensuel'] ?? 0,
                    'date_debut'          => now()->toDateString(),
                    'statut'              => 'actif',
                    'limite_utilisateurs' => $validated['limite_utilisateurs'] ?? 5,
                    'limite_okr'          => $validated['limite_okr'] ?? null,
                ]);
            }

            // 4. User admin
            if (!empty($validated['user_id'])) {
                $userCreated = User::findOrFail($validated['user_id']);
                $newUserCreated = false;
                $prenom = $validated['admin_prenom'] ?: (explode(' ', $userCreated->name)[0] ?? '');
                $nom = $validated['admin_nom'] ?: (explode(' ', $userCreated->name, 2)[1] ?? $userCreated->name);
            } else {
                $userCreated = User::firstOrCreate(
                    ['email' => $validated['admin_email']],
                    [
                        'name'     => trim(($validated['admin_prenom'] ?? '') . ' ' . ($validated['admin_nom'] ?? '')),
                        'password' => Hash::make($validated['admin_password']),
                    ]
                );
                $newUserCreated = $userCreated->wasRecentlyCreated;
                $prenom = $validated['admin_prenom'] ?? (explode(' ', $userCreated->name)[0] ?? '');
                $nom = $validated['admin_nom'] ?? (explode(' ', $userCreated->name, 2)[1] ?? $userCreated->name);
            }

            // 5. Créer ou associer le collaborateur
            $collaborateur = Collaborateur::where('user_id', $userCreated->id)
                ->where('societe_id', $societe->id)
                ->first();

            if (!$collaborateur) {
                $collaborateur = Collaborateur::create([
                    'user_id'    => $userCreated->id,
                    'societe_id' => $societe->id,
                    'prenom'     => $prenom ?: 'Admin',
                    'nom'        => $nom ?: $societe->nom,
                    'poste'      => 'Administrateur',
                    'actif'      => true,
                ]);
            } else {
                $collaborateur->update(['actif' => true]);
            }

            // 6. Associer impérativement le rôle "admin" dans la table pivot collaborateur_role
            $roleAdmin = Role::where('code', 'admin')->first();
            if ($roleAdmin) {
                $collaborateur->roles()->syncWithoutDetaching([$roleAdmin->id]);
            }
        });

        // Email hors transaction
        $emailSent = false;
        if (!empty($validated['envoyer_email']) && $userCreated) {
            try {
                \Illuminate\Support\Facades\Mail::to($userCreated->email)->send(
                    new \App\Mail\AdminInvitation($societe, $userCreated, $newUserCreated ? $password : 'Votre mot de passe existant')
                );
                $emailSent = true;
            } catch (\Throwable) {}
        }

        \audit('societe.creer', "Société « {$societe->nom} » créée.", ['societe_id' => $societe->id], $societe->id);

        $message = "Société « {$societe->nom} » créée avec succès.";
        if ($newUserCreated && !$emailSent && $password) {
            $message .= " Mot de passe temporaire : {$password}";
        }

        return redirect()->route('superadmin.societes.show', $societe)->with('success', $message);
    }

    public function show(Societe $societe)
    {
        $societe->load([
            'collaborateurs.user',
            'collaborateurs.roles',
            'collaborateurs.departement',
            'modules',
            'abonnements.devise',
            'auditLogs' => fn ($q) => $q->latest()->limit(20),
        ]);
        $societe->loadCount('collaborateurs', 'objectifs');

        $modules = Module::where('actif', true)->orderBy('ordre')->get();
        $administrateurs = $societe->collaborateurs->filter(fn ($c) => $c->roles->contains('code', 'admin'))->values();

        return Inertia::render('SuperAdmin/Societes/Show', [
            'societe'         => $societe,
            'modules'         => $modules,
            'administrateurs' => $administrateurs,
        ]);
    }

    public function edit(Societe $societe)
    {
        $devises = \App\Models\Devise::where('actif', true)->orderBy('code')->get();

        return Inertia::render('SuperAdmin/Societes/Edit', [
            'societe' => $societe,
            'devises' => $devises,
        ]);
    }

    public function update(Request $request, Societe $societe)
    {
        $validated = $request->validate([
            'nom'              => 'required|string|max:255',
            'email'            => 'nullable|email|max:255',
            'layout_mode'      => 'nullable|in:sidebar,topbar',
            'devise_id'        => 'nullable|exists:devises,id',
            'couleur_primaire' => 'nullable|string|max:20',
        ]);

        $societe->update($validated);
        \audit('societe.modifier', "Société « {$societe->nom} » modifiée.", ['societe_id' => $societe->id], $societe->id);

        return redirect()->back()->with('success', "Société « {$societe->nom} » mise à jour.");
    }

    public function destroy(Societe $societe)
    {
        $nom = $societe->nom;
        \audit('societe.supprimer', "Société « {$nom} » supprimée.", ['societe_id' => $societe->id]);
        $societe->delete();

        return redirect()->route('superadmin.societes.index')->with('success', "Société « {$nom} » supprimée.");
    }

    public function toggleModule(Request $request, Societe $societe, Module $module)
    {
        if ($module->est_core) {
            return redirect()->back()->withErrors(['module' => 'Les modules cœur ne peuvent pas être désactivés ici.']);
        }

        $pivot = $societe->modules()->where('module_id', $module->id)->first();
        $actuellementActif = $pivot ? (bool) $pivot->pivot->actif : false;

        if ($actuellementActif) {
            $societe->modules()->updateExistingPivot($module->id, [
                'actif'        => false,
                'desactive_le' => now(),
            ]);
            \audit('module.desactive', "Module « {$module->nom} » désactivé pour « {$societe->nom} ».", ['module_code' => $module->code], $societe->id);
            return redirect()->back()->with('success', "Module « {$module->nom} » désactivé.");
        } else {
            if ($pivot) {
                $societe->modules()->updateExistingPivot($module->id, [
                    'actif'              => true,
                    'active_le'          => now(),
                    'desactive_le'       => null,
                    'active_par_user_id' => auth()->id(),
                ]);
            } else {
                $societe->modules()->attach($module->id, [
                    'actif'              => true,
                    'active_le'          => now(),
                    'active_par_user_id' => auth()->id(),
                ]);
            }
            \audit('module.active', "Module « {$module->nom} » activé pour « {$societe->nom} ».", ['module_code' => $module->code], $societe->id);
            return redirect()->back()->with('success', "Module « {$module->nom} » activé.");
        }
    }

    public function suspendre(Societe $societe)
    {
        $societe->update(['statut' => 'suspendu']);
        \audit('societe.suspendre', "Société « {$societe->nom} » suspendue.", ['societe_id' => $societe->id], $societe->id);
        return redirect()->back()->with('success', "Société « {$societe->nom} » suspendue.");
    }

    public function reactiver(Societe $societe)
    {
        $societe->update(['statut' => 'actif']);
        \audit('societe.reactiver', "Société « {$societe->nom} » réactivée.", ['societe_id' => $societe->id], $societe->id);
        return redirect()->back()->with('success', "Société « {$societe->nom} » réactivée.");
    }
}
