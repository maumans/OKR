<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\Societe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AbonnementController extends Controller
{
    public function index()
    {
        $abonnements = Abonnement::with(['societe', 'devise'])
            ->latest()
            ->paginate(30);

        return Inertia::render('SuperAdmin/Abonnements/Index', [
            'abonnements' => $abonnements,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'societe_id'          => 'required|exists:societes,id',
            'plan'                => 'required|in:starter,pro,enterprise',
            'prix_mensuel'        => 'required|numeric|min:0',
            'devise_id'           => 'nullable|exists:devises,id',
            'date_debut'          => 'required|date',
            'date_fin'            => 'nullable|date|after:date_debut',
            'limite_utilisateurs' => 'required|integer|min:1',
            'limite_okr'          => 'nullable|integer|min:1',
            'notes'               => 'nullable|string',
        ]);

        $abonnement = Abonnement::create($validated);
        $societe = Societe::find($validated['societe_id']);
        \audit('abonnement.creer', "Abonnement {$abonnement->planLabel()} créé pour « {$societe->nom} ».", ['abonnement_id' => $abonnement->id], $societe->id);

        return redirect()->back()->with('success', "Abonnement créé pour « {$societe->nom} ».");
    }

    public function update(Request $request, Abonnement $abonnement)
    {
        $validated = $request->validate([
            'plan'                => 'required|in:starter,pro,enterprise',
            'prix_mensuel'        => 'required|numeric|min:0',
            'devise_id'           => 'nullable|exists:devises,id',
            'date_debut'          => 'required|date',
            'date_fin'            => 'nullable|date',
            'statut'              => 'required|in:actif,suspendu,annule',
            'limite_utilisateurs' => 'required|integer|min:1',
            'limite_okr'          => 'nullable|integer|min:1',
            'notes'               => 'nullable|string',
        ]);

        $abonnement->update($validated);
        \audit('abonnement.modifier', "Abonnement #{$abonnement->id} mis à jour.", ['abonnement_id' => $abonnement->id], $abonnement->societe_id);

        return redirect()->back()->with('success', 'Abonnement mis à jour.');
    }
}
