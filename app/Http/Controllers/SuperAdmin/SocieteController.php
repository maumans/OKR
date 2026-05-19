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
            'nom'            => 'required|string|max:255',
            'email'          => 'required|email|max:255',
            'admin_nom'      => 'required|string|max:255',
            'admin_email'    => 'required|email|max:255',
            'admin_password' => 'required|string|min:6',
        ]);

        $password        = null;
        $newUserCreated  = false;
        $societeCreated  = null;
        $userCreated     = null;

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, &$password, &$newUserCreated, &$societeCreated, &$userCreated) {
            // 1. Créer la société
            $societeCreated = \App\Models\Societe::create([
                'nom'         => $validated['nom'],
                'email'       => $validated['email'],
                'layout_mode' => 'sidebar',
                'mode_sombre' => false,
            ]);

            // 2. Créer ou récupérer le User
            $password = $validated['admin_password'];
            $userCreated = \App\Models\User::firstOrCreate(
                ['email' => $validated['admin_email']],
                [
                    'name'     => $validated['admin_nom'],
                    'password' => \Illuminate\Support\Facades\Hash::make($password),
                ]
            );
            $newUserCreated = $userCreated->wasRecentlyCreated;

            // 3. Créer le Collaborateur Admin
            $parts  = preg_split('/\s+/', trim($validated['admin_nom']), 2);
            $prenom = $parts[0];
            $nom    = $parts[1] ?? $parts[0];

            \App\Models\Collaborateur::create([
                'user_id'    => $userCreated->id,
                'societe_id' => $societeCreated->id,
                'prenom'     => $prenom,
                'nom'        => $nom,
                'role'       => 'admin',
                'actif'      => true,
            ]);
        });

        // Envoi email hors transaction pour ne pas bloquer la création
        $emailSent = false;
        try {
            \Illuminate\Support\Facades\Mail::to($userCreated->email)->send(
                new \App\Mail\AdminInvitation($societeCreated, $userCreated, $newUserCreated ? $password : 'Votre mot de passe existant')
            );
            $emailSent = true;
        } catch (\Exception $e) {
            // Email non configuré — le mot de passe sera affiché dans le flash
        }

        $message = "Société « {$societeCreated->nom} » et compte admin créés.";
        if ($newUserCreated && !$emailSent) {
            $message .= " Email non envoyé — mot de passe temporaire : {$password}";
        } elseif ($emailSent) {
            $message .= ' Un email d\'invitation a été envoyé.';
        }

        return redirect()->back()->with('success', $message);
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
