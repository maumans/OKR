<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\ModuleFormation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormationController extends Controller
{
    public function index(Request $request)
    {
        $societe = $request->user()->societeActuelle();

        $formations = Formation::where('societe_id', $societe->id)
            ->withCount('modules')
            ->latest()
            ->get();

        return Inertia::render('LMS/Index', [
            'formations' => $formations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $societe = $request->user()->societeActuelle();

        Formation::create([
            'societe_id' => $societe->id,
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Formation créée avec succès.');
    }

    public function show(Formation $formation)
    {
        $formation->load('modules');

        return Inertia::render('LMS/Show', [
            'formation' => $formation,
        ]);
    }

    public function update(Request $request, Formation $formation)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $formation->update($validated);

        return redirect()->back()->with('success', 'Formation mise à jour.');
    }

    public function destroy(Formation $formation)
    {
        $formation->delete();

        return redirect()->route('formations.index')->with('success', 'Formation supprimée.');
    }

    // ─── Modules ────────────────────────────────────────────────

    public function storeModule(Request $request, Formation $formation)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'contenu' => 'nullable|string',
        ]);

        $maxOrdre = $formation->modules()->max('ordre') ?? 0;

        $formation->modules()->create([
            'titre' => $validated['titre'],
            'contenu' => $validated['contenu'] ?? '',
            'ordre' => $maxOrdre + 1,
        ]);

        return redirect()->back()->with('success', 'Module ajouté.');
    }

    public function updateModule(Request $request, Formation $formation, ModuleFormation $module)
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'contenu' => 'nullable|string',
            'ordre' => 'nullable|integer',
        ]);

        $module->update($validated);

        return redirect()->back()->with('success', 'Module mis à jour.');
    }

    public function destroyModule(Formation $formation, ModuleFormation $module)
    {
        $module->delete();

        return redirect()->back()->with('success', 'Module supprimé.');
    }

    public function showModule(Formation $formation, ModuleFormation $module)
    {
        $formation->load('modules');

        return Inertia::render('LMS/Learn', [
            'formation' => $formation,
            'currentModule' => $module,
        ]);
    }
}
