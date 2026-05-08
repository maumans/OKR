import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Badge } from '@/Components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Select } from '@/Components/ui/Select';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, GripVertical, Building2, Phone, Briefcase, Calendar, DollarSign, User } from 'lucide-react';
import { FunnelChart, Funnel, LabelList, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const columns = [
    { id: 'nouveau', label: 'Nouveau', color: 'bg-slate-100 dark:bg-dark-800' },
    { id: 'contacte', label: 'Contacté', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
    { id: 'qualifie', label: 'Qualifié', color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30' },
    { id: 'proposition', label: 'Proposition', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30' },
    { id: 'gagne', label: 'Gagné', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' },
    { id: 'perdu', label: 'Perdu', color: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' },
];

export default function ProspectionIndex({ prospects, filters, collaborateurs = [], secteurs = [], statsPipeline, valeurPipeline }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [collabFilter, setCollabFilter] = useState(filters?.collaborateur_id || '');
    const [secteurFilter, setSecteurFilter] = useState(filters?.secteur || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nom: '',
        contact: '',
        secteur: '',
        valeur: '',
        collaborateur_id: '',
        note: '',
        prochain_rdv: '',
    });

    const [editingProspect, setEditingProspect] = useState(null);

    const openEdit = (prospect) => {
        setData({
            nom: prospect.nom,
            contact: prospect.contact || '',
            secteur: prospect.secteur || '',
            valeur: prospect.valeur || '',
            collaborateur_id: prospect.collaborateur_id || '',
            note: prospect.note || '',
            prochain_rdv: prospect.prochain_rdv || '',
        });
        setEditingProspect(prospect);
        setIsCreateOpen(true);
    };

    // Actions commerciales
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [actionProspect, setActionProspect] = useState(null);

    const { data: actionData, setData: setActionData, post: postAction, processing: actionProcessing, errors: actionErrors, reset: resetAction } = useForm({
        type: 'appel',
        description: '',
        date_action: new Date().toISOString().split('T')[0],
        duree: '',
        resultat: '',
    });

    const openActionModal = (e, prospect) => {
        e.stopPropagation();
        setActionProspect(prospect);
        setIsActionOpen(true);
    };

    const submitAction = (e) => {
        e.preventDefault();
        postAction(route('prospects.actions.store', actionProspect.id), {
            onSuccess: () => { setIsActionOpen(false); resetAction(); setActionProspect(null); }
        });
    };

    const applyFilters = (key, value) => {
        const newFilters = { search: searchTerm, collaborateur_id: collabFilter, secteur: secteurFilter, [key]: value };
        Object.keys(newFilters).forEach(k => newFilters[k] === '' && delete newFilters[k]);
        router.get(route('prospects.index'), newFilters, { preserveState: true, replace: true });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        applyFilters('search', e.target.value);
    };

    const handleDragStart = (e, prospectId) => {
        e.dataTransfer.setData('prospectId', prospectId);
    };

    const handleDrop = (e, newStatus) => {
        const prospectId = e.dataTransfer.getData('prospectId');
        if (!prospectId) return;
        const prospect = prospects.find(p => p.id === parseInt(prospectId));
        if (prospect && prospect.statut !== newStatus) {
            router.put(route('prospects.status', prospectId), { statut: newStatus }, { preserveScroll: true });
        }
    };

    const submitCreate = (e) => {
        e.preventDefault();
        if (editingProspect) {
            put(route('prospects.update', editingProspect.id), {
                onSuccess: () => { setIsCreateOpen(false); setEditingProspect(null); reset(); }
            });
        } else {
            post(route('prospects.store'), {
                onSuccess: () => { setIsCreateOpen(false); reset(); }
            });
        }
    };

    const totalEnCours = prospects.filter(p => ['nouveau', 'contacte', 'qualifie', 'proposition'].includes(p.statut)).length;

    // Préparation des données pour le Funnel
    const funnelData = columns
        .filter(c => c.id !== 'perdu')
        .map(c => {
            const count = prospects.filter(p => p.statut === c.id).length;
            const valeur = prospects.filter(p => p.statut === c.id).reduce((sum, p) => sum + (parseFloat(p.valeur) || 0), 0);
            return {
                name: c.label,
                value: count,
                valeurTotal: valeur,
                fill: c.id === 'nouveau' ? '#94a3b8' :
                      c.id === 'contacte' ? '#3b82f6' :
                      c.id === 'qualifie' ? '#6366f1' :
                      c.id === 'proposition' ? '#f59e0b' : '#10b981'
            };
        });

    return (
        <AppLayout title="Pipeline Commercial">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary-500" /> Pipeline
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        <strong className="text-slate-900 dark:text-white">{totalEnCours}</strong> prospect{totalEnCours > 1 ? 's' : ''} en cours de traitement
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Input icon={Search} placeholder="Rechercher..." value={searchTerm} onChange={handleSearch} className="w-full sm:w-48" />
                    <Select value={collabFilter} onChange={(e) => { setCollabFilter(e.target.value); applyFilters('collaborateur_id', e.target.value); }} className="w-full sm:w-40">
                        <option value="">Tous les com.</option>
                        {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                    </Select>
                    <Select value={secteurFilter} onChange={(e) => { setSecteurFilter(e.target.value); applyFilters('secteur', e.target.value); }} className="w-full sm:w-40">
                        <option value="">Tous les sec.</option>
                        {secteurs.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Button onClick={() => { setEditingProspect(null); reset(); setIsCreateOpen(true); }} className="bg-primary-500 hover:bg-primary-600">
                        <Plus className="h-4 w-4 mr-2" />Nouveau
                    </Button>
                </div>
            </div>

            {/* Statistiques & Funnel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-800 p-5 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valeur du Pipeline</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(valeurPipeline || 0)}
                    </p>
                </div>
                <div className="bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-800 p-5 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Taux de conversion</p>
                    <p className="text-3xl font-bold text-emerald-500">
                        {statsPipeline?.taux_conversion || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Cycle moyen: {statsPipeline?.cycle_vente_moyen || 0} jours</p>
                </div>
                <div className="md:col-span-2 bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-800 p-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                            <RechartsTooltip 
                                formatter={(value, name, props) => [`${value} prospect(s) - ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(props.payload.valeurTotal)}`, 'Détails']}
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem', fontSize: '12px' }}
                            />
                            <Funnel
                                dataKey="value"
                                data={funnelData}
                                isAnimationActive
                            >
                                <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" fontSize={12} />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[500px]">
                {columns.map(col => {
                    const columnProspects = prospects.filter(p => p.statut === col.id);
                    return (
                        <div key={col.id} className={`flex-1 min-w-[260px] max-w-[320px] flex flex-col rounded-xl border border-transparent ${col.color}`}
                            onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.id)}>
                            <div className="p-3 border-b border-slate-200/50 dark:border-dark-700/50">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">{col.label}</span>
                                    <span className="bg-white/50 dark:bg-dark-900/50 px-2 py-0.5 rounded-full text-xs font-medium">{columnProspects.length}</span>
                                </div>
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                                <AnimatePresence>
                                    {columnProspects.map((prospect) => (
                                        <motion.div key={prospect.id} layout
                                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                            onClick={() => openEdit(prospect)}
                                            className="bg-white dark:bg-dark-900 p-3.5 rounded-lg shadow-sm border border-slate-200 dark:border-dark-800 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{prospect.nom}</h4>
                                                <GripVertical className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            {prospect.valeur > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                                                    <DollarSign className="h-3 w-3" /> {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(prospect.valeur)}
                                                </div>
                                            )}
                                            {prospect.collaborateur && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary-600 dark:text-primary-400 mb-2">
                                                    <User className="h-3 w-3" /> {prospect.collaborateur}
                                                </div>
                                            )}
                                            {prospect.secteur && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                                                    <Briefcase className="h-3 w-3" /> {prospect.secteur}
                                                </div>
                                            )}
                                            {prospect.contact && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Phone className="h-3 w-3" /> {prospect.contact}
                                                </div>
                                            )}
                                            
                                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    {prospect.prochain_rdv ? (
                                                        <>
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(prospect.prochain_rdv).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                        </>
                                                    ) : (
                                                        <span>Aucun RDV</span>
                                                    )}
                                                </div>
                                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 py-0 border-primary-200 text-primary-600 hover:bg-primary-50" onClick={(e) => openActionModal(e, prospect)}>
                                                    + Action
                                                </Button>
                                            </div>
                                            {prospect.statut === 'gagne' && prospect.date_conversion && (
                                                <div className="mt-2 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded px-2 py-1 inline-block">
                                                    Converti le: {new Date(prospect.date_conversion).toLocaleDateString()}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {columnProspects.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Glisser ici</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Ajouter un prospect</DialogTitle></DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4 mt-4">
                        <div>
                            <Label>Nom du prospect / entreprise *</Label>
                            <Input value={data.nom} onChange={e => setData('nom', e.target.value)} error={errors.nom} placeholder="Ex: TechCorp Guinée" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Contact (tél/email)</Label>
                                <Input icon={Phone} value={data.contact} onChange={e => setData('contact', e.target.value)} error={errors.contact} placeholder="+224 6XX XXX XXX" />
                            </div>
                            <div>
                                <Label>Secteur d'activité</Label>
                                <Input icon={Briefcase} value={data.secteur} onChange={e => setData('secteur', e.target.value)} error={errors.secteur} placeholder="Technologie, Finance..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Valeur estimée (XOF)</Label>
                                <Input type="number" icon={DollarSign} value={data.valeur} onChange={e => setData('valeur', e.target.value)} error={errors.valeur} placeholder="1000000" />
                            </div>
                            <div>
                                <Label>Commercial assigné</Label>
                                <Select value={data.collaborateur_id} onChange={e => setData('collaborateur_id', e.target.value)} error={errors.collaborateur_id} className="mt-1">
                                    <option value="">Non assigné</option>
                                    {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Prochain rendez-vous</Label>
                            <CustomDatePicker value={data.prochain_rdv} onChange={v => setData('prochain_rdv', v)} error={errors.prochain_rdv} />
                        </div>
                        <div>
                            <Label>Note</Label>
                            <textarea className="flex min-h-[60px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:placeholder:text-gray-400"
                                value={data.note} onChange={e => setData('note', e.target.value)} placeholder="Notes sur le prospect..." />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={processing} className="bg-primary-500 hover:bg-primary-600 text-white">
                                {editingProspect ? 'Mettre à jour' : 'Ajouter'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Action Dialog */}
            <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nouvelle Action Commerciale</DialogTitle></DialogHeader>
                    {actionProspect && <p className="text-sm text-slate-500 mb-4">Prospect: <strong className="text-slate-800 dark:text-white">{actionProspect.nom}</strong></p>}
                    <form onSubmit={submitAction} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Type d'action</Label>
                                <Select value={actionData.type} onChange={e => setActionData('type', e.target.value)} className="mt-1">
                                    <option value="appel">Appel téléphonique</option>
                                    <option value="email">Email</option>
                                    <option value="reunion">Réunion / RDV</option>
                                    <option value="relance">Relance</option>
                                    <option value="note">Note</option>
                                </Select>
                                {actionErrors.type && <p className="text-xs text-red-500 mt-1">{actionErrors.type}</p>}
                            </div>
                            <div>
                                <Label>Date de l'action</Label>
                                <CustomDatePicker value={actionData.date_action} onChange={v => setActionData('date_action', v)} error={actionErrors.date_action} />
                            </div>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <textarea className="flex min-h-[60px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-dark-700 dark:bg-dark-900 dark:placeholder:text-gray-400"
                                value={actionData.description} onChange={e => setActionData('description', e.target.value)} placeholder="Compte-rendu de l'action..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Durée (min) - optionnel</Label>
                                <Input type="number" value={actionData.duree} onChange={e => setActionData('duree', e.target.value)} error={actionErrors.duree} placeholder="ex: 15" />
                            </div>
                            <div>
                                <Label>Résultat / Prochaine étape</Label>
                                <Input value={actionData.resultat} onChange={e => setActionData('resultat', e.target.value)} error={actionErrors.resultat} placeholder="A rappeler le..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsActionOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={actionProcessing} className="bg-primary-500 hover:bg-primary-600 text-white">Enregistrer l'action</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
