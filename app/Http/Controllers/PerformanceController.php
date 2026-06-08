<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\FichePerformance;
use App\Models\HistoriqueWorkflowPerformance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceController extends Controller
{
    public function index(Request $request): Response
    {
        $societeId = session('societe_id');

        $fiches = FichePerformance::pourSociete($societeId)
            ->with([
                'collaborateur',
                'manager',
                'historiqueWorkflow.user',
            ])
            ->orderBy('cycle', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($f) => array_merge($f->toArray(), [
                'collaborateur' => $f->collaborateur ? [
                    'id'       => $f->collaborateur->id,
                    'prenom'   => $f->collaborateur->prenom,
                    'nom'      => $f->collaborateur->nom,
                    'poste'    => $f->collaborateur->poste,
                    'practice' => $f->collaborateur->practice,
                    'grade'    => $f->collaborateur->grade,
                ] : null,
                'manager' => $f->manager ? [
                    'id'     => $f->manager->id,
                    'prenom' => $f->manager->prenom,
                    'nom'    => $f->manager->nom,
                ] : null,
                'historique_workflow' => $f->historiqueWorkflow->map(fn ($h) => [
                    'id'          => $h->id,
                    'de_statut'   => $h->de_statut,
                    'vers_statut' => $h->vers_statut,
                    'commentaire' => $h->commentaire,
                    'created_at'  => $h->created_at?->toIso8601String(),
                    'user'        => $h->user ? ['name' => $h->user->name] : null,
                ])->all(),
            ]));

        $collaborateurs = Collaborateur::pourSociete($societeId)
            ->actifs()
            ->orderBy('nom')
            ->get()
            ->map(fn ($c) => [
                'id'       => $c->id,
                'prenom'   => $c->prenom,
                'nom'      => $c->nom,
                'poste'    => $c->poste,
                'grade'    => $c->grade,
                'practice' => $c->practice,
            ]);

        $cycles = $fiches->pluck('cycle')->unique()->sort()->values();

        $stats = [
            'total'             => $fiches->count(),
            'brouillon'         => $fiches->where('statut', 'brouillon')->count(),
            'en_revision'       => $fiches->where('statut', 'en_revision')->count(),
            'attente_drh'       => $fiches->where('statut', 'attente_drh')->count(),
            'confirme'          => $fiches->where('statut', 'confirme')->count(),
            'revision_demandee' => $fiches->where('statut', 'revision_demandee')->count(),
        ];

        return Inertia::render('Performance/Index', [
            'fiches'         => $fiches,
            'collaborateurs' => $collaborateurs,
            'cycles'         => $cycles,
            'stats'          => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'collaborateur_id' => ['required', 'integer', 'exists:collaborateurs,id'],
            'cycle'            => ['required', 'string', 'max:20'],
            'type_cycle'       => ['required', 'in:trimestriel,annuel'],
            'periode_debut'    => ['nullable', 'date'],
            'periode_fin'      => ['nullable', 'date', 'after_or_equal:periode_debut'],
            'manager_id'       => ['nullable', 'integer', 'exists:collaborateurs,id'],
        ]);

        $societeId = session('societe_id');

        $existe = FichePerformance::pourSociete($societeId)
            ->where('collaborateur_id', $validated['collaborateur_id'])
            ->where('cycle', $validated['cycle'])
            ->exists();

        if ($existe) {
            return back()->withErrors([
                'collaborateur_id' => 'Une fiche existe déjà pour ce collaborateur sur ce cycle.',
            ]);
        }

        $fiche = FichePerformance::create(array_merge($validated, [
            'societe_id' => $societeId,
        ]));

        HistoriqueWorkflowPerformance::create([
            'fiche_performance_id' => $fiche->id,
            'de_statut'            => null,
            'vers_statut'          => 'brouillon',
            'user_id'              => $request->user()->id,
            'commentaire'          => 'Fiche créée',
        ]);

        $fiche->recalculerScoreGlobal();

        return back()->with('success', 'Fiche de performance créée.');
    }

    public function update(Request $request, FichePerformance $fiche): RedirectResponse
    {
        if ($fiche->verrouille) {
            abort(403, 'Cette fiche est verrouillée et ne peut plus être modifiée.');
        }

        $dimRules = [];
        foreach (['commercial', 'delivery', 'developpement', 'comportemental'] as $dim) {
            $dimRules["objectif_{$dim}"]                  = ['nullable', 'string', 'max:500'];
            $dimRules["cible_{$dim}"]                     = ['nullable', 'string', 'max:255'];
            $dimRules["commentaire_manager_{$dim}"]       = ['nullable', 'string', 'max:2000'];
            $dimRules["commentaire_collaborateur_{$dim}"] = ['nullable', 'string', 'max:2000'];
            $dimRules["score_collab_{$dim}"]              = ['nullable', 'integer', 'min:1', 'max:5'];
        }

        $validated = $request->validate(array_merge([
            'score_commercial'      => ['nullable', 'numeric', 'min:0', 'max:5'],
            'poids_commercial'      => ['nullable', 'numeric', 'min:0', 'max:1'],
            'score_delivery'        => ['nullable', 'numeric', 'min:0', 'max:5'],
            'poids_delivery'        => ['nullable', 'numeric', 'min:0', 'max:1'],
            'score_developpement'   => ['nullable', 'numeric', 'min:0', 'max:5'],
            'poids_developpement'   => ['nullable', 'numeric', 'min:0', 'max:1'],
            'score_comportemental'  => ['nullable', 'numeric', 'min:0', 'max:5'],
            'poids_comportemental'  => ['nullable', 'numeric', 'min:0', 'max:1'],
            'commentaire_manager'               => ['nullable', 'string', 'max:2000'],
            'commentaire_collaborateur'         => ['nullable', 'string', 'max:2000'],
            'commentaire_drh'                   => ['nullable', 'string', 'max:2000'],
            'commentaire_mid_year_manager'      => ['nullable', 'string', 'max:2000'],
            'commentaire_mid_year_collaborateur'=> ['nullable', 'string', 'max:2000'],
            'forecast_revision'                 => ['nullable', 'string', 'max:2000'],
            'final_commentaire_manager'         => ['nullable', 'string', 'max:2000'],
            'final_commentaire_collaborateur'   => ['nullable', 'string', 'max:2000'],
            'manager_id'                        => ['nullable', 'integer', 'exists:collaborateurs,id'],
            'periode_debut'                     => ['nullable', 'date'],
            'periode_fin'                       => ['nullable', 'date'],
            'objectif_okr_id_commercial'        => ['nullable', 'integer', 'exists:objectifs,id'],
            'objectif_okr_id_delivery'          => ['nullable', 'integer', 'exists:objectifs,id'],
        ], $dimRules));

        $fiche->fill($validated);
        $fiche->save();
        $fiche->recalculerScoreGlobal();

        return back()->with('success', 'Fiche mise à jour.');
    }

    public function avancerWorkflow(Request $request, FichePerformance $fiche): RedirectResponse
    {
        $validated = $request->validate([
            'vers_statut' => ['required', 'string', 'in:brouillon,en_revision,attente_drh,confirme,revision_demandee'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ]);

        $transitions = FichePerformance::TRANSITIONS[$fiche->statut] ?? [];

        if (!in_array($validated['vers_statut'], $transitions)) {
            return back()->withErrors([
                'vers_statut' => "Transition de \"{$fiche->statut}\" vers \"{$validated['vers_statut']}\" non autorisée.",
            ]);
        }

        $isRetour = in_array($validated['vers_statut'], ['brouillon', 'revision_demandee']);
        if ($isRetour && $fiche->nb_aller_retour >= 3) {
            return back()->withErrors([
                'vers_statut' => 'Le nombre maximum d\'allers-retours (3) est atteint.',
            ]);
        }

        $deStatut      = $fiche->statut;
        $fiche->statut = $validated['vers_statut'];

        if ($isRetour) {
            $fiche->nb_aller_retour++;
        }

        if ($validated['vers_statut'] === 'confirme') {
            $fiche->validated_at    = now();
            $fiche->validated_by_id = $request->user()->id;
            $fiche->verrouille      = true;
        }

        $fiche->save();

        HistoriqueWorkflowPerformance::create([
            'fiche_performance_id' => $fiche->id,
            'de_statut'            => $deStatut,
            'vers_statut'          => $validated['vers_statut'],
            'user_id'              => $request->user()->id,
            'commentaire'          => $validated['commentaire'] ?? null,
        ]);

        return back()->with('success', 'Workflow avancé.');
    }

    public function cloturerFinale(Request $request, FichePerformance $fiche): RedirectResponse
    {
        if (!in_array($fiche->statut, ['attente_drh', 'confirme'])) {
            abort(403, 'La clôture finale nécessite le statut Attente DRH ou Confirmé.');
        }

        if ($fiche->final_done) {
            return back()->withErrors(['final' => 'L\'évaluation finale a déjà été clôturée pour ce cycle.']);
        }

        $validated = $request->validate([
            'final_commentaire_manager'       => ['nullable', 'string', 'max:2000'],
            'final_commentaire_collaborateur' => ['nullable', 'string', 'max:2000'],
            'final_prime_calculee'            => ['nullable', 'numeric', 'min:0'],
        ]);

        $deStatut = $fiche->statut;

        $fiche->fill($validated);
        $fiche->final_done         = true;
        $fiche->final_date         = now();
        $fiche->final_score_global = $fiche->score_global;
        $fiche->final_appreciation = FichePerformance::calculerAppreciation($fiche->score_global);
        $fiche->statut             = 'confirme';
        $fiche->verrouille         = true;
        $fiche->validated_at       = now();
        $fiche->validated_by_id    = $request->user()->id;
        $fiche->save();

        HistoriqueWorkflowPerformance::create([
            'fiche_performance_id' => $fiche->id,
            'de_statut'            => $deStatut,
            'vers_statut'          => 'confirme',
            'user_id'              => $request->user()->id,
            'commentaire'          => 'Évaluation finale clôturée',
        ]);

        return back()->with('success', 'Évaluation finale clôturée avec succès.');
    }

    public function destroy(FichePerformance $fiche): RedirectResponse
    {
        if ($fiche->statut !== 'brouillon') {
            abort(403, 'Seules les fiches en brouillon peuvent être supprimées.');
        }

        $fiche->delete();

        return back()->with('success', 'Fiche supprimée.');
    }
}
