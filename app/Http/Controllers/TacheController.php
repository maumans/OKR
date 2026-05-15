<?php

namespace App\Http\Controllers;

use App\Models\Tache;
use App\Models\Objectif;
use App\Models\ResultatCle;
use App\Models\Collaborateur;
use App\Events\TacheStatutChange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TacheController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Tache::class);
        $societeId = session('societe_id');
        $collaborateurActuel = $request->user()->collaborateurActuel();

        $taches = Tache::where('societe_id', $societeId)
            ->with(['collaborateur:id,nom,prenom', 'objectif:id,titre,axe_objectif_id'])
            ->when($request->search, function ($query, $search) {
                $query->where('titre', 'like', "%{$search}%");
            })
            ->when($request->statut, function ($query, $statut) {
                $query->where('statut', $statut);
            })
            ->when($request->priorite, function ($query, $priorite) {
                $query->where('priorite', $priorite);
            })
            ->when($request->eisenhower, function ($query, $eisenhower) {
                $query->where('eisenhower', $eisenhower);
            })
            ->when($request->collaborateur_id, function ($query, $collabId) {
                if ($collabId === 'me') {
                    $query->where('collaborateur_id', request()->user()->collaborateurActuel()?->id);
                } else {
                    $query->where('collaborateur_id', $collabId);
                }
            })
            ->when($request->objectif_id, function ($query, $objectifId) {
                $query->where('objectif_id', $objectifId);
            })
            ->orderByRaw("FIELD(statut, 'a_faire', 'en_cours', 'bloque', 'termine')")
            ->orderByRaw("FIELD(priorite, 'urgente', 'haute', 'normale', 'basse')")
            ->latest()
            ->get()
            ->map(fn ($t) => [
                'id'               => $t->id,
                'titre'            => $t->titre,
                'description'      => $t->description,
                'mode_operatoire'  => $t->mode_operatoire,
                'outils'           => $t->outils,
                'definition_done'  => $t->definition_done,
                'eisenhower'       => $t->eisenhower,
                'statut'           => $t->statut,
                'priorite'         => $t->priorite,
                'date'             => $t->date ? $t->date->format('Y-m-d') : null,
                'collaborateur_id' => $t->collaborateur_id,
                'collaborateur'    => $t->collaborateur->nomComplet(),
                'objectif_id'      => $t->objectif_id,
                'resultat_cle_id'  => $t->resultat_cle_id,
                'objectif_titre'   => $t->objectif?->titre,
            ]);

        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id', 'nom', 'prenom']);

        // OKRs actifs de la société pour le select
        $objectifs = Objectif::where('societe_id', $societeId)
            ->where('statut', 'actif')
            ->with('resultatsCles:id,objectif_id,description')
            ->get(['id', 'titre', 'axe_objectif_id']);

        return Inertia::render('Taches/Index', [
            'taches'               => $taches,
            'filters'              => $request->only(['search', 'statut', 'priorite', 'eisenhower', 'collaborateur_id', 'objectif_id']),
            'collaborateurs'       => $collaborateurs,
            'objectifs'            => $objectifs,
            'currentCollaborateurId' => $collaborateurActuel?->id,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', Tache::class);
        $validated = $request->validate([
            'titre'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'mode_operatoire'  => 'nullable|array',
            'mode_operatoire.*'=> 'string|max:500',
            'outils'           => 'nullable|string|max:1000',
            'definition_done'  => 'nullable|array',
            'definition_done.*'=> 'string|max:500',
            'priorite'         => 'required|in:basse,normale,haute,urgente',
            'eisenhower'       => 'nullable|in:Q1,Q2,Q3,Q4',
            'collaborateur_id' => 'required|exists:collaborateurs,id',
            'date'             => 'nullable|date',
            'objectif_id'      => 'nullable|exists:objectifs,id',
            'resultat_cle_id'  => 'nullable|exists:resultats_cles,id',
        ]);
        $currentCollabId = $request->user()->collaborateurActuel()->id;
        if ((int)$validated['collaborateur_id'] !== $currentCollabId && !$request->user()->estResponsable()) {
            abort(403, 'Vous ne pouvez assigner une tâche qu\'à vous-même.');
        }

        Tache::create([
            'societe_id'       => session('societe_id'),
            'collaborateur_id' => $validated['collaborateur_id'],
            'objectif_id'      => $validated['objectif_id'] ?? null,
            'resultat_cle_id'  => $validated['resultat_cle_id'] ?? null,
            'titre'            => $validated['titre'],
            'description'      => $validated['description'] ?? null,
            'mode_operatoire'  => $validated['mode_operatoire'] ?? null,
            'outils'           => $validated['outils'] ?? null,
            'definition_done'  => $validated['definition_done'] ?? null,
            'priorite'         => $validated['priorite'],
            'eisenhower'       => $validated['eisenhower'] ?? null,
            'statut'           => 'a_faire',
            'date'             => $validated['date'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Tâche créée.');
    }

    public function update(Request $request, Tache $tache)
    {
        Gate::authorize('update', $tache);

        $validated = $request->validate([
            'titre'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'mode_operatoire'  => 'nullable|array',
            'mode_operatoire.*'=> 'string|max:500',
            'outils'           => 'nullable|string|max:1000',
            'definition_done'  => 'nullable|array',
            'definition_done.*'=> 'string|max:500',
            'priorite'         => 'required|in:basse,normale,haute,urgente',
            'eisenhower'       => 'nullable|in:Q1,Q2,Q3,Q4',
            'collaborateur_id' => 'required|exists:collaborateurs,id',
            'date'             => 'nullable|date',
            'objectif_id'      => 'nullable|exists:objectifs,id',
            'resultat_cle_id'  => 'nullable|exists:resultats_cles,id',
            'statut'           => 'nullable|in:a_faire,en_cours,termine,bloque',
        ]);

        $tache->update($validated);

        return redirect()->back()->with('success', 'Tâche mise à jour.');
    }

    public function updateStatus(Request $request, Tache $tache)
    {
        Gate::authorize('update', $tache);

        $validated = $request->validate([
            'statut' => 'required|in:a_faire,en_cours,termine,bloque',
        ]);

        $ancienStatut = $tache->statut;
        $tache->update(['statut' => $validated['statut']]);

        if ($ancienStatut !== $validated['statut']) {
            event(new TacheStatutChange($tache, $ancienStatut, $validated['statut'], $request->user()->collaborateurActuel()?->id));
        }

        return redirect()->back();
    }

    public function destroy(Tache $tache)
    {
        Gate::authorize('delete', $tache);

        $tache->delete();

        return redirect()->back()->with('success', 'Tâche supprimée.');
    }
}
