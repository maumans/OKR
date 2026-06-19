<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\Livrable;
use App\Models\Mission;
use App\Models\MissionLog;
use App\Models\Practice;
use App\Models\TypeLivrable;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MissionController extends Controller
{
    public function index(Request $request)
    {
        $societeId = session('societe_id');

        $missions = Mission::where('societe_id', $societeId)
            ->with([
                'responsable:id,nom,prenom',
                'livrables:id,mission_id,nom,statut,dir_validated,deadline_envoi',
                'logs' => fn ($q) => $q->latest()->limit(20)->with('collaborateur:id,nom,prenom'),
            ])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->responsable_id, fn ($q, $id) => $q->where('responsable_id', $id))
            ->when($request->search, fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->where('titre', 'like', "%{$s}%")
                   ->orWhere('client', 'like', "%{$s}%");
            }))
            ->latest()
            ->get()
            ->map(fn ($m) => $this->formatMission($m));

        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->get(['id', 'nom', 'prenom']);

        $allMissions = Mission::where('societe_id', $societeId)->with('livrables:id,mission_id,statut')->get();
        $stats = [
            'total'               => $allMissions->count(),
            'en_attente'          => $allMissions->where('statut', 'en_attente_dir')->count(),
            'actifs'              => $allMissions->where('statut', 'active')->count(),
            'clotures'            => $allMissions->whereIn('statut', ['completed', 'archived'])->count(),
            'livrables_confirmer' => $allMissions->flatMap->livrables->whereIn('statut', ['review', 'validated'])->count(),
        ];

        return Inertia::render('Missions/Index', [
            'missions'       => $missions,
            'collaborateurs' => $collaborateurs,
            'filters'        => $request->only(['search', 'statut', 'type', 'responsable_id']),
            'stats'          => $stats,
            'practices'      => Practice::where('societe_id', $societeId)->actifs()->ordonne()->get(['id', 'nom']),
            'typesLivrable'  => TypeLivrable::where('societe_id', $societeId)->actifs()->ordonne()->get(['id', 'nom']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client'           => 'required|string|max:255',
            'titre'            => 'required|string|max:255',
            'type'             => 'required|in:audit,automation,transformation,formation,integration,conseil,deploiement',
            'practice'         => 'nullable|string|max:255',
            'responsable_id'   => 'nullable|exists:collaborateurs,id',
            'deadline'         => 'nullable|date',
            'montant'          => 'nullable|numeric|min:0',
            'email_nps_client' => 'nullable|email|max:255',
            'note'             => 'nullable|string',
            'next_action'      => 'nullable|string|max:500',
            'next_action_date' => 'nullable|date',
        ]);

        $mission = Mission::create(array_merge($validated, [
            'societe_id' => session('societe_id'),
            'statut'     => 'en_attente_dir',
        ]));

        MissionLog::create([
            'mission_id'      => $mission->id,
            'societe_id'      => session('societe_id'),
            'collaborateur_id'=> $request->user()->collaborateurActuel()?->id,
            'type'            => 'status',
            'content'         => 'Mission créée',
        ]);

        return redirect()->back()->with('success', 'Mission créée.');
    }

    public function update(Request $request, Mission $mission)
    {
        $this->authorizeSociete($mission);

        $validated = $request->validate([
            'client'           => 'sometimes|required|string|max:255',
            'titre'            => 'sometimes|required|string|max:255',
            'type'             => 'sometimes|required|in:audit,automation,transformation,formation,integration,conseil,deploiement',
            'practice'         => 'nullable|string|max:255',
            'statut'           => 'sometimes|in:en_attente_dir,draft,active,on_hold,completed,archived',
            'responsable_id'   => 'nullable|exists:collaborateurs,id',
            'deadline'         => 'nullable|date',
            'montant'          => 'nullable|numeric|min:0',
            'email_nps_client' => 'nullable|email|max:255',
            'note'             => 'nullable|string',
            'next_action'      => 'nullable|string|max:500',
            'next_action_date' => 'nullable|date',
            'last_channel'     => 'nullable|in:whatsapp,email,call,meeting',
            'last_contact_at'  => 'nullable|date',
        ]);

        $oldStatut = $mission->statut;
        $mission->update($validated);

        if (isset($validated['statut']) && $validated['statut'] !== $oldStatut) {
            MissionLog::create([
                'mission_id'      => $mission->id,
                'societe_id'      => $mission->societe_id,
                'collaborateur_id'=> $request->user()->collaborateurActuel()?->id,
                'type'            => 'status',
                'content'         => "Statut changé : {$oldStatut} → {$validated['statut']}",
            ]);

            if ($validated['statut'] === 'on_hold') {
                $notifService = app(NotificationService::class);
                $notifService->notifierResponsables(
                    $mission->societe_id,
                    'mission_critique',
                    "Projet bloqué : {$mission->titre}",
                    "Le projet a été mis en pause (on hold).",
                    ['mission_id' => $mission->id, 'url' => '/missions']
                );
            }
        }

        return redirect()->back()->with('success', 'Mission mise à jour.');
    }

    public function destroy(Mission $mission)
    {
        $this->authorizeSociete($mission);
        $mission->delete();
        return redirect()->back()->with('success', 'Mission supprimée.');
    }

    // ─── Livrables ─────────────────────────────────────────────────────────────

    public function storeLivrable(Request $request, Mission $mission)
    {
        $this->authorizeSociete($mission);

        $validated = $request->validate([
            'nom'                 => 'required|string|max:255',
            'type_livrable'       => 'nullable|string|max:100',
            'responsable_id'      => 'nullable|exists:collaborateurs,id',
            'deadline_envoi'      => 'nullable|date',
            'deadline_validation' => 'nullable|date',
            'url'                 => 'nullable|string|max:500',
        ]);

        $livrable = $mission->livrables()->create(array_merge($validated, [
            'societe_id' => $mission->societe_id,
        ]));

        MissionLog::create([
            'mission_id'      => $mission->id,
            'societe_id'      => $mission->societe_id,
            'collaborateur_id'=> $request->user()->collaborateurActuel()?->id,
            'type'            => 'livrable',
            'content'         => "Livrable ajouté : {$livrable->nom}",
        ]);

        return redirect()->back()->with('success', 'Livrable ajouté.');
    }

    public function updateLivrable(Request $request, Mission $mission, Livrable $livrable)
    {
        $this->authorizeSociete($mission);
        abort_if($livrable->mission_id !== $mission->id, 403);

        $validated = $request->validate([
            'nom'                 => 'sometimes|required|string|max:255',
            'type_livrable'       => 'nullable|string|max:100',
            'statut'              => 'sometimes|in:draft,review,validated,sent,feedback,approved,archived',
            'dir_validated'       => 'sometimes|boolean',
            'ar_count'            => 'sometimes|integer|min:0',
            'poids'               => 'sometimes|numeric|min:0.01|max:99.99',
            'responsable_id'      => 'nullable|exists:collaborateurs,id',
            'deadline_envoi'      => 'nullable|date',
            'deadline_validation' => 'nullable|date',
            'url'                 => 'nullable|string|max:500',
            'version'             => 'nullable|string|max:20',
        ]);

        $livrable->update($validated);

        return redirect()->back()->with('success', 'Livrable mis à jour.');
    }

    public function advanceLivrable(Request $request, Mission $mission, Livrable $livrable)
    {
        $this->authorizeSociete($mission);
        abort_if($livrable->mission_id !== $mission->id, 403);

        $next = $livrable->nextStatut();
        if (!$next) {
            return redirect()->back()->with('error', 'Ce livrable est déjà au statut final.');
        }

        $livrable->update(['statut' => $next]);

        MissionLog::create([
            'mission_id'      => $mission->id,
            'societe_id'      => $mission->societe_id,
            'collaborateur_id'=> $request->user()->collaborateurActuel()?->id,
            'type'            => 'livrable',
            'content'         => "Livrable \"{$livrable->nom}\" → {$next}",
        ]);

        // Notification in-app au responsable du livrable + de la mission
        $notifs = app(NotificationService::class);
        $statutLabel = [
            'review'    => 'en révision',
            'validated' => 'validé',
            'sent'      => 'envoyé',
            'feedback'  => 'en feedback',
            'approved'  => 'approuvé',
            'archived'  => 'archivé',
        ][$next] ?? $next;

        $titre = "Livrable « {$livrable->nom} » {$statutLabel}";
        $body  = "Mission : {$mission->titre} — Client : {$mission->client}";
        $data  = ['mission_id' => $mission->id, 'livrable_id' => $livrable->id, 'url' => '/missions'];

        $userIds = array_unique(array_filter([
            $livrable->responsable?->user_id,
            $mission->responsable?->user_id,
        ]));

        foreach ($userIds as $userId) {
            $notifs->notifierUser($mission->societe_id, $userId, 'livrable_statut', $titre, $body, $data);
        }

        return redirect()->back()->with('success', "Livrable avancé : {$next}.");
    }

    public function destroyLivrable(Mission $mission, Livrable $livrable)
    {
        $this->authorizeSociete($mission);
        abort_if($livrable->mission_id !== $mission->id, 403);
        $livrable->delete();
        return redirect()->back()->with('success', 'Livrable supprimé.');
    }

    // ─── Logs ──────────────────────────────────────────────────────────────────

    public function storeLog(Request $request, Mission $mission)
    {
        $this->authorizeSociete($mission);

        $validated = $request->validate([
            'type'    => 'required|in:action,note,status,livrable',
            'content' => 'required|string|max:1000',
        ]);

        MissionLog::create([
            'mission_id'      => $mission->id,
            'societe_id'      => $mission->societe_id,
            'collaborateur_id'=> $request->user()->collaborateurActuel()?->id,
            'type'            => $validated['type'],
            'content'         => $validated['content'],
        ]);

        return redirect()->back()->with('success', 'Log enregistré.');
    }

    // ─── Validation DIR ────────────────────────────────────────────────────────

    public function validateDir(Request $request, Mission $mission)
    {
        $this->authorizeSociete($mission);

        $mission->update([
            'statut'       => 'active',
            'dir_validated' => true,
        ]);

        MissionLog::create([
            'mission_id'      => $mission->id,
            'societe_id'      => $mission->societe_id,
            'collaborateur_id'=> $request->user()->collaborateurActuel()?->id,
            'type'            => 'status',
            'content'         => 'Projet validé par la Direction — démarrage autorisé',
        ]);

        return redirect()->back()->with('success', 'Projet validé et démarré.');
    }

    // ─── NPS ───────────────────────────────────────────────────────────────────

    public function updateNps(Request $request, Mission $mission)
    {
        $this->authorizeSociete($mission);

        $validated = $request->validate([
            'nps_score' => 'required|integer|min:0|max:10',
        ]);

        $mission->update(['nps_score' => $validated['nps_score']]);

        return redirect()->back()->with('success', 'Score NPS enregistré.');
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private function authorizeSociete(Mission $mission): void
    {
        abort_if($mission->societe_id !== session('societe_id'), 403);
    }

    private function formatMission(Mission $mission): array
    {
        return [
            'id'              => $mission->id,
            'client'          => $mission->client,
            'titre'           => $mission->titre,
            'type'            => $mission->type,
            'practice'        => $mission->practice,
            'statut'          => $mission->statut,
            'deadline'        => $mission->deadline?->format('Y-m-d'),
            'montant'         => $mission->montant,
            'email_nps_client'=> $mission->email_nps_client,
            'dir_validated'   => $mission->dir_validated,
            'nps_score'       => $mission->nps_score,
            'note'            => $mission->note,
            'next_action'     => $mission->next_action,
            'next_action_date'=> $mission->next_action_date?->format('Y-m-d'),
            'last_channel'    => $mission->last_channel,
            'last_contact_at' => $mission->last_contact_at?->format('Y-m-d H:i'),
            'pressure'        => $mission->pressure,
            'responsable_id'  => $mission->responsable_id,
            'responsable'     => $mission->responsable
                ? ['id' => $mission->responsable->id, 'nom' => $mission->responsable->nomComplet()]
                : null,
            'livrables'       => $mission->livrables->map(fn ($l) => [
                'id'                  => $l->id,
                'nom'                 => $l->nom,
                'type_livrable'       => $l->type_livrable,
                'version'             => $l->version,
                'statut'              => $l->statut,
                'dir_validated'       => $l->dir_validated,
                'ar_count'            => $l->ar_count,
                'url'                 => $l->url,
                'responsable_id'      => $l->responsable_id,
                'deadline_envoi'      => $l->deadline_envoi?->format('Y-m-d'),
                'deadline_validation' => $l->deadline_validation?->format('Y-m-d'),
                'jours_restants'      => $l->deadline_envoi
                    ? (int) now()->startOfDay()->diffInDays($l->deadline_envoi, false)
                    : null,
            ])->values(),
            'logs'            => $mission->logs->map(fn ($log) => [
                'id'          => $log->id,
                'type'        => $log->type,
                'content'     => $log->content,
                'auteur'      => $log->collaborateur?->nomComplet(),
                'created_at'  => $log->created_at->format('d/m/Y H:i'),
            ])->values(),
            'created_at'      => $mission->created_at->format('d/m/Y'),
        ];
    }
}
