import { Link } from '@inertiajs/react';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { UserAvatar } from '@/Components/ui/Avatar';
import { motion } from 'framer-motion';
import {
    Users, Target, CheckSquare, TrendingUp, Clock, Award,
    AlertCircle, AlertTriangle, ArrowRight, Flame, BarChart3, Building2, X, Package, CalendarClock,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useState } from 'react';
import { router } from '@inertiajs/react';

const prioriteColors = { basse: 'ghost', normale: 'default', haute: 'warning', urgente: 'destructive' };
const statutColors = { a_faire: 'outline', en_cours: 'default', termine: 'success', bloque: 'destructive' };
const statutLabels = { a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé', bloque: 'Bloqué' };

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
}

function getSeuilColor(val, seuils) {
    if (!seuils?.length) return null;
    const s = seuils.find(s => val >= Number(s.seuil_min) && val <= Number(s.seuil_max));
    return s?.couleur || null;
}

function MiniStat({ icon: Icon, label, value, subtitle, color = 'primary', delay = 0, href }) {
    const colorMap = {
        primary: { bg: 'bg-primary-500/10', text: 'text-primary-500', border: 'border-primary-500/20' },
        secondary: { bg: 'bg-secondary-500/10', text: 'text-secondary-500', border: 'border-secondary-500/20' },
        success: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
        warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
    };
    const c = colorMap[color] || colorMap.primary;

    const card = (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: delay * 0.08 }}
            className={`bg-white dark:bg-dark-800 rounded-xl border ${c.border} p-4 hover:shadow-md transition-all ${href ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                    {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
                <div className={`${c.bg} rounded-lg p-2`}>
                    <Icon className={`h-4.5 w-4.5 ${c.text}`} />
                </div>
            </div>
        </motion.div>
    );

    if (href) return <Link href={href} className="block">{card}</Link>;
    return card;
}

export default function Dashboard({
    stats, dernieresTaches = [], derniersObjectifs = [], noSociete,
    progressionParAxe = [], repartitionTaches = [], pipeline = [],
    tachesAlerte = [], topCollaborateurs = [], seuils = [], periodes = [], axes = [], filters = {}, collaborateurNom = '',
    livrables_urgents = [], tachesDailyRetard = []
}) {
    const [periodeFilter, setPeriodeFilter] = useState(filters?.periode_id || '');
    const [axeFilter, setAxeFilter] = useState(filters?.axe_objectif_id || '');

    const applyFilters = (key, value) => {
        const newFilters = { periode_id: periodeFilter, axe_objectif_id: axeFilter, [key]: value };
        Object.keys(newFilters).forEach(k => newFilters[k] === '' && delete newFilters[k]);
        router.get(route('dashboard'), newFilters, { preserveState: true, replace: true });
    };
    if (noSociete) {
        return (
            <AppLayout title="Tableau de bord">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Card className="max-w-md">
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-secondary-500" />
                            <h2 className="text-xl font-bold mb-2">Bienvenue sur Addvalis</h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                Vous n'êtes associé à aucune société. Contactez votre administrateur.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    const tauxCompletion = stats?.taches_total > 0 ? Math.round((stats.taches_terminees / stats.taches_total) * 100) : 0;
    const okrProgColor = getSeuilColor(stats?.progression_okr ?? 0, seuils) || '#3b82f6';

    return (
        <AppLayout title="Tableau de bord">
            {/* ═══ Header ═══════════════════════════════════════ */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {getGreeting()}, {collaborateurNom}
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Aperçu de la performance de votre entreprise
                    </p>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
                    <SearchableSelect value={periodeFilter} onChange={v => { setPeriodeFilter(v); applyFilters({ periode_id: v, axe_id: axeFilter }); }} options={periodes.map(p => ({ value: String(p.id), label: p.nom }))} nullable nullLabel="Toute période" placeholder="Toute période" />
                    <SearchableSelect value={axeFilter} onChange={v => { setAxeFilter(v); applyFilters({ periode_id: periodeFilter, axe_id: v }); }} options={axes.map(a => ({ value: String(a.id), label: a.nom }))} nullable nullLabel="Tous les axes" placeholder="Tous les axes" />
                    {(periodeFilter || axeFilter) && (
                        <button
                            onClick={() => { setPeriodeFilter(''); setAxeFilter(''); router.get(route('dashboard'), {}, { preserveState: true, replace: true }); }}
                            className="text-xs text-red-500 flex items-center gap-1 hover:text-red-600 px-2"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </motion.div>
            </div>

            {/* ═══ Alertes urgentes ═══════════════════════════════ */}
            {tachesAlerte.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Attention requise</h3>
                            <Badge variant="destructive" className="text-[10px]">{tachesAlerte.length}</Badge>
                        </div>
                        <div className="space-y-1.5">
                            {tachesAlerte.map(t => (
                                <Link key={t.id} href={t.objectif_id ? route('objectifs.show', t.objectif_id) + '#task-' + t.id : route('taches.index')} className="flex items-center justify-between text-xs rounded-lg px-1 py-0.5 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Flame className="h-3 w-3 text-red-400" />
                                        <span className="text-gray-800 dark:text-gray-200">{t.titre}</span>
                                        <span className="text-gray-400">— {t.collaborateur}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Badge variant={prioriteColors[t.priorite]} className="text-[9px] py-0">{t.priorite}</Badge>
                                        <Badge variant={statutColors[t.statut]} className="text-[9px] py-0">{statutLabels[t.statut]}</Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ═══ Livrables urgents ══════════════════════════════ */}
            {livrables_urgents.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-amber-500" />
                            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Livrables urgents</h3>
                            <Badge variant="warning" className="text-[10px]">{livrables_urgents.length}</Badge>
                        </div>
                        <div className="space-y-1.5">
                            {livrables_urgents.map(l => {
                                const isOverdue = l.jours_restants <= 0;
                                return (
                                    <Link key={l.id} href={route('missions.index') + '?open_mission=' + l.mission.id + '&livrable_id=' + l.id} className="flex items-center justify-between text-xs gap-2 rounded-lg px-1 py-0.5 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {isOverdue
                                                ? <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                                                : <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                                            }
                                            <span className="text-gray-800 dark:text-gray-200 font-medium truncate">{l.nom}</span>
                                            <span className="text-gray-400 shrink-0 hidden sm:inline">— {l.mission.titre}{l.mission.client ? ` · ${l.mission.client}` : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {l.responsable && <span className="text-gray-400 text-[10px] hidden md:inline">{l.responsable}</span>}
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                                isOverdue
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : l.jours_restants <= 3
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                                {isOverdue ? `${Math.abs(l.jours_restants)}j de retard` : `${l.jours_restants}j restant${l.jours_restants > 1 ? 's' : ''}`}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        <Link href={route('missions.index')} className="mt-3 flex items-center justify-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium">
                            Voir les missions <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* ═══ Tâches Daily en retard ════════════════════════ */}
            {tachesDailyRetard.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarClock className="h-4 w-4 text-orange-500" />
                            <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Tâches Daily en retard</h3>
                            <Badge variant="warning" className="text-[10px]">{tachesDailyRetard.length}</Badge>
                        </div>
                        <div className="space-y-1.5">
                            {tachesDailyRetard.map(t => (
                                <Link key={t.id} href={route('daily.index', { date: t.date }) + '#daily-tache-' + t.id} className="flex items-center justify-between text-xs rounded-lg px-1 py-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <CalendarClock className="h-3 w-3 text-orange-400" />
                                        <span className="text-gray-800 dark:text-gray-200">{t.titre}</span>
                                        <span className="text-gray-400">— {t.collaborateur}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                        <Badge variant={prioriteColors[t.priorite]} className="text-[9px] py-0">{t.priorite}</Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ═══ Stats cards ════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <MiniStat icon={Users} label="Collaborateurs" value={stats?.collaborateurs ?? 0} color="primary" delay={0} href={route('performance.index')} />
                <MiniStat icon={Target} label="Objectifs actifs" value={stats?.objectifs ?? 0} subtitle={`${stats?.objectifs_termines ?? 0} terminés / ${stats?.objectifs_total ?? 0}`} color="secondary" delay={1} href={route('objectifs.index')} />
                <MiniStat icon={CheckSquare} label="Tâches en cours" value={stats?.taches_en_cours ?? 0} subtitle={`${tauxCompletion}% complétées`} color="success" delay={2} href={route('taches.index')} />
                <MiniStat icon={Building2} label="Pipeline" value={stats?.prospects ?? 0} subtitle={`${stats?.prospects_gagnes ?? 0} gagnés`} color="warning" delay={3} href={route('prospects.index')} />
            </div>

            {/* ═══ Ligne 2 : OKR + Axe ═══════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Target className="h-4.5 w-4.5 text-primary-500" />Progression OKR
                                </CardTitle>
                                <span className="text-xl font-bold" style={{ color: okrProgColor }}>
                                    {stats?.progression_okr ?? 0}%
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-2.5 mb-5 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(stats?.progression_okr ?? 0, 100)}%`, backgroundColor: okrProgColor }} />
                            </div>
                            <div className="space-y-2">
                                {derniersObjectifs.map((obj, i) => (
                                    <Link key={obj.id} href={route('objectifs.show', obj.id)} className="block">
                                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.06 }}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-dark-700/50 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors cursor-pointer">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <div className="flex items-center gap-2">
                                                    {obj.axe_couleur && <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: obj.axe_couleur }} />}
                                                    <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{obj.titre}</p>
                                                </div>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{obj.collaborateur} · {obj.periode}</p>
                                            </div>
                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <div className="w-16 bg-gray-200 dark:bg-dark-600 rounded-full h-1.5 overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${Math.min(obj.progression, 100)}%`, backgroundColor: getSeuilColor(obj.progression, seuils) || '#3b82f6' }} />
                                                </div>
                                                <span className="text-[11px] font-bold w-8 text-right tabular-nums" style={{ color: getSeuilColor(obj.progression, seuils) || '#6b7280' }}>
                                                    {Math.round(obj.progression)}%
                                                </span>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                                {derniersObjectifs.length === 0 && (
                                    <div className="text-center py-6 text-gray-400">
                                        <Target className="h-7 w-7 mx-auto mb-2 opacity-40" />
                                        <p className="text-xs">Aucun objectif actif</p>
                                    </div>
                                )}
                            </div>
                            {derniersObjectifs.length > 0 && (
                                <Link href={route('objectifs.index')} className="mt-3 flex items-center justify-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium">
                                    Voir tous les objectifs <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="min-w-0">
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4.5 w-4.5 text-primary-500" />Par axe stratégique</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 h-64 overflow-hidden">
                            {progressionParAxe.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={progressionParAxe} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                        <XAxis dataKey="nom" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem', fontSize: '12px' }}
                                        />
                                        <Bar dataKey="progression" radius={[4, 4, 0, 0]} name="Progression (%)">
                                            {progressionParAxe.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.couleur || '#3b82f6'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                    <BarChart3 className="h-7 w-7 mx-auto mb-2 opacity-40" />
                                    <p className="text-xs">Aucun axe configuré</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ═══ Ligne 3 : Tâches + Pipeline + Top ═══════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="min-w-0">
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base"><CheckSquare className="h-4.5 w-4.5 text-emerald-500" />Tâches</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-40 mb-2 overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={repartitionTaches.filter(r => r.count > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="count"
                                            nameKey="statut"
                                            stroke="none"
                                        >
                                            {repartitionTaches.filter(r => r.count > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.couleur} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem', fontSize: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {repartitionTaches.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.couleur }} />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">{r.statut}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4.5 w-4.5 text-amber-500" />Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2.5">
                                {pipeline.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.couleur }} />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">{p.statut}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-14 bg-gray-100 dark:bg-dark-700 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${(p.count / Math.max(stats?.prospects || 1, 1)) * 100}%`, backgroundColor: p.couleur }} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-900 dark:text-white w-5 text-right">{p.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link href={route('prospects.index')} className="mt-3 flex items-center justify-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium">
                                Voir le pipeline <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4.5 w-4.5 text-secondary-500" />Top collaborateurs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topCollaborateurs.map((c, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                                        <UserAvatar name={c.nom} className="h-7 w-7 text-[10px]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{c.nom}</p>
                                            <p className="text-[10px] text-gray-400">{c.poste}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold text-emerald-500">{c.taches_terminees}</p>
                                            <p className="text-[9px] text-gray-400">/{c.taches_total}</p>
                                        </div>
                                    </div>
                                ))}
                                {topCollaborateurs.length === 0 && (
                                    <div className="text-center py-4 text-gray-400">
                                        <Users className="h-7 w-7 mx-auto mb-2 opacity-40" />
                                        <p className="text-xs">Aucun collaborateur</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ═══ Activité récente ════════════════════════════════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4.5 w-4.5 text-emerald-500" />Activité récente</CardTitle>
                            <Link href={route('taches.index')}>
                                <Button variant="ghost" size="sm" className="text-xs text-primary-500">Tout voir <ArrowRight className="h-3 w-3 ml-1" /></Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {dernieresTaches.map((tache, i) => (
                                <Link key={tache.id} href={route('taches.index')} className="block">
                                    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.04 }}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-dark-700/50 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors cursor-pointer">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{tache.titre}</p>
                                            <p className="text-[11px] text-gray-400">{tache.collaborateur}{tache.date && ` · ${tache.date}`}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Badge variant={prioriteColors[tache.priorite]} className="text-[9px] py-0">{tache.priorite}</Badge>
                                            <Badge variant={statutColors[tache.statut]} className="text-[9px] py-0">{statutLabels[tache.statut]}</Badge>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                            {dernieresTaches.length === 0 && (
                                <div className="text-center py-4 text-gray-400">
                                    <CheckSquare className="h-7 w-7 mx-auto mb-2 opacity-40" />
                                    <p className="text-xs">Aucune tâche récente</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AppLayout>
    );
}
