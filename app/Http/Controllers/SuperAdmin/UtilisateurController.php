<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;

class UtilisateurController extends Controller
{
    public function index()
    {
        $utilisateurs = User::with('collaborateurs.societe')
            ->latest()
            ->paginate(30);

        return Inertia::render('SuperAdmin/Utilisateurs/Index', [
            'utilisateurs' => $utilisateurs,
        ]);
    }

    public function show(User $user)
    {
        $user->load('collaborateurs.societe');

        return Inertia::render('SuperAdmin/Utilisateurs/Show', [
            'utilisateur' => $user,
        ]);
    }

    public function promouvoir(User $user)
    {
        $user->update(['is_superadmin' => true]);
        \audit('user.promouvoir_superadmin', "Utilisateur « {$user->name} » promu super-administrateur.", ['user_id' => $user->id]);
        return redirect()->back()->with('success', "« {$user->name} » est maintenant super-administrateur.");
    }

    public function revoquer(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['user' => 'Vous ne pouvez pas révoquer vos propres droits superadmin.']);
        }
        $user->update(['is_superadmin' => false]);
        \audit('user.revoquer_superadmin', "Droits super-administrateur révoqués pour « {$user->name} ».", ['user_id' => $user->id]);
        return redirect()->back()->with('success', "Droits superadmin révoqués pour « {$user->name} ».");
    }
}
