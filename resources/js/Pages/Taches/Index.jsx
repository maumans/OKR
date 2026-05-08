import { useState } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';
import { Label } from '@/Components/ui/Label';
import { Select } from '@/Components/ui/Select';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { Badge } from '@/Components/ui/Badge';
import { Card, CardContent } from '@/Components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Separator } from '@/Components/ui/Separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Search, GripVertical, Calendar, Trash2, Target, Link2, X } from 'lucide-react';

const columns = [
    { id: 'a_faire',  label: 'À faire',  color: 'bg-gray-100 dark:bg-dark-800' },
    { id: 'en_cours', label: 'En cours', color: 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-900/30' },
    { id: 'bloque',   label: 'Bloqué',   color: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' },
    { id: 'termine',  label: 'Terminé',  color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' },
];

const prioriteColors = {
    basse:   'ghost',
    normale: 'default',
    haute:   'warning',
    urgente: 'destructive',
};

const prioriteLabels = {
    basse:   'Basse',
    normale: 'Normale',
    haute:   'Haute',
    urgente: 'Urgente',
};

// Composant réutilisable pour les selects OKR dans les formulaires
function OkrSelector({ objectifs, objectifId, resultatCleId, onObjectifChange, onResultatChange }) {
    const selectedObjectif = objectifs.find(o => o.id === parseInt(objectifId));
    const resultats = selectedObjectif?.resultats_cles ?? [];

    return (
        <div className="space-y-3 p-3 bg-primary-50/50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30">
            <div className="flex items-center gap-2 text-sm font-medium text-primary-700 dark:text-primary-400">
                <Target className="h-4 w-4" />
                Lier à un OKR
                <Badge variant="outline" className="text-[10px] ml-auto">Optionnel</Badge>
            </div>
            <div>
                <Label className="text-xs text-gray-500">Objectif</Label>
                <Select
                    value={objectifId || ''}
                    onChange={e => onObjectifChange(e.target.value || null)}
                    className="mt-1"
                >
                    <option value="">Aucun OKR lié</option>
                    {objectifs.map(o => (
                        <option key={o.id} value={o.id}>{o.titre}</option>
                    ))}
                </Select>
            </div>
            {selectedObjectif && resultats.length > 0 && (
                <div>
                    <Label className="text-xs text-gray-500">Résultat Clé (optionnel)</Label>
                    <Select
                        value={resultatCleId || ''}
                        onChange={e => onResultatChange(e.target.value || null)}
                        className="mt-1"
                    >
                        <option value="">— KR général —</option>
                        {resultats.map(r => (
                            <option key={r.id} value={r.id}>{r.description}</option>
                        ))}
                    </Select>
                </div>
            )}
        </div>
    );
}

export default function TachesIndex({ taches, collaborateurs, objectifs = [], filters, currentCollaborateurId }) {
    const [searchTerm, setSearchTerm]       = useState(filters?.search || '');
    const [collabFilter, setCollabFilter]   = useState(filters?.collaborateur_id || 'me');
    const [okrFilter, setOkrFilter]         = useState(filters?.objectif_id || '');
    const [prioFilter, setPrioFilter]       = useState(filters?.priorite || '');
    const [eisenFilter, setEisenFilter]     = useState(filters?.eisenhower || '');
    const [isCreateOpen, setIsCreateOpen]   = useState(false);
    const [editingTache, setEditingTache]   = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        titre:            '',
        description:      '',
        mode_operatoire:  [],
        outils:           '',
        definition_done:  [],
        priorite:         'normale',
        eisenhower:       '',
        collaborateur_id: currentCollaborateurId || '',
        date:             '',
        objectif_id:      filters?.objectif_id || null,
        resultat_cle_id:  null,
    });

    const editForm = useForm({
        titre:            '',
        description:      '',
        mode_operatoire:  [],
        outils:           '',
        definition_done:  [],
        priorite:         'normale',
        eisenhower:       '',
        collaborateur_id: '',
        date:             '',
        statut:           'a_faire',
        objectif_id:      null,
        resultat_cle_id:  null,
    });

    const openEdit = (tache) => {
        editForm.setData({
            titre:            tache.titre,
            description:      tache.description || '',
            mode_operatoire:  tache.mode_operatoire || [],
            outils:           tache.outils || '',
            definition_done:  tache.definition_done || [],
            priorite:         tache.priorite,
            eisenhower:       tache.eisenhower || '',
            collaborateur_id: tache.collaborateur_id,
            date:             tache.date || '',
            statut:           tache.statut || 'a_faire',
            objectif_id:      tache.objectif_id || null,
            resultat_cle_id:  tache.resultat_cle_id || null,
        });
        setEditingTache(tache);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(route('taches.update', editingTache.id), {
            onSuccess: () => setEditingTache(null),
        });
    };

    const handleDelete = () => {
        if (!confirm('Supprimer cette tâche ?')) return;
        router.delete(route('taches.destroy', editingTache.id), {
            onSuccess: () => setEditingTache(null),
        });
    };

    const applyFilters = (key, value) => {
        router.get(
            route('taches.index'),
            { search: searchTerm, collaborateur_id: collabFilter, objectif_id: okrFilter, priorite: prioFilter, eisenhower: eisenFilter, [key]: value },
            { preserveState: true, replace: true }
        );
    };

    const clearOkrFilter = () => {
        setOkrFilter('');
        applyFilters('objectif_id', '');
    };

    const handleDragStart = (e, tacheId) => e.dataTransfer.setData('tacheId', tacheId);
    const handleDragOver  = (e) => e.preventDefault();
    const handleDrop      = (e, newStatus) => {
        const tacheId = e.dataTransfer.getData('tacheId');
        if (!tacheId) return;
        const tache = taches.find(t => t.id === parseInt(tacheId));
        if (tache && tache.statut !== newStatus) {
            router.put(route('taches.status', tacheId), { statut: newStatus }, { preserveScroll: true });
        }
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('taches.store'), {
            onSuccess: () => { setIsCreateOpen(false); reset(); }
        });
    };

    const selectedOkrName = okrFilter ? objectifs.find(o => o.id === parseInt(okrFilter))?.titre : null;

    // Calcul des statistiques
    const totalTaches = taches.length;
    const tachesTerminees = taches.filter(t => t.statut === 'termine').length;
    const tauxAchevement = totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0;
    const today = new Date().toISOString().split('T')[0];
    const retards = taches.filter(t => t.statut !== 'termine' && t.date && t.date < today).length;

    return (
        <AppLayout title="Tâches (Kanban)">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckSquare className="h-6 w-6 text-emerald-500" /> Tâches
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez le workflow de l'équipe</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Input
                        icon={Search}
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); applyFilters('search', e.target.value); }}
                        className="w-full sm:w-52"
                    />

                    <Select
                        value={collabFilter}
                        onChange={(e) => { setCollabFilter(e.target.value); applyFilters('collaborateur_id', e.target.value); }}
                        className="w-full sm:w-40"
                    >
                        <option value="me">Mes tâches</option>
                        <option value="">Toute l'équipe</option>
                        {collaborateurs.map(c => (
                            <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                        ))}
                    </Select>

                    {/* Filtre OKR */}
                    <Select
                        value={okrFilter}
                        onChange={(e) => { setOkrFilter(e.target.value); applyFilters('objectif_id', e.target.value); }}
                        className="w-full sm:w-48"
                    >
                        <option value="">Tous les OKR</option>
                        {objectifs.map(o => (
                            <option key={o.id} value={o.id}>{o.titre}</option>
                        ))}
                    </Select>

                    {/* Filtre Priorité */}
                    <Select
                        value={prioFilter}
                        onChange={(e) => { setPrioFilter(e.target.value); applyFilters('priorite', e.target.value); }}
                        className="w-full sm:w-32"
                    >
                        <option value="">Toutes prio.</option>
                        <option value="urgente">Urgente</option>
                        <option value="haute">Haute</option>
                        <option value="normale">Normale</option>
                        <option value="basse">Basse</option>
                    </Select>

                    {/* Filtre Eisenhower */}
                    <Select
                        value={eisenFilter}
                        onChange={(e) => { setEisenFilter(e.target.value); applyFilters('eisenhower', e.target.value); }}
                        className="w-full sm:w-32"
                    >
                        <option value="">Tous Q</option>
                        <option value="Q1">Q1 (Urgent, Important)</option>
                        <option value="Q2">Q2 (Pas U., Important)</option>
                        <option value="Q3">Q3 (Urgent, Pas I.)</option>
                        <option value="Q4">Q4 (Pas U., Pas I.)</option>
                    </Select>

                    <Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle</Button>
                </div>
            </div>

            {/* Barre de Statistiques rapides */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-200 dark:border-dark-800">
                <div className="flex items-center gap-6">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Taux d'achèvement</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white leading-none mt-1">{tauxAchevement}%</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-dark-700" />
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tâches en retard</p>
                        <p className={`text-xl font-bold leading-none mt-1 ${retards > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{retards}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-dark-700" />
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tâches visibles</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white leading-none mt-1">{totalTaches}</p>
                    </div>
                </div>
            </div>

            {/* Chip filtre OKR actif */}
            {selectedOkrName && (
                <div className="mb-4 flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-full text-sm text-primary-700 dark:text-primary-300">
                        <Target className="h-3.5 w-3.5" />
                        <span>OKR : <strong>{selectedOkrName}</strong></span>
                        <button onClick={clearOkrFilter} className="ml-1 hover:text-primary-900">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <span className="text-sm text-gray-400">{taches.length} tâche{taches.length !== 1 ? 's' : ''}</span>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-240px)] min-h-[500px]">
                {columns.map(col => {
                    const columnTaches = taches.filter(t => t.statut === col.id);

                    return (
                        <div
                            key={col.id}
                            className={`flex-1 min-w-[300px] flex flex-col rounded-xl border border-transparent ${col.color}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="p-3 font-semibold text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center border-b border-gray-200/50 dark:border-dark-700/50">
                                {col.label}
                                <span className="bg-white/50 dark:bg-dark-900/50 px-2 py-0.5 rounded-full text-xs">
                                    {columnTaches.length}
                                </span>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                                <AnimatePresence>
                                    {columnTaches.map((tache) => (
                                        <motion.div
                                            key={tache.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, tache.id)}
                                            onClick={() => openEdit(tache)}
                                            className="bg-white dark:bg-dark-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-dark-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant={prioriteColors[tache.priorite]} className="text-[10px] px-1.5 py-0">
                                                    {prioriteLabels[tache.priorite]}
                                                </Badge>
                                                <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>

                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">{tache.titre}</p>

                                            {/* Badge OKR lié */}
                                            {tache.objectif_titre && (
                                                <div className="mb-2 flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full w-fit max-w-full">
                                                    <Target className="h-2.5 w-2.5 shrink-0" />
                                                    <span className="truncate">{tache.objectif_titre}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="truncate max-w-[120px]">{tache.collaborateur}</span>
                                                {tache.date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(tache.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {columnTaches.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm italic">
                                        Glisser ici
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Dialog Créer ────────────────────────────────── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nouvelle tâche</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
                        <div>
                            <Label>Titre *</Label>
                            <Input value={data.titre} onChange={e => setData('titre', e.target.value)} error={errors.titre} className="mt-1" />
                        </div>
                        <div>
                            <Label>Description & Contexte</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-700 dark:bg-dark-900 dark:ring-offset-dark-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-primary-500 mt-1.5"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Décrivez le contexte et l'objectif de la tâche..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Priorité</Label>
                                <Select value={data.priorite} onChange={e => setData('priorite', e.target.value)} className="mt-1.5">
                                    <option value="basse">Basse</option>
                                    <option value="normale">Normale</option>
                                    <option value="haute">Haute</option>
                                    <option value="urgente">Urgente</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Eisenhower</Label>
                                <Select value={data.eisenhower} onChange={e => setData('eisenhower', e.target.value)} className="mt-1.5">
                                    <option value="">Aucun</option>
                                    <option value="Q1">Q1 — Urgent & Important</option>
                                    <option value="Q2">Q2 — Important</option>
                                    <option value="Q3">Q3 — Urgent</option>
                                    <option value="Q4">Q4 — Ni urgent ni important</option>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Date d'échéance</Label>
                                <CustomDatePicker value={data.date} onChange={v => setData('date', v)} error={errors.date} className="mt-1.5" />
                            </div>
                            <div>
                                <Label>Assigné à *</Label>
                                <SearchableSelect 
                                    value={data.collaborateur_id} 
                                    onChange={value => setData('collaborateur_id', value)} 
                                    options={collaborateurs.map(c => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))}
                                    error={errors.collaborateur_id} 
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Mode Opératoire */}
                        <div>
                            <Label className="flex items-center gap-1.5">📋 Mode Opératoire</Label>
                            <div className="mt-1.5 space-y-1.5">
                                {(data.mode_operatoire || []).map((step, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{i + 1}.</span>
                                        <Input value={step} onChange={e => { const arr = [...(data.mode_operatoire || [])]; arr[i] = e.target.value; setData('mode_operatoire', arr); }} className="flex-1" placeholder={`Étape ${i + 1}...`} />
                                        <button type="button" onClick={() => { const arr = [...(data.mode_operatoire || [])]; arr.splice(i, 1); setData('mode_operatoire', arr); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setData('mode_operatoire', [...(data.mode_operatoire || []), ''])} className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Ajouter une étape
                                </button>
                            </div>
                        </div>

                        {/* Outils & Ressources */}
                        <div>
                            <Label className="flex items-center gap-1.5">🔧 Outils & Ressources</Label>
                            <Input value={data.outils} onChange={e => setData('outils', e.target.value)} className="mt-1.5" placeholder="Ex: Notion, Figma, CRM (séparés par virgule)" />
                        </div>

                        {/* Définition de Done */}
                        <div>
                            <Label className="flex items-center gap-1.5">✅ Définition de "Done"</Label>
                            <div className="mt-1.5 space-y-1.5">
                                {(data.definition_done || []).map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-emerald-500 text-sm shrink-0">✓</span>
                                        <Input value={item} onChange={e => { const arr = [...(data.definition_done || [])]; arr[i] = e.target.value; setData('definition_done', arr); }} className="flex-1" placeholder={`Critère ${i + 1}...`} />
                                        <button type="button" onClick={() => { const arr = [...(data.definition_done || [])]; arr.splice(i, 1); setData('definition_done', arr); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setData('definition_done', [...(data.definition_done || []), ''])} className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Ajouter un critère
                                </button>
                            </div>
                        </div>

                        <Separator />

                        {/* Liaison OKR */}
                        <OkrSelector
                            objectifs={objectifs}
                            objectifId={data.objectif_id}
                            resultatCleId={data.resultat_cle_id}
                            onObjectifChange={v => setData(d => ({ ...d, objectif_id: v, resultat_cle_id: null }))}
                            onResultatChange={v => setData('resultat_cle_id', v)}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={processing}>Créer</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialog Modifier ─────────────────────────────── */}
            <Dialog open={!!editingTache} onOpenChange={(open) => !open && setEditingTache(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier la tâche</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
                        <div>
                            <Label>Titre *</Label>
                            <Input value={editForm.data.titre} onChange={e => editForm.setData('titre', e.target.value)} error={editForm.errors.titre} className="mt-1" />
                        </div>
                        <div>
                            <Label>Description & Contexte</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-700 dark:bg-dark-900 dark:ring-offset-dark-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-primary-500 mt-1.5"
                                value={editForm.data.description}
                                onChange={e => editForm.setData('description', e.target.value)}
                                placeholder="Décrivez le contexte et l'objectif de la tâche..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Priorité</Label>
                                <Select value={editForm.data.priorite} onChange={e => editForm.setData('priorite', e.target.value)} className="mt-1.5">
                                    <option value="basse">Basse</option>
                                    <option value="normale">Normale</option>
                                    <option value="haute">Haute</option>
                                    <option value="urgente">Urgente</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Eisenhower</Label>
                                <Select value={editForm.data.eisenhower} onChange={e => editForm.setData('eisenhower', e.target.value)} className="mt-1.5">
                                    <option value="">Aucun</option>
                                    <option value="Q1">Q1 — Urgent & Important</option>
                                    <option value="Q2">Q2 — Important</option>
                                    <option value="Q3">Q3 — Urgent</option>
                                    <option value="Q4">Q4 — Ni urgent ni important</option>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Date d'échéance</Label>
                                <CustomDatePicker value={editForm.data.date} onChange={v => editForm.setData('date', v)} error={editForm.errors.date} className="mt-1.5" />
                            </div>
                            <div>
                                <Label>Statut</Label>
                                <Select value={editForm.data.statut} onChange={e => editForm.setData('statut', e.target.value)} className="mt-1.5">
                                    <option value="a_faire">À faire</option>
                                    <option value="en_cours">En cours</option>
                                    <option value="termine">Terminé</option>
                                    <option value="bloque">Bloqué</option>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Assigné à *</Label>
                            <SearchableSelect 
                                value={editForm.data.collaborateur_id} 
                                onChange={value => editForm.setData('collaborateur_id', value)} 
                                options={collaborateurs.map(c => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))}
                                error={editForm.errors.collaborateur_id} 
                                className="mt-1.5"
                            />
                        </div>

                        <Separator />

                        {/* Mode Opératoire */}
                        <div>
                            <Label className="flex items-center gap-1.5">📋 Mode Opératoire</Label>
                            <div className="mt-1.5 space-y-1.5">
                                {(editForm.data.mode_operatoire || []).map((step, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{i + 1}.</span>
                                        <Input value={step} onChange={e => { const arr = [...(editForm.data.mode_operatoire || [])]; arr[i] = e.target.value; editForm.setData('mode_operatoire', arr); }} className="flex-1" placeholder={`Étape ${i + 1}...`} />
                                        <button type="button" onClick={() => { const arr = [...(editForm.data.mode_operatoire || [])]; arr.splice(i, 1); editForm.setData('mode_operatoire', arr); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => editForm.setData('mode_operatoire', [...(editForm.data.mode_operatoire || []), ''])} className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Ajouter une étape
                                </button>
                            </div>
                        </div>

                        {/* Outils & Ressources */}
                        <div>
                            <Label className="flex items-center gap-1.5">🔧 Outils & Ressources</Label>
                            <Input value={editForm.data.outils} onChange={e => editForm.setData('outils', e.target.value)} className="mt-1.5" placeholder="Ex: Notion, Figma, CRM (séparés par virgule)" />
                        </div>

                        {/* Définition de Done */}
                        <div>
                            <Label className="flex items-center gap-1.5">✅ Définition de "Done"</Label>
                            <div className="mt-1.5 space-y-1.5">
                                {(editForm.data.definition_done || []).map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-emerald-500 text-sm shrink-0">✓</span>
                                        <Input value={item} onChange={e => { const arr = [...(editForm.data.definition_done || [])]; arr[i] = e.target.value; editForm.setData('definition_done', arr); }} className="flex-1" placeholder={`Critère ${i + 1}...`} />
                                        <button type="button" onClick={() => { const arr = [...(editForm.data.definition_done || [])]; arr.splice(i, 1); editForm.setData('definition_done', arr); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => editForm.setData('definition_done', [...(editForm.data.definition_done || []), ''])} className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Ajouter un critère
                                </button>
                            </div>
                        </div>

                        <Separator />

                        {/* Liaison OKR */}
                        <OkrSelector
                            objectifs={objectifs}
                            objectifId={editForm.data.objectif_id}
                            resultatCleId={editForm.data.resultat_cle_id}
                            onObjectifChange={v => editForm.setData(d => ({ ...d, objectif_id: v, resultat_cle_id: null }))}
                            onResultatChange={v => editForm.setData('resultat_cle_id', v)}
                        />

                        <div className="flex justify-between pt-2">
                            <Button type="button" variant="destructive" onClick={handleDelete} className="gap-2">
                                <Trash2 className="h-4 w-4" /> Supprimer
                            </Button>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingTache(null)}>Annuler</Button>
                                <Button type="submit" disabled={editForm.processing}>Enregistrer</Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
