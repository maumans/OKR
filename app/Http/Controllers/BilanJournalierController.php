<?php

namespace App\Http\Controllers;

use App\Models\BilanJournalier;
use App\Models\Collaborateur;
use App\Models\Mission;
use App\Models\TacheDaily;
use App\Models\TypeTache;
use App\Services\DailyService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class BilanJournalierController extends Controller
{
    public function index(Request $request)
    {
        $societeId = session('societe_id');
        $currentCollab = $request->user()->collaborateurActuel();

        if (!$currentCollab) {
            abort(403, 'Vous devez être un collaborateur pour accéder aux bilans.');
        }

        // Tous les collaborateurs de la société (pour les tabs)
        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->orderBy('prenom')
            ->get(['id', 'nom', 'prenom', 'poste']);

        // Collaborateur sélectionné (par défaut = utilisateur connecté)
        $selectedId = $request->input('collaborateur_id', $currentCollab->id);
        $selectedCollab = $collaborateurs->firstWhere('id', $selectedId) ?? $currentCollab;

        $dateStr = $request->input('date', Carbon::today()->format('Y-m-d'));
        $date = Carbon::parse($dateStr);

        app(DailyService::class)->calculerActivitesJour($selectedCollab->id, $date);

        // Bilan du jour pour le collaborateur sélectionné
        $bilan = BilanJournalier::where('collaborateur_id', $selectedCollab->id)
            ->where('date', $date->format('Y-m-d'))
            ->first(['id', 'date', 'note', 'blocages', 'priorites_demain', 'seminaires', 'recherches', 'prospection', 'rdv', 'delivery']);

        // Tâches Daily du jour (table séparée des tâches OKR)
        $tachesDuJour = TacheDaily::with(['tache.objectif', 'typeTache', 'mission'])
            ->where('collaborateur_id', $selectedCollab->id)
            ->whereDate('date', $date)
            ->orderByRaw("FIELD(statut, 'en_cours', 'a_faire', 'bloque', 'termine')")
            ->get()
            ->map(fn ($t) => [
                'id'                => $t->id,
                'titre'             => $t->titre,
                'description'       => $t->description,
                'statut'            => $t->statut,
                'priorite'          => $t->priorite,
                'type_tache'        => $t->type_tache,
                'type_tache_nom'    => $t->typeTache?->nom,
                'type_tache_couleur'=> $t->typeTache?->couleur,
                'categorie'         => $t->categorie,
                'categorie_autre'   => $t->categorie_autre,
                'temps_estime'      => $t->temps_estime,
                'temps_reel'        => $t->temps_reel,
                'score'             => $t->score,
                'date'              => $t->date->format('Y-m-d'),
                'tache_id'          => $t->tache_id,
                'mission_id'        => $t->mission_id,
                'tache_okr' => $t->tache ? [
                    'titre'   => $t->tache->titre,
                    'objectif'=> $t->tache->objectif ? $t->tache->objectif->titre : null,
                ] : null,
                'mission' => $t->mission ? [
                    'id'     => $t->mission->id,
                    'titre'  => $t->mission->titre,
                    'client' => $t->mission->client,
                ] : null,
            ]);

        // Tâches OKR du collaborateur pour les lier
        $tachesOkr = \App\Models\Tache::with('objectif:id,titre')
            ->where('collaborateur_id', $selectedCollab->id)
            ->whereIn('statut', ['a_faire', 'en_cours'])
            ->get(['id', 'titre', 'objectif_id'])
            ->map(fn ($t) => [
                'id' => $t->id,
                'titre' => $t->titre,
                'objectif' => $t->objectif ? $t->objectif->titre : 'Sans objectif',
            ])
            ->groupBy('objectif');

        // Historique 7 jours
        $historique = BilanJournalier::where('collaborateur_id', $selectedCollab->id)
            ->where('date', '>=', $date->copy()->subDays(7)->format('Y-m-d'))
            ->where('date', '<=', $date->format('Y-m-d'))
            ->orderByDesc('date')
            ->get()
            ->map(fn ($b) => [
                'id'              => $b->id,
                'date'            => $b->date->format('Y-m-d'),
                'note'            => $b->note,
                'blocages'        => $b->blocages,
                'priorites_demain'=> $b->priorites_demain,
                'seminaires'      => $b->seminaires ?? 0,
                'recherches'      => $b->recherches ?? 0,
                'prospection'     => $b->prospection ?? 0,
                'rdv'             => $b->rdv ?? 0,
                'delivery'        => $b->delivery ?? 0,
            ]);

        // Compteur de tâches Daily par jour (pour l'historique)
        $tachesParJour = TacheDaily::where('collaborateur_id', $selectedCollab->id)
            ->where('date', '>=', $date->copy()->subDays(7)->format('Y-m-d'))
            ->where('date', '<=', $date->format('Y-m-d'))
            ->selectRaw("date, COUNT(*) as total, SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as terminees")
            ->groupBy('date')
            ->get()
            ->keyBy(fn ($item) => Carbon::parse($item->date)->format('Y-m-d'));

        $typesTaches = TypeTache::pourSociete($societeId)->actifs()->ordonne()->get();
        $scoreJour   = app(DailyService::class)->calculerScoreJour($selectedCollab->id, $date);

        // Missions actives pour le lien Daily ↔ Mission
        $missions = Mission::where('societe_id', $societeId)
            ->whereNotIn('statut', ['completed', 'archived'])
            ->orderBy('titre')
            ->get(['id', 'titre', 'client']);

        return Inertia::render('Taches/Daily', [
            'collaborateurs' => $collaborateurs,
            'selectedCollaborateur' => [
                'id'         => $selectedCollab->id,
                'nom'        => $selectedCollab->nom,
                'prenom'     => $selectedCollab->prenom,
                'poste'      => $selectedCollab->poste,
                'nom_complet'=> $selectedCollab->nomComplet(),
            ],
            'bilan'        => $bilan,
            'tachesDuJour' => $tachesDuJour,
            'historique'   => $historique,
            'tachesParJour'=> $tachesParJour,
            'tachesOkr'    => $tachesOkr,
            'typesTaches'  => $typesTaches,
            'missions'     => $missions,
            'scoreJour'    => $scoreJour,
            'currentDate'  => $date->format('Y-m-d'),
            'isOwn'        => $selectedCollab->id === $currentCollab->id,
        ]);
    }

    public function store(Request $request)
    {
        $collaborateur = $request->user()->collaborateurActuel();

        $validated = $request->validate([
            'note'             => 'nullable|string',
            'blocages'         => 'nullable|string',
            'priorites_demain' => 'nullable|string',
            'date'             => 'required|date',
        ]);

        // Auto-compute activity counts from completed tasks by categorie
        app(DailyService::class)->calculerActivitesJour($collaborateur->id, Carbon::parse($validated['date']));

        BilanJournalier::updateOrCreate(
            ['collaborateur_id' => $collaborateur->id, 'date' => $validated['date']],
            [
                'note'             => $validated['note'],
                'blocages'         => $validated['blocages'],
                'priorites_demain' => $validated['priorites_demain'],
            ]
        );

        return redirect()->back()->with('success', 'Bilan journalier enregistré.');
    }

    // ─── CRUD Tâches Daily ──────────────────────────────────

    public function storeTask(Request $request)
    {
        $currentCollab = $request->user()->collaborateurActuel();

        $validated = $request->validate([
            'titre'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'priorite'         => 'required|in:basse,normale,haute,urgente',
            'date'             => 'required|date',
            'tache_id'         => 'nullable|exists:taches,id',
            'mission_id'       => 'nullable|exists:missions,id',
            'type_tache'       => 'nullable|string',
            'categorie'         => 'nullable|in:prospection,rdv,delivery,seminaire,recherche,autre',
            'categorie_autre'   => 'nullable|string|max:120',
            'temps_estime'      => 'nullable|integer|min:0',
            'collaborateur_id'  => 'nullable|exists:collaborateurs,id',
        ]);

        // Le Daily est personnel : on ne peut créer des tâches que pour soi-même
        $targetCollabId = $currentCollab->id;

        TacheDaily::create([
            'societe_id'       => session('societe_id'),
            'collaborateur_id' => $targetCollabId,
            'tache_id'         => $validated['tache_id'] ?? null,
            'mission_id'       => $validated['mission_id'] ?? null,
            'titre'            => $validated['titre'],
            'description'      => $validated['description'] ?? null,
            'priorite'         => $validated['priorite'],
            'type_tache'       => $validated['type_tache'] ?? null,
            'categorie'        => $validated['categorie'] ?? null,
            'categorie_autre'  => ($validated['categorie'] === 'autre') ? ($validated['categorie_autre'] ?? null) : null,
            'temps_estime'     => $validated['temps_estime'] ?? null,
            'statut'           => 'a_faire',
            'date'             => $validated['date'],
        ]);

        app(DailyService::class)->calculerActivitesJour($targetCollabId, Carbon::parse($validated['date']));

        return redirect()->back()->with('success', 'Tâche ajoutée.');
    }

    public function updateTaskStatus(Request $request, TacheDaily $tacheDaily)
    {
        if ($tacheDaily->societe_id !== session('societe_id')) {
            abort(403);
        }

        $currentCollabId = $request->user()->collaborateurActuel()->id;
        if ($tacheDaily->collaborateur_id !== $currentCollabId) {
            abort(403, 'Vous ne pouvez modifier que vos propres tâches Daily.');
        }

        $validated = $request->validate([
            'statut' => 'required|in:a_faire,en_cours,termine,bloque',
        ]);

        $tacheDaily->update(['statut' => $validated['statut']]);

        // Recalcul du score si la tâche est passée à "termine"
        if ($validated['statut'] === 'termine') {
            app(DailyService::class)->calculerScoreJour($tacheDaily->collaborateur_id, Carbon::parse($tacheDaily->date));
        }
        app(DailyService::class)->calculerActivitesJour($tacheDaily->collaborateur_id, Carbon::parse($tacheDaily->date));

        return redirect()->back();
    }

    public function updateTask(Request $request, TacheDaily $tacheDaily)
    {
        if ($tacheDaily->societe_id !== session('societe_id')) {
            abort(403);
        }

        $currentCollabId = $request->user()->collaborateurActuel()->id;
        if ($tacheDaily->collaborateur_id !== $currentCollabId) {
            abort(403, 'Vous ne pouvez modifier que vos propres tâches Daily.');
        }

        $validated = $request->validate([
            'titre'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'priorite'     => 'required|in:basse,normale,haute,urgente',
            'tache_id'     => 'nullable|exists:taches,id',
            'mission_id'   => 'nullable|exists:missions,id',
            'type_tache'   => 'nullable|string',
            'categorie'        => 'nullable|in:prospection,rdv,delivery,seminaire,recherche,autre',
            'categorie_autre'  => 'nullable|string|max:120',
            'temps_estime'     => 'nullable|integer|min:0',
            'temps_reel'       => 'nullable|integer|min:0',
        ]);

        $tacheDaily->update([
            'titre'           => $validated['titre'],
            'description'     => $validated['description'] ?? null,
            'priorite'        => $validated['priorite'],
            'tache_id'        => $validated['tache_id'] ?? null,
            'mission_id'      => $validated['mission_id'] ?? null,
            'type_tache'      => $validated['type_tache'] ?? null,
            'categorie'       => $validated['categorie'] ?? null,
            'categorie_autre' => ($validated['categorie'] === 'autre') ? ($validated['categorie_autre'] ?? null) : null,
            'temps_estime'    => $validated['temps_estime'] ?? null,
            'temps_reel'      => $validated['temps_reel'] ?? null,
        ]);

        app(DailyService::class)->calculerActivitesJour($tacheDaily->collaborateur_id, Carbon::parse($tacheDaily->date));

        return redirect()->back()->with('success', 'Tâche mise à jour.');
    }

    public function destroyTask(Request $request, TacheDaily $tacheDaily)
    {
        if ($tacheDaily->societe_id !== session('societe_id')) {
            abort(403);
        }

        $currentCollabId = $request->user()->collaborateurActuel()->id;
        if ($tacheDaily->collaborateur_id !== $currentCollabId) {
            abort(403, 'Vous ne pouvez supprimer que vos propres tâches Daily.');
        }

        $collabId = $tacheDaily->collaborateur_id;
        $date = Carbon::parse($tacheDaily->date);
        $tacheDaily->delete();

        app(DailyService::class)->calculerActivitesJour($collabId, $date);

        return redirect()->back()->with('success', 'Tâche supprimée.');
    }

    // ─── Vue d'ensemble ────────────────────────────────────

    public function overview(Request $request)
    {
        $societeId  = session('societe_id');
        $currentCollab = $request->user()->collaborateurActuel();

        if (!$currentCollab) abort(403);

        $canSeeAll = $currentCollab->aAccesGlobal()
            || $currentCollab->estManager()
            || $currentCollab->estResponsable();

        // ─── Période ─────────────────────────────────────
        $mode  = $request->input('mode', 'semaine');
        $today = Carbon::today();

        switch ($mode) {
            case 'aujourd_hui':
                $dateDebut = $today->copy();
                $dateFin   = $today->copy();
                break;
            case 'mois':
                $dateDebut = $today->copy()->startOfMonth();
                $dateFin   = $today->copy();
                break;
            case 'personnalise':
                $dateDebut = Carbon::parse($request->input('date_debut', $today->copy()->startOfWeek(Carbon::MONDAY)->format('Y-m-d')));
                $dateFin   = Carbon::parse($request->input('date_fin',   $today->format('Y-m-d')));
                break;
            case 'semaine':
            default:
                $dateDebut = $today->copy()->startOfWeek(Carbon::MONDAY);
                $dateFin   = $today->copy()->endOfWeek(Carbon::SUNDAY);
                break;
        }

        if ($dateFin->diffInDays($dateDebut) > 30) {
            $dateFin = $dateDebut->copy()->addDays(30);
        }

        $dates = [];
        for ($d = $dateDebut->copy(); $d->lte($dateFin); $d->addDay()) {
            $dates[] = $d->format('Y-m-d');
        }

        // ─── Collaborateurs ───────────────────────────────
        $collabsQuery = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->orderBy('prenom');

        if (!$canSeeAll) {
            $collabsQuery->where('id', $currentCollab->id);
        }

        $collabs    = $collabsQuery->get(['id', 'nom', 'prenom', 'poste']);
        $collabIds  = $collabs->pluck('id');

        // ─── Stats tâches par collaborateur × jour ────────
        $tachesStats = TacheDaily::whereIn('collaborateur_id', $collabIds)
            ->whereBetween('date', [$dateDebut->format('Y-m-d'), $dateFin->format('Y-m-d')])
            ->selectRaw("
                collaborateur_id,
                DATE(date) as jour,
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as terminees,
                SUM(COALESCE(score, 0)) as score_total,
                SUM(CASE WHEN categorie = 'prospection' AND statut = 'termine' THEN 1 ELSE 0 END) as prospection,
                SUM(CASE WHEN categorie = 'rdv'         AND statut = 'termine' THEN 1 ELSE 0 END) as rdv,
                SUM(CASE WHEN categorie = 'delivery'    AND statut = 'termine' THEN 1 ELSE 0 END) as delivery,
                SUM(CASE WHEN categorie = 'seminaire'   AND statut = 'termine' THEN 1 ELSE 0 END) as seminaires,
                SUM(CASE WHEN categorie = 'recherche'   AND statut = 'termine' THEN 1 ELSE 0 END) as recherches
            ")
            ->groupBy('collaborateur_id', 'jour')
            ->get()
            ->groupBy('collaborateur_id');

        // ─── Bilans soumis par collaborateur × jour ────────
        $bilansStats = BilanJournalier::whereIn('collaborateur_id', $collabIds)
            ->whereBetween('date', [$dateDebut->format('Y-m-d'), $dateFin->format('Y-m-d')])
            ->get(['collaborateur_id', 'date'])
            ->groupBy('collaborateur_id');

        // ─── Construction résultat ────────────────────────
        $collaborateurs = $collabs->map(function ($c) use ($dates, $tachesStats, $bilansStats) {
            $tachesParJour = $tachesStats->get($c->id, collect())->keyBy('jour');
            $bilansParJour = $bilansStats->get($c->id, collect())
                ->keyBy(fn ($b) => Carbon::parse($b->date)->format('Y-m-d'));

            $jours = [];
            foreach ($dates as $date) {
                $t = $tachesParJour->get($date);
                $jours[$date] = [
                    'total'       => $t ? (int) $t->total      : 0,
                    'terminees'   => $t ? (int) $t->terminees   : 0,
                    'score'       => $t ? (int) $t->score_total : 0,
                    'prospection' => $t ? (int) $t->prospection : 0,
                    'rdv'         => $t ? (int) $t->rdv         : 0,
                    'delivery'    => $t ? (int) $t->delivery    : 0,
                    'seminaires'  => $t ? (int) $t->seminaires  : 0,
                    'recherches'  => $t ? (int) $t->recherches  : 0,
                    'a_bilan'     => $bilansParJour->has($date),
                ];
            }

            $totaux = [
                'taches_total'     => array_sum(array_column($jours, 'total')),
                'taches_terminees' => array_sum(array_column($jours, 'terminees')),
                'score'            => array_sum(array_column($jours, 'score')),
                'jours_avec_bilan' => count(array_filter($jours, fn ($j) => $j['a_bilan'])),
                'jours_actifs'     => count(array_filter($jours, fn ($j) => $j['total'] > 0)),
                'prospection'      => array_sum(array_column($jours, 'prospection')),
                'rdv'              => array_sum(array_column($jours, 'rdv')),
                'delivery'         => array_sum(array_column($jours, 'delivery')),
                'seminaires'       => array_sum(array_column($jours, 'seminaires')),
                'recherches'       => array_sum(array_column($jours, 'recherches')),
            ];

            return [
                'id'          => $c->id,
                'nom_complet' => $c->nomComplet(),
                'prenom'      => $c->prenom,
                'poste'       => $c->poste,
                'jours'       => $jours,
                'totaux'      => $totaux,
            ];
        })->values();

        $teamTotaux = [
            'taches_total'        => $collaborateurs->sum(fn ($c) => $c['totaux']['taches_total']),
            'taches_terminees'    => $collaborateurs->sum(fn ($c) => $c['totaux']['taches_terminees']),
            'score'               => $collaborateurs->sum(fn ($c) => $c['totaux']['score']),
            'collabs_actifs'      => $collaborateurs->filter(fn ($c) => $c['totaux']['jours_actifs'] > 0)->count(),
            'collabs_avec_bilan'  => $collaborateurs->filter(fn ($c) => $c['totaux']['jours_avec_bilan'] > 0)->count(),
        ];

        return Inertia::render('Taches/DailyOverview', [
            'collaborateurs' => $collaborateurs,
            'dates'          => $dates,
            'filters'        => [
                'mode'       => $mode,
                'date_debut' => $dateDebut->format('Y-m-d'),
                'date_fin'   => $dateFin->format('Y-m-d'),
                'date_debut_custom' => $request->input('date_debut'),
                'date_fin_custom'   => $request->input('date_fin'),
            ],
            'teamTotaux'     => $teamTotaux,
            'canSeeAll'      => $canSeeAll,
        ]);
    }
}
