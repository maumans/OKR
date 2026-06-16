<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class AdminCommandController extends Controller
{
    private function assertAdmin(Request $request): void
    {
        $collaborateur = $request->user()->collaborateurActuel();
        abort_unless($collaborateur && $collaborateur->estAdmin(), 403, 'Accès réservé aux administrateurs.');
    }

    public function dailyRappel(Request $request)
    {
        $this->assertAdmin($request);

        Artisan::call('daily:rappel');
        $output = trim(Artisan::output());

        return back()->with('command_result', [
            'command' => 'daily:rappel',
            'output'  => $output ?: 'Commande exécutée.',
            'success' => true,
        ]);
    }

    public function livrableAlerts(Request $request)
    {
        $this->assertAdmin($request);

        Artisan::call('livrable:alerts');
        $output = trim(Artisan::output());

        return back()->with('command_result', [
            'command' => 'livrable:alerts',
            'output'  => $output ?: 'Commande exécutée.',
            'success' => true,
        ]);
    }
}
