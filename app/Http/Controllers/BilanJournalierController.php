<?php

namespace App\Http\Controllers;

use App\Models\BilanJournalier;
use App\Models\Collaborateur;
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

        // Bilan du jour pour le collaborateur sélectionné
        $bilan = BilanJournalier::where('collaborateur_id', $selectedCollab->id)
            ->where('date', $date->format('Y-m-d'))
            ->first();

        // Tâches Daily du jour (table séparée des tâches OKR)
        $tachesDuJour = TacheDaily::with(['tache.objectif', 'typeTache'])->where('collaborateur_id', $selectedCollab->id)
            ->whereDate('date', $date)
            ->orderByRaw("FIELD(statut, 'en_cours', 'a_faire', 'bloque', 'termine')")
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'titre' => $t->titre,
                'description' => $t->description,
                'statut' => $t->statut,
                'priorite' => $t->priorite,
                'type_tache' => $t->type_tache,
                'type_tache_nom' => $t->typeTache?->nom,
                'type_tache_couleur' => $t->typeTache?->couleur,
                'temps_estime' => $t->temps_estime,
                'temps_reel' => $t->temps_reel,
                'score' => $t->score,
                'date' => $t->date->format('Y-m-d'),
                'tache_id' => $t->tache_id,
                'tache_okr' => $t->tache ? [
                    'titre' => $t->tache->titre,
                    'objectif' => $t->tache->objectif ? $t->tache->objectif->titre : null,
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
                'id' => $b->id,
                'date' => $b->date->format('Y-m-d'),
                'note' => $b->note,
                'seminaires' => $b->seminaires ?? 0,
                'recherches' => $b->recherches ?? 0,
                'prospection' => $b->prospection ?? 0,
                'rdv' => $b->rdv ?? 0,
                'delivery' => $b->delivery ?? 0,
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
        $scoreJour = app(DailyService::class)->calculerScoreJour($selectedCollab->id, $date);

        return Inertia::render('Taches/Daily', [
            'collaborateurs' => $collaborateurs,
            'selectedCollaborateur' => [
                'id' => $selectedCollab->id,
                'nom' => $selectedCollab->nom,
                'prenom' => $selectedCollab->prenom,
                'poste' => $selectedCollab->poste,
                'nom_complet' => $selectedCollab->nomComplet(),
            ],
            'bilan' => $bilan,
            'tachesDuJour' => $tachesDuJour,
            'historique' => $historique,
            'tachesParJour' => $tachesParJour,
            'tachesOkr' => $tachesOkr,
            'typesTaches' => $typesTaches,
            'scoreJour' => $scoreJour,
            'currentDate' => $date->format('Y-m-d'),
            'isOwn' => $selectedCollab->id === $currentCollab->id,
        ]);
    }

    public function store(Request $request)
    {
        $collaborateur = $request->user()->collaborateurActuel();

        $validated = $request->validate([
            'note' => 'nullable|string',
            'blocages' => 'nullable|string',
            'date' => 'required|date',
            'seminaires' => 'nullable|integer|min:0',
            'recherches' => 'nullable|integer|min:0',
            'prospection' => 'nullable|integer|min:0',
            'rdv' => 'nullable|integer|min:0',
            'delivery' => 'nullable|integer|min:0',
        ]);

        BilanJournalier::updateOrCreate(
            [
                'collaborateur_id' => $collaborateur->id,
                'date' => $validated['date'],
            ],
            [
                'note' => $validated['note'],
                'blocages' => $validated['blocages'],
                'seminaires' => $validated['seminaires'] ?? 0,
                'recherches' => $validated['recherches'] ?? 0,
                'prospection' => $validated['prospection'] ?? 0,
                'rdv' => $validated['rdv'] ?? 0,
                'delivery' => $validated['delivery'] ?? 0,
            ]
        );

        return redirect()->back()->with('success', 'Bilan journalier enregistré.');
    }

    // ─── CRUD Tâches Daily ──────────────────────────────────

    public function storeTask(Request $request)
    {
        $collaborateur = $request->user()->collaborateurActuel();

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priorite' => 'required|in:basse,normale,haute,urgente',
            'date' => 'required|date',
            'tache_id' => 'nullable|exists:taches,id',
            'type_tache' => 'nullable|string',
            'temps_estime' => 'nullable|integer|min:0',
        ]);

        TacheDaily::create([
            'societe_id' => session('societe_id'),
            'collaborateur_id' => $collaborateur->id,
            'tache_id' => $validated['tache_id'] ?? null,
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'priorite' => $validated['priorite'],
            'type_tache' => $validated['type_tache'] ?? null,
            'temps_estime' => $validated['temps_estime'] ?? null,
            'statut' => 'a_faire',
            'date' => $validated['date'],
        ]);

        return redirect()->back()->with('success', 'Tâche ajoutée.');
    }

    public function updateTaskStatus(Request $request, TacheDaily $tacheDaily)
    {
        if ($tacheDaily->societe_id !== session('societe_id')) {
            abort(403);
        }

        $validated = $request->validate([
            'statut' => 'required|in:a_faire,en_cours,termine,bloque',
        ]);

        $tacheDaily->update(['statut' => $validated['statut']]);

        // Recalcul du score si la tâche est passée à "termine"
        if ($validated['statut'] === 'termine') {
            app(DailyService::class)->calculerScoreJour($tacheDaily->collaborateur_id, Carbon::parse($tacheDaily->date));
        }

        return redirect()->back();
    }

    public function updateTask(Request $request, TacheDaily $tacheDaily)
    {
        if ($tacheDaily->societe_id !== session('societe_id')) {
            abort(403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priorite' => 'required|in:basse,normale,haute,urgente',
            'tache_id' => 'nullable|exists:taches,id',
            'type_tache' => 'nullable|string',
            'temps_estime' => 'nullable|integer|min:0',
            'temps_reel' => 'nullable|integer|min:0',
        ]);

        $tacheDaily->update([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'priorite' => $validated['priorite'],
            'tache_id' => $validated['tache_id'] ?? null,
            'type_tache' => $validated['type_tache'] ?? null,
            'temps_estime' => $validated['temps_estime'] ?? null,
            'temps_reel' => $validated['temps_reel'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Tâche mise à jour.');
    }

    public function destroyTask(TacheDaily $tacheDaily)
    {
        if ($tacheDaily->societe_id !== session('societe_id')) {
            abort(403);
        }

        $tacheDaily->delete();

        return redirect()->back()->with('success', 'Tâche supprimée.');
    }
}
