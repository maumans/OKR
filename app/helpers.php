<?php

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

if (!function_exists('audit')) {
    function audit(string $action, ?string $description = null, array $donnees = [], ?int $societeId = null): void
    {
        try {
            AuditLog::create([
                'user_id'     => Auth::id(),
                'societe_id'  => $societeId ?? Auth::user()?->collaborateurActuel()?->societe_id,
                'action'      => $action,
                'description' => $description,
                'donnees'     => $donnees ?: null,
                'ip'          => request()->ip(),
                'user_agent'  => request()->userAgent(),
            ]);
        } catch (\Throwable) {
            // Ne jamais bloquer le flux principal si l'audit échoue
        }
    }
}
