<?php

namespace App\Http\Controllers;

use App\Models\Departement;
use Illuminate\Http\Request;

class DepartementController extends Controller
{
    public function index(Request $request)
    {
        $societeId = session('societe_id');

        $departements = Departement::where('societe_id', $societeId)
            ->withCount('collaborateurs')
            ->ordonne()
            ->get();

        return redirect()->route('parametres.index', ['tab' => 'departements']);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'couleur'     => 'nullable|string|max:20',
            'ordre'       => 'nullable|integer|min:0',
        ]);

        $societeId = session('societe_id');

        Departement::create(array_merge($validated, ['societe_id' => $societeId]));

        return redirect()->back()->with('success', 'Département créé.');
    }

    public function update(Request $request, Departement $departement)
    {
        $this->authorizeAdmin();
        $this->checkSociete($departement);

        $validated = $request->validate([
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'couleur'     => 'nullable|string|max:20',
            'ordre'       => 'nullable|integer|min:0',
            'actif'       => 'boolean',
        ]);

        $departement->update($validated);

        return redirect()->back()->with('success', 'Département mis à jour.');
    }

    public function destroy(Departement $departement)
    {
        $this->authorizeAdmin();
        $this->checkSociete($departement);

        // Détacher les collaborateurs avant suppression
        $departement->collaborateurs()->update(['departement_id' => null]);
        $departement->delete();

        return redirect()->back()->with('success', 'Département supprimé.');
    }

    private function authorizeAdmin(): void
    {
        $collab = auth()->user()->collaborateurActuel();
        if (!$collab?->aAccesGlobal()) {
            abort(403, 'Seuls les admins et directeurs peuvent gérer les départements.');
        }
    }

    private function checkSociete(Departement $departement): void
    {
        if ($departement->societe_id !== session('societe_id')) {
            abort(403);
        }
    }
}
