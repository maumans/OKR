<?php

namespace App\Http\Controllers\Parametres;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Support\Facades\Auth;

class ModuleSocieteController extends Controller
{
    public function index()
    {
        return redirect()->route('parametres.index', ['tab' => 'modules']);
    }

    public function toggle(Module $module)
    {
        if (!Auth::user()->is_superadmin) {
            abort(403, 'Seule la plateforme Addvalis peut activer ou désactiver des modules.');
        }

        $collaborateur = Auth::user()->collaborateurActuel();

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
