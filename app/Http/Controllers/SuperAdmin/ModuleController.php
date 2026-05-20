<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function index()
    {
        $modules = Module::withCount(['societes' => fn ($q) => $q->where('societe_module.actif', true)])
            ->orderBy('ordre')
            ->get();

        return Inertia::render('SuperAdmin/Modules/Index', [
            'modules' => $modules,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'        => 'required|string|unique:modules,code',
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string',
            'icone'       => 'nullable|string|max:50',
            'couleur'     => 'nullable|string|max:20',
            'categorie'   => 'required|string',
            'est_premium' => 'boolean',
            'ordre'       => 'integer',
        ]);

        $module = Module::create($validated);
        \audit('module.creer', "Module « {$module->nom} » créé dans le catalogue.", ['module_code' => $module->code]);

        return redirect()->back()->with('success', "Module « {$module->nom} » créé.");
    }

    public function update(Request $request, Module $module)
    {
        $validated = $request->validate([
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string',
            'icone'       => 'nullable|string|max:50',
            'couleur'     => 'nullable|string|max:20',
            'categorie'   => 'required|string',
            'est_premium' => 'boolean',
            'ordre'       => 'integer',
            'actif'       => 'boolean',
        ]);

        $module->update($validated);
        \audit('module.modifier', "Module « {$module->nom} » modifié.", ['module_code' => $module->code]);

        return redirect()->back()->with('success', "Module « {$module->nom} » mis à jour.");
    }
}
