import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { Check, Target, ListChecks, Users, ArrowRight, RotateCcw, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuccessSummary({ result, onReset }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-lg mx-auto"
        >
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-8 text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Import réalisé avec succès !
                </h2>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                    {result?.message || 'Les données ont été importées dans votre société.'}
                </p>

                <div className="space-y-2 mb-8 text-left">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-dark-800 border border-emerald-100 dark:border-emerald-500/10">
                        <Target className="h-4 w-4 text-primary-500" />
                        <span className="text-[13px] text-gray-700 dark:text-gray-300">
                            ✅ <strong>{result?.objectifs || 0}</strong> objectif{(result?.objectifs || 0) > 1 ? 's' : ''} créé{(result?.objectifs || 0) > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-dark-800 border border-emerald-100 dark:border-emerald-500/10">
                        <ListChecks className="h-4 w-4 text-emerald-500" />
                        <span className="text-[13px] text-gray-700 dark:text-gray-300">
                            ✅ <strong>{result?.krs || 0}</strong> résultat{(result?.krs || 0) > 1 ? 's' : ''} clé{(result?.krs || 0) > 1 ? 's' : ''} créé{(result?.krs || 0) > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-dark-800 border border-emerald-100 dark:border-emerald-500/10">
                        <Check className="h-4 w-4 text-blue-500" />
                        <span className="text-[13px] text-gray-700 dark:text-gray-300">
                            ✅ <strong>{result?.taches || 0}</strong> tâche{(result?.taches || 0) > 1 ? 's' : ''} créée{(result?.taches || 0) > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-dark-800 border border-emerald-100 dark:border-emerald-500/10">
                        <Users className="h-4 w-4 text-violet-500" />
                        <span className="text-[13px] text-gray-700 dark:text-gray-300">
                            ✅ <strong>{result?.collaborateurs || 0}</strong> collaborateur{(result?.collaborateurs || 0) > 1 ? 's' : ''} créé{(result?.collaborateurs || 0) > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    <Link href={route('objectifs.index')}>
                        <Button className="bg-primary-500 hover:bg-primary-600 text-white text-[13px]">
                            <ArrowRight className="h-4 w-4 mr-1.5" />
                            Voir les OKR
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        onClick={onReset}
                        className="text-[13px]"
                    >
                        <Upload className="h-4 w-4 mr-1.5" />
                        Importer un autre fichier
                    </Button>
                    <Link href={route('import.historique')}>
                        <Button variant="ghost" className="text-[13px] text-gray-500">
                            <RotateCcw className="h-4 w-4 mr-1.5" />
                            Historique des imports
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
