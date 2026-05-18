import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import EmptyState from '@/Components/EmptyState';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UploadStep({ onParsed, errors }) {
    const [fichier, setFichier] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            setFichier(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            setFichier(e.target.files[0]);
        }
    };

    const handleAnalyser = () => {
        if (!fichier) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('fichier', fichier);

        router.post(route('import.parse'), formData, {
            forceFormData: true,
            preserveState: true,
            onSuccess: () => {
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            },
        });
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' o';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
        return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
        >
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Importer un plan d'action
                </h2>
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                    Téléversez un fichier Excel (.xlsx, .xls) ou CSV contenant votre plan d'action.
                    Le système analysera automatiquement la structure du fichier.
                </p>
            </div>

            {/* Zone de drop */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    dragActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                        : fichier
                            ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/5'
                            : 'border-gray-300 dark:border-dark-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-800/50'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {fichier ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <FileSpreadsheet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{fichier.name}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{formatSize(fichier.size)}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setFichier(null); }}
                            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 mt-1"
                        >
                            <X className="h-3 w-3" /> Retirer le fichier
                        </button>
                    </div>
                ) : (
                    <EmptyState
                        icon={Upload}
                        title="Glissez-déposez votre fichier ici"
                        description="ou cliquez pour parcourir vos fichiers. Formats acceptés : .xlsx, .xls, .csv (max 10 Mo)"
                        className="py-0"
                    />
                )}
            </div>

            {/* Erreurs */}
            {errors?.fichier && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-[13px] text-red-600 dark:text-red-400">{errors.fichier}</p>
                </div>
            )}

            {/* Bouton analyser */}
            <div className="mt-6 flex justify-center">
                <Button
                    onClick={handleAnalyser}
                    disabled={!fichier || loading}
                    className="px-8 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold text-[13px] disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Analyse en cours...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            Analyser le fichier
                        </span>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
