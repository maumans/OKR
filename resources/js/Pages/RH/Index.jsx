import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Users, Network, BookOpen, Plus, Pencil, Trash2, Star, ChevronDown, ChevronRight, X } from 'lucide-react';

// ─── Niveaux de compétence ──────────────────────────────────────────────────

const NIVEAUX = [
    { value: 1, label: 'Débutant',      color: 'bg-gray-200 text-gray-700' },
    { value: 2, label: 'Notions',       color: 'bg-blue-100 text-blue-700' },
    { value: 3, label: 'Intermédiaire', color: 'bg-yellow-100 text-yellow-700' },
    { value: 4, label: 'Avancé',        color: 'bg-orange-100 text-orange-700' },
    { value: 5, label: 'Expert',        color: 'bg-green-100 text-green-700' },
];

function NiveauBadge({ niveau }) {
    const n = NIVEAUX.find(x => x.value === niveau) || NIVEAUX[0];
    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${n.color}`}>
            {Array.from({ length: niveau }, (_, i) => '★').join('')} {n.label}
        </span>
    );
}

// ─── Organigramme ──────────────────────────────────────────────────────────

function OrgNode({ collab, allCollabs, depth = 0, collabOptions }) {
    const [expanded, setExpanded] = useState(depth < 2);
    const children = allCollabs.filter(c => c.responsable_id === collab.id);

    const updateResponsable = (responsableId) => {
        router.put(route('rh.collaborateurs.responsable', collab.id), { responsable_id: responsableId || null }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Hiérarchie mise à jour'),
        });
    };

    return (
        <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 dark:border-dark-700 pl-3' : ''}`}>
            <div className="flex items-center gap-2 py-2 group">
                {children.length > 0 && (
                    <button onClick={() => setExpanded(v => !v)} className="shrink-0 text-gray-400 hover:text-gray-600">
                        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                )}
                {children.length === 0 && <div className="w-4" />}
                <div className="flex-1 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                        {collab.prenom?.[0]}{collab.nom?.[0]}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {collab.prenom} {collab.nom}
                        </p>
                        <p className="text-[10px] text-gray-400">{collab.poste || '—'} {collab.departement ? `· ${collab.departement}` : ''}</p>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity w-52">
                        <SearchableSelect
                            value={collab.responsable_id ? String(collab.responsable_id) : ''}
                            onChange={updateResponsable}
                            nullable
                            nullLabel="— Aucun responsable —"
                            options={collabOptions.filter(o => o.value !== String(collab.id))}
                            placeholder="Responsable…"
                        />
                    </div>
                </div>
            </div>
            {expanded && children.map(child => (
                <OrgNode key={child.id} collab={child} allCollabs={allCollabs} depth={depth + 1} collabOptions={collabOptions} />
            ))}
        </div>
    );
}

function VueOrganigramme({ collaborateurs }) {
    const collabOptions = collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }));
    const racines = collaborateurs.filter(c => !c.responsable_id);

    return (
        <div className="space-y-1">
            <p className="text-[10px] text-gray-400 mb-3">
                Survolez un collaborateur pour changer son responsable hiérarchique.
                {racines.length > 1 && <span className="ml-2 text-amber-500">({racines.length} racines — liez-les à un responsable pour avoir un arbre unifié)</span>}
            </p>
            {racines.map(c => (
                <OrgNode key={c.id} collab={c} allCollabs={collaborateurs} depth={0} collabOptions={collabOptions} />
            ))}
            {racines.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400">
                    Tous les collaborateurs ont un responsable assigné.
                </div>
            )}
        </div>
    );
}

// ─── Référentiel compétences ───────────────────────────────────────────────

function CompetenceForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState({ nom: initial?.nom || '', categorie: initial?.categorie || '', description: initial?.description || '' });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const inputCls = "mt-0.5 w-full px-3 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30";

    return (
        <div className="space-y-2 p-3 bg-gray-50/50 dark:bg-dark-800/30 rounded-lg border border-gray-100 dark:border-dark-700">
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Nom *</label>
                <input value={form.nom} onChange={e => set('nom', e.target.value)} className={inputCls} placeholder="Ex: Excel avancé, Communication client…" />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Catégorie</label>
                <input value={form.categorie} onChange={e => set('categorie', e.target.value)} className={inputCls} placeholder="Ex: Technique, Soft skills, Management…" />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-7 text-xs" onClick={() => form.nom.trim() && onSave(form)}>
                    {initial ? 'Enregistrer' : 'Créer'}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Annuler</Button>
            </div>
        </div>
    );
}

function VueReferentielCompetences({ competences }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const categories = [...new Set(competences.map(c => c.categorie || 'Sans catégorie'))].sort();

    const createComp = (form) => {
        router.post(route('rh.competences.store'), form, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Compétence créée'); setAddOpen(false); },
        });
    };

    const updateComp = (id, form) => {
        router.put(route('rh.competences.update', id), form, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Compétence mise à jour'); setEditingId(null); },
        });
    };

    const deleteComp = (id) => {
        if (!confirm('Supprimer cette compétence ?')) return;
        router.delete(route('rh.competences.destroy', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Compétence supprimée'),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{competences.length} compétence{competences.length > 1 ? 's' : ''} dans le référentiel</p>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setAddOpen(true)}>
                    <Plus className="h-3 w-3" /> Nouvelle compétence
                </Button>
            </div>

            {addOpen && (
                <CompetenceForm onSave={createComp} onCancel={() => setAddOpen(false)} />
            )}

            {categories.map(cat => (
                <div key={cat}>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</h3>
                    <div className="space-y-1">
                        {competences.filter(c => (c.categorie || 'Sans catégorie') === cat).map(comp => (
                            <div key={comp.id}>
                                {editingId === comp.id ? (
                                    <CompetenceForm initial={comp} onSave={form => updateComp(comp.id, form)} onCancel={() => setEditingId(null)} />
                                ) : (
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900 group hover:border-primary-200 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{comp.nom}</span>
                                            {comp.description && <p className="text-[11px] text-gray-400 truncate">{comp.description}</p>}
                                        </div>
                                        <span className="text-[10px] text-gray-400">{comp.nb_collab} collab{comp.nb_collab > 1 ? 's' : ''}</span>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                            <button onClick={() => setEditingId(comp.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700">
                                                <Pencil className="h-3 w-3 text-gray-400" />
                                            </button>
                                            <button onClick={() => deleteComp(comp.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <Trash2 className="h-3 w-3 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {competences.length === 0 && !addOpen && (
                <div className="text-center py-10">
                    <BookOpen className="h-10 w-10 text-gray-200 dark:text-dark-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucune compétence dans le référentiel</p>
                    <Button size="sm" className="mt-3 text-xs" onClick={() => setAddOpen(true)}>Créer la première</Button>
                </div>
            )}
        </div>
    );
}

// ─── Vue collaborateur + ses compétences ──────────────────────────────────

function AssignerCompetenceModal({ open, onClose, collaborateur, competences }) {
    const [competenceId, setCompetenceId] = useState('');
    const [niveau, setNiveau] = useState(3);
    const [commentaire, setCommentaire] = useState('');

    const compOptions = competences
        .filter(c => !collaborateur?.competences?.some(cc => cc.id === c.id))
        .map(c => ({ value: String(c.id), label: c.nom + (c.categorie ? ` (${c.categorie})` : '') }));

    const submit = () => {
        if (!competenceId) return;
        router.post(route('rh.collaborateurs.competences.assigner', collaborateur.id), {
            competence_id: competenceId,
            niveau,
            commentaire: commentaire || null,
        }, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Compétence assignée'); onClose(); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="max-w-sm p-0">
                <div className="px-5 pt-5 pb-4 space-y-3">
                    <DialogHeader>
                        <DialogTitle className="text-sm">Assigner une compétence</DialogTitle>
                    </DialogHeader>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Compétence</label>
                        <div className="mt-1">
                            <SearchableSelect value={competenceId} onChange={setCompetenceId} options={compOptions} placeholder="Sélectionner…" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Niveau</label>
                        <div className="flex gap-2 mt-1">
                            {NIVEAUX.map(n => (
                                <button key={n.value} onClick={() => setNiveau(n.value)}
                                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${niveau === n.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-dark-700 text-gray-400 hover:border-gray-300'}`}>
                                    {n.value}★
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Commentaire</label>
                        <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={2}
                            className="mt-0.5 w-full px-3 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none" />
                    </div>
                </div>
                <div className="flex justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>Annuler</Button>
                    <Button size="sm" className="text-xs" onClick={submit} disabled={!competenceId}>Assigner</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function VueCollaborateurs({ collaborateurs, competences }) {
    const [selectedId, setSelectedId] = useState(null);
    const [assignModal, setAssignModal] = useState(false);

    const selected = collaborateurs.find(c => c.id === selectedId);

    const retirer = (collabId, compId) => {
        router.delete(route('rh.collaborateurs.competences.retirer', [collabId, compId]), {
            preserveScroll: true,
            onSuccess: () => toast.success('Compétence retirée'),
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Liste collaborateurs */}
            <div className="md:col-span-1 space-y-1">
                {collaborateurs.map(c => (
                    <button key={c.id} onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${selectedId === c.id ? 'border-primary-300 bg-primary-50/50 dark:bg-primary-900/10 dark:border-primary-700' : 'border-gray-100 dark:border-dark-700 hover:border-gray-200 dark:hover:border-dark-600'}`}>
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                            {c.prenom?.[0]}{c.nom?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.prenom} {c.nom}</p>
                            <p className="text-[10px] text-gray-400 truncate">{c.poste || '—'}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{c.competences?.length || 0} comp.</span>
                    </button>
                ))}
            </div>

            {/* Compétences du collaborateur sélectionné */}
            <div className="md:col-span-2">
                {selected ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                Compétences de {selected.prenom} {selected.nom}
                            </h3>
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setAssignModal(true)}>
                                <Plus className="h-3 w-3" /> Assigner
                            </Button>
                        </div>
                        {selected.competences?.length === 0 && (
                            <p className="text-sm text-gray-400 py-4 text-center">Aucune compétence assignée</p>
                        )}
                        <div className="space-y-1.5">
                            {(selected.competences || []).map(comp => (
                                <div key={comp.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900 group">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-gray-800 dark:text-gray-200">{comp.nom}</span>
                                    </div>
                                    <NiveauBadge niveau={comp.niveau} />
                                    <button onClick={() => retirer(selected.id, comp.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                        <X className="h-3 w-3 text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                        Sélectionnez un collaborateur pour voir ses compétences
                    </div>
                )}
            </div>

            {assignModal && selected && (
                <AssignerCompetenceModal
                    open={assignModal}
                    onClose={() => setAssignModal(false)}
                    collaborateur={selected}
                    competences={competences}
                />
            )}
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────

const VUES = [
    { key: 'organigramme',  label: 'Organigramme',   icon: Network },
    { key: 'competences',   label: 'Compétences',    icon: BookOpen },
    { key: 'collaborateurs',label: 'Par collaborateur', icon: Users },
];

export default function RhIndex({ collaborateurs = [], competences = [] }) {
    const [vue, setVue] = useState('organigramme');

    return (
        <AppLayout title="Ressources Humaines">
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
                {/* ── En-tête ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ressources Humaines</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {collaborateurs.length} collaborateur{collaborateurs.length > 1 ? 's' : ''} · {competences.length} compétence{competences.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* ── Navigation vues ── */}
                <div className="flex gap-1 border-b border-gray-100 dark:border-dark-700">
                    {VUES.map(v => (
                        <button key={v.key} onClick={() => setVue(v.key)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${vue === v.key
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                            <v.icon className="h-4 w-4" />
                            {v.label}
                        </button>
                    ))}
                </div>

                {/* ── Contenu ── */}
                <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-700 p-5">
                    {vue === 'organigramme' && <VueOrganigramme collaborateurs={collaborateurs} />}
                    {vue === 'competences' && <VueReferentielCompetences competences={competences} />}
                    {vue === 'collaborateurs' && <VueCollaborateurs collaborateurs={collaborateurs} competences={competences} />}
                </div>
            </div>
        </AppLayout>
    );
}
