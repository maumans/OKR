<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\FichePerformance;
use App\Models\HistoriqueWorkflowPerformance;
use App\Services\OkrPerformanceSyncService;
use App\Services\PrimeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceController extends Controller
{
    public function index(Request $request): Response
    {
        $societeId   = session('societe_id');
        $collab      = $request->user()->collaborateurActuel();
        $primeService = app(PrimeService::class);

        // ── Visibilité des fiches selon le rôle ────────────────────────────────
        // Admin / Directeur / DRH → toutes les fiches
        // Manager              → fiches des collaborateurs qu'il manage (manager_id)
        // Collaborateur simple → uniquement sa propre fiche
        $peutVoirTout = $collab && (
            $collab->estAdmin() ||
            $collab->estDirecteur() ||
            $collab->estDrh()
        );

        $fichesQuery = FichePerformance::pourSociete($societeId)
            ->with([
                'collaborateur',
                'manager',
                'historiqueWorkflow.user',
            ])
            ->when(! $peutVoirTout && $collab?->estManager(), fn ($q) =>
                // Le manager voit ses propres fiches + celles qu'il manage
                $q->where(fn ($sub) =>
                    $sub->where('manager_id', $collab->id)
                        ->orWhere('collaborateur_id', $collab->id)
                )
            )
            ->when(! $peutVoirTout && ! $collab?->estManager(), fn ($q) =>
                // Collaborateur simple : uniquement sa fiche
                $q->where('collaborateur_id', $collab?->id)
            )
            ->orderBy('cycle', 'desc')
            ->orderBy('created_at', 'desc');

        $fiches = $fichesQuery->get()
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
                'prime_estimee' => $primeService->calculerPrime($f),
            ]));

        $collaborateurs = Collaborateur::pourSociete($societeId)
            ->actifs()
            // Manager → uniquement son équipe ; collaborateur simple → lui seul
            ->when(! $peutVoirTout && $collab?->estManager() && $collab->departement_id,
                fn ($q) => $q->where('departement_id', $collab->departement_id)
            )
            ->when(! $peutVoirTout && ! $collab?->estManager(),
                fn ($q) => $q->where('id', $collab?->id)
            )
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
            'total'           => $fiches->count(),
            'brouillon'       => $fiches->where('statut', 'brouillon')->count(),
            'auto_evaluation' => $fiches->where('statut', 'auto_evaluation')->count(),
            'attente_drh'     => $fiches->where('statut', 'attente_drh')->count(),
            'confirme'        => $fiches->where('statut', 'confirme')->count(),
            'contestation'    => $fiches->where('statut', 'contestation')->count(),
        ];

        return Inertia::render('Performance/Index', [
            'fiches'         => $fiches,
            'collaborateurs' => $collaborateurs,
            'cycles'         => $cycles,
            'stats'          => $stats,
            'peutVoirTout'   => $peutVoirTout,
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
        ], $dimRules));

        $fiche->fill($validated);
        $fiche->save();
        $fiche->recalculerScoreGlobal();

        return back()->with('success', 'Fiche mise à jour.');
    }

    public function avancerWorkflow(Request $request, FichePerformance $fiche): RedirectResponse
    {
        $validated = $request->validate([
            'vers_statut' => ['required', 'string', 'in:auto_evaluation,attente_drh,confirme,contestation'],
            'commentaire' => ['nullable', 'string', 'max:1000'],
        ]);

        // ── Vérification de la transition autorisée (state machine) ──────────
        $transitions = FichePerformance::TRANSITIONS[$fiche->statut] ?? [];
        if (!in_array($validated['vers_statut'], $transitions)) {
            return back()->withErrors([
                'vers_statut' => "Transition de \"{$fiche->statut}\" vers \"{$validated['vers_statut']}\" non autorisée.",
            ]);
        }

        // ── Vérification du rôle par transition ──────────────────────────────
        $collab = $request->user()->collaborateurActuel();

        $estGestionnaire = $collab &&
            ($collab->estAdmin() || $collab->estDirecteur() || $collab->estManager());

        $estCollaborateurEvalue = $collab && $collab->id === $fiche->collaborateur_id;

        $estDrh = $collab && ($collab->estDrh() || $collab->estAdmin());

        $transitionKey = "{$fiche->statut}__{$validated['vers_statut']}";

        $roleOk = match ($transitionKey) {
            // Manager/Admin/Dir envoient la fiche au collaborateur
            'brouillon__auto_evaluation'         => $estGestionnaire,
            // Manager/Admin/Dir reprennent après contestation
            'contestation__auto_evaluation'      => $estGestionnaire,
            // Manager/Admin/Dir soumettent à la DRH
            'auto_evaluation__attente_drh'       => $estGestionnaire,
            // Seul le collaborateur évalué peut contester
            'auto_evaluation__contestation'      => $estCollaborateurEvalue,
            // DRH approuve ou renvoie directement en auto-évaluation
            'attente_drh__confirme'              => $estDrh,
            'attente_drh__auto_evaluation'       => $estDrh,
            default                              => false,
        };

        if (!$roleOk) {
            return back()->withErrors([
                'vers_statut' => 'Vous n\'avez pas le rôle requis pour effectuer cette action.',
            ]);
        }

        // ── Limite aller-retours : contestation collab + renvoi DRH comptent ────
        $isRetour = ($fiche->statut === 'auto_evaluation' && $validated['vers_statut'] === 'contestation')
            || ($fiche->statut === 'attente_drh' && $validated['vers_statut'] === 'auto_evaluation');
        if ($isRetour && $fiche->nb_aller_retour >= 3) {
            return back()->withErrors([
                'vers_statut' => 'Le nombre maximum d\'allers-retours (3) est atteint.',
            ]);
        }

        // ── Transition ───────────────────────────────────────────────────────
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

    public function syncOkr(Request $request, FichePerformance $fiche, OkrPerformanceSyncService $syncService): RedirectResponse
    {
        if ($fiche->verrouille) {
            abort(403, 'Cette fiche est verrouillée.');
        }

        $details = $syncService->syncFiche($fiche);

        $dims = array_filter($details);
        if (empty($dims)) {
            return back()->withErrors(['sync' => 'Aucun KR avec un responsable assigné dans un axe "commercial" ou "delivery". Assignez un responsable aux KRs concernés.']);
        }

        $messages = [];
        foreach ($dims as $dim => $d) {
            $messages[] = ucfirst($dim) . " : {$d['kr_count']} KR(s) · {$d['progression']}% → {$d['score_auto']}/5";
        }

        return back()->with('success', 'Scores synchronisés depuis les OKR · ' . implode(' · ', $messages));
    }

    public function validerCollab(Request $request, FichePerformance $fiche): RedirectResponse
    {
        $collab = $request->user()->collaborateurActuel();

        if (!$collab || $collab->id !== $fiche->collaborateur_id) {
            abort(403, 'Seul le collaborateur évalué peut valider sa fiche.');
        }

        if ($fiche->statut !== 'auto_evaluation') {
            abort(403, 'La validation n\'est possible qu\'en phase d\'auto-évaluation.');
        }

        $fiche->accord_collab    = true;
        $fiche->accord_collab_at = now();
        $fiche->save();

        HistoriqueWorkflowPerformance::create([
            'fiche_performance_id' => $fiche->id,
            'de_statut'            => $fiche->statut,
            'vers_statut'          => $fiche->statut,
            'user_id'              => $request->user()->id,
            'commentaire'          => '✅ Collaborateur a approuvé la fiche',
        ]);

        return back()->with('success', 'Vous avez approuvé votre fiche de performance.');
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
