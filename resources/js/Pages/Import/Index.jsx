import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import UploadStep from './Components/UploadStep';
import MappingStep from './Components/MappingStep';
import ConfirmModal from './Components/ConfirmModal';
import SuccessSummary from './Components/SuccessSummary';
import { Upload } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function ImportIndex() {
    const { errors, flash, preview: serverPreview } = usePage().props;
    const successResult = flash?.success || null;

    const [step, setStep] = useState(serverPreview ? 'mapping' : 'upload'); // upload | mapping | confirm | done
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [commitPayload, setCommitPayload] = useState(null);
    const [commitLoading, setCommitLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState(serverPreview || null);

    // Transition vers mapping quand preview arrive du serveur
    useEffect(() => {
        if (serverPreview && step === 'upload') {
            setPreview(serverPreview);
            setStep('mapping');
        }
    }, [serverPreview]);

    // Transition vers done quand success arrive
    useEffect(() => {
        if (successResult && typeof successResult === 'object' && successResult.objectifs !== undefined) {
            setResult(successResult);
            setStep('done');
            setCommitLoading(false);
            setConfirmOpen(false);
        }
    }, [successResult]);

    const handleCommit = (payload) => {
        setCommitPayload(payload);

        // Calculer le résumé pour le modal
        const objCount = payload.objectifs?.length || 0;
        const krCount = payload.objectifs?.reduce((s, o) => s + (o.resultats_cles?.length || 0), 0) || 0;
        const tacheCount = payload.objectifs?.reduce((s, o) =>
            s + (o.resultats_cles || []).reduce((ss, kr) => ss + (kr.taches?.length || 0), 0), 0) || 0;
        const collabCount = payload.collaborateurs_mapping?.filter(c => c.a_creer && !c.existe)?.length || 0;

        setCommitPayload({
            ...payload,
            _summary: { objectifs: objCount, krs: krCount, taches: tacheCount, collaborateurs: collabCount },
        });
        setConfirmOpen(true);
    };

    const handleConfirm = () => {
        if (!commitPayload) return;
        setCommitLoading(true);

        router.post(route('import.commit'), commitPayload, {
            preserveState: true,
            onSuccess: () => {
                // Handled by useEffect on successResult
            },
            onError: () => {
                setCommitLoading(false);
                setConfirmOpen(false);
            },
        });
    };

    const handleReset = () => {
        setStep('upload');
        setPreview(null);
        setCommitPayload(null);
        setResult(null);
    };

    return (
        <AppLayout title="Import de données">
            <div className="py-2">
                {/* Stepper */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {[
                        { key: 'upload', label: 'Téléversement', num: 1 },
                        { key: 'mapping', label: 'Aperçu & Mapping', num: 2 },
                        { key: 'confirm', label: 'Confirmation', num: 3 },
                        { key: 'done', label: 'Terminé', num: 4 },
                    ].map(({ key, label, num }, idx) => {
                        const isCurrent = step === key;
                        const isDone = ['upload', 'mapping', 'confirm', 'done'].indexOf(step) > ['upload', 'mapping', 'confirm', 'done'].indexOf(key);

                        return (
                            <div key={key} className="flex items-center gap-2">
                                {idx > 0 && (
                                    <div className={`h-px w-8 ${isDone || isCurrent ? 'bg-primary-500' : 'bg-gray-200 dark:bg-dark-700'}`} />
                                )}
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                        isCurrent ? 'bg-primary-500 text-white' :
                                        isDone ? 'bg-emerald-500 text-white' :
                                        'bg-gray-200 dark:bg-dark-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {isDone ? '✓' : num}
                                    </div>
                                    <span className={`text-[11px] font-medium hidden sm:inline ${
                                        isCurrent ? 'text-primary-600 dark:text-primary-400' :
                                        isDone ? 'text-emerald-600 dark:text-emerald-400' :
                                        'text-gray-400'
                                    }`}>
                                        {label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {step === 'upload' && (
                        <UploadStep key="upload" errors={errors} />
                    )}

                    {step === 'mapping' && preview && (
                        <MappingStep
                            key="mapping"
                            preview={preview}
                            onCommit={handleCommit}
                            loading={commitLoading}
                        />
                    )}

                    {step === 'done' && result && (
                        <SuccessSummary
                            key="done"
                            result={result}
                            onReset={handleReset}
                        />
                    )}
                </AnimatePresence>

                {/* Confirm Modal */}
                <ConfirmModal
                    open={confirmOpen}
                    onClose={() => { if (!commitLoading) setConfirmOpen(false); }}
                    onConfirm={handleConfirm}
                    loading={commitLoading}
                    summary={commitPayload?._summary || { objectifs: 0, krs: 0, taches: 0, collaborateurs: 0, societe: '' }}
                />

                {/* Erreurs d'import */}
                {errors?.import && (
                    <div className="mt-6 max-w-2xl mx-auto p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                        <p className="text-[13px] text-red-600 dark:text-red-400 font-medium">{errors.import}</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
