<?php

namespace App\Http\Controllers;

use App\Models\Tache;
use App\Models\TacheFichier;
use App\Models\Objectif;
use App\Models\ResultatCle;
use App\Models\Collaborateur;
use App\Models\Mission;
use App\Events\TacheStatutChange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TacheController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Tache::class);
        $societeId = session('societe_id');
        $collaborateurActuel = $request->user()->collaborateurActuel();

        $taches = Tache::where('societe_id', $societeId)
            ->with(['collaborateur:id,nom,prenom', 'objectif:id,titre,axe_objectif_id', 'fichiers.collaborateur:id,nom,prenom'])
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
                'fichiers'         => $t->fichiers->map(fn ($f) => [
                    'id'           => $f->id,
                    'nom_original' => $f->nom_original,
                    'mime_type'    => $f->mime_type,
                    'taille'       => $f->tailleFormatee(),
                    'uploader'     => $f->collaborateur?->nomComplet(),
                    'created_at'   => $f->created_at->format('d/m/Y'),
                ]),
            ]);

        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id', 'nom', 'prenom']);

        // OKRs actifs de la société pour le select
        $objectifs = Objectif::where('societe_id', $societeId)
            ->where('statut', 'actif')
            ->with('resultatsCles:id,objectif_id,description')
            ->get(['id', 'titre', 'axe_objectif_id']);

        $missions = Mission::pourSociete($societeId)
            ->whereNotIn('statut', ['completed', 'archived'])
            ->get(['id', 'titre', 'client']);

        return Inertia::render('Taches/Index', [
            'taches'               => $taches,
            'filters'              => $request->only(['search', 'statut', 'priorite', 'eisenhower', 'collaborateur_id', 'objectif_id']),
            'collaborateurs'       => $collaborateurs,
            'objectifs'            => $objectifs,
            'missions'             => $missions,
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
            'mission_id'       => 'nullable|exists:missions,id',
        ]);
        $currentCollabId = $request->user()->collaborateurActuel()->id;
        if ((int)$validated['collaborateur_id'] !== $currentCollabId && !$request->user()->estResponsable()) {
            abort(403, 'Vous ne pouvez assigner une tâche qu\'à vous-même.');
        }

        $tache = Tache::create([
            'societe_id'       => session('societe_id'),
            'collaborateur_id' => $validated['collaborateur_id'],
            'objectif_id'      => $validated['objectif_id'] ?? null,
            'resultat_cle_id'  => $validated['resultat_cle_id'] ?? null,
            'mission_id'       => $validated['mission_id'] ?? null,
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

        $this->recalculerProgressionKr($tache->resultat_cle_id);

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
            'mission_id'       => 'nullable|exists:missions,id',
            'statut'           => 'nullable|in:a_faire,en_cours,termine,bloque',
        ]);

        $ancienKrId = $tache->resultat_cle_id;
        $tache->update($validated);

        // Recalculer l'ancien et le nouveau KR si changé
        $this->recalculerProgressionKr($ancienKrId);
        if ($tache->resultat_cle_id !== $ancienKrId) {
            $this->recalculerProgressionKr($tache->resultat_cle_id);
        }

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

        $this->recalculerProgressionKr($tache->resultat_cle_id);

        return redirect()->back();
    }

    public function destroy(Tache $tache)
    {
        Gate::authorize('delete', $tache);

        $krId = $tache->resultat_cle_id;
        $tache->delete();

        $this->recalculerProgressionKr($krId);

        return redirect()->back()->with('success', 'Tâche supprimée.');
    }

    public function uploadFichier(Request $request, Tache $tache)
    {
        Gate::authorize('update', $tache);
        $request->validate([
            'fichier' => 'required|file|max:20480',
        ]);

        $file = $request->file('fichier');
        $nomStockage = $file->store("taches/{$tache->societe_id}/{$tache->id}");

        $fichier = TacheFichier::create([
            'societe_id'       => $tache->societe_id,
            'tache_id'         => $tache->id,
            'collaborateur_id' => $request->user()->collaborateurActuel()->id,
            'nom_original'     => $file->getClientOriginalName(),
            'nom_stockage'     => $nomStockage,
            'mime_type'        => $file->getMimeType(),
            'taille'           => $file->getSize(),
        ]);

        return response()->json([
            'id'           => $fichier->id,
            'nom_original' => $fichier->nom_original,
            'mime_type'    => $fichier->mime_type,
            'taille'       => $fichier->tailleFormatee(),
            'uploader'     => $request->user()->collaborateurActuel()->nomComplet(),
            'created_at'   => $fichier->created_at->format('d/m/Y'),
        ], 201);
    }

    public function downloadFichier(Tache $tache, TacheFichier $fichier)
    {
        Gate::authorize('view', $tache);
        abort_unless($fichier->tache_id === $tache->id, 404);

        return Storage::download($fichier->nom_stockage, $fichier->nom_original);
    }

    public function destroyFichier(Tache $tache, TacheFichier $fichier)
    {
        Gate::authorize('update', $tache);
        abort_unless($fichier->tache_id === $tache->id, 404);

        Storage::delete($fichier->nom_stockage);
        $fichier->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Recalcule la progression d'un KR à partir de ses tâches.
     */
    private function recalculerProgressionKr(?int $resultatCleId): void
    {
        if (!$resultatCleId) return;

        $kr = ResultatCle::find($resultatCleId);
        if ($kr) {
            $kr->recalculerDepuisTaches();
        }
    }
}
