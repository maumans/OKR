import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/Badge';
import { motion } from 'framer-motion';
import { Calendar, Plus, ClipboardList, PenLine, History, Eye, CheckSquare, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/Dialog';
import { Input } from '@/Components/ui/Input';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';
import { Button } from '@/Components/ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const statutConfig = {
    a_faire:  { label: 'À faire',  dot: 'bg-gray-400' },
    en_cours: { label: 'En cours', dot: 'bg-primary-500' },
    termine:  { label: 'Terminé',  dot: 'bg-emerald-500' },
    bloque:   { label: 'Bloqué',   dot: 'bg-red-500' },
};

const prioriteConfig = {
    basse: { label: 'Basse', color: 'bg-gray-300' },
    normale: { label: 'Normale', color: 'bg-amber-400' },
    haute: { label: 'Haute', color: 'bg-red-400' },
    urgente: { label: 'Urgente', color: 'bg-red-600' },
};

const activiteFields = [
    { key: 'seminaires', label: 'Séminaires', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800' },
    { key: 'recherches', label: 'Recherches', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    { key: 'prospection', label: 'Prospection', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
    { key: 'rdv', label: 'RDV', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
    { key: 'delivery', label: 'Delivery', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
];

// Couleurs pour les dots des collaborateurs
const collabColors = ['bg-orange-400', 'bg-pink-400', 'bg-blue-400', 'bg-emerald-400', 'bg-violet-400', 'bg-amber-400', 'bg-red-400', 'bg-teal-400', 'bg-indigo-400', 'bg-rose-400'];

export default function DailyBilan({ collaborateurs = [], selectedCollaborateur, bilan, tachesDuJour = [], historique = [], tachesOkr = {}, typesTaches = [], scoreJour = 0, currentDate, isOwn }) {
    const [showHistory, setShowHistory] = useState(false);
    
    // Task modal state
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    // Bilan form
    const { data, setData, post, processing } = useForm({
        date: currentDate,
        note: bilan?.note || '',
        blocages: bilan?.blocages || '',
        seminaires: bilan?.seminaires || 0,
        recherches: bilan?.recherches || 0,
        prospection: bilan?.prospection || 0,
        rdv: bilan?.rdv || 0,
        delivery: bilan?.delivery || 0,
    });

    // Task form
    const { 
        data: taskData, 
        setData: setTaskData, 
        post: postTask, 
        put: putTask, 
        reset: resetTask, 
        errors: taskErrors, 
        processing: taskProcessing 
    } = useForm({
        titre: '',
        description: '',
        priorite: 'normale',
        date: currentDate,
        tache_id: '',
        type_tache: '',
        temps_estime: '',
        temps_reel: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('daily.store'));
    };

    const handleDateChange = (newDate) => {
        router.get(route('daily.index'), { date: newDate, collaborateur_id: selectedCollaborateur.id }, { preserveState: true });
    };

    const selectCollab = (id) => {
        router.get(route('daily.index'), { date: currentDate, collaborateur_id: id }, { preserveState: true });
    };

    const goToday = () => handleDateChange(new Date().toISOString().split('T')[0]);

    // ─── Chart Data ────────────────────────────────────────────────
    const radarData = useMemo(() => {
        const sums = {
            seminaires: 0,
            recherches: 0,
            prospection: 0,
            rdv: 0,
            delivery: 0,
        };
        historique.forEach(h => {
            sums.seminaires += h.seminaires || 0;
            sums.recherches += h.recherches || 0;
            sums.prospection += h.prospection || 0;
            sums.rdv += h.rdv || 0;
            sums.delivery += h.delivery || 0;
        });

        const maxVal = Math.max(...Object.values(sums), 5);

        return activiteFields.map(a => ({
            subject: a.label,
            A: sums[a.key],
            fullMark: maxVal,
        }));
    }, [historique]);

    // ─── Tâches Daily Management ───────────────────────────────

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
                temps_estime: task.temps_estime || '',
                temps_reel: task.temps_reel || '',
            });
        } else {
            setEditingTask(null);
            setTaskData({
                titre: '',
                description: '',
                priorite: 'normale',
                date: currentDate,
                tache_id: '',
                type_tache: '',
                temps_estime: '',
                temps_reel: '',
            });
        }
        setIsTaskModalOpen(true);
    };

    const closeTaskModal = () => {
        setIsTaskModalOpen(false);
        resetTask();
        setEditingTask(null);
    };

    const submitTask = (e) => {
        e.preventDefault();
        if (editingTask) {
            putTask(route('daily.taches.update', editingTask.id), {
                onSuccess: () => closeTaskModal(),
                preserveScroll: true,
            });
        } else {
            postTask(route('daily.taches.store'), {
                onSuccess: () => closeTaskModal(),
                preserveScroll: true,
            });
        }
    };

    const toggleTaskStatus = (t) => {
        if (!isOwn) return;
        const newStatus = t.statut === 'termine' ? 'a_faire' : 'termine';
        router.put(route('daily.taches.status', t.id), { statut: newStatus }, { preserveScroll: true });
    };

    const deleteTask = (t) => {
        if (!isOwn) return;
        if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
            router.delete(route('daily.taches.destroy', t.id), { preserveScroll: true });
        }
    };

    const formattedDate = new Date(currentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ');

    return (
        <AppLayout title="Daily">
          <div className="max-w-5xl mx-auto">
            {/* ═══ Team member tabs ═══ */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {collaborateurs.map((c, i) => {
                    const active = c.id === selectedCollaborateur.id;
                    const dotColor = collabColors[i % collabColors.length];
                    return (
                        <button
                            key={c.id}
                            onClick={() => selectCollab(c.id)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                active
                                    ? 'bg-primary-500 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
                            }`}
                        >
                            <div className={`h-2 w-2 rounded-full ${active ? 'bg-white' : dotColor}`} />
                            {c.prenom}
                        </button>
                    );
                })}
            </div>

            {/* ═══ User header + date ═══ */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCollaborateur.nom_complet}</h1>
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-400">{selectedCollaborateur.poste || 'Collaborateur'}</p>
                        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                            Score du jour: {scoreJour} pts
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-40">
                        <CustomDatePicker
                            value={currentDate}
                            onChange={v => { if(v) handleDateChange(v); }}
                            size="sm"
                        />
                    </div>
                    <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-all">
                        Aujourd'hui
                    </button>
                    {isOwn && (
                        <button 
                            onClick={() => openTaskModal()}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                            <Plus className="h-3 w-3" /> Tâche
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-5">
                {/* ═══ Tâches déclarées ═══ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-orange-400" />
                                Tâches déclarées
                            </h2>
                            <span className="text-xs text-gray-400">{tachesDuJour.length === 0 ? 'Aucune tâche' : `${tachesDuJour.length} tâche${tachesDuJour.length > 1 ? 's' : ''}`}</span>
                        </div>

                        {tachesDuJour.length > 0 ? (
                            <div className="border-t border-gray-100 dark:border-dark-800">
                                {tachesDuJour.map(t => {
                                    const cfg = statutConfig[t.statut] || statutConfig.a_faire;
                                    const isDone = t.statut === 'termine';
                                    return (
                                        <div key={t.id} className="group flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 dark:border-dark-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-800/30 transition-colors">
                                            <button 
                                                onClick={() => toggleTaskStatus(t)}
                                                disabled={!isOwn}
                                                className="shrink-0 flex items-center justify-center text-gray-300 hover:text-emerald-500 transition-colors disabled:cursor-default disabled:hover:text-gray-300"
                                            >
                                                {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                                            </button>
                                            
                                            <div className="flex-1 flex flex-col">
                                                <span className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {t.titre}
                                                </span>
                                                {t.description && (
                                                    <span className={`text-xs ${isDone ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'} line-clamp-1`}>
                                                        {t.description}
                                                    </span>
                                                )}
                                                {t.tache_okr && (
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <Badge variant="outline" className="text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 px-1.5 py-0">
                                                            🎯 {t.tache_okr.objectif}
                                                        </Badge>
                                                        <span className="text-[10px] text-gray-500 truncate">{t.tache_okr.titre}</span>
                                                    </div>
                                                )}
                                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                    {t.type_tache_nom && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={t.type_tache_couleur ? { backgroundColor: t.type_tache_couleur + '15', color: t.type_tache_couleur, borderColor: t.type_tache_couleur + '40' } : {}}>
                                                            {t.type_tache_nom}
                                                        </Badge>
                                                    )}
                                                    {(t.temps_estime || t.temps_reel) && (
                                                        <span className="text-[10px] text-gray-500 font-medium">
                                                            ⏱️ {t.temps_reel || 0} / {t.temps_estime || '?'} min
                                                        </span>
                                                    )}
                                                    {t.score > 0 && (
                                                        <span className="text-[10px] font-bold text-orange-500">
                                                            ⭐ +{t.score} pts
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {t.priorite !== 'normale' && (
                                                    <Badge variant="outline" className={`text-[10px] uppercase h-5 px-1.5 ${prioriteConfig[t.priorite]?.color} bg-opacity-20 text-gray-700 dark:text-gray-300 border-none`}>
                                                        {prioriteConfig[t.priorite]?.label}
                                                    </Badge>
                                                )}
                                                {isOwn && (
                                                    <>
                                                        <button 
                                                            onClick={() => openTaskModal(t)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                            title="Modifier"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteTask(t)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-5 py-8 text-center border-t border-gray-100 dark:border-dark-800">
                                <p className="text-sm text-gray-400">Aucune tâche déclarée ce matin.</p>
                                {isOwn && <p className="text-xs text-gray-400 mt-0.5">Clique sur <span className="font-semibold text-orange-500">+ Tâche</span> pour commencer.</p>}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ═══ Bilan fin de journée ═══ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
                            <div className="px-5 py-4">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4 text-emerald-400" />
                                    Bilan fin de journée
                                </h2>
                            </div>

                            {/* Activity counters */}
                            <div className="px-5 pb-4">
                                <div className="flex items-center gap-3 overflow-x-auto">
                                    {activiteFields.map(a => (
                                        <div key={a.key} className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border ${a.border} ${a.bg} min-w-[80px]`}>
                                            {isOwn ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={data[a.key]}
                                                    onChange={e => setData(a.key, parseInt(e.target.value) || 0)}
                                                    className={`w-10 text-center text-lg font-bold bg-transparent border-none p-0 focus:ring-0 ${a.color}`}
                                                />
                                            ) : (
                                                <span className={`text-lg font-bold ${a.color}`}>{data[a.key]}</span>
                                            )}
                                            <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{a.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Note */}
                            <div className="px-5 pb-5">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mb-2">
                                    <PenLine className="h-3 w-3" />
                                    Note (blocages, avancement, priorités demain)
                                </p>
                                <textarea
                                    value={data.note}
                                    onChange={e => setData('note', e.target.value)}
                                    placeholder="Ce qui a avancé, ce qui est bloqué, priorités demain..."
                                    disabled={!isOwn}
                                    className="w-full min-h-[80px] px-3 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-y transition-all disabled:opacity-60"
                                />
                            </div>

                            {/* Save button */}
                            {isOwn && (
                                <div className="px-5 py-3 border-t border-gray-100 dark:border-dark-800 flex justify-end">
                                    <button type="submit" disabled={processing} className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-all disabled:opacity-50">
                                        {bilan ? 'Mettre à jour' : 'Enregistrer'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </motion.div>

                {/* ═══ Historique 7 jours ═══ */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="h-4 w-4 text-blue-400" />
                                Historique 7 jours
                            </h2>
                            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-primary-500 hover:text-primary-600 font-medium">
                                {showHistory ? 'Masquer' : 'Voir'}
                            </button>
                        </div>

                        {showHistory && (
                            <div className="border-t border-gray-100 dark:border-dark-800">
                                {historique.length > 0 ? (
                                    <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
                                        <div className="w-full md:w-1/2 h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                    <PolarGrid stroke="#e5e7eb" className="dark:stroke-dark-700" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                                                    <Radar name="Activités" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem', fontSize: '12px' }}
                                                        itemStyle={{ color: '#60a5fa' }}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="w-full md:w-1/2 divide-y divide-gray-50 dark:divide-dark-800/50">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Détail des {historique.length} derniers jours</h3>
                                            {historique.map(h => {
                                            const d = new Date(h.date);
                                            const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                                            const total = h.seminaires + h.recherches + h.prospection + h.rdv + h.delivery;
                                            return (
                                                <div key={h.id} className="px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-dark-800/30 transition-colors">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{dayLabel}</span>
                                                        <div className="flex items-center gap-2">
                                                            {activiteFields.map(a => (
                                                                h[a.key] > 0 && (
                                                                    <span key={a.key} className={`text-[10px] font-bold ${a.color}`} title={a.label}>
                                                                        {h[a.key]}
                                                                    </span>
                                                                )
                                                            ))}
                                                            {total === 0 && <span className="text-[10px] text-gray-400">—</span>}
                                                        </div>
                                                    </div>
                                                    {h.note && (
                                                        <p className="text-xs text-gray-500 line-clamp-1">{h.note}</p>
                                                    )}
                                                </div>
                                            );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-5 py-6 text-center text-xs text-gray-400">
                                        Aucun bilan sur les 7 derniers jours.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* ═══ Modal Ajouter/Modifier Tâche ═══ */}
            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submitTask} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Titre de la tâche <span className="text-red-500">*</span></label>
                            <Input
                                value={taskData.titre}
                                onChange={e => setTaskData('titre', e.target.value)}
                                placeholder="ex: Appeler le client Dubois..."
                                autoFocus
                            />
                            {taskErrors.titre && <p className="text-xs text-red-500">{taskErrors.titre}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Description (optionnelle)</label>
                            <textarea
                                value={taskData.description}
                                onChange={e => setTaskData('description', e.target.value)}
                                placeholder="Détails, liens, contexte..."
                                className="w-full h-24 px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tâche OKR associée (optionnel)</label>
                            <select
                                value={taskData.tache_id || ''}
                                onChange={e => setTaskData('tache_id', e.target.value)}
                                className="w-full h-10 px-3 text-sm border rounded-lg border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            >
                                <option value="">-- Aucune tâche associée --</option>
                                {Object.entries(tachesOkr).map(([objectif, taches]) => (
                                    <optgroup key={objectif} label={objectif}>
                                        {taches.map(t => (
                                            <option key={t.id} value={t.id}>{t.titre}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {taskErrors.tache_id && <p className="text-xs text-red-500">{taskErrors.tache_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Type de tâche</label>
                                <select
                                    value={taskData.type_tache || ''}
                                    onChange={e => setTaskData('type_tache', e.target.value)}
                                    className="w-full h-10 px-3 text-sm border rounded-lg border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="">-- Sans type --</option>
                                    {typesTaches.map(type => (
                                        <option key={type.id} value={type.id}>{type.nom} ({type.score_base} pts)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Temps estimé (min)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={taskData.temps_estime}
                                    onChange={e => setTaskData('temps_estime', e.target.value)}
                                    placeholder="ex: 30"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Temps réel (min)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={taskData.temps_reel}
                                    onChange={e => setTaskData('temps_reel', e.target.value)}
                                    placeholder="ex: 45"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Priorité</label>
                                <select
                                    value={taskData.priorite}
                                    onChange={e => setTaskData('priorite', e.target.value)}
                                    className="w-full h-10 px-3 text-sm border rounded-lg border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="basse">Basse</option>
                                    <option value="normale">Normale</option>
                                    <option value="haute">Haute</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Date (Bilan)</label>
                                <CustomDatePicker
                                    value={taskData.date}
                                    onChange={v => setTaskData('date', v)}
                                />
                                {taskErrors.date && <p className="text-xs text-red-500">{taskErrors.date}</p>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeTaskModal}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={taskProcessing} className="bg-orange-500 hover:bg-orange-600 text-white">
                                {taskProcessing ? 'Enregistrement...' : (editingTask ? 'Mettre à jour' : 'Créer la tâche')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
          </div>
        </AppLayout>
    );
}
