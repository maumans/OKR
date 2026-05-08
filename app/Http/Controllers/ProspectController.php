<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\Collaborateur;
use App\Models\ActionCommerciale;
use App\Events\ProspectStatutChange;
use App\Services\ProspectionService;
use App\Services\ScoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ProspectController extends Controller
{
    public function index(Request $request, ProspectionService $prospectionService, ScoreService $scoreService)
    {
        Gate::authorize('viewAny', Prospect::class);
        $societeId = session('societe_id');

        $prospects = Prospect::where('societe_id', $societeId)
            ->with('collaborateur:id,nom,prenom')
            ->when($request->search, function ($query, $search) {
                $query->where('nom', 'like', "%{$search}%")
                      ->orWhere('contact', 'like', "%{$search}%")
                      ->orWhere('secteur', 'like', "%{$search}%");
            })
            ->when($request->collaborateur_id, function ($query, $collabId) {
                $query->where('collaborateur_id', $collabId);
            })
            ->when($request->secteur, function ($query, $secteur) {
                $query->where('secteur', $secteur);
            })
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'nom' => $p->nom,
                'contact' => $p->contact,
                'secteur' => $p->secteur,
                'valeur' => $p->valeur,
                'collaborateur_id' => $p->collaborateur_id,
                'collaborateur' => $p->collaborateur ? $p->collaborateur->nomComplet() : null,
                'statut' => $p->statut,
                'prochain_rdv' => $p->prochain_rdv?->format('Y-m-d'),
                'date_premier_contact' => $p->date_premier_contact?->format('Y-m-d H:i'),
                'date_conversion' => $p->date_conversion?->format('Y-m-d H:i'),
                'source' => $p->source,
                'montant_final' => $p->montant_final,
                'note' => $p->note,
            ]);

        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id', 'nom', 'prenom']);
        $secteurs = Prospect::where('societe_id', $societeId)->whereNotNull('secteur')->distinct()->pluck('secteur');

        $statsPipeline = $prospectionService->calculerTauxConversion($societeId);
        $valeurPipeline = $prospectionService->getValeurPipeline($societeId);

        // Score commercial par collaborateur
        $scoresCommerciaux = $collaborateurs->map(function ($collab) use ($scoreService) {
            $stats = $scoreService->calculerScoreCommercial($collab);
            return [
                'id' => $collab->id,
                'nom' => $collab->prenom . ' ' . $collab->nom,
                'score' => $stats['score'],
                'actions' => $stats['actions_count'],
                'reunions' => $stats['reunions'],
            ];
        })->sortByDesc('score')->values();

        return Inertia::render('Prospection/Index', [
            'prospects' => $prospects,
            'filters' => $request->only(['search', 'collaborateur_id', 'secteur']),
            'collaborateurs' => $collaborateurs,
            'secteurs' => $secteurs,
            'statsPipeline' => $statsPipeline,
            'valeurPipeline' => $valeurPipeline,
            'scoresCommerciaux' => $scoresCommerciaux,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', Prospect::class);
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'secteur' => 'nullable|string|max:255',
            'valeur' => 'nullable|numeric|min:0',
            'collaborateur_id' => 'nullable|exists:collaborateurs,id',
            'note' => 'nullable|string',
            'prochain_rdv' => 'nullable|date',
        ]);

        Prospect::create([
            'societe_id' => session('societe_id'),
            'nom' => $validated['nom'],
            'contact' => $validated['contact'],
            'secteur' => $validated['secteur'],
            'valeur' => $validated['valeur'] ?? null,
            'collaborateur_id' => $validated['collaborateur_id'] ?? null,
            'note' => $validated['note'] ?? null,
            'prochain_rdv' => $validated['prochain_rdv'] ?? null,
            'statut' => 'nouveau',
        ]);

        return redirect()->back()->with('success', 'Prospect ajouté au pipeline.');
    }

    public function update(Request $request, Prospect $prospect)
    {
        Gate::authorize('update', $prospect);

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'secteur' => 'nullable|string|max:255',
            'valeur' => 'nullable|numeric|min:0',
            'collaborateur_id' => 'nullable|exists:collaborateurs,id',
            'note' => 'nullable|string',
            'prochain_rdv' => 'nullable|date',
        ]);

        $prospect->update($validated);

        return redirect()->back()->with('success', 'Prospect mis à jour.');
    }

    public function updateStatus(Request $request, Prospect $prospect)
    {
        Gate::authorize('update', $prospect);

        $validated = $request->validate([
            'statut' => 'required|in:nouveau,contacte,qualifie,proposition,gagne,perdu',
        ]);

        $ancienStatut = $prospect->statut;
        $prospect->update(['statut' => $validated['statut']]);

        if ($ancienStatut !== $validated['statut']) {
            event(new ProspectStatutChange($prospect, $ancienStatut, $validated['statut'], $request->user()->collaborateurActuel()?->id));
        }

        return redirect()->back();
    }

    public function storeAction(Request $request, Prospect $prospect)
    {
        Gate::authorize('update', $prospect);

        $validated = $request->validate([
            'type' => 'required|in:appel,email,reunion,note,relance',
            'description' => 'nullable|string',
            'date_action' => 'required|date',
            'duree' => 'nullable|integer|min:0',
            'resultat' => 'nullable|string',
        ]);

        $prospect->actionsCommerciales()->create([
            'societe_id' => session('societe_id'),
            'collaborateur_id' => $request->user()->collaborateurActuel()?->id,
            'type' => $validated['type'],
            'description' => $validated['description'] ?? null,
            'date_action' => $validated['date_action'],
            'duree' => $validated['duree'] ?? null,
            'resultat' => $validated['resultat'] ?? null,
        ]);

        // Mettre à jour la date de premier contact si c'est la première action
        if ($prospect->date_premier_contact === null) {
            $prospect->update(['date_premier_contact' => $validated['date_action']]);
        }

        return redirect()->back()->with('success', 'Action enregistrée.');
    }

    public function destroy(Prospect $prospect)
    {
        Gate::authorize('delete', $prospect);

        $prospect->delete();

        return redirect()->back()->with('success', 'Prospect supprimé.');
    }
}
