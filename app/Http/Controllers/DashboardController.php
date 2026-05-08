<?php

namespace App\Http\Controllers;

use App\Models\AxeObjectif;
use App\Models\Collaborateur;
use App\Models\Objectif;
use App\Models\Periode;
use App\Models\Prospect;
use App\Models\SeuilPerformance;
use App\Models\Tache;
use App\Models\JournalActivite;
use App\Services\OkrService;
use App\Services\ProspectionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request, OkrService $okrService, ProspectionService $prospectionService)
    {
        $user = $request->user();
        $collaborateur = $user->collaborateurActuel();

        if (!$collaborateur) {
            return Inertia::render('Dashboard', [
                'stats' => null,
                'noSociete' => true,
            ]);
        }

        $societeId = $collaborateur->societe_id;

        // ─── Stats de base ──────────────────────────────────
        $stats = [
            'collaborateurs' => Collaborateur::where('societe_id', $societeId)->actifs()->count(),
            'objectifs' => Objectif::where('societe_id', $societeId)->where('statut', 'actif')->count(),
            'objectifs_termines' => Objectif::where('societe_id', $societeId)->where('statut', 'termine')->count(),
            'objectifs_total' => Objectif::where('societe_id', $societeId)->count(),
            'taches_en_cours' => Tache::where('societe_id', $societeId)->where('statut', 'en_cours')->count(),
            'taches_terminees' => Tache::where('societe_id', $societeId)->where('statut', 'termine')->count(),
            'taches_total' => Tache::where('societe_id', $societeId)->count(),
            'taches_urgentes' => Tache::where('societe_id', $societeId)->where('priorite', 'urgente')->whereIn('statut', ['a_faire', 'en_cours'])->count(),
            'taches_bloquees' => Tache::where('societe_id', $societeId)->where('statut', 'bloque')->count(),
            'prospects' => Prospect::where('societe_id', $societeId)->count(),
            'prospects_gagnes' => Prospect::where('societe_id', $societeId)->where('statut', 'gagne')->count(),
            'prospects_en_cours' => Prospect::where('societe_id', $societeId)->whereIn('statut', ['contacte', 'qualifie', 'proposition'])->count(),
        ];

        // Filtres globaux
        $periodeId = $request->periode_id;
        $axeId = $request->axe_objectif_id;

        // ─── Progression OKR ────────────────────────────────
        $objectifsActifsQuery = Objectif::where('societe_id', $societeId)
            ->where('statut', 'actif')
            ->when($periodeId, fn($q) => $q->where('periode_id', $periodeId))
            ->when($axeId, fn($q) => $q->where('axe_objectif_id', $axeId));

        $objectifsActifs = $objectifsActifsQuery->with(['resultatsCles', 'axeObjectif'])->get();

        $stats['progression_okr'] = $okrService->calculerProgressionGlobale($societeId, $periodeId);

        // ─── Progression par axe stratégique ────────────────
        $axes = AxeObjectif::where('societe_id', $societeId)->actifs()->ordonne()->get();
        $progressionParAxe = $axes->map(function ($axe) use ($objectifsActifs) {
            $objAxe = $objectifsActifs->where('axe_objectif_id', $axe->id);
            return [
                'nom' => $axe->nom,
                'couleur' => $axe->couleur,
                'progression' => $objAxe->count() > 0
                    ? round($objAxe->avg(fn ($o) => $o->progression_globale), 1)
                    : 0,
                'count' => $objAxe->count(),
            ];
        })->values();

        // ─── Répartition tâches par statut ──────────────────
        $repartitionTaches = [
            ['statut' => 'À faire', 'count' => Tache::where('societe_id', $societeId)->where('statut', 'a_faire')->count(), 'couleur' => '#9ca3af'],
            ['statut' => 'En cours', 'count' => $stats['taches_en_cours'], 'couleur' => '#3b82f6'],
            ['statut' => 'Bloqué', 'count' => $stats['taches_bloquees'], 'couleur' => '#ef4444'],
            ['statut' => 'Terminé', 'count' => $stats['taches_terminees'], 'couleur' => '#10b981'],
        ];

        // ─── Pipeline prospects ─────────────────────────────
        $pipeline = [
            ['statut' => 'Nouveau', 'count' => Prospect::where('societe_id', $societeId)->where('statut', 'nouveau')->count(), 'couleur' => '#9ca3af'],
            ['statut' => 'Contacté', 'count' => Prospect::where('societe_id', $societeId)->where('statut', 'contacte')->count(), 'couleur' => '#3b82f6'],
            ['statut' => 'Qualifié', 'count' => Prospect::where('societe_id', $societeId)->where('statut', 'qualifie')->count(), 'couleur' => '#6366f1'],
            ['statut' => 'Proposition', 'count' => Prospect::where('societe_id', $societeId)->where('statut', 'proposition')->count(), 'couleur' => '#f59e0b'],
            ['statut' => 'Gagné', 'count' => $stats['prospects_gagnes'], 'couleur' => '#10b981'],
            ['statut' => 'Perdu', 'count' => Prospect::where('societe_id', $societeId)->where('statut', 'perdu')->count(), 'couleur' => '#ef4444'],
        ];

        // ─── Tâches urgentes / bloquées ─────────────────────
        $tachesAlerte = Tache::where('societe_id', $societeId)
            ->with('collaborateur')
            ->where(function ($q) {
                $q->where('priorite', 'urgente')->whereIn('statut', ['a_faire', 'en_cours'])
                  ->orWhere('statut', 'bloque');
            })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'titre' => $t->titre,
                'statut' => $t->statut,
                'priorite' => $t->priorite,
                'collaborateur' => $t->collaborateur->nomComplet(),
                'date' => $t->date?->format('d/m/Y'),
            ]);

        // ─── Dernières tâches ───────────────────────────────
        $dernieresTaches = Tache::where('societe_id', $societeId)
            ->with('collaborateur')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'titre' => $t->titre,
                'statut' => $t->statut,
                'priorite' => $t->priorite,
                'collaborateur' => $t->collaborateur->nomComplet(),
                'date' => $t->date?->format('d/m/Y'),
            ]);

        // ─── Derniers objectifs ─────────────────────────────
        $derniersObjectifs = Objectif::where('societe_id', $societeId)
            ->with(['collaborateur', 'resultatsCles', 'axeObjectif'])
            ->where('statut', 'actif')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'titre' => $o->titre,
                'progression' => $o->progression_globale,
                'collaborateur' => $o->collaborateur->nomComplet(),
                'periode' => $o->periodeRelation?->nom ?? $o->periode,
                'axe' => $o->axeObjectif?->nom,
                'axe_couleur' => $o->axeObjectif?->couleur,
            ]);

        // ─── Top collaborateurs (par tâches terminées) ──────
        $topCollaborateurs = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->withCount(['taches as taches_terminees' => fn ($q) => $q->where('statut', 'termine')])
            ->withCount('taches')
            ->orderByDesc('taches_terminees')
            ->take(5)
            ->get()
            ->map(fn ($c) => [
                'nom' => $c->nomComplet(),
                'poste' => $c->poste,
                'taches_terminees' => $c->taches_terminees,
                'taches_total' => $c->taches_count,
            ]);

        // ─── Seuils de performance ──────────────────────────
        $seuils = SeuilPerformance::where('societe_id', $societeId)->ordonne()->get();

        $periodes = Periode::where('societe_id', $societeId)->orderByDesc('date_debut')->get(['id', 'nom', 'date_debut', 'date_fin']);

        // ─── Activité récente ───────────────────────────────
        $activiteRecente = JournalActivite::where('societe_id', $societeId)
            ->with('collaborateur:id,nom,prenom')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'details' => $a->details,
                'collaborateur' => $a->collaborateur?->nomComplet() ?? 'Système',
                'date' => $a->created_at->diffForHumans(),
            ]);

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'dernieresTaches' => $dernieresTaches,
            'derniersObjectifs' => $derniersObjectifs,
            'progressionParAxe' => $progressionParAxe,
            'repartitionTaches' => $repartitionTaches,
            'pipeline' => $pipeline,
            'tachesAlerte' => $tachesAlerte,
            'topCollaborateurs' => $topCollaborateurs,
            'activiteRecente' => $activiteRecente,
            'seuils' => $seuils,
            'periodes' => $periodes,
            'axes' => $axes,
            'filters' => $request->only(['periode_id', 'axe_objectif_id']),
            'collaborateurNom' => $collaborateur->prenom,
        ]);
    }
}
