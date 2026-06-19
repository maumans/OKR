import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { Button } from '@/Components/ui/Button';
import { NumberInput } from '@/Components/ui/NumberInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { BarChart3, Plus, Pencil, Trash2, Save, Table2, List } from 'lucide-react';

// ─── Formulaire indicateur ─────────────────────────────────────────────────

function IndicateurForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState({
        nom:         initial?.nom         || '',
        categorie:   initial?.categorie   || '',
        unite:       initial?.unite       || '',
        frequence:   initial?.frequence   || 'mensuel',
        description: initial?.description || '',
    });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const inputCls = "mt-0.5 w-full px-3 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30";
    const selectCls = `${inputCls} cursor-pointer`;

    return (
        <div className="space-y-2 p-3 bg-gray-50/50 dark:bg-dark-800/30 rounded-lg border border-gray-100 dark:border-dark-700">
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nom *</label>
                <input value={form.nom} onChange={e => set('nom', e.target.value)} className={inputCls} placeholder="Ex: Taux de renouvellement, CA mensuel…" />
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Catégorie</label>
                    <input value={form.categorie} onChange={e => set('categorie', e.target.value)} className={inputCls} placeholder="Finance, RH…" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Unité</label>
                    <input value={form.unite} onChange={e => set('unite', e.target.value)} className={inputCls} placeholder="K GNF, %, nb…" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Fréquence</label>
                    <select value={form.frequence} onChange={e => set('frequence', e.target.value)} className={selectCls}>
                        <option value="mensuel">Mensuel</option>
                        <option value="trimestriel">Trimestriel</option>
                        <option value="annuel">Annuel</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                    className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => form.nom.trim() && onSave(form)}>
                    {initial ? 'Enregistrer' : 'Créer'}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Annuler</Button>
            </div>
        </div>
    );
}

// ─── Cellule de saisie ─────────────────────────────────────────────────────

function CelluleSaisie({ saisie, indicateur, collaborateurId, periode, onSave }) {
    const [editing, setEditing] = useState(false);
    const [valeur, setValeur] = useState(saisie?.valeur ?? '');
    const [commentaire, setCommentaire] = useState(saisie?.commentaire ?? '');

    const save = () => {
        if (valeur === '' && !saisie) { setEditing(false); return; }
        onSave({ ops_indicateur_id: indicateur.id, collaborateur_id: collaborateurId, periode, valeur: parseFloat(valeur) || 0, commentaire });
        setEditing(false);
    };

    if (!editing) {
        return (
            <button onClick={() => setEditing(true)}
                className="w-full text-right text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-w-[80px] px-1"
                title={saisie?.commentaire || 'Cliquer pour saisir'}>
                {saisie?.valeur != null
                    ? `${parseFloat(saisie.valeur).toLocaleString('fr-FR')}${indicateur.unite ? ' ' + indicateur.unite : ''}`
                    : <span className="text-gray-300 dark:text-dark-600 text-xs">—</span>}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1 min-w-[120px]">
            <div className="w-20">
                <NumberInput value={valeur} onChange={v => setValeur(v)} autoFocus
                    decimals={2}
                    onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                    className="h-7 px-2 text-sm text-right border-emerald-300 hover:border-emerald-400 focus:ring-emerald-500/30 focus:border-emerald-400" />
            </div>
            <button onClick={save} className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white">
                <Save className="h-3 w-3" />
            </button>
        </div>
    );
}

// ─── Vue tableau croisé (indicateurs × collaborateurs) ────────────────────

function VueTableau({ indicateurs, saisies, collaborateurs, periode, onSave, onDeleteSaisie }) {
    const getSaisie = (indId, collabId) =>
        saisies.find(s => s.ops_indicateur_id === indId && s.collaborateur_id === (collabId || null));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-700">
                        <th className="text-left px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-48">Indicateur</th>
                        <th className="text-left px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-24">Catégorie</th>
                        {collaborateurs.map(c => (
                            <th key={c.id} className="text-center px-3 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-400 min-w-[100px]">
                                <div>{c.prenom}</div>
                                <div className="font-normal text-gray-400">{c.nom}</div>
                            </th>
                        ))}
                        <th className="text-center px-3 py-2 text-[10px] font-bold text-gray-400 uppercase w-24">Global</th>
                    </tr>
                </thead>
                <tbody>
                    {indicateurs.map((ind, i) => (
                        <tr key={ind.id} className={`border-b border-gray-100 dark:border-dark-800 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-dark-900/30'}`}>
                            <td className="px-3 py-2">
                                <p className="font-medium text-gray-800 dark:text-gray-200 text-[12px]">{ind.nom}</p>
                                {ind.unite && <p className="text-[10px] text-gray-400">{ind.unite}</p>}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-gray-400">{ind.categorie || '—'}</td>
                            {collaborateurs.map(c => (
                                <td key={c.id} className="px-2 py-1.5 text-center">
                                    <CelluleSaisie
                                        saisie={getSaisie(ind.id, c.id)}
                                        indicateur={ind}
                                        collaborateurId={c.id}
                                        periode={periode}
                                        onSave={onSave}
                                    />
                                </td>
                            ))}
                            <td className="px-3 py-1.5 text-center">
                                <CelluleSaisie
                                    saisie={getSaisie(ind.id, null)}
                                    indicateur={ind}
                                    collaborateurId={null}
                                    periode={periode}
                                    onSave={onSave}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {indicateurs.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-400">
                    Aucun indicateur actif — créez-en un dans le référentiel.
                </div>
            )}
        </div>
    );
}

// ─── Vue liste indicateurs (référentiel) ───────────────────────────────────

function VueReferentiel({ indicateurs }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const categories = [...new Set(indicateurs.map(i => i.categorie || 'Sans catégorie'))].sort();

    const create = (form) => {
        router.post(route('operations.indicateurs.store'), form, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Indicateur créé'); setAddOpen(false); },
        });
    };

    const update = (id, form) => {
        router.put(route('operations.indicateurs.update', id), form, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Indicateur mis à jour'); setEditingId(null); },
        });
    };

    const destroy = (id) => {
        if (!confirm('Supprimer cet indicateur et toutes ses saisies ?')) return;
        router.delete(route('operations.indicateurs.destroy', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Indicateur supprimé'),
        });
    };

    const FREQ_LABEL = { mensuel: 'Mensuel', trimestriel: 'Trimestriel', annuel: 'Annuel' };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{indicateurs.length} indicateur{indicateurs.length > 1 ? 's' : ''}</p>
                <Button size="sm" className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddOpen(true)}>
                    <Plus className="h-3 w-3" /> Nouvel indicateur
                </Button>
            </div>

            {addOpen && <IndicateurForm onSave={create} onCancel={() => setAddOpen(false)} />}

            {categories.map(cat => (
                <div key={cat}>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</h3>
                    <div className="space-y-1">
                        {indicateurs.filter(i => (i.categorie || 'Sans catégorie') === cat).map(ind => (
                            <div key={ind.id}>
                                {editingId === ind.id ? (
                                    <IndicateurForm initial={ind} onSave={form => update(ind.id, form)} onCancel={() => setEditingId(null)} />
                                ) : (
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900 group hover:border-emerald-200 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{ind.nom}</span>
                                            {ind.unite && <span className="ml-2 text-[10px] text-gray-400">{ind.unite}</span>}
                                        </div>
                                        <span className="text-[10px] text-gray-400 shrink-0">{FREQ_LABEL[ind.frequence] || ind.frequence}</span>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                            <button onClick={() => setEditingId(ind.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700">
                                                <Pencil className="h-3 w-3 text-gray-400" />
                                            </button>
                                            <button onClick={() => destroy(ind.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <Trash2 className="h-3 w-3 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {indicateurs.length === 0 && !addOpen && (
                <div className="text-center py-12">
                    <BarChart3 className="h-10 w-10 text-gray-200 dark:text-dark-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucun indicateur opérationnel</p>
                    <Button size="sm" className="mt-3 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddOpen(true)}>
                        Créer le premier
                    </Button>
                </div>
            )}
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────

const VUES = [
    { key: 'tableau',     label: 'Tableau de saisie', icon: Table2 },
    { key: 'referentiel', label: 'Référentiel',        icon: List },
];

export default function OperationsIndex({ indicateurs = [], saisies = [], collaborateurs = [], periode, periodes = [] }) {
    const [vue, setVue] = useState('tableau');
    const [periodeCourante, setPeriodeCourante] = useState(periode);

    const changePeriode = (p) => {
        setPeriodeCourante(p);
        router.get(route('operations.index'), { periode: p }, { preserveState: true, preserveScroll: true });
    };

    const saisir = (data) => {
        router.post(route('operations.saisies.store'), { ...data, periode: periodeCourante }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Valeur enregistrée'),
        });
    };

    const supprimerSaisie = (id) => {
        router.delete(route('operations.saisies.destroy', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Saisie supprimée'),
        });
    };

    const periodeOptions = periodes.map(p => ({ value: p.value, label: p.label }));

    return (
        <AppLayout title="Opérations">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
                {/* ── En-tête ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Opérations</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Indicateurs opérationnels · {indicateurs.length} indicateur{indicateurs.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    {vue === 'tableau' && (
                        <div className="w-48">
                            <SearchableSelect
                                value={periodeCourante}
                                onChange={changePeriode}
                                options={periodeOptions}
                                placeholder="Période…"
                            />
                        </div>
                    )}
                </div>

                {/* ── Navigation vues ── */}
                <div className="flex gap-1 border-b border-gray-100 dark:border-dark-700">
                    {VUES.map(v => (
                        <button key={v.key} onClick={() => setVue(v.key)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${vue === v.key
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                            <v.icon className="h-4 w-4" />
                            {v.label}
                        </button>
                    ))}
                </div>

                {/* ── Contenu ── */}
                <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-5">
                    {vue === 'tableau' && (
                        <VueTableau
                            indicateurs={indicateurs}
                            saisies={saisies}
                            collaborateurs={collaborateurs}
                            periode={periodeCourante}
                            onSave={saisir}
                            onDeleteSaisie={supprimerSaisie}
                        />
                    )}
                    {vue === 'referentiel' && (
                        <VueReferentiel indicateurs={indicateurs} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
