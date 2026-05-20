<?php

namespace App\Http\Controllers\Parametres;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ModuleSocieteController extends Controller
{
    public function index()
    {
        $societe = Auth::user()->collaborateurActuel()->societe;

        $modules = Module::where('actif', true)
            ->orderBy('ordre')
            ->get();

        // Charger l'état d'activation pour cette société
        $activations = $societe->modules()
            ->get(['module_id', 'actif', 'active_le', 'desactive_le'])
            ->keyBy('pivot.module_id');

        $modulesAvecEtat = $modules->map(function (Module $module) use ($activations, $societe) {
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
        });

        return Inertia::render('Parametres/Index', [
            'modulesDisponibles' => $modulesAvecEtat,
        ]);
    }

    public function toggle(Module $module)
    {
        $collaborateur = Auth::user()->collaborateurActuel();

        if (!$collaborateur->estAdmin()) {
            abort(403, 'Seul un administrateur peut modifier les modules.');
        }

        if ($module->est_core) {
            abort(403, 'Les modules cœur ne peuvent pas être désactivés.');
        }

        $societe = $collaborateur->societe;
        $pivot = $societe->modules()->where('module_id', $module->id)->first();

        if (!$pivot) {
            // Pas encore dans le pivot — on l'ajoute activé
            $societe->modules()->attach($module->id, [
                'actif'              => true,
                'active_le'          => now(),
                'active_par_user_id' => Auth::id(),
            ]);
            audit('module.active', "Module « {$module->nom} » activé.", ['module_code' => $module->code], $societe->id);

            return redirect()->back()->with('success', "Module « {$module->nom} » activé.");
        }

        $actuellementActif = (bool) $pivot->pivot->actif;

        if ($actuellementActif) {
            // Vérifier les dépendants : y a-t-il des modules actifs qui dépendent de celui-ci ?
            $dependants = $this->getModulesDependants($societe, $module->code);
            if ($dependants->isNotEmpty()) {
                $noms = $dependants->pluck('nom')->join(', ');
                return redirect()->back()->withErrors([
                    'module' => "Impossible de désactiver : les modules suivants en dépendent : {$noms}.",
                ]);
            }

            $societe->modules()->updateExistingPivot($module->id, [
                'actif'        => false,
                'desactive_le' => now(),
            ]);
            audit('module.desactive', "Module « {$module->nom} » désactivé.", ['module_code' => $module->code], $societe->id);
            return redirect()->back()->with('success', "Module « {$module->nom} » désactivé.");
        } else {
            // Activer : vérifier d'abord les dépendances
            $dependancesManquantes = $this->getDependancesManquantes($societe, $module);
            if ($dependancesManquantes->isNotEmpty()) {
                $noms = $dependancesManquantes->pluck('nom')->join(', ');
                return redirect()->back()->withErrors([
                    'module' => "Ce module nécessite l'activation préalable de : {$noms}.",
                ]);
            }

            $societe->modules()->updateExistingPivot($module->id, [
                'actif'              => true,
                'active_le'          => now(),
                'desactive_le'       => null,
                'active_par_user_id' => Auth::id(),
            ]);
            audit('module.active', "Module « {$module->nom} » activé.", ['module_code' => $module->code], $societe->id);
            return redirect()->back()->with('success', "Module « {$module->nom} » activé.");
        }
    }

    private function getModulesDependants($societe, string $code)
    {
        $modulesActifs = $societe->modulesActifs()->get();
        return $modulesActifs->filter(function (Module $m) use ($code) {
            return in_array($code, $m->dependances ?? []);
        });
    }

    private function getDependancesManquantes($societe, Module $module)
    {
        if (empty($module->dependances)) {
            return collect();
        }

        $codesActifs = $societe->modulesActifs()->pluck('code')->toArray();
        return Module::whereIn('code', $module->dependances)
            ->get()
            ->filter(fn (Module $dep) => !in_array($dep->code, $codesActifs));
    }
}
