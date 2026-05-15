import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { NumberInput } from '@/Components/ui/NumberInput';
import { Target, X } from 'lucide-react';

export default function ObjectifModal({ open, onClose, collaborateurs, selectedCollaborateur, moisActuel, moisOptions, axes, editData = null, auth }) {
    const devise = auth?.societe?.devise;
    const isEdit = !!editData;
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({});

    useEffect(() => {
        if (open) {
            if (isEdit) {
                setForm({
                    collaborateur_id: String(editData.collaborateur_id || selectedCollaborateur?.id || ''),
                    mois: moisActuel, axe_objectif_id: String(editData.axe_objectif_id || ''),
                    titre: editData.titre || '',
                    resultats_cles: (editData.resultats_cles || []).map(kr => ({ id: kr.id, description: kr.description })),
                    prime: editData.prime || '', note_contexte: editData.note_contexte || '',
                });
            } else {
                setForm({
                    collaborateur_id: String(selectedCollaborateur?.id || ''), mois: moisActuel,
                    axe_objectif_id: '', titre: '', resultats_cles: [{ id: null, description: '' }],
                    prime: '', note_contexte: '',
                });
            }
            setError('');
        }
    }, [open, editData]);

    const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const updateKR = (i, v) => { const krs = [...form.resultats_cles]; krs[i] = { ...krs[i], description: v }; setField('resultats_cles', krs); };
    const addKR = () => setField('resultats_cles', [...form.resultats_cles, { id: null, description: '' }]);
    const removeKR = (i) => { const krs = [...form.resultats_cles]; krs.splice(i, 1); setField('resultats_cles', krs); };

    const handleSubmit = (e) => {
        e.preventDefault(); setError('');
        if (!form.titre.trim()) { setError("Le titre est obligatoire."); return; }
        const filledKRs = form.resultats_cles.filter(kr => kr.description.trim());
        if (!filledKRs.length) { setError('Ajoutez au moins un résultat clé.'); return; }
        setSubmitting(true);
        const payload = { ...form, resultats_cles: filledKRs, prime: form.prime || 0 };
        const config = {
            preserveScroll: true, preserveState: true,
            onSuccess: () => { toast.success(isEdit ? 'Objectif mis à jour' : 'Objectif créé'); setSubmitting(false); onClose(); },
            onError: (errs) => { setError(Object.values(errs)[0] || 'Erreur.'); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
        };
        if (isEdit) router.put(route('individuels.update', editData.id), payload, config);
        else router.post(route('individuels.store'), payload, config);
    };

    const selectedAxe = axes.find(a => String(a.id) === String(form.axe_objectif_id));
    const inputCls = "w-full mt-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 appearance-none cursor-pointer";

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent aria-describedby={undefined} className="max-w-lg p-0 overflow-hidden max-h-[90vh]">
                <form onSubmit={handleSubmit}>
                    <div className="p-5 pb-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base">
                                <Target className="h-4 w-4 text-rose-500" />
                                {isEdit ? "Modifier l'objectif individuel" : 'Nouvel objectif individuel'}
                            </DialogTitle>
                        </DialogHeader>
                        {error && (
                            <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
                                <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                        <div className="mt-4 space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Collaborateur</label>
                                <select value={form.collaborateur_id || ''} onChange={e => setField('collaborateur_id', e.target.value)} disabled={!auth?.isResponsable} className={inputCls + " disabled:opacity-50 disabled:cursor-not-allowed"}>
                                    {collaborateurs.map(c => <option key={c.id} value={String(c.id)}>{c.prenom} {c.nom}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mois / Période</label>
                                <select value={form.mois || ''} onChange={e => setField('mois', e.target.value)} className={inputCls}>
                                    {moisOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Axe</label>
                                <select value={form.axe_objectif_id || ''} onChange={e => setField('axe_objectif_id', e.target.value)} className={inputCls}>
                                    <option value="">Sélectionner un axe...</option>
                                    {axes.map(a => <option key={a.id} value={String(a.id)}>● {a.nom}</option>)}
                                </select>
                                {selectedAxe && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedAxe.couleur }} />
                                        <span className="text-[11px] font-medium" style={{ color: selectedAxe.couleur }}>{selectedAxe.nom}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="h-1 w-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 mb-1.5" />
                                <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Objectif (Titre)</label>
                                <input type="text" value={form.titre || ''} onChange={e => setField('titre', e.target.value)}
                                    placeholder="Ex : Livrer 3 missions avec NPS ≥ 8/10" autoFocus
                                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Key Results (un par ligne)</label>
                                <div className="mt-1 space-y-2">
                                    {(form.resultats_cles || []).map((kr, i) => (
                                        <div key={kr.id || `new-${i}`} className="flex items-start gap-2">
                                            <textarea value={kr.description} onChange={e => updateKR(i, e.target.value)} rows={2}
                                                placeholder={`KR${i + 1} : ex. NPS ≥ 8/10 sur chaque mission clôturée`}
                                                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none" />
                                            {(form.resultats_cles || []).length > 1 && (
                                                <button type="button" onClick={() => removeKR(i)} className="p-1 mt-1 text-gray-400 hover:text-red-500 transition-colors">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addKR}
                                    className="w-full mt-2 py-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg border border-dashed border-gray-200 dark:border-dark-700 transition-all flex items-center justify-center gap-1">
                                    + Ajouter un KR
                                </button>
                            </div>
                            <div>
                                <div className="h-1 w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 mb-1.5" />
                                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Prime si ≥ 80% atteint ({devise?.code || 'GNF'})</label>
                                <NumberInput value={form.prime} onChange={v => setField('prime', v)} decimals={0} suffix={devise?.code || 'GNF'} placeholder="Ex : 400 000" className="mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Note / Contexte</label>
                                <textarea value={form.note_contexte || ''} onChange={e => setField('note_contexte', e.target.value)}
                                    rows={3} placeholder="Contexte, ressources, méthode..."
                                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
                        <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-all">Annuler</button>
                        <button type="submit" disabled={submitting} className="px-5 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-sm transition-all disabled:opacity-50">
                            {submitting ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
