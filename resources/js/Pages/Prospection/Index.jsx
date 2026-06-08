import { useState, useMemo } from 'react';
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
    ChevronRight,
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
    { key: 'kanban',   label: 'Pipeline Kanban',      icon: LayoutGrid },
    { key: 'liste',    label: 'Liste des deals',       icon: List },
    { key: 'clients',  label: 'Clients',               icon: Building2 },
    { key: 'nouveaux', label: 'Nouveaux clients',      icon: UserPlus },
    { key: 'upsells',  label: 'Upsells',               icon: TrendingUp },
    { key: 'stats',    label: 'Stats & Consolidation', icon: BarChart3 },
];

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

// ── Deal Card ──────────────────────────────────────────────────────────────
function DealCard({ deal, onEdit, onDelete, onStatusChange, deviseCode }) {
    const col  = KANBAN_COLS.find(c => c.key === deal.statut);
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
        </div>
    );
}

// ── Kanban Column ──────────────────────────────────────────────────────────
function KanbanColumn({ col, deals, onEdit, onDelete, onStatusChange, deviseCode }) {
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
                            <DealCard deal={deal} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} deviseCode={deviseCode} />
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
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pipeline par responsable</h3>
            <div className="space-y-2.5">
                {data.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                        <CollabAvatar prenom={c.prenom} nom={c.nom} cls="h-6 w-6" />
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 w-20 shrink-0 truncate">
                            {c.prenom}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden min-w-0">
                            <div className="h-full bg-primary-500 rounded-full transition-all"
                                style={{ width: `${Math.min(c.taux, 100)}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 w-9 text-right shrink-0">{c.taux}%</span>
                        <span className="text-[10px] text-gray-400 shrink-0 hidden xl:block truncate max-w-[180px]">
                            {fmt(c.ca_signe)} / {fmt(c.objectif)} {deviseCode}
                        </span>
                    </div>
                ))}
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
function VueKanban({ prospects, stats, pipelineParCollab, collaborateurs, clients, collabFilter, setCollabFilter, clientFilter, setClientFilter, deviseCode, onEdit, onDelete, onStatusChange, onNew }) {
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
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-2 mb-5">
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
                        onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} deviseCode={deviseCode} />
                ))}
            </div>
        </div>
    );
}

// ── Vue Liste ──────────────────────────────────────────────────────────────
function VueListe({ prospects, clients, onEdit, onDelete, deviseCode, typeDealFilter = null, title = 'Liste des deals' }) {
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
                            {['Deal', 'Client', 'Valeur', 'Proba', 'Responsable', 'Étape', 'Type', ''].map(h => (
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
                                <td colSpan={8} className="text-center py-10 text-[12px] text-gray-400">
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
                    { lbl: 'Pipeline pondéré', val: `${fmt(stats.pipeline_previsionnel)} ${deviseCode}`, icon: Target,     cls: 'text-primary-600' },
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

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ProspectionIndex({ prospects, filters, collaborateurs, clients = [], stats, pipelineParCollab, auth }) {
    const deviseCode = auth?.societe?.devise?.code || 'GNF';
    const [activeView, setActiveView] = useState('kanban');
    const [collabFilter, setCollabFilter] = useState(String(filters?.collaborateur_id || ''));
    const [clientFilter, setClientFilter] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [createKey, setCreateKey] = useState(0);
    const [createDefaults, setCreateDefaults] = useState(null); // pour pré-sélectionner un client
    const [editDeal, setEditDeal] = useState(null);
    const [clientModal, setClientModal] = useState(null); // null | 'create' | client-object

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

    const listProps = { prospects, clients, onEdit: setEditDeal, onDelete: handleDelete, deviseCode };

    return (
        <AppLayout title="Mini CRM">
            <div className="flex gap-0">
                {/* ── Sidebar interne */}
                <aside className="w-44 shrink-0 border-r border-gray-100 dark:border-dark-700 pr-3 mr-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Mini CRM</p>
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
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Mini CRM</h1>
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
                            onStatusChange={handleStatusChange} onNew={() => openCreate()} />
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
                </div>
            </div>

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
