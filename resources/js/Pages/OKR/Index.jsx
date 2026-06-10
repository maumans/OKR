import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import EmptyState from '@/Components/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Search, Plus, Target, Eye, Trash2, Pencil, Copy,
 ChevronDown, ChevronRight, CheckSquare, CheckCircle2, Check, X, Filter,
 Paperclip, Download, FileText, FileImage, FileArchive, File,
 ChevronsUp, ChevronsDown,
} from 'lucide-react';
import {
 DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';

const statutLabels = { brouillon: 'Brouillon', actif: 'Actif', termine: 'Terminé', annule: 'Annulé', a_faire: 'À faire', en_cours: 'En cours', bloque: 'Bloqué' };

// ─── Icône circulaire de statut ───────────────────────────────
function TacheStatutIcon({ statut, size = 16 }) {
    const s = size;
    if (statut === 'termine') return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="#10b981" />
            <path d="M4.5 8.5L7 11L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    if (statut === 'en_cours') return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
            <path d="M8 5V8.5L10 10" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    if (statut === 'bloque') return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
    return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="2.5 2" />
        </svg>
    );
}

// ─── Sélecteur de statut inline (avec portal pour éviter le clipping) ──
const STATUTS_TACHE = [
    { value: 'a_faire',  label: 'À faire',   hint: '0%' },
    { value: 'en_cours', label: 'En cours',  hint: '50%' },
    { value: 'bloque',   label: 'Bloqué',    hint: '' },
    { value: 'termine',  label: 'Terminé',   hint: '100%' },
];

function TacheStatutPicker({ tache, canChange }) {
    const [open, setOpen] = useState(false);
    const [popupStyle, setPopupStyle] = useState({});
    const btnRef = useRef(null);

    const openPicker = (e) => {
        e.stopPropagation();
        if (!canChange) return;
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const popupH = STATUTS_TACHE.length * 40;
            const above = spaceBelow < popupH && rect.top > popupH;
            setPopupStyle({
                position: 'fixed',
                left: rect.left,
                width: 168,
                zIndex: 9999,
                ...(above ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
            });
        }
        setOpen(v => !v);
    };

    const select = (statut) => {
        setOpen(false);
        if (statut === tache.statut) return;
        router.put(route('taches.status', tache.id), { statut }, { preserveScroll: true });
    };

    return (
        <div className="flex items-center justify-center">
            <button
                ref={btnRef}
                onClick={openPicker}
                className={`flex items-center justify-center transition-transform hover:scale-110 ${canChange ? 'cursor-pointer' : 'cursor-default'}`}
                title={canChange ? 'Changer le statut' : statutLabels[tache.statut]}
            >
                <TacheStatutIcon statut={tache.statut} size={16} />
            </button>
            {open && createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
                    <div style={popupStyle} className="fixed bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl shadow-xl overflow-hidden z-[9999]">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-800">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Statut de la tâche</p>
                        </div>
                        {STATUTS_TACHE.map(s => (
                            <button
                                key={s.value}
                                onClick={() => select(s.value)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-dark-800 ${
                                    tache.statut === s.value ? 'bg-gray-50 dark:bg-dark-800 font-semibold' : 'font-normal text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <TacheStatutIcon statut={s.value} size={14} />
                                <span className="flex-1 text-left">{s.label}</span>
                                {s.hint && <span className="text-[10px] text-gray-400">{s.hint}</span>}
                                {tache.statut === s.value && <Check className="h-3 w-3 text-primary-500 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
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
function CreateObjectifModal({ open, onClose, periodes, defaultCollaborateurId, collaborateurs, axes = [], typesObjectifs = [], typesResultatsCles = [], configuration, auth, missions = [] }) {
 const devise = auth?.societe?.devise;
 const isPondere = configuration?.mode_calcul === 'pondere';
 const [error, setError] = useState('');
 const [submitting, setSubmitting] = useState(false);

 const makeKR = () => ({
 description: '', description_detaillee: '', type_resultat_cle_id: '',
 valeur_cible: 100, unite: '', poids: 1,
 mode_calcul: 'pourcentage', milestones: [],
 });

 const [formData, setFormData] = useState({
 titre: '',
 periode_ids: periodes[0]?.id ? [periodes[0].id] : [],
 collaborateur_id: String(defaultCollaborateurId || ''),
 axe_objectif_id: '',
 type_objectif_id: '',
 visibilite: configuration?.visibilite_defaut || 'equipe',
 prime: '',
 mission_id: '',
 resultats_cles: [makeKR()],
 });

 // Mois couverts par les périodes sélectionnées
 const moisPeriode = useMemo(() => {
 const selected = periodes.filter(p => formData.periode_ids.includes(p.id));
 const mois = [];
 for (const p of selected) {
 if (!p.date_debut || !p.date_fin) continue;
 let cur = new Date(p.date_debut + 'T00:00:00');
 const end = new Date(p.date_fin + 'T00:00:00');
 while (cur <= end) {
 const key = cur.toISOString().slice(0, 7);
 const lab = cur.toLocaleDateString('fr-FR', { month: 'short' });
 if (!mois.find(m => m.mois === key)) {
 mois.push({ mois: key, label: lab.charAt(0).toUpperCase() + lab.slice(1, 4) + '.', cible: 0, valeur_actuelle: 0 });
 }
 cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
 }
 }
 return mois;
 }, [formData.periode_ids, periodes]);

 const setField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
 const addKR = () => setField('resultats_cles', [...formData.resultats_cles, makeKR()]);
 const removeKR = (i) => {
 const n = [...formData.resultats_cles]; n.splice(i, 1); setField('resultats_cles', n);
 };
 const updateKR = (i, field, value) => {
 const n = [...formData.resultats_cles];
 n[i] = { ...n[i], [field]: value };
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
 axe_objectif_id: '',
 type_objectif_id: '',
 visibilite: configuration?.visibilite_defaut || 'equipe',
 prime: '',
 mission_id: '',
 resultats_cles: [makeKR()],
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

 // Filtrer les KR sans description
 const filledKRs = formData.resultats_cles
 .filter(kr => (kr.description || '').trim() !== '')
 .map(kr => {
 const modeCalcul = kr.mode_calcul || 'pourcentage';
 const milestones = (modeCalcul === 'mensuel' && kr.milestones?.length) ? kr.milestones : null;
 return {
 description: kr.description,
 description_detaillee: kr.description_detaillee || '',
 type_resultat_cle_id: kr.type_resultat_cle_id || null,
 valeur_cible: (modeCalcul === 'mensuel' && milestones)
 ? milestones.reduce((s, m) => s + (Number(m.cible) || 0), 0)
 : (kr.valeur_cible ?? 100),
 unite: kr.unite || null,
 poids: kr.poids ?? 1,
 mode_calcul: modeCalcul,
 milestones,
 };
 });

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
 axe_objectif_id: formData.axe_objectif_id || null,
 type_objectif_id: formData.type_objectif_id || null,
 visibilite: formData.visibilite,
 prime: formData.prime || 0,
 mission_id: formData.mission_id || null,
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
 {auth?.collaborateur?.isResponsable && collaborateurs.length > 1 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responsable</label>
 <SearchableSelect value={formData.collaborateur_id} onChange={v => setField('collaborateur_id', v)} options={collaborateurs.map(c => ({ value: String(c.id), label: c.prenom + ' ' + c.nom }))} />
 </div>
 )}

 {/* Axe + Type */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {axes.length > 0 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Axe stratégique</label>
 <SearchableSelect value={formData.axe_objectif_id} onChange={v => setField('axe_objectif_id', v)}
 options={axes.map(a => ({ value: String(a.id), label: a.nom }))}
 nullable nullLabel="— Aucun axe —" placeholder="Rechercher un axe..." className="mt-1" />
 </div>
 )}
 {typesObjectifs.length > 0 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</label>
 <SearchableSelect value={formData.type_objectif_id} onChange={v => setField('type_objectif_id', v)}
 options={typesObjectifs.map(t => ({ value: String(t.id), label: t.nom }))}
 nullable nullLabel="— Aucun type —" placeholder="Rechercher un type..." className="mt-1" />
 </div>
 )}
 </div>

 {/* Visibilité + Prime */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visibilité</label>
 <SearchableSelect value={formData.visibilite} onChange={v => setField('visibilite', v)} options={[{ value: 'tous', label: 'Tous' }, { value: 'equipe', label: 'Équipe' }, { value: 'prive', label: 'Privé' }]} />
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prime ({devise?.code || 'GNF'})</label>
 <input type="number" value={formData.prime} onChange={e => setField('prime', e.target.value)} placeholder="0"
 className="w-full mt-1 px-2.5 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs" />
 </div>
 </div>
 {missions.length > 0 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mission / Projet</label>
 <SearchableSelect value={formData.mission_id} onChange={v => setField('mission_id', v)} options={missions.map(m => ({ value: String(m.id), label: m.titre + (m.client ? ' — ' + m.client : '') }))} nullable nullLabel="— Aucune mission —" className="mt-1" />
 </div>
 )}
 </div>

 {/* Key Results */}
 <div className="mt-5">
 <div className="flex items-center justify-between mb-2">
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Résultats Clés</p>
 <button type="button" onClick={addKR} className="text-[11px] text-primary-500 hover:text-primary-700 font-medium flex items-center gap-1">
 <Plus className="h-3.5 w-3.5" /> Ajouter un KR
 </button>
 </div>
 <div className="space-y-3">
 {formData.resultats_cles.map((kr, i) => {
 const selectedType = typesResultatsCles.find(t => t.id === Number(kr.type_resultat_cle_id));
 const isBoolean = selectedType?.type_valeur === 'boolean';
 return (
 <div key={i} className="p-3 rounded-lg border border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 space-y-2">
 {/* Titre + type + supprimer */}
 <div className="flex items-start gap-2">
 <span className="text-[10px] font-bold text-gray-400 mt-2 w-5 shrink-0">#{i+1}</span>
 <input
 type="text"
 value={kr.description}
 onChange={e => updateKR(i, 'description', e.target.value)}
 placeholder="Titre du KR..."
 className="flex-1 px-2.5 py-1.5 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
 />
 {typesResultatsCles.length > 0 && (
 <SearchableSelect value={kr.type_resultat_cle_id} onChange={v => { updateKR(i, "type_resultat_cle_id", v); const t=typesResultatsCles.find(t=>t.id===Number(v)); if(t?.unite) updateKR(i,"unite",t.unite); if(t?.type_valeur==="boolean") updateKR(i,"valeur_cible",1); }} size="sm" className="w-28 shrink-0" nullable nullLabel="Type…" options={typesResultatsCles.map(t=>({value:String(t.id),label:t.nom}))} />
 )}
 {formData.resultats_cles.length > 1 && (
 <button type="button" onClick={() => removeKR(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0">
 <X className="h-3.5 w-3.5" />
 </button>
 )}
 </div>

 {/* Cible · Unité · Poids (mode standard) */}
 {!isBoolean && kr.mode_calcul !== 'mensuel' && (
 <div className="flex items-center gap-2 ml-5 flex-wrap">
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] text-gray-400">Cible</span>
 <input type="number" value={kr.valeur_cible} onChange={e => updateKR(i, 'valeur_cible', Number(e.target.value))}
 className="w-20 px-2 py-1 text-xs bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-right" />
 </div>
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] text-gray-400">Unité</span>
 <SearchableSelect value={kr.unite || ""} onChange={v => updateKR(i, "unite", v)} size="sm" className="w-28" nullable nullLabel="—" options={[...new Set(typesResultatsCles.filter(t => t.unite).map(t => t.unite))].map(u => ({ value: u, label: u }))} />
 </div>
 {isPondere && (
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] text-gray-400">Poids</span>
 <input type="number" step="0.1" value={kr.poids} onChange={e => updateKR(i, 'poids', Number(e.target.value))}
 className="w-16 px-2 py-1 text-xs bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-right" />
 </div>
 )}
 </div>
 )}

 {/* Toggle ventilation mensuelle */}
 {!isBoolean && moisPeriode.length >= 2 && (
 <label className="flex items-center gap-1.5 ml-5 text-[11px] text-gray-500 cursor-pointer select-none w-fit">
 <input type="checkbox" checked={kr.mode_calcul === 'mensuel'}
 onChange={e => {
 const on = e.target.checked;
 updateKR(i, 'mode_calcul', on ? 'mensuel' : 'pourcentage');
 updateKR(i, 'milestones', on ? moisPeriode.map(m => ({ ...m, cible: 0 })) : []);
 }}
 className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
 Ventilation mensuelle
 </label>
 )}

 {/* Cibles par mois */}
 {!isBoolean && kr.mode_calcul === 'mensuel' && (
 <div className="ml-5 flex items-center gap-2 flex-wrap">
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] text-gray-400">Unité</span>
 <SearchableSelect value={kr.unite || ""} onChange={v => updateKR(i, "unite", v)} size="sm" className="w-28" nullable nullLabel="—" options={[...new Set(typesResultatsCles.filter(t => t.unite).map(t => t.unite))].map(u => ({ value: u, label: u }))} />
 </div>
 {(kr.milestones || []).map((m, mi) => (
 <div key={m.mois} className="flex items-center gap-1 bg-white dark:bg-dark-800 rounded px-2 py-1 border border-gray-200 dark:border-dark-700">
 <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">{m.label}</span>
 <input type="number" value={m.cible} onChange={e => {
 const ms = [...(kr.milestones || [])];
 ms[mi] = { ...ms[mi], cible: Number(e.target.value) || 0 };
 updateKR(i, 'milestones', ms);
 }} className="w-16 text-xs text-right bg-transparent border-none outline-none" />
 </div>
 ))}
 <span className="text-[10px] text-gray-400">
 = {(kr.milestones || []).reduce((s, m) => s + (Number(m.cible) || 0), 0).toLocaleString('fr-FR')} {kr.unite}
 </span>
 </div>
 )}
 </div>
 );
 })}
 </div>
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
function AddTaskModal({ open, onClose, objectifId, resultatsCles = [], defaultResultatCleId, collaborateurs, defaultCollaborateurId, auth, missions = [] }) {
 const [taskError, setTaskError] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const [taskData, setTaskData] = useState({
 titre: '',
 description: '',
 priorite: 'normale',
 eisenhower: '',
 collaborateur_id: String(defaultCollaborateurId || ''),
 resultat_cle_id: String(defaultResultatCleId || resultatsCles[0]?.id || ''),
 date: '',
 mission_id: '',
 mode_operatoire: [],
 outils: '',
 definition_done: [],
 });

 useEffect(() => {
 if (open) {
 setTaskData(prev => ({
 ...prev,
 titre: '', description: '', date: '', eisenhower: '', mission_id: '',
 mode_operatoire: [], outils: '', definition_done: [],
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
 description: taskData.description || null,
 priorite: taskData.priorite,
 eisenhower: taskData.eisenhower || null,
 collaborateur_id: taskData.collaborateur_id,
 date: taskData.date || null,
 objectif_id: objectifId,
 resultat_cle_id: taskData.resultat_cle_id || null,
 mission_id: taskData.mission_id || null,
 mode_operatoire: taskData.mode_operatoire.filter(e => e.trim()),
 outils: taskData.outils || null,
 definition_done: taskData.definition_done.filter(e => e.trim()),
 }, {
 preserveScroll: true,
 preserveState: true,
 onSuccess: () => {
 toast.success('Tâche créée avec succès');
 setTaskData({ titre: '', description: '', priorite: 'normale', eisenhower: '', collaborateur_id: String(defaultCollaborateurId || ''), resultat_cle_id: String(defaultResultatCleId || resultatsCles[0]?.id || ''), date: '', mission_id: '', mode_operatoire: [], outils: '', definition_done: [] });
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
 <DialogContent aria-describedby={undefined} className="max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
 <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
 <div className="p-5 pb-4 overflow-y-auto flex-1">
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
 <SearchableSelect value={taskData.resultat_cle_id} onChange={v => updateField("resultat_cle_id", v)} options={resultatsCles.map(kr=>({value:String(kr.id),label:kr.description}))} />
 </div>
 )}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <SearchableSelect value={taskData.priorite} onChange={v => updateField("priorite", v)} options={[{value:"basse",label:"Basse"},{value:"normale",label:"Normale"},{value:"haute",label:"Haute"},{value:"urgente",label:"Urgente"}]} />
 <SearchableSelect value={taskData.eisenhower} onChange={v=>updateField("eisenhower",v)} nullable nullLabel="Eisenhower..." options={[{value:"Q1",label:"Q1 — Faire maintenant"},{value:"Q2",label:"Q2 — Planifier"},{value:"Q3",label:"Q3 — Déléguer"},{value:"Q4",label:"Q4 — Éliminer"}]} />
 </div>
 <CustomDatePicker
 value={taskData.date}
 onChange={v => updateField('date', v)}
 placeholder="Date d'échéance"
 size="sm"
 />
 {auth?.collaborateur?.isResponsable && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigner à</label>
 <SearchableSelect value={taskData.collaborateur_id} onChange={v=>updateField("collaborateur_id",v)} options={collaborateurs.map(c=>({value:String(c.id),label:c.prenom+" "+c.nom}))} />
 </div>
 )}
 <textarea
 value={taskData.description}
 onChange={e => updateField('description', e.target.value)}
 placeholder="Description (optionnel)..."
 rows={2}
 className="w-full rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-2.5 py-1.5 text-xs placeholder:text-gray-400 hover:border-gray-300 dark:hover:border-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 resize-none"
 />
 {missions.length > 0 && (
 <SearchableSelect value={taskData.mission_id} onChange={v=>updateField("mission_id",v)} nullable nullLabel="Mission / Projet (optionnel)" options={missions.map(m=>({value:String(m.id),label:m.titre+(m.client?" — "+m.client:"")}))} />
 )}

 {/* Mode opératoire */}
 <div>
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">📋 Mode opératoire</p>
 <div className="space-y-1.5">
 {taskData.mode_operatoire.map((step, i) => (
 <div key={i} className="flex items-center gap-2">
 <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{i + 1}.</span>
 <input
 type="text"
 value={step}
 onChange={e => {
 const n = [...taskData.mode_operatoire];
 n[i] = e.target.value;
 updateField('mode_operatoire', n);
 }}
 placeholder={`Étape ${i + 1}...`}
 className="flex-1 px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
 />
 <button type="button" onClick={() => updateField('mode_operatoire', taskData.mode_operatoire.filter((_, j) => j !== i))}
 className="p-1 text-gray-400 hover:text-red-500 transition-colors">
 <X className="h-3 w-3" />
 </button>
 </div>
 ))}
 </div>
 <button type="button" onClick={() => updateField('mode_operatoire', [...taskData.mode_operatoire, ''])}
 className="mt-1.5 text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
 + Ajouter une étape
 </button>
 </div>

 {/* Outils & Ressources */}
 <div>
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">🔧 Outils & Ressources</p>
 <input
 type="text"
 value={taskData.outils}
 onChange={e => updateField('outils', e.target.value)}
 placeholder="Ex: LMS Addvalis, Notion, Standup hebdo (séparés par virgule)"
 className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
 />
 </div>

 {/* Définition de "Done" */}
 <div>
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">✅ Définition de "Done"</p>
 <div className="space-y-1.5">
 {taskData.definition_done.map((critere, i) => (
 <div key={i} className="flex items-center gap-2">
 <input
 type="text"
 value={critere}
 onChange={e => {
 const n = [...taskData.definition_done];
 n[i] = e.target.value;
 updateField('definition_done', n);
 }}
 placeholder={`Critère ${i + 1}...`}
 className="flex-1 px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
 />
 <button type="button" onClick={() => updateField('definition_done', taskData.definition_done.filter((_, j) => j !== i))}
 className="p-1 text-gray-400 hover:text-red-500 transition-colors">
 <X className="h-3 w-3" />
 </button>
 </div>
 ))}
 </div>
 <button type="button" onClick={() => updateField('definition_done', [...taskData.definition_done, ''])}
 className="mt-1.5 text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
 + Ajouter un critère
 </button>
 </div>
 </div>
 </div>
 <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 shrink-0">
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
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responsable *</label>
 <SearchableSelect value={formData.collaborateur_id || ''} onChange={v => setField('collaborateur_id', v)} disabled={!auth?.collaborateur?.isResponsable} options={collaborateurs.map(c => ({ value: String(c.id), label: c.prenom + ' ' + c.nom }))} className="mt-1" />
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
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Axe stratégique</label>
 <SearchableSelect value={formData.axe_objectif_id || ''} onChange={v => setField('axe_objectif_id', v)}
 options={axes.map(a => ({ value: String(a.id), label: a.nom }))}
 nullable nullLabel="— Aucun axe —" placeholder="Rechercher un axe..." className="mt-1" />
 </div>
 {typesObjectifs.length > 0 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</label>
 <SearchableSelect value={formData.type_objectif_id || ''} onChange={v => setField('type_objectif_id', v)}
 options={typesObjectifs.map(t => ({ value: String(t.id), label: t.nom + ' (' + t.niveau + ')' }))}
 nullable nullLabel="— Aucun type —" placeholder="Rechercher un type..." className="mt-1" />
 </div>
 )}
 </div>

 {/* Grid: Visibilité + Prime */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visibilité</label>
 <SearchableSelect value={formData.visibilite || 'equipe'} onChange={v => setField('visibilite', v)} options={[{ value: 'tous', label: 'Tous' }, { value: 'equipe', label: 'Équipe' }, { value: 'prive', label: 'Privé' }]} />
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
 className="w-full rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-2.5 py-1.5 text-xs placeholder:text-gray-400 hover:border-gray-300 dark:hover:border-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 resize-none min-h-[40px]" />
 </div>
 {typesResultatsCles.length > 0 && (
 <SearchableSelect value={kr.type_resultat_cle_id} onChange={v => { updateKR(i, "type_resultat_cle_id", v); const t=typesResultatsCles.find(t=>t.id===Number(v)); if(t?.unite) updateKR(i,"unite",t.unite); if(t?.type_valeur==="boolean") updateKR(i,"valeur_cible",1); }} size="sm" className="w-28 shrink-0" nullable nullLabel="Type…" options={typesResultatsCles.map(t=>({value:String(t.id),label:t.nom}))} />
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
 <SearchableSelect value={kr.unite || ""} onChange={v => updateKR(i, "unite", v)} size="sm" className="w-28" nullable nullLabel="—" options={[...new Set(typesResultatsCles.filter(t => t.unite).map(t => t.unite))].map(u => ({ value: u, label: u }))} />
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

function getMimeIcon(mime) {
 if (!mime) return File;
 if (mime.startsWith('image/')) return FileImage;
 if (mime === 'application/pdf' || mime.startsWith('text/')) return FileText;
 if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z') || mime.includes('tar')) return FileArchive;
 return FileText;
}

function TaskDetailPanel({ tache, onClose, objectifTitre, collaborateurs = [], auth }) {
 const [activeTab, setActiveTab] = useState('fiche');
 const [noteText, setNoteText] = useState('');
 const [editing, setEditing] = useState(false);
 const [editData, setEditData] = useState({});
 const [saving, setSaving] = useState(false);
 const [savingNote, setSavingNote] = useState(false);
 const [uploading, setUploading] = useState(false);
 const [assigneeOpen, setAssigneeOpen] = useState(false);
 const [localFichiers, setLocalFichiers] = useState([]);

 const parseJsonArray = (val) => {
 if (Array.isArray(val)) return val;
 if (typeof val === 'string') {
 try { return JSON.parse(val) || []; } catch { return val.trim() ? [val] : []; }
 }
 return [];
 };

 // Sync localFichiers quand tache change
 useEffect(() => {
 if (tache) setLocalFichiers(tache.fichiers || []);
 }, [tache?.id]);

 // Reset quand une nouvelle tâche s'ouvre
 useEffect(() => {
 if (tache) {
 setEditing(false);
 setAssigneeOpen(false);
 setNoteText(tache.note || '');
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
 onError: (errors) => { setSaving(false); const msg = Object.values(errors)[0]; toast.error(msg || 'Erreur lors de la sauvegarde.'); },
 onFinish: () => setSaving(false),
 });
 };

 const handleUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const input = e.target;
  setUploading(true);
  const formData = new FormData();
  formData.append('fichier', file);
  try {
   const { data } = await axios.post(route('taches.fichiers.store', tache.id), formData, {
    headers: { 'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '') },
   });
   setLocalFichiers(prev => [...prev, data]);
   toast.success('Fichier joint');
   router.reload({ only: ['objectifs'] });
  } catch {
   toast.error('Erreur lors de l\'envoi');
  } finally {
   setUploading(false);
   try { input.value = ''; } catch {}
  }
 };

 const handleSaveNote = () => {
 setSavingNote(true);
 router.patch(route('taches.note', tache.id), { note: noteText }, {
 preserveScroll: true,
 onSuccess: () => { toast.success('Note sauvegardee'); setSavingNote(false); },
 onError: () => { toast.error('Erreur lors de la sauvegarde.'); setSavingNote(false); },
 onFinish: () => setSavingNote(false),
 });
 };

 const handleDeleteFichier = async (fichierId) => {
  if (!confirm('Supprimer ce fichier ?')) return;
  try {
   await axios.delete(route('taches.fichiers.destroy', { tache: tache.id, fichier: fichierId }));
   setLocalFichiers(prev => prev.filter(f => f.id !== fichierId));
   toast.success('Fichier supprimé');
  } catch {
   toast.error('Erreur lors de la suppression');
  }
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
 onClick={() => setActiveTab('fichiers')}
 className={`pb-2 mr-6 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'fichiers' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
 >
 <Paperclip className="h-3 w-3" />
 Fichiers
 {localFichiers.length > 0 && (
  <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
  {localFichiers.length}
  </span>
 )}
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
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] text-gray-400">Statut</label>
 <SearchableSelect value={editData.statut} onChange={v=>setEditData(prev=>({...prev,statut:v}))} size="sm" className="mt-0.5" options={[{value:"a_faire",label:"À faire"},{value:"en_cours",label:"En cours"},{value:"termine",label:"Terminé"},{value:"bloque",label:"Bloqué"}]} />
 </div>
 <div>
 <label className="text-[10px] text-gray-400">Priorité</label>
 <SearchableSelect value={editData.priorite} onChange={v=>setEditData(prev=>({...prev,priorite:v}))} size="sm" className="mt-0.5" options={[{value:"basse",label:"Basse"},{value:"normale",label:"Normale"},{value:"haute",label:"Haute"},{value:"urgente",label:"Urgente"}]} />
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] text-gray-400">Eisenhower</label>
 <SearchableSelect value={editData.eisenhower||""} onChange={v=>setEditData(prev=>({...prev,eisenhower:v}))} size="sm" className="mt-0.5" nullable nullLabel="Aucun" options={[{value:"Q1",label:"Q1 — Faire maintenant"},{value:"Q2",label:"Q2 — Planifier"},{value:"Q3",label:"Q3 — Déléguer"},{value:"Q4",label:"Q4 — Éliminer"}]} />
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
 <SearchableSelect value={editData.collaborateur_id || ''} onChange={v => setEditData(prev => ({ ...prev, collaborateur_id: v }))} disabled={!auth?.collaborateur?.isResponsable} options={collaborateurs.map(c => ({ value: String(c.id), label: c.prenom + ' ' + c.nom }))} size="sm" className="mt-0.5" />
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-1.5 flex-wrap">
 {auth?.collaborateur?.isResponsable && collaborateurs.length > 0 ? (
 <div className="relative">
 <button
 onClick={() => setAssigneeOpen(v => !v)}
 className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-800/40 transition-colors cursor-pointer"
 title="Changer le responsable"
 >
 {tache.collaborateur || 'Non assigné'}
 <ChevronDown className={`h-2.5 w-2.5 opacity-50 shrink-0 transition-transform ${assigneeOpen ? 'rotate-180' : ''}`} />
 </button>
 {assigneeOpen && (
 <>
 {/* Backdrop invisible pour fermer au clic extérieur */}
 <div className="fixed inset-0 z-40" onClick={() => setAssigneeOpen(false)} />
 <div className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg z-50 w-44 py-1 max-h-48 overflow-y-auto">
 {collaborateurs.map(c => (
 <button
 key={c.id}
 onClick={() => {
 setAssigneeOpen(false);
 setEditData(prev => ({ ...prev, collaborateur_id: String(c.id) }));
 router.patch(route('taches.assignee', tache.id), { collaborateur_id: c.id }, { preserveScroll: true });
 }}
 className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-800 flex items-center justify-between gap-2 transition-colors"
 >
 <span>{c.prenom} {c.nom}</span>
 {String(c.id) === String(tache.collaborateur_id) && <Check className="h-3 w-3 text-primary-500 shrink-0" />}
 </button>
 ))}
 </div>
 </>
 )}
 </div>
 ) : (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
 {tache.collaborateur || 'Non assigné'}
 </span>
 )}
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
 ) : activeTab === 'fichiers' ? (
 /* ── Tab Fichiers ───────────────────── */
 <div className="px-5 py-4 space-y-3">
 {/* Zone d'upload */}
 <label className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${uploading ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/10 opacity-60 cursor-not-allowed' : 'border-gray-200 dark:border-dark-700 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'}`}>
 <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
 {uploading ? (
  <>
  <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
  <span className="text-[11px] font-medium text-primary-500">Envoi en cours...</span>
  </>
 ) : (
  <>
  <Paperclip className="h-3.5 w-3.5 text-gray-400" />
  <span className="text-[11px] font-medium text-gray-500">Cliquer pour joindre un fichier</span>
  <span className="text-[10px] text-gray-400">(max 20 Mo)</span>
  </>
 )}
 </label>

 {/* Liste des fichiers */}
 {localFichiers.length > 0 ? (
 <div className="space-y-1.5">
  {localFichiers.map((f) => {
  const MimeIcon = getMimeIcon(f.mime_type);
  return (
   <div key={f.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700 group">
   <MimeIcon className="h-4 w-4 text-gray-400 shrink-0" />
   <div className="flex-1 min-w-0">
    <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate">{f.nom_original}</p>
    <p className="text-[10px] text-gray-400">{f.taille} · {f.created_at} · {f.uploader}</p>
   </div>
   <div className="flex items-center gap-1 shrink-0">
    <a
    href={route('taches.fichiers.download', { tache: tache.id, fichier: f.id })}
    target="_blank"
    rel="noreferrer"
    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
    title="Télécharger"
    >
    <Download className="h-3.5 w-3.5 text-gray-400" />
    </a>
    {(tache.collaborateur_id === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable) && (
    <button
     onClick={() => handleDeleteFichier(f.id)}
     className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
     title="Supprimer"
    >
     <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
    </button>
    )}
   </div>
   </div>
  );
  })}
 </div>
 ) : (
 <p className="text-center text-[12px] text-gray-400 italic py-4">Aucun fichier joint.</p>
 )}
 </div>
 ) : (
 /* ── Tab Note ──────────────────────── */
 <div className="px-5 py-4 space-y-3">
 <textarea
 value={noteText}
 onChange={e => setNoteText(e.target.value)}
 placeholder="Ajouter une note sur cette tâche..."
 className="w-full min-h-[200px] px-3 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[12px] text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-y transition-all"
 />
 <button
 onClick={handleSaveNote}
 disabled={savingNote}
 className="w-full px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-all disabled:opacity-50"
 >
 {savingNote ? 'Sauvegarde...' : 'Sauvegarder la note'}
 </button>
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
 {(tache.collaborateur_id === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable) && (
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

// ─── Modal d'édition directe d'un KR ────────────────────────
function EditKRModal({ open, onClose, kr, typesResultatsCles = [] }) {
 const [error, setError] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const [form, setForm] = useState({});

 useEffect(() => {
 if (open && kr) {
 setForm({
 description: kr.description || '',
 description_detaillee: kr.description_detaillee || '',
 type_resultat_cle_id: String(kr.type_resultat_cle_id || ''),
 valeur_cible: kr.valeur_cible ?? 100,
 poids: kr.poids ?? 1,
 unite: kr.unite || '',
 source_crm: kr.source_crm ?? false,
 source_crm_type_deal: kr.source_crm_filtre?.type_deal || '',
 });
 setError('');
 }
 }, [open, kr]);

 const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

 const handleSubmit = (e) => {
 e.preventDefault();
 setError('');
 if (!form.description.trim()) { setError('La description est obligatoire.'); return; }
 setSubmitting(true);
 router.put(route('objectifs.kr.update', kr.id), {
 description: form.description,
 description_detaillee: form.description_detaillee || null,
 type_resultat_cle_id: form.type_resultat_cle_id || null,
 valeur_cible: form.valeur_cible || 100,
 poids: form.poids || 1,
 unite: form.unite || null,
 source_crm: form.source_crm ?? false,
 source_crm_filtre: form.source_crm
   ? { type_deal: form.source_crm_type_deal || null }
   : null,
 }, {
 preserveScroll: true,
 preserveState: true,
 onSuccess: () => { toast.success('KR mis à jour'); setSubmitting(false); onClose(); },
 onError: (errs) => { setError(Object.values(errs)[0] || 'Erreur.'); setSubmitting(false); },
 });
 };

 const inputCls = "mt-1 w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500";

 return (
 <Dialog open={open} onOpenChange={(v) => { if (!v) { setError(''); onClose(); } }}>
 <DialogContent aria-describedby={undefined} className="max-w-md p-0 overflow-hidden">
 <form onSubmit={handleSubmit} className="flex flex-col">
 <div className="px-5 pt-5 pb-4 space-y-3">
 <DialogHeader>
 <DialogTitle className="text-sm">Modifier le résultat clé</DialogTitle>
 </DialogHeader>
 {error && (
 <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
 <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
 </div>
 )}
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description *</label>
 <input type="text" value={form.description || ''} onChange={e => setF('description', e.target.value)}
 autoFocus className={inputCls} placeholder="Description du résultat clé..." />
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description détaillée</label>
 <textarea value={form.description_detaillee || ''} onChange={e => setF('description_detaillee', e.target.value)}
 rows={2} className={`${inputCls} resize-none`} placeholder="Contexte, critères de succès..." />
 </div>
 {typesResultatsCles.length > 0 && (
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type de KR</label>
 <div className="mt-1">
 <SearchableSelect value={form.type_resultat_cle_id||""} onChange={v=>setForm(prev=>({...prev,type_resultat_cle_id:v}))} nullable nullLabel="Type…" options={typesResultatsCles.map(t=>({value:String(t.id),label:t.nom}))} />
 </div>
 </div>
 )}
 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cible</label>
 <input type="number" value={form.valeur_cible ?? ''} onChange={e => setF('valeur_cible', e.target.value)}
 className={inputCls} placeholder="100" min="0" />
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Poids</label>
 <input type="number" value={form.poids ?? ''} onChange={e => setF('poids', e.target.value)}
 className={inputCls} placeholder="1" min="0" max="100" step="0.1" />
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unité</label>
 <div className="mt-1">
 <SearchableSelect value={form.unite||""} onChange={v=>setForm(prev=>({...prev,unite:v}))} nullable nullLabel="—" options={[...new Set(typesResultatsCles.filter(t=>t.unite).map(t=>t.unite))].map(u=>({value:u,label:u}))} />
 </div>
 </div>
 </div>
 {/* Source CRM */}
 <div className="space-y-2">
 <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer select-none w-fit">
 <input type="checkbox" checked={!!form.source_crm} onChange={e => setF('source_crm', e.target.checked)}
 className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
 Alimenter depuis le CRM (deals gagnés)
 </label>
 {form.source_crm && (
 <div className="flex items-center gap-1.5 ml-5">
 <span className="text-[10px] text-gray-400">Type de deal</span>
 <select value={form.source_crm_type_deal || ''} onChange={e => setF('source_crm_type_deal', e.target.value)}
 className="px-2 py-1 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30">
 <option value="">Tous les types</option>
 <option value="nouveau_client">Nouveau client</option>
 <option value="upsell">Upsell</option>
 <option value="renouvellement">Renouvellement</option>
 </select>
 </div>
 )}
 </div>
 </div>
 <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
 <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 transition-all">Annuler</button>
 <button type="submit" disabled={submitting} className="px-5 py-1.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-all disabled:opacity-50">
 {submitting ? 'Enregistrement...' : 'Enregistrer'}
 </button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 );
}

// ─── Composant KR expandable (niveau 2) ─────────────────────
function KRRow({ kr, krIdx, seuils, onAddTaskForKr, onViewTask, onEditKr, objectifId, defaultExpanded = false, auth, objCollabId, collaborateurs = [], collapseAll = 0, expandAll = 0 }) {
 const [expanded, setExpanded] = useState(defaultExpanded);
 useEffect(() => { if (collapseAll > 0) setExpanded(false); }, [collapseAll]);
 useEffect(() => { if (expandAll > 0) setExpanded(true); }, [expandAll]);
 const krColor = getSeuilColor(kr.progression, seuils) || krBarColors[krIdx % krBarColors.length];
 const krTaches = kr.taches || [];
 const krTerminees = krTaches.filter(t => t.statut === 'termine').length;
 const canEdit = objCollabId === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable;

 return (
 <div className="border-b border-gray-100/80 dark:border-dark-800/50 last:border-b-0">
 {/* ── Barre KR cliquable ── */}
 <div className="flex items-center gap-1 px-5 pt-3 pb-2 group/kr">
 <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left min-w-0">
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
 {kr.source_crm && (
 <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">CRM</span>
 )}
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
 {canEdit && (
 <button
 onClick={(e) => { e.stopPropagation(); onEditKr?.(kr); }}
 className="shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors opacity-0 group-hover/kr:opacity-100"
 title="Modifier ce KR"
 >
 <Pencil className="h-3 w-3 text-gray-400" />
 </button>
 )}
 </div>

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
 <td className="pl-4 pr-2 py-2 w-8" onClick={e => e.stopPropagation()}>
 <TacheStatutPicker
 tache={tache}
 canChange={tache.collaborateur_id === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable}
 />
 </td>
 <td className="py-2">
 <span className={`text-[12px] ${
 tache.statut === 'termine' ? 'line-through text-gray-400' :
 tache.statut === 'en_cours' ? 'text-primary-700 dark:text-primary-300' :
 tache.statut === 'bloque' ? 'text-red-600 dark:text-red-400' :
 'text-gray-700 dark:text-gray-300'
 }`}>
 {tache.titre}
 </span>
 </td>
 <td className="py-2 px-2" onClick={e => e.stopPropagation()}>
 {auth?.collaborateur?.isResponsable && collaborateurs.length > 0 ? (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-800/40 transition-colors whitespace-nowrap cursor-pointer">
 {tache.collaborateur}
 <ChevronDown className="h-2.5 w-2.5 opacity-50 shrink-0" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-44">
 {collaborateurs.map(c => (
 <DropdownMenuItem
 key={c.id}
 onClick={() => router.patch(route('taches.assignee', tache.id), { collaborateur_id: c.id }, { preserveScroll: true })}
 className="text-xs flex items-center justify-between"
 >
 {c.prenom} {c.nom}
 {String(c.id) === String(tache.collaborateur_id) && <Check className="h-3 w-3 text-primary-500 shrink-0" />}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>
 ) : (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 whitespace-nowrap">
 {tache.collaborateur}
 </span>
 )}
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
 <div className="flex items-center justify-end gap-0.5">
 <button
 onClick={(e) => { e.stopPropagation(); onViewTask?.(tache, kr.description); }}
 className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
 title="Voir la fiche"
 >
 <Eye className="h-3.5 w-3.5 text-gray-400" />
 </button>
 {(tache.collaborateur_id === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable) && (
 <button
 onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer cette tâche ?')) router.delete(route('taches.destroy', tache.id), { preserveScroll: true, onSuccess: () => toast.success('Tâche supprimée') }); }}
 className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-colors"
 title="Supprimer"
 >
 <Trash2 className="h-3.5 w-3.5 text-gray-400" />
 </button>
 )}
 </div>
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
 {(objCollabId === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable) && (
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
function ObjectifCard({ obj, seuils, handleDelete, defaultExpanded = false, onAddTask, onAddKr, onViewTask, onAddTaskForKr, onEdit, onEditKr, auth, collaborateurs = [], collapseAll = 0, expandAll = 0 }) {
 const [expanded, setExpanded] = useState(defaultExpanded);
 useEffect(() => { if (collapseAll > 0) setExpanded(false); }, [collapseAll]);
 useEffect(() => { if (expandAll > 0) setExpanded(true); }, [expandAll]);
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
 {(obj.collaborateur_id === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable) && (
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
 {(obj.collaborateur_id === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable) && (
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
 onEditKr={onEditKr}
 defaultExpanded={krIdx === 0}
 auth={auth}
 objCollabId={obj.collaborateur_id}
 collaborateurs={collaborateurs}
 collapseAll={collapseAll}
 expandAll={expandAll}
 />
 ))}
 </div>
 ) : (
 <div className="px-5 py-4 border-t border-gray-100 dark:border-dark-800 text-center">
 <p className="text-xs text-gray-400">Aucun résultat clé</p>
 </div>
 )}

 {/* ── Boutons + KR / + Tâche au pied de la carte ── */}
 {(obj.collaborateur_id === auth?.collaborateur?.id || auth?.collaborateur?.isResponsable) && (
 <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 dark:border-dark-800 bg-gray-50/40 dark:bg-dark-800/30">
  <button
  onClick={() => onAddKr?.(obj.id)}
  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 rounded-lg transition-all"
  >
  <Plus className="h-3 w-3" /> KR
  </button>
  <button
  onClick={() => onAddTask?.(obj.id)}
  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg transition-all"
  >
  <Plus className="h-3 w-3" /> Tâche
  </button>
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

// ─── Modal ajout rapide de KR ────────────────────────────────
function QuickKRModal({ open, onClose, objectifs = [], typesResultatsCles = [], defaultObjectifId = null }) {
 const [objId, setObjId] = useState('');
 const [description, setDescription] = useState('');
 const [unite, setUnite] = useState('');
 const [valeurCible, setValeurCible] = useState(100);
 const [error, setError] = useState('');
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
  if (open) { setObjId(defaultObjectifId ? String(defaultObjectifId) : ''); setDescription(''); setUnite(''); setValeurCible(100); setError(''); }
 }, [open, defaultObjectifId]);

 const handleSubmit = (e) => {
  e.preventDefault();
  if (!objId) { setError('Sélectionnez un objectif.'); return; }
  if (!description.trim()) { setError('La description est obligatoire.'); return; }
  setSubmitting(true);
  router.post(route('objectifs.kr.store', objId), {
   description,
   valeur_cible: valeurCible || 100,
   unite: unite || null,
   poids: 1,
  }, {
   preserveState: true, preserveScroll: true,
   onSuccess: () => { toast.success('Résultat clé ajouté'); onClose(); setSubmitting(false); },
   onError: (errs) => { setError(Object.values(errs)[0] || 'Erreur'); setSubmitting(false); },
   onFinish: () => setSubmitting(false),
  });
 };

 const objOptions = objectifs.map(o => ({ value: String(o.id), label: o.titre }));
 const uniteOptions = [...new Set(typesResultatsCles.filter(t => t.unite).map(t => t.unite))].map(u => ({ value: u, label: u }));

 return (
  <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
   <DialogContent aria-describedby={undefined} className="max-w-md p-0 overflow-hidden">
    <form onSubmit={handleSubmit} className="flex flex-col">
     <div className="px-5 pt-5 pb-4 space-y-3">
      <DialogHeader><DialogTitle className="text-sm">Nouveau Résultat Clé</DialogTitle></DialogHeader>
      {error && <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg"><p className="text-[11px] text-red-600">{error}</p></div>}
      <div>
       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Objectif *</label>
       <div className="mt-1"><SearchableSelect value={objId} onChange={setObjId} options={objOptions} placeholder="Sélectionner un objectif..." /></div>
      </div>
      <div>
       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description du KR *</label>
       <input autoFocus type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Atteindre 150M GNF de CA..."
        className="mt-1 w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
       <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valeur cible</label>
        <input type="number" value={valeurCible} onChange={e => setValeurCible(Number(e.target.value))}
         className="mt-1 w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
       </div>
       <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unité</label>
        <div className="mt-1">
         <SearchableSelect value={unite} onChange={setUnite} nullable nullLabel="—" placeholder="—" options={uniteOptions} />
        </div>
       </div>
      </div>
     </div>
     <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
      <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 transition-all">Annuler</button>
      <button type="submit" disabled={submitting} className="px-5 py-1.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-all disabled:opacity-50">
       {submitting ? 'Enregistrement...' : 'Ajouter le KR'}
      </button>
     </div>
    </form>
   </DialogContent>
  </Dialog>
 );
}

// ─── Modal ajout rapide de tâche (avec sélecteur objectif) ──
function QuickTaskModal({ open, onClose, objectifs = [], collaborateurs = [], defaultCollaborateurId, auth, missions = [] }) {
 const [objId, setObjId] = useState('');
 const [krId, setKrId] = useState('');
 const [titre, setTitre] = useState('');
 const [priorite, setPriorite] = useState('normale');
 const [collabId, setCollabId] = useState(String(defaultCollaborateurId || ''));
 const [error, setError] = useState('');
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
  if (open) { setObjId(''); setKrId(''); setTitre(''); setPriorite('normale'); setCollabId(String(defaultCollaborateurId || '')); setError(''); }
 }, [open]);

 // KRs de l'objectif sélectionné
 const selectedObj = objectifs.find(o => String(o.id) === String(objId));
 const krs = selectedObj?.resultats_cles || [];

 useEffect(() => { setKrId(krs[0]?.id ? String(krs[0].id) : ''); }, [objId]);

 const handleSubmit = (e) => {
  e.preventDefault();
  if (!titre.trim()) { setError('Le titre est obligatoire.'); return; }
  if (!objId) { setError('Sélectionnez un objectif.'); return; }
  setSubmitting(true);
  router.post(route('taches.store'), {
   titre,
   priorite,
   collaborateur_id: collabId,
   objectif_id: objId,
   resultat_cle_id: krId || null,
  }, {
   preserveState: true, preserveScroll: true,
   onSuccess: () => { toast.success('Tâche créée'); onClose(); setSubmitting(false); },
   onError: (errs) => { setError(Object.values(errs)[0] || 'Erreur'); setSubmitting(false); },
   onFinish: () => setSubmitting(false),
  });
 };

 return (
  <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
   <DialogContent aria-describedby={undefined} className="max-w-md p-0 overflow-hidden">
    <form onSubmit={handleSubmit} className="flex flex-col">
     <div className="px-5 pt-5 pb-4 space-y-3">
      <DialogHeader><DialogTitle className="text-sm">Nouvelle tâche rapide</DialogTitle></DialogHeader>
      {error && <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg"><p className="text-[11px] text-red-600">{error}</p></div>}
      <input autoFocus type="text" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre de la tâche..."
       className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      <div>
       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Objectif *</label>
       <div className="mt-1"><SearchableSelect value={objId} onChange={setObjId} options={objectifs.map(o => ({ value: String(o.id), label: o.titre }))} placeholder="Sélectionner un objectif..." /></div>
      </div>
      {krs.length > 0 && (
       <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Résultat Clé</label>
        <div className="mt-1"><SearchableSelect value={krId} onChange={setKrId} nullable nullLabel="— Sans KR spécifique —" placeholder="— Sans KR spécifique —" options={krs.map(kr => ({ value: String(kr.id), label: kr.description }))} /></div>
       </div>
      )}
      <div className="grid grid-cols-2 gap-3">
       <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priorité</label>
        <div className="mt-1"><SearchableSelect value={priorite} onChange={setPriorite} options={[{value:'basse',label:'Basse'},{value:'normale',label:'Normale'},{value:'haute',label:'Haute'},{value:'urgente',label:'Urgente'}]} /></div>
       </div>
       {auth?.collaborateur?.isResponsable && collaborateurs.length > 0 && (
        <div>
         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigner à</label>
         <div className="mt-1"><SearchableSelect value={collabId} onChange={setCollabId} options={collaborateurs.map(c => ({ value: String(c.id), label: c.prenom + ' ' + c.nom }))} /></div>
        </div>
       )}
      </div>
     </div>
     <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
      <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 transition-all">Annuler</button>
      <button type="submit" disabled={submitting} className="px-5 py-1.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition-all disabled:opacity-50">
       {submitting ? 'Enregistrement...' : 'Créer la tâche'}
      </button>
     </div>
    </form>
   </DialogContent>
  </Dialog>
 );
}

// ─── Page principale ───────────────────────────────────────
export default function OKRIndex({ objectifs, filters, collaborateurs, periodes = [], axes = [], seuils = [], typesObjectifs = [], typesResultatsCles = [], configuration, vueOkr = 'cards', progressionGlobale = 0, velocite = 0, defaultCollaborateurId, auth, missions = [] }) {
 const devise = auth?.societe?.devise;
 const [search, setSearch] = useState(filters?.search || '');
 const [statutFilter, setStatutFilter] = useState(filters?.statut || '');
 const [collabFilter, setCollabFilter] = useState(filters?.collaborateur_id ? String(filters.collaborateur_id) : '');
 const [periodeFilter, setPeriodeFilter] = useState(filters?.periode_id ? String(filters.periode_id) : '');
 const [axeFilter, setAxeFilter] = useState(filters?.axe_objectif_id ? String(filters.axe_objectif_id) : '');
 const [typeFilter, setTypeFilter] = useState(filters?.type_objectif_id ? String(filters.type_objectif_id) : '');

 // Sync state from props after server redirects (ex: Effacer → redirect vers période courante)
 useEffect(() => {
  setSearch(filters?.search || '');
  setStatutFilter(filters?.statut || '');
  setCollabFilter(filters?.collaborateur_id ? String(filters.collaborateur_id) : '');
  setPeriodeFilter(filters?.periode_id ? String(filters.periode_id) : '');
  setAxeFilter(filters?.axe_objectif_id ? String(filters.axe_objectif_id) : '');
  setTypeFilter(filters?.type_objectif_id ? String(filters.type_objectif_id) : '');
 }, [filters?.search, filters?.statut, filters?.collaborateur_id, filters?.periode_id, filters?.axe_objectif_id, filters?.type_objectif_id]);

 // Regroupement des objectifs par axe (ordre des axes configurés, sans axe en dernier)
 const objectifsParAxe = useMemo(() => {
  const groups = {};
  (objectifs.data || []).forEach(obj => {
   const key = obj.axe_objectif_id != null ? String(obj.axe_objectif_id) : 'sans_axe';
   if (!groups[key]) {
    groups[key] = { id: key, nom: obj.axe || 'Sans axe', couleur: obj.axe_couleur || '#6b7280', objectifs: [] };
   }
   groups[key].objectifs.push(obj);
  });
  const ordered = [];
  axes.forEach(a => { if (groups[String(a.id)]) ordered.push(groups[String(a.id)]); });
  if (groups['sans_axe']) ordered.push(groups['sans_axe']);
  return ordered;
 }, [objectifs.data, axes]);
 const [collapseAll, setCollapseAll] = useState(0);
 const [expandAll, setExpandAll] = useState(0);
 const [collapsedAxes, setCollapsedAxes] = useState(new Set());
 const toggleAxe = (id) => setCollapsedAxes(prev => {
  const next = new Set(prev);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
 });
 const [createOpen, setCreateOpen] = useState(false);
 const [editModal, setEditModal] = useState({ open: false, objectif: null });
 const [taskModal, setTaskModal] = useState({ open: false, objectifId: null, resultatsCles: [], defaultResultatCleId: null });
 const [taskPanel, setTaskPanel] = useState({ tache: null, objectifTitre: null });
 const [editKrModal, setEditKrModal] = useState({ open: false, kr: null });
 const [quickKRModal, setQuickKRModal] = useState({ open: false, objectifId: null });
 const [quickTaskOpen, setQuickTaskOpen] = useState(false);
 const searchTimerRef = useRef(null);

 const applyFilters = (key, value) => {
 const f = { search, statut: statutFilter, collaborateur_id: collabFilter, periode_id: periodeFilter, axe_objectif_id: axeFilter, type_objectif_id: typeFilter, [key]: value };
 Object.keys(f).forEach(k => k !== 'periode_id' && f[k] === '' && delete f[k]);
 router.get(route('objectifs.index'), f, { preserveState: true, replace: true });
 };

 const handleSearchChange = (value) => {
  setSearch(value);
  if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  searchTimerRef.current = setTimeout(() => applyFilters('search', value), 300);
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
 onChange={(e) => handleSearchChange(e.target.value)}
 className="pl-8 pr-3 py-2 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 w-40 transition-all"
 />
 </div>
 <SearchableSelect value={periodeFilter} onChange={v=>{setPeriodeFilter(v);applyFilters("periode_id",v)}} nullable nullLabel="Toutes les périodes" placeholder="Toutes les périodes" options={periodes.map(p=>({value:String(p.id),label:p.nom}))} />
 <SearchableSelect value={collabFilter} onChange={v=>{setCollabFilter(v);applyFilters("collaborateur_id",v)}} nullable nullLabel="Tous les collaborateurs" placeholder="Tous les collaborateurs" options={collaborateurs.map(c=>({value:String(c.id),label:c.prenom+" "+c.nom}))} />
 <SearchableSelect value={statutFilter} onChange={v=>{setStatutFilter(v);applyFilters("statut",v)}} nullable nullLabel="Tous les statuts" placeholder="Tous les statuts" options={[{value:"brouillon",label:"Brouillon"},{value:"actif",label:"Actif"},{value:"termine",label:"Terminé"},{value:"annule",label:"Annulé"}]} />
 <SearchableSelect value={axeFilter} onChange={v=>{setAxeFilter(v);applyFilters("axe_objectif_id",v)}} nullable nullLabel="Tous les axes" placeholder="Tous les axes" options={axes.map(a=>({value:String(a.id),label:a.nom}))} />
 <SearchableSelect value={typeFilter} onChange={v=>{setTypeFilter(v);applyFilters("type_objectif_id",v)}} nullable nullLabel="Tous les types" placeholder="Tous les types" options={typesObjectifs.map(t=>({value:String(t.id),label:t.nom}))} />
 {hasFilters && (
 <button
 onClick={() => { setSearch(''); setStatutFilter(''); setCollabFilter(''); setPeriodeFilter(''); setAxeFilter(''); setTypeFilter(''); if (searchTimerRef.current) clearTimeout(searchTimerRef.current); router.get(route('objectifs.index'), {}, { preserveState: true, replace: true }); }}
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

 {/* ═══ Barre de raccourcis ═══ */}
 <div className="flex items-center gap-2 mb-5 flex-wrap">
  <button
   onClick={() => router.get(route('parametres.okr.index'))}
   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg shadow-sm transition-all"
  >
   <Plus className="h-3.5 w-3.5" /> Ajouter un axe
  </button>
  <button
   onClick={() => setCreateOpen(true)}
   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg shadow-sm transition-all"
  >
   <Plus className="h-3.5 w-3.5" /> Objectif
  </button>
  <button
   onClick={() => setQuickKRModal({ open: true, objectifId: null })}
   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg shadow-sm transition-all"
  >
   <Plus className="h-3.5 w-3.5" /> Key Result
  </button>
  <button
   onClick={() => setQuickTaskOpen(true)}
   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg shadow-sm transition-all"
  >
   <Plus className="h-3.5 w-3.5" /> Tâche
  </button>

  {/* Séparateur */}
  <div className="h-5 w-px bg-gray-200 dark:bg-dark-700 mx-1" />

  <button
   onClick={() => { setCollapseAll(v => v + 1); setCollapsedAxes(new Set(objectifsParAxe.map(g => g.id))); }}
   title="Tout replier"
   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg shadow-sm transition-all"
  >
   <ChevronsUp className="h-3.5 w-3.5" /> Replier
  </button>
  <button
   onClick={() => { setExpandAll(v => v + 1); setCollapsedAxes(new Set()); }}
   title="Tout déplier"
   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800 rounded-lg shadow-sm transition-all"
  >
   <ChevronsDown className="h-3.5 w-3.5" /> Déplier
  </button>
 </div>

 {/* ═══ Objectifs groupés par axe ═══ */}
 {objectifs.data.length > 0 ? (
 <div className="space-y-6">
  {objectifsParAxe.map((groupe, gi) => {
   const isCollapsed = collapsedAxes.has(groupe.id);
   return (
  <div key={groupe.id}>
   {/* ── En-tête de groupe axe (cliquable pour plier/déplier) ── */}
   <button
    onClick={() => toggleAxe(groupe.id)}
    className="flex items-center gap-2.5 mb-3 w-full text-left group"
   >
   <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
   <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: groupe.couleur }} />
   <span className="text-[11px] font-bold uppercase tracking-widest group-hover:underline" style={{ color: groupe.couleur }}>
    {groupe.nom}
   </span>
   <span className="text-[10px] text-gray-400 font-medium">
    — {groupe.objectifs.length} objectif{groupe.objectifs.length > 1 ? 's' : ''}
   </span>
   <div className="flex-1 h-px bg-gray-100 dark:bg-dark-800" />
   </button>

   {/* ── Cartes objectifs du groupe ── */}
   <AnimatePresence initial={false}>
   {!isCollapsed && (
    <motion.div
     initial={{ height: 0, opacity: 0 }}
     animate={{ height: 'auto', opacity: 1 }}
     exit={{ height: 0, opacity: 0 }}
     transition={{ duration: 0.2, ease: 'easeInOut' }}
     style={{ overflow: 'hidden' }}
    >
    <div className="space-y-3 pl-5 border-l-2" style={{ borderColor: groupe.couleur + '40' }}>
    {groupe.objectifs.map((obj, i) => (
     <ObjectifCard
     key={obj.id}
     obj={obj}
     seuils={seuils}
     handleDelete={handleDelete}
     defaultExpanded={gi === 0 && i === 0}
     onEdit={(o) => setEditModal({ open: true, objectif: o })}
     onEditKr={(kr) => setEditKrModal({ open: true, kr })}
     onAddTask={(objId) => setTaskModal({ open: true, objectifId: objId, resultatsCles: obj.resultats_cles || [], defaultResultatCleId: null })}
     onAddKr={(objId) => setQuickKRModal({ open: true, objectifId: objId })}
     onAddTaskForKr={(objId, krId) => setTaskModal({ open: true, objectifId: objId, resultatsCles: obj.resultats_cles || [], defaultResultatCleId: krId })}
     onViewTask={(tache, krDescription) => setTaskPanel({ tache, objectifTitre: krDescription })}
     auth={auth}
     collaborateurs={collaborateurs}
     collapseAll={collapseAll}
     expandAll={expandAll}
     />
    ))}
    </div>
    </motion.div>
   )}
   </AnimatePresence>
  </div>
  );
  })}
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
 axes={axes}
 typesObjectifs={typesObjectifs}
 typesResultatsCles={typesResultatsCles}
 configuration={configuration}
 auth={auth}
 missions={missions}
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
 missions={missions}
 />

 {/* ═══ Modal ajout rapide KR ═══ */}
 <QuickKRModal
  open={quickKRModal.open}
  onClose={() => setQuickKRModal({ open: false, objectifId: null })}
  defaultObjectifId={quickKRModal.objectifId}
  objectifs={objectifs.data || []}
  typesResultatsCles={typesResultatsCles}
 />

 {/* ═══ Modal ajout rapide tâche ═══ */}
 <QuickTaskModal
  open={quickTaskOpen}
  onClose={() => setQuickTaskOpen(false)}
  objectifs={objectifs.data || []}
  collaborateurs={collaborateurs}
  defaultCollaborateurId={defaultCollaborateurId}
  auth={auth}
  missions={missions}
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
 auth={auth}
 onClose={() => setTaskPanel({ tache: null, objectifTitre: null })}
 />
 )}
 </AnimatePresence>

 {/* === Modal edition directe KR === */}
 <EditKRModal
 open={editKrModal.open}
 onClose={() => setEditKrModal({ open: false, kr: null })}
 kr={editKrModal.kr}
 typesResultatsCles={typesResultatsCles}
 />
 </AppLayout>
 );
}
