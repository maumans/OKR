<?php

namespace App\Http\Controllers;

use App\Models\Tache;
use App\Models\Periode;
use App\Models\Collaborateur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EisenhowerController extends Controller
{
    public function index(Request $request)
    {
        $societeId = session('societe_id');

        $periodes = Periode::where('societe_id', $societeId)
            ->actives()
            ->orderBy('date_debut')
            ->get(['id', 'nom', 'date_debut', 'date_fin', 'type']);

        // Déterminer la période active (filtre ou période en cours)
        $periodeId = $request->periode_id;
        if (!$periodeId) {
            $periodeEnCours = Periode::where('societe_id', $societeId)->enCours()->first();
            $periodeId = $periodeEnCours?->id;
        }

        // Récupérer les tâches qui ont un quadrant Eisenhower assigné
        $query = Tache::where('societe_id', $societeId)
            ->whereNotNull('eisenhower')
            ->where('eisenhower', '!=', '')
            ->with([
                'collaborateur:id,nom,prenom',
                'objectif:id,titre,periode_id,axe_objectif_id',
                'objectif.axeObjectif:id,nom,couleur',
                'resultatCle:id,description',
            ]);

        // Filtre par période (via l'objectif lié)
        if ($periodeId) {
            $query->whereHas('objectif', function ($q) use ($periodeId) {
                $q->where('periode_id', $periodeId);
            });
        }

        // Filtre par collaborateur
        if ($request->collaborateur_id) {
            $query->where('collaborateur_id', $request->collaborateur_id);
        }

        $taches = $query
            ->orderByRaw("FIELD(priorite, 'urgente', 'haute', 'normale', 'basse')")
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'titre' => $t->titre,
                'description' => $t->description,
                'statut' => $t->statut,
                'priorite' => $t->priorite,
                'eisenhower' => $t->eisenhower,
                'date' => $t->date?->format('Y-m-d'),
                'collaborateur' => $t->collaborateur->nomComplet(),
                'collaborateur_id' => $t->collaborateur_id,
                'objectif_titre' => $t->objectif?->titre,
                'objectif_id' => $t->objectif_id,
                'axe_couleur' => $t->objectif?->axeObjectif?->couleur,
                'resultat_cle' => $t->resultatCle?->description,
                'resultat_cle_id' => $t->resultat_cle_id,
            ]);

        // Grouper par quadrant
        $quadrants = [
            'Q1' => $taches->where('eisenhower', 'Q1')->values(),
            'Q2' => $taches->where('eisenhower', 'Q2')->values(),
            'Q3' => $taches->where('eisenhower', 'Q3')->values(),
            'Q4' => $taches->where('eisenhower', 'Q4')->values(),
        ];

        // Stats
        $stats = [
            'total' => $taches->count(),
            'terminees' => $taches->where('statut', 'termine')->count(),
            'Q1' => $quadrants['Q1']->count(),
            'Q2' => $quadrants['Q2']->count(),
            'Q3' => $quadrants['Q3']->count(),
            'Q4' => $quadrants['Q4']->count(),
        ];

        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->get(['id', 'nom', 'prenom']);

        $selectedPeriode = $periodeId
            ? $periodes->firstWhere('id', (int) $periodeId)
            : null;

        return Inertia::render('Matrice/Index', [
            'quadrants' => $quadrants,
            'stats' => $stats,
            'periodes' => $periodes,
            'collaborateurs' => $collaborateurs,
            'selectedPeriode' => $selectedPeriode,
            'filters' => $request->only(['periode_id', 'collaborateur_id']),
        ]);
    }

    public function updateEisenhower(Request $request, Tache $tache)
    {
        if ($tache->societe_id !== session('societe_id')) {
            abort(403);
        }

        $validated = $request->validate([
            'eisenhower' => 'nullable|in:Q1,Q2,Q3,Q4',
        ]);

        $tache->update(['eisenhower' => $validated['eisenhower']]);

        return redirect()->back()->with('success', 'Quadrant Eisenhower mis à jour.');
    }
}
