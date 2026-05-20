import { useState } from 'react';
import { router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import {
    Package, Plus, Pencil, Check, X,
    LayoutDashboard, Target, User, ListChecks, CalendarCheck, Grid3x3,
    TrendingUp, Briefcase, Gift, GraduationCap, BarChart3, Users, Settings, Upload,
} from 'lucide-react';

const LUCIDE_ICONS = {
    LayoutDashboard, Target, User, ListChecks, CalendarCheck,
    Grid3x3, TrendingUp, Briefcase, Gift, GraduationCap,
    BarChart3, Users, Settings, Upload, Package,
};

const CATEGORIE_OPTIONS = ['Core', 'Performance', 'Terrain', 'Rémunération', 'Formation', 'Analytique'];

function ModuleRow({ module, onEdit }) {
    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (module.couleur || '#6366f1') + '20', color: module.couleur || '#6366f1' }}>
                        {(() => { const Icon = LUCIDE_ICONS[module.icone] || Package; return <Icon className="h-4 w-4" />; })()}
                    </div>
                    <div>
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{module.nom}</p>
                        <code className="text-[10px] text-slate-400">{module.code}</code>
                    </div>
                </div>
            </td>
            <td className="px-5 py-3.5 hidden md:table-cell">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {module.categorie}
                </span>
            </td>
            <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{module.societes_count}</span>
                <span className="text-[11px] text-slate-400 ml-1">soc.</span>
            </td>
            <td className="px-5 py-3.5 hidden md:table-cell">
                <div className="flex items-center gap-2">
                    {module.est_core && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">CORE</span>}
                    {module.est_premium && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">PREMIUM</span>}
                </div>
            </td>
            <td className="px-5 py-3.5">
                {module.actif ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" /> Actif
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <X className="h-3 w-3" /> Inactif
                    </span>
                )}
            </td>
            <td className="px-5 py-3.5">
                <button
                    onClick={() => onEdit(module)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    );
}

function ModuleModal({ module, onClose }) {
    const isEdit = !!module?.id;
    const [form, setForm] = useState({
        code: module?.code || '',
        nom: module?.nom || '',
        description: module?.description || '',
        icone: module?.icone || '',
        couleur: module?.couleur || '#6366f1',
        categorie: module?.categorie || 'Performance',
        est_premium: module?.est_premium ?? false,
        ordre: module?.ordre ?? 10,
        actif: module?.actif ?? true,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        const url = isEdit ? route('superadmin.modules.update', module.code) : route('superadmin.modules.store');
        const method = isEdit ? router.put : router.post;
        method(url, form, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                        {isEdit ? `Modifier « ${module.nom} »` : 'Nouveau module'}
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        {!isEdit && (
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 uppercase">Code *</label>
                                <input value={form.code} onChange={e => set('code', e.target.value)} placeholder="ex: okr" required
                                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                                {errors.code && <p className="text-[11px] text-rose-500 mt-0.5">{errors.code}</p>}
                            </div>
                        )}
                        <div className={isEdit ? 'col-span-2' : ''}>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Nom *</label>
                            <input value={form.nom} onChange={e => set('nom', e.target.value)} required
                                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Catégorie *</label>
                            <select value={form.categorie} onChange={e => set('categorie', e.target.value)}
                                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                {CATEGORIE_OPTIONS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Icône (emoji)</label>
                            <input value={form.icone} onChange={e => set('icone', e.target.value)} placeholder="🎯"
                                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Couleur</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="color" value={form.couleur} onChange={e => set('couleur', e.target.value)} className="h-9 w-12 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" />
                                <span className="text-[12px] font-mono text-slate-500">{form.couleur}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Ordre</label>
                            <input type="number" value={form.ordre} onChange={e => set('ordre', Number(e.target.value))}
                                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.est_premium} onChange={e => set('est_premium', e.target.checked)} className="rounded" />
                            <span className="text-[12px] text-slate-600 dark:text-slate-400">Premium</span>
                        </label>
                        {isEdit && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)} className="rounded" />
                                <span className="text-[12px] text-slate-600 dark:text-slate-400">Actif dans le catalogue</span>
                            </label>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800">Annuler</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                            {submitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ModulesIndex({ modules }) {
    const [editModule, setEditModule] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    return (
        <SuperAdminLayout title="Modules" breadcrumb={[{ label: 'Modules' }]}>
            <div className="flex items-center justify-between mb-5">
                <p className="text-[13px] text-slate-400">{modules.length} modules dans le catalogue</p>
                <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    <Plus className="h-4 w-4" /> Nouveau module
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Module</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Catégorie</th>
                                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Adoption</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Tags</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Statut</th>
                                <th className="px-5 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {modules.map(m => (
                                <ModuleRow key={m.id} module={m} onEdit={setEditModule} />
                            ))}
                            {modules.length === 0 && (
                                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400 italic">Aucun module</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {(editModule || showCreate) && (
                <ModuleModal
                    module={editModule}
                    onClose={() => { setEditModule(null); setShowCreate(false); }}
                />
            )}
        </SuperAdminLayout>
    );
}
