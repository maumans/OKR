<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SocieteController extends Controller
{
    public function index()
    {
        $societes = \App\Models\Societe::withCount('collaborateurs')->latest()->get();

        return \Inertia\Inertia::render('SuperAdmin/Societes/Index', [
            'societes' => $societes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'admin_nom' => 'required|string|max:255',
            'admin_email' => 'required|email|max:255',
            // d'autres champs de config société si nécessaire
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            // 1. Créer la société (le seeder par défaut sera déclenché par l'event created)
            $societe = \App\Models\Societe::create([
                'nom' => $validated['nom'],
                'email' => $validated['email'],
                'layout_mode' => 'sidebar',
                'mode_sombre' => false,
            ]);

            // 2. Créer ou récupérer le User
            $password = \Illuminate\Support\Str::random(10);
            $user = \App\Models\User::firstOrCreate(
                ['email' => $validated['admin_email']],
                [
                    'name' => $validated['admin_nom'],
                    'password' => \Illuminate\Support\Facades\Hash::make($password),
                ]
            );

            // 3. Créer le Collaborateur (Admin)
            \App\Models\Collaborateur::create([
                'user_id' => $user->id,
                'societe_id' => $societe->id,
                'nom' => $validated['admin_nom'],
                'email' => $validated['admin_email'],
                'role' => 'admin',
                'actif' => true,
            ]);

            // 4. Envoyer l'email d'invitation (seulement si le mot de passe vient d'être généré)
            // On peut envoyer systématiquement ou vérifier if ($user->wasRecentlyCreated)
            \Illuminate\Support\Facades\Mail::to($user->email)->send(
                new \App\Mail\AdminInvitation($societe, $user, $user->wasRecentlyCreated ? $password : 'Votre mot de passe existant')
            );
        });

        return redirect()->back()->with('success', 'Société et compte administrateur créés avec succès.');
    }

    public function show(\App\Models\Societe $societe)
    {
        $societe->loadCount('collaborateurs');
        
        $administrateurs = $societe->collaborateurs()->where('role', 'admin')->get();
        
        return \Inertia\Inertia::render('SuperAdmin/Societes/Show', [
            'societe' => $societe,
            'administrateurs' => $administrateurs,
        ]);
    }
}
