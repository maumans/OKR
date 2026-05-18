import { Badge } from '@/Components/ui/Badge';
import { Input } from '@/Components/ui/Input';
import { Check, UserPlus, UserCheck } from 'lucide-react';

export default function CollaborateurMappingList({ collaborateurs, onChange }) {
    const handleFieldChange = (index, field, value) => {
        const updated = [...collaborateurs];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const handleToggleCreer = (index) => {
        const updated = [...collaborateurs];
        updated[index] = { ...updated[index], a_creer: !updated[index].a_creer };
        onChange(updated);
    };

    return (
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {collaborateurs.map((collab, index) => (
                <div
                    key={index}
                    className={`p-2.5 rounded-lg border transition-colors ${
                        collab.existe
                            ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5'
                            : 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800'
                    }`}
                >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            {collab.existe ? (
                                <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                                <UserPlus className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            )}
                            <span className="text-[12px] font-medium text-gray-900 dark:text-white truncate">
                                {collab.nom_detecte}
                            </span>
                            {collab.existe ? (
                                <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0 shrink-0 whitespace-nowrap">
                                    Trouvé
                                </Badge>
                            ) : (
                                <Badge className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-1.5 py-0 shrink-0 whitespace-nowrap">
                                    À créer
                                </Badge>
                            )}
                        </div>

                        {!collab.existe && (
                            <select
                                value={collab.role || 'collaborateur'}
                                onChange={(e) => handleFieldChange(index, 'role', e.target.value)}
                                className="text-[11px] border border-gray-200 dark:border-dark-600 rounded px-1.5 py-0.5 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300"
                            >
                                <option value="collaborateur">Collaborateur</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        )}
                    </div>

                    {!collab.existe && collab.a_creer && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5 block">Nom</label>
                                <Input
                                    value={collab.nom || ''}
                                    onChange={(e) => handleFieldChange(index, 'nom', e.target.value)}
                                    className="h-7 text-[12px]"
                                    placeholder="Nom"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5 block">Prénom</label>
                                <Input
                                    value={collab.prenom || ''}
                                    onChange={(e) => handleFieldChange(index, 'prenom', e.target.value)}
                                    className="h-7 text-[12px]"
                                    placeholder="Prénom"
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {collaborateurs.length === 0 && (
                <p className="text-[12px] text-gray-400 dark:text-gray-500 text-center py-3">
                    Aucun collaborateur détecté
                </p>
            )}
        </div>
    );
}
