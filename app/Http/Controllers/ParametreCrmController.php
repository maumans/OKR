<?php

namespace App\Http\Controllers;

use App\Models\Practice;
use App\Models\SecteurActivite;
use App\Models\TypeLivrable;
use Illuminate\Http\Request;

class ParametreCrmController extends Controller
{
    // ─── Secteurs d'activité ────────────────────────────────

    public function storeSecteur(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'nom'   => 'required|string|max:255',
            'ordre' => 'nullable|integer|min:0',
        ]);

        SecteurActivite::create(array_merge($validated, [
            'societe_id' => session('societe_id'),
        ]));

        return redirect()->back()->with('success', 'Secteur créé.');
    }

    public function updateSecteur(Request $request, SecteurActivite $secteur)
    {
        $this->authorizeAdmin();
        $this->checkSociete($secteur->societe_id);

        $validated = $request->validate([
            'nom'   => 'required|string|max:255',
            'ordre' => 'nullable|integer|min:0',
            'actif' => 'boolean',
        ]);

        $secteur->update($validated);

        return redirect()->back()->with('success', 'Secteur mis à jour.');
    }

    public function destroySecteur(SecteurActivite $secteur)
    {
        $this->authorizeAdmin();
        $this->checkSociete($secteur->societe_id);

        $secteur->delete();

        return redirect()->back()->with('success', 'Secteur supprimé.');
    }

    // ─── Pratiques (Missions) ───────────────────────────────

    public function storePractice(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'nom'   => 'required|string|max:255',
            'ordre' => 'nullable|integer|min:0',
        ]);

        Practice::create(array_merge($validated, [
            'societe_id' => session('societe_id'),
        ]));

        return redirect()->back()->with('success', 'Pratique créée.');
    }

    public function updatePractice(Request $request, Practice $practice)
    {
        $this->authorizeAdmin();
        $this->checkSociete($practice->societe_id);

        $validated = $request->validate([
            'nom'   => 'required|string|max:255',
            'ordre' => 'nullable|integer|min:0',
            'actif' => 'boolean',
        ]);

        $practice->update($validated);

        return redirect()->back()->with('success', 'Pratique mise à jour.');
    }

    public function destroyPractice(Practice $practice)
    {
        $this->authorizeAdmin();
        $this->checkSociete($practice->societe_id);

        $practice->delete();

        return redirect()->back()->with('success', 'Pratique supprimée.');
    }

    // ─── Types de livrable ──────────────────────────────────

    public function storeTypeLivrable(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'nom'   => 'required|string|max:255',
            'ordre' => 'nullable|integer|min:0',
        ]);

        TypeLivrable::create(array_merge($validated, [
            'societe_id' => session('societe_id'),
        ]));

        return redirect()->back()->with('success', 'Type de livrable créé.');
    }

    public function updateTypeLivrable(Request $request, TypeLivrable $typeLivrable)
    {
        $this->authorizeAdmin();
        $this->checkSociete($typeLivrable->societe_id);

        $validated = $request->validate([
            'nom'   => 'required|string|max:255',
            'ordre' => 'nullable|integer|min:0',
            'actif' => 'boolean',
        ]);

        $typeLivrable->update($validated);

        return redirect()->back()->with('success', 'Type de livrable mis à jour.');
    }

    public function destroyTypeLivrable(TypeLivrable $typeLivrable)
    {
        $this->authorizeAdmin();
        $this->checkSociete($typeLivrable->societe_id);

        $typeLivrable->delete();

        return redirect()->back()->with('success', 'Type de livrable supprimé.');
    }

    // ─── Helpers ────────────────────────────────────────────

    private function authorizeAdmin(): void
    {
        $collab = auth()->user()->collaborateurActuel();
        if (! $collab?->aAccesGlobal()) {
            abort(403, 'Seuls les admins et directeurs peuvent gérer ces paramètres.');
        }
    }

    private function checkSociete(int $societeId): void
    {
        if ($societeId !== session('societe_id')) {
            abort(403);
        }
    }
}
