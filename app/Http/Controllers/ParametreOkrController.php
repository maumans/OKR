<?php

namespace App\Http\Controllers;

use App\Models\AxeObjectif;
use App\Models\Periode;
use App\Models\TypeObjectif;
use App\Models\TypeResultatCle;
use App\Models\StatutObjectif;
use App\Models\SeuilPerformance;
use App\Models\ConfigurationOkr;
use App\Models\ConfigurationPrime;
use App\Models\PalierPrime;
use App\Models\TemplateObjectif;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ParametreOkrController extends Controller
{
    public function index()
    {
        $societeId = session('societe_id');

        return Inertia::render('Parametres/OKR', [
            'axes' => AxeObjectif::pourSociete($societeId)->ordonne()->get(),
            'periodes' => Periode::pourSociete($societeId)->latest()->get(),
            'typesObjectifs' => TypeObjectif::pourSociete($societeId)->get(),
            'typesResultatsCles' => TypeResultatCle::pourSociete($societeId)->get(),
            'statuts' => StatutObjectif::pourSociete($societeId)->ordonne()->get(),
            'seuils' => SeuilPerformance::pourSociete($societeId)->ordonne()->get(),
            'configuration' => ConfigurationOkr::where('societe_id', $societeId)->first(),
            'configurationPrime' => ConfigurationPrime::where('societe_id', $societeId)->with('paliers')->first(),
            'templates' => TemplateObjectif::pourSociete($societeId)->get(),
        ]);
    }

    // ─── Axes stratégiques ───────────────────────────────────

    public function storeAxe(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'couleur' => 'required|string|max:7',
            'ordre' => 'nullable|integer',
        ]);

        AxeObjectif::create($validated);

        return redirect()->back()->with('success', 'Axe stratégique créé.');
    }

    public function updateAxe(Request $request, AxeObjectif $axe)
    {
        $this->authorizeSociete($axe);

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

    public function destroyAxe(AxeObjectif $axe)
    {
        $this->authorizeSociete($axe);
        $axe->delete();

        return redirect()->back()->with('success', 'Axe supprimé.');
    }

    // ─── Périodes ────────────────────────────────────────────

    public function storePeriode(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'type' => 'required|string|in:mensuel,trimestriel,annuel',
        ]);

        Periode::create($validated);

        return redirect()->back()->with('success', 'Période créée.');
    }

    public function updatePeriode(Request $request, Periode $periode)
    {
        $this->authorizeSociete($periode);

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

    public function destroyPeriode(Periode $periode)
    {
        $this->authorizeSociete($periode);
        $periode->delete();

        return redirect()->back()->with('success', 'Période supprimée.');
    }

    // ─── Types d'objectifs ──────────────────────────────────

    public function storeTypeObjectif(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'niveau' => 'required|string|in:entreprise,equipe,individuel',
        ]);

        TypeObjectif::create($validated);

        return redirect()->back()->with('success', 'Type d\'objectif créé.');
    }

    public function updateTypeObjectif(Request $request, TypeObjectif $typeObjectif)
    {
        $this->authorizeSociete($typeObjectif);

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'niveau' => 'required|string|in:entreprise,equipe,individuel',
        ]);

        $typeObjectif->update($validated);

        return redirect()->back()->with('success', 'Type mis à jour.');
    }

    public function destroyTypeObjectif(TypeObjectif $typeObjectif)
    {
        $this->authorizeSociete($typeObjectif);
        $typeObjectif->delete();

        return redirect()->back()->with('success', 'Type supprimé.');
    }

    // ─── Types de résultats clés ─────────────────────────────

    public function storeTypeResultat(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'type_valeur' => 'required|string|in:number,percent,boolean,currency',
            'unite' => 'nullable|string|max:50',
        ]);

        TypeResultatCle::create($validated);

        return redirect()->back()->with('success', 'Type de résultat clé créé.');
    }

    public function updateTypeResultat(Request $request, TypeResultatCle $typeResultat)
    {
        $this->authorizeSociete($typeResultat);

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'type_valeur' => 'required|string|in:number,percent,boolean,currency',
            'unite' => 'nullable|string|max:50',
        ]);

        $typeResultat->update($validated);

        return redirect()->back()->with('success', 'Type de résultat mis à jour.');
    }

    public function destroyTypeResultat(TypeResultatCle $typeResultat)
    {
        $this->authorizeSociete($typeResultat);
        $typeResultat->delete();

        return redirect()->back()->with('success', 'Type de résultat supprimé.');
    }

    // ─── Statuts ─────────────────────────────────────────────

    public function storeStatut(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'couleur' => 'required|string|max:7',
            'ordre' => 'nullable|integer',
            'est_final' => 'boolean',
        ]);

        StatutObjectif::create($validated);

        return redirect()->back()->with('success', 'Statut créé.');
    }

    public function updateStatut(Request $request, StatutObjectif $statut)
    {
        $this->authorizeSociete($statut);

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'couleur' => 'required|string|max:7',
            'ordre' => 'nullable|integer',
            'est_final' => 'boolean',
        ]);

        $statut->update($validated);

        return redirect()->back()->with('success', 'Statut mis à jour.');
    }

    public function destroyStatut(StatutObjectif $statut)
    {
        $this->authorizeSociete($statut);
        $statut->delete();

        return redirect()->back()->with('success', 'Statut supprimé.');
    }

    // ─── Seuils de performance ───────────────────────────────

    public function storeSeuil(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'couleur' => 'required|string|max:7',
            'seuil_min' => 'required|numeric|min:0|max:100',
            'seuil_max' => 'required|numeric|min:0|max:100|gt:seuil_min',
            'ordre' => 'nullable|integer',
        ]);

        SeuilPerformance::create($validated);

        return redirect()->back()->with('success', 'Seuil créé.');
    }

    public function updateSeuil(Request $request, SeuilPerformance $seuil)
    {
        $this->authorizeSociete($seuil);

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

    public function destroySeuil(SeuilPerformance $seuil)
    {
        $this->authorizeSociete($seuil);
        $seuil->delete();

        return redirect()->back()->with('success', 'Seuil supprimé.');
    }

    // ─── Configuration OKR ───────────────────────────────────

    public function updateConfiguration(Request $request)
    {
        $validated = $request->validate([
            'mode_calcul' => 'required|string|in:moyenne,pondere,manuel',
            'frequence_update' => 'required|string|in:quotidien,hebdomadaire,mensuel',
            'rappel_automatique' => 'boolean',
            'visibilite_defaut' => 'required|string|in:tous,equipe,prive',
            'vue_okr' => 'required|string|in:cards,liste',
        ]);

        ConfigurationOkr::updateOrCreate(
            ['societe_id' => session('societe_id')],
            $validated
        );

        return redirect()->back()->with('success', 'Configuration OKR mise à jour.');
    }

    // ─── Configuration des primes ────────────────────────────

    public function updateConfigurationPrime(Request $request)
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

        $config = ConfigurationPrime::updateOrCreate(
            ['societe_id' => session('societe_id')],
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

    // ─── Auth helper ─────────────────────────────────────────

    private function authorizeSociete($model)
    {
        if ($model->societe_id !== session('societe_id')) {
            abort(403);
        }
    }
}
