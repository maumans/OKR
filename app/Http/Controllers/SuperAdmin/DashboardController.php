<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Module;
use App\Models\Societe;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalSocietes    = Societe::count();
        $societesActives  = Societe::where('statut', 'actif')->orWhereNull('statut')->count();
        $totalUsers       = User::where('is_superadmin', false)->count();
        $totalModules     = Module::where('actif', true)->count();

        // Dernières sociétés inscrites
        $dernieresSocietes = Societe::withCount('collaborateurs')
            ->latest()
            ->limit(5)
            ->get(['id', 'nom', 'statut', 'created_at']);

        // Derniers logs d'audit
        $derniersLogs = AuditLog::with(['user', 'societe'])
            ->latest()
            ->limit(10)
            ->get();

        // Modules les plus adoptés
        $topModules = Module::withCount(['societes' => fn ($q) => $q->where('societe_module.actif', true)])
            ->orderByDesc('societes_count')
            ->limit(5)
            ->get(['id', 'code', 'nom', 'icone', 'couleur']);

        // Croissance inscriptions sur 12 mois
        $croissance = Societe::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as mois, COUNT(*) as total')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'total_societes'   => $totalSocietes,
                'societes_actives' => $societesActives,
                'total_users'      => $totalUsers,
                'total_modules'    => $totalModules,
            ],
            'dernieresSocietes' => $dernieresSocietes,
            'derniersLogs'      => $derniersLogs,
            'topModules'        => $topModules,
            'croissance'        => $croissance,
        ]);
    }
}
