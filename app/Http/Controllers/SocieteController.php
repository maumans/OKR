<?php

namespace App\Http\Controllers;

use App\Models\Societe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SocieteController extends Controller
{
    public function edit(Request $request)
    {
        $societe = $request->user()->societeActuelle();

        if (!$societe) {
            abort(404, 'Aucune société trouvée.');
        }

        return Inertia::render('Parametres/Index', [
            'societe' => $societe,
        ]);
    }

    public function update(Request $request)
    {
        $societe = $request->user()->societeActuelle();

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:20',
            'couleur_primaire' => 'nullable|string|max:7',
            'couleur_secondaire' => 'nullable|string|max:7',
            'mode_sombre' => 'boolean',
            'layout_mode' => 'nullable|string|in:sidebar,topbar',
        ]);

        $societe->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Paramètres mis à jour.');
    }

    public function updateLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $societe = $request->user()->societeActuelle();

        // Supprimer l'ancien logo
        if ($societe->logo) {
            Storage::disk('public')->delete($societe->logo);
        }

        $path = $request->file('logo')->store('logos', 'public');
        $societe->update(['logo' => $path]);

        return redirect()
            ->back()
            ->with('success', 'Logo mis à jour.');
    }
}
