import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/Badge';
import { motion } from 'framer-motion';
import {
 Calendar, Plus, ClipboardList, PenLine, History, CheckCircle2,
 Circle, Trash2, Edit2, Timer, TrendingUp, Star, AlertTriangle,
 ChevronDown, ChevronUp,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Input } from '@/Components/ui/Input';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';
import { Button } from '@/Components/ui/Button';
import {
 Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
 ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Formats a minute value to a human-readable string: 90 → "1h 30", 45 → "45 min" */
function formatDuration(min) {
 const m = parseInt(min);
 if (!m || isNaN(m) || m <= 0) return null;
 if (m < 60) return `${m} min`;
 const h = Math.floor(m / 60);
 const rem = m % 60;
 return rem ? `${h}h ${String(rem).padStart(2, '0')}` : `${h}h`;
}

const DURATION_PRESETS = [
 { label: '15 min', value: 15 },
 { label: '30 min', value: 30 },
 { label: '45 min', value: 45 },
 { label: '1h', value: 60 },
 { label: '1h 30', value: 90 },
 { label: '2h', value: 120 },
 { label: '3h', value: 180 },
 { label: '4h+', value: 240 },
];

// ─── DurationPicker ────────────────────────────────────────────────────────────

function DurationPicker({ value, onChange, label }) {
 const [custom, setCustom] = useState(false);
 const numVal = parseInt(value) || 0;
 const isPreset = DURATION_PRESETS.some(p => p.value === numVal);

 return (
 <div className="space-y-1.5">
 {label && <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>}
 <div className="flex flex-wrap gap-1.5">
 {DURATION_PRESETS.map(p => (
 <button
 key={p.value}
 type="button"
 onClick={() => { onChange(p.value); setCustom(false); }}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
 numVal === p.value && !custom
 ? 'bg-primary-500 text-white shadow-sm'
 : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
 }`}
 >
 {p.label}
 </button>
 ))}
 <button
 type="button"
 onClick={() => { setCustom(c => !c); if (!isPreset && numVal > 0) setCustom(true); }}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
 custom || (!isPreset && numVal > 0)
 ? 'bg-primary-500 text-white shadow-sm'
 : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
 }`}
 >
 Autre
 </button>
 </div>
 {(custom || (!isPreset && numVal > 0)) && (
 <div className="flex items-center gap-2">
 <Input
 type="number"
 min="1"
 max="600"
 value={value || ''}
 onChange={e => onChange(e.target.value)}
 placeholder="ex: 75"
 className="w-28 h-8 text-sm"
 />
 <span className="text-xs text-gray-400">minutes</span>
 {numVal > 0 && <span className="text-xs text-primary-500 font-medium">= {formatDuration(numVal)}</span>}
 </div>
 )}
 </div>
 );
}

// ─── Config ────────────────────────────────────────────────────────────────────

const prioriteConfig = {
 basse: { label: 'Basse', dot: 'bg-gray-300' },
 normale: { label: 'Normale', dot: 'bg-amber-400' },
 haute: { label: 'Haute', dot: 'bg-orange-500' },
 urgente: { label: 'Urgente', dot: 'bg-red-500' },
};

const CATEGORIES = [
 { value: 'prospection', label: 'Prospection', emoji: '📞', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', bilanKey: 'prospection' },
 { value: 'rdv', label: 'RDV', emoji: '📅', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', bilanKey: 'rdv' },
 { value: 'delivery', label: 'Delivery', emoji: '⚙️', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', bilanKey: 'delivery' },
 { value: 'seminaire', label: 'Séminaire', emoji: '📚', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800', bilanKey: 'seminaires' },
 { value: 'recherche', label: 'Recherche', emoji: '🔍', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', bilanKey: 'recherches' },
 { value: 'autre', label: 'Autre', emoji: '📁', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-dark-800', border: 'border-gray-200 dark:border-dark-700', bilanKey: null },
];

// For radar chart history compatibility
const activiteFields = [
 { key: 'seminaires', label: 'Séminaires', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800' },
 { key: 'recherches', label: 'Recherches', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
 { key: 'prospection',label: 'Prospection',color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
 { key: 'rdv', label: 'RDV', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20',border: 'border-orange-200 dark:border-orange-800' },
 { key: 'delivery', label: 'Delivery', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20',border: 'border-purple-200 dark:border-purple-800' },
];

const collabColors = [
 'bg-orange-400','bg-pink-400','bg-blue-400','bg-emerald-400','bg-violet-400',
 'bg-amber-400','bg-red-400','bg-teal-400','bg-indigo-400','bg-rose-400',
];

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function DailyBilan({
 collaborateurs = [], selectedCollaborateur, bilan,
 tachesDuJour = [], historique = [], tachesOkr = {},
 typesTaches = [], scoreJour = 0, currentDate, isOwn,
}) {
 const [showHistory, setShowHistory] = useState(false);
 const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
 const [editingTask, setEditingTask] = useState(null);

 // ─── Bilan form ──────────────────────────────────────────────────────────
 const { data, setData, post, processing } = useForm({
 date: currentDate,
 note: bilan?.note || '',
 blocages: bilan?.blocages || '',
 priorites_demain: bilan?.priorites_demain || '',
 });

 // ─── Task form ────────────────────────────────────────────────────────────
 const {
 data: taskData, setData: setTaskData, post: postTask,
 put: putTask, reset: resetTask, errors: taskErrors, processing: taskProcessing,
 } = useForm({
 titre: '', description: '', priorite: 'normale', date: currentDate,
 tache_id: '', type_tache: '', categorie: '', temps_estime: '',
 });

 // ─── Auto stats from tachesDuJour (always fresh from props) ──────────────
 const stats = useMemo(() => {
 const total = tachesDuJour.length;
 const done = tachesDuJour.filter(t => t.statut === 'termine').length;
 const enCours = tachesDuJour.filter(t => t.statut === 'en_cours').length;
 const bloque = tachesDuJour.filter(t => t.statut === 'bloque').length;
 const pct = total > 0 ? Math.round((done / total) * 100) : 0;

 const totalEstimate = tachesDuJour.reduce((s, t) => s + (parseInt(t.temps_estime) || 0), 0);
 const totalReal = tachesDuJour
 .filter(t => t.statut === 'termine')
 .reduce((s, t) => s + (parseInt(t.temps_reel) || parseInt(t.temps_estime) || 0), 0);

 const totalPts = tachesDuJour.reduce((s, t) => s + (parseInt(t.score) || 0), 0);

 const typeGroups = {};
 tachesDuJour.filter(t => t.type_tache_nom).forEach(t => {
 const key = t.type_tache_nom;
 if (!typeGroups[key]) typeGroups[key] = { done: 0, total: 0 };
 typeGroups[key].total++;
 if (t.statut === 'termine') typeGroups[key].done++;
 });

 return { total, done, enCours, bloque, pct, totalEstimate, totalReal, totalPts, typeGroups };
 }, [tachesDuJour]);

 // ─── Auto activity counts from completed tasks (always fresh from props) ──
 const activiteCounts = useMemo(() => {
 const counts = {};
 CATEGORIES.filter(c => c.bilanKey).forEach(c => { counts[c.value] = 0; });
 tachesDuJour
 .filter(t => t.statut === 'termine' && t.categorie && counts[t.categorie] !== undefined)
 .forEach(t => { counts[t.categorie]++; });
 return counts;
 }, [tachesDuJour]);

 // ─── Radar data ───────────────────────────────────────────────────────────
 const radarData = useMemo(() => {
 const sums = { seminaires: 0, recherches: 0, prospection: 0, rdv: 0, delivery: 0 };
 historique.forEach(h => {
 sums.seminaires += h.seminaires || 0;
 sums.recherches += h.recherches || 0;
 sums.prospection += h.prospection || 0;
 sums.rdv += h.rdv || 0;
 sums.delivery += h.delivery || 0;
 });
 const maxVal = Math.max(...Object.values(sums), 5);
 return activiteFields.map(a => ({ subject: a.label, A: sums[a.key], fullMark: maxVal }));
 }, [historique]);

 // ─── Handlers ─────────────────────────────────────────────────────────────

 const handleSubmit = (e) => { e.preventDefault(); post(route('daily.store')); };
 const handleDateChange = (d) => router.get(route('daily.index'), { date: d, collaborateur_id: selectedCollaborateur.id }, { preserveState: true });
 const selectCollab = (id) => router.get(route('daily.index'), { date: currentDate, collaborateur_id: id }, { preserveState: true });
 const goToday = () => handleDateChange(new Date().toISOString().split('T')[0]);

 const openTaskModal = (task = null) => {
 if (task) {
 setEditingTask(task);
 setTaskData({
 titre: task.titre,
 description: task.description || '',
 priorite: task.priorite,
 date: task.date,
 tache_id: task.tache_id || '',
 type_tache: task.type_tache || '',
 categorie: task.categorie || '',
 temps_estime: task.temps_estime || '',
 temps_reel: task.temps_reel || '',
 });
 } else {
 setEditingTask(null);
 setTaskData({ titre:'', description:'', priorite:'normale', date:currentDate, tache_id:'', type_tache:'', categorie:'', temps_estime:'' });
 }
 setIsTaskModalOpen(true);
 };

 const closeTaskModal = () => { setIsTaskModalOpen(false); resetTask(); setEditingTask(null); };

 const submitTask = (e) => {
 e.preventDefault();
 const opts = { onSuccess: closeTaskModal, preserveScroll: true };
 editingTask
 ? putTask(route('daily.taches.update', editingTask.id), opts)
 : postTask(route('daily.taches.store'), opts);
 };

 const toggleTaskStatus = (t) => {
 if (!isOwn) return;
 const newStatus = t.statut === 'termine' ? 'a_faire' : 'termine';
 router.put(route('daily.taches.status', t.id), { statut: newStatus }, { preserveScroll: true });
 };

 const deleteTask = (t) => {
 if (!isOwn) return;
 if (confirm('Supprimer cette tâche ?')) {
 router.delete(route('daily.taches.destroy', t.id), { preserveScroll: true });
 }
 };

 const formattedDate = new Date(currentDate + 'T12:00:00').toLocaleDateString('fr-FR', {
 weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
 });

 return (
 <AppLayout title="Daily">
 <div className="">

 {/* ═══ Onglets collaborateurs ═══ */}
 <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
 {collaborateurs.map((c, i) => {
 const active = c.id === selectedCollaborateur.id;
 return (
 <button key={c.id} onClick={() => selectCollab(c.id)}
 className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
 active ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
 }`}>
 <div className={`h-2 w-2 rounded-full ${active ? 'bg-white' : collabColors[i % collabColors.length]}`} />
 {c.prenom}
 </button>
 );
 })}
 </div>

 {/* ═══ Header utilisateur ═══ */}
 <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
 <div>
 <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCollaborateur.nom_complet}</h1>
 <div className="flex items-center gap-3 mt-1 flex-wrap">
 <p className="text-sm text-gray-400">{selectedCollaborateur.poste || 'Collaborateur'}</p>
 <span className="text-xs capitalize text-gray-500 dark:text-gray-400">{formattedDate}</span>
 {scoreJour > 0 && (
 <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800">
 <Star className="h-3 w-3 mr-1 fill-current" /> {scoreJour} pts aujourd'hui
 </Badge>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-40">
 <CustomDatePicker value={currentDate} onChange={v => { if (v) handleDateChange(v); }} size="sm" />
 </div>
 <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-all">
 Aujourd'hui
 </button>
 {isOwn && (
 <button onClick={() => openTaskModal()}
 className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-all flex items-center gap-1">
 <Plus className="h-3 w-3" /> Tâche
 </button>
 )}
 </div>
 </div>

 <div className="space-y-5">

 {/* ═══ Tâches déclarées ═══ */}
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
 <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
 <div className="px-5 py-4 flex items-center justify-between">
 <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
 <ClipboardList className="h-4 w-4 text-orange-400" /> Tâches déclarées
 </h2>
 <span className="text-xs text-gray-400">
 {tachesDuJour.length === 0 ? 'Aucune tâche' : `${stats.done}/${stats.total} terminée${stats.done > 1 ? 's' : ''}`}
 </span>
 </div>

 {tachesDuJour.length > 0 ? (
 <div className="border-t border-gray-100 dark:border-dark-800">
 {tachesDuJour.map(t => {
 const isDone = t.statut === 'termine';
 const hasTime = t.temps_estime || t.temps_reel;
 const isOverTime = isDone && t.temps_reel && t.temps_estime && parseInt(t.temps_reel) > parseInt(t.temps_estime);
 return (
 <div key={t.id}
 className="group flex items-start gap-3 px-5 py-3 border-b border-gray-50 dark:border-dark-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-800/30 transition-colors">
 <button onClick={() => toggleTaskStatus(t)} disabled={!isOwn}
 className="mt-0.5 shrink-0 text-gray-300 hover:text-emerald-500 transition-colors disabled:cursor-default disabled:hover:text-gray-300">
 {isDone
 ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
 : <Circle className="h-5 w-5" />}
 </button>

 <div className="flex-1 min-w-0">
 <div className="flex items-start gap-2 flex-wrap">
 <span className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
 {t.titre}
 </span>
 {t.priorite !== 'normale' && (
 <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
 t.priorite === 'urgente' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
 t.priorite === 'haute' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
 'bg-gray-100 text-gray-500'
 }`}>
 {prioriteConfig[t.priorite]?.label}
 </span>
 )}
 </div>

 {t.description && (
 <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>
 )}

 {t.tache_okr && (
 <div className="mt-1.5 flex items-center gap-1.5">
 <Badge variant="outline" className="text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 px-1.5 py-0">
 🎯 {t.tache_okr.objectif}
 </Badge>
 <span className="text-[10px] text-gray-400 truncate">{t.tache_okr.titre}</span>
 </div>
 )}

 <div className="mt-1.5 flex items-center gap-2 flex-wrap">
 {t.categorie && t.categorie !== 'autre' && (() => {
 const cat = CATEGORIES.find(c => c.value === t.categorie);
 return cat ? (
 <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cat.bg} ${cat.border} ${cat.color}`}>
 {cat.emoji} {cat.label}
 </span>
 ) : null;
 })()}
 {t.type_tache_nom && (
 <span
 className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
 style={t.type_tache_couleur ? {
 backgroundColor: t.type_tache_couleur + '18',
 color: t.type_tache_couleur,
 borderColor: t.type_tache_couleur + '40',
 } : {}}
 >
 {t.type_tache_nom}
 </span>
 )}

 {hasTime && (
 <span className={`text-[10px] font-medium flex items-center gap-1 ${
 isDone && t.temps_reel
 ? isOverTime ? 'text-amber-500' : 'text-emerald-500'
 : 'text-gray-400'
 }`}>
 <Timer className="h-3 w-3" />
 {isDone && t.temps_reel
 ? <>{formatDuration(t.temps_reel)}<span className="opacity-60"> / {formatDuration(t.temps_estime)}</span></>
 : <span className="opacity-70">Prévue : {formatDuration(t.temps_estime)}</span>
 }
 </span>
 )}

 {t.score > 0 && isDone && (
 <span className="text-[10px] font-bold text-orange-500 flex items-center gap-0.5">
 <Star className="h-3 w-3 fill-current" /> +{t.score} pts
 </span>
 )}
 </div>
 </div>

 {isOwn && (
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
 <button onClick={() => openTaskModal(t)}
 className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Modifier">
 <Edit2 className="h-3.5 w-3.5" />
 </button>
 <button onClick={() => deleteTask(t)}
 className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Supprimer">
 <Trash2 className="h-3.5 w-3.5" />
 </button>
 </div>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 <div className="px-5 py-8 text-center border-t border-gray-100 dark:border-dark-800">
 <p className="text-sm text-gray-400">Aucune tâche déclarée pour cette journée.</p>
 {isOwn && <p className="text-xs text-gray-400 mt-1">Clique sur <span className="font-semibold text-orange-500">+ Tâche</span> pour commencer.</p>}
 </div>
 )}
 </div>
 </motion.div>

 {/* ═══ Résumé auto du jour ═══ */}
 {tachesDuJour.length > 0 && (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
 <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-dark-900 dark:to-dark-950 rounded-xl border border-gray-200 dark:border-dark-800 px-5 py-4">
 <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
 <TrendingUp className="h-3.5 w-3.5" /> Résumé automatique du jour
 </h3>
 <div className="flex flex-wrap items-center gap-4">
 {/* Completion */}
 <div className="flex items-center gap-3 flex-1 min-w-[200px]">
 <div className="relative w-12 h-12 shrink-0">
 <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
 <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-gray-200 dark:text-dark-700" />
 <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3.5"
 strokeDasharray={`${stats.pct} ${100 - stats.pct}`}
 strokeLinecap="round"
 className={stats.pct >= 80 ? 'text-emerald-500' : stats.pct >= 50 ? 'text-amber-500' : 'text-blue-500'} />
 </svg>
 <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${stats.pct >= 80 ? 'text-emerald-500' : stats.pct >= 50 ? 'text-amber-500' : 'text-blue-500'}`}>
 {stats.pct}%
 </span>
 </div>
 <div>
 <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.done}/{stats.total} tâche{stats.total > 1 ? 's' : ''}</p>
 <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
 {stats.enCours > 0 && <span className="text-blue-500">{stats.enCours} en cours</span>}
 {stats.bloque > 0 && <span className="text-red-500 flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" />{stats.bloque} bloqué{stats.bloque > 1 ? 's' : ''}</span>}
 </div>
 </div>
 </div>

 {/* Time */}
 {stats.totalEstimate > 0 && (
 <div className="flex items-center gap-1.5 text-sm">
 <Timer className="h-4 w-4 text-gray-400 shrink-0" />
 <span className="font-semibold text-gray-700 dark:text-gray-200">{formatDuration(stats.totalReal) || '—'}</span>
 <span className="text-gray-400 text-xs">/ {formatDuration(stats.totalEstimate)} prévues</span>
 </div>
 )}

 {/* Points */}
 {stats.totalPts > 0 && (
 <div className="flex items-center gap-1.5 text-sm font-bold text-orange-500">
 <Star className="h-4 w-4 fill-current" /> {stats.totalPts} pts gagnés
 </div>
 )}

 {/* Type pills */}
 {Object.keys(stats.typeGroups).length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {Object.entries(stats.typeGroups).map(([nom, g]) => (
 <span key={nom} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
 {nom} × {g.done}/{g.total}
 </span>
 ))}
 </div>
 )}
 </div>
 </div>
 </motion.div>
 )}

 {/* ═══ Bilan fin de journée ═══ */}
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
 <form onSubmit={handleSubmit}>
 <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-800">
 <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
 <PenLine className="h-4 w-4 text-emerald-400" /> Bilan fin de journée
 </h2>
 <p className="text-[11px] text-gray-400 mt-0.5">Activités manuelles + réflexion du soir</p>
 </div>

 {/* Compteurs auto depuis les tâches terminées */}
 <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-800">
 <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
 <TrendingUp className="h-3 w-3" /> Activités du jour (calculé automatiquement)
 </p>
 {tachesDuJour.length === 0 ? (
 <p className="text-xs text-gray-400 italic">Aucune tâche déclarée — ajoutez des tâches avec une catégorie pour voir vos activités.</p>
 ) : (
 <div className="flex flex-wrap gap-3">
 {CATEGORIES.filter(c => c.bilanKey).map(cat => {
 const count = activiteCounts[cat.value] || 0;
 const total = tachesDuJour.filter(t => t.categorie === cat.value).length;
 return (
 <div key={cat.value} className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border ${cat.border} ${cat.bg} min-w-[90px] transition-all ${count > 0 ? 'shadow-sm' : 'opacity-60'}`}>
 <span className="text-lg">{cat.emoji}</span>
 <span className={`text-xl font-bold ${cat.color}`}>{count}</span>
 <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{cat.label}</span>
 {total > 0 && (
 <span className="text-[9px] text-gray-400">{count}/{total} faites</span>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Réflexion structurée */}
 <div className="px-5 py-4 space-y-4">
 <div>
 <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Ce qui a avancé aujourd'hui
 </label>
 <textarea
 value={data.note}
 onChange={e => setData('note', e.target.value)}
 placeholder="Les tâches réalisées, les avancées clés, les succès..."
 disabled={!isOwn}
 rows={2}
 className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-all disabled:opacity-60"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
 <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Blocages &amp; obstacles
 </label>
 <textarea
 value={data.blocages}
 onChange={e => setData('blocages', e.target.value)}
 placeholder="Ce qui a bloqué, les dépendances manquantes, les risques..."
 disabled={!isOwn}
 rows={2}
 className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-all disabled:opacity-60"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
 <Calendar className="h-3.5 w-3.5 text-blue-500" /> Priorités pour demain
 </label>
 <textarea
 value={data.priorites_demain}
 onChange={e => setData('priorites_demain', e.target.value)}
 placeholder="Les 1-3 choses les plus importantes à faire demain..."
 disabled={!isOwn}
 rows={2}
 className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-all disabled:opacity-60"
 />
 </div>
 </div>

 {isOwn && (
 <div className="px-5 py-3 border-t border-gray-100 dark:border-dark-800 flex justify-end">
 <Button type="submit" disabled={processing} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8">
 {processing ? 'Enregistrement...' : bilan ? 'Mettre à jour le bilan' : 'Enregistrer le bilan'}
 </Button>
 </div>
 )}
 </div>
 </form>
 </motion.div>

 {/* ═══ Historique 7 jours ═══ */}
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
 <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
 <button
 onClick={() => setShowHistory(s => !s)}
 className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"
 >
 <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
 <History className="h-4 w-4 text-blue-400" /> Historique 7 jours
 </h2>
 {showHistory ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
 </button>

 {showHistory && (
 <div className="border-t border-gray-100 dark:border-dark-800">
 {historique.length > 0 ? (
 <div className="p-5 flex flex-col md:flex-row gap-6 items-start">
 <div className="w-full md:w-1/2 h-60">
 <ResponsiveContainer width="100%" height="100%">
 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
 <PolarGrid stroke="#e5e7eb" className="dark:stroke-dark-700" />
 <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
 <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
 <Radar name="Activités" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} />
 <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem', fontSize: '12px' }} itemStyle={{ color: '#60a5fa' }} />
 </RadarChart>
 </ResponsiveContainer>
 </div>
 <div className="w-full md:w-1/2">
 <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Derniers {historique.length} jours</h3>
 <div className="space-y-1">
 {historique.map(h => {
 const d = new Date(h.date + 'T12:00:00');
 const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
 const total = activiteFields.reduce((s, a) => s + (h[a.key] || 0), 0);
 return (
 <div key={h.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-dark-800/50 last:border-0">
 <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize w-28 shrink-0">{dayLabel}</span>
 <div className="flex-1">
 <div className="flex flex-wrap gap-1.5">
 {activiteFields.map(a => h[a.key] > 0 && (
 <span key={a.key} className={`text-[10px] font-bold ${a.color}`} title={a.label}>
 {a.label.slice(0,3)}:{h[a.key]}
 </span>
 ))}
 {total === 0 && <span className="text-[10px] text-gray-400">—</span>}
 </div>
 {(h.note || h.priorites_demain) && (
 <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
 {h.note || h.priorites_demain}
 </p>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 ) : (
 <div className="px-5 py-6 text-center text-xs text-gray-400">
 Aucun bilan enregistré sur les 7 derniers jours.
 </div>
 )}
 </div>
 )}
 </div>
 </motion.div>
 </div>

 {/* ═══ Modal Tâche ═══ */}
 <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
 <DialogContent className="max-h-[90vh] overflow-hidden p-0 flex flex-col max-w-lg">
 <div className="px-6 pt-6 pb-4 shrink-0 border-b border-gray-100 dark:border-dark-700">
 <DialogHeader>
 <DialogTitle>{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche du jour'}</DialogTitle>
 </DialogHeader>
 </div>

 <form onSubmit={submitTask} className="flex flex-col flex-1 min-h-0">
 <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Titre <span className="text-red-500">*</span></label>
 <Input
 value={taskData.titre}
 onChange={e => setTaskData('titre', e.target.value)}
 placeholder="ex: Appeler le client Dubois..."
 autoFocus
 />
 {taskErrors.titre && <p className="text-xs text-red-500">{taskErrors.titre}</p>}
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Description</label>
 <textarea
 value={taskData.description}
 onChange={e => setTaskData('description', e.target.value)}
 placeholder="Détails, contexte, liens..."
 rows={2}
 className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tâche OKR associée</label>
 <select
 value={taskData.tache_id || ''}
 onChange={e => setTaskData('tache_id', e.target.value)}
 className="w-full h-9 px-3 text-sm border rounded-lg border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
 >
 <option value="">— Aucune tâche OKR —</option>
 {Object.entries(tachesOkr).map(([objectif, taches]) => (
 <optgroup key={objectif} label={objectif}>
 {taches.map(t => <option key={t.id} value={t.id}>{t.titre}</option>)}
 </optgroup>
 ))}
 </select>
 </div>

 {/* Catégorie d'activité */}
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
 Catégorie d'activité <span className="text-gray-400 font-normal">(pour le bilan du jour)</span>
 </label>
 <div className="flex flex-wrap gap-2">
 {CATEGORIES.map(cat => (
 <button
 key={cat.value}
 type="button"
 onClick={() => setTaskData('categorie', taskData.categorie === cat.value ? '' : cat.value)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
 taskData.categorie === cat.value
 ? `${cat.bg} ${cat.border} ${cat.color} shadow-sm`
 : 'bg-gray-50 dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-500 hover:border-gray-300'
 }`}
 >
 {cat.emoji} {cat.label}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Type de tâche</label>
 <select
 value={taskData.type_tache || ''}
 onChange={e => setTaskData('type_tache', e.target.value)}
 className="w-full h-9 px-3 text-sm border rounded-lg border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
 >
 <option value="">— Sans type —</option>
 {typesTaches.map(t => (
 <option key={t.id} value={t.id}>{t.nom} (+{t.score_base} pts)</option>
 ))}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Priorité</label>
 <select
 value={taskData.priorite}
 onChange={e => setTaskData('priorite', e.target.value)}
 className="w-full h-9 px-3 text-sm border rounded-lg border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
 >
 <option value="basse">Basse</option>
 <option value="normale">Normale</option>
 <option value="haute">Haute</option>
 <option value="urgente">Urgente</option>
 </select>
 </div>
 </div>

 {/* Durée prévue — toujours visible */}
 <div>
 <DurationPicker
 value={taskData.temps_estime}
 onChange={v => setTaskData('temps_estime', v)}
 label="Durée prévue"
 />
 </div>

 {/* Durée réalisée — uniquement en édition */}
 {editingTask && (
 <div>
 <DurationPicker
 value={taskData.temps_reel || ''}
 onChange={v => setTaskData('temps_reel', v)}
 label="Durée réalisée"
 />
 {taskData.temps_estime && taskData.temps_reel && (
 <p className={`text-xs mt-1.5 font-medium ${
 parseInt(taskData.temps_reel) > parseInt(taskData.temps_estime)
 ? 'text-amber-500'
 : 'text-emerald-500'
 }`}>
 {parseInt(taskData.temps_reel) > parseInt(taskData.temps_estime)
 ? `⚠ +${formatDuration(parseInt(taskData.temps_reel) - parseInt(taskData.temps_estime))} au-delà du prévu`
 : `✓ Dans le temps prévu`
 }
 </p>
 )}
 </div>
 )}

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Date du bilan</label>
 <CustomDatePicker value={taskData.date} onChange={v => setTaskData('date', v)} />
 {taskErrors.date && <p className="text-xs text-red-500">{taskErrors.date}</p>}
 </div>
 </div>

 <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 shrink-0 flex justify-end gap-2">
 <Button type="button" variant="outline" onClick={closeTaskModal}>Annuler</Button>
 <Button type="submit" disabled={taskProcessing} className="bg-orange-500 hover:bg-orange-600 text-white">
 {taskProcessing ? 'Enregistrement...' : editingTask ? 'Mettre à jour' : 'Ajouter la tâche'}
 </Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 </div>
 </AppLayout>
 );
}
