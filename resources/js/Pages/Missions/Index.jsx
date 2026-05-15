import { useState } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { NativeSelect as Select } from '@/Components/ui/Select';
import { Badge } from '@/Components/ui/Badge';
import { Card, CardContent } from '@/Components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/Tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/Components/ui/Table';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Plus, X, ChevronRight, AlertTriangle, Clock,
    CheckCircle2, Archive, Pause, Play, Search, ExternalLink,
    MessageCircle, Mail, Phone, Users2, FileText, Shield,
    Activity, Trash2, ArrowRight, Eye, Pencil,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MISSION_TYPES = [
    { value: 'audit', label: 'Audit' },
    { value: 'automation', label: 'Automation' },
    { value: 'transformation', label: 'Transformation' },
    { value: 'formation', label: 'Formation' },
    { value: 'integration', label: 'Intégration' },
];

const STATUTS = [
    { value: 'draft', label: 'Brouillon', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    { value: 'active', label: 'Active', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    { value: 'on_hold', label: 'En pause', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    { value: 'completed', label: 'Terminée', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { value: 'archived', label: 'Archivée', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
];

const LIVRABLE_STATUTS = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'review', label: 'En revue' },
    { value: 'validated', label: 'Validé int.' },
    { value: 'sent', label: 'Envoyé' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'approved', label: 'Approuvé' },
    { value: 'archived', label: 'Archivé' },
];

const CHANNELS = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, sla: '2h' },
    { value: 'email', label: 'Email', icon: Mail, sla: '24h' },
    { value: 'call', label: 'Appel', icon: Phone, sla: '4h' },
    { value: 'meeting', label: 'Réunion', icon: Users2, sla: '24h' },
];

const PRESSURE_CONFIG = {
    critical: { label: 'Critique', className: 'bg-red-500 text-white', dot: 'bg-red-500' },
    warning:  { label: 'Alerte',   className: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
    watch:    { label: 'Veille',   className: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
    ok:       { label: 'OK',       className: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' },
    done:     { label: 'Terminé',  className: 'bg-gray-400 text-white', dot: 'bg-gray-400' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getStatut(value) {
    return STATUTS.find(s => s.value === value) || STATUTS[0];
}

function getLivrableStatut(value) {
    return LIVRABLE_STATUTS.find(s => s.value === value) || LIVRABLE_STATUTS[0];
}

function getMissionType(value) {
    return MISSION_TYPES.find(t => t.value === value)?.label || value;
}

function PressureDot({ level }) {
    const cfg = PRESSURE_CONFIG[level] || PRESSURE_CONFIG.ok;
    return <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} title={cfg.label} />;
}

function StatutBadge({ statut }) {
    const s = getStatut(statut);
    return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MissionsIndex({ missions, collaborateurs, filters = {} }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [filterStatut, setFilterStatut] = useState(filters.statut || '');
    const [filterType, setFilterType] = useState(filters.type || '');
    const [selectedMission, setSelectedMission] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const applyFilters = (overrides = {}) => {
        router.get(route('missions.index'), {
            search,
            statut: filterStatut,
            type: filterType,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const clearFilters = () => {
        setSearch('');
        setFilterStatut('');
        setFilterType('');
        router.get(route('missions.index'), {}, { preserveState: true, replace: true });
    };

    const deleteMission = (e, mission) => {
        e.stopPropagation();
        if (!confirm(`Supprimer la mission "${mission.client} — ${mission.titre}" ?`)) return;
        router.delete(route('missions.destroy', mission.id));
    };

    // Keep selected mission in sync with updated data from server
    const displayedMission = selectedMission
        ? missions.find(m => m.id === selectedMission.id) || selectedMission
        : null;

    const pressureCounts = missions.reduce((acc, m) => {
        acc[m.pressure] = (acc[m.pressure] || 0) + 1;
        return acc;
    }, {});

    return (
        <AppLayout title="Missions & Delivery">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
                    >
                        <Briefcase className="h-6 w-6 text-sky-500" /> War Room — Missions
                    </motion.h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Suivi delivery client · Livrables · SLA · Pression
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Nouvelle Mission
                </Button>
            </div>

            {flash?.success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm"
                >
                    {flash.success}
                </motion.div>
            )}

            {/* Pressure summary */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                {Object.entries(PRESSURE_CONFIG).map(([key, cfg]) => (
                    pressureCounts[key] ? (
                        <div key={key} className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.className}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                            {cfg.label} ({pressureCounts[key]})
                        </div>
                    ) : null
                ))}
                <span className="text-xs text-gray-400 ml-auto">{missions.length} mission{missions.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Filters */}
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher mission, client…"
                        className="pl-8 h-8 text-sm"
                    />
                </div>
                <Select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); applyFilters({ statut: e.target.value }); }} className="h-8 text-sm w-36">
                    <option value="">Tous statuts</option>
                    {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
                <Select value={filterType} onChange={e => { setFilterType(e.target.value); applyFilters({ type: e.target.value }); }} className="h-8 text-sm w-40">
                    <option value="">Tous types</option>
                    {MISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
                {(search || filterStatut || filterType) && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-gray-500">
                        <X className="h-3.5 w-3.5 mr-1" /> Effacer
                    </Button>
                )}
            </form>

            {/* Table + Side Panel layout */}
            <div className="flex gap-4 items-start">
                {/* Table */}
                <div className={`flex-1 min-w-0 transition-all ${displayedMission ? 'hidden xl:block' : ''}`}>
                    <Card className="bg-white dark:bg-dark-900">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-8"></TableHead>
                                        <TableHead>Client / Mission</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Responsable</TableHead>
                                        <TableHead>Deadline</TableHead>
                                        <TableHead>Livrables</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="w-20 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {missions.map((mission) => (
                                        <TableRow
                                            key={mission.id}
                                            className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-dark-800 ${
                                                displayedMission?.id === mission.id ? 'bg-sky-50 dark:bg-sky-500/10' : ''
                                            }`}
                                            onClick={() => setSelectedMission(mission)}
                                        >
                                            <TableCell>
                                                <PressureDot level={mission.pressure} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{mission.client}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{mission.titre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300">
                                                    {getMissionType(mission.type)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                                                {mission.responsable?.nom || <span className="text-gray-400 italic">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                {mission.deadline ? (
                                                    <span className={`text-xs font-medium ${
                                                        mission.pressure === 'critical' ? 'text-red-500' :
                                                        mission.pressure === 'warning' ? 'text-amber-500' : 'text-gray-500'
                                                    }`}>
                                                        {new Date(mission.deadline).toLocaleDateString('fr-FR')}
                                                    </span>
                                                ) : <span className="text-gray-400 text-xs">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        {mission.livrables.filter(l => l.statut === 'approved').length}/{mission.livrables.length}
                                                    </span>
                                                    {mission.livrables.length > 0 && (
                                                        <div className="flex gap-0.5 ml-1">
                                                            {mission.livrables.slice(0, 5).map(l => (
                                                                <span
                                                                    key={l.id}
                                                                    className={`w-2 h-2 rounded-full ${
                                                                        l.statut === 'approved' ? 'bg-emerald-500' :
                                                                        l.statut === 'sent' || l.statut === 'feedback' ? 'bg-blue-400' :
                                                                        l.statut === 'validated' ? 'bg-violet-400' :
                                                                        'bg-gray-300 dark:bg-gray-600'
                                                                    }`}
                                                                    title={getLivrableStatut(l.statut).label}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatutBadge statut={mission.statut} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedMission(mission); }}
                                                        title="Ouvrir le panneau"
                                                        className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => deleteMission(e, mission)}
                                                        title="Supprimer la mission"
                                                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {missions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-gray-400">
                                                Aucune mission. Créez votre première mission client.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Side Panel */}
                <AnimatePresence>
                    {displayedMission && (
                        <MissionPanel
                            mission={displayedMission}
                            collaborateurs={collaborateurs}
                            onClose={() => setSelectedMission(null)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Create Modal */}
            <CreateMissionModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                collaborateurs={collaborateurs}
            />
        </AppLayout>
    );
}

// ─── Side Panel ────────────────────────────────────────────────────────────────

function MissionPanel({ mission, collaborateurs, onClose }) {
    const [activeTab, setActiveTab] = useState('livrables');
    const cfg = PRESSURE_CONFIG[mission.pressure] || PRESSURE_CONFIG.ok;

    return (
        <motion.div
            key="panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full xl:w-[480px] shrink-0 bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 shadow-lg overflow-hidden"
        >
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-100 dark:border-dark-800">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300">
                                {getMissionType(mission.type)}
                            </span>
                            <StatutBadge statut={mission.statut} />
                        </div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{mission.client}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{mission.titre}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Quick info row */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {mission.responsable && (
                        <span className="flex items-center gap-1">
                            <Users2 className="h-3.5 w-3.5" /> {mission.responsable.nom}
                        </span>
                    )}
                    {mission.deadline && (
                        <span className={`flex items-center gap-1 ${mission.pressure === 'critical' ? 'text-red-500 font-semibold' : ''}`}>
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(mission.deadline).toLocaleDateString('fr-FR')}
                        </span>
                    )}
                    {mission.last_channel && (
                        <ChannelBadge channel={mission.last_channel} lastContact={mission.last_contact_at} />
                    )}
                </div>

                {/* Next action */}
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex w-full rounded-none border-b border-gray-100 dark:border-dark-800 bg-transparent p-0 h-auto gap-0">
                    {[
                        { value: 'livrables', label: 'Livrables', icon: FileText },
                        { value: 'infos', label: 'Infos', icon: Activity },
                        { value: 'log', label: 'Journal', icon: Shield },
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                                activeTab === tab.value
                                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                            {tab.value === 'livrables' && mission.livrables.length > 0 && (
                                <span className="bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-bold px-1.5 rounded-full">
                                    {mission.livrables.length}
                                </span>
                            )}
                        </button>
                    ))}
                </TabsList>

                <TabsContent value="livrables" className="m-0 p-4 space-y-3">
                    <LivrablesTab mission={mission} collaborateurs={collaborateurs} />
                </TabsContent>

                <TabsContent value="infos" className="m-0 p-4">
                    <InfosTab mission={mission} collaborateurs={collaborateurs} />
                </TabsContent>

                <TabsContent value="log" className="m-0 p-4">
                    <LogTab mission={mission} />
                </TabsContent>
            </Tabs>
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

function LivrablesTab({ mission, collaborateurs }) {
    const [addOpen, setAddOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        nom: '',
        type_livrable: '',
        responsable_id: '',
        deadline_envoi: '',
        deadline_validation: '',
        url: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('missions.livrables.store', mission.id), {
            onSuccess: () => { setAddOpen(false); reset(); },
        });
    };

    const advance = (livrable) => {
        router.put(route('missions.livrables.advance', [mission.id, livrable.id]), {}, {
            preserveState: true,
        });
    };

    const destroy = (livrable) => {
        if (!confirm(`Supprimer "${livrable.nom}" ?`)) return;
        router.delete(route('missions.livrables.destroy', [mission.id, livrable.id]), { preserveState: true });
    };

    const livrableStatutColors = {
        draft: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        review: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
        validated: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
        sent: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
        feedback: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
        approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        archived: 'bg-gray-100 text-gray-400 dark:bg-gray-900 dark:text-gray-500',
    };

    return (
        <div className="space-y-3">
            {mission.livrables.map(livrable => (
                <div key={livrable.id} className="p-3 rounded-lg border border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-950 group">
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
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${livrableStatutColors[livrable.statut] || livrableStatutColors.draft}`}>
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
                            {livrable.statut !== 'archived' && (
                                <button
                                    onClick={() => advance(livrable)}
                                    title="Avancer le statut"
                                    className="p-1 rounded text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
                                >
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => destroy(livrable)}
                                className="p-1 rounded text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {mission.livrables.length === 0 && !addOpen && (
                <p className="text-sm text-gray-400 text-center py-4 italic">Aucun livrable défini.</p>
            )}

            {addOpen ? (
                <form onSubmit={submit} className="p-3 border border-dashed border-sky-300 dark:border-sky-600 rounded-lg space-y-2 bg-sky-50/50 dark:bg-sky-500/5">
                    <Input
                        placeholder="Nom du livrable *"
                        value={data.nom}
                        onChange={e => setData('nom', e.target.value)}
                        className="h-8 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            placeholder="Type (rapport, démo…)"
                            value={data.type_livrable}
                            onChange={e => setData('type_livrable', e.target.value)}
                            className="h-8 text-sm"
                        />
                        <Select value={data.responsable_id} onChange={e => setData('responsable_id', e.target.value)} className="h-8 text-sm">
                            <option value="">Responsable</option>
                            {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                        </Select>
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
                    <Input
                        placeholder="URL (lien vers le livrable)"
                        value={data.url}
                        onChange={e => setData('url', e.target.value)}
                        className="h-8 text-sm"
                    />
                    <div className="flex gap-2 pt-1">
                        <Button type="submit" size="sm" className="h-7 text-xs bg-sky-500 hover:bg-sky-600" disabled={processing}>Ajouter</Button>
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddOpen(false); reset(); }}>Annuler</Button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setAddOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-sky-500 hover:text-sky-600 border border-dashed border-sky-300 dark:border-sky-600 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-500/5 transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" /> Ajouter un livrable
                </button>
            )}
        </div>
    );
}

// ─── Infos Tab ─────────────────────────────────────────────────────────────────

function InfosTab({ mission, collaborateurs }) {
    const { data, setData, put, processing } = useForm({
        client:           mission.client,
        titre:            mission.titre,
        type:             mission.type,
        practice:         mission.practice || '',
        statut:           mission.statut,
        responsable_id:   mission.responsable_id || '',
        deadline:         mission.deadline || '',
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
        if (!confirm(`Supprimer la mission "${mission.client} — ${mission.titre}" ?`)) return;
        router.delete(route('missions.destroy', mission.id));
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Client *</Label>
                    <Input value={data.client} onChange={e => setData('client', e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Statut</Label>
                    <Select value={data.statut} onChange={e => setData('statut', e.target.value)} className="h-8 text-sm mt-1">
                        {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Select>
                </div>
            </div>
            <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-400">Titre de la mission *</Label>
                <Input value={data.titre} onChange={e => setData('titre', e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Type</Label>
                    <Select value={data.type} onChange={e => setData('type', e.target.value)} className="h-8 text-sm mt-1">
                        {MISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                </div>
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Practice</Label>
                    <Input value={data.practice} onChange={e => setData('practice', e.target.value)} placeholder="Ex: Data & IA" className="h-8 text-sm mt-1" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Responsable</Label>
                    <Select value={data.responsable_id} onChange={e => setData('responsable_id', e.target.value)} className="h-8 text-sm mt-1">
                        <option value="">—</option>
                        {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                    </Select>
                </div>
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Deadline</Label>
                    <Input type="date" value={data.deadline} onChange={e => setData('deadline', e.target.value)} className="h-8 text-sm mt-1" />
                </div>
            </div>

            <div className="pt-1 border-t border-gray-100 dark:border-dark-800">
                <Label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Contact SLA</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Select value={data.last_channel} onChange={e => setData('last_channel', e.target.value)} className="h-8 text-sm">
                        <option value="">Canal —</option>
                        {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label} (SLA {c.sla})</option>)}
                    </Select>
                </div>
            </div>

            <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-400">Prochaine action</Label>
                <Input value={data.next_action} onChange={e => setData('next_action', e.target.value)} placeholder="Ex: Envoyer rapport v2" className="h-8 text-sm mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] uppercase tracking-wider text-gray-400">Date prochaine action</Label>
                    <Input type="date" value={data.next_action_date} onChange={e => setData('next_action_date', e.target.value)} className="h-8 text-sm mt-1" />
                </div>
            </div>
            <div>
                <Label className="text-[10px] uppercase tracking-wider text-gray-400">Note</Label>
                <textarea
                    value={data.note}
                    onChange={e => setData('note', e.target.value)}
                    rows={3}
                    className="w-full mt-1 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white resize-none"
                    placeholder="Notes libres sur la mission…"
                />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-dark-800">
                <Button type="submit" size="sm" className="bg-sky-500 hover:bg-sky-600 text-white" disabled={processing}>
                    Enregistrer
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={deleteMission} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 ml-auto">
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
        action: 'text-sky-500',
        note: 'text-gray-400',
        status: 'text-violet-500',
        livrable: 'text-emerald-500',
    };

    const logTypeLabels = { action: 'Action', note: 'Note', status: 'Statut', livrable: 'Livrable' };

    return (
        <div className="space-y-3">
            <form onSubmit={submit} className="space-y-2">
                <div className="flex gap-2">
                    <Select value={data.type} onChange={e => setData('type', e.target.value)} className="h-8 text-sm w-32 shrink-0">
                        <option value="note">Note</option>
                        <option value="action">Action</option>
                        <option value="status">Statut</option>
                        <option value="livrable">Livrable</option>
                    </Select>
                    <Input
                        value={data.content}
                        onChange={e => setData('content', e.target.value)}
                        placeholder="Ajouter une entrée au journal…"
                        className="h-8 text-sm flex-1"
                    />
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

// ─── Create Modal ──────────────────────────────────────────────────────────────

function CreateMissionModal({ open, onClose, collaborateurs }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        client:          '',
        titre:           '',
        type:            'transformation',
        practice:        '',
        responsable_id:  '',
        deadline:        '',
        next_action:     '',
        next_action_date:'',
        note:            '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('missions.store'), { onSuccess: () => { onClose(); reset(); } });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-sky-500" /> Nouvelle Mission
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Client *</Label>
                            <Input value={data.client} onChange={e => setData('client', e.target.value)} placeholder="Nom du client" className="mt-1" />
                            {errors.client && <p className="text-xs text-red-500 mt-0.5">{errors.client}</p>}
                        </div>
                        <div>
                            <Label>Type *</Label>
                            <Select value={data.type} onChange={e => setData('type', e.target.value)} className="mt-1">
                                {MISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Titre de la mission *</Label>
                        <Input value={data.titre} onChange={e => setData('titre', e.target.value)} placeholder="Ex: Déploiement CRM Salesforce" className="mt-1" />
                        {errors.titre && <p className="text-xs text-red-500 mt-0.5">{errors.titre}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Practice</Label>
                            <Input value={data.practice} onChange={e => setData('practice', e.target.value)} placeholder="Ex: Data & IA" className="mt-1" />
                        </div>
                        <div>
                            <Label>Responsable</Label>
                            <Select value={data.responsable_id} onChange={e => setData('responsable_id', e.target.value)} className="mt-1">
                                <option value="">— Choisir —</option>
                                {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Deadline</Label>
                            <Input type="date" value={data.deadline} onChange={e => setData('deadline', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label>Date prochaine action</Label>
                            <Input type="date" value={data.next_action_date} onChange={e => setData('next_action_date', e.target.value)} className="mt-1" />
                        </div>
                    </div>
                    <div>
                        <Label>Prochaine action</Label>
                        <Input value={data.next_action} onChange={e => setData('next_action', e.target.value)} placeholder="Ex: Envoyer cahier des charges" className="mt-1" />
                    </div>
                    <div>
                        <Label>Note</Label>
                        <textarea
                            value={data.note}
                            onChange={e => setData('note', e.target.value)}
                            rows={2}
                            placeholder="Contexte, risques, points clés…"
                            className="w-full mt-1 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white" disabled={processing}>
                            Créer la mission
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
