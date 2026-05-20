import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import {
    Building2, Search, Plus, Eye, Pencil, MoreHorizontal,
    PauseCircle, PlayCircle, Trash2, ChevronLeft, ChevronRight,
    Users, Package,
} from 'lucide-react';

const PLAN_STYLES = {
    starter:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    pro:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    enterprise: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};
const STATUS_STYLES = {
    actif:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    suspendu:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    annule:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};
const STATUS_LABELS = { actif: 'Actif', suspendu: 'Suspendu', annule: 'Annulé' };

function ModuleChips({ modules }) {
    const visible = modules.slice(0, 4);
    const hidden = modules.length - 4;
    return (
        <div className="flex flex-wrap gap-1">
            {visible.map(m => (
                <span
                    key={m.code}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                    style={{ backgroundColor: m.couleur || '#6366f1' }}
                    title={m.nom}
                >
                    {m.code}
                </span>
            ))}
            {hidden > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    +{hidden}
                </span>
            )}
            {modules.length === 0 && <span className="text-[11px] text-slate-400 italic">Aucun</span>}
        </div>
    );
}

function ActionsDropdown({ societe }) {
    const [open, setOpen] = useState(false);

    const handleSuspendre = () => {
        if (!confirm(`Suspendre « ${societe.nom} » ?`)) return;
        router.post(route('superadmin.societes.suspendre', societe.id), {}, { preserveScroll: true });
        setOpen(false);
    };
    const handleReactiver = () => {
        router.post(route('superadmin.societes.reactiver', societe.id), {}, { preserveScroll: true });
        setOpen(false);
    };
    const handleSupprimer = () => {
        if (!confirm(`Supprimer définitivement « ${societe.nom} » ? Cette action est irréversible.`)) return;
        router.delete(route('superadmin.societes.destroy', societe.id));
        setOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg py-1">
                        <Link
                            href={route('superadmin.societes.edit', societe.id)}
                            className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <Pencil className="h-3.5 w-3.5 text-slate-400" /> Modifier
                        </Link>
                        {societe.statut === 'actif' ? (
                            <button onClick={handleSuspendre} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                <PauseCircle className="h-3.5 w-3.5" /> Suspendre
                            </button>
                        ) : (
                            <button onClick={handleReactiver} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                <PlayCircle className="h-3.5 w-3.5" /> Réactiver
                            </button>
                        )}
                        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                        <button onClick={handleSupprimer} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function SocietesIndex({ societes, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [statut, setStatut] = useState(filters?.statut || '');

    const applyFilters = (newFilters) => {
        router.get(route('superadmin.societes.index'), { ...filters, ...newFilters }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearch(val);
        clearTimeout(window._searchTimer);
        window._searchTimer = setTimeout(() => applyFilters({ search: val, statut }), 400);
    };

    const handleStatut = (val) => {
        setStatut(val);
        applyFilters({ search, statut: val });
    };

    const items = societes.data || [];
    const meta = societes.meta || {};

    return (
        <SuperAdminLayout
            title="Sociétés"
            breadcrumb={[{ label: 'Sociétés' }]}
        >
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={handleSearch}
                            placeholder="Rechercher une société..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                        />
                    </div>
                    <select
                        value={statut}
                        onChange={e => handleStatut(e.target.value)}
                        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="actif">Actif</option>
                        <option value="suspendu">Suspendu</option>
                        <option value="annule">Annulé</option>
                    </select>
                </div>
                <Link
                    href={route('superadmin.societes.create')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
                >
                    <Plus className="h-4 w-4" /> Nouvelle société
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Société</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Modules</th>
                                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Utilisateurs</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Statut</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Inscription</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm text-slate-400">Aucune société trouvée</p>
                                        <Link href={route('superadmin.societes.create')} className="text-indigo-500 text-sm hover:underline mt-1 inline-block">
                                            Créer la première société
                                        </Link>
                                    </td>
                                </tr>
                            ) : items.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                                                style={{ backgroundColor: s.couleur_primaire || '#6366f1' }}
                                            >
                                                {s.nom.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{s.nom}</p>
                                                <p className="text-[11px] text-slate-400">{s.email || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 hidden lg:table-cell">
                                        <ModuleChips modules={s.modulesActifs || []} />
                                    </td>
                                    <td className="px-5 py-3.5 hidden md:table-cell text-center">
                                        <div className="inline-flex items-center gap-1 text-[12px] text-slate-600 dark:text-slate-400">
                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                            {s.collaborateurs_count}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[s.statut] || STATUS_STYLES.actif}`}>
                                            {STATUS_LABELS[s.statut] || s.statut}
                                        </span>
                                        {s.abonnementActif && (
                                            <span className={`ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${PLAN_STYLES[s.abonnementActif.plan] || PLAN_STYLES.starter}`}>
                                                {s.abonnementActif.plan}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 hidden lg:table-cell text-[12px] text-slate-400">
                                        {new Date(s.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Link
                                                href={route('superadmin.societes.show', s.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                                                title="Voir"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <ActionsDropdown societe={s} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[12px] text-slate-400">
                            {meta.from}–{meta.to} sur {meta.total} sociétés
                        </p>
                        <div className="flex items-center gap-1">
                            {(societes.links || []).map((link, i) => {
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
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url || link.active}
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
