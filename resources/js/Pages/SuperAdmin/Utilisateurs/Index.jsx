import { Link, router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import { Users, Eye, Shield, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react';

export default function UtilisateursIndex({ utilisateurs }) {
    const items = utilisateurs.data || [];
    const meta = utilisateurs.meta || {};

    const handlePromouvoir = (user) => {
        if (!confirm(`Promouvoir « ${user.name} » en super-administrateur ?`)) return;
        router.post(route('superadmin.utilisateurs.promouvoir', user.id), {}, { preserveScroll: true });
    };
    const handleRevoquer = (user) => {
        if (!confirm(`Révoquer les droits superadmin de « ${user.name} » ?`)) return;
        router.post(route('superadmin.utilisateurs.revoquer', user.id), {}, { preserveScroll: true });
    };

    return (
        <SuperAdminLayout title="Utilisateurs" breadcrumb={[{ label: 'Utilisateurs' }]}>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tous les utilisateurs</h3>
                    {meta.total && <span className="text-[12px] text-slate-400">{meta.total} au total</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Utilisateur</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Sociétés</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Inscrit le</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Droits</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {items.length === 0 && (
                                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400 italic">Aucun utilisateur</td></tr>
                            )}
                            {items.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                                {(u.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{u.name}</p>
                                                <p className="text-[11px] text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {(u.collaborateurs || []).slice(0, 3).map(c => (
                                                <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    {c.societe?.nom || '—'}
                                                </span>
                                            ))}
                                            {(u.collaborateurs?.length || 0) > 3 && (
                                                <span className="text-[10px] text-slate-400">+{u.collaborateurs.length - 3}</span>
                                            )}
                                            {(u.collaborateurs?.length || 0) === 0 && <span className="text-[11px] text-slate-400 italic">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-[12px] text-slate-400 hidden lg:table-cell">
                                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {u.is_superadmin ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                <Shield className="h-3 w-3" /> Super-Admin
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-slate-400">Standard</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={route('superadmin.utilisateurs.show', u.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors" title="Voir">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Link>
                                            {u.is_superadmin ? (
                                                <button onClick={() => handleRevoquer(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors" title="Révoquer">
                                                    <ShieldOff className="h-3.5 w-3.5" />
                                                </button>
                                            ) : (
                                                <button onClick={() => handlePromouvoir(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors" title="Promouvoir">
                                                    <Shield className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[12px] text-slate-400">{meta.from}–{meta.to} sur {meta.total}</p>
                        <div className="flex items-center gap-1">
                            {(utilisateurs.links || []).map((link, i) => {
                                if (link.label === '&laquo; Previous') return (
                                    <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                                );
                                if (link.label === 'Next &raquo;') return (
                                    <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
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
