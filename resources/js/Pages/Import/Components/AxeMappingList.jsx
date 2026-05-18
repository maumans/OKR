import { Badge } from '@/Components/ui/Badge';
import { Check, Palette } from 'lucide-react';

const COULEURS_PREDEF = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AxeMappingList({ axes, axesExistants, onChange }) {
    const handleToggle = (index) => {
        const updated = [...axes];
        updated[index] = { ...updated[index], importer: !updated[index].importer };
        onChange(updated);
    };

    const handleCouleurChange = (index, couleur) => {
        const updated = [...axes];
        updated[index] = { ...updated[index], couleur };
        onChange(updated);
    };

    const handleFusionner = (index, cibleIndex) => {
        const updated = [...axes];
        updated[index] = { ...updated[index], nom: updated[cibleIndex].nom, fusionne: true };
        onChange(updated);
    };

    const existeDeja = (nom) => {
        return axesExistants?.some(a => a.nom.toLowerCase() === nom.toLowerCase());
    };

    return (
        <div className="space-y-2">
            {axes.map((axe, index) => (
                <div
                    key={index}
                    className={`p-2.5 rounded-lg border transition-colors ${
                        axe.importer
                            ? 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800'
                            : 'border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-900 opacity-50'
                    }`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => handleToggle(index)}
                            className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                                axe.importer
                                    ? 'bg-primary-500 border-primary-500 text-white'
                                    : 'border-gray-300 dark:border-dark-600'
                            }`}
                        >
                            {axe.importer && <Check className="h-3 w-3" />}
                        </button>

                        <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: axe.couleur || COULEURS_PREDEF[index % COULEURS_PREDEF.length] }}
                        />

                        <span className="text-[12px] font-medium text-gray-900 dark:text-white truncate">
                            {axe.nom}
                        </span>

                        {existeDeja(axe.nom) ? (
                            <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0 shrink-0">
                                Existant
                            </Badge>
                        ) : (
                            <Badge className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-1.5 py-0 shrink-0">
                                Nouveau
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1 mt-2 pl-6">
                        {COULEURS_PREDEF.map(c => (
                            <button
                                key={c}
                                onClick={() => handleCouleurChange(index, c)}
                                className={`h-3.5 w-3.5 rounded-full border-2 transition-transform hover:scale-110 ${
                                    (axe.couleur || COULEURS_PREDEF[index % COULEURS_PREDEF.length]) === c
                                        ? 'border-gray-800 dark:border-white scale-110'
                                        : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {axes.length === 0 && (
                <p className="text-[12px] text-gray-400 dark:text-gray-500 text-center py-3">
                    Aucun axe détecté
                </p>
            )}
        </div>
    );
}
