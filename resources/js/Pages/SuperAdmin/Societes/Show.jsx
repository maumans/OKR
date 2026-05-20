import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import {
    Building2, Users, Package, ArrowLeft, PauseCircle, PlayCircle,
    Pencil, LogIn, CreditCard, Clock, CheckCircle2, XCircle, AlertCircle,
    Shield, Mail, Calendar,
    LayoutDashboard, Target, User, ListChecks, CalendarCheck, Grid3x3,
    TrendingUp, Briefcase, Gift, GraduationCap, BarChart3, Settings, Upload,
} from 'lucide-react';

const LUCIDE_ICONS = {
    LayoutDashboard, Target, User, ListChecks, CalendarCheck,
    Grid3x3, TrendingUp, Briefcase, Gift, GraduationCap,
    BarChart3, Users, Settings, Upload, Package,
};

const ACTION_ICONS = {
    'societe.creer': '🏢', 'societe.supprimer': '🗑️', 'societe.suspendre': '⏸️', 'societe.reactiver': '▶️',
    'module.active': '✅', 'module.desactive': '❌',
    'impersonation.start': '👤', 'impersonation.stop': '👤',
    'user.promouvoir_superadmin': '⭐',
};

const STATUS_STYLES = {
    actif:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    suspendu:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    annule:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};
const STATUS_LABELS = { actif: 'Actif', suspendu: 'Suspendu', annule: 'Annulé' };

const PLAN_LABELS = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
const PLAN_COLORS = {
    starter:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    pro:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    enterprise: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

function ModuleToggleCard({ module, actif, societeId }) {
    const [loading, setLoading] = useState(false);
    const toggle = () => {
        if (module.est_core) return;
        setLoading(true);
        router.post(route('superadmin.societes.modules.toggle', [societeId, module.code]), {}, {
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${actif ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
            <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded flex items-center justify-center" style={{ backgroundColor: (module.couleur || '#6366f1') + '20', color: module.couleur || '#6366f1' }}>
                    {(() => { const Icon = LUCIDE_ICONS[module.icone] || Package; return <Icon className="h-3.5 w-3.5" />; })()}
                </div>
                <div>
                    <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{module.nom}</p>
                    {module.est_core && <span className="text-[10px] text-slate-400">Core — toujours actif</span>}
                </div>
            </div>
            <button
                onClick={toggle}
                disabled={module.est_core || loading}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${actif ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transform transition-transform ${actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
        </div>
    );
}

export default function SocieteShow({ societe, modules, administrateurs }) {
    const abonnementActif = societe.abonnements?.find(a => a.statut === 'actif');
    const modulesActifsSet = new Set((societe.modules || []).filter(m => m.pivot?.actif).map(m => m.id));

    const handleImpersonate = (adminId) => {
        router.post(route('superadmin.impersonation.start', adminId));
    };

    const handleSuspendre = () => {
        if (!confirm(`Suspendre « ${societe.nom} » ?`)) return;
        router.post(route('superadmin.societes.suspendre', societe.id), {}, { preserveScroll: true });
    };
    const handleReactiver = () => {
        router.post(route('superadmin.societes.reactiver', societe.id), {}, { preserveScroll: true });
    };

    return (
        <SuperAdminLayout
            title={societe.nom}
            breadcrumb={[
                { label: 'Sociétés', href: route('superadmin.societes.index') },
                { label: societe.nom },
            ]}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Link href={route('superadmin.societes.index')} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: societe.couleur_primaire || '#6366f1' }}
                    >
                        {societe.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{societe.nom}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[societe.statut] || STATUS_STYLES.actif}`}>
                                {STATUS_LABELS[societe.statut] || 'Actif'}
                            </span>
                            {abonnementActif && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${PLAN_COLORS[abonnementActif.plan]}`}>
                                    {PLAN_LABELS[abonnementActif.plan]}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('superadmin.societes.edit', societe.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Pencil className="h-3.5 w-3.5" /> Modifier
                    </Link>
                    {societe.statut === 'actif' ? (
                        <button onClick={handleSuspendre} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                            <PauseCircle className="h-3.5 w-3.5" /> Suspendre
                        </button>
                    ) : (
                        <button onClick={handleReactiver} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                            <PlayCircle className="h-3.5 w-3.5" /> Réactiver
                        </button>
                    )}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Users, label: 'Collaborateurs', value: societe.collaborateurs_count ?? 0, color: 'sky' },
                    { icon: Package, label: 'Modules actifs', value: (societe.modules || []).filter(m => m.pivot?.actif).length, color: 'indigo' },
                    { icon: CreditCard, label: 'Plan', value: abonnementActif ? PLAN_LABELS[abonnementActif.plan] : '—', color: 'emerald' },
                    { icon: Calendar, label: 'Inscrit le', value: new Date(societe.created_at).toLocaleDateString('fr-FR'), color: 'amber' },
                ].map(({ icon: Icon, label, value, color }) => {
                    const cls = { sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400', indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' }[color];
                    return (
                        <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                            <div className={`inline-flex p-2 rounded-lg ${cls} mb-2`}><Icon className="h-4 w-4" /></div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{value}</div>
                            <div className="text-[12px] text-slate-400 mt-0.5">{label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Colonne principale */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Modules */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modules</h3>
                            <span className="text-[11px] text-slate-400">{(societe.modules || []).filter(m => m.pivot?.actif).length} / {modules.length} actifs</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {modules.map(m => (
                                <ModuleToggleCard
                                    key={m.id}
                                    module={m}
                                    actif={modulesActifsSet.has(m.id)}
                                    societeId={societe.id}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Administrateurs */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Administrateurs</h3>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {administrateurs?.length === 0 && (
                                <p className="px-5 py-4 text-sm text-slate-400 italic">Aucun administrateur</p>
                            )}
                            {administrateurs?.map(a => (
                                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                                            {(a.nom || a.prenom || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">
                                                {a.prenom} {a.nom}
                                            </p>
                                            <p className="text-[11px] text-slate-400">{a.user?.email || '—'}</p>
                                        </div>
                                    </div>
                                    {a.user && (
                                        <button
                                            onClick={() => handleImpersonate(a.user.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                                        >
                                            <LogIn className="h-3.5 w-3.5" /> Impersonner
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activité récente */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Activité récente</h3>
                            <Link href={`${route('superadmin.audit-logs.index')}?societe_id=${societe.id}`} className="text-[12px] text-indigo-500 hover:text-indigo-600">
                                Voir tout
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
                            {(societe.auditLogs || []).length === 0 && (
                                <p className="px-5 py-4 text-sm text-slate-400 italic">Aucune activité</p>
                            )}
                            {(societe.auditLogs || []).map(log => (
                                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                                    <span className="text-base leading-none mt-0.5">{ACTION_ICONS[log.action] || '📋'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] text-slate-700 dark:text-slate-300">{log.description || log.action}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {log.user?.name || 'Système'} · {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Colonne latérale */}
                <div className="space-y-5">
                    {/* Infos société */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Informations</h3>
                        <dl className="space-y-3 text-[13px]">
                            {[
                                { label: 'Email', value: societe.email || '—', icon: Mail },
                                { label: 'Layout', value: societe.layout_mode === 'topbar' ? 'Topbar' : 'Sidebar', icon: Building2 },
                                { label: 'Devise', value: societe.devise?.code || '—', icon: CreditCard },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex items-start gap-2">
                                    <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <dt className="text-slate-400">{label}</dt>
                                        <dd className="font-medium text-slate-700 dark:text-slate-300">{value}</dd>
                                    </div>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* Abonnement actif */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Abonnement</h3>
                        {abonnementActif ? (
                            <div className="space-y-2 text-[13px]">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Plan</span>
                                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${PLAN_COLORS[abonnementActif.plan]}`}>
                                        {PLAN_LABELS[abonnementActif.plan]}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Prix mensuel</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {abonnementActif.prix_mensuel} {abonnementActif.devise?.symbole || '€'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Utilisateurs</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {societe.collaborateurs_count} / {abonnementActif.limite_utilisateurs}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Depuis</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {new Date(abonnementActif.date_debut).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[13px] text-slate-400 italic">Aucun abonnement actif</p>
                        )}
                    </div>

                    {/* Couleur primaire */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Marque blanche</h3>
                        <div className="flex items-center gap-3">
                            <div
                                className="h-10 w-10 rounded-lg border-2 border-white shadow"
                                style={{ backgroundColor: societe.couleur_primaire || '#3b82f6' }}
                            />
                            <div>
                                <p className="text-[12px] text-slate-400">Couleur primaire</p>
                                <p className="text-[13px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                                    {societe.couleur_primaire || '#3b82f6'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
