import { RefreshCw } from 'lucide-react';

const SOURCES = [
    { value: '',                  label: '— Manuel (pas de sync auto) —' },
    { value: 'crm_activites',     label: 'CRM — Activités commerciales' },
    { value: 'crm_deals',         label: 'CRM — Deals gagnés (montant)' },
    { value: 'crm_pipeline',      label: 'CRM — Pipeline (valeur)' },
    { value: 'missions_nps',      label: 'Missions — Score NPS' },
    { value: 'missions_livrables',label: 'Missions — Livrables approuvés' },
];

// Types alignés avec le backend : in:contact_initie,demo_realisee,proposition_envoyee,relance_effectuee,negociation_engagee,deal_signe,deal_perdu
const TYPES_ACTIVITE = [
    { value: '', label: 'Tous les types' },
    { value: 'contact_initie',       label: 'Contact initié' },
    { value: 'demo_realisee',        label: 'Démo réalisée' },
    { value: 'proposition_envoyee',  label: 'Proposition envoyée' },
    { value: 'relance_effectuee',    label: 'Relance effectuée' },
    { value: 'negociation_engagee',  label: 'Négociation engagée' },
    { value: 'deal_signe',           label: 'Deal signé' },
    { value: 'deal_perdu',           label: 'Deal perdu' },
];

const TYPES_DEAL = [
    { value: '', label: 'Tous les types' },
    { value: 'nouveau_client',  label: 'Nouveau client' },
    { value: 'upsell',          label: 'Upsell' },
    { value: 'renouvellement',  label: 'Renouvellement' },
];

const SOURCE_BADGE = {
    crm_activites:      { label: 'Activités CRM',  bg: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400' },
    crm_deals:          { label: 'Deals CRM',      bg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    crm_pipeline:       { label: 'Pipeline CRM',   bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400' },
    missions_nps:       { label: 'NPS',            bg: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
    missions_livrables: { label: 'Livrables',      bg: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
};

/**
 * Badge inline affiché sur les cartes KR.
 */
export function SourceAutoBadge({ kr }) {
    if (kr.source_auto && SOURCE_BADGE[kr.source_auto]) {
        const { label, bg } = SOURCE_BADGE[kr.source_auto];
        return (
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${bg}`}>
                {label}
            </span>
        );
    }
    if (kr.source_crm) {
        return (
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">
                CRM
            </span>
        );
    }
    return null;
}

/**
 * Bouton de synchronisation manuelle d'un KR.
 */
export function SyncKrButton({ kr, canSync, router }) {
    const hasSource = kr.source_auto || kr.source_crm;
    if (!canSync || !hasSource) return null;

    const handleSync = (e) => {
        e.stopPropagation();
        router.post(route('objectifs.kr.sync', kr.id), {}, { preserveScroll: true });
    };

    return (
        <button
            onClick={handleSync}
            className="shrink-0 p-1 rounded hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
            title="Recalculer depuis la source automatique"
        >
            <RefreshCw className="h-3 w-3 text-teal-500" />
        </button>
    );
}

const selectCls = "mt-1 w-full px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500";

/**
 * Panneau de configuration de la source automatique d'un KR.
 * Props:
 *   sourceAuto  : null | string
 *   filtre      : object | null
 *   onChange    : (sourceAuto, filtre) => void
 */
export default function SourceAutoConfig({ sourceAuto, filtre, onChange }) {
    const currentSource = sourceAuto || '';
    const currentFiltre = filtre || {};

    const setSource = (val) => {
        onChange(val || null, {});
    };

    const setFiltre = (key, val) => {
        const next = { ...currentFiltre, [key]: val };
        // Nettoyer les clés vides/undefined
        Object.keys(next).forEach(k => {
            if (next[k] === '' || next[k] === undefined || next[k] === null) delete next[k];
        });
        onChange(currentSource || null, Object.keys(next).length ? next : null);
    };

    return (
        <div className="space-y-2 rounded-lg border border-gray-100 dark:border-dark-700 p-3 bg-gray-50/50 dark:bg-dark-800/30">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Source automatique
            </label>
            <select value={currentSource} onChange={e => setSource(e.target.value)} className={selectCls}>
                {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                ))}
            </select>

            {/* ── CRM Activités ── */}
            {currentSource === 'crm_activites' && (
                <div className="space-y-2 pl-2 border-l-2 border-teal-200 dark:border-teal-700">
                    <div>
                        <label className="text-[10px] text-gray-400">Mesure</label>
                        <select
                            value={currentFiltre.agregat || 'count'}
                            onChange={e => setFiltre('agregat', e.target.value === 'count' ? '' : e.target.value)}
                            className={selectCls}
                        >
                            <option value="count">Compter les activités (nb)</option>
                            <option value="sum">Sommer les montants (GNF)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400">Type d'activité</label>
                        <select
                            value={currentFiltre.type_activite || ''}
                            onChange={e => setFiltre('type_activite', e.target.value)}
                            className={selectCls}
                        >
                            {TYPES_ACTIVITE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400">Cycle</label>
                        <select
                            value={currentFiltre.cycle || 'courant'}
                            onChange={e => setFiltre('cycle', e.target.value === 'courant' ? '' : e.target.value)}
                            className={selectCls}
                        >
                            <option value="courant">Trimestre courant</option>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                                <option key={q} value={`${q} ${new Date().getFullYear()}`}>{q} {new Date().getFullYear()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* ── CRM Deals ── */}
            {currentSource === 'crm_deals' && (
                <div className="space-y-2 pl-2 border-l-2 border-blue-200 dark:border-blue-700">
                    <div>
                        <label className="text-[10px] text-gray-400">Type de deal</label>
                        <select
                            value={currentFiltre.type_deal || ''}
                            onChange={e => setFiltre('type_deal', e.target.value)}
                            className={selectCls}
                        >
                            {TYPES_DEAL.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* ── CRM Pipeline ── */}
            {currentSource === 'crm_pipeline' && (
                <div className="space-y-2 pl-2 border-l-2 border-cyan-200 dark:border-cyan-700">
                    <div>
                        <label className="text-[10px] text-gray-400">Type de deal</label>
                        <select
                            value={currentFiltre.type_deal || ''}
                            onChange={e => setFiltre('type_deal', e.target.value)}
                            className={selectCls}
                        >
                            {TYPES_DEAL.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <label className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={currentFiltre.ponderer !== false}
                            onChange={e => setFiltre('ponderer', e.target.checked ? undefined : false)}
                            className="rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                        />
                        Pondérer par probabilité de closing
                    </label>
                </div>
            )}

            {/* ── Missions NPS ── */}
            {currentSource === 'missions_nps' && (
                <div className="space-y-2 pl-2 border-l-2 border-purple-200 dark:border-purple-700">
                    <div>
                        <label className="text-[10px] text-gray-400">Fenêtre temporelle (mois)</label>
                        <input
                            type="number"
                            min="1"
                            max="24"
                            placeholder="Toute la période"
                            value={currentFiltre.periode_mois || ''}
                            onChange={e => setFiltre('periode_mois', e.target.value ? Number(e.target.value) : '')}
                            className={selectCls}
                        />
                    </div>
                </div>
            )}

            {/* ── Missions Livrables ── */}
            {currentSource === 'missions_livrables' && (
                <div className="space-y-2 pl-2 border-l-2 border-orange-200 dark:border-orange-700">
                    <div>
                        <label className="text-[10px] text-gray-400">Statut cible</label>
                        <select
                            value={currentFiltre.statut_cible || 'approved'}
                            onChange={e => setFiltre('statut_cible', e.target.value === 'approved' ? '' : e.target.value)}
                            className={selectCls}
                        >
                            <option value="approved">Approuvé</option>
                            <option value="archived">Archivé</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
