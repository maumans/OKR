<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    public function start(User $user)
    {
        if ($user->is_superadmin) {
            return redirect()->back()->withErrors(['user' => 'Impossible d\'impersonner un autre superadmin.']);
        }

        session(['impersonator_id' => Auth::id()]);
        Auth::login($user);

        audit('impersonation.start', "Impersonation de « {$user->name} » démarrée.", ['impersonated_user_id' => $user->id]);

        return redirect()->route('dashboard')->with('success', "Vous êtes maintenant connecté en tant que « {$user->name} ».");
    }

    public function stop(Request $request)
    {
        $impersonatorId = session('impersonator_id');
        if (!$impersonatorId) {
            return redirect()->route('dashboard');
        }

        $impersonatedUser = Auth::user();
        $impersonator = User::find($impersonatorId);

        if (!$impersonator) {
            session()->forget('impersonator_id');
            return redirect()->route('login');
        }

        $request->session()->forget('impersonator_id');
        Auth::login($impersonator);

        audit('impersonation.stop', "Impersonation de « {$impersonatedUser->name} » terminée.", ['impersonated_user_id' => $impersonatedUser->id]);

        return redirect()->route('superadmin.dashboard')->with('success', 'Impersonation terminée. Vous êtes de retour sur votre compte.');
    }
}
