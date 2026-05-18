import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Button } from '@/Components/ui/Button';
import { AlertTriangle, Check, Target, ListChecks, Users } from 'lucide-react';

export default function ConfirmModal({ open, onClose, onConfirm, loading, summary }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[15px]">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Confirmer l'import
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    <p className="text-[13px] text-gray-600 dark:text-gray-400">
                        Vous êtes sur le point de créer les éléments suivants dans la société 
                        <strong className="text-gray-900 dark:text-white"> {summary.societe || ''}</strong> :
                    </p>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-800">
                            <Target className="h-4 w-4 text-primary-500" />
                            <span className="text-[13px] text-gray-700 dark:text-gray-300">
                                <strong>{summary.objectifs}</strong> objectif{summary.objectifs > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-800">
                            <ListChecks className="h-4 w-4 text-emerald-500" />
                            <span className="text-[13px] text-gray-700 dark:text-gray-300">
                                <strong>{summary.krs}</strong> résultat{summary.krs > 1 ? 's' : ''} clé{summary.krs > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-800">
                            <Check className="h-4 w-4 text-blue-500" />
                            <span className="text-[13px] text-gray-700 dark:text-gray-300">
                                <strong>{summary.taches}</strong> tâche{summary.taches > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-800">
                            <Users className="h-4 w-4 text-violet-500" />
                            <span className="text-[13px] text-gray-700 dark:text-gray-300">
                                <strong>{summary.collaborateurs}</strong> collaborateur{summary.collaborateurs > 1 ? 's' : ''} à créer
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="text-[13px]"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-primary-500 hover:bg-primary-600 text-white text-[13px]"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                Import en cours...
                            </span>
                        ) : (
                            "Confirmer l'import"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
