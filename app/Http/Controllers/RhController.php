<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\Competence;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RhController extends Controller
{
    private function societeId(): int
    {
        return request()->user()->collaborateurActuel()?->societe_id
            ?? request()->user()->societe_id;
    }

    // ─── Page principale ───────────────────────────────────────────────────────

    public function index()
    {
        $societeId = $this->societeId();

        $collaborateurs = Collaborateur::with(['responsable', 'departement', 'roles', 'competences'])
            ->where('societe_id', $societeId)
            ->where('actif', true)
            ->orderBy('nom')
            ->get()
            ->map(fn ($c) => [
                'id'             => $c->id,
                'nom'            => $c->nom,
                'prenom'         => $c->prenom,
                'poste'          => $c->poste,
                'grade'          => $c->grade,
                'departement'    => $c->departement?->nom,
                'responsable_id' => $c->responsable_id,
                'responsable'    => $c->responsable ? "{$c->responsable->prenom} {$c->responsable->nom}" : null,
                'roles'          => $c->roles->pluck('code'),
                'competences'    => $c->competences->map(fn ($comp) => [
                    'id'     => $comp->id,
                    'nom'    => $comp->nom,
                    'niveau' => $comp->pivot->niveau,
                ]),
            ]);

        $competences = Competence::where('societe_id', $societeId)
            ->orderBy('categorie')
            ->orderBy('ordre')
            ->orderBy('nom')
            ->get()
            ->map(fn ($c) => [
                'id'          => $c->id,
                'nom'         => $c->nom,
                'categorie'   => $c->categorie,
                'description' => $c->description,
                'ordre'       => $c->ordre,
                'nb_collab'   => $c->collaborateurs()->where('societe_id', $societeId)->count(),
            ]);

        return Inertia::render('RH/Index', compact('collaborateurs', 'competences'));
    }

    // ─── Organigramme : mise à jour du responsable ─────────────────────────────

    public function updateResponsable(Request $request, Collaborateur $collaborateur)
    {
        abort_if($collaborateur->societe_id !== $this->societeId(), 403);

        $validated = $request->validate([
            'responsable_id' => 'nullable|exists:collaborateurs,id',
        ]);

        // Evite les cycles (un collaborateur ne peut pas être son propre responsable)
        if ($validated['responsable_id'] === $collaborateur->id) {
            return redirect()->back()->withErrors(['responsable_id' => 'Un collaborateur ne peut pas être son propre responsable.']);
        }

        $collaborateur->update(['responsable_id' => $validated['responsable_id']]);

        return redirect()->back()->with('success', 'Hiérarchie mise à jour.');
    }

    // ─── Compétences CRUD ─────────────────────────────────────────────────────

    public function storeCompetence(Request $request)
    {
        $societeId = $this->societeId();

        $validated = $request->validate([
            'nom'         => 'required|string|max:150',
            'categorie'   => 'nullable|string|max:80',
            'description' => 'nullable|string|max:1000',
            'ordre'       => 'sometimes|integer|min:0',
        ]);

        Competence::create(array_merge($validated, ['societe_id' => $societeId]));

        return redirect()->back()->with('success', 'Compétence créée.');
    }

    public function updateCompetence(Request $request, Competence $competence)
    {
        abort_if($competence->societe_id !== $this->societeId(), 403);

        $validated = $request->validate([
            'nom'         => 'required|string|max:150',
            'categorie'   => 'nullable|string|max:80',
            'description' => 'nullable|string|max:1000',
            'ordre'       => 'sometimes|integer|min:0',
        ]);

        $competence->update($validated);

        return redirect()->back()->with('success', 'Compétence mise à jour.');
    }

    public function destroyCompetence(Competence $competence)
    {
        abort_if($competence->societe_id !== $this->societeId(), 403);
        $competence->delete();

        return redirect()->back()->with('success', 'Compétence supprimée.');
    }

    // ─── Assignation / retrait compétences collaborateur ──────────────────────

    public function assignerCompetence(Request $request, Collaborateur $collaborateur)
    {
        abort_if($collaborateur->societe_id !== $this->societeId(), 403);

        $validated = $request->validate([
            'competence_id' => 'required|exists:competences,id',
            'niveau'        => 'required|integer|min:1|max:5',
            'commentaire'   => 'nullable|string|max:500',
        ]);

        $collaborateur->competences()->syncWithoutDetaching([
            $validated['competence_id'] => [
                'niveau'      => $validated['niveau'],
                'commentaire' => $validated['commentaire'] ?? null,
            ],
        ]);

        return redirect()->back()->with('success', 'Compétence assignée.');
    }

    public function retirerCompetence(Collaborateur $collaborateur, Competence $competence)
    {
        abort_if($collaborateur->societe_id !== $this->societeId(), 403);
        $collaborateur->competences()->detach($competence->id);

        return redirect()->back()->with('success', 'Compétence retirée.');
    }
}
