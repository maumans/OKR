<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\Livrable;
use App\Models\Mission;
use App\Models\MissionLog;
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

        return Inertia::render('Missions/Index', [
            'missions'       => $missions,
            'collaborateurs' => $collaborateurs,
            'filters'        => $request->only(['search', 'statut', 'type', 'responsable_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client'          => 'required|string|max:255',
            'titre'           => 'required|string|max:255',
            'type'            => 'required|in:audit,automation,transformation,formation,integration',
            'practice'        => 'nullable|string|max:255',
            'responsable_id'  => 'nullable|exists:collaborateurs,id',
            'deadline'        => 'nullable|date',
            'note'            => 'nullable|string',
            'next_action'     => 'nullable|string|max:500',
            'next_action_date'=> 'nullable|date',
        ]);

        $mission = Mission::create(array_merge($validated, [
            'societe_id' => session('societe_id'),
            'statut'     => 'active',
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
            'type'             => 'sometimes|required|in:audit,automation,transformation,formation,integration',
            'practice'         => 'nullable|string|max:255',
            'statut'           => 'sometimes|in:draft,active,on_hold,completed,archived',
            'responsable_id'   => 'nullable|exists:collaborateurs,id',
            'deadline'         => 'nullable|date',
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
            'url'                 => 'nullable|url|max:500',
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
            'responsable_id'      => 'nullable|exists:collaborateurs,id',
            'deadline_envoi'      => 'nullable|date',
            'deadline_validation' => 'nullable|date',
            'url'                 => 'nullable|url|max:500',
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
