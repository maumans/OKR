import SuperAdminLayout from './Layout';
import { Link } from '@inertiajs/react';
import { Building2, Users, TrendingUp, Package, ArrowUpRight, Eye } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

const PLAN_COLORS = { starter: '#64748b', pro: '#3b82f6', enterprise: '#6366f1' };

function KPICard({ icon: Icon, label, value, delta, color = 'indigo' }) {
    const colors = {
        indigo:  'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
        sky:     'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
        amber:   'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    };
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                {delta !== undefined && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${delta >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'}`}>
                        {delta >= 0 ? '+' : ''}{delta}
                    </span>
                )}
            </div>
            <div className="mt-4">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
            </div>
        </div>
    );
}

function StatusBadge({ statut }) {
    const styles = {
        actif:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        suspendu:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        annule:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    };
    const labels = { actif: 'Actif', suspendu: 'Suspendu', annule: 'Annulé' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[statut] || styles.actif}`}>
            {labels[statut] || statut}
        </span>
    );
}

export default function SuperAdminDashboard({ stats, dernieresSocietes, derniersLogs, topModules, croissance }) {
    const ACTION_ICONS = {
        'societe.creer': '🏢', 'societe.supprimer': '🗑️', 'societe.suspendre': '⏸️',
        'module.active': '✅', 'module.desactive': '❌',
        'impersonation.start': '👤', 'impersonation.stop': '👤',
        'user.promouvoir_superadmin': '⭐',
    };

    return (
        <SuperAdminLayout title="Tableau de bord">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard icon={Building2} label="Sociétés actives" value={stats.societes_actives} color="indigo" />
                <KPICard icon={Users} label="Utilisateurs totaux" value={stats.total_users} color="sky" />
                <KPICard icon={TrendingUp} label="Sociétés au total" value={stats.total_societes} color="emerald" />
                <KPICard icon={Package} label="Modules disponibles" value={stats.total_modules} color="amber" />
            </div>

            {/* Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Croissance */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Croissance sociétés (12 mois)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={croissance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Sociétés" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top modules */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Modules les plus adoptés</h3>
                    <div className="space-y-3">
                        {topModules.map((m, i) => (
                            <div key={m.code} className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-slate-400 w-4">{i + 1}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{m.nom}</span>
                                        <span className="text-[11px] text-slate-400">{m.societes_count} soc.</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${Math.min(100, (m.societes_count / (stats.total_societes || 1)) * 100)}%`, backgroundColor: m.couleur || '#6366f1' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {topModules.length === 0 && <p className="text-sm text-slate-400 italic">Aucune donnée</p>}
                    </div>
                </div>
            </div>

            {/* Listes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dernières sociétés */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dernières sociétés inscrites</h3>
                        <Link href={route('superadmin.societes.index')} className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                            Voir tout <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {dernieresSocietes.map(s => (
                            <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div>
                                    <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{s.nom}</p>
                                    <p className="text-[11px] text-slate-400">{new Date(s.created_at).toLocaleDateString('fr-FR')} · {s.collaborateurs_count} util.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge statut={s.statut || 'actif'} />
                                    <Link href={route('superadmin.societes.show', s.id)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors">
                                        <Eye className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {dernieresSocietes.length === 0 && (
                            <p className="px-5 py-4 text-sm text-slate-400 italic">Aucune société</p>
                        )}
                    </div>
                </div>

                {/* Activité récente */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Activité récente</h3>
                        <Link href={route('superadmin.audit-logs.index')} className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                            Voir tout <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[340px] overflow-y-auto">
                        {derniersLogs.map(log => (
                            <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                                <span className="text-base leading-none mt-0.5">{ACTION_ICONS[log.action] || '📋'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-snug">{log.description || log.action}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {log.user?.name || 'Système'} · {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {derniersLogs.length === 0 && (
                            <p className="px-5 py-4 text-sm text-slate-400 italic">Aucune activité</p>
                        )}
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
