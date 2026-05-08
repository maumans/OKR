<?php

namespace App\Http\Controllers;

use App\Models\Objectif;
use App\Models\ResultatCle;
use App\Models\Collaborateur;
use App\Models\AxeObjectif;
use App\Models\ConfigurationOkr;
use App\Models\ConfigurationPrime;
use App\Models\SeuilPerformance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Events\ProgressionKrMiseAJour;
use App\Services\ScoreService;

class IndividuelController extends Controller
{
    /**
     * Génère la liste des mois disponibles (6 mois avant + mois actuel + 6 mois après).
     */
    private function getMoisOptions(): array
    {
        $mois = [];
        $start = Carbon::now()->subMonths(6)->startOfMonth();
        $end = Carbon::now()->addMonths(6)->startOfMonth();

        while ($start->lte($end)) {
            $mois[] = [
                'value' => $start->format('Y-m'),
                'label' => ucfirst($start->translatedFormat('F Y')),
                'date'  => $start->format('Y-m-d'),
            ];
            $start->addMonth();
        }

        return $mois;
    }

    /**
     * Vue individuelle : objectifs d'un collaborateur pour un mois donné.
     */
    public function index(Request $request, ScoreService $scoreService)
    {
        $societeId = session('societe_id');

        // Collaborateurs actifs
        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->get(['id', 'nom', 'prenom', 'poste', 'societe_id']);

        // Déterminer le collaborateur sélectionné
        $selectedCollabId = $request->collaborateur_id;
        if (!$selectedCollabId) {
            // Par défaut : le collaborateur connecté
            $selectedCollabId = Collaborateur::where('societe_id', $societeId)
                ->where('user_id', auth()->id())
                ->first()?->id ?? $collaborateurs->first()?->id;
        }
        $selectedCollaborateur = $collaborateurs->firstWhere('id', (int) $selectedCollabId);

        // Mois sélectionné (format "2026-04")
        $moisActuel = $request->mois ?? Carbon::now()->format('Y-m');
        $moisDate = Carbon::createFromFormat('Y-m', $moisActuel)->startOfMonth();
        $moisDebut = $moisDate->copy()->startOfMonth();
        $moisFin = $moisDate->copy()->endOfMonth();

        // Objectifs du collaborateur pour le mois sélectionné
        // Charger les KRs avec leurs tâches et le collaborateur assigné
        $objectifs = Objectif::where('societe_id', $societeId)
            ->where('collaborateur_id', $selectedCollabId)
            ->where('mois', $moisDebut->format('Y-m-d'))
            ->with([
                'resultatsCles.taches' => function ($q) {
                    $q->orderBy('created_at', 'asc');
                },
                'resultatsCles.taches.collaborateur:id,nom,prenom',
                'axeObjectif',
            ])
            ->latest()
            ->get()
            ->map(function ($objectif) {
                $tachesCount = 0;
                $tachesTerminees = 0;

                $resultatsCles = $objectif->resultatsCles->map(function ($r) use (&$tachesCount, &$tachesTerminees) {
                    $krTaches = $r->taches->map(function ($t) {
                        return [
                            'id'              => $t->id,
                            'titre'           => $t->titre,
                            'description'     => $t->description,
                            'statut'          => $t->statut,
                            'priorite'        => $t->priorite,
                            'eisenhower'      => $t->eisenhower,
                            'date'            => $t->date?->format('Y-m-d'),
                            'collaborateur_id' => $t->collaborateur_id,
                            'collaborateur'   => $t->collaborateur
                                ? $t->collaborateur->prenom . ' ' . $t->collaborateur->nom
                                : 'Non assigné',
                            'mode_operatoire'  => $t->mode_operatoire ?? [],
                            'outils'           => $t->outils,
                            'definition_done'  => $t->definition_done ?? [],
                        ];
                    });

                    $tachesCount += $krTaches->count();
                    $tachesTerminees += $krTaches->where('statut', 'termine')->count();

                    return [
                        'id'            => $r->id,
                        'description'   => $r->description,
                        'progression'   => $r->progression,
                        'justification' => $r->justification,
                        'valeur_cible'  => $r->valeur_cible,
                        'poids'         => $r->poids,
                        'unite'         => $r->unite,
                        'taches'        => $krTaches->values(),
                    ];
                });

                return [
                    'id'                  => $objectif->id,
                    'titre'               => $objectif->titre,
                    'axe'                 => $objectif->axeObjectif?->nom ?? $objectif->axe,
                    'axe_couleur'         => $objectif->axeObjectif?->couleur,
                    'axe_objectif_id'     => $objectif->axe_objectif_id,
                    'collaborateur_id'    => $objectif->collaborateur_id,
                    'prime'               => $objectif->prime,
                    'note_contexte'       => $objectif->note_contexte,
                    'statut'              => $objectif->statut,
                    'progression_globale' => $objectif->progression_globale,
                    'resultats_count'     => $objectif->resultatsCles->count(),
                    'taches_count'        => $tachesCount,
                    'taches_terminees'    => $tachesTerminees,
                    'resultats_cles'      => $resultatsCles,
                ];
            });

        // Calcul du score global (moyenne des progressions de tous les objectifs du mois)
        $scoreGlobal = $objectifs->count() > 0
            ? round($objectifs->avg('progression_globale'), 1)
            : 0;

        // Ventilation par axe
        $axes = AxeObjectif::pourSociete($societeId)->actifs()->ordonne()->get(['id', 'nom', 'couleur']);
        $progressionParAxe = $axes->map(function ($axe) use ($objectifs) {
            $axeObjectifs = $objectifs->where('axe_objectif_id', $axe->id);
            return [
                'id'          => $axe->id,
                'nom'         => $axe->nom,
                'couleur'     => $axe->couleur,
                'progression' => $axeObjectifs->count() > 0
                    ? round($axeObjectifs->avg('progression_globale'), 1)
                    : 0,
                'count'       => $axeObjectifs->count(),
            ];
        });

        // Primes
        $primeTotale = $objectifs->sum('prime');

        // Config primes — seuil configurable
        $configPrime = ConfigurationPrime::where('societe_id', $societeId)->first();
        $seuilPrime = $configPrime?->seuil_minimum ?? 80; // seuil par défaut 80%

        $primeEnAttente = $objectifs
            ->filter(fn ($o) => $o['progression_globale'] >= $seuilPrime)
            ->sum('prime');

        // Seuils de performance (couleurs dynamiques)
        $seuils = SeuilPerformance::pourSociete($societeId)->ordonne()->get();

        // Historiser le score du mois consulté
        if ($selectedCollaborateur && $objectifs->count() > 0) {
            $detailAxes = $progressionParAxe->map(fn($a) => [
                'axe' => $a['nom'],
                'progression' => $a['progression'],
            ])->toArray();

            $scoreService->historiserScoreMensuel(
                $selectedCollaborateur,
                $moisDate,
                $scoreGlobal,
                $detailAxes,
                $primeEnAttente
            );
        }

        // Récupérer l'historique des scores pour le graphique
        $historiqueScores = $selectedCollaborateur
            ? $scoreService->getHistoriqueScores($selectedCollaborateur->id)
            : [];

        return Inertia::render('Individuels/Index', [
            'collaborateurs'       => $collaborateurs,
            'selectedCollaborateur' => $selectedCollaborateur,
            'moisActuel'           => $moisActuel,
            'moisOptions'          => $this->getMoisOptions(),
            'objectifs'            => $objectifs->values(),
            'scoreGlobal'          => $scoreGlobal,
            'progressionParAxe'    => $progressionParAxe,
            'primeEnAttente'       => $primeEnAttente,
            'primeTotale'          => $primeTotale,
            'seuilPrime'           => $seuilPrime,
            'axes'                 => $axes,
            'seuils'               => $seuils,
            'historiqueScores'     => $historiqueScores,
            'filters'              => $request->only(['collaborateur_id', 'mois']),
        ]);
    }

    /**
     * Créer un objectif individuel.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'collaborateur_id' => 'required|exists:collaborateurs,id',
            'mois'             => 'required|date_format:Y-m',
            'axe_objectif_id'  => 'nullable|exists:axes_objectifs,id',
            'titre'            => 'required|string|max:255',
            'resultats_cles'   => 'required|array|min:1',
            'resultats_cles.*.description' => 'required|string|max:500',
            'prime'            => 'nullable|numeric|min:0',
            'note_contexte'    => 'nullable|string|max:2000',
        ]);

        $moisDate = Carbon::createFromFormat('Y-m', $validated['mois'])->startOfMonth();

        // Résoudre le nom de l'axe
        $axeNom = '';
        if (!empty($validated['axe_objectif_id'])) {
            $axeNom = AxeObjectif::find($validated['axe_objectif_id'])?->nom ?? '';
        }

        DB::transaction(function () use ($validated, $moisDate, $axeNom) {
            $objectif = Objectif::create([
                'collaborateur_id' => $validated['collaborateur_id'],
                'titre'            => $validated['titre'],
                'axe'              => $axeNom,
                'axe_objectif_id'  => $validated['axe_objectif_id'] ?? null,
                'periode'          => ucfirst($moisDate->translatedFormat('F Y')),
                'mois'             => $moisDate->format('Y-m-d'),
                'prime'            => $validated['prime'] ?? 0,
                'note_contexte'    => $validated['note_contexte'] ?? null,
                'statut'           => 'actif',
            ]);

            // Créer les KRs
            foreach ($validated['resultats_cles'] as $krData) {
                $description = is_array($krData) ? ($krData['description'] ?? '') : $krData;
                if (trim($description) === '') continue;
                ResultatCle::create([
                    'objectif_id' => $objectif->id,
                    'description' => trim($description),
                    'progression' => 0,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Objectif individuel créé avec succès.');
    }

    /**
     * Mettre à jour un objectif individuel.
     */
    public function update(Request $request, Objectif $objectif)
    {
        Gate::authorize('update', $objectif);

        $validated = $request->validate([
            'collaborateur_id' => 'required|exists:collaborateurs,id',
            'mois'             => 'required|date_format:Y-m',
            'axe_objectif_id'  => 'nullable|exists:axes_objectifs,id',
            'titre'            => 'required|string|max:255',
            'resultats_cles'   => 'required|array|min:1',
            'resultats_cles.*.id'          => 'nullable|exists:resultats_cles,id',
            'resultats_cles.*.description' => 'required|string|max:500',
            'prime'            => 'nullable|numeric|min:0',
            'note_contexte'    => 'nullable|string|max:2000',
        ]);

        $moisDate = Carbon::createFromFormat('Y-m', $validated['mois'])->startOfMonth();

        $axeNom = '';
        if (!empty($validated['axe_objectif_id'])) {
            $axeNom = AxeObjectif::find($validated['axe_objectif_id'])?->nom ?? '';
        }

        DB::transaction(function () use ($validated, $objectif, $moisDate, $axeNom) {
            $objectif->update([
                'collaborateur_id' => $validated['collaborateur_id'],
                'titre'            => $validated['titre'],
                'axe'              => $axeNom,
                'axe_objectif_id'  => $validated['axe_objectif_id'] ?? null,
                'periode'          => ucfirst($moisDate->translatedFormat('F Y')),
                'mois'             => $moisDate->format('Y-m-d'),
                'prime'            => $validated['prime'] ?? 0,
                'note_contexte'    => $validated['note_contexte'] ?? null,
            ]);

            // Sync des résultats clés
            $existingIds = [];
            foreach ($validated['resultats_cles'] as $krData) {
                if (!empty($krData['id'])) {
                    $kr = ResultatCle::where('id', $krData['id'])
                        ->where('objectif_id', $objectif->id)
                        ->first();
                    if ($kr) {
                        $kr->update(['description' => $krData['description']]);
                        $existingIds[] = $kr->id;
                    }
                } else {
                    if (trim($krData['description']) === '') continue;
                    $kr = ResultatCle::create([
                        'objectif_id' => $objectif->id,
                        'description' => trim($krData['description']),
                        'progression' => 0,
                    ]);
                    $existingIds[] = $kr->id;
                }
            }

            // Supprimer les KRs retirés
            ResultatCle::where('objectif_id', $objectif->id)
                ->whereNotIn('id', $existingIds)
                ->delete();
        });

        return redirect()->back()->with('success', 'Objectif individuel mis à jour.');
    }

    /**
     * Mettre à jour la progression d'un résultat clé (KR).
     */
    public function updateKrProgression(Request $request, ResultatCle $resultatCle)
    {
        $objectif = $resultatCle->objectif;
        Gate::authorize('update', $objectif);

        $validated = $request->validate([
            'progression'   => 'required|numeric|min:0|max:100',
            'justification' => 'nullable|string|max:2000',
        ]);
        
        $collaborateurId = $request->user()->collaborateurActuel()?->id;

        DB::transaction(function () use ($resultatCle, $validated, $collaborateurId) {
            if ((float)$resultatCle->progression !== (float)$validated['progression']) {
                event(new ProgressionKrMiseAJour(
                    $resultatCle,
                    $resultatCle->progression,
                    $validated['progression'],
                    $validated['justification'] ?? null,
                    $collaborateurId
                ));
            }
            
            $resultatCle->update([
                'progression'   => $validated['progression'],
                'justification' => $validated['justification'] ?? $resultatCle->justification,
            ]);
        });

        return redirect()->back()->with('success', 'Progression mise à jour.');
    }

    /**
     * Supprimer un objectif individuel.
     */
    public function destroy(Objectif $objectif)
    {
        Gate::authorize('delete', $objectif);
        $objectif->delete();

        return redirect()->back()->with('success', 'Objectif supprimé.');
    }
}
