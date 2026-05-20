<?php

namespace App\Http\Controllers;

use App\Models\AxeObjectif;
use App\Models\ConfigurationOkr;
use App\Models\ConfigurationPrime;
use App\Models\Devise;
use App\Models\Module;
use App\Models\Periode;
use App\Models\SeuilPerformance;
use App\Models\Societe;
use App\Models\StatutObjectif;
use App\Models\TemplateObjectif;
use App\Models\TypeObjectif;
use App\Models\TypeResultatCle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SocieteController extends Controller
{
    public function edit(Request $request)
    {
        $societe = $request->user()->societeActuelle();

        if (!$societe) {
            abort(404, 'Aucune société trouvée.');
        }

        $societeId = $societe->id;

        return Inertia::render('Parametres/Index', [
            'societe'            => $societe->load('devise'),
            'devises'            => Devise::where('actif', true)->orderBy('code')->get(),
            'axes'               => AxeObjectif::pourSociete($societeId)->ordonne()->get(),
            'periodes'           => Periode::pourSociete($societeId)->latest()->get(),
            'typesObjectifs'     => TypeObjectif::pourSociete($societeId)->get(),
            'typesResultatsCles' => TypeResultatCle::pourSociete($societeId)->get(),
            'statuts'            => StatutObjectif::pourSociete($societeId)->ordonne()->get(),
            'seuils'             => SeuilPerformance::pourSociete($societeId)->ordonne()->get(),
            'configuration'      => ConfigurationOkr::where('societe_id', $societeId)->first(),
            'configurationPrime' => ConfigurationPrime::where('societe_id', $societeId)->with('paliers')->first(),
            'templates'          => TemplateObjectif::pourSociete($societeId)->get(),
            'tab'                => request('tab', 'societe'),
            'modulesDisponibles' => $this->buildModulesDisponibles($societe),
        ]);
    }

    private function buildModulesDisponibles(Societe $societe): array
    {
        $modules = Module::where('actif', true)->orderBy('ordre')->get();
        $activations = $societe->modules()
            ->get(['module_id', 'actif', 'active_le', 'desactive_le'])
            ->keyBy('pivot.module_id');

        return $modules->map(function (Module $module) use ($activations, $societe) {
            $pivot = $activations->get($module->id)?->pivot;
            return [
                'id'          => $module->id,
                'code'        => $module->code,
                'nom'         => $module->nom,
                'description' => $module->description,
                'icone'       => $module->icone,
                'couleur'     => $module->couleur,
                'categorie'   => $module->categorie,
                'est_core'    => $module->est_core,
                'est_premium' => $module->est_premium,
                'dependances' => $module->dependances ?? [],
                'actif'       => $module->est_core ? true : (bool) ($pivot?->actif ?? false),
                'active_le'   => $pivot?->active_le,
            ];
        })->values()->toArray();
    }

    public function update(Request $request)
    {
        $societe = $request->user()->societeActuelle();

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:20',
            'couleur_primaire' => 'nullable|string|max:7',
            'couleur_secondaire' => 'nullable|string|max:7',
            'mode_sombre' => 'boolean',
            'layout_mode' => 'nullable|string|in:sidebar,topbar',
            'devise_id'   => 'nullable|exists:devises,id',
        ]);

        $societe->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Paramètres mis à jour.');
    }

    public function updateLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $societe = $request->user()->societeActuelle();

        // Supprimer l'ancien logo
        if ($societe->logo) {
            Storage::disk('public')->delete($societe->logo);
        }

        $path = $request->file('logo')->store('logos', 'public');
        $societe->update(['logo' => $path]);

        return redirect()
            ->back()
            ->with('success', 'Logo mis à jour.');
    }
}
