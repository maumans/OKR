import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import {
    Users, CheckSquare, Star, ClipboardList, Calendar,
    ChevronDown, ChevronUp, ArrowLeft, TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Link } from '@inertiajs/react';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const collabColors = [
    'bg-orange-400', 'bg-pink-400', 'bg-blue-400', 'bg-emerald-400', 'bg-violet-400',
    'bg-amber-400', 'bg-red-400', 'bg-teal-400', 'bg-indigo-400', 'bg-rose-400',
];

function initials(name = '') {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function isWeekend(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
}

function shortDay(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

function shortDayMobile(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric' });
}

function pct(terminees, total) {
    return total > 0 ? Math.round((terminees / total) * 100) : null;
}

// ─── Heatmap cell ──────────────────────────────────────────────────────────────

function cellStyle(jour, isToday) {
    if (!jour || jour.total === 0) {
        return {
            bg: 'bg-gray-100 dark:bg-dark-800',
            text: 'text-gray-300 dark:text-dark-600',
            ring: isToday ? 'ring-2 ring-primary-400' : '',
        };
    }
    const p = pct(jour.terminees, jour.total);
    if (p === 100) return { bg: 'bg-emerald-500', text: 'text-white', ring: isToday ? 'ring-2 ring-emerald-300' : '' };
    if (p >= 75)  return { bg: 'bg-emerald-200 dark:bg-emerald-900/60', text: 'text-emerald-800 dark:text-emerald-200', ring: isToday ? 'ring-2 ring-emerald-300' : '' };
    if (p >= 50)  return { bg: 'bg-amber-200 dark:bg-amber-900/60',    text: 'text-amber-800 dark:text-amber-200',    ring: isToday ? 'ring-2 ring-amber-300' : '' };
    if (p >= 25)  return { bg: 'bg-orange-200 dark:bg-orange-900/60',  text: 'text-orange-800 dark:text-orange-200',  ring: isToday ? 'ring-2 ring-orange-300' : '' };
    return         { bg: 'bg-red-200 dark:bg-red-900/60',              text: 'text-red-800 dark:text-red-200',        ring: isToday ? 'ring-2 ring-red-300' : '' };
}

// ─── Mini stat card ────────────────────────────────────────────────────────────

function MiniStat({ icon: Icon, label, value, color = 'primary', delay = 0 }) {
    const colorMap = {
        primary: { bg: 'bg-primary-500/10', text: 'text-primary-500', border: 'border-primary-500/20' },
        success: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
        warning: { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20'   },
        orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-500',  border: 'border-orange-500/20'  },
    };
    const c = colorMap[color] || colorMap.primary;
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: delay * 0.07 }}
            className={`bg-white dark:bg-dark-800 rounded-xl border ${c.border} p-4 flex items-center gap-3`}
        >
            <div className={`${c.bg} rounded-lg p-2 shrink-0`}>
                <Icon className={`h-4 w-4 ${c.text}`} />
            </div>
            <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </motion.div>
    );
}

// ─── CollabRow ─────────────────────────────────────────────────────────────────

function CollabRow({ collab, dates, index, today }) {
    const [expanded, setExpanded] = useState(false);
    const totaux = collab.totaux;
    const completionPct = pct(totaux.taches_terminees, totaux.taches_total);
    const activities = [
        { key: 'prospection', label: 'Prosp.', color: 'text-green-600 dark:text-green-400' },
        { key: 'rdv',         label: 'RDV',    color: 'text-orange-600 dark:text-orange-400' },
        { key: 'delivery',    label: 'Deliv.',  color: 'text-purple-600 dark:text-purple-400' },
        { key: 'seminaires',  label: 'Sémin.', color: 'text-cyan-600 dark:text-cyan-400' },
        { key: 'recherches',  label: 'Rech.',  color: 'text-blue-600 dark:text-blue-400' },
    ].filter(a => totaux[a.key] > 0);

    const hasActivities = activities.length > 0;
    const bgColor = collabColors[index % collabColors.length];

    return (
        <>
            <tr className="group hover:bg-gray-50/70 dark:hover:bg-dark-800/50 transition-colors">
                {/* Nom collaborateur */}
                <td className="px-4 py-2.5 sticky left-0 bg-white dark:bg-dark-900 group-hover:bg-gray-50/70 dark:group-hover:bg-dark-800/50 z-10 border-r border-gray-100 dark:border-dark-800 min-w-[180px]">
                    <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-full ${bgColor} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                            {initials(collab.nom_complet)}
                        </div>
                        <div className="min-w-0">
                            <Link
                                href={route('daily.index', { collaborateur_id: collab.id })}
                                className="text-[13px] font-medium text-gray-800 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                            >
                                {collab.prenom}
                            </Link>
                            {collab.poste && <p className="text-[10px] text-gray-400 truncate">{collab.poste}</p>}
                        </div>
                    </div>
                </td>

                {/* Cellules par jour */}
                {dates.map((date) => {
                    const jour = collab.jours[date];
                    const isToday = date === today;
                    const isWE = isWeekend(date);
                    const style = cellStyle(jour, isToday);
                    const p = jour?.total > 0 ? pct(jour.terminees, jour.total) : null;

                    return (
                        <td key={date} className={`px-1 py-1.5 text-center ${isWE ? 'opacity-50' : ''}`}>
                            <button
                                onClick={() => router.get(route('daily.index', { date, collaborateur_id: collab.id }))}
                                title={
                                    jour?.total > 0
                                        ? `${jour.terminees}/${jour.total} tâches${jour.a_bilan ? ' · Bilan ✓' : ''}`
                                        : 'Aucune tâche'
                                }
                                className={`relative h-9 w-full min-w-[36px] max-w-[52px] mx-auto rounded-md flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-md ${style.bg} ${style.text} ${style.ring}`}
                            >
                                {jour?.total > 0 ? (
                                    <span className="text-[11px] font-bold leading-none">
                                        {jour.terminees}/{jour.total}
                                    </span>
                                ) : (
                                    <span className="text-[10px]">—</span>
                                )}
                                {jour?.a_bilan && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary-500 rounded-full border border-white dark:border-dark-900" title="Bilan soumis" />
                                )}
                            </button>
                        </td>
                    );
                })}

                {/* Totaux */}
                <td className="px-4 py-2.5 sticky right-0 bg-white dark:bg-dark-900 group-hover:bg-gray-50/70 dark:group-hover:bg-dark-800/50 z-10 border-l border-gray-100 dark:border-dark-800 min-w-[120px]">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                    {totaux.taches_terminees}/{totaux.taches_total}
                                </span>
                                {completionPct !== null && (
                                    <span className={`text-[10px] font-bold ${
                                        completionPct === 100 ? 'text-emerald-500'
                                        : completionPct >= 50 ? 'text-amber-500'
                                        : 'text-red-500'
                                    }`}>{completionPct}%</span>
                                )}
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        completionPct === 100 ? 'bg-emerald-500'
                                        : completionPct >= 50 ? 'bg-amber-500'
                                        : 'bg-red-400'
                                    }`}
                                    style={{ width: `${completionPct ?? 0}%` }}
                                />
                            </div>
                        </div>
                        {(totaux.score > 0 || hasActivities) && (
                            <button
                                onClick={() => setExpanded(e => !e)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors shrink-0"
                                title="Détails"
                            >
                                {expanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                            </button>
                        )}
                    </div>
                </td>
            </tr>

            {/* Ligne détail expandable */}
            {expanded && (
                <tr className="bg-gray-50/50 dark:bg-dark-800/30">
                    <td colSpan={dates.length + 2} className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                            {totaux.score > 0 && (
                                <div className="flex items-center gap-1 font-bold text-orange-500">
                                    <Star className="h-3.5 w-3.5 fill-current" /> {totaux.score} pts
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-primary-500">
                                <ClipboardList className="h-3.5 w-3.5" />
                                <span className="font-medium">{totaux.jours_actifs} jour{totaux.jours_actifs > 1 ? 's' : ''} actif{totaux.jours_actifs > 1 ? 's' : ''}</span>
                            </div>
                            {totaux.jours_avec_bilan > 0 && (
                                <div className="flex items-center gap-1 text-emerald-500">
                                    <CheckSquare className="h-3.5 w-3.5" />
                                    <span className="font-medium">{totaux.jours_avec_bilan} bilan{totaux.jours_avec_bilan > 1 ? 's' : ''} soumis</span>
                                </div>
                            )}
                            {hasActivities && (
                                <div className="flex items-center gap-3 ml-2 border-l border-gray-200 dark:border-dark-700 pl-3">
                                    {activities.map(a => (
                                        <span key={a.key} className={`font-bold ${a.color}`}>
                                            {a.label} {totaux[a.key]}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const MODES = [
    { value: 'aujourd_hui', label: "Aujourd'hui" },
    { value: 'semaine',     label: 'Semaine' },
    { value: 'mois',        label: 'Mois' },
    { value: 'personnalise',label: 'Personnalisé' },
];

export default function DailyOverview({
    collaborateurs = [], dates = [], filters = {}, teamTotaux = {}, canSeeAll = false,
}) {
    const [dateDebut, setDateDebut] = useState(filters.date_debut_custom || filters.date_debut);
    const [dateFin, setDateFin]     = useState(filters.date_fin_custom   || filters.date_fin);

    const today = new Date().toISOString().split('T')[0];
    const teamPct = teamTotaux.taches_total > 0
        ? Math.round((teamTotaux.taches_terminees / teamTotaux.taches_total) * 100)
        : 0;

    const navigate = (params) => {
        router.get(route('daily.overview'), params, { preserveState: true, replace: true });
    };

    const changeMode = (mode) => {
        if (mode === 'personnalise') {
            navigate({ mode, date_debut: dateDebut, date_fin: dateFin });
        } else {
            navigate({ mode });
        }
    };

    const applyCustom = () => {
        if (dateDebut && dateFin) {
            navigate({ mode: 'personnalise', date_debut: dateDebut, date_fin: dateFin });
        }
    };

    // Header date range label
    const labelDebut = new Date(filters.date_debut + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const labelFin   = new Date(filters.date_fin   + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <AppLayout title="Vue d'ensemble — Daily">
            {/* ── Header ─────────────────────────────────────── */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link href={route('daily.index')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                        <ArrowLeft className="h-4 w-4 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vue d'ensemble</h1>
                        <p className="text-sm text-gray-400">
                            {labelDebut} → {labelFin} · {collaborateurs.length} collaborateur{collaborateurs.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Mode selector */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-800 rounded-xl p-1 self-start sm:self-auto">
                    {MODES.map(m => (
                        <button
                            key={m.value}
                            onClick={() => changeMode(m.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                filters.mode === m.value
                                    ? 'bg-white dark:bg-dark-900 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Custom date range ──────────────────────────── */}
            {filters.mode === 'personnalise' && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-5 flex items-center gap-3 p-3 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">Du</span>
                    <div className="w-40"><CustomDatePicker value={dateDebut} onChange={v => setDateDebut(v)} size="sm" /></div>
                    <span className="text-xs text-gray-500 font-medium">au</span>
                    <div className="w-40"><CustomDatePicker value={dateFin} onChange={v => setDateFin(v)} size="sm" /></div>
                    <Button size="sm" onClick={applyCustom} className="text-xs h-8">Appliquer</Button>
                </motion.div>
            )}

            {/* ── Team stats ─────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <MiniStat icon={CheckSquare} label="Tâches terminées" value={`${teamTotaux.taches_terminees ?? 0}/${teamTotaux.taches_total ?? 0}`} color="success" delay={0} />
                <MiniStat icon={TrendingUp}  label="Taux de complétion" value={`${teamPct}%`} color="primary" delay={1} />
                <MiniStat icon={Star}        label="Score total" value={teamTotaux.score ?? 0} color="orange" delay={2} />
                <MiniStat icon={Users}       label="Collabs actifs" value={canSeeAll ? `${teamTotaux.collabs_actifs ?? 0}/${collaborateurs.length}` : '—'} color="warning" delay={3} />
            </div>

            {/* ── Heatmap grid ───────────────────────────────── */}
            {collaborateurs.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-10 w-10 mx-auto mb-3 text-gray-200 dark:text-dark-700" />
                        <p className="text-sm text-gray-400">Aucun collaborateur trouvé</p>
                    </CardContent>
                </Card>
            ) : (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card>
                        <CardHeader className="pb-2 px-4 pt-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="h-4 w-4 text-primary-500" />
                                    Activité par jour
                                </CardTitle>
                                {/* Légende */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mr-1">Complétion</span>
                                    {[
                                        { bg: 'bg-gray-100 dark:bg-dark-800', label: '0 tâche' },
                                        { bg: 'bg-red-200',    label: '< 25%' },
                                        { bg: 'bg-amber-200',  label: '50%' },
                                        { bg: 'bg-emerald-200',label: '75%' },
                                        { bg: 'bg-emerald-500',label: '100%' },
                                    ].map(l => (
                                        <div key={l.label} className="flex items-center gap-1">
                                            <div className={`h-3 w-3 rounded ${l.bg}`} />
                                            <span className="text-[9px] text-gray-400">{l.label}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-1 ml-1">
                                        <div className="relative h-3 w-3">
                                            <div className="h-3 w-3 rounded bg-gray-100 dark:bg-dark-800" />
                                            <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-primary-500 rounded-full" />
                                        </div>
                                        <span className="text-[9px] text-gray-400">Bilan soumis</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-dark-800">
                                        <th className="px-4 py-2.5 sticky left-0 bg-white dark:bg-dark-900 z-10 border-r border-gray-100 dark:border-dark-800 min-w-[180px]">
                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Collaborateur</span>
                                        </th>
                                        {dates.map(date => {
                                            const isToday = date === today;
                                            const isWE = isWeekend(date);
                                            return (
                                                <th key={date} className={`px-1 py-2 text-center min-w-[44px] ${isWE ? 'opacity-50' : ''}`}>
                                                    <div className={`text-[10px] font-semibold leading-tight ${isToday ? 'text-primary-500' : 'text-gray-400'}`}>
                                                        <span className="hidden sm:block">{shortDay(date)}</span>
                                                        <span className="sm:hidden">{shortDayMobile(date)}</span>
                                                    </div>
                                                    {isToday && <div className="mx-auto mt-0.5 h-1 w-1 rounded-full bg-primary-500" />}
                                                </th>
                                            );
                                        })}
                                        <th className="px-4 py-2.5 sticky right-0 bg-white dark:bg-dark-900 z-10 border-l border-gray-100 dark:border-dark-800 min-w-[120px]">
                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-dark-800/50">
                                    {collaborateurs.map((collab, i) => (
                                        <CollabRow
                                            key={collab.id}
                                            collab={collab}
                                            dates={dates}
                                            index={i}
                                            today={today}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>
            )}
        </AppLayout>
    );
}
