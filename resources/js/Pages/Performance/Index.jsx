import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { CustomSelect } from '@/Components/ui/CustomSelect';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber } from '@/lib/utils';
import {
    ClipboardCheck, Plus, X, ChevronRight, GitBranch, Calendar,
    RefreshCw, Trophy, CheckCircle2,
    Briefcase, Search, RotateCcw, Trash2,
    TrendingUp, Download, BookOpen, Star, CheckSquare, BarChart3,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUTS_PERF = [
    { value: 'brouillon',         label: 'Brouillon',      color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    { value: 'en_revision',       label: 'En révision',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    { value: 'attente_drh',       label: 'Attente DRH',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    { value: 'confirme',          label: 'Confirmé',       color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { value: 'revision_demandee', label: 'Révision dem.',  color: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400' },
];

const DIMENSIONS = [
    { key: 'commercial',    label: 'Commercial',     poidsKey: 'poids_commercial',    scoreKey: 'score_commercial',     color: 'bg-red-500',     defaultPoids: 0.50, icon: Briefcase,   iconColor: 'text-amber-700 dark:text-amber-500' },
    { key: 'delivery',      label: 'Delivery',       poidsKey: 'poids_delivery',      scoreKey: 'score_delivery',       color: 'bg-emerald-500', defaultPoids: 0.25, icon: CheckSquare, iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'developpement', label: 'Développement',  poidsKey: 'poids_developpement', scoreKey: 'score_developpement',  color: 'bg-amber-500',   defaultPoids: 0.15, icon: BookOpen,    iconColor: 'text-amber-600 dark:text-amber-400' },
    { key: 'comportemental',label: 'Comportemental', poidsKey: 'poids_comportemental',scoreKey: 'score_comportemental', color: 'bg-violet-500',  defaultPoids: 0.10, icon: Star,        iconColor: 'text-yellow-500 dark:text-yellow-400' },
];

const TYPES_CYCLE = [
    { value: 'trimestriel', label: 'Trimestriel' },
    { value: 'annuel',      label: 'Annuel' },
];


const SIDEBAR_VIEWS = [
    { key: 'fiches',     label: 'Fiches individuelles', icon: ClipboardCheck, accent: 'text-violet-500' },
    { key: 'workflow',   label: 'Workflow validation',  icon: GitBranch,      accent: 'text-amber-500' },
    { key: 'cycle',      label: 'Cycle annuel',         icon: Calendar,       accent: 'text-blue-500' },
    { key: 'mid_review', label: 'Mid-Year Review',      icon: RefreshCw,      accent: 'text-orange-500' },
    { key: 'evaluation', label: 'Évaluation finale',    icon: Trophy,         accent: 'text-emerald-500' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatut(value) { return STATUTS_PERF.find(s => s.value === value) || STATUTS_PERF[0]; }

function scoreColor(score) {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 4.5) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 2.5) return 'text-amber-600 dark:text-amber-400';
    if (score >= 1.5) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
}

function barColor(score) {
    if (score === null || score === undefined) return 'bg-gray-200 dark:bg-gray-700';
    if (score >= 4) return 'bg-emerald-500';
    if (score >= 3) return 'bg-blue-500';
    if (score >= 2) return 'bg-amber-500';
    return 'bg-red-500';
}

// Calcule le score global côté JS (preview temps réel)
function calcScoreGlobal(scores) {
    let somme = 0;
    let hasAny = false;
    DIMENSIONS.forEach(d => {
        const s = scores[d.scoreKey];
        const p = scores[d.poidsKey] ?? d.defaultPoids;
        if (s !== null && s !== undefined && s !== '') {
            somme += parseFloat(s) * parseFloat(p);
            hasAny = true;
        }
    });
    return hasAny ? Math.round(somme * 10) / 10 : null;
}

function getInitiales(prenom, nom) {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
}

function appreciationColor(appr) {
    if (!appr) return null;
    if (appr.includes('Très'))     return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
    if (appr.includes('Au-dessus'))return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    if (appr.includes('niveau'))   return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
    if (appr.includes('cours'))    return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
}

// ─── StatutBadge ──────────────────────────────────────────────────────────────

function StatutBadge({ statut }) {
    const s = getStatut(statut);
    return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>;
}

// ─── ScoreBarre ───────────────────────────────────────────────────────────────

function ScoreBarre({ label, score, poids, icon: Icon, iconColor }) {
    const pct = score !== null ? (score / 5) * 100 : 0;
    return (
        <div className="flex items-center gap-1.5">
            {Icon && <Icon className={`h-3 w-3 shrink-0 ${iconColor || 'text-gray-400'}`} />}
            <span className="text-[11px] text-gray-500 dark:text-gray-400 w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor(score)}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 w-8 text-right">
                {score !== null ? `${score}/5` : '—'}
            </span>
            <span className="text-[10px] text-gray-400 w-8">{Math.round(poids * 100)}%</span>
        </div>
    );
}

// ─── FicheCard ────────────────────────────────────────────────────────────────

function FicheCard({ fiche, onOpen, onMidReview, onEvalFinale, onCreateFiche, collaborateur }) {
    // Cas sans fiche : card dashed
    if (!fiche) {
        return (
            <div className="bg-white dark:bg-dark-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-dark-700 p-5 flex flex-col items-center justify-center gap-3 min-h-[200px]">
                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center text-gray-400 font-bold text-lg">
                    {getInitiales(collaborateur.prenom, collaborateur.nom)}
                </div>
                <div className="text-center">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-[14px]">
                        {collaborateur.prenom} {collaborateur.nom}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{collaborateur.practice || collaborateur.poste}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onCreateFiche(collaborateur)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Créer la fiche
                </Button>
            </div>
        );
    }

    const collab = fiche.collaborateur;

    return (
        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-4 hover:shadow-sm transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${scoreColorBg(fiche.score_global)}`}>
                        {getInitiales(collab?.prenom, collab?.nom)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-[13px] leading-tight truncate">
                            {collab?.prenom} {collab?.nom}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                            {collab?.practice || collab?.poste}
                        </p>
                        {fiche.manager && (
                            <p className="text-[11px] text-gray-400 truncate">
                                Manager : {fiche.manager.prenom} {fiche.manager.nom}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatutBadge statut={fiche.statut} />
                    {fiche.score_global !== null && (
                        <span className={`text-xl font-black ${scoreColor(fiche.score_global)}`}>
                            {formatNumber(fiche.score_global, 1)}/5
                        </span>
                    )}
                    {fiche.appreciation && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-tight text-center ${appreciationColor(fiche.appreciation)}`}>
                            {fiche.appreciation}
                        </span>
                    )}
                    {fiche.nb_aller_retour > 0 && (
                        <span className="text-[10px] text-gray-400">A/R : {fiche.nb_aller_retour}/3</span>
                    )}
                </div>
            </div>

            {/* Barres de scores */}
            <div className="space-y-1.5 mb-4">
                {DIMENSIONS.map(d => (
                    <ScoreBarre
                        key={d.key}
                        label={d.label}
                        score={fiche[d.scoreKey]}
                        poids={fiche[d.poidsKey] ?? d.defaultPoids}
                        icon={d.icon}
                        iconColor={d.iconColor}
                    />
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-dark-800 flex-wrap">
                <Button size="sm" className="flex-1 min-w-0" onClick={() => onOpen(fiche)}>
                    Voir la fiche
                </Button>
                {fiche.statut !== 'brouillon' && (
                    <Button size="sm" variant="outline" onClick={() => onMidReview(fiche)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Mid-Review
                    </Button>
                )}
                {(fiche.statut === 'attente_drh' || fiche.statut === 'confirme') && (
                    <Button size="sm" variant="outline" onClick={() => onEvalFinale(fiche)}>
                        <Trophy className="h-3.5 w-3.5 mr-1" /> Éval. finale
                    </Button>
                )}
            </div>
        </div>
    );
}

function scoreColorBg(score) {
    if (score === null || score === undefined) return 'bg-gray-400';
    if (score >= 4) return 'bg-emerald-500';
    if (score >= 3) return 'bg-blue-500';
    if (score >= 2) return 'bg-amber-500';
    return 'bg-red-500';
}

// ─── CreateFicheModal ─────────────────────────────────────────────────────────

function CreateFicheModal({ open, onClose, collaborateurs, fichesExistantes, defaultCollab }) {
    const [form, setForm] = useState({
        collaborateur_id: defaultCollab?.id?.toString() || '',
        cycle: 'Q3 2026',
        type_cycle: 'trimestriel',
        periode_debut: '',
        periode_fin: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const cyclesDejaPris = useMemo(() => {
        const map = {};
        fichesExistantes.forEach(f => {
            if (!map[f.collaborateur_id]) map[f.collaborateur_id] = new Set();
            map[f.collaborateur_id].add(f.cycle);
        });
        return map;
    }, [fichesExistantes]);

    const collaborateurOptions = collaborateurs.map(c => ({
        value: c.id.toString(),
        label: `${c.prenom} ${c.nom} — ${c.poste || ''}`,
    }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        router.post(route('performance.store'), form, {
            preserveState: true,
            preserveScroll: true,
            onError: (errs) => { setErrors(errs); setLoading(false); },
            onSuccess: () => { onClose(); setLoading(false); setErrors({}); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Créer une fiche de performance</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div>
                        <Label>Collaborateur *</Label>
                        <SearchableSelect
                            value={form.collaborateur_id}
                            onChange={v => setForm(p => ({ ...p, collaborateur_id: v }))}
                            options={collaborateurOptions}
                            placeholder="Sélectionner un collaborateur"
                            error={errors.collaborateur_id}
                        />
                    </div>
                    <div>
                        <Label>Cycle *</Label>
                        <Input
                            value={form.cycle}
                            onChange={e => setForm(p => ({ ...p, cycle: e.target.value }))}
                            placeholder="ex : Q3 2026, Annuel 2026"
                        />
                        {errors.cycle && <p className="text-xs text-red-500 mt-1">{errors.cycle}</p>}
                    </div>
                    <div>
                        <Label>Type de cycle *</Label>
                        <CustomSelect
                            value={form.type_cycle}
                            onChange={v => setForm(p => ({ ...p, type_cycle: v }))}
                            options={TYPES_CYCLE}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Début de période</Label>
                            <Input type="date" value={form.periode_debut}
                                onChange={e => setForm(p => ({ ...p, periode_debut: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Fin de période</Label>
                            <Input type="date" value={form.periode_fin}
                                onChange={e => setForm(p => ({ ...p, periode_fin: e.target.value }))} />
                        </div>
                    </div>
                    {errors.collaborateur_id && (
                        <p className="text-xs text-red-500">{errors.collaborateur_id}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Création…' : 'Créer la fiche'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Helpers textarea ────────────────────────────────────────────────────────

function Textarea({ value, onChange, placeholder, rows = 3, disabled }) {
    return (
        <textarea
            rows={rows}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full mt-1 rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-[12px] p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
        />
    );
}

// ─── Historique Workflow (partagé) ────────────────────────────────────────────

function HistoriqueWorkflow({ fiche }) {
    return (
        <div className="space-y-2">
            {(fiche.historique_workflow || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Aucun historique disponible</p>
            )}
            {(fiche.historique_workflow || []).map((h, i) => (
                <div key={i} className="flex gap-3 py-2">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                    <div>
                        <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                            {h.de_statut
                                ? `${getStatut(h.de_statut).label} → ${getStatut(h.vers_statut).label}`
                                : `Créé en ${getStatut(h.vers_statut).label}`}
                        </p>
                        <p className="text-[11px] text-gray-400">
                            {h.user?.name} · {h.created_at ? new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                        {h.commentaire && (
                            <p className="text-[11px] text-gray-500 mt-0.5 italic">"{h.commentaire}"</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── EditScoresPanel (slide-over "Voir la fiche") ─────────────────────────────

function EditScoresPanel({ fiche, onClose, objectifs = [] }) {
    const SCORE_OPTIONS = [
        { value: '', label: '—' },
        { value: '1', label: '1/5' },
        { value: '2', label: '2/5' },
        { value: '3', label: '3/5' },
        { value: '4', label: '4/5' },
        { value: '5', label: '5/5' },
    ];

    const initForm = () => {
        const f = {};
        DIMENSIONS.forEach(d => {
            const scoreVal = fiche[d.scoreKey];
            f[d.scoreKey] = (scoreVal !== null && scoreVal !== undefined)
                ? String(Math.round(scoreVal))
                : null;
            const collabVal = fiche[`score_collab_${d.key}`];
            f[`score_collab_${d.key}`] = (collabVal !== null && collabVal !== undefined)
                ? String(collabVal)
                : null;
            f[`objectif_${d.key}`]                    = fiche[`objectif_${d.key}`] || '';
            f[`cible_${d.key}`]                       = fiche[`cible_${d.key}`] || '';
            f[`commentaire_manager_${d.key}`]         = fiche[`commentaire_manager_${d.key}`] || '';
            f[`commentaire_collaborateur_${d.key}`]   = fiche[`commentaire_collaborateur_${d.key}`] || '';
        });
        f.objectif_okr_id_commercial = fiche.objectif_okr_id_commercial?.toString() || '';
        f.objectif_okr_id_delivery   = fiche.objectif_okr_id_delivery?.toString() || '';
        return f;
    };

    const [form, setForm]               = useState(initForm);
    const [workflowComment, setWorkflowComment] = useState('');
    const [errors, setErrors]           = useState({});
    const [saving, setSaving]           = useState(false);
    const [advancing, setAdvancing]     = useState(false);
    const [syncing, setSyncing]         = useState(false);

    // OKR actifs du collaborateur
    const okrOptions = objectifs
        .filter(o => o.collaborateur_id === fiche.collaborateur_id)
        .map(o => ({ value: String(o.id), label: o.titre + (o.axe ? ` · ${o.axe}` : '') }));

    const isLocked = fiche.verrouille;
    const previewScore = calcScoreGlobal({
        ...form,
        poids_commercial:    fiche.poids_commercial ?? 0.50,
        poids_delivery:      fiche.poids_delivery ?? 0.25,
        poids_developpement: fiche.poids_developpement ?? 0.15,
        poids_comportemental:fiche.poids_comportemental ?? 0.10,
    });

    const WORKFLOW_TRANSITIONS = {
        brouillon:   [{ value: 'en_revision', label: 'Envoyer au collaborateur', icon: ChevronRight, color: 'bg-amber-500 hover:bg-amber-600' }],
        en_revision: [
            { value: 'attente_drh',       label: 'Soumettre à la DRH',    icon: ChevronRight, color: 'bg-blue-500 hover:bg-blue-600' },
            { value: 'revision_demandee', label: 'Demander révision',      icon: RotateCcw,    color: 'bg-pink-500 hover:bg-pink-600' },
            { value: 'brouillon',         label: 'Retourner en brouillon', icon: RotateCcw,    color: 'bg-gray-500 hover:bg-gray-600' },
        ],
        attente_drh: [
            { value: 'confirme',          label: 'Confirmer la fiche',     icon: CheckCircle2, color: 'bg-emerald-500 hover:bg-emerald-600' },
            { value: 'revision_demandee', label: 'Demander révision DRH',  icon: RotateCcw,    color: 'bg-pink-500 hover:bg-pink-600' },
        ],
        confirme:           [],
        revision_demandee:  [
            { value: 'en_revision', label: 'Reprendre en révision',  icon: ChevronRight, color: 'bg-amber-500 hover:bg-amber-600' },
            { value: 'brouillon',   label: 'Retourner en brouillon', icon: RotateCcw,    color: 'bg-gray-500 hover:bg-gray-600' },
        ],
    };

    const handleSave = () => {
        setSaving(true);
        router.put(route('performance.update', fiche.id), form, {
            preserveState: true, preserveScroll: true,
            onError: (errs) => { setErrors(errs); setSaving(false); },
            onSuccess: () => setSaving(false),
        });
    };

    const handleAdvance = (versStatut) => {
        if (!confirm(`Confirmer la transition vers "${getStatut(versStatut).label}" ?`)) return;
        setAdvancing(true);
        router.post(route('performance.avancer', fiche.id), { vers_statut: versStatut, commentaire: workflowComment }, {
            preserveState: true, preserveScroll: true,
            onError: (errs) => { setErrors(errs); setAdvancing(false); },
            onSuccess: () => setAdvancing(false),
        });
    };

    const handleDelete = () => {
        if (!confirm('Supprimer cette fiche ? Cette action est irréversible.')) return;
        router.delete(route('performance.destroy', fiche.id), { preserveState: false, onSuccess: onClose });
    };

    const handleSyncOkr = () => {
        if (!confirm('Synchroniser les scores Commercial et Delivery depuis les OKR liés ?')) return;
        setSyncing(true);
        router.post(route('performance.sync-okr', fiche.id), {}, {
            preserveState: true, preserveScroll: true,
            onError: (errs) => { setErrors(errs); setSyncing(false); },
            onSuccess: () => setSyncing(false),
        });
    };

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
    const collab = fiche.collaborateur;

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-[540px] bg-white dark:bg-dark-900 shadow-2xl border-l border-gray-200 dark:border-dark-700 flex flex-col"
        >
            {/* Header sombre */}
            <div className="bg-gray-900 dark:bg-dark-950 px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-white font-bold text-[15px]">
                        Fiche performance — {collab?.prenom} {collab?.nom}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-400 text-[12px]">Statut workflow :</span>
                        <StatutBadge statut={fiche.statut} />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isLocked && okrOptions.length > 0 && (
                        <button onClick={handleSyncOkr} disabled={syncing}
                            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors disabled:opacity-60">
                            <TrendingUp className="h-3 w-3" />
                            {syncing ? 'Sync…' : 'Sync OKR'}
                        </button>
                    )}
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Corps scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-800">

                {/* Blocs par dimension */}
                {DIMENSIONS.map(d => {
                    const DimIcon = d.icon;
                    const scoreAuto = fiche[`score_auto_${d.key}`];
                    const poids = Math.round((fiche[`poids_${d.key}`] ?? d.defaultPoids) * 100);
                    return (
                        <div key={d.key} className="p-4 space-y-3">
                            {/* Titre dimension */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <DimIcon className={`h-3.5 w-3.5 ${d.iconColor}`} />
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                                        {d.label} · {poids}%
                                    </span>
                                </div>
                                {/* Scores */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-gray-400">Manager</span>
                                        <select
                                            value={form[d.scoreKey] ?? ''}
                                            onChange={e => set(d.scoreKey, e.target.value === '' ? null : e.target.value)}
                                            disabled={isLocked}
                                            className="text-[12px] font-semibold border border-gray-200 dark:border-dark-700 rounded-lg px-2 py-1 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                                        >
                                            {SCORE_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-gray-400">Collab</span>
                                        <select
                                            value={form[`score_collab_${d.key}`] ?? ''}
                                            onChange={e => set(`score_collab_${d.key}`, e.target.value === '' ? null : e.target.value)}
                                            disabled={isLocked}
                                            className="text-[12px] font-semibold border border-gray-200 dark:border-dark-700 rounded-lg px-2 py-1 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                                        >
                                            {SCORE_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Objectif + cible */}
                            <div className="space-y-1.5">
                                <Input
                                    value={form[`objectif_${d.key}`]}
                                    onChange={e => set(`objectif_${d.key}`, e.target.value)}
                                    placeholder="Titre de l'objectif…"
                                    disabled={isLocked}
                                    className="text-[12px] h-8"
                                />
                                <Input
                                    value={form[`cible_${d.key}`]}
                                    onChange={e => set(`cible_${d.key}`, e.target.value)}
                                    placeholder="Cible : ex. CA ≥ 500M GNF…"
                                    disabled={isLocked}
                                    className="text-[12px] h-8 text-gray-400"
                                />
                                {/* OKR lié (Commercial et Delivery seulement) */}
                                {(d.key === 'commercial' || d.key === 'delivery') && (
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3 text-teal-500 shrink-0" />
                                        <SearchableSelect
                                            value={form[`objectif_okr_id_${d.key}`]}
                                            onChange={v => set(`objectif_okr_id_${d.key}`, v)}
                                            options={[{ value: '', label: '— Aucun OKR lié —' }, ...okrOptions]}
                                            placeholder="Lier un OKR…"
                                            disabled={isLocked}
                                            className="flex-1 text-[11px]"
                                        />
                                        {scoreAuto !== null && scoreAuto !== undefined && (
                                            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 shrink-0 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded-full">
                                                Auto : {scoreAuto}/5
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Score auto OKR (dimensions sans lien OKR) */}
                                {d.key !== 'commercial' && d.key !== 'delivery' && (
                                    scoreAuto !== null && scoreAuto !== undefined ? (
                                        <div className="flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400">
                                            <TrendingUp className="h-3 w-3" />
                                            Alimenté par OKR · Score auto : <strong>{scoreAuto}/5</strong>
                                        </div>
                                    ) : null
                                )}
                            </div>

                            {/* Commentaires */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Commentaire manager</p>
                                    <Textarea
                                        value={form[`commentaire_manager_${d.key}`]}
                                        onChange={e => set(`commentaire_manager_${d.key}`, e.target.value)}
                                        placeholder="Appréciation…"
                                        rows={2}
                                        disabled={isLocked}
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Commentaire collaborateur</p>
                                    <Textarea
                                        value={form[`commentaire_collaborateur_${d.key}`]}
                                        onChange={e => set(`commentaire_collaborateur_${d.key}`, e.target.value)}
                                        placeholder="Auto-évaluation…"
                                        rows={2}
                                        disabled={isLocked}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Score global preview */}
                <div className="p-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700">
                        <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">Score global calculé</span>
                        <span className={`text-2xl font-black ${scoreColor(previewScore)}`}>
                            {previewScore !== null ? `${formatNumber(previewScore, 1)}/5` : '—'}
                        </span>
                    </div>
                </div>

                {/* Historique workflow */}
                <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">Historique Workflow</p>
                    <HistoriqueWorkflow fiche={fiche} />
                </div>
            </div>

            {/* Footer */}
            {!isLocked && (
                <div className="border-t border-gray-100 dark:border-dark-800 p-4 space-y-3">
                    {(WORKFLOW_TRANSITIONS[fiche.statut] || []).length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-[11px] text-gray-400">Avancer le workflow</Label>
                            <Textarea
                                value={workflowComment}
                                onChange={e => setWorkflowComment(e.target.value)}
                                placeholder="Commentaire (optionnel)…"
                                rows={2}
                            />
                            <div className="flex gap-2 flex-wrap">
                                {(WORKFLOW_TRANSITIONS[fiche.statut] || []).map(t => {
                                    const Icon = t.icon;
                                    return (
                                        <button key={t.value} onClick={() => handleAdvance(t.value)} disabled={advancing}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12px] font-medium transition-colors ${t.color} disabled:opacity-60`}>
                                            <Icon className="h-3.5 w-3.5" />{t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleSave} disabled={saving}>
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                        {fiche.statut === 'brouillon' && (
                            <Button variant="outline" size="icon" onClick={handleDelete}
                                className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
            {isLocked && (
                <div className="border-t border-gray-100 dark:border-dark-800 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-[13px] font-medium">
                            Fiche verrouillée · confirmée le {fiche.validated_at ? new Date(fiche.validated_at).toLocaleDateString('fr-FR') : '—'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {fiche.appreciation && (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${appreciationColor(fiche.appreciation)}`}>
                                {fiche.appreciation}
                            </span>
                        )}
                        {fiche.nb_aller_retour > 0 && (
                            <span className="text-[11px] text-gray-400">{fiche.nb_aller_retour} aller-retour(s)</span>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// ─── MidYearReviewModal ───────────────────────────────────────────────────────

function MidYearReviewModal({ fiche, open, onClose }) {
    const [form, setForm] = useState({
        commentaire_mid_year_manager:       fiche?.commentaire_mid_year_manager || '',
        commentaire_mid_year_collaborateur: fiche?.commentaire_mid_year_collaborateur || '',
        forecast_revision:                  fiche?.forecast_revision || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        router.put(route('performance.update', fiche.id), form, {
            preserveState: true, preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError: () => setSaving(false),
        });
    };

    const collab = fiche?.collaborateur;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-[16px]">
                        Mid-Year Review — {collab?.prenom} {collab?.nom}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    {/* Info box */}
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <p className="text-[12px] text-amber-800 dark:text-amber-300">
                            <strong>Mid-Year Review :</strong> Évaluation mi-parcours. Permet de réviser les cibles si le contexte a changé (justification obligatoire).
                        </p>
                    </div>

                    <div>
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Commentaire Manager</Label>
                        <Textarea
                            value={form.commentaire_mid_year_manager}
                            onChange={e => setForm(p => ({ ...p, commentaire_mid_year_manager: e.target.value }))}
                            placeholder="Avancement global, points forts, axes d'amélioration…"
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Commentaire Collaborateur</Label>
                        <Textarea
                            value={form.commentaire_mid_year_collaborateur}
                            onChange={e => setForm(p => ({ ...p, commentaire_mid_year_collaborateur: e.target.value }))}
                            placeholder="Auto-évaluation mi-parcours…"
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Forecast — Révision éventuelle des cibles</Label>
                        <Textarea
                            value={form.forecast_revision}
                            onChange={e => setForm(p => ({ ...p, forecast_revision: e.target.value }))}
                            placeholder="Ex: Pipeline révisé à 900M GNF compte tenu du contexte marché…"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── EvaluationFinaleModal ────────────────────────────────────────────────────

function EvaluationFinaleModal({ fiche, open, onClose }) {
    const [form, setForm] = useState({
        final_commentaire_manager:       fiche?.final_commentaire_manager || '',
        final_commentaire_collaborateur: fiche?.final_commentaire_collaborateur || '',
        final_prime_calculee:            fiche?.final_prime_calculee || '',
    });
    const [saving, setSaving] = useState(false);
    const [advancing, setAdvancing] = useState(false);

    const handleSave = () => {
        setSaving(true);
        router.put(route('performance.update', fiche.id), {
            final_commentaire_manager:       form.final_commentaire_manager,
            final_commentaire_collaborateur: form.final_commentaire_collaborateur,
        }, {
            preserveState: true, preserveScroll: true,
            onSuccess: () => { setSaving(false); onClose(); },
            onError: () => setSaving(false),
        });
    };

    const handleCloturerFinale = () => {
        if (!confirm('Clôturer définitivement cette évaluation ? Le score et la prime seront figés. Action irréversible.')) return;
        setAdvancing(true);
        router.post(route('performance.cloturer', fiche.id), form, {
            preserveState: true, preserveScroll: true,
            onSuccess: () => { setAdvancing(false); onClose(); },
            onError: () => setAdvancing(false),
        });
    };

    // Stub prime (Chantier 5 — calcul réel non encore implémenté)
    const primeStub = fiche?.score_global
        ? Math.round(3000000 * (fiche.score_global / 5) * 0.75 / 10000) * 10000
        : null;

    const collab = fiche?.collaborateur;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-[16px]">
                        Évaluation finale — {collab?.prenom} {collab?.nom}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    {/* Carte score sombre */}
                    <div className="bg-gray-900 dark:bg-dark-950 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-white font-bold text-[15px]">{collab?.prenom} {collab?.nom}</p>
                            <p className="text-gray-400 text-[11px] mt-0.5">
                                {fiche?.final_done ? 'Score figé (éval. finale clôturée)' : 'Score calculé automatiquement'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <StatutBadge statut={fiche?.statut} />
                                {fiche?.final_appreciation && (
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${appreciationColor(fiche.final_appreciation)}`}>
                                        {fiche.final_appreciation}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={`text-3xl font-black ${scoreColor(fiche?.final_score_global ?? fiche?.score_global)}`}>
                            {(fiche?.final_score_global ?? fiche?.score_global) !== null
                                ? `${formatNumber(fiche.final_score_global ?? fiche.score_global, 1)}/5`
                                : '—'}
                        </div>
                    </div>

                    {/* Grille 2×2 dimensions */}
                    <div className="grid grid-cols-2 gap-2">
                        {DIMENSIONS.map(d => {
                            const DimIcon = d.icon;
                            const score = fiche?.[d.scoreKey];
                            return (
                                <div key={d.key} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700">
                                    <DimIcon className={`h-4 w-4 shrink-0 ${d.iconColor}`} />
                                    <span className="text-[12px] text-gray-600 dark:text-gray-300 flex-1">{d.label}</span>
                                    <span className={`text-[14px] font-black ${scoreColor(score)}`}>
                                        {score !== null ? `${score}/5` : '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Prime variable (stub Chantier 5) */}
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Prime variable calculée</p>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                                    Base 3 000 000 × palier 0% + bonus perf
                                </p>
                            </div>
                            {primeStub !== null ? (
                                <span className="text-[18px] font-black text-emerald-700 dark:text-emerald-400">
                                    {primeStub.toLocaleString('fr-FR')} GNF
                                </span>
                            ) : (
                                <span className="text-[12px] text-emerald-500 italic">Disponible — Chantier 5</span>
                            )}
                        </div>
                    </div>

                    {/* Commentaires finaux */}
                    <div>
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Commentaire final Manager</Label>
                        <Textarea
                            value={form.final_commentaire_manager}
                            onChange={e => setForm(p => ({ ...p, final_commentaire_manager: e.target.value }))}
                            placeholder="Synthèse de l'année, perspectives…"
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Commentaire Collaborateur</Label>
                        <Textarea
                            value={form.final_commentaire_collaborateur}
                            onChange={e => setForm(p => ({ ...p, final_commentaire_collaborateur: e.target.value }))}
                            placeholder="Prise de connaissance…"
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={onClose}>Annuler</Button>
                        {!fiche?.final_done && (
                            <Button variant="outline" onClick={handleSave} disabled={saving}>
                                {saving ? 'Enregistrement…' : 'Enregistrer brouillon'}
                            </Button>
                        )}
                        {!fiche?.final_done && (fiche?.statut === 'attente_drh' || fiche?.statut === 'confirme') && (
                            <Button onClick={handleCloturerFinale} disabled={advancing}
                                className="bg-gray-900 hover:bg-gray-800 text-white">
                                {advancing ? 'Clôture…' : 'Clôturer & figer le score'}
                            </Button>
                        )}
                        {fiche?.final_done && (
                            <span className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold">
                                <CheckCircle2 className="h-4 w-4" /> Évaluation finale clôturée
                            </span>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Score label (interprétation textuelle) ───────────────────────────────────

function getScoreLabel(score) {
    if (score === null || score === undefined) return null;
    if (score >= 4.5) return { label: 'Exceptionnel',           color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' };
    if (score >= 3.5) return { label: 'Dépasse les attentes',   color: 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' };
    if (score >= 2.5) return { label: 'Au niveau des attentes', color: 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' };
    if (score >= 1.5) return { label: 'En cours de développement', color: 'text-orange-700 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400' };
    return { label: 'Insuffisant',                               color: 'text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-400' };
}

// Prime estimée stub (Chantier 5 calculera le vrai montant)
function primeEstimee(fiche) {
    if (!fiche?.score_global) return null;
    return Math.round(3000000 * (fiche.score_global / 5) * 0.75 / 50000) * 50000;
}

// ─── Vue Workflow (Kanban) ────────────────────────────────────────────────────

const KANBAN_COLS = [
    { statut: 'brouillon',    label: 'Brouillon',    color: 'bg-gray-100 dark:bg-dark-800',     badge: 'bg-gray-500 text-white',          icon: '📝' },
    { statut: 'en_revision',  label: 'En révision',  color: 'bg-amber-50 dark:bg-amber-500/10', badge: 'bg-amber-500 text-white',          icon: '✏️' },
    { statut: 'attente_drh',  label: 'Attente DRH',  color: 'bg-blue-50 dark:bg-blue-500/10',   badge: 'bg-blue-500 text-white',           icon: '🏛' },
    { statut: 'confirme',     label: 'Confirmé',     color: 'bg-emerald-50 dark:bg-emerald-500/10', badge: 'bg-emerald-500 text-white',    icon: '✅' },
    { statut: 'revision_demandee', label: 'Révision dem.', color: 'bg-pink-50 dark:bg-pink-500/10', badge: 'bg-pink-500 text-white', icon: '🔄' },
];

const WORKFLOW_ETAPES = [
    { num: '01', title: 'Manager rédige',         role: 'Manager',                desc: 'Définit les objectifs, KR, poids et primes pour chaque collaborateur. Peut s\'inspirer des objectifs OKR existants.',      color: 'bg-violet-600' },
    { num: '02', title: 'Collaborateur commente', role: 'Collaborateur',          desc: 'Prend connaissance des objectifs. Peut ajouter des commentaires et proposer des ajustements.',                               color: 'bg-blue-600' },
    { num: '03', title: 'A/R jusqu\'à accord',    role: 'Manager ↔ Collaborateur',desc: 'Jusqu\'à 3 allers-retours tracés. Chaque modification est horodatée. Le manager valide la version finale.',               color: 'bg-amber-600' },
    { num: '04', title: 'Approbation DRH',        role: 'DRH',                    desc: 'Vérifie la cohérence avec la politique RH, les fourchettes de prime et les objectifs entreprise.',                          color: 'bg-orange-600' },
    { num: '05', title: 'Confirmé',               role: 'Système',                desc: 'Objectifs verrouillés pour le cycle. Toute modification ultérieure requiert un nouveau workflow.',                           color: 'bg-emerald-600' },
];

function VueWorkflow({ fiches, onOpen }) {
    const fichesByStatut = {};
    KANBAN_COLS.forEach(col => {
        fichesByStatut[col.statut] = fiches.filter(f => f.statut === col.statut);
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[18px] font-bold text-gray-900 dark:text-white mb-4">
                    Workflow de validation des objectifs
                </h2>

                {/* Kanban */}
                <div className="overflow-x-auto">
                <div className="grid grid-cols-5 gap-3 min-w-[600px]">
                    {KANBAN_COLS.map(col => {
                        const items = fichesByStatut[col.statut] || [];
                        return (
                            <div key={col.statut} className={`rounded-xl border border-gray-200 dark:border-dark-700 ${col.color} p-3 min-h-[200px]`}>
                                {/* Header colonne */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">
                                        {col.label}
                                    </span>
                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${col.badge}`}>
                                        {items.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div className="space-y-2">
                                    {items.length === 0 ? (
                                        <p className="text-[11px] text-gray-400 text-center py-6">Vide</p>
                                    ) : items.map(f => (
                                        <button key={f.id} onClick={() => onOpen(f)}
                                            className="w-full text-left bg-white dark:bg-dark-900 rounded-lg p-2.5 border border-gray-200 dark:border-dark-700 hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${scoreColorBg(f.score_global)}`}>
                                                    {getInitiales(f.collaborateur?.prenom, f.collaborateur?.nom)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[12px] font-semibold text-gray-900 dark:text-white truncate">
                                                        {f.collaborateur?.prenom} {f.collaborateur?.nom}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 truncate">
                                                        {f.collaborateur?.practice || f.collaborateur?.poste}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                </div>
            </div>

            {/* Les 5 étapes */}
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 p-5">
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white mb-4">Les 5 étapes du workflow</h3>
                <div className="space-y-4">
                    {WORKFLOW_ETAPES.map((e, i) => (
                        <div key={i} className="flex gap-4">
                            <div className={`h-8 w-8 rounded-full ${e.color} flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5`}>
                                {e.num}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[13px] font-bold text-gray-900 dark:text-white">{e.title}</span>
                                    <span className="text-[11px] text-gray-400 font-medium">· {e.role}</span>
                                </div>
                                <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">{e.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Vue Cycle Annuel (timeline verticale) ────────────────────────────────────

const CYCLE_TIMELINE = [
    { period: 'JANVIER',        type: 'performance',       title: 'Fixation des objectifs',  desc: 'Entretien de fixation · 1h · Manager + Collaborateur · Workflow 5 étapes obligatoire · Objectifs verrouillés pour le cycle',     months: [1],      icon: ClipboardCheck, iconBg: 'bg-amber-600',   badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' },
    { period: 'FÉVRIER-MARS',   type: 'okr',               title: 'Pilotage OKR Q1',         desc: 'Suivi hebdomadaire des KR · Mises à jour CRM · Rapport pipeline · Debriefing CEO/Manager',                                         months: [2,3],    icon: TrendingUp,     iconBg: 'bg-teal-600',    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    { period: 'AVRIL',          type: 'performance',       title: 'Q1 Review',               desc: 'Checkpoint rapide · 30 min · Avancement KR · Blocages · Ajustements mineurs sans workflow complet',                                 months: [4],      icon: CheckCircle2,   iconBg: 'bg-emerald-600', badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' },
    { period: 'MAI-JUIN',       type: 'okr',               title: 'Pilotage OKR Q2',         desc: 'Continuation du pilotage hebdomadaire · Prospection active · Suivi delivery',                                                       months: [5,6],    icon: TrendingUp,     iconBg: 'bg-teal-600',    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    { period: 'JUILLET',        type: 'performance',       title: 'Mid-Year Review',         desc: 'Évaluation mi-parcours formalisée · 1h · Forecast possible · Révision cibles si contexte change · DRH si révision majeure',        months: [7],      icon: RefreshCw,      iconBg: 'bg-amber-600',   badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' },
    { period: 'AOÛT-SEPTEMBRE', type: 'okr',               title: 'Pilotage OKR Q3',         desc: 'Sprint commercial Q3 · Finalisation deals · Suivi NPS · Rapport pipeline hebdomadaire',                                             months: [8,9],    icon: TrendingUp,     iconBg: 'bg-teal-600',    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    { period: 'OCTOBRE',        type: 'performance',       title: 'Q3 Review',               desc: 'Checkpoint rapide · 30 min · Trajectoire fin d\'année · Préparation évaluation finale',                                              months: [10],     icon: CheckCircle2,   iconBg: 'bg-emerald-600', badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' },
    { period: 'NOVEMBRE',       type: 'okr',               title: 'Pilotage OKR Q4',         desc: 'Clôture pipeline · Signature deals · Finalisation livrables · Collecte NPS',                                                        months: [11],     icon: TrendingUp,     iconBg: 'bg-teal-600',    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    { period: 'DÉCEMBRE',       type: 'performance+prime', title: 'Évaluation finale',       desc: 'Score global automatique · Prime calculée · Commentaires croisés · Validation DRH · Archivage · Plan développement N+1',           months: [12],     icon: Trophy,         iconBg: 'bg-yellow-600',  badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
];

const TYPE_BADGE_LABEL = { 'performance': 'Performance', 'okr': 'OKR', 'performance+prime': 'Performance + Prime' };

function VueCycleAnnuel() {
    const moisCourant = new Date().getMonth() + 1;

    return (
        <div>
            <div className="mb-5">
                <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Cycle de performance annuel</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                    Modèle hybride : 2 évaluations formelles · 1 mid-review · 2 checkpoints légers · pilotage OKR continu
                </p>
            </div>

            <div className="relative">
                {/* Ligne verticale */}
                <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gray-200 dark:bg-dark-700" />

                <div className="space-y-5">
                    {CYCLE_TIMELINE.map((item, i) => {
                        const Icon = item.icon;
                        const isActive = item.months.includes(moisCourant);
                        return (
                            <div key={i} className="flex gap-4 relative">
                                {/* Cercle */}
                                <div className={`h-10 w-10 rounded-full ${item.iconBg} flex items-center justify-center text-white shrink-0 z-10 ring-4 ${isActive ? 'ring-violet-200 dark:ring-violet-500/30' : 'ring-white dark:ring-dark-950'}`}>
                                    <Icon className="h-4 w-4" />
                                </div>

                                {/* Contenu */}
                                <div className="flex-1 pb-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.period}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                                            {TYPE_BADGE_LABEL[item.type]}
                                        </span>
                                        {isActive && (
                                            <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase">← Maintenant</span>
                                        )}
                                    </div>
                                    <p className={`text-[14px] font-bold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {item.title}
                                    </p>
                                    <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PerformanceIndex({ fiches, collaborateurs, cycles, stats, objectifs = [] }) {
    const { flash } = usePage().props;

    const [activeView, setActiveView]         = useState('fiches');
    const [selectedFiche, setSelectedFiche]   = useState(null);
    const [midYearFiche, setMidYearFiche]     = useState(null);
    const [evalFinaleFiche, setEvalFinaleFiche] = useState(null);
    const [isCreateOpen, setIsCreateOpen]     = useState(false);
    const [createDefaultCollab, setCreateDefaultCollab] = useState(null);
    const [search, setSearch]                 = useState('');
    const [cycleFiltré, setCycleFiltré]       = useState('');

    // Fiche à jour (après re-render Inertia)
    const displayedFiche = selectedFiche
        ? fiches.find(f => f.id === selectedFiche.id) || selectedFiche
        : null;

    // Map collaborateur_id → fiche sur le cycle filtré (ou tous)
    const ficheParCollab = useMemo(() => {
        const filtered = cycleFiltré ? fiches.filter(f => f.cycle === cycleFiltré) : fiches;
        return Object.fromEntries(filtered.map(f => [f.collaborateur_id, f]));
    }, [fiches, cycleFiltré]);

    const fichesFiltrees = useMemo(() => {
        let result = fiches;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(f =>
                `${f.collaborateur?.prenom} ${f.collaborateur?.nom}`.toLowerCase().includes(q)
            );
        }
        if (cycleFiltré) result = result.filter(f => f.cycle === cycleFiltré);
        return result;
    }, [fiches, search, cycleFiltré]);

    const viewCounts = {
        fiches:     stats.total,
        workflow:   stats.en_revision + stats.attente_drh,
        cycle:      null,
        mid_review: stats.en_revision,
        evaluation: stats.attente_drh,
    };

    const handleOpenCreate = (collab = null) => {
        setCreateDefaultCollab(collab);
        setIsCreateOpen(true);
    };

    const cycleOptions = cycles.map(c => ({ value: c, label: c }));

    return (
        <AppLayout title="Module Performance">

            {/* ── Page header ───────────────────────────────────── */}
            <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 shrink-0">
                        <ClipboardCheck className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Module Performance</h1>
                        <p className="text-[12px] text-gray-400 mt-0.5 hidden sm:block">
                            Fiches individuelles · Workflow · Cycle annuel · Score normalisé
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('synthese.consolidation'))}>
                        <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                        <span className="hidden lg:inline">Vue consolidée</span>
                        <span className="lg:hidden">Consolidation</span>
                    </Button>
                    <Button variant="outline" size="sm" disabled className="opacity-60 cursor-not-allowed">
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* ── Stats header ──────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-6 gap-2 mb-5">
                {[
                    { label: 'Total fiches',    value: stats.total,               color: 'text-gray-600',    bg: 'bg-gray-50 dark:bg-dark-800 border-gray-200 dark:border-dark-700', onClick: () => setActiveView('fiches') },
                    { label: 'Brouillon',       value: stats.brouillon,           color: 'text-gray-500',    bg: 'bg-gray-50 dark:bg-dark-800 border-gray-200 dark:border-dark-700', onClick: null },
                    { label: 'En révision',     value: stats.en_revision,         color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', onClick: () => setActiveView('workflow') },
                    { label: 'Attente DRH',     value: stats.attente_drh,         color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', onClick: () => setActiveView('workflow') },
                    { label: 'Confirmées',      value: stats.confirme,            color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', onClick: null },
                    { label: 'Rév. demandée',   value: stats.revision_demandee,   color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20', onClick: () => setActiveView('workflow') },
                ].map((s, i) => (
                    <div key={i} onClick={s.onClick}
                        className={`rounded-xl border px-3 py-2.5 ${s.bg} ${s.onClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Layout principal ───────────────────────────────── */}
            <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 220px)' }}>

                {/* ── Sidebar module ─────────────────────────────── */}
                <aside className="w-44 shrink-0 sticky top-20 self-start z-10">
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
                        <div className="px-4 py-4 border-b border-gray-100 dark:border-dark-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-5">Module</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Performance</p>
                        </div>
                        <nav className="p-2 space-y-1">
                            {SIDEBAR_VIEWS.map(view => {
                                const Icon = view.icon;
                                const isAct = activeView === view.key;
                                const count = viewCounts[view.key];
                                return (
                                    <button key={view.key} onClick={() => setActiveView(view.key)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left ${
                                            isAct
                                                ? 'bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-white'
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800/50 hover:text-gray-900 dark:hover:text-white'
                                        }`}>
                                        <Icon className={`h-4 w-4 shrink-0 ${isAct ? view.accent : 'text-gray-400'}`} />
                                        <span className="flex-1">{view.label}</span>
                                        {count != null && count > 0 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* ── Contenu principal ──────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-4">

                    {flash?.success && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
                            {flash.success}
                        </motion.div>
                    )}

                    {/* ─ Vue : Fiches individuelles ──────────────── */}
                    {activeView === 'fiches' && (
                        <>
                            {/* Barre d'actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Cycle :</span>
                                    <CustomSelect
                                        value={cycleFiltré}
                                        onChange={setCycleFiltré}
                                        options={cycleOptions}
                                        placeholder="Tous"
                                        nullable
                                        nullLabel="Tous les cycles"
                                        className="min-w-[110px]"
                                    />
                                </div>
                                <div className="relative flex-1 min-w-[120px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <Input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Rechercher…"
                                        className="pl-9 h-8 text-[13px]"
                                    />
                                </div>
                                <Button size="sm" onClick={() => handleOpenCreate()} className="shrink-0">
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Nouvelle fiche
                                </Button>
                            </div>

                            {/* Grille de fiches */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {/* Fiches existantes */}
                                {fichesFiltrees.map(f => (
                                    <FicheCard
                                        key={f.id}
                                        fiche={f}
                                        onOpen={setSelectedFiche}
                                        onMidReview={setMidYearFiche}
                                        onEvalFinale={setEvalFinaleFiche}
                                        onCreateFiche={handleOpenCreate}
                                    />
                                ))}

                                {/* Collaborateurs sans fiche (uniquement si pas de filtre cycle) */}
                                {!cycleFiltré && !search && collaborateurs
                                    .filter(c => !ficheParCollab[c.id])
                                    .map(c => (
                                        <FicheCard
                                            key={`empty-${c.id}`}
                                            fiche={null}
                                            collaborateur={c}
                                            onOpen={() => {}}
                                            onMidReview={() => {}}
                                            onEvalFinale={() => {}}
                                            onCreateFiche={handleOpenCreate}
                                        />
                                    ))
                                }

                                {fichesFiltrees.length === 0 && (
                                    <div className="col-span-3 flex flex-col items-center justify-center py-16 text-gray-400">
                                        <ClipboardCheck className="h-10 w-10 mb-3" />
                                        <p className="text-sm">Aucune fiche trouvée</p>
                                        <Button size="sm" variant="outline" className="mt-3" onClick={() => handleOpenCreate()}>
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Créer la première fiche
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ─ Vue : Workflow validation ───────────────── */}
                    {activeView === 'workflow' && (
                        <VueWorkflow fiches={fiches} onOpen={setSelectedFiche} />
                    )}

                    {/* ─ Vue : Cycle annuel ──────────────────────── */}
                    {activeView === 'cycle' && <VueCycleAnnuel />}

                    {/* ─ Vue : Mid-Year Review ───────────────────── */}
                    {activeView === 'mid_review' && (
                        <div className="space-y-4">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Mid-Year Reviews</h2>
                                    <p className="text-[12px] text-gray-400 mt-0.5">Évaluations mi-parcours · Juillet {new Date().getFullYear()}</p>
                                </div>
                                <Button variant="outline" size="sm" disabled className="opacity-60">
                                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Synchroniser OKR
                                </Button>
                            </div>

                            {fiches.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-gray-400">
                                    <RefreshCw className="h-8 w-8 mb-2" />
                                    <p className="text-sm">Aucune fiche disponible</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 divide-y divide-gray-100 dark:divide-dark-800">
                                    {fiches.map(f => {
                                        const midDone = !!f.commentaire_mid_year_manager;
                                        const scoreLabel = getScoreLabel(f.score_global);
                                        const collab = f.collaborateur;
                                        return (
                                            <div key={f.id} className="flex items-center gap-4 px-4 py-3">
                                                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${scoreColorBg(f.score_global)}`}>
                                                    {getInitiales(collab?.prenom, collab?.nom)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                                                        {collab?.prenom} {collab?.nom}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">{collab?.practice || collab?.poste}</p>
                                                    {midDone ? (
                                                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            <span>Mid-review effectuée</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                                            <Trophy className="h-3 w-3" />
                                                            <span>Mid-review en attente</span>
                                                        </div>
                                                    )}
                                                    {midDone && f.commentaire_mid_year_manager && (
                                                        <p className="text-[11px] text-gray-400 italic mt-0.5 truncate max-w-xs">
                                                            "{f.commentaire_mid_year_manager}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="text-right">
                                                        <span className={`text-[16px] font-black ${scoreColor(f.score_global)}`}>
                                                            {f.score_global !== null ? `${formatNumber(f.score_global, 1)}/5` : '—'}
                                                        </span>
                                                        {scoreLabel && (
                                                            <p className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${scoreLabel.color}`}>
                                                                {scoreLabel.label}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        {!midDone ? (
                                                            <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white text-[11px] px-2.5"
                                                                onClick={() => setMidYearFiche(f)}>
                                                                Conduire la review
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm" variant="outline" className="text-[11px] px-2.5"
                                                                onClick={() => setMidYearFiche(f)}>
                                                                Modifier
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="outline" className="text-[11px] px-2.5"
                                                            onClick={() => setSelectedFiche(f)}>
                                                            Voir la fiche
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─ Vue : Évaluation finale ─────────────────── */}
                    {activeView === 'evaluation' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">Évaluations finales</h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">Clôture du cycle · Décembre {new Date().getFullYear()}</p>
                            </div>

                            {fiches.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-gray-400">
                                    <Trophy className="h-8 w-8 mb-2" />
                                    <p className="text-sm">Aucune fiche disponible</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 divide-y divide-gray-100 dark:divide-dark-800">
                                    {fiches.map(f => {
                                        const scoreLabel = getScoreLabel(f.score_global);
                                        const prime = primeEstimee(f);
                                        const collab = f.collaborateur;
                                        const evalDone = f.statut === 'confirme';
                                        return (
                                            <div key={f.id} className="flex items-center gap-4 px-4 py-3">
                                                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${scoreColorBg(f.score_global)}`}>
                                                    {getInitiales(collab?.prenom, collab?.nom)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                                                        {collab?.prenom} {collab?.nom}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">{collab?.practice || collab?.poste}</p>
                                                    <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                                        <Trophy className="h-3 w-3" />
                                                        <span>{evalDone ? 'Évaluation confirmée' : 'Évaluation finale en attente'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="text-right">
                                                        <span className={`text-[16px] font-black ${scoreColor(f.score_global)}`}>
                                                            {f.score_global !== null ? `${formatNumber(f.score_global, 1)}/5` : '—'}
                                                        </span>
                                                        {prime !== null && (
                                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                                                Prime estimée : {prime.toLocaleString('fr-FR')} GNF
                                                            </p>
                                                        )}
                                                        {scoreLabel && (
                                                            <p className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${scoreLabel.color}`}>
                                                                {scoreLabel.label}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        {!evalDone && (
                                                            <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white text-[11px] px-2.5"
                                                                onClick={() => setEvalFinaleFiche(f)}>
                                                                Conduire l'éval.
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="outline" className="text-[11px] px-2.5"
                                                            onClick={() => setSelectedFiche(f)}>
                                                            Voir la fiche
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Slide-over fiche ────────────────────────────────── */}
            <AnimatePresence>
                {displayedFiche && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
                            onClick={() => setSelectedFiche(null)}
                        />
                        <EditScoresPanel
                            key="panel"
                            fiche={displayedFiche}
                            onClose={() => setSelectedFiche(null)}
                            objectifs={objectifs}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* ── Modal créer fiche ───────────────────────────────── */}
            <CreateFicheModal
                open={isCreateOpen}
                onClose={() => { setIsCreateOpen(false); setCreateDefaultCollab(null); }}
                collaborateurs={collaborateurs}
                fichesExistantes={fiches}
                defaultCollab={createDefaultCollab}
            />

            {/* ── Modal Mid-Year Review ────────────────────────────── */}
            {midYearFiche && (
                <MidYearReviewModal
                    fiche={fiches.find(f => f.id === midYearFiche.id) || midYearFiche}
                    open={!!midYearFiche}
                    onClose={() => setMidYearFiche(null)}
                />
            )}

            {/* ── Modal Évaluation finale ──────────────────────────── */}
            {evalFinaleFiche && (
                <EvaluationFinaleModal
                    fiche={fiches.find(f => f.id === evalFinaleFiche.id) || evalFinaleFiche}
                    open={!!evalFinaleFiche}
                    onClose={() => setEvalFinaleFiche(null)}
                />
            )}
        </AppLayout>
    );
}
