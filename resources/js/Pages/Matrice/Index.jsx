import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, ChevronDown, ChevronUp, CheckCircle2, Circle,
    Clock, AlertTriangle, X, Filter, Users,
} from 'lucide-react';

const quadrantConfig = {
    Q1: {
        label: 'Q1 — Faire maintenant',
        subtitle: 'Urgent + Important',
        borderColor: 'border-l-red-500',
        bgHover: 'hover:bg-red-50/50 dark:hover:bg-red-900/5',
        headerBg: 'bg-red-50/50 dark:bg-red-900/10',
        textColor: 'text-red-700 dark:text-red-400',
        subtitleColor: 'text-red-500/70 dark:text-red-400/60',
        badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        dotColor: '#ef4444',
    },
    Q2: {
        label: 'Q2 — Planifier',
        subtitle: 'Important + Pas urgent',
        borderColor: 'border-l-blue-500',
        bgHover: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/5',
        headerBg: 'bg-blue-50/50 dark:bg-blue-900/10',
        textColor: 'text-blue-700 dark:text-blue-400',
        subtitleColor: 'text-blue-500/70 dark:text-blue-400/60',
        badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        dotColor: '#3b82f6',
    },
    Q3: {
        label: 'Q3 — Déléguer',
        subtitle: 'Urgent + Pas important',
        borderColor: 'border-l-amber-500',
        bgHover: 'hover:bg-amber-50/50 dark:hover:bg-amber-900/5',
        headerBg: 'bg-amber-50/50 dark:bg-amber-900/10',
        textColor: 'text-amber-700 dark:text-amber-400',
        subtitleColor: 'text-amber-500/70 dark:text-amber-400/60',
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        dotColor: '#f59e0b',
    },
    Q4: {
        label: 'Q4 — Éliminer',
        subtitle: 'Ni urgent ni important',
        borderColor: 'border-l-gray-400',
        bgHover: 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30',
        headerBg: 'bg-gray-50/50 dark:bg-gray-800/30',
        textColor: 'text-gray-600 dark:text-gray-400',
        subtitleColor: 'text-gray-400/70 dark:text-gray-500/60',
        badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        dotColor: '#9ca3af',
    },
};

const prioriteColors = { basse: '#94a3b8', normale: '#f59e0b', haute: '#ef4444', urgente: '#dc2626' };

function formatPeriodDates(p) {
    if (!p?.date_debut || !p?.date_fin) return '';
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const d1 = new Date(p.date_debut);
    const d2 = new Date(p.date_fin);
    return `${months[d1.getMonth()]}-${months[d2.getMonth()]}`;
}

function formatDeadline(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const day = d.getDate();
    const weekStart = day <= 7 ? 'Sem 1' : day <= 14 ? 'Sem 2' : day <= 21 ? 'Sem 3' : 'Fin';
    return `${weekStart} ${months[d.getMonth()]}`;
}

// ─── Composant tâche dans un quadrant ─────────────────────
function TaskItem({ tache, config }) {
    const isTermine = tache.statut === 'termine';

    const handleToggle = (e) => {
        e.stopPropagation();
        const newStatut = isTermine ? 'a_faire' : 'termine';
        router.put(route('taches.status', tache.id), { statut: newStatut }, {
            preserveScroll: true,
            onSuccess: () => toast.success(newStatut === 'termine' ? 'Tâche terminée' : 'Tâche réouverte'),
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors ${config.bgHover}`}
        >
            <button onClick={handleToggle} className="mt-0.5 shrink-0">
                {isTermine ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                    <Circle className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                )}
            </button>
            <div className="flex-1 min-w-0">
                <p className={`text-[12px] leading-snug ${
                    isTermine
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-700 dark:text-gray-300'
                }`}>
                    {tache.titre}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    {tache.collaborateur && (
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
                            {tache.collaborateur}
                        </span>
                    )}
                    {tache.date && (
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">
                            {formatDeadline(tache.date)}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: prioriteColors[tache.priorite] || '#94a3b8' }} title={tache.priorite} />
            </div>
        </motion.div>
    );
}

// ─── Composant quadrant ───────────────────────────────────
function QuadrantCard({ quadrantKey, taches, config }) {
    const [expanded, setExpanded] = useState(false);
    const INITIAL_DISPLAY = 8;
    const hasMore = taches.length > INITIAL_DISPLAY;
    const displayedTaches = expanded ? taches : taches.slice(0, INITIAL_DISPLAY);
    const remainingCount = taches.length - INITIAL_DISPLAY;
    const terminees = taches.filter(t => t.statut === 'termine').length;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden shadow-sm border-l-4 ${config.borderColor} flex flex-col`}
        >
            {/* Header */}
            <div className={`px-4 py-3 ${config.headerBg}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-[13px] font-bold ${config.textColor}`}>{config.label}</h3>
                        <p className={`text-[10px] font-medium ${config.subtitleColor} mt-0.5`}>{config.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {terminees > 0 && (
                            <span className="text-[9px] font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                {terminees} faites
                            </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                            {taches.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tasks list */}
            <div className="flex-1 py-1.5 min-h-[120px]">
                {taches.length > 0 ? (
                    <>
                        <AnimatePresence mode="popLayout">
                            {displayedTaches.map((tache) => (
                                <TaskItem key={tache.id} tache={tache} config={config} />
                            ))}
                        </AnimatePresence>

                        {hasMore && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-1.5 px-3 py-2 mx-3 mt-1 text-[11px] font-medium text-primary-500 hover:text-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 rounded-lg transition-colors w-[calc(100%-1.5rem)]"
                            >
                                {expanded ? (
                                    <>
                                        <ChevronUp className="h-3 w-3" />
                                        Réduire
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-3 w-3" />
                                        +{remainingCount} de plus...
                                    </>
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-6">
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center mb-2">
                            <CheckCircle2 className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">Aucune tâche</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Page principale ──────────────────────────────────────
export default function MatriceIndex({ quadrants, stats, periodes = [], collaborateurs = [], selectedPeriode, filters = {} }) {
    const [periodeFilter, setPeriodeFilter] = useState(filters?.periode_id || selectedPeriode?.id || '');
    const [collabFilter, setCollabFilter] = useState(filters?.collaborateur_id || '');

    const applyFilters = (key, value) => {
        const f = {
            periode_id: periodeFilter,
            collaborateur_id: collabFilter,
            [key]: value,
        };
        Object.keys(f).forEach(k => f[k] === '' && delete f[k]);
        router.get(route('matrice.index'), f, { preserveState: true, replace: true });
    };

    const hasFilters = periodeFilter || collabFilter;

    // Titre dynamique avec période
    const periodLabel = selectedPeriode
        ? `${selectedPeriode.nom} ${new Date(selectedPeriode.date_debut).getFullYear()}`
        : new Date().getFullYear().toString();

    // Calcul de l'alerte d'équilibre (Warning si > 50% de tâches en Q1+Q3)
    const urgentTasks = (stats.Q1 || 0) + (stats.Q3 || 0);
    const showWarning = stats.total > 0 && (urgentTasks / stats.total) > 0.5;

    return (
        <AppLayout title="Matrice Eisenhower">
            {/* ═══ Header titre + stats ═══ */}
            <div className="max-w-6xl mx-auto mb-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <ClipboardList className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                Matrice Eisenhower — {periodLabel}
                            </h1>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {stats.total} tâches classées · {stats.terminees} terminées
                            </p>
                        </div>
                    </div>

                    {/* Mini stats */}
                    <div className="hidden sm:flex items-center gap-3">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                            <div key={q} className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: quadrantConfig[q].dotColor }} />
                                <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{stats[q]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ Alert d'équilibre ═══ */}
            {showWarning && (
                <div className="max-w-6xl mx-auto mb-5 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Alerte d'équilibre</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                            Plus de 50% de vos tâches sont classées comme "Urgentes" (Q1 et Q3). Attention au risque de surcharge.
                            Pensez à déléguer les tâches du Q3 et à planifier davantage (Q2) pour réduire la pression quotidienne.
                        </p>
                    </div>
                </div>
            )}

            {/* ═══ Period Tabs ═══ */}
            {periodes.length > 0 && (
                <div className="flex items-center gap-4 mb-5 overflow-x-auto border-b border-gray-200 dark:border-dark-800 max-w-6xl mx-auto">
                    {periodes.map(p => {
                        const active = String(periodeFilter) === String(p.id);
                        const dateRange = formatPeriodDates(p);
                        return (
                            <button
                                key={p.id}
                                onClick={() => {
                                    const newVal = active ? '' : String(p.id);
                                    setPeriodeFilter(newVal);
                                    applyFilters('periode_id', newVal);
                                }}
                                className={`shrink-0 pb-2.5 pt-1 text-xs font-semibold transition-all border-b-2 ${
                                    active
                                        ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {p.nom}
                                {dateRange && <span className={`ml-1.5 font-normal ${active ? 'text-fuchsia-400' : 'text-gray-400'}`}>{dateRange}</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ═══ Filters bar ═══ */}
            <div className="flex items-center gap-2 mb-5 flex-wrap max-w-6xl mx-auto">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Filtres
                </span>
                <select
                    value={collabFilter}
                    onChange={(e) => { setCollabFilter(e.target.value); applyFilters('collaborateur_id', e.target.value); }}
                    className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs px-2.5 py-1.5 pr-7 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500 cursor-pointer"
                >
                    <option value="">Tous les collaborateurs</option>
                    {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
                {hasFilters && (
                    <button
                        onClick={() => {
                            setPeriodeFilter('');
                            setCollabFilter('');
                            router.get(route('matrice.index'), {}, { preserveState: true, replace: true });
                        }}
                        className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <X className="h-3 w-3" /> Effacer
                    </button>
                )}
            </div>

            {/* ═══ Matrice 2×2 ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
                <QuadrantCard quadrantKey="Q1" taches={quadrants.Q1 || []} config={quadrantConfig.Q1} />
                <QuadrantCard quadrantKey="Q2" taches={quadrants.Q2 || []} config={quadrantConfig.Q2} />
                <QuadrantCard quadrantKey="Q3" taches={quadrants.Q3 || []} config={quadrantConfig.Q3} />
                <QuadrantCard quadrantKey="Q4" taches={quadrants.Q4 || []} config={quadrantConfig.Q4} />
            </div>

            {/* ═══ Légende ═══ */}
            <div className="max-w-6xl mx-auto mt-6">
                <div className="flex items-center justify-center gap-6 text-[10px] text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span>Urgente</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Haute</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span>Normale</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        <span>Basse</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span>Terminée</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Circle className="h-3 w-3 text-gray-300" />
                        <span>À faire</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
