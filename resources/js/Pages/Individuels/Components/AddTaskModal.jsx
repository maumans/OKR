import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { X } from 'lucide-react';
import { CustomSelect } from '@/Components/ui/CustomSelect';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';

export default function AddTaskModal({ open, onClose, objectifId, resultatsCles = [], defaultResultatCleId, collaborateurs, defaultCollaborateurId }) {
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState({ titre: '', priorite: 'normale', eisenhower: '', collaborateur_id: '', resultat_cle_id: '', date: '' });

    useEffect(() => {
        if (open) {
            setData(p => ({
                ...p, titre: '', date: '', eisenhower: '',
                resultat_cle_id: String(defaultResultatCleId || resultatsCles[0]?.id || ''),
                collaborateur_id: String(defaultCollaborateurId || ''),
            }));
            setError('');
        }
    }, [open, defaultResultatCleId]);

    const setF = (k, v) => setData(p => ({ ...p, [k]: v }));
    const selectCls = "px-2.5 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 appearance-none cursor-pointer";

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!data.titre.trim()) { setError('Le titre est obligatoire.'); return; }
        if (resultatsCles.length > 0 && !data.resultat_cle_id) { setError('Sélectionnez un résultat clé.'); return; }
        setSubmitting(true);
        router.post(route('taches.store'), {
            titre: data.titre, priorite: data.priorite, eisenhower: data.eisenhower || null,
            collaborateur_id: data.collaborateur_id, date: data.date || null,
            objectif_id: objectifId, resultat_cle_id: data.resultat_cle_id || null,
        }, {
            preserveScroll: true, preserveState: true,
            onSuccess: () => { toast.success('Tâche créée'); setSubmitting(false); onClose(); },
            onError: (errs) => { setError(Object.values(errs)[0] || 'Erreur.'); setSubmitting(false); },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setError(''); onClose(); } }}>
            <DialogContent aria-describedby={undefined} className="max-w-sm p-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-5 pb-4">
                        <DialogHeader><DialogTitle className="text-sm">Nouvelle tâche</DialogTitle></DialogHeader>
                        {error && (
                            <div className="mt-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
                                <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                        <div className="mt-3 space-y-2.5">
                            <input type="text" value={data.titre} onChange={e => setF('titre', e.target.value)} placeholder="Titre de la tâche..." autoFocus
                                className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                            {resultatsCles.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Résultat Clé *</label>
                                    <CustomSelect 
                                        value={data.resultat_cle_id} 
                                        onChange={v => setF('resultat_cle_id', v)} 
                                        options={resultatsCles.map(kr => ({ value: kr.id, label: kr.description }))}
                                        className="mt-1"
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <CustomSelect 
                                    value={data.priorite} 
                                    onChange={v => setF('priorite', v)} 
                                    options={[
                                        {value: "basse", label: "Basse"},
                                        {value: "normale", label: "Normale"},
                                        {value: "haute", label: "Haute"},
                                        {value: "urgente", label: "Urgente"}
                                    ]}
                                />
                                <CustomSelect 
                                    value={data.eisenhower} 
                                    onChange={v => setF('eisenhower', v)} 
                                    placeholder="Eisenhower..."
                                    options={[
                                        {value: "Q1", label: "Q1 — Faire maintenant"},
                                        {value: "Q2", label: "Q2 — Planifier"},
                                        {value: "Q3", label: "Q3 — Déléguer"},
                                        {value: "Q4", label: "Q4 — Éliminer"}
                                    ]}
                                />
                            </div>
                            <CustomDatePicker 
                                value={data.date} 
                                onChange={v => setF('date', v)} 
                                placeholder="Sélectionner une date"
                            />
                            <CustomSelect 
                                value={data.collaborateur_id} 
                                onChange={v => setF('collaborateur_id', v)} 
                                options={collaborateurs.map(c => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
                        <button type="button" onClick={onClose} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 transition-all">Annuler</button>
                        <button type="submit" disabled={submitting} className="px-4 py-1 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-all disabled:opacity-50">
                            {submitting ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
