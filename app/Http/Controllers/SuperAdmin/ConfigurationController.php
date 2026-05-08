<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ConfigurationController extends Controller
{
    public function index(\App\Models\Societe $societe)
    {
        return \Inertia\Inertia::render('SuperAdmin/Societes/Parametres', [
            'societe' => $societe,
            'axes' => \App\Models\AxeObjectif::withoutGlobalScope('pourSociete')->where('societe_id', $societe->id)->orderBy('ordre')->get(),
            'periodes' => \App\Models\Periode::withoutGlobalScope('pourSociete')->where('societe_id', $societe->id)->latest()->get(),
            'typesObjectifs' => \App\Models\TypeObjectif::withoutGlobalScope('pourSociete')->where('societe_id', $societe->id)->get(),
            'typesResultatsCles' => \App\Models\TypeResultatCle::withoutGlobalScope('pourSociete')->where('societe_id', $societe->id)->get(),
            'statuts' => \App\Models\StatutObjectif::withoutGlobalScope('pourSociete')->where('societe_id', $societe->id)->orderBy('ordre')->get(),
            'seuils' => \App\Models\SeuilPerformance::withoutGlobalScope('pourSociete')->where('societe_id', $societe->id)->orderBy('ordre')->get(),
            'configuration' => \App\Models\ConfigurationOkr::where('societe_id', $societe->id)->first(),
            'configurationPrime' => \App\Models\ConfigurationPrime::where('societe_id', $societe->id)->with('paliers')->first(),
        ]);
    }

    public function storeAxe(Request $request, \App\Models\Societe $societe)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'couleur' => 'required|string|max:7',
            'ordre' => 'nullable|integer',
        ]);
        $validated['societe_id'] = $societe->id;
        \App\Models\AxeObjectif::create($validated);
        return redirect()->back()->with('success', 'Axe stratégique créé.');
    }

    public function updateAxe(Request $request, \App\Models\Societe $societe, \App\Models\AxeObjectif $axe)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'couleur' => 'required|string|max:7',
            'ordre' => 'nullable|integer',
            'actif' => 'boolean',
        ]);
        $axe->update($validated);
        return redirect()->back()->with('success', 'Axe mis à jour.');
    }

    public function destroyAxe(\App\Models\Societe $societe, \App\Models\AxeObjectif $axe)
    {
        $axe->delete();
        return redirect()->back()->with('success', 'Axe supprimé.');
    }

    // Périodes
    public function storePeriode(Request $request, \App\Models\Societe $societe)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'type' => 'required|string|in:mensuel,trimestriel,annuel',
        ]);
        $validated['societe_id'] = $societe->id;
        \App\Models\Periode::create($validated);
        return redirect()->back()->with('success', 'Période créée.');
    }

    public function updatePeriode(Request $request, \App\Models\Societe $societe, \App\Models\Periode $periode)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'type' => 'required|string|in:mensuel,trimestriel,annuel',
            'statut' => 'required|string|in:actif,cloture',
        ]);
        $periode->update($validated);
        return redirect()->back()->with('success', 'Période mise à jour.');
    }

    public function destroyPeriode(\App\Models\Societe $societe, \App\Models\Periode $periode)
    {
        $periode->delete();
        return redirect()->back()->with('success', 'Période supprimée.');
    }

    // Types d'objectifs
    public function storeTypeObjectif(Request $request, \App\Models\Societe $societe)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'niveau' => 'required|string|in:entreprise,equipe,individuel',
        ]);
        $validated['societe_id'] = $societe->id;
        \App\Models\TypeObjectif::create($validated);
        return redirect()->back()->with('success', 'Type d\'objectif créé.');
    }

    public function updateTypeObjectif(Request $request, \App\Models\Societe $societe, \App\Models\TypeObjectif $typeObjectif)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'niveau' => 'required|string|in:entreprise,equipe,individuel',
        ]);
        $typeObjectif->update($validated);
        return redirect()->back()->with('success', 'Type mis à jour.');
    }

    public function destroyTypeObjectif(\App\Models\Societe $societe, \App\Models\TypeObjectif $typeObjectif)
    {
        $typeObjectif->delete();
        return redirect()->back()->with('success', 'Type supprimé.');
    }

    // Types de résultats clés
    public function storeTypeResultat(Request $request, \App\Models\Societe $societe)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'type_valeur' => 'required|string|in:number,percent,boolean,currency',
            'unite' => 'nullable|string|max:50',
        ]);
        $validated['societe_id'] = $societe->id;
        \App\Models\TypeResultatCle::create($validated);
        return redirect()->back()->with('success', 'Type de résultat clé créé.');
    }

    public function updateTypeResultat(Request $request, \App\Models\Societe $societe, \App\Models\TypeResultatCle $typeResultat)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'type_valeur' => 'required|string|in:number,percent,boolean,currency',
            'unite' => 'nullable|string|max:50',
        ]);
        $typeResultat->update($validated);
        return redirect()->back()->with('success', 'Type de résultat mis à jour.');
    }

    public function destroyTypeResultat(\App\Models\Societe $societe, \App\Models\TypeResultatCle $typeResultat)
    {
        $typeResultat->delete();
        return redirect()->back()->with('success', 'Type de résultat supprimé.');
    }

    // Statuts
    public function storeStatut(Request $request, \App\Models\Societe $societe)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'couleur' => 'required|string|max:7',
            'ordre' => 'nullable|integer',
            'est_final' => 'boolean',
        ]);
        $validated['societe_id'] = $societe->id;
        \App\Models\StatutObjectif::create($validated);
        return redirect()->back()->with('success', 'Statut créé.');
    }

    public function updateStatut(Request $request, \App\Models\Societe $societe, \App\Models\StatutObjectif $statut)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'couleur' => 'required|string|max:7',
            'ordre' => 'nullable|integer',
            'est_final' => 'boolean',
        ]);
        $statut->update($validated);
        return redirect()->back()->with('success', 'Statut mis à jour.');
    }

    public function destroyStatut(\App\Models\Societe $societe, \App\Models\StatutObjectif $statut)
    {
        $statut->delete();
        return redirect()->back()->with('success', 'Statut supprimé.');
    }

    // Seuils de performance
    public function storeSeuil(Request $request, \App\Models\Societe $societe)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'couleur' => 'required|string|max:7',
            'seuil_min' => 'required|numeric|min:0|max:100',
            'seuil_max' => 'required|numeric|min:0|max:100|gt:seuil_min',
            'ordre' => 'nullable|integer',
        ]);
        $validated['societe_id'] = $societe->id;
        \App\Models\SeuilPerformance::create($validated);
        return redirect()->back()->with('success', 'Seuil créé.');
    }

    public function updateSeuil(Request $request, \App\Models\Societe $societe, \App\Models\SeuilPerformance $seuil)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'couleur' => 'required|string|max:7',
            'seuil_min' => 'required|numeric|min:0|max:100',
            'seuil_max' => 'required|numeric|min:0|max:100|gt:seuil_min',
            'ordre' => 'nullable|integer',
        ]);
        $seuil->update($validated);
        return redirect()->back()->with('success', 'Seuil mis à jour.');
    }

    public function destroySeuil(\App\Models\Societe $societe, \App\Models\SeuilPerformance $seuil)
    {
        $seuil->delete();
        return redirect()->back()->with('success', 'Seuil supprimé.');
    }

    // Configuration OKR
    public function updateConfiguration(Request $request, \App\Models\Societe $societe)
    {
        $validated = $request->validate([
            'mode_calcul' => 'required|string|in:moyenne,pondere,manuel',
            'frequence_update' => 'required|string|in:quotidien,hebdomadaire,mensuel',
            'rappel_automatique' => 'boolean',
            'visibilite_defaut' => 'required|string|in:tous,equipe,prive',
            'vue_okr' => 'required|string|in:cards,liste',
        ]);

        \App\Models\ConfigurationOkr::updateOrCreate(
            ['societe_id' => $societe->id],
            $validated
        );

        return redirect()->back()->with('success', 'Configuration OKR mise à jour.');
    }

    // Configuration des primes
    public function updateConfigurationPrime(Request $request, \App\Models\Societe $societe)
    {
        $validated = $request->validate([
            'actif' => 'boolean',
            'montant_max' => 'nullable|numeric|min:0',
            'seuil_minimum' => 'required|numeric|min:0|max:100',
            'mode_calcul' => 'required|string|in:fixe,proportionnel,palier',
            'paliers' => 'nullable|array',
            'paliers.*.seuil_min' => 'required_with:paliers|numeric|min:0|max:100',
            'paliers.*.seuil_max' => 'required_with:paliers|numeric|min:0|max:100',
            'paliers.*.pourcentage_prime' => 'required_with:paliers|numeric|min:0|max:100',
        ]);

        $config = \App\Models\ConfigurationPrime::updateOrCreate(
            ['societe_id' => $societe->id],
            collect($validated)->except('paliers')->toArray()
        );

        if ($validated['mode_calcul'] === 'palier' && !empty($validated['paliers'])) {
            $config->paliers()->delete();
            foreach ($validated['paliers'] as $index => $palier) {
                $config->paliers()->create([
                    'seuil_min' => $palier['seuil_min'],
                    'seuil_max' => $palier['seuil_max'],
                    'pourcentage_prime' => $palier['pourcentage_prime'],
                    'ordre' => $index,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Configuration des primes mise à jour.');
    }
}
