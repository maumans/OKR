import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { NumberInput } from '@/Components/ui/NumberInput';
import {
    LayoutGrid, List, UserPlus, TrendingUp, BarChart3,
    Briefcase, Plus, Search, RefreshCw, MoreVertical,
    Pencil, Trash2, Users, Target, Award, Building2,
    ChevronRight, Phone, Mail, FileText, Clock,
    Activity, Monitor, Tag, CheckCheck, XCircle, RefreshCcw, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';

// ── Constants ──────────────────────────────────────────────────────────────
const ACTIF_STATUTS = ['decouverte', 'proposition', 'negociation'];

const KANBAN_COLS = [
    { key: 'decouverte',  label: 'Découverte',  color: '#6b7280', dot: 'bg-gray-400',   headerBg: 'bg-gray-100 dark:bg-dark-800' },
    { key: 'proposition', label: 'Proposition', color: '#f59e0b', dot: 'bg-amber-400',  headerBg: 'bg-amber-50 dark:bg-amber-900/20' },
    { key: 'negociation', label: 'Négociation', color: '#eab308', dot: 'bg-yellow-400', headerBg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { key: 'gagne',       label: 'Gagné',       color: '#22c55e', dot: 'bg-green-400',  headerBg: 'bg-green-50 dark:bg-green-900/20' },
    { key: 'perdu',       label: 'Perdu',       color: '#ef4444', dot: 'bg-red-400',    headerBg: 'bg-red-50 dark:bg-red-900/20' },
];

const TYPE_DEAL = {
    nouveau_client: { label: 'Nouveau',        cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    upsell:         { label: 'Upsell',          cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    renouvellement: { label: 'Renouvellement',  cls: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
};

const SIDEBAR_VIEWS = [
    { key: 'kanban',    label: 'Pipeline Kanban',       icon: LayoutGrid },
    { key: 'liste',     label: 'Liste des deals',        icon: List },
    { key: 'activites', label: 'Activités commerciales', icon: Activity },
    { key: 'clients',   label: 'Clients',                icon: Building2 },
    { key: 'nouveaux',  label: 'Nouveaux clients',       icon: UserPlus },
    { key: 'upsells',   label: 'Upsells',                icon: TrendingUp },
    { key: 'stats',     label: 'Stats',                  icon: BarChart3 },
];

const ACTIVITE_TYPES = {
    contact_initie:      { label: 'Contact initié',      icon: Phone,       color: '#ec4899', bg: 'bg-pink-100 dark:bg-pink-900/30',    text: 'text-pink-700 dark:text-pink-300' },
    demo_realisee:       { label: 'Démo réalisée',       icon: Monitor,     color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
    proposition_envoyee: { label: 'Proposition envoyée', icon: FileText,    color: '#6b7280', bg: 'bg-gray-100 dark:bg-gray-700/30',     text: 'text-gray-600 dark:text-gray-300' },
    relance_effectuee:   { label: 'Relance effectuée',   icon: RefreshCw,   color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300' },
    negociation_engagee: { label: 'Négociation engagée', icon: Tag,         color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300' },
    deal_signe:          { label: 'Deal signé',           icon: CheckCheck,  color: '#22c55e', bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-300' },
    deal_perdu:          { label: 'Deal perdu',           icon: XCircle,     color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300' },
};

const ACTION_TYPES = {
    appel:    { label: 'Appel',    icon: Phone,      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    email:    { label: 'Email',    icon: Mail,        cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
    reunion:  { label: 'Réunion',  icon: Users,       cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    note:     { label: 'Note',     icon: FileText,    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    relance:  { label: 'Relance',  icon: RefreshCw,   cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0));

function CollabAvatar({ prenom, nom, cls = 'h-7 w-7' }) {
    const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
    const idx = ((prenom?.charCodeAt(0) || 0) + (nom?.charCodeAt(0) || 0)) % COLORS.length;
    const ini = ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?';
    return (
        <div className={`${cls} rounded-full ${COLORS[idx]} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
            {ini}
        </div>
    );
}

// ── Action Modal ───────────────────────────────────────────────────────────
function ActionModal({ open, onClose, deal }) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({ type: 'appel', description: '', date_action: today, duree: '', resultat: '' });
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = () => {
        router.post(route('prospects.actions.store', deal.id), {
            ...form,
            duree: form.duree !== '' ? parseInt(form.duree) : null,
        }, {
            preserveState: true,
            onSuccess: () => { onClose(); toast.success('Action enregistrée.'); },
        });
    };

    const iCls = 'mt-1 w-full px-3 py-2 text-[12px] border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30';
    const lCls = 'text-[10px] font-bold text-gray-400 uppercase tracking-wider';

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[15px]">
                        Nouvelle action — {deal?.titre || deal?.nom}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-1">
                    <div>
                        <label className={lCls}>Type</label>
                        <select value={form.type} onChange={e => setF('type', e.target.value)} className={iCls}>
                            {Object.entries(ACTION_TYPES).map(([k, def]) => (
                                <option key={k} value={k}>{def.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={lCls}>Description</label>
                        <textarea value={form.description} onChange={e => setF('description', e.target.value)}
                            rows={2} placeholder="Détails de l'action..."
                            className={iCls + ' resize-none'} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={lCls}>Date</label>
                            <input type="date" value={form.date_action} onChange={e => setF('date_action', e.target.value)} className={iCls} />
                        </div>
                        <div>
                            <label className={lCls}>Durée (min)</label>
                            <NumberInput value={form.duree} onChange={v => setF('duree', v)}
                                placeholder="30" min={0} className={iCls} />
                        </div>
                    </div>
                    <div>
                        <label className={lCls}>Résultat</label>
                        <textarea value={form.resultat} onChange={e => setF('resultat', e.target.value)}
                            rows={2} placeholder="Résultat / suite à donner..."
                            className={iCls + ' resize-none'} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button onClick={submit}>Enregistrer</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Deal Detail Panel ──────────────────────────────────────────────────────
function DealDetailPanel({ open, onClose, deal, onAddAction }) {
    if (!deal) return null;
    const col = KANBAN_COLS.find(c => c.key === deal.statut);
    const tDef = TYPE_DEAL[deal.type_deal] || TYPE_DEAL.nouveau_client;

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-[15px]">
                        {deal.titre || deal.nom}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-1">
                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Valeur</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{fmt(deal.valeur)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Probabilité</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{deal.probabilite}%</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Étape</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: (col?.color || '#6b7280') + '20', color: col?.color || '#6b7280' }}>
                                {col?.label || deal.statut}
                            </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Type</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tDef.cls}`}>{tDef.label}</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Historique — {(deal.actions || []).length} action{(deal.actions || []).length !== 1 ? 's' : ''}
                            </h3>
                            <Button size="sm" onClick={onAddAction} className="h-7 text-[11px] px-2.5 gap-1">
                                <Plus className="h-3 w-3" /> Ajouter
                            </Button>
                        </div>
                        {(deal.actions || []).length === 0 ? (
                            <p className="text-[12px] text-gray-400 italic text-center py-4">Aucune action enregistrée</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {(deal.actions || []).map(action => {
                                    const aDef = ACTION_TYPES[action.type] || ACTION_TYPES.note;
                                    const AIcon = aDef.icon;
                                    return (
                                        <div key={action.id} className="flex gap-2.5 p-2.5 bg-gray-50 dark:bg-dark-800 rounded-lg">
                                            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full shrink-0 ${aDef.cls}`}>
                                                <AIcon className="h-3.5 w-3.5" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{aDef.label}</span>
                                                    <span className="text-[10px] text-gray-400">{action.date_action}</span>
                                                    {action.duree && (
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                                            <Clock className="h-3 w-3" />{action.duree} min
                                                        </span>
                                                    )}
                                                </div>
                                                {action.description && (
                                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{action.description}</p>
                                                )}
                                                {action.resultat && (
                                                    <p className="text-[11px] text-gray-500 italic mt-0.5">→ {action.resultat}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Deal Card ──────────────────────────────────────────────────────────────
function DealCard({ deal, onEdit, onDelete, onStatusChange, onDetail, onAction, deviseCode }) {
    const tDef = TYPE_DEAL[deal.type_deal] || TYPE_DEAL.nouveau_client;

    return (
        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-3.5 shadow-sm hover:shadow-md transition-shadow group">
            {/* Title + menu */}
            <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-gray-900 dark:text-white leading-tight">
                        {deal.titre || deal.nom}
                    </p>
                    {deal.titre && (
                        <div className="flex items-center gap-1 mt-0.5">
                            {deal.client_id && <Building2 className="h-3 w-3 text-blue-400 shrink-0" />}
                            <p className="text-[11px] text-gray-400 truncate">{deal.nom}</p>
                        </div>
                    )}
                    {!deal.titre && deal.client_id && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 text-blue-400 shrink-0" />
                        </div>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-opacity -mt-0.5 shrink-0">
                            <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem onClick={() => onEdit(deal)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-gray-100 dark:border-dark-700" />
                        {KANBAN_COLS.filter(c => c.key !== deal.statut).map(c => (
                            <DropdownMenuItem key={c.key} onClick={() => onStatusChange(deal.id, c.key)}>
                                <div className={`h-2 w-2 rounded-full ${c.dot} mr-2 shrink-0`} />
                                {c.label}
                            </DropdownMenuItem>
                        ))}
                        <div className="my-1 border-t border-gray-100 dark:border-dark-700" />
                        <DropdownMenuItem onClick={() => onDetail(deal)}>
                            <Clock className="h-3.5 w-3.5 mr-2" /> Voir les actions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction(deal)}>
                            <Plus className="h-3.5 w-3.5 mr-2" /> Ajouter une action
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-gray-100 dark:border-dark-700" />
                        <DropdownMenuItem onClick={() => onDelete(deal.id)} className="text-red-500 focus:text-red-600">
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Montant + probabilité */}
            <div className="flex items-baseline justify-between mt-2.5">
                <span className="text-[14px] font-bold text-gray-800 dark:text-gray-100">
                    {fmt(deal.valeur)}{' '}
                    <span className="text-[10px] font-medium text-gray-400">{deviseCode}</span>
                </span>
                <span className="text-[11px] font-semibold text-gray-400">{deal.probabilite}%</span>
            </div>

            {/* Avatar + badge type */}
            <div className="flex items-center justify-between mt-2.5">
                <CollabAvatar prenom={deal.collaborateur_prenom} nom={deal.collaborateur_nom} cls="h-6 w-6" />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tDef.cls}`}>
                    {tDef.label}
                </span>
            </div>

            {/* Note */}
            {deal.note && (
                <p className="mt-2.5 text-[11px] text-gray-400 italic leading-snug line-clamp-2 border-t border-gray-50 dark:border-dark-800 pt-2">
                    {deal.note}
                </p>
            )}
            {/* Actions badge */}
            {deal.actions_count > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-50 dark:border-dark-800 flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3" />
                    {deal.actions_count} action{deal.actions_count > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}

// ── Kanban Column ──────────────────────────────────────────────────────────
function KanbanColumn({ col, deals, onEdit, onDelete, onStatusChange, onDetail, onAction, deviseCode }) {
    const total = deals.reduce((s, d) => s + (Number(d.valeur) || 0), 0);
    return (
        <div className="flex flex-col min-w-[210px] flex-1">
            <div className={`rounded-t-xl px-3 py-2.5 flex items-center justify-between ${col.headerBg}`}>
                <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{col.label}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-dark-700 text-gray-600 dark:text-gray-300 shadow-sm">{deals.length}</span>
            </div>
            <div className="px-3 py-1.5 bg-white/60 dark:bg-dark-900/60 border-x border-gray-100 dark:border-dark-700">
                <p className="text-[11px] font-semibold text-gray-400">{fmt(total)} {deviseCode}</p>
            </div>
            <div className="flex-1 border-x border-b border-gray-100 dark:border-dark-700 rounded-b-xl p-2 space-y-2 bg-gray-50/40 dark:bg-dark-800/30" style={{ minHeight: 220 }}>
                <AnimatePresence initial={false}>
                    {deals.map(deal => (
                        <motion.div key={deal.id}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.15 }}>
                            <DealCard deal={deal} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onDetail={onDetail} onAction={onAction} deviseCode={deviseCode} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                {deals.length === 0 && (
                    <div className="flex items-center justify-center" style={{ height: 80 }}>
                        <p className="text-[11px] text-gray-300 dark:text-gray-600 italic">Vide</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── ClientModal (Create / Edit) ────────────────────────────────────────────
function ClientModal({ open, onClose, client = null }) {
    const isEdit = !!client;
    const [form, setForm] = useState({
        nom:     client?.nom      || '',
        contact: client?.contact  || '',
        secteur: client?.secteur  || '',
        site_web:client?.site_web || '',
        note:    client?.note     || '',
    });
    const [errors, setErrors] = useState({});
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = () => {
        const opts = {
            preserveState: true,
            onError: setErrors,
            onSuccess: () => { onClose(); toast.success(isEdit ? 'Client mis à jour.' : 'Client créé.'); },
        };
        if (isEdit) {
            router.put(route('clients.update', client.id), form, opts);
        } else {
            router.post(route('clients.store'), form, opts);
        }
    };

    const iCls = 'mt-1 w-full px-3 py-2 text-[12px] border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30';
    const lCls = 'text-[10px] font-bold text-gray-400 uppercase tracking-wider';

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[15px]">
                        {isEdit ? 'Modifier le client' : 'Nouveau client'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-1">
                    <div>
                        <label className={lCls}>Nom de l'entreprise *</label>
                        <input value={form.nom} onChange={e => setF('nom', e.target.value)}
                            placeholder="Ex: SOTELGUI" className={iCls} />
                        {errors.nom && <p className="text-[11px] text-red-500 mt-0.5">{errors.nom}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={lCls}>Contact</label>
                            <input value={form.contact} onChange={e => setF('contact', e.target.value)}
                                placeholder="+224 6XX..." className={iCls} />
                        </div>
                        <div>
                            <label className={lCls}>Secteur</label>
                            <input value={form.secteur} onChange={e => setF('secteur', e.target.value)}
                                placeholder="Banque, Télécoms..." className={iCls} />
                        </div>
                    </div>
                    <div>
                        <label className={lCls}>Site web</label>
                        <input value={form.site_web} onChange={e => setF('site_web', e.target.value)}
                            placeholder="https://..." className={iCls} />
                    </div>
                    <div>
                        <label className={lCls}>Note</label>
                        <textarea value={form.note} onChange={e => setF('note', e.target.value)}
                            rows={2} placeholder="Informations complémentaires..."
                            className={iCls + ' resize-none'} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button onClick={submit}>{isEdit ? 'Enregistrer' : 'Créer le client'}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── DealModal (Create / Edit) ──────────────────────────────────────────────
function DealModal({ open, onClose, collaborateurs, clients, deal = null, defaults = null, deviseCode }) {
    const isEdit = !!deal;
    const [form, setForm] = useState({
        titre:            deal?.titre || '',
        nom:              deal?.nom || defaults?.nom || '',
        client_id:        deal?.client_id ? String(deal.client_id) : (defaults?.client_id || ''),
        contact:          deal?.contact || defaults?.contact || '',
        secteur:          deal?.secteur || defaults?.secteur || '',
        valeur:           deal?.valeur || '',
        probabilite:      deal?.probabilite ?? 20,
        type_deal:        deal?.type_deal || 'nouveau_client',
        statut:           deal?.statut || 'decouverte',
        collaborateur_id: deal?.collaborateur_id ? String(deal.collaborateur_id) : '',
        note:             deal?.note || '',
    });
    const [errors, setErrors] = useState({});
    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleClientSelect = (clientId) => {
        const cl = (clients || []).find(c => String(c.id) === clientId);
        setForm(f => ({
            ...f,
            client_id: clientId,
            nom:     cl?.nom     || f.nom,
            contact: f.contact || cl?.contact || '',
            secteur: f.secteur || cl?.secteur || '',
        }));
    };

    const submit = () => {
        const data = {
            ...form,
            valeur:           form.valeur !== '' ? parseFloat(form.valeur) : null,
            probabilite:      parseInt(form.probabilite) || 0,
            collaborateur_id: form.collaborateur_id || null,
            client_id:        form.client_id || null,
        };
        if (isEdit) {
            router.put(route('prospects.update', deal.id), data, {
                preserveState: true,
                onError: setErrors,
                onSuccess: () => { onClose(); toast.success('Deal mis à jour.'); },
            });
        } else {
            router.post(route('prospects.store'), data, {
                preserveState: true,
                onError: setErrors,
                onSuccess: () => { onClose(); toast.success('Deal créé.'); },
            });
        }
    };

    const iCls = 'mt-1 w-full px-3 py-2 text-[12px] border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30';
    const lCls = 'text-[10px] font-bold text-gray-400 uppercase tracking-wider';
    const selectedClient = form.client_id ? (clients || []).find(c => String(c.id) === form.client_id) : null;

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-[15px]">
                        {isEdit ? 'Modifier le deal' : 'Nouveau deal'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-1">
                    <div>
                        <label className={lCls}>Titre du deal</label>
                        <input value={form.titre} onChange={e => setF('titre', e.target.value)}
                            placeholder="Dev — App SOTELGUI" className={iCls} />
                    </div>

                    {(clients?.length > 0) && (
                        <div>
                            <label className={lCls}>Client enregistré</label>
                            <SearchableSelect value={form.client_id} onChange={handleClientSelect}
                                options={(clients || []).map(c => ({ value: String(c.id), label: c.nom }))}
                                nullable nullLabel="— Saisir manuellement —"
                                placeholder="Rechercher un client..." className="mt-1" />
                        </div>
                    )}

                    <div>
                        <label className={lCls}>
                            {selectedClient ? 'Client sélectionné' : 'Nom de l\'entreprise *'}
                        </label>
                        {selectedClient ? (
                            <div className="mt-1 flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    <span className="text-[12px] font-semibold text-blue-700 dark:text-blue-300 truncate">{selectedClient.nom}</span>
                                    {selectedClient.secteur && (
                                        <span className="text-[10px] text-blue-400 shrink-0">{selectedClient.secteur}</span>
                                    )}
                                </div>
                                <button onClick={() => setF('client_id', '')}
                                    className="ml-2 text-blue-400 hover:text-blue-600 font-bold text-base leading-none shrink-0">
                                    ×
                                </button>
                            </div>
                        ) : (
                            <input value={form.nom} onChange={e => setF('nom', e.target.value)}
                                placeholder="SOTELGUI" className={iCls} />
                        )}
                        {errors.nom && <p className="text-[11px] text-red-500 mt-0.5">{errors.nom}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={lCls}>Valeur estimée ({deviseCode})</label>
                            <NumberInput value={form.valeur} onChange={v => setF('valeur', v)} decimals={0} placeholder="0" className="mt-1" />
                        </div>
                        <div>
                            <label className={lCls}>Probabilité (%)</label>
                            <NumberInput value={form.probabilite} onChange={v => setF('probabilite', v)} min={0} max={100} decimals={0} placeholder="20" className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={lCls}>Type de deal</label>
                            <select value={form.type_deal} onChange={e => setF('type_deal', e.target.value)} className={iCls}>
                                <option value="nouveau_client">Nouveau client</option>
                                <option value="upsell">Upsell</option>
                                <option value="renouvellement">Renouvellement</option>
                            </select>
                        </div>
                        <div>
                            <label className={lCls}>Étape</label>
                            <select value={form.statut} onChange={e => setF('statut', e.target.value)} className={iCls}>
                                {KANBAN_COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={lCls}>Responsable</label>
                        <SearchableSelect value={form.collaborateur_id} onChange={v => setF('collaborateur_id', v)}
                            options={collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }))}
                            nullable nullLabel="— Non assigné —" placeholder="Rechercher..." className="mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={lCls}>Contact</label>
                            <input value={form.contact} onChange={e => setF('contact', e.target.value)}
                                placeholder="+224 6XX..." className={iCls} />
                        </div>
                        <div>
                            <label className={lCls}>Secteur</label>
                            <input value={form.secteur} onChange={e => setF('secteur', e.target.value)}
                                placeholder="Banque, Télécoms..." className={iCls} />
                        </div>
                    </div>

                    <div>
                        <label className={lCls}>Note</label>
                        <textarea value={form.note} onChange={e => setF('note', e.target.value)}
                            rows={2} placeholder="Contexte, prochaine action..."
                            className={iCls + ' resize-none'} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button onClick={submit}>{isEdit ? 'Enregistrer' : 'Créer le deal'}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Pipeline par responsable ───────────────────────────────────────────────
function PipelineParCollab({ data, deviseCode }) {
    if (!data?.length) return null;
    return (
        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline par responsable</h3>
                <span className="text-[10px] text-gray-400">CA signé / opportunité totale</span>
            </div>
            <div className="space-y-2.5">
                {data.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                        <CollabAvatar prenom={c.prenom} nom={c.nom} cls="h-6 w-6" />
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 w-20 shrink-0 truncate">
                            {c.prenom}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden min-w-0">
                            {/* Segment vert = CA signé, segment bleu = pipeline restant */}
                            <div className="h-full flex">
                                <div className="h-full bg-emerald-500 transition-all"
                                    style={{ width: c.objectif > 0 ? `${Math.min(100, (c.ca_signe / c.objectif) * 100)}%` : '100%' }} />
                                {c.pipeline_brut > 0 && (
                                    <div className="h-full bg-primary-300 transition-all"
                                        style={{ width: c.objectif > 0 ? `${Math.min(100, (c.pipeline_brut / c.objectif) * 100)}%` : '0%' }} />
                                )}
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 w-9 text-right shrink-0">{c.taux}%</span>
                        <span className="text-[10px] text-gray-400 shrink-0 hidden xl:block truncate max-w-[200px]">
                            {fmt(c.ca_signe)}{c.pipeline_brut > 0 ? ` + ${fmt(c.pipeline)}` : ''} {deviseCode}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50 dark:border-dark-800">
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-gray-400">CA signé</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary-300" /><span className="text-[10px] text-gray-400">Pipeline pondéré</span></div>
            </div>
        </div>
    );
}

// ── Vue Clients ────────────────────────────────────────────────────────────
function VueClients({ clients, prospects, onEdit, onDelete, onNew, onNewDeal, deviseCode }) {
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const shown = useMemo(() => {
        if (!search) return clients;
        const q = search.toLowerCase();
        return clients.filter(c =>
            c.nom.toLowerCase().includes(q) ||
            (c.secteur || '').toLowerCase().includes(q) ||
            (c.contact || '').toLowerCase().includes(q)
        );
    }, [clients, search]);

    if (clients.length === 0) {
        return (
            <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-[14px] font-bold text-gray-800 dark:text-white">Clients enregistrés</h2>
                    <button onClick={onNew}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 rounded-lg shadow-sm transition-all">
                        <Plus className="h-3.5 w-3.5" /> Nouveau client
                    </button>
                </div>
                <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-12 text-center">
                    <Building2 className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-[13px] font-semibold text-gray-400">Aucun client enregistré</p>
                    <p className="text-[12px] text-gray-300 dark:text-gray-600 mt-1 mb-4">
                        Enregistrez vos clients pour les réutiliser sur vos deals.
                    </p>
                    <button onClick={onNew} className="px-4 py-2 text-[12px] font-bold text-white bg-slate-800 rounded-lg">
                        + Premier client
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[14px] font-bold text-gray-800 dark:text-white">
                        Clients
                        <span className="ml-1.5 text-[12px] font-normal text-gray-400">({clients.length})</span>
                    </h2>
                    <button onClick={onNew}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 rounded-lg shadow-sm transition-all shrink-0">
                        <Plus className="h-3.5 w-3.5" /> Nouveau
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un client..."
                        className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 overflow-x-auto">
                <table className="w-full min-w-[540px]">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800">
                            {['', 'Client', 'Contact', 'Deals', 'Pipeline', 'CA signé', ''].map((h, i) => (
                                <th key={i} className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map(client => {
                            const isOpen = expandedId === client.id;
                            const clientDeals = prospects.filter(p => p.client_id === client.id);
                            const pipeline = clientDeals
                                .filter(p => ACTIF_STATUTS.includes(p.statut))
                                .reduce((s, p) => s + Number(p.valeur || 0), 0);
                            const caSigne = clientDeals
                                .filter(p => p.statut === 'gagne')
                                .reduce((s, p) => s + Number(p.montant_final || 0), 0);

                            return [
                                <tr key={client.id}
                                    onClick={() => setExpandedId(isOpen ? null : client.id)}
                                    className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50/50 dark:hover:bg-dark-800/50 transition-colors cursor-pointer">
                                    <td className="pl-3 py-3 w-5">
                                        <ChevronRight className={`h-3.5 w-3.5 text-gray-300 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} />
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-dark-700 flex items-center justify-center shrink-0">
                                                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate">{client.nom}</p>
                                                {client.secteur && (
                                                    <p className="text-[10px] text-gray-400 truncate">{client.secteur}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-[12px] text-gray-500 max-w-[120px] truncate">{client.contact || '—'}</td>
                                    <td className="px-3 py-3 text-center">
                                        <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">{clientDeals.length}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        {pipeline > 0
                                            ? <span className="text-[12px] font-bold text-primary-600 dark:text-primary-400">{fmt(pipeline)} {deviseCode}</span>
                                            : <span className="text-[12px] text-gray-300">—</span>}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        {caSigne > 0
                                            ? <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">{fmt(caSigne)} {deviseCode}</span>
                                            : <span className="text-[12px] text-gray-300">—</span>}
                                    </td>
                                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => onNewDeal(client)}
                                                title="Créer un deal pour ce client"
                                                className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-500 transition-colors">
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => onEdit(client)}
                                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 hover:text-gray-600 transition-colors">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => onDelete(client.id)}
                                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>,
                                isOpen && (
                                    <tr key={`${client.id}-deals`} className="bg-blue-50/30 dark:bg-blue-900/5">
                                        <td colSpan={7} className="px-4 pb-3 pt-1">
                                            {clientDeals.length === 0 ? (
                                                <div className="flex items-center gap-2 py-2">
                                                    <p className="text-[11px] text-gray-400 italic">Aucun deal pour ce client.</p>
                                                    <button onClick={() => onNewDeal(client)}
                                                        className="text-[11px] font-semibold text-blue-500 hover:text-blue-700 underline">
                                                        Créer le premier deal →
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-1 py-1">
                                                    {clientDeals.map(deal => {
                                                        const col  = KANBAN_COLS.find(c => c.key === deal.statut);
                                                        const tDef = TYPE_DEAL[deal.type_deal] || TYPE_DEAL.nouveau_client;
                                                        return (
                                                            <div key={deal.id}
                                                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-700 text-[12px]">
                                                                <div className={`h-2 w-2 rounded-full ${col?.dot || 'bg-gray-300'} shrink-0`} />
                                                                <span className="font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">
                                                                    {deal.titre || deal.nom}
                                                                </span>
                                                                <span className="font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                                    {fmt(deal.valeur)} {deviseCode}
                                                                </span>
                                                                <span className="text-gray-400">{deal.probabilite}%</span>
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                                    style={{ backgroundColor: col?.color + '20', color: col?.color }}>
                                                                    {col?.label || deal.statut}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tDef.cls}`}>
                                                                    {tDef.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ),
                            ];
                        })}
                        {shown.length === 0 && search && (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-[12px] text-gray-400">
                                    Aucun client trouvé pour "{search}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Vue Kanban ─────────────────────────────────────────────────────────────
function VueKanban({ prospects, stats, pipelineParCollab, collaborateurs, clients, collabFilter, setCollabFilter, clientFilter, setClientFilter, deviseCode, onEdit, onDelete, onStatusChange, onDetail, onAction, onNew }) {
    const filtered = useMemo(() => {
        let list = prospects;
        if (collabFilter) list = list.filter(p => String(p.collaborateur_id) === collabFilter);
        if (clientFilter) list = list.filter(p => String(p.client_id) === clientFilter);
        return list;
    }, [prospects, collabFilter, clientFilter]);

    const byCol = useMemo(() => {
        const m = {};
        KANBAN_COLS.forEach(c => { m[c.key] = []; });
        filtered.forEach(p => { if (m[p.statut]) m[p.statut].push(p); });
        return m;
    }, [filtered]);

    return (
        <div>
            {/* ── KPI Stats ── */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-2 mb-3">
                {[
                    { lbl: 'CA signé',          val: `${fmt(stats.ca_signe)} ${deviseCode}`,              cls: 'text-emerald-600 dark:text-emerald-400' },
                    { lbl: 'Pipeline pondéré',  val: `${fmt(stats.pipeline_previsionnel)} ${deviseCode}`, cls: 'text-primary-600 dark:text-primary-400' },
                    { lbl: 'Deals actifs',       val: stats.deals_actifs,                                  cls: 'text-blue-600 dark:text-blue-400' },
                    { lbl: 'Nvx clients',       val: stats.nouveaux_clients,                               cls: 'text-violet-600 dark:text-violet-400' },
                    { lbl: 'Upsells signés',    val: stats.upsells,                                        cls: 'text-amber-600 dark:text-amber-400' },
                ].map(s => (
                    <div key={s.lbl} className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 px-3 py-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 truncate">{s.lbl}</p>
                        <p className={`text-[14px] font-bold leading-tight truncate ${s.cls}`}>{s.val}</p>
                    </div>
                ))}
            </div>
            {/* ── Alerte deals sans valeur ── */}
            {stats.deals_sans_valeur > 0 && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px]">
                    <span className="font-bold">⚠</span>
                    {stats.deals_sans_valeur} deal{stats.deals_sans_valeur > 1 ? 's' : ''} actif{stats.deals_sans_valeur > 1 ? 's' : ''} sans valeur estimée — le pipeline pondéré est sous-estimé.
                </div>
            )}

            {/* ── Pipeline par responsable ── */}
            <PipelineParCollab data={pipelineParCollab} deviseCode={deviseCode} />

            {/* ── Controls ── */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button onClick={onNew}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg shadow-sm transition-all shrink-0">
                    <Plus className="h-3.5 w-3.5" /> Nouveau deal
                </button>
                <div className="flex-1 min-w-0">
                    <SearchableSelect value={collabFilter} onChange={setCollabFilter}
                        options={collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }))}
                        nullable nullLabel="Tous les responsables" placeholder="Responsable…" />
                </div>
                {clients?.length > 0 && (
                    <div className="flex-1 min-w-0">
                        <SearchableSelect value={clientFilter} onChange={setClientFilter}
                            options={clients.map(c => ({ value: String(c.id), label: c.nom }))}
                            nullable nullLabel="Tous les clients" placeholder="Client…" />
                    </div>
                )}
                <button
                    onClick={() => toast.info('Sync KR disponible après configuration commerciale.')}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-all shrink-0">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">Sync KR</span>
                </button>
            </div>

            {/* ── Filtre actif ── */}
            {(collabFilter || clientFilter) && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-[11px] text-gray-400">Filtre :</span>
                    {collabFilter && (
                        <span className="flex items-center gap-1 text-[11px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-2 py-0.5 rounded-full">
                            {collaborateurs.find(c => String(c.id) === collabFilter)?.prenom}
                            <button onClick={() => setCollabFilter('')} className="ml-1 font-bold">×</button>
                        </span>
                    )}
                    {clientFilter && (
                        <span className="flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded-full">
                            <Building2 className="h-3 w-3" />
                            {clients?.find(c => String(c.id) === clientFilter)?.nom}
                            <button onClick={() => setClientFilter('')} className="ml-1 font-bold">×</button>
                        </span>
                    )}
                </div>
            )}

            {/* ── Kanban board ── */}
            <div className="flex gap-3 overflow-x-auto pb-4">
                {KANBAN_COLS.map(col => (
                    <KanbanColumn key={col.key} col={col} deals={byCol[col.key] || []}
                        onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange}
                        onDetail={onDetail} onAction={onAction} deviseCode={deviseCode} />
                ))}
            </div>
        </div>
    );
}

// ── Vue Liste ──────────────────────────────────────────────────────────────
function VueListe({ prospects, clients, onEdit, onDelete, onDetail, onAction, deviseCode, typeDealFilter = null, title = 'Liste des deals' }) {
    const [search, setSearch] = useState('');
    const [clientFilter, setClientFilter] = useState('');

    const shown = useMemo(() => {
        let list = typeDealFilter ? prospects.filter(p => p.type_deal === typeDealFilter) : prospects;
        if (clientFilter) list = list.filter(p => String(p.client_id) === clientFilter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                (p.titre || '').toLowerCase().includes(q) ||
                (p.nom  || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [prospects, typeDealFilter, clientFilter, search]);

    return (
        <div>
            <div className="flex flex-col gap-2 mb-4">
                <h2 className="text-[14px] font-bold text-gray-800 dark:text-white">{title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    {clients?.length > 0 && (
                        <div className="flex-1 min-w-[140px]">
                            <SearchableSelect value={clientFilter} onChange={setClientFilter}
                                options={(clients || []).map(c => ({ value: String(c.id), label: c.nom }))}
                                nullable nullLabel="Tous les clients" placeholder="Client…" />
                        </div>
                    )}
                    <div className="relative flex-1 min-w-[140px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800">
                            {['Deal', 'Client', 'Valeur', 'Proba', 'Responsable', 'Étape', 'Type', 'Actions', ''].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map(deal => {
                            const col  = KANBAN_COLS.find(c => c.key === deal.statut);
                            const tDef = TYPE_DEAL[deal.type_deal] || TYPE_DEAL.nouveau_client;
                            return (
                                <tr key={deal.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50/50 dark:hover:bg-dark-800/50 transition-colors">
                                    <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-800 dark:text-gray-200 max-w-[180px] truncate">
                                        {deal.titre || deal.nom}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1.5">
                                            {deal.client_id && <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                                            <span className="text-[12px] text-gray-500">{deal.titre ? deal.nom : '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-[12px] font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                        {fmt(deal.valeur)} {deviseCode}
                                    </td>
                                    <td className="px-4 py-2.5 text-[12px] text-center text-gray-500">{deal.probabilite}%</td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <CollabAvatar prenom={deal.collaborateur_prenom} nom={deal.collaborateur_nom} cls="h-5 w-5" />
                                            <span className="text-[12px] text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                                                {deal.collaborateur_prenom} {deal.collaborateur_nom}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: col?.color + '20', color: col?.color }}>
                                            {col?.label || deal.statut}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tDef.cls}`}>{tDef.label}</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {deal.actions_count > 0 && (
                                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                <Clock className="h-3.5 w-3.5" />{deal.actions_count}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700">
                                                    <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(deal)}>
                                                    <Pencil className="h-3.5 w-3.5 mr-2" /> Modifier
                                                </DropdownMenuItem>
                                                <div className="my-1 border-t border-gray-100 dark:border-dark-700" />
                                                <DropdownMenuItem onClick={() => onDetail(deal)}>
                                                    <Clock className="h-3.5 w-3.5 mr-2" /> Voir les actions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onAction(deal)}>
                                                    <Plus className="h-3.5 w-3.5 mr-2" /> Ajouter une action
                                                </DropdownMenuItem>
                                                <div className="my-1 border-t border-gray-100 dark:border-dark-700" />
                                                <DropdownMenuItem onClick={() => onDelete(deal.id)} className="text-red-500">
                                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            );
                        })}
                        {shown.length === 0 && (
                            <tr>
                                <td colSpan={9} className="text-center py-10 text-[12px] text-gray-400">
                                    Aucun deal trouvé
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Vue Stats & Consolidation ──────────────────────────────────────────────
function VueStats({ prospects, stats, deviseCode }) {
    const total = prospects.reduce((s, p) => s + (Number(p.valeur) || 0), 0);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-2">
                {[
                    { lbl: 'CA signé',         val: `${fmt(stats.ca_signe)} ${deviseCode}`,              icon: Award,      cls: 'text-emerald-600' },
                    { lbl: 'Pipeline pondéré', val: `${fmt(stats.pipeline_previsionnel)} ${deviseCode}`, icon: Target,     cls: stats.pipeline_previsionnel === 0 && stats.deals_actifs > 0 ? 'text-amber-500' : 'text-primary-600' },
                    { lbl: 'Deals actifs',      val: stats.deals_actifs,                                  icon: Briefcase,  cls: 'text-blue-600' },
                    { lbl: 'Nvx clients',      val: stats.nouveaux_clients,                               icon: Users,      cls: 'text-violet-600' },
                    { lbl: 'Upsells signés',   val: stats.upsells,                                        icon: TrendingUp, cls: 'text-amber-600' },
                ].map(s => (
                    <div key={s.lbl} className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-3.5 flex items-start gap-2.5">
                        <s.icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.cls}`} />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{s.lbl}</p>
                            <p className={`text-[14px] font-bold mt-0.5 truncate ${s.cls}`}>{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>
            {stats.deals_sans_valeur > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px]">
                    <span className="font-bold">⚠</span>
                    {stats.deals_sans_valeur} deal{stats.deals_sans_valeur > 1 ? 's' : ''} actif{stats.deals_sans_valeur > 1 ? 's' : ''} sans valeur estimée — pipeline pondéré sous-estimé.
                </div>
            )}

            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-5">
                <h3 className="text-[12px] font-bold text-gray-600 dark:text-gray-300 mb-4">Entonnoir de conversion</h3>
                <div className="space-y-3">
                    {KANBAN_COLS.map(col => {
                        const colDeals = prospects.filter(p => p.statut === col.key);
                        const val = colDeals.reduce((s, p) => s + (Number(p.valeur) || 0), 0);
                        const pct = total > 0 ? (val / total) * 100 : 0;
                        return (
                            <div key={col.key} className="flex items-center gap-3">
                                <div className={`h-2 w-2 rounded-full ${col.dot} shrink-0`} />
                                <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 w-24 shrink-0">{col.label}</span>
                                <div className="flex-1 h-4 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all"
                                        style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: col.color + 'CC' }} />
                                </div>
                                <span className="text-[11px] text-gray-500 w-6 text-right shrink-0">{colDeals.length}</span>
                                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 w-40 text-right shrink-0 hidden md:block">
                                    {fmt(val)} {deviseCode}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-5">
                <h3 className="text-[12px] font-bold text-gray-600 dark:text-gray-300 mb-4">Répartition par type de deal</h3>
                <div className="flex gap-6 flex-wrap">
                    {Object.entries(TYPE_DEAL).map(([key, def]) => {
                        const dealsOfType = prospects.filter(p => p.type_deal === key);
                        const valType = dealsOfType.reduce((s, p) => s + (Number(p.valeur) || 0), 0);
                        return (
                            <div key={key} className="flex items-center gap-3">
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${def.cls}`}>{def.label}</span>
                                <div>
                                    <p className="text-[15px] font-bold text-gray-700 dark:text-gray-300">{dealsOfType.length}</p>
                                    <p className="text-[11px] text-gray-400">{fmt(valType)} {deviseCode}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Modal Logger une activité ───────────────────────────────────────────────
function LogActiviteModal({ open, onClose, collaborateurs = [], prospects = [], clients = [], deviseCode = 'GNF' }) {
    const today = new Date().toISOString().split('T')[0];
    const emptyForm = {
        collaborateur_id: '',
        type: 'contact_initie',
        prospect_id: '',
        client_id: '',
        prospect_client: '',
        montant: '',
        note: '',
        date_activite: today,
    };
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    // Reset form when modal opens
    useEffect(() => { if (open) setForm({ ...emptyForm, date_activite: new Date().toISOString().split('T')[0] }); }, [open]);

    // When prospect changes, clear client & free text (prospect already implies a client)
    const handleProspectChange = (val) => {
        setForm(p => ({ ...p, prospect_id: val, client_id: '', prospect_client: '' }));
    };
    // When client changes, clear free text
    const handleClientChange = (val) => {
        setForm(p => ({ ...p, client_id: val, prospect_client: '' }));
    };

    const cycleAuto = () => {
        if (!form.date_activite) return '';
        const d = new Date(form.date_activite);
        return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
    };

    // Find selected prospect info for display hint
    const selectedProspect = form.prospect_id ? prospects.find(p => String(p.id) === String(form.prospect_id)) : null;
    const selectedClient   = form.client_id   ? clients.find(c => String(c.id) === String(form.client_id))     : null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.collaborateur_id || !form.type || !form.date_activite) return;
        setSubmitting(true);
        router.post(route('activites.store'), {
            collaborateur_id: form.collaborateur_id,
            type:             form.type,
            date_activite:    form.date_activite,
            prospect_id:      form.prospect_id  || null,
            client_id:        form.client_id    || null,
            prospect_client:  (!form.prospect_id && !form.client_id) ? (form.prospect_client || null) : null,
            montant:          form.montant !== '' ? Number(form.montant) : null,
            note:             form.note || null,
        }, {
            preserveState: true,
            onSuccess: () => { onClose(); setSubmitting(false); toast.success('Activité enregistrée.'); },
            onError: () => setSubmitting(false),
        });
    };

    const inputCls = 'w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
    const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1';

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent aria-describedby={undefined} className="max-w-lg p-0 overflow-hidden">
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="px-6 pt-5 pb-2 border-b border-gray-100 dark:border-dark-700">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-sm">
                                <Activity className="h-4 w-4 text-cyan-500" />
                                Logger une activité commerciale
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[70vh]">

                        {/* Collaborateur + Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Collaborateur *</label>
                                <select value={form.collaborateur_id} onChange={e => setF('collaborateur_id', e.target.value)} required className={inputCls}>
                                    <option value="">— Sélectionner —</option>
                                    {collaborateurs.map(c => (
                                        <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Date *</label>
                                <input type="date" value={form.date_activite} onChange={e => setF('date_activite', e.target.value)} required className={inputCls} />
                            </div>
                        </div>

                        {/* Type + Deal lié */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Type d'activité *</label>
                                <select value={form.type} onChange={e => setF('type', e.target.value)} required className={inputCls}>
                                    {Object.entries(ACTIVITE_TYPES).map(([key, def]) => (
                                        <option key={key} value={key}>{def.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Deal lié (optionnel)</label>
                                <select value={form.prospect_id} onChange={e => handleProspectChange(e.target.value)} className={inputCls}>
                                    <option value="">— Aucun deal —</option>
                                    {prospects.map(p => (
                                        <option key={p.id} value={p.id}>{p.titre || p.nom}</option>
                                    ))}
                                </select>
                                {selectedProspect && (
                                    <p className="mt-1 text-[10px] text-gray-400 truncate">
                                        {selectedProspect.nom}{selectedProspect.contact ? ` · ${selectedProspect.contact}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Si pas de deal : Client existant ou nouveau contact */}
                        {!form.prospect_id && (
                            <div className="space-y-3">
                                <div>
                                    <label className={labelCls}>Client existant</label>
                                    <select value={form.client_id} onChange={e => handleClientChange(e.target.value)} className={inputCls}>
                                        <option value="">— Sélectionner un client —</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nom}{c.contact ? ` — ${c.contact}` : ''}{c.secteur ? ` (${c.secteur})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedClient && (
                                        <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                                            ✓ {selectedClient.nom}{selectedClient.contact ? ` · ${selectedClient.contact}` : ''}
                                        </p>
                                    )}
                                </div>
                                {!form.client_id && (
                                    <div>
                                        <label className={labelCls}>Ou — Nouveau prospect / contact libre</label>
                                        <input type="text" value={form.prospect_client}
                                            onChange={e => setF('prospect_client', e.target.value)}
                                            placeholder="Ex: BICIGUI — DG M. Soumah"
                                            className={inputCls} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Montant + Cycle */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Montant ({deviseCode}) — si proposition ou deal</label>
                                <input type="number" value={form.montant} onChange={e => setF('montant', e.target.value)}
                                    placeholder="Ex: 95 000 000" className={inputCls} min="0" />
                            </div>
                            <div>
                                <label className={labelCls}>Cycle (auto-calculé)</label>
                                <input type="text" value={cycleAuto()} readOnly
                                    className={`${inputCls} bg-gray-50 dark:bg-dark-700 text-gray-500 cursor-default`} />
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <label className={labelCls}>Note</label>
                            <textarea value={form.note} onChange={e => setF('note', e.target.value)}
                                rows={3} placeholder="Contexte, résultat, prochaine étape..."
                                className={`${inputCls} resize-none`} />
                        </div>

                        <div className="flex items-start gap-2 px-3 py-2.5 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/30 rounded-lg">
                            <CheckCheck className="h-3.5 w-3.5 text-cyan-500 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-cyan-700 dark:text-cyan-300">Les KRs CRM du collaborateur seront mis à jour automatiquement dès l'enregistrement.</p>
                        </div>
                    </div>
                    <div className="px-6 py-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={submitting || !form.collaborateur_id || !form.date_activite}>
                            {submitting ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Vue Activités Commerciales ───────────────────────────────────────────────
function VueActivites({ activites = [], statsActivites = {}, collaborateurs = [], prospects = [], clients = [], deviseCode = 'GNF' }) {
    const [filterCollab, setFilterCollab] = useState('');
    const [filterCycle, setFilterCycle]   = useState('');
    const [filterType, setFilterType]     = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [logOpen, setLogOpen]           = useState(false);
    const [syncLoading, setSyncLoading]   = useState(false);
    const [deleting, setDeleting]         = useState(null);

    const cycles = [...new Set(activites.map(a => a.cycle))].sort().reverse();

    const filtered = activites.filter(a =>
        (!filterCollab || String(a.collaborateur_id) === filterCollab) &&
        (!filterCycle  || a.cycle === filterCycle) &&
        (!filterType   || a.type === filterType) &&
        (!filterClient || String(a.client_id) === filterClient)
    );

    const montantFiltre = filtered.reduce((s, a) => s + (a.montant || 0), 0);
    const hasFilters = filterCollab || filterCycle || filterType || filterClient;

    const handleSync = () => {
        setSyncLoading(true);
        router.post(route('activites.sync-krs'), {}, {
            preserveState: true,
            onSuccess: () => { setSyncLoading(false); toast.success('KRs synchronisés avec succès.'); },
            onError:   () => setSyncLoading(false),
        });
    };

    const handleDelete = (a) => {
        if (!window.confirm(`Supprimer l'activité "${ACTIVITE_TYPES[a.type]?.label || a.type}" du ${a.date_activite} ?`)) return;
        setDeleting(a.id);
        router.delete(route('activites.destroy', a.id), {
            preserveState: true,
            onSuccess: () => { setDeleting(null); toast.success('Activité supprimée.'); },
            onError:   () => setDeleting(null),
        });
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Activités Commerciales</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        {statsActivites.total || 0} interaction(s) · cycle actuel : {statsActivites.cycle_actuel || '—'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSync} disabled={syncLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 rounded-lg hover:bg-cyan-100 transition-all disabled:opacity-50">
                        <RefreshCcw className={`h-3.5 w-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                        Sync KRs
                    </button>
                    <button onClick={() => setLogOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 dark:bg-dark-700 rounded-lg hover:bg-gray-800 transition-all shadow-sm">
                        <Plus className="h-3.5 w-3.5" />
                        Logger une activité
                    </button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-7 gap-2">
                {Object.entries(ACTIVITE_TYPES).map(([key, def]) => {
                    const Icon = def.icon;
                    const count = statsActivites[key] || 0;
                    return (
                        <button key={key} onClick={() => setFilterType(filterType === key ? '' : key)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                                filterType === key
                                    ? 'border-2 shadow-md'
                                    : 'border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900 hover:border-gray-200'
                            }`}
                            style={filterType === key ? { borderColor: def.color, backgroundColor: def.color + '18' } : {}}>
                            <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: def.color + '22' }}>
                                <Icon className="h-4 w-4" style={{ color: def.color }} />
                            </div>
                            <span className="text-xl font-bold text-gray-800 dark:text-white leading-none">{count}</span>
                            <span className="text-[9px] text-gray-400 text-center leading-tight">{def.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Résumé montants */}
            <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <Monitor className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Montant total</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-white tabular-nums">{fmt(statsActivites.montant_total || 0)} {deviseCode}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700">
                    <div className="h-8 w-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                        <Activity className="h-4 w-4 text-primary-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cycle actuel ({statsActivites.cycle_actuel || '—'})</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-white tabular-nums">{fmt(statsActivites.montant_cycle || 0)} {deviseCode}</p>
                    </div>
                </div>
                {hasFilters && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                            <Filter className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">Sélection filtrée</p>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums">{fmt(montantFiltre)} {deviseCode}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <select value={filterCollab} onChange={e => setFilterCollab(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none">
                    <option value="">Tous les collaborateurs</option>
                    {collaborateurs.map(c => <option key={c.id} value={String(c.id)}>{c.prenom} {c.nom}</option>)}
                </select>
                <select value={filterCycle} onChange={e => setFilterCycle(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none">
                    <option value="">Tous les cycles</option>
                    {cycles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none">
                    <option value="">Tous les types</option>
                    {Object.entries(ACTIVITE_TYPES).map(([key, def]) => <option key={key} value={key}>{def.label}</option>)}
                </select>
                <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none">
                    <option value="">Tous les clients</option>
                    {clients.map(c => <option key={c.id} value={String(c.id)}>{c.nom}</option>)}
                </select>
                {hasFilters && (
                    <button onClick={() => { setFilterCollab(''); setFilterCycle(''); setFilterType(''); setFilterClient(''); }}
                        className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">
                        Effacer
                    </button>
                )}
                <span className="ml-auto text-[11px] text-gray-400">{filtered.length} résultat(s)</span>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center mb-3">
                            <Activity className="h-6 w-6 text-cyan-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aucune activité trouvée</p>
                        <p className="text-[11px] text-gray-400 mt-1">Loggez votre première activité commerciale.</p>
                        <button onClick={() => setLogOpen(true)}
                            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-gray-900 dark:bg-dark-700 rounded-lg hover:bg-gray-800 transition-all">
                            + Logger une activité
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collaborateur</th>
                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prospect / Client</th>
                                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Montant</th>
                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cycle</th>
                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Note</th>
                                <th className="px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((a, idx) => {
                                const def = ACTIVITE_TYPES[a.type] || {};
                                const Icon = def.icon;
                                const isDeleting = deleting === a.id;
                                return (
                                    <tr key={a.id} className={`border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50/50 dark:hover:bg-dark-800/30 transition-colors ${isDeleting ? 'opacity-40' : ''} ${idx % 2 === 0 ? '' : 'bg-gray-50/20 dark:bg-dark-800/10'}`}>
                                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{a.date_activite}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <CollabAvatar prenom={a.collaborateur_prenom} nom={a.collaborateur_nom} cls="h-6 w-6 text-[10px]" />
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                    {a.collaborateur_prenom} {a.collaborateur_nom}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${def.bg} ${def.text}`}>
                                                {Icon && <Icon className="h-3 w-3" />}
                                                {def.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 max-w-[180px]">
                                            {a.prospect_titre
                                                ? <span className="flex items-center gap-1 truncate"><Tag className="h-2.5 w-2.5 text-primary-400 shrink-0" />{a.prospect_titre}</span>
                                                : a.client_nom
                                                    ? <span className="flex items-center gap-1 truncate"><CheckCheck className="h-2.5 w-2.5 text-emerald-400 shrink-0" />{a.client_nom}{a.client_contact ? <span className="text-gray-400 text-[10px] shrink-0"> · {a.client_contact}</span> : ''}</span>
                                                    : a.prospect_client
                                                        ? <span className="text-gray-500 italic truncate block">{a.prospect_client}</span>
                                                        : <span className="text-gray-300">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-right tabular-nums whitespace-nowrap">
                                            {a.montant > 0 ? <span className="font-semibold">{fmt(a.montant)} <span className="font-normal text-gray-400">{deviseCode}</span></span> : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-500 rounded-full text-[10px] font-medium">{a.cycle}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-500 max-w-[160px] truncate">
                                            {a.note || <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <button onClick={() => handleDelete(a)} disabled={isDeleting}
                                                title="Supprimer"
                                                className="p-1 text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors disabled:opacity-30">
                                                <XCircle className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {filtered.some(a => a.montant > 0) && (
                            <tfoot>
                                <tr className="border-t-2 border-gray-200 dark:border-dark-600 bg-gray-50/70 dark:bg-dark-800/50">
                                    <td colSpan={4} className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total sélection</td>
                                    <td className="px-4 py-2 text-right font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                                        {fmt(montantFiltre)} {deviseCode}
                                    </td>
                                    <td colSpan={3}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                )}
            </div>

            <LogActiviteModal open={logOpen} onClose={() => setLogOpen(false)} collaborateurs={collaborateurs} prospects={prospects} clients={clients} deviseCode={deviseCode} />
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ProspectionIndex({ prospects, filters, collaborateurs, clients = [], stats, pipelineParCollab, activites = [], statsActivites = {}, auth }) {
    const deviseCode = auth?.societe?.devise?.code || 'GNF';
    const [activeView, setActiveView] = useState('kanban');
    const [collabFilter, setCollabFilter] = useState(String(filters?.collaborateur_id || ''));
    const [clientFilter, setClientFilter] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [createDefaults, setCreateDefaults] = useState(null); // pour pré-sélectionner un client
    const [editDeal, setEditDeal] = useState(null);
    const [clientModal, setClientModal] = useState(null); // null | 'create' | client-object
    const [actionDeal, setActionDeal] = useState(null);
    const [detailDeal, setDetailDeal] = useState(null);

    const openCreate = (defaults = null) => {
        setCreateDefaults(defaults);
        setCreateKey(k => k + 1);
        setCreateOpen(true);
    };

    const handleDelete = (id) => {
        if (!confirm('Supprimer ce deal ?')) return;
        router.delete(route('prospects.destroy', id), {
            preserveState: true,
            onSuccess: () => toast.success('Deal supprimé.'),
        });
    };

    const handleStatusChange = (id, statut) => {
        router.put(route('prospects.status', id), { statut }, {
            preserveState: true,
            onSuccess: () => toast.success('Étape mise à jour.'),
        });
    };

    const handleDeleteClient = (id) => {
        if (!confirm('Supprimer ce client ? Les deals liés resteront sans client associé.')) return;
        router.delete(route('clients.destroy', id), {
            preserveState: true,
            onSuccess: () => toast.success('Client supprimé.'),
        });
    };

    // Ouvrir le modal deal pré-rempli avec un client
    const handleNewDealForClient = (client) => {
        openCreate({ client_id: String(client.id), nom: client.nom, contact: client.contact || '', secteur: client.secteur || '' });
        setActiveView('kanban');
    };

    const listProps = { prospects, clients, onEdit: setEditDeal, onDelete: handleDelete, onDetail: setDetailDeal, onAction: setActionDeal, deviseCode };

    return (
        <AppLayout title="CRM">
            <div className="flex gap-0">
                {/* ── Sidebar interne */}
                <aside className="w-44 shrink-0 border-r border-gray-100 dark:border-dark-700 pr-3 mr-5 sticky top-20 self-start z-10 bg-gray-50 dark:bg-dark-950">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">CRM</p>
                    <nav className="space-y-0.5">
                        {SIDEBAR_VIEWS.map(v => (
                            <button key={v.key} onClick={() => setActiveView(v.key)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                                    activeView === v.key
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800'
                                }`}>
                                <v.icon className="h-4 w-4 shrink-0" />
                                {v.label}
                                {v.key === 'clients' && clients.length > 0 && (
                                    <span className="ml-auto text-[10px] font-bold bg-gray-100 dark:bg-dark-700 text-gray-500 px-1.5 py-0.5 rounded-full">
                                        {clients.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* ── Main content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-9 w-9 rounded-xl bg-cyan-500 flex items-center justify-center shadow-sm shrink-0">
                            <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">CRM</h1>
                            <p className="text-[11px] text-gray-400">
                                Pipeline commercial · Deals · Clients · Kanban
                            </p>
                        </div>
                    </div>

                    {/* Views */}
                    {activeView === 'kanban' && (
                        <VueKanban
                            prospects={prospects} stats={stats} pipelineParCollab={pipelineParCollab}
                            collaborateurs={collaborateurs} clients={clients}
                            collabFilter={collabFilter} setCollabFilter={setCollabFilter}
                            clientFilter={clientFilter} setClientFilter={setClientFilter}
                            deviseCode={deviseCode}
                            onEdit={setEditDeal} onDelete={handleDelete}
                            onStatusChange={handleStatusChange} onNew={() => openCreate()}
                            onDetail={setDetailDeal} onAction={setActionDeal} />
                    )}
                    {activeView === 'liste' && (
                        <VueListe {...listProps} title="Liste des deals" />
                    )}
                    {activeView === 'clients' && (
                        <VueClients
                            clients={clients} prospects={prospects} deviseCode={deviseCode}
                            onEdit={c => setClientModal(c)}
                            onDelete={handleDeleteClient}
                            onNew={() => setClientModal('create')}
                            onNewDeal={handleNewDealForClient} />
                    )}
                    {activeView === 'nouveaux' && (
                        <VueListe {...listProps} typeDealFilter="nouveau_client" title="Nouveaux clients" />
                    )}
                    {activeView === 'upsells' && (
                        <VueListe {...listProps} typeDealFilter="upsell" title="Upsells" />
                    )}
                    {activeView === 'stats' && (
                        <VueStats prospects={prospects} stats={stats} deviseCode={deviseCode} />
                    )}
                    {activeView === 'activites' && (
                        <VueActivites
                            activites={activites}
                            statsActivites={statsActivites}
                            collaborateurs={collaborateurs}
                            prospects={prospects}
                            clients={clients}
                            deviseCode={deviseCode}
                        />
                    )}
                </div>
            </div>

            <ActionModal
                open={!!actionDeal}
                onClose={() => setActionDeal(null)}
                deal={actionDeal}
            />
            <DealDetailPanel
                open={!!detailDeal}
                onClose={() => setDetailDeal(null)}
                deal={detailDeal}
                onAddAction={() => { setActionDeal(detailDeal); setDetailDeal(null); }}
            />

            {/* ── Deal modals */}
            <DealModal key={`create-${createKey}`} open={createOpen} onClose={() => setCreateOpen(false)}
                collaborateurs={collaborateurs} clients={clients} deviseCode={deviseCode}
                defaults={createDefaults} />

            {editDeal && (
                <DealModal key={editDeal.id} open={!!editDeal} onClose={() => setEditDeal(null)}
                    collaborateurs={collaborateurs} clients={clients} deal={editDeal} deviseCode={deviseCode} />
            )}

            {/* ── Client modal */}
            <ClientModal
                key={clientModal === 'create' ? 'new-client' : `client-${clientModal?.id}`}
                open={!!clientModal}
                onClose={() => setClientModal(null)}
                client={clientModal !== 'create' ? clientModal : null} />
        </AppLayout>
    );
}
