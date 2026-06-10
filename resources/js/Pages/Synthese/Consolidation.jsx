import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { formatNumber } from '@/lib/utils';
import {
    TrendingUp, Briefcase, Trophy, Users, BarChart3,
    ChevronRight, CheckCircle2, AlertTriangle,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitiales(prenom, nom) {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
}

function avatarBg(score) {
    if (score === null || score === undefined) return 'bg-gray-400';
    if (score >= 4) return 'bg-emerald-500';
    if (score >= 3) return 'bg-blue-500';
    if (score >= 2) return 'bg-amber-500';
    return 'bg-red-500';
}

function okrProgressColor(p) {
    if (p === null || p === undefined) return 'text-gray-400';
    if (p >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (p >= 60) return 'text-blue-600 dark:text-blue-400';
    if (p >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

function perfScoreColor(score) {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 4) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 3) return 'text-blue-600 dark:text-blue-400';
    if (score >= 2) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

function appreciationColor(appr) {
    if (!appr) return null;
    if (appr.includes('Très'))     return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
    if (appr.includes('Au-dessus'))return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    if (appr.includes('niveau'))   return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
    if (appr.includes('cours'))    return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
}

function formatMontant(val) {
    if (!val && val !== 0) return '—';
    return new Intl.NumberFormat('fr-FR').format(Math.round(val)) + ' GNF';
}

// ─── Barre de progression ──────────────────────────────────────────────────────

function BarreProgression({ valeur, max = 100, couleur = 'bg-primary-500' }) {
    const pct = max > 0 ? Math.min(100, (valeur / max) * 100) : 0;
    return (
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${couleur}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

// ─── Ligne collaborateur ──────────────────────────────────────────────────────

function LigneCollab({ d, onVoirFiche }) {
    const c = d.collaborateur;
    const perf = d.performance;
    const okr = d.okr;
    const crm = d.crm;

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors border-b border-gray-100 dark:border-dark-800">
            {/* Collaborateur */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${avatarBg(perf?.score_global)}`}>
                        {getInitiales(c.prenom, c.nom)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                            {c.prenom} {c.nom}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{c.practice || c.poste}</p>
                    </div>
                </div>
            </td>

            {/* CRM — CA Signé */}
            <td className="px-4 py-3">
                <div className="space-y-1">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                        {formatMontant(crm.ca_signe)}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <BarreProgression valeur={crm.ca_signe} max={Math.max(crm.ca_signe + crm.pipeline, 1)} couleur="bg-emerald-500" />
                        <span className="text-[10px] text-gray-400 shrink-0">{crm.deals_gagnes} deal{crm.deals_gagnes > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </td>

            {/* CRM — Pipeline */}
            <td className="px-4 py-3">
                <p className="text-[13px] text-blue-600 dark:text-blue-400 font-semibold">
                    {formatMontant(crm.pipeline)}
                </p>
                <p className="text-[11px] text-gray-400">{crm.deals_actifs} actif{crm.deals_actifs > 1 ? 's' : ''}</p>
            </td>

            {/* OKR — Progression */}
            <td className="px-4 py-3">
                {okr.progression_moy !== null ? (
                    <div className="space-y-1">
                        <p className={`text-[14px] font-bold ${okrProgressColor(okr.progression_moy)}`}>
                            {formatNumber(okr.progression_moy, 1)}%
                        </p>
                        <div className="flex items-center gap-1.5">
                            <BarreProgression valeur={okr.progression_moy} couleur={
                                okr.progression_moy >= 80 ? 'bg-emerald-500' :
                                okr.progression_moy >= 60 ? 'bg-blue-500' :
                                okr.progression_moy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            } />
                            <span className="text-[10px] text-gray-400 shrink-0">{okr.nb_objectifs} obj.</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-[11px] text-gray-400">Aucun OKR</span>
                )}
            </td>

            {/* Performance — Score */}
            <td className="px-4 py-3">
                {perf ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-[16px] font-black ${perfScoreColor(perf.score_global)}`}>
                                {perf.score_global !== null ? `${formatNumber(perf.score_global, 1)}/5` : '—'}
                            </span>
                            {perf.verrouille && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        </div>
                        {perf.appreciation && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${appreciationColor(perf.appreciation)}`}>
                                {perf.appreciation}
                            </span>
                        )}
                        {!perf.appreciation && (
                            <span className="text-[11px] text-gray-400">Cycle : {perf.cycle}</span>
                        )}
                    </div>
                ) : (
                    <span className="text-[11px] text-gray-400 italic">Pas de fiche</span>
                )}
            </td>

            {/* Prime estimée */}
            <td className="px-4 py-3">
                {perf?.final_done && perf.final_prime !== null ? (
                    <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMontant(perf.final_prime)}
                    </p>
                ) : perf?.score_global ? (
                    <p className="text-[12px] text-gray-400 italic">
                        ~{formatMontant(Math.round(3000000 * (perf.score_global / 5) * 0.75 / 50000) * 50000)}
                    </p>
                ) : (
                    <span className="text-[11px] text-gray-400">—</span>
                )}
            </td>

            {/* Action */}
            <td className="px-4 py-3 text-right">
                {perf && (
                    <Button size="sm" variant="outline" className="text-[11px] px-2.5"
                        onClick={() => onVoirFiche(perf.id)}>
                        Voir fiche <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                )}
            </td>
        </tr>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Consolidation({ donnees }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');

    const filtrees = donnees.filter(d => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return `${d.collaborateur.prenom} ${d.collaborateur.nom}`.toLowerCase().includes(q);
    });

    // KPIs globaux
    const totalCa     = donnees.reduce((s, d) => s + (d.crm.ca_signe || 0), 0);
    const totalPipeline = donnees.reduce((s, d) => s + (d.crm.pipeline || 0), 0);
    const avgOkr      = (() => {
        const avec = donnees.filter(d => d.okr.progression_moy !== null);
        return avec.length > 0 ? Math.round(avec.reduce((s, d) => s + d.okr.progression_moy, 0) / avec.length) : null;
    })();
    const avgPerf     = (() => {
        const avec = donnees.filter(d => d.performance?.score_global !== null && d.performance?.score_global !== undefined);
        return avec.length > 0 ? (avec.reduce((s, d) => s + d.performance.score_global, 0) / avec.length).toFixed(1) : null;
    })();

    const handleVoirFiche = (ficheId) => {
        router.visit(route('performance.index'), {
            data: { open_fiche: ficheId },
            preserveState: false,
        });
    };

    return (
        <AppLayout title="Consolidation">
            {/* ── Header ───────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 shrink-0">
                        <BarChart3 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Consolidation</h1>
                        <p className="text-[12px] text-gray-400 mt-0.5 hidden sm:block">
                            Vue unifiée CRM · OKR · Performance par collaborateur
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('synthese.index'))}>
                        Synthèse mensuelle
                    </Button>
                </div>
            </div>

            {/* ── KPIs globaux ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
                {[
                    { label: 'CA total signé', value: formatMontant(totalCa), icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
                    { label: 'Pipeline total', value: formatMontant(totalPipeline), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
                    { label: 'Progression OKR moy.', value: avgOkr !== null ? `${avgOkr}%` : '—', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
                    { label: 'Score Perf. moyen', value: avgPerf !== null ? `${avgPerf}/5` : '—', icon: Trophy, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20' },
                ].map((k, i) => {
                    const Icon = k.icon;
                    return (
                        <div key={i} className={`rounded-xl border px-4 py-3 ${k.bg}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`h-4 w-4 ${k.color}`} />
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{k.label}</p>
                            </div>
                            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* ── Tableau ───────────────────────────────────────────── */}
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                {/* Barre de recherche */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-800 flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Filtrer par collaborateur…"
                        className="flex-1 text-[13px] bg-transparent border-0 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                    />
                    <span className="text-[11px] text-gray-400">{filtrees.length} collaborateur{filtrees.length > 1 ? 's' : ''}</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-dark-800">
                                <th className="px-4 py-2.5 text-left">Collaborateur</th>
                                <th className="px-4 py-2.5 text-left">
                                    <div className="flex items-center gap-1.5"><Briefcase className="h-3 w-3 text-emerald-500" />CA Signé</div>
                                </th>
                                <th className="px-4 py-2.5 text-left">
                                    <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-blue-500" />Pipeline</div>
                                </th>
                                <th className="px-4 py-2.5 text-left">
                                    <div className="flex items-center gap-1.5"><BarChart3 className="h-3 w-3 text-amber-500" />OKR</div>
                                </th>
                                <th className="px-4 py-2.5 text-left">
                                    <div className="flex items-center gap-1.5"><Trophy className="h-3 w-3 text-violet-500" />Performance</div>
                                </th>
                                <th className="px-4 py-2.5 text-left">Prime</th>
                                <th className="px-4 py-2.5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                                        Aucun collaborateur trouvé
                                    </td>
                                </tr>
                            ) : filtrees.map((d, i) => (
                                <LigneCollab key={d.collaborateur.id} d={d} onVoirFiche={handleVoirFiche} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Légende ───────────────────────────────────────────── */}
            <div className="mt-4 flex items-center gap-4 flex-wrap">
                <p className="text-[11px] text-gray-400">
                    <strong className="text-gray-500">CRM</strong> — montants des deals gagnés et pipeline pondéré ·
                    <strong className="text-gray-500 ml-1">OKR</strong> — progression moyenne des objectifs actifs ·
                    <strong className="text-gray-500 ml-1">Perf.</strong> — score global /5 de la dernière fiche ·
                    <strong className="text-gray-500 ml-1">Prime</strong> — figée si éval. finale clôturée, estimée sinon
                </p>
            </div>
        </AppLayout>
    );
}
