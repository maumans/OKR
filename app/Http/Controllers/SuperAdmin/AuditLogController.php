<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Societe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with(['user', 'societe'])->latest();

        if ($request->societe_id) {
            $query->where('societe_id', $request->societe_id);
        }
        if ($request->action) {
            $query->where('action', 'like', "%{$request->action}%");
        }
        if ($request->search) {
            $query->where('description', 'like', "%{$request->search}%");
        }
        if ($request->date_debut) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        if ($request->date_fin) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        $logs = $query->paginate(50)->withQueryString();
        $societes = Societe::orderBy('nom')->get(['id', 'nom']);

        return Inertia::render('SuperAdmin/AuditLogs/Index', [
            'logs'     => $logs,
            'societes' => $societes,
            'filters'  => $request->only(['societe_id', 'action', 'search', 'date_debut', 'date_fin']),
        ]);
    }
}
