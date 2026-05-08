<?php

namespace App\Http\Controllers;

use App\Models\ObjectifRemunere;
use App\Models\ValidationObjectif;
use App\Models\Collaborateur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IncentiveController extends Controller
{
    public function index(Request $request)
    {
        $societeId = session('societe_id');
        $collaborateur = $request->user()->collaborateurActuel();

        // On récupère les collaborateurs de la société
        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id', 'nom', 'prenom']);
        $collabIds = $collaborateurs->pluck('id')->toArray();

        $objectifs = ObjectifRemunere::whereIn('collaborateur_id', $collabIds)
            ->with(['collaborateur', 'validations'])
            ->latest()
            ->get()
            ->map(function ($obj) {
                // Calcule le taux global et la prime totale versée
                $tauxAtteinte = $obj->validations->avg('taux_atteinte') ?? 0;
                $primeVersee = $obj->validations->sum('prime_versee') ?? 0;

                return [
                    'id' => $obj->id,
                    'titre' => $obj->titre,
                    'type' => $obj->type,
                    'indicateur' => $obj->indicateur,
                    'periode' => $obj->periode,
                    'prime_cible' => $obj->prime,
                    'taux_atteinte' => $tauxAtteinte,
                    'prime_versee' => $primeVersee,
                    'collaborateur' => $obj->collaborateur->nomComplet(),
                    'collaborateur_id' => $obj->collaborateur_id,
                ];
            });

        return Inertia::render('Incentives/Index', [
            'objectifs' => $objectifs,
            'collaborateurs' => $collaborateurs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'collaborateur_id' => 'required|exists:collaborateurs,id',
            'titre' => 'required|string|max:255',
            'type' => 'nullable|string',
            'indicateur' => 'nullable|string',
            'periode' => 'required|string',
            'prime' => 'required|numeric|min:0',
        ]);

        ObjectifRemunere::create($validated);

        return redirect()->back()->with('success', 'Objectif rémunéré créé.');
    }

    public function validationIndex(Request $request)
    {
        // Vue pour les managers/admins pour valider les primes
        $societeId = session('societe_id');
        $collaborateurs = Collaborateur::where('societe_id', $societeId)->actifs()->get(['id']);
        
        $objectifs = ObjectifRemunere::whereIn('collaborateur_id', $collaborateurs->pluck('id'))
            ->with(['collaborateur', 'validations'])
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'titre' => $o->titre,
                'prime_cible' => $o->prime,
                'collaborateur' => $o->collaborateur->nomComplet(),
                'taux_actuel' => $o->validations->avg('taux_atteinte') ?? 0,
            ]);

        return Inertia::render('Incentives/Validation', [
            'objectifs' => $objectifs,
        ]);
    }

    public function validateIncentive(Request $request, ObjectifRemunere $objectifRemunere)
    {
        $validated = $request->validate([
            'taux_atteinte' => 'required|numeric|min:0|max:100',
        ]);

        $taux = $validated['taux_atteinte'];
        $primeVersee = ($objectifRemunere->prime * $taux) / 100;

        ValidationObjectif::create([
            'objectif_remunere_id' => $objectifRemunere->id,
            'taux_atteinte' => $taux,
            'prime_versee' => $primeVersee,
        ]);

        return redirect()->back()->with('success', 'Prime validée et calculée.');
    }
}
