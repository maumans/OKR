import { useState } from 'react';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ACTION_ICONS = {
    'societe.creer': '🏢', 'societe.supprimer': '🗑️', 'societe.suspendre': '⏸️', 'societe.reactiver': '▶️', 'societe.modifier': '✏️',
    'module.active': '✅', 'module.desactive': '❌',
    'impersonation.start': '👤', 'impersonation.stop': '👤',
    'user.promouvoir_superadmin': '⭐', 'user.revoquer_superadmin': '🚫',
    'abonnement.creer': '💳', 'abonnement.modifier': '💳',
};

export default function AuditLogsIndex({ logs, societes, filters }) {
    const [f, setF] = useState({ ...filters });

    const apply = (patch) => {
        const next = { ...f, ...patch };
        setF(next);
        router.get(route('superadmin.audit-logs.index'), next, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    };

    const items = logs.data || [];
    const meta = logs.meta || {};

    return (
        <SuperAdminLayout title="Audit & Logs" breadcrumb={[{ label: 'Audit & Logs' }]}>
            {/* Filtres */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-5">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            value={f.search || ''}
                            onChange={e => {
                                const val = e.target.value;
                                setF(prev => ({ ...prev, search: val }));
                                clearTimeout(window._auditTimer);
                                window._auditTimer = setTimeout(() => apply({ search: val }), 400);
                            }}
                            placeholder="Rechercher dans les descriptions..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                        />
                    </div>
                    <SearchableSelect value={f.societe_id || ""} onChange={v => apply({ societe_id: v })} options={societes.map(s => ({ value: String(s.id), label: s.nom }))} nullable nullLabel="Toutes les sociétés" placeholder="Toutes les sociétés" />
                    <input
                        type="text"
                        value={f.action || ''}
                        onChange={e => apply({ action: e.target.value })}
                        placeholder="Action (ex: module.active)"
                        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 w-52"
                    />
                    <input
                        type="date"
                        value={f.date_debut || ''}
                        onChange={e => apply({ date_debut: e.target.value })}
                        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                    />
                    <span className="text-slate-400 text-sm">→</span>
                    <input
                        type="date"
                        value={f.date_fin || ''}
                        onChange={e => apply({ date_fin: e.target.value })}
                        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                    />
                    {Object.values(f).some(Boolean) && (
                        <button onClick={() => { setF({}); router.get(route('superadmin.audit-logs.index')); }} className="text-[12px] text-rose-500 hover:text-rose-600">
                            Réinitialiser
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Société</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Utilisateur</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {items.length === 0 ? (
                                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400 italic">Aucun log trouvé</td></tr>
                            ) : items.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{ACTION_ICONS[log.action] || '📋'}</span>
                                            <code className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                                {log.action}
                                            </code>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-[13px] text-slate-700 dark:text-slate-300 max-w-xs truncate">
                                        {log.description || '—'}
                                    </td>
                                    <td className="px-5 py-3 text-[12px] text-slate-500 hidden md:table-cell">
                                        {log.societe?.nom || '—'}
                                    </td>
                                    <td className="px-5 py-3 text-[12px] text-slate-500 hidden lg:table-cell">
                                        {log.user?.name || 'Système'}
                                    </td>
                                    <td className="px-5 py-3 text-[12px] text-slate-400 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[12px] text-slate-400">{meta.from}–{meta.to} sur {meta.total} logs</p>
                        <div className="flex items-center gap-1">
                            {(logs.links || []).map((link, i) => {
                                if (link.label === '&laquo; Previous') return (
                                    <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                );
                                if (link.label === 'Next &raquo;') return (
                                    <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                );
                                return (
                                    <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url || link.active}
                                        className={`min-w-[28px] h-7 px-1.5 rounded text-[12px] font-medium transition-colors ${link.active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
