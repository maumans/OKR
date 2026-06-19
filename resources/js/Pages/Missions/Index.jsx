import { useState, useMemo, useEffect } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { NativeSelect as Select } from '@/Components/ui/Select';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { CustomSelect } from '@/Components/ui/CustomSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { NumberInput } from '@/Components/ui/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import {
    Briefcase, Plus, X, ChevronRight, AlertTriangle, Clock,
    CheckCircle2, Circle, Search, ExternalLink, RefreshCw,
    MessageCircle, Mail, Phone, Users2, FileText, Shield,
    Activity, Trash2, ArrowRight, Pencil, Star,
    FileCheck,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const MISSION_TYPES = [
    { value: 'audit',          label: 'Audit' },
    { value: 'automation',     label: 'Automation' },
    { value: 'transformation', label: 'Transformation' },
    { value: 'formation',      label: 'Formation' },
    { value: 'integration',    label: 'Intégration' },
    { value: 'conseil',        label: 'Conseil' },
    { value: 'deploiement',    label: 'Déploiement' },
];

const STATUTS = [
    { value: 'en_attente_dir', label: 'En attente DIR', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    { value: 'draft',          label: 'Brouillon',      color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    { value: 'active',         label: 'Actif',          color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    { value: 'on_hold',        label: 'En pause',       color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    { value: 'completed',      label: 'Clôturé',        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { value: 'archived',       label: 'Archivé',        color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
];

const LIVRABLE_STATUTS = [
    { value: 'draft',     label: 'Brouillon' },
    { value: 'review',    label: 'En revue' },
    { value: 'validated', label: 'Validé int.' },
    { value: 'sent',      label: 'Envoyé' },
    { value: 'feedback',  label: 'Feedback' },
    { value: 'approved',  label: 'Approuvé' },
    { value: 'archived',  label: 'Archivé' },
];

const CHANNELS = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, sla: '2h' },
    { value: 'email',    label: 'Email',    icon: Mail,          sla: '24h' },
    { value: 'call',     label: 'Appel',    icon: Phone,         sla: '4h' },
    { value: 'meeting',  label: 'Réunion',  icon: Users2,        sla: '24h' },
];

const PRESSURE_CONFIG = {
    pending:  { label: 'En attente', className: 'bg-amber-500 text-white',   dot: 'bg-amber-400' },
    critical: { label: 'Critique',   className: 'bg-red-500 text-white',     dot: 'bg-red-500' },
    warning:  { label: 'Alerte',     className: 'bg-orange-500 text-white',  dot: 'bg-orange-500' },
    watch:    { label: 'Veille',     className: 'bg-blue-500 text-white',    dot: 'bg-blue-500' },
    ok:       { label: 'OK',         className: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' },
    done:     { label: 'Terminé',    className: 'bg-gray-400 text-white',    dot: 'bg-gray-400' },
};

const SIDEBAR_VIEWS = [
    { key: 'tous',                label: 'Tous les projets',       icon: Briefcase,    accent: 'text-gray-500' },
    { key: 'en_attente_dir',      label: 'En attente DIR',         icon: AlertTriangle, accent: 'text-amber-500' },
    { key: 'active',              label: 'Projets actifs',         icon: Circle,       accent: 'text-emerald-500' },
    { key: 'livrables_confirmer', label: 'Livrables à confirmer',  icon: FileCheck,    accent: 'text-blue-500' },
    { key: 'clotures',            label: 'Projets clôturés',       icon: CheckCircle2, accent: 'text-gray-400' },
    { key: 'nps',                 label: 'NPS & Scores',           icon: Star,         accent: 'text-violet-500' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatut(value) { return STATUTS.find(s => s.value === value) || STATUTS[1]; }
function getLivrableStatut(value) { return LIVRABLE_STATUTS.find(s => s.value === value) || LIVRABLE_STATUTS[0]; }
function getMissionType(value) { return MISSION_TYPES.find(t => t.value === value)?.label || value; }

function StatutBadge({ statut }) {
    const s = getStatut(statut);
    return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MissionsIndex({ missions, collaborateurs, filters = {}, practices = [], typesLivrable = [] }) {
    const { auth, flash } = usePage().props;
    const devise = auth?.societe?.devise;

    const [activeView, setActiveView] = useState('tous');
    const [search, setSearch]         = useState(filters.search || '');
    const [selectedMission, setSelectedMission]     = useState(null);
    const [isCreateOpen, setIsCreateOpen]           = useState(false);
    const [highlightLivrableId, setHighlightLivrableId] = useState(null);
    const [lastSync] = useState(
        new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const openMissionId = params.get('open_mission');
        const livrableId    = params.get('livrable_id');
        if (openMissionId) {
            const m = missions.find(m => String(m.id) === openMissionId);
            if (m) {
                setSelectedMission(m);
                if (livrableId) setHighlightLivrableId(Number(livrableId));
            }
        }
    }, []);

    // ── Stats globales ──────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const enAttente  = missions.filter(m => m.statut === 'en_attente_dir').length;
        const actifs     = missions.filter(m => m.statut === 'active').length;
        const clotures   = missions.filter(m => ['completed', 'archived'].includes(m.statut)).length;
        const allLivs    = missions.flatMap(m => m.livrables);
        const livConf    = allLivs.filter(l => ['review', 'validated'].includes(l.statut)).length;
        const lvTotal    = allLivs.length;
        const lvApproved = allLivs.filter(l => l.statut === 'approved').length;
        const taux       = lvTotal > 0 ? Math.round((lvApproved / lvTotal) * 100) : 0;
        const npsScores  = missions.filter(m => m.nps_score != null).map(m => m.nps_score);
        const npsMoyen   = npsScores.length > 0
            ? (npsScores.reduce((s, n) => s + n, 0) / npsScores.length).toFixed(1)
            : null;
        return { total: missions.length, enAttente, actifs, clotures, livConf, taux, npsMoyen };
    }, [missions]);

    // ── Missions filtrées selon vue active ──────────────────────────────────────
    const filteredMissions = useMemo(() => {
        let ms = missions;
        if (search.trim()) {
            const q = search.toLowerCase();
            ms = ms.filter(m =>
                m.titre.toLowerCase().includes(q) || m.client.toLowerCase().includes(q)
            );
        }
        switch (activeView) {
            case 'en_attente_dir':      return ms.filter(m => m.statut === 'en_attente_dir');
            case 'active':              return ms.filter(m => m.statut === 'active');
            case 'livrables_confirmer': return ms.filter(m => m.livrables.some(l => ['review', 'validated'].includes(l.statut)));
            case 'clotures':            return ms.filter(m => ['completed', 'archived'].includes(m.statut));
            case 'nps':                 return ms.filter(m => ['active', 'completed', 'archived'].includes(m.statut));
            default:                    return ms;
        }
    }, [missions, activeView, search]);

    const displayedMission = selectedMission
        ? missions.find(m => m.id === selectedMission.id) || selectedMission
        : null;

    const handleValidateDir = (mission) => {
        if (!confirm(`Valider le démarrage du projet "${mission.titre}" ?`)) return;
        router.put(route('missions.validate_dir', mission.id), {}, { preserveState: true });
    };

    const handleUpdateNps = (missionId, score) => {
        router.put(route('missions.nps.update', missionId), { nps_score: score }, { preserveState: true });
    };

    const viewCounts = {
        tous:                stats.total,
        en_attente_dir:      stats.enAttente,
        active:              stats.actifs,
        livrables_confirmer: stats.livConf,
        clotures:            stats.clotures,
        nps:                 null,
    };

    return (
        <AppLayout title="Projets & Delivery">
            {/* ── Stats sur toute la largeur ─────────────────────────────── */}
            <div className="grid grid-cols-5 gap-3 mb-5">
                {[
                    { label: 'En attente DIR', value: stats.enAttente,  color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',   onClick: () => setActiveView('en_attente_dir') },
                    { label: 'Actifs',          value: stats.actifs,    color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', onClick: () => setActiveView('active') },
                    { label: 'Livrables à conf.', value: stats.livConf, color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',   onClick: () => setActiveView('livrables_confirmer') },
                    { label: 'Avancement',      value: `${stats.taux}%`, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20', onClick: null },
                    { label: 'NPS moyen',       value: stats.npsMoyen ? `${stats.npsMoyen}/10` : '—', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20', onClick: () => setActiveView('nps') },
                ].map((s, i) => (
                    <div key={i} onClick={s.onClick}
                        className={`rounded-xl border p-4 ${s.bg} ${s.onClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{s.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Layout principal avec sidebar module ───────────────────── */}
            <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 220px)' }}>

                {/* ── Sidebar module ───────────────────────────────────────── */}
                <aside className="w-52 shrink-0">
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden sticky top-4">
                        <div className="px-4 py-4 border-b border-gray-100 dark:border-dark-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-5">Module Projets</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">&amp; Delivery</p>
                        </div>
                        <nav className="p-2 space-y-1">
                            {SIDEBAR_VIEWS.map(view => {
                                const Icon    = view.icon;
                                const isActive = activeView === view.key;
                                const count   = viewCounts[view.key];
                                return (
                                    <button
                                        key={view.key}
                                        onClick={() => setActiveView(view.key)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left ${
                                            isActive
                                                ? 'bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white'
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800/50 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? view.accent : 'text-gray-400'}`} />
                                        <span className="flex-1">{view.label}</span>
                                        {count != null && count > 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                view.key === 'en_attente_dir'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                    : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'
                                            }`}>{count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* ── Contenu principal ─────────────────────────────────────── */}
                <div className="flex-1 flex gap-4 min-w-0 overflow-hidden">
                    <main className="flex-1 min-w-0 space-y-4">

                        {/* Flash */}
                        {flash?.success && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
                                {flash.success}
                            </motion.div>
                        )}

                        {/* Alertes bannières */}
                        {stats.enAttente > 0 && activeView !== 'en_attente_dir' && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
                                    <strong>{stats.enAttente}</strong> projet(s) en attente de validation DIR
                                </p>
                                <button onClick={() => setActiveView('en_attente_dir')}
                                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 px-2.5 py-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
                                    Voir
                                </button>
                            </div>
                        )}
                        {stats.livConf > 0 && activeView !== 'livrables_confirmer' && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                                <FileCheck className="h-4 w-4 text-blue-500 shrink-0" />
                                <p className="text-sm text-blue-800 dark:text-blue-300 flex-1">
                                    <strong>{stats.livConf}</strong> livrable(s) déclaré(s) à confirmer
                                </p>
                                <button onClick={() => setActiveView('livrables_confirmer')}
                                    className="text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/40 px-2.5 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                                    Voir
                                </button>
                            </div>
                        )}

                        {/* Barre d'actions */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Button onClick={() => setIsCreateOpen(true)}
                                className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 h-9 text-sm gap-2 px-4">
                                <Plus className="h-4 w-4" /> Nouveau projet
                            </Button>
                            <Button variant="outline" className="h-9 text-sm gap-2 px-4" onClick={() => router.reload()}>
                                <RefreshCw className="h-4 w-4" /> Recalculer
                            </Button>
                            <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <Input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Rechercher projet, client…" className="pl-9 h-9 text-sm" />
                            </div>
                            <span className="text-[11px] text-gray-400 ml-auto">Dernière sync : {lastSync}</span>
                        </div>

                        {/* Vue projets ou NPS */}
                        {activeView === 'nps' ? (
                            <NPSView missions={filteredMissions} onUpdateNps={handleUpdateNps} devise={devise} />
                        ) : (
                            <ProjectsList
                                missions={filteredMissions}
                                activeView={activeView}
                                selectedId={displayedMission?.id}
                                onSelect={setSelectedMission}
                                onValidateDir={handleValidateDir}
                                devise={devise}
                            />
                        )}
                    </main>

                    {/* ── Panneau détail (slide-over) ─────────────────────────── */}
                    <AnimatePresence>
                        {displayedMission && (
                            <MissionPanel
                                mission={displayedMission}
                                collaborateurs={collaborateurs}
                                devise={devise}
                                onClose={() => setSelectedMission(null)}
                                highlightLivrableId={highlightLivrableId}
                                practices={practices}
                                typesLivrable={typesLivrable}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Modal création ─────────────────────────────────────────────── */}
            <CreateProjectModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                collaborateurs={collaborateurs}
                practices={practices}
                devise={devise}
            />
        </AppLayout>
    );
}

// ─── Projects List ────────────────────────────────────────────────────────────

function ProjectsList({ missions, activeView, selectedId, onSelect, onValidateDir, devise }) {
    if (missions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Briefcase className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucun projet dans cette catégorie</p>
            </div>
        );
    }

    if (activeView === 'tous') {
        const groups = [
            { key: 'en_attente_dir', label: 'En attente de validation DIR', ms: missions.filter(m => m.statut === 'en_attente_dir') },
            { key: 'active',         label: 'Projets actifs',               ms: missions.filter(m => m.statut === 'active') },
            { key: 'on_hold',        label: 'En pause',                     ms: missions.filter(m => m.statut === 'on_hold') },
            { key: 'draft',          label: 'Brouillons',                   ms: missions.filter(m => m.statut === 'draft') },
            { key: 'clotures',       label: 'Clôturés / Archivés',         ms: missions.filter(m => ['completed', 'archived'].includes(m.statut)) },
        ].filter(g => g.ms.length > 0);

        return (
            <div className="space-y-5">
                {groups.map(group => (
                    <div key={group.key}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            {group.label} <span className="opacity-60">({group.ms.length})</span>
                        </p>
                        <div className="space-y-2">
                            {group.ms.map(m => (
                                <ProjectCard key={m.id} mission={m} isSelected={selectedId === m.id}
                                    onSelect={onSelect} onValidateDir={onValidateDir} devise={devise} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {missions.map(m => (
                <ProjectCard key={m.id} mission={m} isSelected={selectedId === m.id}
                    onSelect={onSelect} onValidateDir={onValidateDir} devise={devise} />
            ))}
        </div>
    );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ mission, isSelected, onSelect, onValidateDir, devise }) {
    const livrables  = mission.livrables || [];
    const total      = livrables.length;
    const approved   = livrables.filter(l => l.statut === 'approved').length;
    const progress   = total > 0 ? Math.round((approved / total) * 100) : 0;
    const pressure   = PRESSURE_CONFIG[mission.pressure] || PRESSURE_CONFIG.ok;
    const isEnAttente = mission.statut === 'en_attente_dir';

    const deleteMission = (e) => {
        e.stopPropagation();
        if (!confirm(`Supprimer "${mission.titre}" ?`)) return;
        router.delete(route('missions.destroy', mission.id));
    };

    return (
        <div
            onClick={() => onSelect(mission)}
            className={`group p-5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                    ? 'border-sky-300 dark:border-sky-600 bg-sky-50/50 dark:bg-sky-500/5'
                    : 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 hover:border-gray-300 dark:hover:border-dark-600 hover:shadow-sm'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${pressure.dot}`} title={pressure.label} />
                    <h3 className="font-bold text-gray-900 dark:text-white text-[13px] leading-tight truncate">{mission.titre}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {isEnAttente && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onValidateDir(mission); }}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        >
                            ✓ Valider DIR
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(mission); }}
                        title="Modifier"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 transition-all"
                    >
                        <Pencil className="h-3 w-3" />
                    </button>
                    <button
                        onClick={deleteMission}
                        title="Supprimer"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-4">
                {[
                    mission.client,
                    mission.responsable?.nom,
                    mission.montant > 0 && formatCurrency(mission.montant, devise),
                ].filter(Boolean).join(' · ')}
            </p>

            <div className="flex items-center gap-3 mt-3 ml-4">
                <div className="flex-1 bg-gray-100 dark:bg-dark-800 rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all ${
                            progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-700'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className={`text-[11px] font-bold w-7 text-right shrink-0 ${
                    progress === 100 ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'
                }`}>{progress}%</span>
                <span className="text-[11px] text-gray-400 shrink-0">
                    {approved}/{total} livrable{total !== 1 ? 's' : ''}
                </span>
                {mission.nps_score != null && (
                    <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                        NPS {mission.nps_score}/10
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── NPS View ─────────────────────────────────────────────────────────────────

function NPSView({ missions, onUpdateNps }) {
    const withScores = missions.filter(m => m.nps_score != null);
    const npsMoyen   = withScores.length > 0
        ? (withScores.reduce((s, m) => s + m.nps_score, 0) / withScores.length).toFixed(1)
        : null;

    return (
        <div>
            {npsMoyen && (
                <div className="mb-5 p-5 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-200 dark:border-violet-500/20 flex items-center gap-6">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">NPS Moyen</p>
                        <p className="text-4xl font-bold text-violet-700 dark:text-violet-300 mt-1">
                            {npsMoyen}<span className="text-lg font-normal text-violet-400">/10</span>
                        </p>
                    </div>
                    <div className="text-sm text-violet-600 dark:text-violet-400">
                        {withScores.length}/{missions.length} projet{missions.length !== 1 ? 's' : ''} évalué{missions.length !== 1 ? 's' : ''}
                    </div>
                </div>
            )}
            <div className="space-y-3">
                {missions.map(mission => (
                    <div key={mission.id} className="p-4 bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700">
                        {/* Titre + client */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                                <p className="font-semibold text-[13px] text-gray-900 dark:text-white truncate">{mission.titre}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {mission.client}{mission.email_nps_client && ` · ${mission.email_nps_client}`}
                                </p>
                            </div>
                            {mission.nps_score != null && (
                                <span className={`text-sm font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                                    mission.nps_score >= 9 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                    mission.nps_score >= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                }`}>{mission.nps_score}/10</span>
                            )}
                        </div>
                        {/* Boutons NPS */}
                        <div className="flex items-center gap-1 flex-wrap">
                            {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
                                <button key={i} onClick={() => onUpdateNps(mission.id, i)}
                                    className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-colors ${
                                        mission.nps_score === i
                                            ? i >= 9 ? 'bg-emerald-500 text-white'
                                              : i >= 7 ? 'bg-amber-400 text-white'
                                              : 'bg-red-400 text-white'
                                            : 'bg-gray-100 dark:bg-dark-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-700'
                                    }`}
                                >{i}</button>
                            ))}
                            <span className="text-[10px] text-gray-400 ml-1">
                                {[0,4].includes(0) ? '' : ''}
                                <span className="text-red-400">0–6</span> Détracteur ·{' '}
                                <span className="text-amber-400">7–8</span> Neutre ·{' '}
                                <span className="text-emerald-500">9–10</span> Promoteur
                            </span>
                        </div>
                    </div>
                ))}
                {missions.length === 0 && (
                    <p className="text-center text-gray-400 italic py-12">Aucun projet actif ou clôturé.</p>
                )}
            </div>
        </div>
    );
}

// ─── Side Panel ────────────────────────────────────────────────────────────────

function MissionPanel({ mission, collaborateurs, devise, onClose, highlightLivrableId, practices = [], typesLivrable = [] }) {
    const [activeTab, setActiveTab] = useState('livrables');
    const cfg = PRESSURE_CONFIG[mission.pressure] || PRESSURE_CONFIG.ok;

    return (
        <motion.div
            key="panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full xl:w-[460px] shrink-0 bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 shadow-lg overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-dark-800">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300">
                                {getMissionType(mission.type)}
                            </span>
                            <StatutBadge statut={mission.statut} />
                            {mission.dir_validated && (
                                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> DIR ✓
                                </span>
                            )}
                        </div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{mission.titre}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{mission.client}</p>
                        {mission.montant > 0 && (
                            <p className="text-sm font-semibold text-emerald-600 mt-0.5">{formatCurrency(mission.montant, devise)}</p>
                        )}
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors shrink-0">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {mission.responsable && (
                        <span className="flex items-center gap-1"><Users2 className="h-3.5 w-3.5" /> {mission.responsable.nom}</span>
                    )}
                    {mission.deadline && (
                        <span className={`flex items-center gap-1 ${mission.pressure === 'critical' ? 'text-red-500 font-semibold' : ''}`}>
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(mission.deadline).toLocaleDateString('fr-FR')}
                        </span>
                    )}
                    {mission.last_channel && <ChannelBadge channel={mission.last_channel} lastContact={mission.last_contact_at} />}
                </div>

                {mission.next_action && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <ChevronRight className="h-3.5 w-3.5" /> Prochaine action
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">{mission.next_action}</p>
                        {mission.next_action_date && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                {new Date(mission.next_action_date).toLocaleDateString('fr-FR')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-dark-800">
                {[
                    { value: 'livrables', label: 'Livrables', icon: FileText,  count: mission.livrables.length },
                    { value: 'infos',     label: 'Infos',     icon: Activity,  count: null },
                    { value: 'log',       label: 'Journal',   icon: Shield,    count: mission.logs.length },
                ].map(tab => (
                    <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                            activeTab === tab.value
                                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                        {tab.count != null && tab.count > 0 && (
                            <span className="bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-bold px-1.5 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'livrables' && (
                    <div className="p-4"><LivrablesTab mission={mission} collaborateurs={collaborateurs} highlightLivrableId={highlightLivrableId} typesLivrable={typesLivrable} /></div>
                )}
                {activeTab === 'infos' && (
                    <div className="p-4"><InfosTab mission={mission} collaborateurs={collaborateurs} devise={devise} practices={practices} /></div>
                )}
                {activeTab === 'log' && (
                    <div className="p-4"><LogTab mission={mission} /></div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Channel Badge ─────────────────────────────────────────────────────────────

function ChannelBadge({ channel, lastContact }) {
    const ch = CHANNELS.find(c => c.value === channel);
    if (!ch) return null;
    const Icon = ch.icon;
    return (
        <span className="flex items-center gap-1">
            <Icon className="h-3.5 w-3.5" /> {ch.label}
            {lastContact && <span className="opacity-60">· {lastContact}</span>}
        </span>
    );
}

// ─── Livrables Tab ─────────────────────────────────────────────────────────────

const LIVRABLE_COLORS = {
    draft:     'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    review:    'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    validated: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
    sent:      'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
    feedback:  'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    approved:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    archived:  'bg-gray-100 text-gray-400 dark:bg-gray-900 dark:text-gray-500',
};

function EditLivrableForm({ livrable, missionId, collaborateurs, typesLivrable = [], onCancel }) {
    const [form, setForm] = useState({
        nom:                 livrable.nom         || '',
        type_livrable:       livrable.type_livrable || '',
        statut:              livrable.statut       || 'draft',
        responsable_id:      String(livrable.responsable_id || ''),
        deadline_envoi:      livrable.deadline_envoi      || '',
        deadline_validation: livrable.deadline_validation || '',
        url:                 livrable.url          || '',
        dir_validated:       livrable.dir_validated || false,
        ar_count:            livrable.ar_count      ?? 0,
        poids:               livrable.poids         ?? 1,
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors]         = useState({});

    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.put(
            route('missions.livrables.update', [missionId, livrable.id]),
            form,
            {
                preserveState:  true,
                preserveScroll: true,
                onSuccess: () => { setProcessing(false); onCancel(); },
                onError:   (errs) => { setProcessing(false); setErrors(errs); },
                onFinish:  () => setProcessing(false),
            }
        );
    };

    const statutsLivOptions = LIVRABLE_STATUTS.map(s => ({ value: s.value, label: s.label }));
    const collabOptions     = collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }));

    return (
        <form onSubmit={submit} className="p-3 rounded-lg border border-sky-200 dark:border-sky-600 bg-sky-50/50 dark:bg-sky-500/5 space-y-2">
            {Object.keys(errors).length > 0 && (
                <div className="p-2 rounded bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                    {Object.values(errors).map((err, i) => (
                        <p key={i} className="text-[11px] text-red-600 dark:text-red-400">{err}</p>
                    ))}
                </div>
            )}
            <div>
                <Label className="text-[10px]">Nom *</Label>
                <Input value={form.nom} onChange={e => set('nom', e.target.value)} className="h-8 text-sm mt-0.5" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px]">Type</Label>
                    <SearchableSelect
                        value={form.type_livrable || ''}
                        onChange={v => set('type_livrable', v)}
                        options={(typesLivrable || []).map(t => ({ value: t.nom, label: t.nom }))}
                        nullable nullLabel="— Aucun —"
                        placeholder="Sélectionner…"
                        size="sm"
                        className="mt-0.5"
                    />
                </div>
                <div>
                    <Label className="text-[10px]">Statut</Label>
                    <CustomSelect
                        value={form.statut}
                        onChange={val => set('statut', val)}
                        options={statutsLivOptions}
                        size="sm"
                        className="mt-0.5"
                    />
                </div>
            </div>
            <div>
                <Label className="text-[10px]">Responsable</Label>
                <SearchableSelect
                    value={form.responsable_id}
                    onChange={val => set('responsable_id', val)}
                    options={collabOptions}
                    placeholder="— Aucun —"
                    nullable
                    nullLabel="— Aucun —"
                    size="sm"
                    className="mt-0.5"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px]">Deadline envoi</Label>
                    <Input type="date" value={form.deadline_envoi} onChange={e => set('deadline_envoi', e.target.value)} className="h-8 text-sm mt-0.5" />
                </div>
                <div>
                    <Label className="text-[10px]">Deadline validation</Label>
                    <Input type="date" value={form.deadline_validation} onChange={e => set('deadline_validation', e.target.value)} className="h-8 text-sm mt-0.5" />
                </div>
            </div>
            <div>
                <Label className="text-[10px]">Lien / URL</Label>
                <Input value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://…" className="h-8 text-sm mt-0.5" />
            </div>
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.dir_validated}
                        onChange={e => set('dir_validated', e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-emerald-500" />
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">DIR validé</span>
                </label>
                <div className="flex items-center gap-1.5">
                    <Label className="text-[10px]">AR</Label>
                    <input type="number" min="0" value={form.ar_count}
                        onChange={e => set('ar_count', parseInt(e.target.value) || 0)}
                        className="h-7 w-14 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm px-2 text-center focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="flex items-center gap-1.5">
                    <Label className="text-[10px]" title="Poids pour le calcul OKR pondéré">Poids</Label>
                    <input type="number" min="0.01" step="0.01" value={form.poids}
                        onChange={e => set('poids', parseFloat(e.target.value) || 1)}
                        className="h-7 w-16 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm px-2 text-center focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" className="h-7 text-xs bg-sky-500 hover:bg-sky-600" disabled={processing}>
                    {processing ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Annuler</Button>
            </div>
        </form>
    );
}

function LivrablesTab({ mission, collaborateurs, highlightLivrableId, typesLivrable = [] }) {
    const [addOpen, setAddOpen]     = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (!highlightLivrableId) return;
        const el = document.getElementById('livrable-' + highlightLivrableId);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }, [highlightLivrableId]);
    const { data, setData, post, processing, reset, errors } = useForm({
        nom: '', type_livrable: '', responsable_id: '', deadline_envoi: '', deadline_validation: '', url: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('missions.livrables.store', mission.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => { setAddOpen(false); reset(); },
        });
    };

    const advance = (livrable) => {
        router.put(route('missions.livrables.advance', [mission.id, livrable.id]), {}, { preserveState: true });
    };

    const destroy = (livrable) => {
        if (!confirm(`Supprimer "${livrable.nom}" ?`)) return;
        router.delete(route('missions.livrables.destroy', [mission.id, livrable.id]), { preserveState: true });
    };

    return (
        <div className="space-y-3">
            {mission.livrables.map(livrable => (
                <div key={livrable.id}>
                    {editingId === livrable.id ? (
                        <EditLivrableForm
                            livrable={livrable}
                            missionId={mission.id}
                            collaborateurs={collaborateurs}
                            typesLivrable={typesLivrable}
                            onCancel={() => setEditingId(null)}
                        />

                    ) : (
                <div id={"livrable-" + livrable.id} className={`p-3 rounded-lg border bg-gray-50 dark:bg-dark-950 group transition-colors ${highlightLivrableId === livrable.id ? 'border-amber-400 ring-2 ring-amber-300/50 dark:border-amber-500' : 'border-gray-100 dark:border-dark-800'}`}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-gray-900 dark:text-white">{livrable.nom}</span>
                                <span className="text-[10px] text-gray-400">{livrable.version}</span>
                                {livrable.type_livrable && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-dark-700 text-gray-500">{livrable.type_livrable}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LIVRABLE_COLORS[livrable.statut] || LIVRABLE_COLORS.draft}`}>
                                    {getLivrableStatut(livrable.statut).label}
                                </span>
                                {livrable.dir_validated && (
                                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                                        <CheckCircle2 className="h-3 w-3" /> DIR ✓
                                    </span>
                                )}
                                {livrable.ar_count > 0 && (
                                    <span className="text-[10px] text-amber-500 font-medium">{livrable.ar_count} AR</span>
                                )}
                                {livrable.deadline_envoi && (
                                    <span className="text-[10px] text-gray-400">
                                        Envoi: {new Date(livrable.deadline_envoi).toLocaleDateString('fr-FR')}
                                    </span>
                                )}
                                {livrable.url && (
                                    <a href={livrable.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                        className="text-[10px] text-sky-500 hover:underline flex items-center gap-0.5">
                                        <ExternalLink className="h-3 w-3" /> Lien
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(livrable.id); setAddOpen(false); }}
                                title="Modifier ce livrable"
                                className="p-1 rounded text-gray-400 hover:text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {livrable.statut !== 'archived' && (
                                <button onClick={() => advance(livrable)} title="Avancer le statut"
                                    className="p-1 rounded text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors">
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <button onClick={() => destroy(livrable)}
                                className="p-1 rounded text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
                    )}
                </div>
            ))}

            {mission.livrables.length === 0 && !addOpen && (
                <p className="text-sm text-gray-400 text-center py-4 italic">Aucun livrable défini.</p>
            )}

            {addOpen ? (
                <form onSubmit={submit} className="p-3 border border-dashed border-sky-300 dark:border-sky-600 rounded-lg space-y-2 bg-sky-50/50 dark:bg-sky-500/5">
                    <div>
                        <Input placeholder="Nom du livrable *" value={data.nom} onChange={e => setData('nom', e.target.value)} className="h-8 text-sm" />
                        {errors.nom && <p className="text-[10px] text-red-500 mt-0.5">{errors.nom}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <SearchableSelect
                            value={data.type_livrable || ''}
                            onChange={v => setData('type_livrable', v)}
                            options={(typesLivrable || []).map(t => ({ value: t.nom, label: t.nom }))}
                            nullable nullLabel="— Aucun —"
                            placeholder="Type de livrable…"
                            size="sm"
                        />
                        <SearchableSelect
                            value={String(data.responsable_id || '')}
                            onChange={val => setData('responsable_id', val)}
                            options={collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }))}
                            placeholder="Responsable"
                            nullable
                            nullLabel="— Aucun —"
                            size="sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-[10px]">Deadline envoi</Label>
                            <Input type="date" value={data.deadline_envoi} onChange={e => setData('deadline_envoi', e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                            <Label className="text-[10px]">Deadline validation</Label>
                            <Input type="date" value={data.deadline_validation} onChange={e => setData('deadline_validation', e.target.value)} className="h-8 text-sm" />
                        </div>
                    </div>
                    <div>
                        <Input placeholder="Lien vers le livrable (ex: https://…)" value={data.url} onChange={e => setData('url', e.target.value)} className="h-8 text-sm" />
                        {errors.url && <p className="text-[10px] text-red-500 mt-0.5">{errors.url}</p>}
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button type="submit" size="sm" className="h-7 text-xs bg-sky-500 hover:bg-sky-600" disabled={processing}>
                            {processing ? 'Ajout…' : 'Ajouter'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddOpen(false); reset(); }}>Annuler</Button>
                    </div>
                </form>
            ) : (
                <button onClick={() => setAddOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-sky-500 hover:text-sky-600 border border-dashed border-sky-300 dark:border-sky-600 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-500/5 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Ajouter un livrable
                </button>
            )}
        </div>
    );
}

// ─── Infos Tab ─────────────────────────────────────────────────────────────────

function InfosTab({ mission, collaborateurs, devise, practices = [] }) {
    const { data, setData, put, processing } = useForm({
        client:           mission.client,
        titre:            mission.titre,
        type:             mission.type,
        practice:         mission.practice || '',
        statut:           mission.statut,
        responsable_id:   mission.responsable_id || '',
        deadline:         mission.deadline || '',
        montant:          mission.montant || '',
        email_nps_client: mission.email_nps_client || '',
        next_action:      mission.next_action || '',
        next_action_date: mission.next_action_date || '',
        last_channel:     mission.last_channel || '',
        note:             mission.note || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('missions.update', mission.id));
    };

    const deleteMission = () => {
        if (!confirm(`Supprimer "${mission.client} — ${mission.titre}" ?`)) return;
        router.delete(route('missions.destroy', mission.id));
    };

    const collaborateursOptions = collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }));
    const statutsOptions   = STATUTS.map(s => ({ value: s.value, label: s.label }));
    const typesOptions     = MISSION_TYPES.map(t => ({ value: t.value, label: t.label }));
    const channelsOptions  = CHANNELS.map(c => ({ value: c.value, label: `${c.label} (SLA ${c.sla})` }));

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Nom du projet *</Label>
                    <Input value={data.titre} onChange={e => setData('titre', e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Client *</Label>
                    <Input value={data.client} onChange={e => setData('client', e.target.value)} className="h-8 text-sm mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Statut</Label>
                    <CustomSelect
                        value={data.statut}
                        onChange={val => setData('statut', val)}
                        options={statutsOptions}
                        placeholder="Statut"
                        size="sm"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Type</Label>
                    <CustomSelect
                        value={data.type}
                        onChange={val => setData('type', val)}
                        options={typesOptions}
                        placeholder="Type"
                        size="sm"
                        className="mt-1"
                    />
                </div>
            </div>
            <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-400">Pratique</Label>
                <SearchableSelect
                    value={data.practice || ''}
                    onChange={val => setData('practice', val)}
                    options={(practices || []).map(p => ({ value: p.nom, label: p.nom }))}
                    nullable
                    nullLabel="— Aucune —"
                    placeholder="— Choisir une pratique —"
                    size="sm"
                    className="mt-1"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Manager responsable</Label>
                    <SearchableSelect
                        value={String(data.responsable_id || '')}
                        onChange={val => setData('responsable_id', val)}
                        options={collaborateursOptions}
                        placeholder="— Choisir —"
                        nullable
                        nullLabel="— Aucun —"
                        size="sm"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Date fin contractuelle</Label>
                    <Input type="date" value={data.deadline} onChange={e => setData('deadline', e.target.value)} className="h-8 text-sm mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Montant ({devise?.code || 'GNF'})</Label>
                    <NumberInput value={data.montant} onChange={v => setData('montant', v)} suffix={devise?.code || 'GNF'} className="mt-1" />
                </div>
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Email NPS client</Label>
                    <Input type="email" value={data.email_nps_client} onChange={e => setData('email_nps_client', e.target.value)} placeholder="client@entreprise.com" className="h-8 text-sm mt-1" />
                </div>
            </div>

            <div className="pt-1 border-t border-gray-100 dark:border-dark-800">
                <Label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Contact SLA</Label>
                <CustomSelect
                    value={data.last_channel}
                    onChange={val => setData('last_channel', val)}
                    options={channelsOptions}
                    placeholder="Canal —"
                    nullable
                    nullLabel="Canal —"
                    size="sm"
                />
            </div>

            <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-400">Prochaine action</Label>
                <Input value={data.next_action} onChange={e => setData('next_action', e.target.value)} placeholder="Ex: Envoyer rapport v2" className="h-8 text-sm mt-1" />
            </div>
            <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-400">Date prochaine action</Label>
                <Input type="date" value={data.next_action_date} onChange={e => setData('next_action_date', e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-400">Description</Label>
                <textarea value={data.note} onChange={e => setData('note', e.target.value)} rows={3}
                    className="w-full mt-1 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white resize-none"
                    placeholder="Notes libres sur le projet…" />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-dark-800">
                <Button type="submit" size="sm" className="bg-sky-500 hover:bg-sky-600 text-white" disabled={processing}>Enregistrer</Button>
                <Button type="button" size="sm" variant="ghost" onClick={deleteMission}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 ml-auto">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}

// ─── Log Tab ───────────────────────────────────────────────────────────────────

function LogTab({ mission }) {
    const { data, setData, post, processing, reset } = useForm({ type: 'note', content: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('missions.logs.store', mission.id), { onSuccess: () => reset('content') });
    };

    const logTypeColors = {
        action: 'text-sky-500', note: 'text-gray-400', status: 'text-violet-500', livrable: 'text-emerald-500',
    };
    const logTypeLabels = { action: 'Action', note: 'Note', status: 'Statut', livrable: 'Livrable' };

    return (
        <div className="space-y-3">
            <form onSubmit={submit} className="space-y-2">
                <div className="flex gap-2">
                    <CustomSelect
                        value={data.type}
                        onChange={val => setData('type', val)}
                        options={[
                            { value: 'note',     label: 'Note' },
                            { value: 'action',   label: 'Action' },
                            { value: 'status',   label: 'Statut' },
                            { value: 'livrable', label: 'Livrable' },
                        ]}
                        size="sm"
                        className="w-28 shrink-0"
                    />
                    <Input value={data.content} onChange={e => setData('content', e.target.value)}
                        placeholder="Ajouter une entrée au journal…" className="h-8 text-sm flex-1" />
                    <Button type="submit" size="sm" className="h-8 bg-sky-500 hover:bg-sky-600 shrink-0" disabled={processing || !data.content.trim()}>
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </form>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {mission.logs.map(log => (
                    <div key={log.id} className="flex gap-2 text-xs">
                        <span className={`font-semibold shrink-0 ${logTypeColors[log.type] || 'text-gray-400'}`}>
                            [{logTypeLabels[log.type] || log.type}]
                        </span>
                        <div className="flex-1">
                            <p className="text-gray-700 dark:text-gray-300">{log.content}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{log.created_at}{log.auteur ? ` · ${log.auteur}` : ''}</p>
                        </div>
                    </div>
                ))}
                {mission.logs.length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-4 italic">Aucune entrée dans le journal.</p>
                )}
            </div>
        </div>
    );
}

// ─── Create Project Modal ──────────────────────────────────────────────────────

function CreateProjectModal({ open, onClose, collaborateurs, devise, practices = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        titre:            '',
        client:           '',
        type:             'integration',
        practice:         '',
        responsable_id:   '',
        deadline:         '',
        montant:          '',
        email_nps_client: '',
        note:             '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('missions.store'), { onSuccess: () => { onClose(); reset(); } });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-sky-500" /> Nouveau projet
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 mt-2">
                    <div>
                        <Label>NOM DU PROJET *</Label>
                        <Input value={data.titre} onChange={e => setData('titre', e.target.value)}
                            placeholder="Ex: Intégration SI — AGL Groupe" className="mt-1" />
                        {errors.titre && <p className="text-xs text-red-500 mt-0.5">{errors.titre}</p>}
                    </div>
                    <div>
                        <Label>CLIENT *</Label>
                        <Input value={data.client} onChange={e => setData('client', e.target.value)}
                            placeholder="Nom de l'entreprise cliente" className="mt-1" />
                        {errors.client && <p className="text-xs text-red-500 mt-0.5">{errors.client}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>MANAGER RESPONSABLE</Label>
                            <SearchableSelect
                                value={String(data.responsable_id || '')}
                                onChange={val => setData('responsable_id', val)}
                                options={collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }))}
                                placeholder="— Choisir —"
                                nullable
                                nullLabel="— Choisir —"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>TYPE DE PROJET</Label>
                            <CustomSelect
                                value={data.type}
                                onChange={val => setData('type', val)}
                                options={MISSION_TYPES.map(t => ({ value: t.value, label: t.label }))}
                                placeholder="Type"
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <div>
                        <Label>PRATIQUE</Label>
                        <SearchableSelect
                            value={data.practice || ''}
                            onChange={val => setData('practice', val)}
                            options={(practices || []).map(p => ({ value: p.nom, label: p.nom }))}
                            nullable
                            nullLabel="— Aucune —"
                            placeholder="— Choisir une pratique —"
                            className="mt-1"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label>DATE FIN CONTRACTUELLE</Label>
                            <Input type="date" value={data.deadline} onChange={e => setData('deadline', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>MONTANT ({devise?.code || 'GNF'})</Label>
                            <NumberInput value={data.montant} onChange={v => setData('montant', v)} suffix={devise?.code || 'GNF'} className="mt-1" />
                        </div>
                        <div>
                            <Label>EMAIL NPS CLIENT</Label>
                            <Input type="email" value={data.email_nps_client} onChange={e => setData('email_nps_client', e.target.value)}
                                placeholder="client@entreprise.com" className="mt-1" />
                        </div>
                    </div>
                    <div>
                        <Label>DESCRIPTION</Label>
                        <textarea value={data.note} onChange={e => setData('note', e.target.value)} rows={3}
                            placeholder="Contexte, objectifs, périmètre…"
                            className="w-full mt-1 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white resize-none" />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                            Ce projet sera soumis à la validation DIR avant démarrage.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 text-white" disabled={processing}>
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
