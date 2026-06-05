import { useMemo } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { NumberInput } from '@/Components/ui/NumberInput';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Plus, CheckCircle2, CalendarDays, X } from 'lucide-react';

export default function OKRCreate({ collaborateurs, axes = [], periodes = [], typesObjectifs = [], typesResultatsCles = [], configuration, missions = [] }) {
    const { auth } = usePage().props;
    const devise = auth?.societe?.devise;
    const isPondere = configuration?.mode_calcul === 'pondere';

    const makeKr = () => ({
        description: '', description_detaillee: '', type_resultat_cle_id: '',
        valeur_cible: 100, poids: 1, unite: '',
        mode_calcul: 'pourcentage', milestones: [],
    });

    const { data, setData, post, processing, errors } = useForm({
        titre: '',
        axe: '',
        axe_objectif_id: '',
        periode: '',
        periode_ids: [],
        type_objectif_id: '',
        visibilite: configuration?.visibilite_defaut || 'equipe',
        prime: '',
        collaborateur_id: '',
        mission_id: '',
        resultats_cles: [makeKr()],
    });

    const moisPeriode = useMemo(() => {
        const selected = periodes.filter(p => data.periode_ids.includes(p.id));
        const mois = [];
        for (const p of selected) {
            if (!p.date_debut || !p.date_fin) continue;
            let cur = new Date(p.date_debut + 'T00:00:00');
            const end = new Date(p.date_fin + 'T00:00:00');
            while (cur <= end) {
                const key = cur.toISOString().slice(0, 7);
                const lab = cur.toLocaleDateString('fr-FR', { month: 'short' });
                if (!mois.find(m => m.mois === key)) {
                    mois.push({ mois: key, label: lab.charAt(0).toUpperCase() + lab.slice(1, 4) + '.', cible: 0, valeur_actuelle: 0 });
                }
                cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            }
        }
        return mois;
    }, [data.periode_ids, periodes]);

    const addKr = () => setData('resultats_cles', [...data.resultats_cles, makeKr()]);
    const removeKr = (i) => {
        const n = [...data.resultats_cles]; n.splice(i, 1); setData('resultats_cles', n);
    };
    const updateKr = (i, field, value) => {
        const n = [...data.resultats_cles];
        n[i] = { ...n[i], [field]: value };
        if (field === 'type_resultat_cle_id' && value) {
            const type = typesResultatsCles.find(t => t.id === Number(value));
            if (type) {
                if (type.unite) n[i].unite = type.unite;
                if (type.type_valeur === 'percent') n[i].valeur_cible = 100;
                else if (type.type_valeur === 'boolean') n[i].valeur_cible = 1;
            }
        }
        setData('resultats_cles', n);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('objectifs.store'));
    };

    const inputCls = 'w-full mt-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all';
    const selectCls = 'w-full mt-1 px-2.5 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30';
    const labelCls = 'text-[10px] font-bold text-gray-400 uppercase tracking-wider';

    return (
        <AppLayout title="Nouvel Objectif">
            <div className="mb-6">
                <Link href={route('objectifs.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Retour aux OKR
                </Link>
                <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-xl font-bold text-gray-900 dark:text-white">
                    Créer un Objectif
                </motion.h1>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-3xl">
                {Object.keys(errors).length > 0 && (
                    <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                        <p className="text-xs text-red-600 dark:text-red-400">{Object.values(errors)[0]}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ── Section : Informations ── */}
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 space-y-4">
                        <div>
                            <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 mb-2" />
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Target className="h-3.5 w-3.5" /> Informations de l'objectif
                            </p>
                        </div>

                        {/* Titre */}
                        <div>
                            <label className={labelCls}>Titre *</label>
                            <input
                                type="text"
                                value={data.titre}
                                onChange={e => setData('titre', e.target.value)}
                                placeholder="Ex: Augmenter le chiffre d'affaires de 20%..."
                                className={inputCls.replace('focus:ring-primary-500/30 focus:border-primary-500', 'focus:ring-orange-500/30 focus:border-orange-500')}
                                autoFocus
                            />
                            {errors.titre && <p className="text-[10px] text-red-500 mt-1">{errors.titre}</p>}
                        </div>

                        {/* Responsable + Périodes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Responsable *</label>
                                <SearchableSelect
                                    value={data.collaborateur_id}
                                    onChange={v => setData('collaborateur_id', v)}
                                    options={collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }))}
                                    className="mt-1"
                                />
                                {errors.collaborateur_id && <p className="text-[10px] text-red-500 mt-1">{errors.collaborateur_id}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>
                                    Périodes *
                                    {data.periode_ids.length > 1 && (
                                        <span className="ml-1 text-[9px] font-normal text-emerald-400">({data.periode_ids.length} — multi-trimestre)</span>
                                    )}
                                </label>
                                {periodes.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {periodes.map(p => {
                                            const isSelected = data.periode_ids.includes(p.id);
                                            return (
                                                <label key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer border transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold'
                                                        : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-dark-600'
                                                }`}>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded text-emerald-500 w-3 h-3 focus:ring-emerald-500/30"
                                                        checked={isSelected}
                                                        onChange={e => {
                                                            const newIds = e.target.checked
                                                                ? [...data.periode_ids, p.id]
                                                                : data.periode_ids.filter(id => id !== p.id);
                                                            setData('periode_ids', newIds);
                                                        }}
                                                    />
                                                    {p.nom}
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <input type="text" value={data.periode} onChange={e => setData('periode', e.target.value)}
                                        placeholder="Ex: Q2-2026" className={inputCls} />
                                )}
                                {errors.periode_ids && <p className="text-[10px] text-red-500 mt-1">{errors.periode_ids}</p>}
                            </div>
                        </div>

                        {/* Axe + Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Axe stratégique</label>
                                <SearchableSelect
                                    value={data.axe_objectif_id}
                                    onChange={v => setData('axe_objectif_id', v)}
                                    options={axes.map(a => ({ value: String(a.id), label: a.nom }))}
                                    nullable nullLabel="— Aucun axe —"
                                    placeholder="Rechercher un axe..."
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Type d'objectif</label>
                                <SearchableSelect
                                    value={data.type_objectif_id}
                                    onChange={v => setData('type_objectif_id', v)}
                                    options={typesObjectifs.map(t => ({ value: String(t.id), label: `${t.nom} (${t.niveau})` }))}
                                    nullable nullLabel="— Aucun type —"
                                    placeholder="Rechercher un type..."
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Visibilité + Prime */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Visibilité</label>
                                <SearchableSelect value={data.visibilite} onChange={v => setData("visibilite", v)} options={[{value:"tous",label:"Tous"},{value:"equipe",label:"Équipe"},{value:"prive",label:"Privé"}]} className="mt-1" />
                            </div>
                            <div>
                                <label className={labelCls}>Prime ({devise?.code || 'GNF'})</label>
                                <NumberInput value={data.prime} onChange={v => setData('prime', v)} placeholder="0" className="mt-1" suffix={devise?.code || 'GNF'} />
                            </div>
                        </div>

                        {/* Mission */}
                        {missions.length > 0 && (
                            <div>
                                <label className={labelCls}>Mission / Projet</label>
                                <SearchableSelect
                                    value={data.mission_id}
                                    onChange={v => setData('mission_id', v)}
                                    options={missions.map(m => ({ value: String(m.id), label: m.titre + (m.client ? ` — ${m.client}` : '') }))}
                                    nullable nullLabel="— Aucune mission —"
                                    className="mt-1"
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Section : Résultats Clés ── */}
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm p-5">
                        <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-primary-400 to-primary-500 mb-2" />
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Résultats Clés
                            </p>
                            <button type="button" onClick={addKr} className="text-[11px] text-primary-500 hover:text-primary-700 font-medium flex items-center gap-1">
                                <Plus className="h-3.5 w-3.5" /> Ajouter un KR
                            </button>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                                {data.resultats_cles.map((kr, i) => {
                                    const selectedType = typesResultatsCles.find(t => t.id === Number(kr.type_resultat_cle_id));
                                    const isBoolean = selectedType?.type_valeur === 'boolean';

                                    return (
                                        <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="p-3 rounded-lg border border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 space-y-2">
                                            {/* Titre KR + Type + Supprimer */}
                                            <div className="flex items-start gap-2">
                                                <span className="text-[10px] font-bold text-gray-400 mt-2 w-5 shrink-0">#{i + 1}</span>
                                                <div className="flex-1 space-y-1.5">
                                                    <input
                                                        type="text"
                                                        value={kr.description}
                                                        onChange={e => updateKr(i, 'description', e.target.value)}
                                                        placeholder="Titre du KR..."
                                                        className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                                                    />
                                                    {errors[`resultats_cles.${i}.description`] && (
                                                        <p className="text-[10px] text-red-500">{errors[`resultats_cles.${i}.description`]}</p>
                                                    )}
                                                    <textarea
                                                        value={kr.description_detaillee || ''}
                                                        onChange={e => updateKr(i, 'description_detaillee', e.target.value)}
                                                        placeholder="Description détaillée, contexte ou notes..."
                                                        className="w-full rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-2.5 py-1.5 text-xs placeholder:text-gray-400 hover:border-gray-300 dark:hover:border-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 resize-none min-h-[40px]"
                                                    />
                                                </div>
                                                {typesResultatsCles.length > 0 && (
                                                    <SearchableSelect value={kr.type_resultat_cle_id} onChange={v => updateKr(i, "type_resultat_cle_id", v)} size="sm" className="w-28 shrink-0" nullable nullLabel="Type…" options={typesResultatsCles.map(t=>({value:String(t.id),label:t.nom}))} />
                                                )}
                                                {data.resultats_cles.length > 1 && (
                                                    <button type="button" onClick={() => removeKr(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Cible / Unité / Poids (mode standard) */}
                                            {!isBoolean && kr.mode_calcul !== 'mensuel' && (
                                                <div className="flex items-center gap-3 ml-7 flex-wrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-gray-400">Cible</span>
                                                        <input type="number" value={kr.valeur_cible} onChange={e => updateKr(i, 'valeur_cible', Number(e.target.value))}
                                                            className="w-20 px-2 py-1 text-xs bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-right" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-gray-400">Unité</span>
                                                        <SearchableSelect value={kr.unite} onChange={v => updateKr(i, "unite", v)} size="sm" className="w-28" nullable nullLabel="—" options={[...new Set(typesResultatsCles.filter(t => t.unite).map(t => t.unite))].map(u => ({ value: u, label: u }))} />
                                                    </div>
                                                    {isPondere && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-gray-400">Poids</span>
                                                            <input type="number" step="0.1" value={kr.poids} onChange={e => updateKr(i, 'poids', Number(e.target.value))}
                                                                className="w-16 px-2 py-1 text-xs bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-right" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Toggle ventilation mensuelle */}
                                            {!isBoolean && moisPeriode.length >= 2 && (
                                                <label className="flex items-center gap-1.5 ml-7 text-[11px] text-gray-500 cursor-pointer select-none w-fit">
                                                    <input type="checkbox" checked={kr.mode_calcul === 'mensuel'}
                                                        onChange={e => {
                                                            const on = e.target.checked;
                                                            updateKr(i, 'mode_calcul', on ? 'mensuel' : 'pourcentage');
                                                            updateKr(i, 'milestones', on ? moisPeriode.map(m => ({ ...m, cible: 0 })) : []);
                                                        }}
                                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    Ventilation mensuelle
                                                </label>
                                            )}

                                            {/* Cibles par mois */}
                                            {!isBoolean && kr.mode_calcul === 'mensuel' && (
                                                <div className="ml-7 flex items-center gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] text-gray-400">Unité</span>
                                                        <SearchableSelect value={kr.unite} onChange={v => updateKr(i, "unite", v)} size="sm" className="w-28" nullable nullLabel="—" options={[...new Set(typesResultatsCles.filter(t => t.unite).map(t => t.unite))].map(u => ({ value: u, label: u }))} />
                                                    </div>
                                                    {(kr.milestones || []).map((m, mi) => (
                                                        <div key={m.mois} className="flex items-center gap-1 bg-white dark:bg-dark-800 rounded px-2 py-1 border border-gray-200 dark:border-dark-700">
                                                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">{m.label}</span>
                                                            <input type="number" value={m.cible} onChange={e => {
                                                                const ms = [...(kr.milestones || [])];
                                                                ms[mi] = { ...ms[mi], cible: Number(e.target.value) || 0 };
                                                                updateKr(i, 'milestones', ms);
                                                            }} className="w-16 text-xs text-right bg-transparent border-none outline-none" />
                                                        </div>
                                                    ))}
                                                    <span className="text-[10px] text-gray-400">
                                                        = {(kr.milestones || []).reduce((s, m) => s + (Number(m.cible) || 0), 0).toLocaleString('fr-FR')} {kr.unite}
                                                    </span>
                                                    {isPondere && (
                                                        <div className="flex items-center gap-1.5 ml-1">
                                                            <span className="text-[10px] text-gray-400">Poids</span>
                                                            <input type="number" step="0.1" value={kr.poids} onChange={e => updateKr(i, 'poids', Number(e.target.value))}
                                                                className="w-16 px-2 py-1 text-xs bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-right" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {isBoolean && (
                                                <p className="ml-7 text-[10px] text-gray-400 italic">Fait / Non fait — pas de valeur cible nécessaire</p>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        {errors.resultats_cles && <p className="text-xs text-red-500 mt-2">{errors.resultats_cles}</p>}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between pb-8">
                        <Link href={route('objectifs.index')}>
                            <button type="button" className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-all">
                                Annuler
                            </button>
                        </Link>
                        <button type="submit" disabled={processing}
                            className="px-6 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-all disabled:opacity-50">
                            {processing ? 'Enregistrement...' : 'Enregistrer l\'objectif'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </AppLayout>
    );
}
