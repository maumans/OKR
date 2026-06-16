import { useState, useMemo, useEffect } from 'react';
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
    { value: 'brouillon',       label: 'Brouillon',        color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    { value: 'auto_evaluation', label: 'Auto-évaluation',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    { value: 'attente_drh',     label: 'Attente DRH',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    { value: 'confirme',        label: 'Confirmé',         color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { value: 'contestation',    label: 'Contestée',        color: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400' },
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
                {(fiche.statut === 'auto_evaluation' && fiche.accord_collab) && (
                    <span title="Collaborateur a approuvé" className="flex items-center text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                    </span>
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

// ─── Cycles prédéfinis (générés sur 2 ans glissants) ────────────────────────

function genererCycles() {
    const anneeActuelle = new Date().getFullYear();
    const cycles = [];
    for (const annee of [anneeActuelle - 1, anneeActuelle, anneeActuelle + 1]) {
        cycles.push(
            { value: `Q1 ${annee}`, label: `Q1 ${annee} (Jan–Mar)`,  type: 'trimestriel', debut: `${annee}-01-01`, fin: `${annee}-03-31` },
            { value: `Q2 ${annee}`, label: `Q2 ${annee} (Avr–Juin)`, type: 'trimestriel', debut: `${annee}-04-01`, fin: `${annee}-06-30` },
            { value: `Q3 ${annee}`, label: `Q3 ${annee} (Juil–Sep)`, type: 'trimestriel', debut: `${annee}-07-01`, fin: `${annee}-09-30` },
            { value: `Q4 ${annee}`, label: `Q4 ${annee} (Oct–Déc)`,  type: 'trimestriel', debut: `${annee}-10-01`, fin: `${annee}-12-31` },
            { value: `Annuel ${annee}`, label: `Annuel ${annee}`,     type: 'annuel',      debut: `${annee}-01-01`, fin: `${annee}-12-31` },
        );
    }
    return cycles;
}

const CYCLES_PREDEFINIS = genererCycles();

// ─── CreateFicheModal ─────────────────────────────────────────────────────────

function CreateFicheModal({ open, onClose, collaborateurs, fichesExistantes, defaultCollab }) {
    const cycleParDefaut = CYCLES_PREDEFINIS.find(c => c.value === `Q3 ${new Date().getFullYear()}`) || CYCLES_PREDEFINIS[0];

    const [form, setForm] = useState({
        collaborateur_id: defaultCollab?.id?.toString() || '',
        cycle:        cycleParDefaut.value,
        type_cycle:   cycleParDefaut.type,
        periode_debut: cycleParDefaut.debut,
        periode_fin:   cycleParDefaut.fin,
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

    const handleCycleChange = (val) => {
        const meta = CYCLES_PREDEFINIS.find(c => c.value === val);
        setForm(p => ({
            ...p,
            cycle:         val,
            type_cycle:    meta?.type  || p.type_cycle,
            periode_debut: meta?.debut || p.periode_debut,
            periode_fin:   meta?.fin   || p.periode_fin,
        }));
    };

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

    const cycleDejaExiste = form.collaborateur_id &&
        cyclesDejaPris[form.collaborateur_id]?.has(form.cycle);

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
                        <CustomSelect
                            value={form.cycle}
                            onChange={handleCycleChange}
                            options={CYCLES_PREDEFINIS.map(c => ({ value: c.value, label: c.label }))}
                            error={errors.cycle}
                        />
                        {cycleDejaExiste && (
                            <p className="text-xs text-red-500 mt-1">Une fiche existe déjà pour ce collaborateur sur ce cycle.</p>
                        )}
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

function EditScoresPanel({ fiche, onClose, auth }) {
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
        return f;
    };

    const [form, setForm]               = useState(initForm);
    const [workflowComment, setWorkflowComment] = useState('');
    const [errors, setErrors]           = useState({});
    const [saving, setSaving]           = useState(false);
    const [advancing, setAdvancing]     = useState(false);
    const [syncing, setSyncing]         = useState(false);

    // Réinitialiser les scores du formulaire quand la fiche est mise à jour côté serveur
    // (après une sync OKR ou un save par un autre onglet)
    useEffect(() => {
        setForm(prev => {
            const updated = { ...prev };
            DIMENSIONS.forEach(d => {
                const val = fiche[d.scoreKey];
                updated[d.scoreKey] = (val !== null && val !== undefined)
                    ? String(Math.round(val))
                    : null;
            });
            return updated;
        });
    }, [
        fiche.score_commercial, fiche.score_delivery,
        fiche.score_developpement, fiche.score_comportemental,
    ]);

    const isLocked = fiche.verrouille;
    const previewScore = calcScoreGlobal({
        ...form,
        poids_commercial:    fiche.poids_commercial ?? 0.50,
        poids_delivery:      fiche.poids_delivery ?? 0.25,
        poids_developpement: fiche.poids_developpement ?? 0.15,
        poids_comportemental:fiche.poids_comportemental ?? 0.10,
    });

    // ── Rôles de l'utilisateur courant ─────────────────────────────────────
    const myCollab    = auth?.collaborateur;
    const isGest      = myCollab?.isAdmin || myCollab?.isDirecteur || myCollab?.isManager;
    const isDRH       = myCollab?.isDRH || myCollab?.isAdmin;
    const isEvalue    = myCollab?.id === fiche.collaborateur_id;

    // Seul le collaborateur évalué peut saisir ses propres champs en auto-évaluation
    const canEditCollabFields = isEvalue && !isLocked && fiche.statut === 'auto_evaluation';
    // Le manager/admin/dir peut modifier les scores et les champs manager
    const canEditManagerFields = isGest && !isLocked;

    // ── Transitions disponibles selon le rôle ──────────────────────────────
    const ALL_TRANSITIONS = {
        brouillon: [
            { value: 'auto_evaluation', label: 'Envoyer au collaborateur',  icon: ChevronRight, color: 'bg-amber-500 hover:bg-amber-600', roles: 'gest' },
        ],
        auto_evaluation: [
            { value: 'attente_drh',  label: 'Soumettre à la DRH',   icon: ChevronRight, color: 'bg-blue-500 hover:bg-blue-600',  roles: 'gest' },
            { value: 'contestation', label: 'Contester la fiche',    icon: RotateCcw,    color: 'bg-pink-500 hover:bg-pink-600',  roles: 'evalue' },
        ],
        attente_drh: [
            { value: 'confirme',        label: '✓ Approuver (DRH)',          icon: CheckCircle2, color: 'bg-emerald-500 hover:bg-emerald-600', roles: 'drh' },
            { value: 'auto_evaluation', label: 'Renvoyer au collaborateur',  icon: RotateCcw,    color: 'bg-amber-500 hover:bg-amber-600',     roles: 'drh' },
        ],
        confirme: [],
        contestation: [
            { value: 'auto_evaluation', label: 'Reprendre la révision', icon: ChevronRight, color: 'bg-amber-500 hover:bg-amber-600', roles: 'gest' },
        ],
    };

    // Filtrer selon le rôle réel
    const WORKFLOW_TRANSITIONS = Object.fromEntries(
        Object.entries(ALL_TRANSITIONS).map(([statut, transitions]) => [
            statut,
            (transitions || []).filter(t => {
                if (t.roles === 'gest')   return isGest;
                if (t.roles === 'drh')    return isDRH;
                if (t.roles === 'evalue') return isEvalue;
                return true;
            }),
        ])
    );

    const handleSave = () => {
        setSaving(true);
        router.put(route('performance.update', fiche.id), form, {
            preserveState: true, preserveScroll: true,
            onError: (errs) => { setErrors(errs); setSaving(false); },
            onSuccess: () => setSaving(false),
        });
    };

    const handleValiderCollab = () => {
        if (!confirm('Confirmer que vous avez pris connaissance et approuvez cette fiche de performance ?')) return;
        router.post(route('performance.valider-collab', fiche.id), {}, {
            preserveState: true, preserveScroll: true,
            onError: (errs) => setErrors(errs),
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
        if (!confirm('Calculer les scores automatiquement ?\n\n• Commercial ← tous les KRs CRM du collaborateur\n• Delivery ← tous les OKRs liés à une Mission/Projet\n\nLes scores seront mis à jour.')) return;
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
                    {!isLocked && isGest && (
                        <button onClick={handleSyncOkr} disabled={syncing}
                            title="Calcule les scores Commercial et Delivery depuis les KRs CRM et OKRs Missions"
                            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-60 text-white ${fiche.okr_synced_at ? 'bg-teal-600 hover:bg-teal-500' : 'bg-amber-500 hover:bg-amber-400'}`}>
                            <TrendingUp className="h-3 w-3" />
                            {syncing ? 'Calcul…' : 'Calculer les scores'}
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
                                            disabled={isLocked || !canEditManagerFields}
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
                                            disabled={isLocked || !canEditCollabFields}
                                            className="text-[12px] font-semibold border border-gray-200 dark:border-dark-700 rounded-lg px-2 py-1 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                                        >
                                            {SCORE_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Objectif + cible — uniquement pour Développement et Comportemental (saisie manuelle manager) */}
                            <div className="space-y-1.5">
                                {(d.key !== 'commercial' && d.key !== 'delivery') && (
                                    <>
                                        <Input
                                            value={form[`objectif_${d.key}`]}
                                            onChange={e => set(`objectif_${d.key}`, e.target.value)}
                                            placeholder="Titre de l'objectif…"
                                            disabled={isLocked || !canEditManagerFields}
                                            className="text-[12px] h-8"
                                        />
                                        <Input
                                            value={form[`cible_${d.key}`]}
                                            onChange={e => set(`cible_${d.key}`, e.target.value)}
                                            placeholder="Cible : ex. 2 formations, obtenir certification…"
                                            disabled={isLocked || !canEditManagerFields}
                                            className="text-[12px] h-8 text-gray-400"
                                        />
                                    </>
                                )}
                                {/* Source automatique (Commercial = KRs CRM, Delivery = OKRs Missions) */}
                                {(d.key === 'commercial' || d.key === 'delivery') && (() => {
                                    const synced = !!fiche.okr_synced_at;
                                    const syncDate = fiche.okr_synced_at
                                        ? new Date(fiche.okr_synced_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : null;
                                    return (
                                        <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg border ${synced ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'}`}>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp className={`h-3 w-3 shrink-0 ${synced ? 'text-teal-500' : 'text-amber-500'}`} />
                                                    <span className={`text-[10px] font-semibold ${synced ? 'text-teal-700 dark:text-teal-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                        {d.key === 'commercial' ? 'Source : KRs CRM' : 'Source : OKRs Missions'}
                                                    </span>
                                                </div>
                                                {syncDate && (
                                                    <span className="text-[9px] text-gray-400 pl-4.5">
                                                        Calculé le {syncDate}
                                                    </span>
                                                )}
                                            </div>
                                            {scoreAuto !== null && scoreAuto !== undefined ? (
                                                <span className={`text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-full border ${synced ? 'text-teal-700 dark:text-teal-400 bg-white dark:bg-teal-500/20 border-teal-200 dark:border-teal-500/30' : 'text-amber-700 dark:text-amber-400 bg-white dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30'}`}>
                                                    ↑ Auto {scoreAuto}/5
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 italic font-medium">
                                                    En attente de calcul
                                                </span>
                                            )}
                                        </div>
                                    );
                                })()}
                                {/* Score auto OKR (dimensions sans source automatique) */}
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
                                        disabled={isLocked || !canEditManagerFields}
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Commentaire collaborateur</p>
                                    <Textarea
                                        value={form[`commentaire_collaborateur_${d.key}`]}
                                        onChange={e => set(`commentaire_collaborateur_${d.key}`, e.target.value)}
                                        placeholder="Auto-évaluation…"
                                        rows={2}
                                        disabled={isLocked || !canEditCollabFields}
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
                    {/* Bandeau rôle contexte */}
                    {fiche.statut === 'auto_evaluation' && isEvalue && !isGest && (
                        <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                            <strong>Auto-évaluation :</strong> Saisissez vos commentaires et scores. Cliquez <strong>"J'approuve"</strong> si vous êtes d'accord, ou <strong>"Contester"</strong> pour demander des corrections.
                        </div>
                    )}
                    {fiche.statut === 'auto_evaluation' && isGest && fiche.accord_collab && (
                        <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            Le collaborateur a approuvé cette fiche — vous pouvez soumettre à la DRH.
                        </div>
                    )}
                    {fiche.statut === 'contestation' && isGest && (
                        <div className="px-3 py-2 rounded-lg bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 text-[11px] text-pink-800 dark:text-pink-300">
                            <strong>Fiche contestée :</strong> Le collaborateur a demandé des corrections. Apportez vos modifications puis reprenez la révision.
                        </div>
                    )}
                    {fiche.statut === 'attente_drh' && isDRH && (
                        <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-[11px] text-blue-800 dark:text-blue-300">
                            <strong>Attente DRH :</strong> Vérifiez les objectifs, poids et scores. Approuvez ou renvoyez en auto-évaluation.
                        </div>
                    )}

                    {/* Bouton accord collaborateur */}
                    {fiche.statut === 'auto_evaluation' && isEvalue && !isGest && (
                        fiche.accord_collab ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                Vous avez approuvé cette fiche
                            </div>
                        ) : (
                            <button onClick={handleValiderCollab}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold transition-colors">
                                <CheckCircle2 className="h-3.5 w-3.5" /> J'approuve cette fiche
                            </button>
                        )
                    )}

                    {/* Transitions workflow filtrées par rôle */}
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

                    {/* Bouton Enregistrer : visible si le user peut modifier quelque chose */}
                    {(canEditManagerFields || canEditCollabFields) && (
                        <div className="flex gap-2">
                            <Button className="flex-1" onClick={handleSave} disabled={saving}>
                                {saving ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                            {fiche.statut === 'brouillon' && isGest && (
                                <Button variant="outline" size="icon" onClick={handleDelete}
                                    className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
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
    { statut: 'brouillon',       label: 'Brouillon',       color: 'bg-gray-100 dark:bg-dark-800',         badge: 'bg-gray-500 text-white',       icon: '📝' },
    { statut: 'auto_evaluation', label: 'Auto-évaluation', color: 'bg-amber-50 dark:bg-amber-500/10',     badge: 'bg-amber-500 text-white',       icon: '✏️' },
    { statut: 'attente_drh',     label: 'Attente DRH',     color: 'bg-blue-50 dark:bg-blue-500/10',       badge: 'bg-blue-500 text-white',        icon: '🏛' },
    { statut: 'confirme',        label: 'Confirmé',        color: 'bg-emerald-50 dark:bg-emerald-500/10', badge: 'bg-emerald-500 text-white',     icon: '✅' },
    { statut: 'contestation',    label: 'Contestée',       color: 'bg-pink-50 dark:bg-pink-500/10',       badge: 'bg-pink-500 text-white',        icon: '⚠️' },
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

export default function PerformanceIndex({ fiches, collaborateurs, cycles, stats, auth, peutVoirTout = false }) {
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
        workflow:   stats.auto_evaluation + stats.attente_drh + stats.contestation,
        cycle:      null,
        mid_review: stats.auto_evaluation,
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
                    { label: 'Auto-éval.',      value: stats.auto_evaluation,     color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', onClick: () => setActiveView('workflow') },
                    { label: 'Attente DRH',     value: stats.attente_drh,         color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', onClick: () => setActiveView('workflow') },
                    { label: 'Confirmées',      value: stats.confirme,            color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', onClick: null },
                    { label: 'Contestées',      value: stats.contestation,        color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20', onClick: () => setActiveView('workflow') },
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
                                {(peutVoirTout || auth?.collaborateur?.isManager) && (
                                    <Button size="sm" onClick={() => handleOpenCreate()} className="shrink-0">
                                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Nouvelle fiche
                                    </Button>
                                )}
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

                                {/* Collaborateurs sans fiche — visible uniquement pour Manager/Admin/Dir/DRH */}
                                {!cycleFiltré && !search && (peutVoirTout || auth?.collaborateur?.isManager) && collaborateurs
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
                                        {(peutVoirTout || auth?.collaborateur?.isManager) && (
                                            <Button size="sm" variant="outline" className="mt-3" onClick={() => handleOpenCreate()}>
                                                <Plus className="h-3.5 w-3.5 mr-1" /> Créer la première fiche
                                            </Button>
                                        )}
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
                            auth={auth}
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
