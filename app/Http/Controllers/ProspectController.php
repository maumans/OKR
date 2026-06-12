<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Prospect;
use App\Models\Collaborateur;
use App\Events\ProspectStatutChange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ProspectController extends Controller
{
    private const ACTIF_STATUTS = ['decouverte', 'proposition', 'negociation'];

    public function index(Request $request)
    {
        Gate::authorize('viewAny', Prospect::class);
        $societeId = session('societe_id');

        $prospects = Prospect::where('societe_id', $societeId)
            ->with('collaborateur:id,nom,prenom', 'client:id,nom,contact,secteur', 'actionsCommerciales')
            ->when($request->search, fn ($q, $s) =>
                $q->where(fn ($qq) =>
                    $qq->where('titre', 'like', "%{$s}%")
                       ->orWhere('nom', 'like', "%{$s}%")
                )
            )
            ->when($request->collaborateur_id, fn ($q, $c) => $q->where('collaborateur_id', $c))
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id'                   => $p->id,
                'titre'                => $p->titre,
                'nom'                  => $p->client?->nom ?? $p->nom,
                'client_id'            => $p->client_id,
                'contact'              => $p->contact,
                'secteur'              => $p->secteur,
                'valeur'               => (float) ($p->valeur ?? 0),
                'probabilite'          => (int) ($p->probabilite ?? 0),
                'type_deal'            => $p->type_deal ?? 'nouveau_client',
                'collaborateur_id'     => $p->collaborateur_id,
                'collaborateur_prenom' => $p->collaborateur?->prenom,
                'collaborateur_nom'    => $p->collaborateur?->nom,
                'statut'               => $p->statut,
                'prochain_rdv'         => $p->prochain_rdv?->format('Y-m-d'),
                'source'               => $p->source,
                'montant_final'        => (float) ($p->montant_final ?? 0),
                'note'                 => $p->note,
                'created_at'           => $p->created_at?->format('Y-m-d'),
                'actions_count'        => $p->actionsCommerciales->count(),
                'actions'              => $p->actionsCommerciales
                    ->sortByDesc('date_action')
                    ->values()
                    ->map(fn ($a) => [
                        'id'          => $a->id,
                        'type'        => $a->type,
                        'description' => $a->description,
                        'date_action' => $a->date_action?->format('Y-m-d'),
                        'duree'       => $a->duree,
                        'resultat'    => $a->resultat,
                        'created_at'  => $a->created_at?->format('Y-m-d H:i'),
                    ]),
            ]);

        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id', 'nom', 'prenom']);

        $clients = Client::where('societe_id', $societeId)
            ->orderBy('nom')
            ->get(['id', 'nom', 'contact', 'secteur', 'site_web', 'note']);

        // ── Stats KPI (sur tous les deals sans filtre collaborateur)
        $allDeals = Prospect::where('societe_id', $societeId)
            ->get(['statut', 'type_deal', 'valeur', 'probabilite', 'montant_final', 'collaborateur_id']);

        // CA signé = somme montant_final des deals gagnés (fallback sur valeur si montant_final absent)
        $caSigne = $allDeals->where('statut', 'gagne')
            ->sum(fn ($p) => (float) ($p->montant_final ?? $p->valeur ?? 0));

        $dealsActifs     = $allDeals->whereIn('statut', self::ACTIF_STATUTS)->count();
        $nouveauxClients = $allDeals->where('statut', 'gagne')->where('type_deal', 'nouveau_client')->count();
        $upsells         = $allDeals->where('statut', 'gagne')->where('type_deal', 'upsell')->count();

        // Pipeline pondéré = SUM(valeur × probabilité) pour deals actifs
        $pipelinePrevisif = $allDeals->whereIn('statut', self::ACTIF_STATUTS)
            ->sum(fn ($p) => (float) ($p->valeur ?? 0) * ((int) ($p->probabilite ?? 0) / 100));

        // Pipeline brut = SUM(valeur) pour deals actifs (avant pondération)
        $pipelineBrut = $allDeals->whereIn('statut', self::ACTIF_STATUTS)
            ->sum(fn ($p) => (float) ($p->valeur ?? 0));

        // Deals actifs sans valeur estimée → alerte qualité données
        $dealsSansValeur = $allDeals->whereIn('statut', self::ACTIF_STATUTS)
            ->filter(fn ($p) => $p->valeur === null || $p->valeur == 0)
            ->count();

        $stats = [
            'ca_signe'               => (float) $caSigne,
            'pipeline_previsionnel'  => (int) round((float) $pipelinePrevisif),
            'pipeline_brut'          => (float) $pipelineBrut,
            'deals_actifs'           => $dealsActifs,
            'deals_sans_valeur'      => $dealsSansValeur,
            'nouveaux_clients'       => $nouveauxClients,
            'upsells'                => $upsells,
        ];

        // ── Pipeline par responsable
        $pipelineParCollab = $collaborateurs->map(function ($collab) use ($allDeals) {
            $dealsCollab = $allDeals->where('collaborateur_id', $collab->id);

            // CA signé (avec fallback valeur si montant_final absent)
            $caSigne  = (float) $dealsCollab->where('statut', 'gagne')
                ->sum(fn ($p) => (float) ($p->montant_final ?? $p->valeur ?? 0));

            // Pipeline pondéré des deals actifs
            $pipeline = (float) $dealsCollab->whereIn('statut', self::ACTIF_STATUTS)
                ->sum(fn ($p) => (float) ($p->valeur ?? 0) * ((int) ($p->probabilite ?? 0) / 100));

            // Pipeline brut des deals actifs (avant pondération)
            $pipelineBrut = (float) $dealsCollab->whereIn('statut', self::ACTIF_STATUTS)
                ->sum(fn ($p) => (float) ($p->valeur ?? 0));

            // Opportunité totale = CA déjà signé + pipeline brut restant
            $objectif = $caSigne + $pipelineBrut;
            $taux     = $objectif > 0 ? min(100, (int) round(($caSigne / $objectif) * 100)) : ($caSigne > 0 ? 100 : 0);

            return [
                'id'            => $collab->id,
                'prenom'        => $collab->prenom,
                'nom'           => $collab->nom,
                'ca_signe'      => $caSigne,
                'pipeline'      => (int) round($pipeline),
                'pipeline_brut' => (int) round($pipelineBrut),
                'objectif'      => $objectif,
                'taux'          => $taux,
            ];
        })->filter(fn ($c) => $c['objectif'] > 0 || $c['ca_signe'] > 0)->values();

        return Inertia::render('Prospection/Index', [
            'prospects'         => $prospects,
            'filters'           => $request->only(['search', 'collaborateur_id']),
            'collaborateurs'    => $collaborateurs,
            'clients'           => $clients,
            'stats'             => $stats,
            'pipelineParCollab' => $pipelineParCollab,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', Prospect::class);

        $validated = $request->validate([
            'titre'            => 'nullable|string|max:255',
            'nom'              => 'nullable|string|max:255',
            'client_id'        => 'nullable|exists:clients,id',
            'contact'          => 'nullable|string|max:255',
            'secteur'          => 'nullable|string|max:255',
            'valeur'           => 'nullable|numeric|min:0',
            'probabilite'      => 'nullable|integer|min:0|max:100',
            'type_deal'        => 'nullable|in:nouveau_client,upsell,renouvellement',
            'statut'           => 'nullable|in:decouverte,proposition,negociation,gagne,perdu',
            'collaborateur_id' => 'nullable|exists:collaborateurs,id',
            'note'             => 'nullable|string',
            'prochain_rdv'     => 'nullable|date',
        ]);

        // Si un client est sélectionné, son nom est la référence
        if (!empty($validated['client_id'])) {
            $client = Client::find($validated['client_id']);
            if ($client) {
                $validated['nom'] = $client->nom;
            }
        }

        if (empty($validated['nom'])) {
            return back()->withErrors(['nom' => 'Le nom de l\'entreprise est requis.']);
        }

        Prospect::create([
            'societe_id'       => session('societe_id'),
            'titre'            => $validated['titre'] ?? null,
            'nom'              => $validated['nom'],
            'client_id'        => $validated['client_id'] ?? null,
            'contact'          => $validated['contact'] ?? null,
            'secteur'          => $validated['secteur'] ?? null,
            'valeur'           => $validated['valeur'] ?? null,
            'probabilite'      => $validated['probabilite'] ?? 20,
            'type_deal'        => $validated['type_deal'] ?? 'nouveau_client',
            'statut'           => $validated['statut'] ?? 'decouverte',
            'collaborateur_id' => $validated['collaborateur_id'] ?? null,
            'note'             => $validated['note'] ?? null,
            'prochain_rdv'     => $validated['prochain_rdv'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Deal ajouté au pipeline.');
    }

    public function update(Request $request, Prospect $prospect)
    {
        Gate::authorize('update', $prospect);

        $validated = $request->validate([
            'titre'            => 'nullable|string|max:255',
            'nom'              => 'nullable|string|max:255',
            'client_id'        => 'nullable|exists:clients,id',
            'contact'          => 'nullable|string|max:255',
            'secteur'          => 'nullable|string|max:255',
            'valeur'           => 'nullable|numeric|min:0',
            'probabilite'      => 'nullable|integer|min:0|max:100',
            'type_deal'        => 'nullable|in:nouveau_client,upsell,renouvellement',
            'statut'           => 'nullable|in:decouverte,proposition,negociation,gagne,perdu',
            'collaborateur_id' => 'nullable|exists:collaborateurs,id',
            'note'             => 'nullable|string',
            'prochain_rdv'     => 'nullable|date',
        ]);

        if (!empty($validated['client_id'])) {
            $client = Client::find($validated['client_id']);
            if ($client) {
                $validated['nom'] = $client->nom;
            }
        }

        $prospect->update($validated);

        return redirect()->back()->with('success', 'Deal mis à jour.');
    }

    public function updateStatus(Request $request, Prospect $prospect)
    {
        Gate::authorize('update', $prospect);

        $validated = $request->validate([
            'statut' => 'required|in:decouverte,proposition,negociation,gagne,perdu',
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
            'type'        => 'required|in:appel,email,reunion,note,relance',
            'description' => 'nullable|string',
            'date_action' => 'required|date',
            'duree'       => 'nullable|integer|min:0',
            'resultat'    => 'nullable|string',
        ]);

        $prospect->actionsCommerciales()->create([
            'societe_id'       => session('societe_id'),
            'collaborateur_id' => $request->user()->collaborateurActuel()?->id,
            'type'             => $validated['type'],
            'description'      => $validated['description'] ?? null,
            'date_action'      => $validated['date_action'],
            'duree'            => $validated['duree'] ?? null,
            'resultat'         => $validated['resultat'] ?? null,
        ]);

        if ($prospect->date_premier_contact === null) {
            $prospect->update(['date_premier_contact' => $validated['date_action']]);
        }

        return redirect()->back()->with('success', 'Action enregistrée.');
    }

    public function destroy(Prospect $prospect)
    {
        Gate::authorize('delete', $prospect);
        $prospect->delete();
        return redirect()->back()->with('success', 'Deal supprimé.');
    }
}
