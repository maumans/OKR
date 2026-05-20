import { useState } from 'react';
import { router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import { CreditCard, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react';

const PLAN_STYLES = {
    starter:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    pro:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    enterprise: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};
const STATUT_STYLES = {
    actif:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    suspendu:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    annule:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

function EditModal({ abonnement, onClose }) {
    const [form, setForm] = useState({
        plan: abonnement.plan,
        prix_mensuel: abonnement.prix_mensuel,
        devise_id: abonnement.devise_id || '',
        date_debut: abonnement.date_debut?.split('T')[0] || '',
        date_fin: abonnement.date_fin?.split('T')[0] || '',
        statut: abonnement.statut,
        limite_utilisateurs: abonnement.limite_utilisateurs,
        limite_okr: abonnement.limite_okr || '',
        notes: abonnement.notes || '',
    });
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.put(route('superadmin.abonnements.update', abonnement.id), form, {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Modifier l'abonnement</h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Plan</label>
                            <select value={form.plan} onChange={e => set('plan', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="starter">Starter</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Statut</label>
                            <select value={form.statut} onChange={e => set('statut', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="actif">Actif</option>
                                <option value="suspendu">Suspendu</option>
                                <option value="annule">Annulé</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Prix mensuel</label>
                            <input type="number" min="0" value={form.prix_mensuel} onChange={e => set('prix_mensuel', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Limite utilisateurs</label>
                            <input type="number" min="1" value={form.limite_utilisateurs} onChange={e => set('limite_utilisateurs', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Date début</label>
                            <input type="date" value={form.date_debut} onChange={e => set('date_debut', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase">Date fin</label>
                            <input type="date" value={form.date_fin} onChange={e => set('date_fin', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase">Notes</label>
                        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Annuler</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                            {submitting ? 'Mise à jour...' : 'Mettre à jour'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AbonnementsIndex({ abonnements }) {
    const [editAbonnement, setEditAbonnement] = useState(null);
    const items = abonnements.data || [];
    const meta = abonnements.meta || {};

    return (
        <SuperAdminLayout title="Abonnements" breadcrumb={[{ label: 'Abonnements' }]}>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tous les abonnements</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Société</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Plan</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Prix</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Période</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Statut</th>
                                <th className="px-5 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {items.length === 0 && (
                                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400 italic">Aucun abonnement</td></tr>
                            )}
                            {items.map(a => (
                                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-5 py-3.5">
                                        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{a.societe?.nom || '—'}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${PLAN_STYLES[a.plan] || PLAN_STYLES.starter}`}>
                                            {a.plan}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-[13px] text-slate-600 dark:text-slate-400 hidden md:table-cell">
                                        {a.prix_mensuel} {a.devise?.symbole || '€'} / mois
                                    </td>
                                    <td className="px-5 py-3.5 text-[12px] text-slate-400 hidden lg:table-cell">
                                        {a.date_debut ? new Date(a.date_debut).toLocaleDateString('fr-FR') : '—'}
                                        {a.date_fin && <> → {new Date(a.date_fin).toLocaleDateString('fr-FR')}</>}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUT_STYLES[a.statut] || STATUT_STYLES.actif}`}>
                                            {a.statut}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <button onClick={() => setEditAbonnement(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors opacity-0 group-hover:opacity-100">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
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
                            {(abonnements.links || []).map((link, i) => {
                                if (link.label === '&laquo; Previous') return <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>;
                                if (link.label === 'Next &raquo;') return <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>;
                                return <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url || link.active} className={`min-w-[28px] h-7 px-1.5 rounded text-[12px] font-medium transition-colors ${link.active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} />;
                            })}
                        </div>
                    </div>
                )}
            </div>

            {editAbonnement && <EditModal abonnement={editAbonnement} onClose={() => setEditAbonnement(null)} />}
        </SuperAdminLayout>
    );
}
