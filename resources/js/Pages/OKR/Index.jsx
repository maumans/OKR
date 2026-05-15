import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import EmptyState from '@/Components/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Search, Plus, Target, Eye, Trash2, Pencil, Copy,
 ChevronDown, ChevronRight, CheckSquare, X, Filter,
} from 'lucide-react';
import {
 DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';

const statutLabels = { brouillon: 'Brouillon', actif: 'Actif', termine: 'Terminé', annule: 'Annulé', a_faire: 'À faire', en_cours: 'En cours', bloque: 'Bloqué' };
const prioriteColors = { basse: '#94a3b8', normale: '#f59e0b', haute: '#ef4444', urgente: '#dc2626' };
const prioriteLabels = { basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' };
const tacheStatutIcons = { a_faire: 'border-gray-300', en_cours: 'border-primary-500 bg-primary-500/20', termine: 'border-emerald-500 bg-emerald-500', bloque: 'border-red-500 bg-red-500/20' };
const krBarColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#ef4444'];

function getSeuilColor(val, seuils) {
 if (!seuils?.length) return null;
 return seuils.find(s => val >= Number(s.seuil_min) && val <= Number(s.seuil_max))?.couleur || null;
}

function formatDeadline(dateStr) {
 if (!dateStr) return '';
 const d = new Date(dateStr);
 const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
 const day = d.getDate();
 const weekStart = day <= 7 ? 'Sem 1' : day <= 14 ? 'Sem 2' : day <= 21 ? 'Sem 3' : 'Fin';
 return `${weekStart} ${months[d.getMonth()]}`;
}

function formatPeriodDates(p) {
 if (!p.date_debut || !p.date_fin) return '';
 const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
 const d1 = new Date(p.date_debut);
 const d2 = new Date(p.date_fin);
 return `${months[d1.getMonth()]}-${months[d2.getMonth()]}`;
}

// ─── Modal de création rapide d'objectif ────────────────────
function CreateObjectifModal({ open, onClose, periodes, defaultCollaborateurId, collaborateurs, auth }) {
 const [error, setError] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const [formData, setFormData] = useState({
 titre: '',
 periode_ids: periodes[0]?.id ? [periodes[0].id] : [],
 collaborateur_id: String(defaultCollaborateurId || ''),
 resultats_cles: [{ description: '' }],
 });

 const setField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
 const addKR = () => setField('resultats_cles', [...formData.resultats_cles, { description: '' }]);
 const removeKR = (i) => {
 const n = [...formData.resultats_cles];
 n.splice(i, 1);
 setField('resultats_cles', n);
 };
 const updateKR = (i, val) => {
 const n = [...formData.resultats_cles];
 n[i] = { description: val };
 setField('resultats_cles', n);
 };

 const togglePeriode = (periodeId) => {
 setFormData(prev => {
 const current = prev.periode_ids || [];
 const updated = current.includes(periodeId)
 ? current.filter(id => id !== periodeId)
 : [...current, periodeId];
 return { ...prev, periode_ids: updated };
 });
 };

 const resetForm = () => {
 setFormData({
 titre: '',
 periode_ids: periodes[0]?.id ? [periodes[0].id] : [],
 collaborateur_id: String(defaultCollaborateurId || ''),
 resultats_cles: [{ description: '' }],
 });
 setError('');
 };

 const handleSubmit = (e) => {
 e.preventDefault();
 setError('');

 if (!formData.titre.trim()) {
 setError('Le titre est obligatoire.');
 return;
 }

 if (formData.periode_ids.length === 0) {
 setError('Sélectionnez au moins une période.');
 return;
 }

 // Filtrer les KR vides
 const filledKRs = formData.resultats_cles.filter(kr => kr.description.trim() !== '');
 if (filledKRs.length === 0) {
 setError('Ajoutez au moins un résultat clé.');
 return;
 }

 setSubmitting(true);
 router.post(route('objectifs.store'), {
 titre: formData.titre,
 periode_id: formData.periode_ids[0],
 periode_ids: formData.periode_ids,
 collaborateur_id: formData.collaborateur_id,
 resultats_cles: filledKRs,
 }, {
 preserveScroll: true,
 preserveState: true,
 onSuccess: () => { toast.success('Objectif créé avec succès'); resetForm(); setSubmitting(false); onClose(); },
 onError: (errs) => {
 setError(Object.values(errs)[0] || 'Une erreur est survenue.');
 setSubmitting(false);
 },
 onFinish: () => setSubmitting(false),
 });
 };

 return (
 <Dialog open={open} onOpenChange={(v) => { if (!v) setError(''); onClose(); }}>
 <DialogContent aria-describedby={undefined} className="max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col">
 <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
 <div className="p-5 pb-3 shrink-0">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-base">
 <Target className="h-4 w-4 text-secondary-500" />
 Nouvel objectif
 </DialogTitle>
 </DialogHeader>

 {/* Erreur globale */}
 {error && (
 <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
 <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
 </div>
 )}
 </div>
 <div className="px-5 pb-5 overflow-y-auto flex-1 min-h-0">
 <div className="mt-4 space-y-3">
 {/* Intitulé */}
 <div>
 <div className="h-1 w-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 mb-1.5" />
 <label className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Intitulé</label>
 <input
 type="text"
 value={formData.titre}
 onChange={e => setField('titre', e.target.value)}
 placeholder="Ex: Signer 3 missions en Q2..."
 className="w-full mt-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
 autoFocus
 />
 </div>

 {/* Périodes (multi-sélection) */}
 <div>
 <div className="h-1 w-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 mb-1.5" />
 <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
 Périodes
 {formData.periode_ids.length > 1 && (
 <span className="ml-1.5 text-[9px] font-normal text-emerald-400">
 ({formData.periode_ids.length} sélectionnées — multi-trimestre)
 </span>
 )}
 </label>
 <div className="flex flex-wrap gap-1.5 mt-1.5">
 {periodes.map(p => {
 const isSelected = formData.periode_ids.includes(p.id);
 return (
 <label
 key={p.id}
 className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer border transition-all ${
 isSelected
 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold'
 : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-dark-600'
 }`}
 >
 <input
 type="checkbox"
 className="rounded text-emerald-500 w-3 h-3 focus:ring-emerald-500/30"
 checked={isSelected}
 onChange={() => togglePeriode(p.id)}
 />
 {p.nom}
 </label>
 );
 })}
 </div>
 </div>

 {/* Responsable (compact) */}
 {auth?.isResponsable && collaborateurs.length > 1 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responsable</label>
 <select
 value={formData.collaborateur_id}
 onChange={e => setField('collaborateur_id', e.target.value)}
 className="w-full mt-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all appearance-none cursor-pointer"
 >
 {collaborateurs.map(c => <option key={c.id} value={String(c.id)}>{c.prenom} {c.nom}</option>)}
 </select>
 </div>
 )}
 </div>

 {/* Key Results */}
 <div className="mt-5">
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Key Results</p>
 <div className="space-y-2">
 {formData.resultats_cles.map((kr, i) => (
 <div key={i} className="flex items-center gap-2">
 <input
 type="text"
 value={kr.description}
 onChange={e => updateKR(i, e.target.value)}
 placeholder={`KR ${i + 1} : ex. Atteindre 100 ventes...`}
 className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
 />
 {formData.resultats_cles.length > 1 && (
 <button type="button" onClick={() => removeKR(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
 <X className="h-3.5 w-3.5" />
 </button>
 )}
 </div>
 ))}
 </div>
 <button
 type="button"
 onClick={addKR}
 className="w-full mt-2 py-2 text-xs font-medium text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg border border-dashed border-gray-200 dark:border-dark-700 transition-all flex items-center justify-center gap-1"
 >
 + Ajouter un KR
 </button>
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
 <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-all">
 Annuler
 </button>
 <button type="submit" disabled={submitting} className="px-5 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-all disabled:opacity-50">
 {submitting ? 'Enregistrement...' : 'Enregistrer'}
 </button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 );
}

// ─── Modal d'ajout rapide de tâche ──────────────────────────
function AddTaskModal({ open, onClose, objectifId, resultatsCles = [], defaultResultatCleId, collaborateurs, defaultCollaborateurId, auth }) {
 const [taskError, setTaskError] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const [taskData, setTaskData] = useState({
 titre: '',
 priorite: 'normale',
 eisenhower: '',
 collaborateur_id: String(defaultCollaborateurId || ''),
 resultat_cle_id: String(defaultResultatCleId || resultatsCles[0]?.id || ''),
 date: '',
 });

 // Sync le KR sélectionné quand le modal s'ouvre avec un KR différent
 useEffect(() => {
 if (open) {
 setTaskData(prev => ({
 ...prev,
 titre: '',
 date: '',
 eisenhower: '',
 resultat_cle_id: String(defaultResultatCleId || resultatsCles[0]?.id || ''),
 collaborateur_id: String(defaultCollaborateurId || ''),
 }));
 setTaskError('');
 }
 }, [open, defaultResultatCleId]);

 const updateField = (field, value) => setTaskData(prev => ({ ...prev, [field]: value }));

 const handleSubmit = (e) => {
 e.preventDefault();
 setTaskError('');

 if (!taskData.titre.trim()) {
 setTaskError('Le titre est obligatoire.');
 return;
 }
 if (resultatsCles.length > 0 && !taskData.resultat_cle_id) {
 setTaskError('Veuillez sélectionner un résultat clé.');
 return;
 }

 setSubmitting(true);
 router.post(route('taches.store'), {
 titre: taskData.titre,
 priorite: taskData.priorite,
 eisenhower: taskData.eisenhower || null,
 collaborateur_id: taskData.collaborateur_id,
 date: taskData.date || null,
 objectif_id: objectifId,
 resultat_cle_id: taskData.resultat_cle_id || null,
 }, {
 preserveScroll: true,
 preserveState: true,
 onSuccess: () => {
 toast.success('Tâche créée avec succès');
 setTaskData({ titre: '', priorite: 'normale', eisenhower: '', collaborateur_id: String(defaultCollaborateurId || ''), resultat_cle_id: String(defaultResultatCleId || resultatsCles[0]?.id || ''), date: '' });
 setSubmitting(false);
 onClose();
 },
 onError: (errs) => {
 setTaskError(Object.values(errs)[0] || 'Une erreur est survenue.');
 setSubmitting(false);
 },
 });
 };

 return (
 <Dialog open={open} onOpenChange={(v) => { if (!v) setTaskError(''); onClose(); }}>
 <DialogContent aria-describedby={undefined} className="max-w-sm p-0 overflow-hidden">
 <form onSubmit={handleSubmit}>
 <div className="p-5 pb-4">
 <DialogHeader>
 <DialogTitle className="text-sm">Nouvelle tâche</DialogTitle>
 </DialogHeader>
 {taskError && (
 <div className="mt-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
 <p className="text-[11px] text-red-600 dark:text-red-400">{taskError}</p>
 </div>
 )}
 <div className="mt-3 space-y-2.5">
 <input
 type="text"
 value={taskData.titre}
 onChange={e => updateField('titre', e.target.value)}
 placeholder="Titre de la tâche..."
 className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
 autoFocus
 />
 {resultatsCles.length > 0 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Résultat Clé *</label>
 <select
 value={taskData.resultat_cle_id}
 onChange={e => updateField('resultat_cle_id', e.target.value)}
 className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer"
 >
 {resultatsCles.map(kr => <option key={kr.id} value={String(kr.id)}>{kr.description}</option>)}
 </select>
 </div>
 )}
 <div className="grid grid-cols-2 gap-2">
 <select
 value={taskData.priorite}
 onChange={e => updateField('priorite', e.target.value)}
 className="px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer"
 >
 <option value="basse">Basse</option>
 <option value="normale">Normale</option>
 <option value="haute">Haute</option>
 <option value="urgente">Urgente</option>
 </select>
 <select
 value={taskData.eisenhower}
 onChange={e => updateField('eisenhower', e.target.value)}
 className="px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer"
 >
 <option value="">Eisenhower...</option>
 <option value="Q1">Q1 — Faire maintenant · Urgent + Important</option>
 <option value="Q2">Q2 — Planifier · Important + Pas urgent</option>
 <option value="Q3">Q3 — Déléguer · Urgent + Pas important</option>
 <option value="Q4">Q4 — Éliminer · Ni urgent ni important</option>
 </select>
 </div>
 <CustomDatePicker
 value={taskData.date}
 onChange={v => updateField('date', v)}
 placeholder="Date d'échéance"
 size="sm"
 />
 {auth?.isResponsable && collaborateurs.length > 1 && (
 <select
 value={taskData.collaborateur_id}
 onChange={e => updateField('collaborateur_id', e.target.value)}
 className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer"
 >
 {collaborateurs.map(c => <option key={c.id} value={String(c.id)}>{c.prenom} {c.nom}</option>)}
 </select>
 )}
 </div>
 </div>
 <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
 <button type="button" onClick={onClose} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-all">
 Annuler
 </button>
 <button type="submit" disabled={submitting} className="px-4 py-1 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-all disabled:opacity-50">
 {submitting ? 'Création...' : 'Créer'}
 </button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 );
}

// ─── Modal d'édition complète d'un objectif ─────────────────
function EditObjectifModal({ open, onClose, objectif, collaborateurs, periodes, axes, typesObjectifs = [], typesResultatsCles = [], configuration, auth }) {
 const devise = auth?.societe?.devise;
 const [error, setError] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const isPondere = configuration?.mode_calcul === 'pondere';
 const [formData, setFormData] = useState({});

 useEffect(() => {
 if (open && objectif) {
 setFormData({
 titre: objectif.titre || '',
 collaborateur_id: String(objectif.collaborateur_id || ''),
 periode_ids: objectif.periode_ids || [],
 axe_objectif_id: String(objectif.axe_objectif_id || ''),
 type_objectif_id: String(objectif.type_objectif_id || ''),
 visibilite: objectif.visibilite || 'equipe',
 prime: objectif.prime || 0,
 resultats_cles: (objectif.resultats_cles || []).map(kr => ({
 id: kr.id,
 description: kr.description || '',
 description_detaillee: kr.description_detaillee || '',
 type_resultat_cle_id: String(kr.type_resultat_cle_id || ''),
 valeur_cible: kr.valeur_cible || 100,
 poids: kr.poids || 1,
 unite: kr.unite || '',
 })),
 });
 setError('');
 }
 }, [open, objectif]);

 const setField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

 const updateKR = (index, field, value) => {
 setFormData(prev => {
 const krs = [...prev.resultats_cles];
 krs[index] = { ...krs[index], [field]: value };
 return { ...prev, resultats_cles: krs };
 });
 };
 const addKR = () => setField('resultats_cles', [...formData.resultats_cles, { id: null, description: '', description_detaillee: '', type_resultat_cle_id: '', valeur_cible: 100, poids: 1, unite: '' }]);
 const removeKR = (i) => {
 const krs = [...formData.resultats_cles];
 krs.splice(i, 1);
 setField('resultats_cles', krs);
 };

 const handleSubmit = (e) => {
 e.preventDefault();
 setError('');
 if (!formData.titre?.trim()) { setError('Le titre est obligatoire.'); return; }
 const filledKRs = formData.resultats_cles.filter(kr => kr.description.trim());
 if (filledKRs.length === 0) { setError('Ajoutez au moins un résultat clé.'); return; }

 setSubmitting(true);
 router.put(route('objectifs.update', objectif.id), {
 ...formData,
 resultats_cles: filledKRs,
 }, {
 preserveScroll: true,
 preserveState: true,
 onSuccess: () => { toast.success('Objectif mis à jour'); setSubmitting(false); onClose(); },
 onError: (errs) => { setError(Object.values(errs)[0] || 'Une erreur est survenue.'); setSubmitting(false); },
 onFinish: () => setSubmitting(false),
 });
 };

 if (!objectif) return null;

 return (
 <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
 <DialogContent aria-describedby={undefined} className="max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
 <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
 <div className="p-5 pb-3 border-b border-gray-100 dark:border-dark-700 shrink-0">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-base">
 <Pencil className="h-4 w-4 text-primary-500" />
 Modifier l'objectif
 </DialogTitle>
 </DialogHeader>
 {error && (
 <div className="mt-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
 <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
 </div>
 )}
 </div>

 <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
 {/* Titre */}
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Titre *</label>
 <input type="text" value={formData.titre || ''} onChange={e => setField('titre', e.target.value)}
 className="w-full mt-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
 </div>

 {/* Grid: Responsable + Période */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responsable *</label>
 <select value={formData.collaborateur_id || ''} onChange={e => setField('collaborateur_id', e.target.value)}
 disabled={!auth?.isResponsable}
 className="w-full mt-1 px-2.5 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
 {collaborateurs.map(c => <option key={c.id} value={String(c.id)}>{c.prenom} {c.nom}</option>)}
 </select>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Périodes</label>
 <div className="flex flex-wrap gap-1.5 mt-1">
 {periodes.map(p => (
 <label key={p.id} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md text-[11px] cursor-pointer">
 <input 
 type="checkbox" 
 className="rounded text-primary-500 w-3 h-3"
 checked={(formData.periode_ids || []).includes(p.id)}
 onChange={e => {
 const current = formData.periode_ids || [];
 setField('periode_ids', e.target.checked ? [...current, p.id] : current.filter(id => id !== p.id));
 }}
 />
 {p.nom}
 </label>
 ))}
 </div>
 </div>
 </div>

 {/* Grid: Axe + Type */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Axe stratégique</label>
 <select value={formData.axe_objectif_id || ''} onChange={e => setField('axe_objectif_id', e.target.value)}
 className="w-full mt-1 px-2.5 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs appearance-none cursor-pointer">
 <option value="">Aucun</option>
 {axes.map(a => <option key={a.id} value={String(a.id)}>{a.nom}</option>)}
 </select>
 </div>
 {typesObjectifs.length > 0 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</label>
 <select value={formData.type_objectif_id || ''} onChange={e => setField('type_objectif_id', e.target.value)}
 className="w-full mt-1 px-2.5 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs appearance-none cursor-pointer">
 <option value="">Aucun</option>
 {typesObjectifs.map(t => <option key={t.id} value={String(t.id)}>{t.nom} ({t.niveau})</option>)}
 </select>
 </div>
 )}
 </div>

 {/* Grid: Visibilité + Prime */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visibilité</label>
 <select value={formData.visibilite || 'equipe'} onChange={e => setField('visibilite', e.target.value)}
 className="w-full mt-1 px-2.5 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs appearance-none cursor-pointer">
 <option value="tous">Tous</option>
 <option value="equipe">Équipe</option>
 <option value="prive">Privé</option>
 </select>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prime ({devise?.code || 'GNF'})</label>
 <input type="number" value={formData.prime || ''} onChange={e => setField('prime', e.target.value)} placeholder="0"
 className="w-full mt-1 px-2.5 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs" />
 </div>
 </div>

 {/* Résultats Clés */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Résultats Clés</label>
 <button type="button" onClick={addKR} className="text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
 <Plus className="h-3 w-3" /> Ajouter un KR
 </button>
 </div>
 <div className="space-y-2">
 {(formData.resultats_cles || []).map((kr, i) => (
 <div key={kr.id || `new-${i}`} className="p-3 rounded-lg border border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 space-y-2">
 <div className="flex items-start gap-2">
 <span className="text-[10px] font-bold text-gray-400 mt-2.5 w-5 shrink-0">#{i + 1}</span>
 <div className="flex-1 space-y-1.5">
 <input type="text" value={kr.description} onChange={e => updateKR(i, 'description', e.target.value)} placeholder="Titre du KR..."
 className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
 <textarea value={kr.description_detaillee || ''} onChange={e => updateKR(i, 'description_detaillee', e.target.value)} placeholder="Détails, notes..."
 className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-h-[40px]" />
 </div>
 {typesResultatsCles.length > 0 && (
 <select value={kr.type_resultat_cle_id || ''} onChange={e => updateKR(i, 'type_resultat_cle_id', e.target.value)}
 className="w-28 px-2 py-1.5 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] appearance-none cursor-pointer shrink-0">
 <option value="">Type...</option>
 {typesResultatsCles.map(t => <option key={t.id} value={String(t.id)}>{t.nom}</option>)}
 </select>
 )}
 {(formData.resultats_cles || []).length > 1 && (
 <button type="button" onClick={() => removeKR(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0">
 <Trash2 className="h-3.5 w-3.5" />
 </button>
 )}
 </div>
 <div className="flex items-center gap-3 ml-7">
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] text-gray-400">Cible</span>
 <input type="number" value={kr.valeur_cible || ''} onChange={e => updateKR(i, 'valeur_cible', e.target.value)}
 className="w-20 px-2 py-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-[11px]" />
 </div>
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] text-gray-400">Unité</span>
 <input type="text" value={kr.unite || ''} onChange={e => updateKR(i, 'unite', e.target.value)} placeholder="—"
 className="w-16 px-2 py-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-[11px]" />
 </div>
 {isPondere && (
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] text-gray-400">Poids</span>
 <input type="number" value={kr.poids || ''} onChange={e => updateKR(i, 'poids', e.target.value)}
 className="w-16 px-2 py-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-[11px]" />
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 shrink-0">
 <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-all">
 Annuler
 </button>
 <button type="submit" disabled={submitting} className="px-5 py-1.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-all disabled:opacity-50">
 {submitting ? 'Enregistrement...' : 'Enregistrer'}
 </button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 );
}

// ─── Panneau de détail d'une tâche (slide-over) ─────────────
const stepColors = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500', 'bg-amber-500'];

function TaskDetailPanel({ tache, onClose, objectifTitre, collaborateurs = [], auth }) {
 const [activeTab, setActiveTab] = useState('fiche');
 const [noteText, setNoteText] = useState('');
 const [editing, setEditing] = useState(false);
 const [editData, setEditData] = useState({});
 const [saving, setSaving] = useState(false);

 const parseJsonArray = (val) => {
 if (Array.isArray(val)) return val;
 if (typeof val === 'string') {
 try { return JSON.parse(val) || []; } catch { return val.trim() ? [val] : []; }
 }
 return [];
 };

 // Reset quand une nouvelle tâche s'ouvre
 useEffect(() => {
 if (tache) {
 setEditing(false);
 setEditData({
 titre: tache.titre || '',
 description: tache.description || '',
 mode_operatoire: parseJsonArray(tache.mode_operatoire),
 outils: tache.outils || '',
 definition_done: parseJsonArray(tache.definition_done),
 priorite: tache.priorite || 'normale',
 eisenhower: tache.eisenhower || '',
 date: tache.date || '',
 collaborateur_id: String(tache.collaborateur_id || ''),
 statut: tache.statut || 'a_faire',
 });
 document.body.style.overflow = 'hidden';
 return () => { document.body.style.overflow = ''; };
 }
 }, [tache]);

 // Fermer avec Escape (useEffect séparé pour éviter le reset de editing)
 useEffect(() => {
 const handleEscape = (e) => {
 if (e.key === 'Escape') { if (editing) setEditing(false); else onClose(); }
 };
 if (tache) {
 document.addEventListener('keydown', handleEscape);
 return () => document.removeEventListener('keydown', handleEscape);
 }
 }, [tache, editing, onClose]);

 const handleSaveTask = () => {
 setSaving(true);
 router.put(route('taches.update', tache.id), editData, {
 preserveScroll: true,
 onSuccess: () => { toast.success('Tâche mise à jour'); setSaving(false); setEditing(false); onClose(); },
 onError: () => setSaving(false),
 onFinish: () => setSaving(false),
 });
 };

 if (!tache) return null;

 const prioConfig = {
 basse: { label: 'Basse', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
 normale: { label: 'Normale', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
 haute: { label: 'Haute', cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
 urgente: { label: 'Urgente', cls: 'bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
 };
 const prio = prioConfig[tache.priorite] || prioConfig.normale;

 // Données structurées depuis les colonnes dédiées
 const moSteps = parseJsonArray(tache.mode_operatoire);
 const outilsList = tache.outils ? tache.outils.split(',').map(s => s.trim()).filter(Boolean) : [];
 const doneItems = parseJsonArray(tache.definition_done);

 return (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 bg-black/30 z-[60]"
 onClick={onClose}
 />

 <motion.div
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 transition={{ type: 'spring', damping: 30, stiffness: 300 }}
 className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white dark:bg-dark-900 z-[70] shadow-2xl flex flex-col border-l border-gray-200 dark:border-dark-800"
 >
 {/* Header */}
 <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 {editing ? (
 <input type="text" value={editData.titre} onChange={e => setEditData(prev => ({ ...prev, titre: e.target.value }))}
 className="w-full text-[13px] font-bold text-gray-900 dark:text-white px-2 py-1 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
 ) : (
 <h2 className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug">{tache.titre}</h2>
 )}
 {objectifTitre && (
 <p className="text-[10px] text-gray-400 mt-1 leading-snug">KR : {objectifTitre}</p>
 )}
 </div>
 <div className="flex items-center gap-1 shrink-0 mt-0.5">
 {editing ? (
 <>
 <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors" title="Annuler">
 <X className="h-4 w-4" />
 </button>
 <button onClick={handleSaveTask} disabled={saving} className="p-1 text-gray-400 hover:text-emerald-500 rounded transition-colors" title="Enregistrer">
 {saving ? <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
 </button>
 </>
 ) : (
 <>
 <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors" title="Modifier">
 <Pencil className="h-4 w-4" />
 </button>
 <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors">
 <X className="h-4 w-4" />
 </button>
 </>
 )}
 </div>
 </div>

 {/* Tabs */}
 <div className="flex border-b border-gray-200 dark:border-dark-800 px-5">
 <button
 onClick={() => setActiveTab('fiche')}
 className={`pb-2 mr-6 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'fiche' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
 >
 Fiche
 </button>
 <button
 onClick={() => setActiveTab('note')}
 className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'note' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
 >
 Note
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto">
 {activeTab === 'fiche' ? (
 <div className="px-5 py-4 space-y-5">
 {/* ── INFORMATIONS ─────────────────── */}
 <div>
 <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <span className="text-[11px]">📋</span> Informations
 </p>
 {editing ? (
 <div className="space-y-2">
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] text-gray-400">Statut</label>
 <select value={editData.statut} onChange={e => setEditData(prev => ({ ...prev, statut: e.target.value }))}
 className="w-full mt-0.5 px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] appearance-none cursor-pointer">
 <option value="a_faire">À faire</option>
 <option value="en_cours">En cours</option>
 <option value="termine">Terminé</option>
 <option value="bloque">Bloqué</option>
 </select>
 </div>
 <div>
 <label className="text-[10px] text-gray-400">Priorité</label>
 <select value={editData.priorite} onChange={e => setEditData(prev => ({ ...prev, priorite: e.target.value }))}
 className="w-full mt-0.5 px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] appearance-none cursor-pointer">
 <option value="basse">Basse</option>
 <option value="normale">Normale</option>
 <option value="haute">Haute</option>
 <option value="urgente">Urgente</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] text-gray-400">Eisenhower</label>
 <select value={editData.eisenhower || ''} onChange={e => setEditData(prev => ({ ...prev, eisenhower: e.target.value }))}
 className="w-full mt-0.5 px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] appearance-none cursor-pointer">
 <option value="">Aucun</option>
 <option value="Q1">Q1 — Faire maintenant · Urgent + Important</option>
 <option value="Q2">Q2 — Planifier · Important + Pas urgent</option>
 <option value="Q3">Q3 — Déléguer · Urgent + Pas important</option>
 <option value="Q4">Q4 — Éliminer · Ni urgent ni important</option>
 </select>
 </div>
 <div>
 <label className="text-[10px] text-gray-400">Date</label>
 <CustomDatePicker
 value={editData.date || ''}
 onChange={v => setEditData(prev => ({ ...prev, date: v }))}
 placeholder="Date"
 size="sm"
 />
 </div>
 </div>
 <div className="grid grid-cols-1 gap-2">
 {collaborateurs.length > 0 && (
 <div>
 <label className="text-[10px] text-gray-400">Responsable</label>
 <select value={editData.collaborateur_id || ''} onChange={e => setEditData(prev => ({ ...prev, collaborateur_id: e.target.value }))}
 disabled={!auth?.isResponsable}
 className="w-full mt-0.5 px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
 {collaborateurs.map(c => <option key={c.id} value={String(c.id)}>{c.prenom} {c.nom}</option>)}
 </select>
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
 {tache.collaborateur || 'Non assigné'}
 </span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
 tache.statut === 'termine' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
 tache.statut === 'en_cours' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' :
 tache.statut === 'bloque' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
 }`}>
 {statutLabels[tache.statut] || tache.statut}
 </span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prio.cls}`}>
 {prio.label}
 </span>
 {tache.eisenhower && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
 {tache.eisenhower}
 </span>
 )}
 {tache.date && (
 <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-700 text-gray-500">
 {formatDeadline(tache.date)}
 </span>
 )}
 </div>
 )}
 </div>

 {/* ── DESCRIPTION & CONTEXTE ──────── */}
 <div>
 <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <span className="text-[11px]">📝</span> Description & Contexte
 </p>
 {editing ? (
 <textarea value={editData.description || ''} onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
 placeholder="Ajouter une description..."
 className="w-full min-h-[80px] px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[12px] text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-y" />
 ) : tache.description ? (
 <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{tache.description}</p>
 ) : (
 <p className="text-[12px] text-gray-400 italic">Aucune description ajoutée.</p>
 )}
 </div>

 {/* ── MODE OPÉRATOIRE ─────────────── */}
 <div>
 <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <span className="text-[11px]">📋</span> Mode Opératoire
 </p>
 {editing ? (
 <div className="space-y-1.5">
 {(editData.mode_operatoire || []).map((step, i) => (
 <div key={i} className="flex items-center gap-2">
 <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{i + 1}.</span>
 <input type="text" value={step} onChange={e => { const arr = [...(editData.mode_operatoire || [])]; arr[i] = e.target.value; setEditData(prev => ({ ...prev, mode_operatoire: arr })); }}
 className="flex-1 px-2 py-1 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
 <button type="button" onClick={() => { const arr = [...(editData.mode_operatoire || [])]; arr.splice(i, 1); setEditData(prev => ({ ...prev, mode_operatoire: arr })); }}
 className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
 </div>
 ))}
 <button type="button" onClick={() => setEditData(prev => ({ ...prev, mode_operatoire: [...(prev.mode_operatoire || []), ''] }))}
 className="text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 mt-1">
 <Plus className="h-3 w-3" /> Ajouter une étape
 </button>
 </div>
 ) : moSteps.length > 0 ? (
 <div className="space-y-2">
 {moSteps.map((step, i) => (
 <div key={i} className="flex items-start gap-2.5">
 <span className={`h-5 w-5 shrink-0 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${stepColors[i % stepColors.length]}`}>
 {i + 1}
 </span>
 <span className="text-[12px] text-gray-700 dark:text-gray-300 leading-snug pt-0.5">{step}</span>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-[12px] text-gray-400 italic">Non défini.</p>
 )}
 </div>

 {/* ── OUTILS & RESSOURCES ─────────── */}
 <div>
 <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <span className="text-[11px]">🔧</span> Outils & Ressources
 </p>
 {editing ? (
 <input type="text" value={editData.outils || ''} onChange={e => setEditData(prev => ({ ...prev, outils: e.target.value }))}
 placeholder="Ex: LMS Addvalis, Notion, Standup hebdo (séparés par virgule)"
 className="w-full px-2 py-1.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
 ) : outilsList.length > 0 ? (
 <div className="flex items-center gap-2 flex-wrap">
 {outilsList.map((outil, i) => (
 <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400">
 {outil}
 </span>
 ))}
 </div>
 ) : (
 <p className="text-[12px] text-gray-400 italic">Aucun outil associé.</p>
 )}
 </div>

 {/* ── DÉFINITION DE "DONE" ────────── */}
 <div>
 <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
 <span className="text-[11px]">✅</span> Définition de "Done"
 </p>
 {editing ? (
 <div className="space-y-1.5">
 {(editData.definition_done || []).map((item, i) => (
 <div key={i} className="flex items-center gap-2">
 <span className="text-emerald-500 text-[12px] shrink-0">✓</span>
 <input type="text" value={item} onChange={e => { const arr = [...(editData.definition_done || [])]; arr[i] = e.target.value; setEditData(prev => ({ ...prev, definition_done: arr })); }}
 className="flex-1 px-2 py-1 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
 <button type="button" onClick={() => { const arr = [...(editData.definition_done || [])]; arr.splice(i, 1); setEditData(prev => ({ ...prev, definition_done: arr })); }}
 className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
 </div>
 ))}
 <button type="button" onClick={() => setEditData(prev => ({ ...prev, definition_done: [...(prev.definition_done || []), ''] }))}
 className="text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 mt-1">
 <Plus className="h-3 w-3" /> Ajouter un critère
 </button>
 </div>
 ) : doneItems.length > 0 ? (
 <div className="space-y-1.5">
 {doneItems.map((item, i) => (
 <div key={i} className="flex items-start gap-2">
 <span className="text-emerald-500 text-[12px] mt-0.5 shrink-0">✓</span>
 <span className="text-[12px] text-gray-700 dark:text-gray-300">{item}</span>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-[12px] text-gray-400 italic">Non défini.</p>
 )}
 </div>
 </div>
 ) : (
 /* ── Tab Note ──────────────────────── */
 <div className="px-5 py-4">
 <textarea
 value={noteText}
 onChange={e => setNoteText(e.target.value)}
 placeholder="Ajouter une note sur cette tâche..."
 className="w-full min-h-[200px] px-3 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[12px] text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-y transition-all"
 />
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="px-5 py-3 border-t border-gray-100 dark:border-dark-800 flex items-center gap-2">
 {editing ? (
 <>
 <button onClick={() => setEditing(false)}
 className="px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-all">
 Annuler
 </button>
 <button onClick={handleSaveTask} disabled={saving}
 className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all disabled:opacity-50">
 {saving ? 'Enregistrement...' : 'Enregistrer'}
 </button>
 </>
 ) : (
 <>
 {(tache.collaborateur_id === auth?.collaborateur?.id || auth?.isResponsable) && (
 <>
 <button onClick={() => setEditing(true)}
 className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-all">
 Modifier
 </button>
 <button
 onClick={() => { if (confirm('Supprimer cette tâche ?')) { router.delete(route('taches.destroy', tache.id), { preserveScroll: true, onSuccess: () => toast.success('Tâche supprimée') }); onClose(); } }}
 className="p-2.5 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 transition-all"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </>
 )}
 </>
 )}
 </div>
 </motion.div>
 </>
 );
}

// ─── Composant KR expandable (niveau 2) ─────────────────────
function KRRow({ kr, krIdx, seuils, onAddTaskForKr, onViewTask, objectifId, defaultExpanded = false, auth, objCollabId }) {
 const [expanded, setExpanded] = useState(defaultExpanded);
 const krColor = getSeuilColor(kr.progression, seuils) || krBarColors[krIdx % krBarColors.length];
 const krTaches = kr.taches || [];
 const krTerminees = krTaches.filter(t => t.statut === 'termine').length;

 return (
 <div className="border-b border-gray-100/80 dark:border-dark-800/50 last:border-b-0">
 {/* ── Barre KR cliquable ── */}
 <button
 onClick={() => setExpanded(!expanded)}
 className="w-full px-5 pt-3 pb-2 text-left group/kr"
 >
 <div className="flex items-center gap-2">
 <div className="shrink-0 transition-transform duration-200" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
 <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover/kr:text-gray-600 dark:group-hover/kr:text-gray-300" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="relative w-full h-7 rounded-md overflow-hidden bg-gray-50 dark:bg-dark-800 border border-gray-200/60 dark:border-dark-700">
 <div
 className="absolute inset-y-0 left-0 rounded-md transition-all duration-700"
 style={{ width: `${Math.min(kr.progression, 100)}%`, backgroundColor: krColor, opacity: 0.15 }}
 />
 <div className="relative flex items-center justify-between h-full px-3">
 <span className="text-[11px] font-semibold truncate z-10" style={{ color: krColor }}>{kr.description}</span>
 <div className="flex items-center gap-2 shrink-0 z-10">
 <span className="text-[10px] text-gray-400 dark:text-gray-500">
 {krTerminees}/{krTaches.length} tâches
 </span>
 <span className="text-[11px] font-bold" style={{ color: krColor }}>
 {Math.round(kr.progression)}%
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </button>

 {/* ── Contenu KR expandable : tâches ── */}
 <AnimatePresence>
 {expanded && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.15 }}
 className="overflow-hidden"
 >
 {krTaches.length > 0 ? (
 <div className="ml-7 border-l-2 border-gray-100 dark:border-dark-700">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-gray-200/60 dark:border-dark-700">
 <th className="pl-4 pr-2 py-1.5 w-8"></th>
 <th className="py-1.5 text-left text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tâche</th>
 <th className="py-1.5 px-2 text-left text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Resp.</th>
 <th className="py-1.5 px-2 text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Prio.</th>
 <th className="py-1.5 px-2 text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Eisen.</th>
 <th className="py-1.5 px-2 text-left text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Deadline</th>
 <th className="py-1.5 px-4 w-16"></th>
 </tr>
 </thead>
 <tbody>
 {krTaches.map((tache) => (
 <tr key={tache.id} className="border-t border-gray-50 dark:border-dark-800/50 hover:bg-gray-50/50 dark:hover:bg-dark-800/30 transition-colors group">
 <td className="pl-4 pr-2 py-2 w-8">
 <button
 onClick={(e) => {
 e.stopPropagation();
 const newStatut = tache.statut === 'termine' ? 'a_faire' : 'termine';
 router.put(route('taches.status', tache.id), { statut: newStatut }, { preserveScroll: true, onSuccess: () => toast.success(newStatut === 'termine' ? 'Tâche terminée' : 'Tâche réouverte') });
 }}
 className={`h-4 w-4 rounded border-2 cursor-pointer transition-all ${tacheStatutIcons[tache.statut] || tacheStatutIcons.a_faire}`}
 >
 {tache.statut === 'termine' && (
 <svg className="h-full w-full text-white p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
 <polyline points="20 6 9 17 4 12" />
 </svg>
 )}
 </button>
 </td>
 <td className="py-2">
 <span className={`text-[12px] ${tache.statut === 'termine' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
 {tache.titre}
 </span>
 </td>
 <td className="py-2 px-2">
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 whitespace-nowrap">
 {tache.collaborateur}
 </span>
 </td>
 <td className="py-2 px-2 text-center">
 <div className="flex justify-center">
 <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: prioriteColors[tache.priorite] || '#94a3b8' }}
 title={prioriteLabels[tache.priorite]} />
 </div>
 </td>
 <td className="py-2 px-2 text-center">
 {tache.eisenhower && (
 <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
 tache.eisenhower === 'Q1' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
 tache.eisenhower === 'Q2' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
 tache.eisenhower === 'Q3' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
 }`}>
 {tache.eisenhower}
 </span>
 )}
 </td>
 <td className="py-2 px-2">
 <span className="text-[11px] text-gray-500">{formatDeadline(tache.date)}</span>
 </td>
 <td className="py-2 px-4 text-right">
 {(tache.collaborateur_id === auth?.collaborateur?.id || auth?.isResponsable) && (
 <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={(e) => { e.stopPropagation(); onViewTask?.(tache, kr.description); }}
 className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
 title="Voir la fiche"
 >
 <Eye className="h-3.5 w-3.5 text-gray-400" />
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer cette tâche ?')) router.delete(route('taches.destroy', tache.id), { preserveScroll: true, onSuccess: () => toast.success('Tâche supprimée') }); }}
 className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-colors"
 title="Supprimer"
 >
 <Trash2 className="h-3.5 w-3.5 text-gray-400" />
 </button>
 </div>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="ml-7 border-l-2 border-gray-100 dark:border-dark-700 pl-4 py-2">
 <p className="text-[11px] text-gray-400 italic">Aucune tâche</p>
 </div>
 )}

 {/* Bouton ajouter tâche */}
 {(objCollabId === auth?.collaborateur?.id || auth?.isResponsable) && (
 <div className="ml-7 border-l-2 border-gray-100 dark:border-dark-700 pl-4 py-1.5 pb-2.5">
 <button onClick={() => onAddTaskForKr?.(objectifId, kr.id)} className="text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 hover:bg-primary-50 dark:hover:bg-primary-900/10 px-2 py-1 rounded transition-colors">
 <Plus className="h-3 w-3" /> Ajouter une tâche
 </button>
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}

// ─── Composant carte objectif (expandable, niveau 1) ─────────
function ObjectifCard({ obj, seuils, handleDelete, defaultExpanded = false, onAddTask, onViewTask, onAddTaskForKr, onEdit, auth }) {
 const [expanded, setExpanded] = useState(defaultExpanded);
 const progColor = getSeuilColor(obj.progression_globale, seuils) || '#3b82f6';
 const tachesTerminees = obj.taches_terminees || 0;
 const totalTaches = obj.taches_count || 0;

 return (
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden shadow-sm hover:shadow-md transition-all"
 >
 {/* ── Header objectif ─────────────────────────────── */}
 <div
 className="px-5 py-4 cursor-pointer select-none"
 onClick={() => setExpanded(!expanded)}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="mt-1 shrink-0 p-0.5 rounded transition-transform duration-200" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
 <ChevronRight className="h-4 w-4 text-gray-400" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: obj.axe_couleur || progColor }} />
 <h3
 className="font-semibold text-[15px] text-gray-900 dark:text-white leading-tight hover:underline cursor-pointer"
 onClick={(e) => { e.stopPropagation(); router.get(route('objectifs.show', obj.id)); }}
 >
 {obj.titre}
 </h3>
 {obj.axe && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
 style={{ backgroundColor: obj.axe_couleur || '#6b7280' }}>
 {obj.axe}
 </span>
 )}
 {obj.type && (
 <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 shrink-0">
 {obj.type}
 </span>
 )}
 <span className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
 style={{ backgroundColor: progColor + '15', color: progColor }}>
 {Math.round(obj.progression_globale)}%
 </span>
 </div>
 <div className="flex items-center gap-3 mt-1.5">
 <span className="text-xs text-gray-400">
 {tachesTerminees}/{totalTaches} tâches · {obj.resultats_count} KR
 </span>
 {totalTaches > 0 && (
 <div className="flex items-center gap-1.5">
 <div className="w-20 bg-gray-200 dark:bg-dark-700 rounded-full h-1.5 overflow-hidden">
 <div className="h-full rounded-full transition-all duration-500"
 style={{
 width: `${totalTaches > 0 ? (tachesTerminees / totalTaches) * 100 : 0}%`,
 backgroundColor: progColor,
 }}
 />
 </div>
 <span className="text-[10px] font-semibold text-gray-400">
 {totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0}%
 </span>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
 {(obj.collaborateur_id === auth?.collaborateur?.id || auth?.isResponsable) && (
 <button onClick={() => onEdit?.(obj)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
 <Pencil className="h-3.5 w-3.5 text-gray-400" />
 </button>
 )}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
 <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem asChild>
 <Link href={route('objectifs.show', obj.id)} className="flex items-center gap-2"><Eye className="h-4 w-4" />Détails</Link>
 </DropdownMenuItem>
 {(obj.collaborateur_id === auth?.collaborateur?.id || auth?.isResponsable) && (
 <DropdownMenuItem onClick={() => handleDelete(obj.id)} className="text-red-600">
 <Trash2 className="h-4 w-4 mr-2" />Supprimer
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </div>

 {/* ── Contenu expandable : KRs (chacun avec ses tâches) ── */}
 <AnimatePresence>
 {expanded && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="overflow-hidden"
 >
 {obj.resultats_cles && obj.resultats_cles.length > 0 ? (
 <div className="border-t border-gray-100 dark:border-dark-800">
 {obj.resultats_cles.map((kr, krIdx) => (
 <KRRow
 key={kr.id}
 kr={kr}
 krIdx={krIdx}
 seuils={seuils}
 objectifId={obj.id}
 onAddTaskForKr={onAddTaskForKr}
 onViewTask={onViewTask}
 defaultExpanded={krIdx === 0}
 auth={auth}
 objCollabId={obj.collaborateur_id}
 />
 ))}
 </div>
 ) : (
 <div className="px-5 py-4 border-t border-gray-100 dark:border-dark-800 text-center">
 <p className="text-xs text-gray-400">Aucun résultat clé</p>
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

// ─── Page principale ───────────────────────────────────────
export default function OKRIndex({ objectifs, filters, collaborateurs, periodes = [], axes = [], seuils = [], typesObjectifs = [], typesResultatsCles = [], configuration, vueOkr = 'cards', progressionGlobale = 0, velocite = 0, defaultCollaborateurId, auth }) {
 const devise = auth?.societe?.devise;
 const [search, setSearch] = useState(filters?.search || '');
 const [statutFilter, setStatutFilter] = useState(filters?.statut || '');
 const [collabFilter, setCollabFilter] = useState(filters?.collaborateur_id || '');
 const [periodeFilter, setPeriodeFilter] = useState(filters?.periode_id || '');
 const [axeFilter, setAxeFilter] = useState(filters?.axe_objectif_id || '');
 const [typeFilter, setTypeFilter] = useState(filters?.type_objectif_id || '');
 const [createOpen, setCreateOpen] = useState(false);
 const [editModal, setEditModal] = useState({ open: false, objectif: null });
 const [taskModal, setTaskModal] = useState({ open: false, objectifId: null, resultatsCles: [], defaultResultatCleId: null });
 const [taskPanel, setTaskPanel] = useState({ tache: null, objectifTitre: null });

 const applyFilters = (key, value) => {
 const f = { search, statut: statutFilter, collaborateur_id: collabFilter, periode_id: periodeFilter, axe_objectif_id: axeFilter, type_objectif_id: typeFilter, [key]: value };
 Object.keys(f).forEach(k => f[k] === '' && delete f[k]);
 router.get(route('objectifs.index'), f, { preserveState: true, replace: true });
 };

 const handleDelete = (id) => {
 if (confirm('Supprimer cet objectif ?')) router.delete(route('objectifs.destroy', id), { onSuccess: () => toast.success('Objectif supprimé') });
 };

 const selectedPeriode = periodes.find(p => p.id === Number(periodeFilter));
 const progColor = getSeuilColor(progressionGlobale, seuils) || '#3b82f6';
 const hasFilters = search || statutFilter || collabFilter || periodeFilter || axeFilter || typeFilter;

 return (
 <AppLayout title="Objectifs (OKR)">
 {/* ═══ Period Tabs (underline style + date range) ═══ */}
 {periodes.length > 0 && (
 <div className="flex items-center gap-4 mb-5 overflow-x-auto border-b border-gray-200 dark:border-dark-800 ">
 {periodes.map(p => {
 const active = String(periodeFilter) === String(p.id);
 const dateRange = formatPeriodDates(p);
 return (
 <button
 key={p.id}
 onClick={() => { setPeriodeFilter(active ? '' : String(p.id)); applyFilters('periode_id', active ? '' : String(p.id)); }}
 className={`shrink-0 pb-2.5 pt-1 text-xs font-semibold transition-all border-b-2 ${
 active
 ? 'border-primary-500 text-primary-600 dark:text-primary-400'
 : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
 }`}
 >
 {p.nom}
 {dateRange && <span className={`ml-1.5 font-normal ${active ? 'text-primary-400' : 'text-gray-400'}`}>{dateRange}</span>}
 </button>
 );
 })}
 </div>
 )}

 {/* ═══ Filter Bar ═══ */}
 <div className="flex items-center gap-2 mb-5 flex-wrap ">
 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Filtres</span>
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
 <input
 type="text"
 placeholder="Rechercher..."
 value={search}
 onChange={(e) => { setSearch(e.target.value); applyFilters('search', e.target.value); }}
 className="pl-8 pr-3 py-2 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 w-40 transition-all"
 />
 </div>
 <select
 value={periodeFilter}
 onChange={(e) => { setPeriodeFilter(e.target.value); applyFilters('periode_id', e.target.value); }}
 className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs px-2.5 py-2 leading-normal pr-7 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
 >
 <option value="">Toutes les périodes</option>
 {periodes.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
 </select>
 <select
 value={collabFilter}
 onChange={(e) => { setCollabFilter(e.target.value); applyFilters('collaborateur_id', e.target.value); }}
 className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs px-2.5 py-2 leading-normal pr-7 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
 >
 <option value="">Tous les responsables</option>
 {collaborateurs.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
 </select>
 <select
 value={statutFilter}
 onChange={(e) => { setStatutFilter(e.target.value); applyFilters('statut', e.target.value); }}
 className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs px-2.5 py-2 leading-normal pr-7 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
 >
 <option value="">Tous statuts</option>
 <option value="actif">Actif</option>
 <option value="brouillon">Brouillon</option>
 <option value="termine">Terminé</option>
 <option value="annule">Annulé</option>
 </select>
 <select
 value={axeFilter}
 onChange={(e) => { setAxeFilter(e.target.value); applyFilters('axe_objectif_id', e.target.value); }}
 className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs px-2.5 py-2 leading-normal pr-7 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
 >
 <option value="">Tous les axes</option>
 {axes.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
 </select>
 <select
 value={typeFilter}
 onChange={(e) => { setTypeFilter(e.target.value); applyFilters('type_objectif_id', e.target.value); }}
 className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs px-2.5 py-2 leading-normal pr-7 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer"
 >
 <option value="">Tous types</option>
 {typesObjectifs.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
 </select>
 {hasFilters && (
 <button
 onClick={() => { setSearch(''); setStatutFilter(''); setCollabFilter(''); setPeriodeFilter(''); setAxeFilter(''); setTypeFilter(''); router.get(route('objectifs.index'), {}, { preserveState: true, replace: true }); }}
 className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
 >
 <X className="h-3 w-3" /> Effacer
 </button>
 )}
 </div>

 {/* ═══ Global Progress Banner + Nouvel objectif ═══ */}
 <div className="flex items-center justify-between mb-5 gap-4 ">
 <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 flex items-center divide-x divide-gray-200 dark:divide-dark-800 flex-1 min-w-0">
 <div className="px-5 py-3 flex items-center gap-4 flex-1 min-w-0">
 <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: progColor }} />
 <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
 Progression {selectedPeriode ? selectedPeriode.nom : `${new Date().getFullYear()}`}
 </span>
 <div className="flex-1 bg-gray-200 dark:bg-dark-700 rounded-full h-2.5 overflow-hidden">
 <div className="h-full rounded-full transition-all duration-700"
 style={{ width: `${Math.min(progressionGlobale, 100)}%`, background: `linear-gradient(90deg, ${progColor}, ${progColor}dd)` }} />
 </div>
 <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: progColor }}>
 {progressionGlobale}%
 </span>
 </div>
 <div className="px-5 py-3 flex items-center gap-2 shrink-0">
 <div className="flex flex-col items-end">
 <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none">Vélocité Tâches</span>
 <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight mt-0.5">{velocite}%</span>
 </div>
 </div>
 </div>
 <button
 onClick={() => setCreateOpen(true)}
 className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-800 dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-gray-100 rounded-lg shadow-sm transition-all"
 >
 <Plus className="h-3.5 w-3.5" /> Nouvel objectif
 </button>
 </div>

 {/* ═══ Objectifs hiérarchiques ═══ */}
 {objectifs.data.length > 0 ? (
 <div className="space-y-3 ">
 {objectifs.data.map((obj, i) => (
 <ObjectifCard
 key={obj.id}
 obj={obj}
 seuils={seuils}
 handleDelete={handleDelete}
 defaultExpanded={i === 0}
 onEdit={(o) => setEditModal({ open: true, objectif: o })}
 onAddTask={(objId) => setTaskModal({ open: true, objectifId: objId, resultatsCles: obj.resultats_cles || [], defaultResultatCleId: null })}
 onAddTaskForKr={(objId, krId) => setTaskModal({ open: true, objectifId: objId, resultatsCles: obj.resultats_cles || [], defaultResultatCleId: krId })}
 onViewTask={(tache, krDescription) => setTaskPanel({ tache, objectifTitre: krDescription })}
 auth={auth}
 />
 ))}
 </div>
 ) : (
 <EmptyState icon={Target} title="Aucun objectif" description="Il n'y a aucun objectif correspondant à vos critères." action={
 <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all">
 <Plus className="h-4 w-4" />Créer un objectif
 </button>
 } />
 )}

 {/* ═══ Pagination ═══ */}
 {objectifs.links && objectifs.last_page > 1 && (
 <div className="flex justify-center gap-1 mt-8">
 {objectifs.links.map((link, i) => (
 <Link key={i} href={link.url || '#'}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${link.active ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-700'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
 dangerouslySetInnerHTML={{ __html: link.label }} />
 ))}
 </div>
 )}

 {/* ═══ Modal création objectif ═══ */}
 <CreateObjectifModal
 open={createOpen}
 onClose={() => setCreateOpen(false)}
 periodes={periodes}
 collaborateurs={collaborateurs}
 defaultCollaborateurId={defaultCollaborateurId}
 auth={auth}
 />

 {/* ═══ Modal création tâche ═══ */}
 <AddTaskModal
 open={taskModal.open}
 onClose={() => setTaskModal({ open: false, objectifId: null, resultatsCles: [], defaultResultatCleId: null })}
 objectifId={taskModal.objectifId}
 resultatsCles={taskModal.resultatsCles}
 defaultResultatCleId={taskModal.defaultResultatCleId}
 collaborateurs={collaborateurs}
 defaultCollaborateurId={defaultCollaborateurId}
 auth={auth}
 />

 {/* ═══ Modal édition objectif ═══ */}
 <EditObjectifModal
 open={editModal.open}
 onClose={() => setEditModal({ open: false, objectif: null })}
 objectif={editModal.objectif}
 collaborateurs={collaborateurs}
 periodes={periodes}
 axes={axes}
 typesObjectifs={typesObjectifs}
 typesResultatsCles={typesResultatsCles}
 configuration={configuration}
 auth={auth}
 />

 {/* ═══ Panneau détail tâche (slide-over) ═══ */}
 <AnimatePresence>
 {taskPanel.tache && (
 <TaskDetailPanel
 tache={taskPanel.tache}
 objectifTitre={taskPanel.objectifTitre}
 collaborateurs={collaborateurs}
 onClose={() => setTaskPanel({ tache: null, objectifTitre: null })}
 />
 )}
 </AnimatePresence>
 </AppLayout>
 );
}
