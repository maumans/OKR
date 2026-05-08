import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';

const statutLabels = { a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé', bloque: 'Bloqué' };
const stepColors = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500'];

export default function TaskDetailPanel({ tache, onClose, krDescription, collaborateurs = [] }) {
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

    useEffect(() => {
        if (tache) {
            setEditing(false);
            setEditData({
                titre: tache.titre || '', description: tache.description || '',
                mode_operatoire: parseJsonArray(tache.mode_operatoire), outils: tache.outils || '',
                definition_done: parseJsonArray(tache.definition_done), priorite: tache.priorite || 'normale',
                eisenhower: tache.eisenhower || '', date: tache.date || '',
                collaborateur_id: String(tache.collaborateur_id || ''), statut: tache.statut || 'a_faire',
            });
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [tache]);

    useEffect(() => {
        const handleEscape = (e) => { if (e.key === 'Escape') { editing ? setEditing(false) : onClose(); } };
        if (tache) { document.addEventListener('keydown', handleEscape); return () => document.removeEventListener('keydown', handleEscape); }
    }, [tache, editing, onClose]);

    const handleSave = () => {
        setSaving(true);
        router.put(route('taches.update', tache.id), editData, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Tâche mise à jour'); setSaving(false); setEditing(false); onClose(); },
            onError: () => setSaving(false), onFinish: () => setSaving(false),
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
    const moSteps = parseJsonArray(tache.mode_operatoire);
    const outilsList = typeof tache.outils === 'string' ? tache.outils.split(',').map(s => s.trim()).filter(Boolean) : [];
    const doneItems = parseJsonArray(tache.definition_done);

    const setED = (k, v) => setEditData(p => ({ ...p, [k]: v }));
    const selectCls = "w-full mt-0.5 px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] appearance-none cursor-pointer";

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-[60]" onClick={onClose} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white dark:bg-dark-900 z-[70] shadow-2xl flex flex-col border-l border-gray-200 dark:border-dark-800">

                {/* Header */}
                <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {editing ? (
                            <input type="text" value={editData.titre} onChange={e => setED('titre', e.target.value)}
                                className="w-full text-[13px] font-bold text-gray-900 dark:text-white px-2 py-1 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                        ) : (
                            <h2 className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug">{tache.titre}</h2>
                        )}
                        {krDescription && <p className="text-[10px] text-gray-400 mt-1">KR : {krDescription}</p>}
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors shrink-0 mt-0.5">
                        <X className="h-4 w-4 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-dark-800 px-5">
                    {['fiche', 'note'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`pb-2 mr-6 text-xs font-semibold border-b-2 transition-colors ${activeTab === t ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                            {t === 'fiche' ? 'Fiche' : 'Note'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'fiche' ? (
                        <div className="px-5 py-4 space-y-5">
                            {/* Informations */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <span className="text-[11px]">📋</span> Informations
                                </p>
                                {editing ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-gray-400">Statut</label>
                                                <select value={editData.statut} onChange={e => setED('statut', e.target.value)} className={selectCls}>
                                                    <option value="a_faire">À faire</option><option value="en_cours">En cours</option>
                                                    <option value="termine">Terminé</option><option value="bloque">Bloqué</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400">Priorité</label>
                                                <select value={editData.priorite} onChange={e => setED('priorite', e.target.value)} className={selectCls}>
                                                    <option value="basse">Basse</option><option value="normale">Normale</option>
                                                    <option value="haute">Haute</option><option value="urgente">Urgente</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] text-gray-400">Eisenhower</label>
                                                <select value={editData.eisenhower || ''} onChange={e => setED('eisenhower', e.target.value)} className={selectCls}>
                                                    <option value="">Aucun</option>
                                                    <option value="Q1">Q1 — Faire maintenant</option><option value="Q2">Q2 — Planifier</option>
                                                    <option value="Q3">Q3 — Déléguer</option><option value="Q4">Q4 — Éliminer</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400">Date</label>
                                                <CustomDatePicker value={editData.date || ''} onChange={v => setED('date', v)} size="sm" className="mt-0.5 w-full" />
                                            </div>
                                        </div>
                                        {collaborateurs.length > 0 && (
                                            <div>
                                                <label className="text-[10px] text-gray-400">Responsable</label>
                                                <select value={editData.collaborateur_id || ''} onChange={e => setED('collaborateur_id', e.target.value)} className={selectCls}>
                                                    {collaborateurs.map(c => <option key={c.id} value={String(c.id)}>{c.prenom} {c.nom}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">{tache.collaborateur || 'Non assigné'}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tache.statut === 'termine' ? 'bg-emerald-100 text-emerald-600' : tache.statut === 'en_cours' ? 'bg-primary-100 text-primary-600' : tache.statut === 'bloque' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {statutLabels[tache.statut] || tache.statut}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prio.cls}`}>{prio.label}</span>
                                        {tache.eisenhower && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-600">{tache.eisenhower}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="text-[11px]">📝</span> Description</p>
                                {editing ? (
                                    <textarea value={editData.description || ''} onChange={e => setED('description', e.target.value)} placeholder="Description..." rows={3}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-y" />
                                ) : tache.description ? (
                                    <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{tache.description}</p>
                                ) : <p className="text-[12px] text-gray-400 italic">Aucune description.</p>}
                            </div>

                            {/* Mode Opératoire */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="text-[11px]">📋</span> Mode Opératoire</p>
                                {editing ? (
                                    <div className="space-y-1.5">
                                        {(editData.mode_operatoire || []).map((step, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{i+1}.</span>
                                                <input type="text" value={step} onChange={e => { const a=[...(editData.mode_operatoire||[])]; a[i]=e.target.value; setED('mode_operatoire',a); }}
                                                    className="flex-1 px-2 py-1 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                                                <button type="button" onClick={() => { const a=[...(editData.mode_operatoire||[])]; a.splice(i,1); setED('mode_operatoire',a); }}
                                                    className="text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setED('mode_operatoire',[...(editData.mode_operatoire||[]),''])}
                                            className="text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 mt-1"><Plus className="h-3 w-3" /> Ajouter une étape</button>
                                    </div>
                                ) : moSteps.length > 0 ? (
                                    <div className="space-y-2">
                                        {moSteps.map((step,i) => (
                                            <div key={i} className="flex items-start gap-2.5">
                                                <span className={`h-5 w-5 shrink-0 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${stepColors[i%stepColors.length]}`}>{i+1}</span>
                                                <span className="text-[12px] text-gray-700 dark:text-gray-300 pt-0.5">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-[12px] text-gray-400 italic">Non défini.</p>}
                            </div>

                            {/* Outils */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="text-[11px]">🔧</span> Outils & Ressources</p>
                                {editing ? (
                                    <input type="text" value={editData.outils || ''} onChange={e => setED('outils', e.target.value)} placeholder="Séparés par virgule"
                                        className="w-full px-2 py-1.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                                ) : outilsList.length > 0 ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {outilsList.map((o,i) => <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400">{o}</span>)}
                                    </div>
                                ) : <p className="text-[12px] text-gray-400 italic">Aucun outil.</p>}
                            </div>

                            {/* Done */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="text-[11px]">✅</span> Définition de "Done"</p>
                                {editing ? (
                                    <div className="space-y-1.5">
                                        {(editData.definition_done || []).map((item,i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="text-emerald-500 text-[12px] shrink-0">✓</span>
                                                <input type="text" value={item} onChange={e => { const a=[...(editData.definition_done||[])]; a[i]=e.target.value; setED('definition_done',a); }}
                                                    className="flex-1 px-2 py-1 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                                                <button type="button" onClick={() => { const a=[...(editData.definition_done||[])]; a.splice(i,1); setED('definition_done',a); }}
                                                    className="text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setED('definition_done',[...(editData.definition_done||[]),''])}
                                            className="text-[11px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 mt-1"><Plus className="h-3 w-3" /> Ajouter un critère</button>
                                    </div>
                                ) : doneItems.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {doneItems.map((item,i) => (
                                            <div key={i} className="flex items-start gap-2"><span className="text-emerald-500 text-[12px] mt-0.5 shrink-0">✓</span><span className="text-[12px] text-gray-700 dark:text-gray-300">{item}</span></div>
                                        ))}
                                    </div>
                                ) : <p className="text-[12px] text-gray-400 italic">Non défini.</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="px-5 py-4">
                            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Ajouter une note..."
                                className="w-full min-h-[200px] px-3 py-2.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-[12px] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-y" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-dark-800 flex items-center gap-2">
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} className="px-4 py-2.5 text-xs font-medium text-gray-500 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-all">Annuler</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all disabled:opacity-50">
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditing(true)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-all">Modifier</button>
                            <button onClick={() => { if(confirm('Supprimer cette tâche ?')) { router.delete(route('taches.destroy',tache.id),{preserveScroll:true,onSuccess:()=>toast.success('Tâche supprimée')}); onClose(); }}}
                                className="p-2.5 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 transition-all">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </>
    );
}
