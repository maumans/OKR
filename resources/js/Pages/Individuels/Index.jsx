import { useState, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/Badge';
import { UserAvatar } from '@/Components/ui/Avatar';
import { formatNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Pencil, Trash2, Award, ChevronDown, ChevronRight, Eye, X, MessageSquarePlus } from 'lucide-react';
import ObjectifModal from './Components/ObjectifModal';
import AddTaskModal from './Components/AddTaskModal';
import TaskDetailPanel from './Components/TaskDetailPanel';

function getSeuilColor(val, seuils) {
    if (!seuils?.length) return null;
    return seuils.find(s => val >= Number(s.seuil_min) && val <= Number(s.seuil_max))?.couleur || null;
}
const krBarColors = ['#3b82f6','#8b5cf6','#f59e0b','#10b981','#ec4899','#06b6d4','#ef4444'];
const prioriteColors = { basse:'#94a3b8', normale:'#f59e0b', haute:'#ef4444', urgente:'#dc2626' };
const tacheStatutIcons = { a_faire:'border-gray-300', en_cours:'border-primary-500 bg-primary-500/20', termine:'border-emerald-500 bg-emerald-500', bloque:'border-red-500 bg-red-500/20' };

function formatDeadline(d) {
    if (!d) return '';
    const dt = new Date(d);
    const m = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    const day = dt.getDate();
    const w = day <= 7 ? 'Sem 1' : day <= 14 ? 'Sem 2' : day <= 21 ? 'Sem 3' : 'Fin';
    return `${w} ${m[dt.getMonth()]}`;
}

// ─── KR Progress Row with slider + justifier + tasks ────────
function KrProgressRow({ kr, krIdx, seuils, objectifId, onAddTask, onViewTask }) {
    const [expanded, setExpanded] = useState(true);
    const [showJustify, setShowJustify] = useState(false);
    const [justText, setJustText] = useState(kr.justification || '');
    const [localProg, setLocalProg] = useState(kr.progression);
    const debounceRef = useRef(null);
    const krColor = getSeuilColor(kr.progression, seuils) || krBarColors[krIdx % krBarColors.length];
    const krTaches = kr.taches || [];
    const krTerminees = krTaches.filter(t => t.statut === 'termine').length;

    const saveProg = useCallback((val) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.put(route('individuels.kr.progression', kr.id), { progression: val, justification: justText }, {
                preserveScroll: true, preserveState: true,
                onSuccess: () => toast.success(`Progression ${val}%`),
            });
        }, 600);
    }, [kr.id, justText]);

    const handleSlider = (e) => { const v = Number(e.target.value); setLocalProg(v); saveProg(v); };

    const saveJustification = () => {
        router.put(route('individuels.kr.progression', kr.id), { progression: localProg, justification: justText }, {
            preserveScroll: true, preserveState: true,
            onSuccess: () => { toast.success('Justification enregistrée'); setShowJustify(false); },
        });
    };

    return (
        <div className="border-b border-gray-50 dark:border-dark-800/50 last:border-b-0">
            {/* KR slider row */}
            <div className="px-5 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setExpanded(!expanded)} className="shrink-0 transition-transform duration-200" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                    </button>
                    <span className="text-xs font-bold shrink-0 w-8 text-right" style={{ color: krColor }}>{Math.round(localProg)}%</span>
                    <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 min-w-0 truncate flex-shrink-0 max-w-[200px]">{kr.description}</span>
                    <button onClick={() => setShowJustify(!showJustify)}
                        className="shrink-0 text-[11px] font-medium text-primary-500 hover:text-primary-600 hover:underline flex items-center gap-0.5">
                        <MessageSquarePlus className="h-3 w-3" /> Justifier
                    </button>
                    <div className="flex-1 relative mx-2">
                        <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(localProg, 100)}%`, backgroundColor: krColor }} />
                        </div>
                        <input type="range" min="0" max="100" value={localProg} onChange={handleSlider}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-white shadow-md pointer-events-none transition-all duration-300"
                            style={{ left: `calc(${Math.min(localProg, 100)}% - 8px)`, backgroundColor: krColor }} />
                    </div>
                    <span className="text-xs font-bold shrink-0 w-8" style={{ color: krColor }}>{Math.round(localProg)}%</span>
                </div>

                {/* Justification inline */}
                <AnimatePresence>
                    {showJustify && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-2 ml-14 flex items-start gap-2">
                                <textarea value={justText} onChange={e => setJustText(e.target.value)} rows={2} placeholder="Justification de la progression..."
                                    className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none" />
                                <button onClick={saveJustification} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shrink-0">OK</button>
                            </div>
                            {kr.justification && !justText && <p className="mt-1 ml-14 text-[11px] text-gray-400 italic">{kr.justification}</p>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Tasks under KR */}
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        {krTaches.length > 0 && (
                            <div className="ml-14 border-l-2 border-gray-100 dark:border-dark-700">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {krTaches.map(tache => (
                                            <tr key={tache.id} className="border-t border-gray-50 dark:border-dark-800/50 hover:bg-gray-50/50 dark:hover:bg-dark-800/30 transition-colors group">
                                                <td className="pl-4 pr-2 py-2 w-8">
                                                    <button onClick={() => {
                                                        const ns = tache.statut === 'termine' ? 'a_faire' : 'termine';
                                                        router.put(route('taches.status', tache.id), { statut: ns }, { preserveScroll: true, onSuccess: () => toast.success(ns === 'termine' ? 'Terminée' : 'Réouverte') });
                                                    }} className={`h-4 w-4 rounded border-2 cursor-pointer transition-all ${tacheStatutIcons[tache.statut] || tacheStatutIcons.a_faire}`}>
                                                        {tache.statut === 'termine' && <svg className="h-full w-full text-white p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                                                    </button>
                                                </td>
                                                <td className="py-2">
                                                    <span className={`text-[12px] ${tache.statut === 'termine' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{tache.titre}</span>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 whitespace-nowrap">{tache.collaborateur}</span>
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <div className="h-2.5 w-2.5 rounded-full mx-auto" style={{ backgroundColor: prioriteColors[tache.priorite] || '#94a3b8' }} title={tache.priorite} />
                                                </td>
                                                <td className="py-2 px-2">
                                                    {tache.eisenhower && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tache.eisenhower === 'Q1' ? 'bg-red-100 text-red-700' : tache.eisenhower === 'Q2' ? 'bg-amber-100 text-amber-700' : tache.eisenhower === 'Q3' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{tache.eisenhower}</span>}
                                                </td>
                                                <td className="py-2 px-2"><span className="text-[11px] text-gray-500">{formatDeadline(tache.date)}</span></td>
                                                <td className="py-2 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => onViewTask?.(tache, kr.description)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"><Eye className="h-3.5 w-3.5 text-gray-400" /></button>
                                                        <button onClick={() => { if(confirm('Supprimer ?')) router.delete(route('taches.destroy',tache.id),{preserveScroll:true,onSuccess:()=>toast.success('Supprimée')}); }}
                                                            className="p-1 rounded hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5 text-gray-400" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="ml-14 border-l-2 border-gray-100 dark:border-dark-700 pl-4 py-1.5 pb-2">
                            <button onClick={() => onAddTask?.(objectifId, kr.id)}
                                className="text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 hover:bg-primary-50 dark:hover:bg-primary-900/10 px-2 py-1 rounded transition-colors">
                                <Plus className="h-3 w-3" /> Ajouter une tâche
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Objectif Card with expand/collapse ─────────────────────
function ObjectifCard({ obj, seuils, seuilPrime, onEdit, onDelete, onAddTask, onViewTask }) {
    const [expanded, setExpanded] = useState(true);
    const progression = obj.progression_globale || 0;
    const seuilColor = getSeuilColor(progression, seuils) || '#3b82f6';
    const tachesT = obj.taches_terminees || 0;
    const tachesC = obj.taches_count || 0;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Header */}
            <div className="px-5 py-4 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1 shrink-0 transition-transform duration-200" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                {obj.axe_couleur && (
                                    <Badge className="shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-md border-0"
                                        style={{ backgroundColor: obj.axe_couleur + '20', color: obj.axe_couleur }}>{obj.axe}</Badge>
                                )}
                                <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white leading-tight">{obj.titre}</h3>
                                <span className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
                                    style={{ backgroundColor: seuilColor + '15', color: seuilColor }}>{Math.round(progression)}%</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-gray-400">
                                    {obj.resultats_count} KR
                                    {Number(obj.prime) > 0 && <> · Prime si ≥ {seuilPrime}% : {formatNumber(obj.prime, 0)} GNF</>}
                                </span>
                                {tachesC > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-gray-400">{tachesT}/{tachesC} tâches</span>
                                        <div className="w-16 bg-gray-200 dark:bg-dark-700 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${tachesC > 0 ? (tachesT / tachesC) * 100 : 0}%`, backgroundColor: seuilColor }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onEdit(obj)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                            <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                        <button onClick={() => onDelete(obj)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* KRs expandable */}
            <AnimatePresence>
                {expanded && obj.resultats_cles?.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="border-t border-gray-100 dark:border-dark-800">
                            {obj.resultats_cles.map((kr, i) => (
                                <KrProgressRow key={kr.id} kr={kr} krIdx={i} seuils={seuils} objectifId={obj.id} onAddTask={onAddTask} onViewTask={onViewTask} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Page principale ────────────────────────────────────────
export default function IndividuelsIndex({
    collaborateurs = [], selectedCollaborateur, moisActuel, moisOptions = [],
    objectifs = [], scoreGlobal = 0, progressionParAxe = [],
    primeEnAttente = 0, primeTotale = 0, seuilPrime = 80,
    axes = [], seuils = [], filters = {},
}) {
    const [showCreate, setShowCreate] = useState(false);
    const [editObj, setEditObj] = useState(null);
    const [taskModal, setTaskModal] = useState({ open: false, objectifId: null, resultatsCles: [], defaultResultatCleId: null });
    const [taskPanel, setTaskPanel] = useState({ tache: null, krDescription: null });

    const handleCollabChange = (id) => router.get(route('individuels.index'), { collaborateur_id: id, mois: moisActuel }, { preserveState: true, preserveScroll: true });
    const handleMoisChange = (m) => router.get(route('individuels.index'), { collaborateur_id: selectedCollaborateur?.id, mois: m }, { preserveState: true, preserveScroll: true });
    const handleDelete = (obj) => { if (!confirm(`Supprimer "${obj.titre}" ?`)) return; router.delete(route('individuels.destroy', obj.id), { preserveScroll: true, onSuccess: () => toast.success('Supprimé') }); };
    const globalColor = getSeuilColor(scoreGlobal, seuils) || '#3b82f6';

    return (
        <AppLayout title="Individuels">
          <div className="max-w-5xl mx-auto">
            {/* Onglets collaborateurs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-thin">
                {collaborateurs.map(c => {
                    const active = selectedCollaborateur?.id === c.id;
                    return (
                        <button key={c.id} onClick={() => handleCollabChange(c.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                active ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-700'
                            }`}>{c.prenom}</button>
                    );
                })}
            </div>

            {/* Header collaborateur */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <UserAvatar name={`${selectedCollaborateur?.prenom || ''} ${selectedCollaborateur?.nom || ''}`} className="h-10 w-10 text-sm" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {selectedCollaborateur?.prenom} {selectedCollaborateur?.nom}
                            {selectedCollaborateur?.poste && <span className="text-gray-400 font-normal"> — {selectedCollaborateur.poste}</span>}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-400">Mois :</span>
                            <select value={moisActuel} onChange={e => handleMoisChange(e.target.value)}
                                className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer appearance-none">
                                {moisOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <ChevronDown className="h-3 w-3 text-gray-400 -ml-1" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all">
                        <Plus className="h-3.5 w-3.5" /> Objectif
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800 transition-all">
                        <Award className="h-3.5 w-3.5" /> Prime
                    </button>
                </div>
            </div>

            {/* Bandeau Score + Axes + Prime */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-gray-100 dark:border-dark-800 bg-white dark:bg-dark-900 p-5 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="text-center shrink-0">
                        <div className="text-4xl font-black" style={{ color: globalColor }}>{Math.round(scoreGlobal)}%</div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Score global</p>
                    </div>
                    <div className="flex-1 flex items-center gap-3 flex-wrap">
                        {progressionParAxe.map(axe => (
                            <div key={axe.id} className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: axe.couleur }} />
                                <span className="text-[11px] font-medium" style={{ color: axe.count > 0 ? axe.couleur : undefined }}>
                                    {axe.nom} {Math.round(axe.progression)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/30 text-center">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Prime en attente</p>
                        <p className="text-xl font-black text-amber-600 dark:text-amber-400">{formatNumber(primeTotale, 0)} GNF</p>
                        <p className="text-[10px] text-amber-500/70 mt-0.5">Seuil {seuilPrime}% · Score {Math.round(scoreGlobal)}%</p>
                    </div>
                </div>
            </motion.div>

            {/* Liste des objectifs */}
            <div className="space-y-3">
                {objectifs.length > 0 ? (
                    objectifs.map(obj => (
                        <ObjectifCard key={obj.id} obj={obj} seuils={seuils} seuilPrime={seuilPrime}
                            onEdit={o => setEditObj(o)} onDelete={handleDelete}
                            onAddTask={(objId, krId) => {
                                const o = objectifs.find(x => x.id === objId);
                                setTaskModal({ open: true, objectifId: objId, resultatsCles: o?.resultats_cles || [], defaultResultatCleId: krId });
                            }}
                            onViewTask={(tache, krDesc) => setTaskPanel({ tache, krDescription: krDesc })} />
                    ))
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-16 rounded-xl border border-dashed border-gray-200 dark:border-dark-700 bg-white/50 dark:bg-dark-900/50">
                        <Target className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-400 mb-1">Aucun objectif pour ce mois</p>
                        <p className="text-xs text-gray-400/70 mb-4">Cliquez sur "+ Objectif" pour commencer</p>
                        <button onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all">
                            <Plus className="h-3.5 w-3.5" /> Nouvel objectif
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Modals */}
            <ObjectifModal open={showCreate} onClose={() => setShowCreate(false)} collaborateurs={collaborateurs}
                selectedCollaborateur={selectedCollaborateur} moisActuel={moisActuel} moisOptions={moisOptions} axes={axes} />
            <ObjectifModal open={!!editObj} onClose={() => setEditObj(null)} collaborateurs={collaborateurs}
                selectedCollaborateur={selectedCollaborateur} moisActuel={moisActuel} moisOptions={moisOptions} axes={axes} editData={editObj} />
            <AddTaskModal open={taskModal.open} onClose={() => setTaskModal({ open: false, objectifId: null, resultatsCles: [], defaultResultatCleId: null })}
                objectifId={taskModal.objectifId} resultatsCles={taskModal.resultatsCles} defaultResultatCleId={taskModal.defaultResultatCleId}
                collaborateurs={collaborateurs} defaultCollaborateurId={selectedCollaborateur?.id} />
            <AnimatePresence>
                {taskPanel.tache && (
                    <TaskDetailPanel tache={taskPanel.tache} krDescription={taskPanel.krDescription}
                        collaborateurs={collaborateurs} onClose={() => setTaskPanel({ tache: null, krDescription: null })} />
                )}
            </AnimatePresence>
          </div>
        </AppLayout>
    );
}
