<?php

namespace App\Http\Controllers;

use App\Models\Objectif;
use App\Models\ResultatCle;
use App\Models\Collaborateur;
use App\Models\AxeObjectif;
use App\Models\Periode;
use App\Models\TypeObjectif;
use App\Models\TypeResultatCle;
use App\Models\StatutObjectif;
use App\Models\ConfigurationOkr;
use App\Events\ProgressionKrMiseAJour;
use App\Services\OkrService;
use App\Services\HistoriqueService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ObjectifController extends Controller
{
    public function index(Request $request, OkrService $okrService)
    {
        Gate::authorize('viewAny', Objectif::class);
        $societeId = session('societe_id');

        // Sélection automatique de la période en cours si non spécifiée
        if (!$request->has('periode_id')) {
            $currentPeriode = Periode::pourSociete($societeId)
                ->where('date_debut', '<=', now())
                ->where('date_fin', '>=', now())
                ->first();

            if ($currentPeriode) {
                return redirect()->route('objectifs.index', array_merge($request->all(), ['periode_id' => $currentPeriode->id]));
            }
        }

        $objectifs = Objectif::where('societe_id', $societeId)
            ->with(['collaborateur', 'resultatsCles.typeResultatCle', 'resultatsCles.taches.collaborateur', 'axeObjectif', 'periodeRelation', 'periodes', 'typeObjectif', 'taches.collaborateur'])
            ->when($request->search, function ($query, $search) {
                $query->where('titre', 'like', "%{$search}%");
            })
            ->when($request->statut, function ($query, $statut) {
                $query->where('statut', $statut);
            })
            ->when($request->collaborateur_id, function ($query, $collabId) {
                $query->where('collaborateur_id', $collabId);
            })
            ->when($request->periode_id, function ($query, $periodeId) {
                $query->where(function($q) use ($periodeId) {
                    $q->where('periode_id', $periodeId)
                      ->orWhereHas('periodes', fn($sq) => $sq->where('periodes.id', $periodeId));
                });
            })
            ->when($request->axe_objectif_id, function ($query, $axeId) {
                $query->where('axe_objectif_id', $axeId);
            })
            ->when($request->type_objectif_id, function ($query, $typeId) {
                $query->where('type_objectif_id', $typeId);
            })
            ->when($request->priorite, function ($query, $priorite) {
                $query->whereHas('taches', fn ($q) => $q->where('priorite', $priorite));
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($objectif) => [
                'id' => $objectif->id,
                'titre' => $objectif->titre,
                'axe' => $objectif->axeObjectif?->nom ?? $objectif->axe,
                'axe_couleur' => $objectif->axeObjectif?->couleur,
                'periode' => $objectif->periodes->count() > 0 ? $objectif->periodes->pluck('nom')->join(', ') : ($objectif->periodeRelation?->nom ?? $objectif->periode),
                'periode_id' => $objectif->periode_id,
                'periode_ids' => $objectif->periodes->pluck('id')->toArray(),
                'axe_objectif_id' => $objectif->axe_objectif_id,
                'type_objectif_id' => $objectif->type_objectif_id,
                'type' => $objectif->typeObjectif?->nom,
                'niveau' => $objectif->typeObjectif?->niveau,
                'statut' => $objectif->statut,
                'visibilite' => $objectif->visibilite,
                'prime' => $objectif->prime,
                'progression_globale' => $objectif->progression_globale,
                'collaborateur' => $objectif->collaborateur->nomComplet(),
                'collaborateur_id' => $objectif->collaborateur_id,
                'resultats_count' => $objectif->resultatsCles->count(),
                'taches_count' => $objectif->taches->count(),
                'taches_terminees' => $objectif->taches->where('statut', 'termine')->count(),
                'resultats_cles' => $objectif->resultatsCles->map(fn ($r) => [
                    'id' => $r->id,
                    'description' => $r->description,
                    'description_detaillee' => $r->description_detaillee,
                    'progression' => $r->progression,
                    'valeur_cible' => $r->valeur_cible,
                    'unite' => $r->unite,
                    'poids' => $r->poids,
                    'type_nom' => $r->typeResultatCle?->nom,
                    'type_resultat_cle_id' => $r->type_resultat_cle_id,
                    'taches' => $r->taches->map(fn ($t) => [
                        'id' => $t->id,
                        'titre' => $t->titre,
                        'description' => $t->description,
                        'mode_operatoire' => $t->mode_operatoire,
                        'outils' => $t->outils,
                        'definition_done' => $t->definition_done,
                        'statut' => $t->statut,
                        'priorite' => $t->priorite,
                        'eisenhower' => $t->eisenhower,
                        'date' => $t->date?->format('Y-m-d'),
                        'collaborateur' => $t->collaborateur->nomComplet(),
                        'collaborateur_id' => $t->collaborateur_id,
                        'resultat_cle_id' => $t->resultat_cle_id,
                    ]),
                ]),
                'taches' => $objectif->taches->map(fn ($t) => [
                    'id' => $t->id,
                    'titre' => $t->titre,
                    'description' => $t->description,
                    'mode_operatoire' => $t->mode_operatoire,
                    'outils' => $t->outils,
                    'definition_done' => $t->definition_done,
                    'statut' => $t->statut,
                    'priorite' => $t->priorite,
                    'eisenhower' => $t->eisenhower,
                    'date' => $t->date?->format('Y-m-d'),
                    'collaborateur' => $t->collaborateur->nomComplet(),
                    'collaborateur_id' => $t->collaborateur_id,
                    'resultat_cle_id' => $t->resultat_cle_id,
                ]),
            ]);

        // Pour les filtres
        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id', 'nom', 'prenom']);
        $periodesDb = Periode::pourSociete($societeId)->actives()->get(['id', 'nom', 'type', 'date_debut', 'date_fin']);
        $axes = AxeObjectif::pourSociete($societeId)->actifs()->ordonne()->get(['id', 'nom', 'couleur']);
        $seuils = \App\Models\SeuilPerformance::pourSociete($societeId)->ordonne()->get();

        $config = ConfigurationOkr::where('societe_id', $societeId)->first();

        $progressionGlobale = $okrService->calculerProgressionGlobale($societeId, $request->periode_id);

        // Vélocité (Tâches terminées / Tâches totales de la période)
        $tachesAll = \App\Models\Tache::where('societe_id', $societeId)
            ->whereHas('objectif', function($q) use ($request) {
                $q->when($request->periode_id, fn($sq, $v) => $sq->where('periode_id', $v))
                  ->where('statut', 'actif');
            })->get();
        $totalTaches = $tachesAll->count();
        $tachesTerminees = $tachesAll->where('statut', 'termine')->count();
        $velocite = $totalTaches > 0 ? round(($tachesTerminees / $totalTaches) * 100) : 0;

        // Collaborateur par défaut pour le modal de création rapide
        $defaultCollaborateurId = Collaborateur::where('societe_id', $societeId)
            ->where('user_id', auth()->id())
            ->first()?->id ?? $collaborateurs->first()?->id;

        return Inertia::render('OKR/Index', [
            'objectifs' => $objectifs,
            'filters' => $request->only(['search', 'statut', 'collaborateur_id', 'periode_id', 'axe_objectif_id', 'type_objectif_id', 'priorite']),
            'collaborateurs' => $collaborateurs,
            'periodes' => $periodesDb,
            'axes' => $axes,
            'seuils' => $seuils,
            'typesObjectifs' => TypeObjectif::pourSociete($societeId)->get(['id', 'nom', 'niveau']),
            'typesResultatsCles' => TypeResultatCle::pourSociete($societeId)->get(['id', 'nom', 'type_valeur', 'unite']),
            'configuration' => $config,
            'vueOkr' => $config?->vue_okr ?? 'cards',
            'progressionGlobale' => $progressionGlobale,
            'velocite' => $velocite,
            'defaultCollaborateurId' => $defaultCollaborateurId,
        ]);
    }

    public function create()
    {
        Gate::authorize('create', Objectif::class);
        $societeId = session('societe_id');
        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id', 'nom', 'prenom']);

        return Inertia::render('OKR/Create', [
            'collaborateurs' => $collaborateurs,
            'axes' => AxeObjectif::pourSociete($societeId)->actifs()->ordonne()->get(['id', 'nom', 'couleur']),
            'periodes' => Periode::pourSociete($societeId)->actives()->get(['id', 'nom']),
            'typesObjectifs' => TypeObjectif::pourSociete($societeId)->get(['id', 'nom', 'niveau']),
            'typesResultatsCles' => TypeResultatCle::pourSociete($societeId)->get(['id', 'nom', 'type_valeur', 'unite']),
            'statuts' => StatutObjectif::pourSociete($societeId)->ordonne()->get(['id', 'nom', 'couleur']),
            'configuration' => ConfigurationOkr::where('societe_id', $societeId)->first(),
        ]);
    }

    public function store(Request $request, HistoriqueService $historiqueService)
    {
        Gate::authorize('create', Objectif::class);
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'axe' => 'nullable|string|max:255',
            'axe_objectif_id' => 'nullable|exists:axes_objectifs,id',
            'periode' => 'nullable|string|max:50',
            'periode_ids' => 'nullable|array',
            'periode_ids.*' => 'exists:periodes,id',
            'periode_id' => 'nullable|exists:periodes,id',
            'type_objectif_id' => 'nullable|exists:types_objectifs,id',
            'visibilite' => 'nullable|string|in:tous,equipe,prive',
            'prime' => 'nullable|numeric|min:0',
            'collaborateur_id' => 'required|exists:collaborateurs,id',
            'resultats_cles' => 'required|array|min:1',
            'resultats_cles.*.description' => 'required|string|max:255',
            'resultats_cles.*.description_detaillee' => 'nullable|string',
            'resultats_cles.*.type_resultat_cle_id' => 'nullable|exists:types_resultats_cles,id',
            'resultats_cles.*.valeur_cible' => 'nullable|numeric|min:0',
            'resultats_cles.*.poids' => 'nullable|numeric|min:0',
            'resultats_cles.*.unite' => 'nullable|string|max:50',
        ]);

        DB::transaction(function () use ($validated, $request, $historiqueService) {
            // Vérification de permission : un simple collaborateur ne peut créer que pour lui-même
            $currentCollabId = $request->user()->collaborateurActuel()->id;
            if ((int)$validated['collaborateur_id'] !== $currentCollabId && !$request->user()->estResponsable()) {
                abort(403, 'Vous ne pouvez créer un objectif que pour vous-même.');
            }

            // Résoudre le nom de la période si seul periode_id est fourni
            $periodeNom = $validated['periode'] ?? null;
            if (!$periodeNom && !empty($validated['periode_id'])) {
                $periodeNom = Periode::find($validated['periode_id'])?->nom ?? '';
            }

            $objectif = Objectif::create([
                'collaborateur_id' => $validated['collaborateur_id'],
                'titre' => $validated['titre'],
                'axe' => $validated['axe'] ?? '',
                'axe_objectif_id' => $validated['axe_objectif_id'] ?? null,
                'periode' => $periodeNom ?? '',
                'periode_id' => $validated['periode_id'] ?? null,
                'type_objectif_id' => $validated['type_objectif_id'] ?? null,
                'visibilite' => $validated['visibilite'] ?? 'equipe',
                'prime' => $validated['prime'] ?? 0,
                'statut' => 'actif',
            ]);

            foreach ($validated['resultats_cles'] as $resultat) {
                ResultatCle::create([
                    'objectif_id' => $objectif->id,
                    'description' => $resultat['description'],
                    'description_detaillee' => $resultat['description_detaillee'] ?? null,
                    'type_resultat_cle_id' => $resultat['type_resultat_cle_id'] ?? null,
                    'valeur_cible' => $resultat['valeur_cible'] ?? 100,
                    'poids' => $resultat['poids'] ?? 1,
                    'unite' => $resultat['unite'] ?? null,
                    'progression' => 0,
                ]);
            }

            if (!empty($validated['periode_ids'])) {
                $objectif->periodes()->sync($validated['periode_ids']);
            }
            
            $historiqueService->enregistrerAction('objectif.cree', $objectif, ['titre' => $objectif->titre]);
        });

        return redirect()->route('objectifs.index')->with('success', 'Objectif OKR créé avec succès.');
    }

    public function show(Objectif $objectif)
    {
        Gate::authorize('view', $objectif);

        $objectif->load(['collaborateur', 'resultatsCles.typeResultatCle', 'resultatsCles.taches', 'resultatsCles.historiqueProgressions.collaborateur', 'axeObjectif', 'periodeRelation', 'periodes', 'typeObjectif', 'taches.collaborateur']);
        $societeId = session('societe_id');

        // Récupérer les collaborateurs pour le formulaire de création de tâche
        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id', 'nom', 'prenom']);

        // Préparer les tâches liées avec les infos nécessaires
        $taches = $objectif->taches->map(fn ($t) => [
            'id'             => $t->id,
            'titre'          => $t->titre,
            'description'    => $t->description,
            'mode_operatoire'=> $t->mode_operatoire,
            'outils'         => $t->outils,
            'definition_done'=> $t->definition_done,
            'statut'         => $t->statut,
            'priorite'       => $t->priorite,
            'eisenhower'     => $t->eisenhower,
            'date'           => $t->date?->format('Y-m-d'),
            'collaborateur'  => $t->collaborateur->nomComplet(),
            'collaborateur_id'=> $t->collaborateur_id,
            'resultat_cle_id' => $t->resultat_cle_id,
        ]);

        return Inertia::render('OKR/Show', [
            'objectif' => array_merge($objectif->toArray(), [
                'progression_globale' => $objectif->progression_globale,
                'axe_nom'            => $objectif->axeObjectif?->nom ?? $objectif->axe,
                'axe_couleur'        => $objectif->axeObjectif?->couleur,
                'periode_nom'        => $objectif->periodes->count() > 0 ? $objectif->periodes->pluck('nom')->join(', ') : ($objectif->periodeRelation?->nom ?? $objectif->periode),
                'periode_ids'        => $objectif->periodes->pluck('id')->toArray(),
                'type_nom'           => $objectif->typeObjectif?->nom,
                'niveau'             => $objectif->typeObjectif?->niveau,
                'nom_complet'        => $objectif->collaborateur->nomComplet(),
            ]),
            'taches'        => $taches,
            'collaborateurs' => $collaborateurs,
            'seuils'        => \App\Models\SeuilPerformance::pourSociete($societeId)->ordonne()->get(),
            'configuration' => ConfigurationOkr::where('societe_id', $societeId)->first(),
        ]);
    }

    public function update(Request $request, Objectif $objectif)
    {
        Gate::authorize('update', $objectif);

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'axe' => 'nullable|string|max:255',
            'axe_objectif_id' => 'nullable|exists:axes_objectifs,id',
            'periode' => 'nullable|string|max:50',
            'periode_ids' => 'nullable|array',
            'periode_ids.*' => 'exists:periodes,id',
            'periode_id' => 'nullable|exists:periodes,id',
            'type_objectif_id' => 'nullable|exists:types_objectifs,id',
            'visibilite' => 'nullable|string|in:tous,equipe,prive',
            'prime' => 'nullable|numeric|min:0',
            'collaborateur_id' => 'required|exists:collaborateurs,id',
            'resultats_cles' => 'required|array|min:1',
            'resultats_cles.*.id' => 'nullable|exists:resultats_cles,id',
            'resultats_cles.*.description' => 'required|string|max:255',
            'resultats_cles.*.description_detaillee' => 'nullable|string',
            'resultats_cles.*.type_resultat_cle_id' => 'nullable|exists:types_resultats_cles,id',
            'resultats_cles.*.valeur_cible' => 'nullable|numeric|min:0',
            'resultats_cles.*.poids' => 'nullable|numeric|min:0',
            'resultats_cles.*.unite' => 'nullable|string|max:50',
            'resultats_cles.*.progression' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::transaction(function () use ($validated, $objectif) {
            $periodeNom = $validated['periode'] ?? null;
            if (!$periodeNom && !empty($validated['periode_id'])) {
                $periodeNom = Periode::find($validated['periode_id'])?->nom ?? '';
            }

            $objectif->update([
                'collaborateur_id' => $validated['collaborateur_id'],
                'titre' => $validated['titre'],
                'axe' => $validated['axe'] ?? '',
                'axe_objectif_id' => $validated['axe_objectif_id'] ?? null,
                'periode' => $periodeNom ?? $objectif->periode,
                'periode_id' => $validated['periode_id'] ?? null,
                'type_objectif_id' => $validated['type_objectif_id'] ?? null,
                'visibilite' => $validated['visibilite'] ?? 'equipe',
                'prime' => $validated['prime'] ?? 0,
            ]);

            // Sync des résultats clés
            $existingIds = [];
            foreach ($validated['resultats_cles'] as $krData) {
                if (!empty($krData['id'])) {
                    // Update existing KR
                    $kr = ResultatCle::where('id', $krData['id'])->where('objectif_id', $objectif->id)->first();
                    if ($kr) {
                        $kr->update([
                            'description' => $krData['description'],
                            'description_detaillee' => $krData['description_detaillee'] ?? null,
                            'type_resultat_cle_id' => $krData['type_resultat_cle_id'] ?? null,
                            'valeur_cible' => $krData['valeur_cible'] ?? 100,
                            'poids' => $krData['poids'] ?? 1,
                            'unite' => $krData['unite'] ?? null,
                        ]);
                        $existingIds[] = $kr->id;
                    }
                } else {
                    // Create new KR
                    $kr = ResultatCle::create([
                        'objectif_id' => $objectif->id,
                        'description' => $krData['description'],
                        'description_detaillee' => $krData['description_detaillee'] ?? null,
                        'type_resultat_cle_id' => $krData['type_resultat_cle_id'] ?? null,
                        'valeur_cible' => $krData['valeur_cible'] ?? 100,
                        'poids' => $krData['poids'] ?? 1,
                        'unite' => $krData['unite'] ?? null,
                        'progression' => 0,
                    ]);
                    $existingIds[] = $kr->id;
                }
            }

            // Delete KRs that were removed
            if (isset($validated['periode_ids'])) {
                $objectif->periodes()->sync($validated['periode_ids']);
            }

            ResultatCle::where('objectif_id', $objectif->id)
                ->whereNotIn('id', $existingIds)
                ->delete();
        });

        return redirect()->back()->with('success', 'Objectif mis \u00e0 jour.');
    }

    public function updateProgress(Request $request, Objectif $objectif)
    {
        Gate::authorize('update', $objectif);

        $validated = $request->validate([
            'resultats' => 'required|array',
            'resultats.*.id' => 'required|exists:resultats_cles,id',
            'resultats.*.progression' => 'required|numeric|min:0|max:100',
            'resultats.*.justification' => 'nullable|string',
        ]);

        $collaborateurId = $request->user()->collaborateurActuel()?->id;

        DB::transaction(function () use ($validated, $objectif, $collaborateurId) {
            foreach ($validated['resultats'] as $data) {
                $kr = ResultatCle::where('id', $data['id'])
                    ->where('objectif_id', $objectif->id)
                    ->first();
                    
                if ($kr && (float)$kr->progression !== (float)$data['progression']) {
                    event(new ProgressionKrMiseAJour(
                        $kr,
                        $kr->progression,
                        $data['progression'],
                        $data['justification'] ?? null,
                        $collaborateurId
                    ));
                    $kr->update(['progression' => $data['progression']]);
                }
            }
        });

        return redirect()->back()->with('success', 'Progression mise à jour.');
    }

    public function updateStatus(Request $request, Objectif $objectif)
    {
        Gate::authorize('update', $objectif);

        $validated = $request->validate([
            'statut' => 'required|in:brouillon,actif,termine,annule',
        ]);

        $objectif->update(['statut' => $validated['statut']]);

        return redirect()->back()->with('success', 'Statut mis à jour.');
    }

    public function destroy(Objectif $objectif)
    {
        Gate::authorize('delete', $objectif);
        $objectif->delete();

        return redirect()->route('objectifs.index')->with('success', 'Objectif supprimé.');
    }
}

