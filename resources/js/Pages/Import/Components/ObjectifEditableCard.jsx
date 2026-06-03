import { useState } from 'react';
import { Badge } from '@/Components/ui/Badge';
import { Input } from '@/Components/ui/Input';
import { formatNumber } from '@/lib/utils';
import {
    ChevronDown, ChevronRight, Check, X, Trash2, Plus,
    AlertTriangle, Target, ListChecks, Clock, Tag,
} from 'lucide-react';

const PRIORITE_COLORS = {
    P1: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    P2: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    P3: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    P4: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
};

export default function ObjectifEditableCard({ objectif, index, axes, onUpdate, onToggle }) {
    const [expanded, setExpanded] = useState(true);
    const [expandedKrs, setExpandedKrs] = useState({});

    const handleObjectifChange = (field, value) => {
        onUpdate(index, { ...objectif, [field]: value });
    };

    const handleKrChange = (krIndex, field, value) => {
        const krs = [...objectif.resultats_cles];
        krs[krIndex] = { ...krs[krIndex], [field]: value };
        onUpdate(index, { ...objectif, resultats_cles: krs });
    };

    const handleKrToggle = (krIndex) => {
        const krs = [...objectif.resultats_cles];
        krs[krIndex] = { ...krs[krIndex], importer: !krs[krIndex].importer };
        onUpdate(index, { ...objectif, resultats_cles: krs });
    };

    const handleTacheToggle = (krIndex, tacheIndex) => {
        const krs = [...objectif.resultats_cles];
        const taches = [...krs[krIndex].taches];
        taches[tacheIndex] = { ...taches[tacheIndex], importer: !taches[tacheIndex].importer };
        krs[krIndex] = { ...krs[krIndex], taches };
        onUpdate(index, { ...objectif, resultats_cles: krs });
    };

    const handleAddKr = () => {
        const krs = [...objectif.resultats_cles, {
            description: '',
            description_detaillee: '',
            priorite: '',
            departement: '',
            progression: 0,
            date_debut: null,
            date_cible: null,
            responsables: [],
            responsables_bruts: '',
            taches: [],
            importer: true,
        }];
        onUpdate(index, { ...objectif, resultats_cles: krs });
    };

    const handleRemoveKr = (krIndex) => {
        const krs = objectif.resultats_cles.filter((_, i) => i !== krIndex);
        onUpdate(index, { ...objectif, resultats_cles: krs });
    };

    const toggleKrExpand = (krIndex) => {
        setExpandedKrs(prev => ({ ...prev, [krIndex]: !prev[krIndex] }));
    };

    const isV2 = !!objectif.numero;
    const nbKrs = objectif.resultats_cles?.length || 0;
    const nbTachesKr = objectif.resultats_cles?.reduce((sum, kr) => sum + (kr.taches?.length || 0), 0) || 0;
    const nbTachesDirect = objectif.taches_directes?.length || 0;
    const nbTaches = nbTachesKr + nbTachesDirect;

    return (
        <div className={`rounded-xl border transition-all ${
            objectif.importer
                ? 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800'
                : 'border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-900 opacity-60'
        }`}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(index); }}
                    className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                        objectif.importer
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'border-gray-300 dark:border-dark-600'
                    }`}
                >
                    {objectif.importer && <Check className="h-3.5 w-3.5" />}
                </button>

                {expanded
                    ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                }

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <Target className="h-4 w-4 text-primary-500 shrink-0" />
                        {isV2 && (
                            <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 shrink-0">
                                {objectif.numero}
                            </span>
                        )}
                        <input
                            type="text"
                            value={objectif.titre}
                            onChange={(e) => handleObjectifChange('titre', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-[13px] text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 flex-1 min-w-0 truncate"
                        />

                        {objectif.axe_label && (
                            <select
                                value={objectif.axe_label}
                                onChange={(e) => { e.stopPropagation(); handleObjectifChange('axe_label', e.target.value); }}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-medium border border-gray-200 dark:border-dark-600 rounded px-1.5 py-0.5 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 shrink-0 max-w-[180px] truncate"
                            >
                                {axes.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        )}

                        {!isV2 && (
                            <Badge className="text-[10px] bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400 px-1.5 py-0 shrink-0">
                                {formatNumber(objectif.progression, 0)}%
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 pl-6 flex-wrap">
                        <p className="text-[11px] text-gray-400">
                            {nbKrs} résultat{nbKrs > 1 ? 's' : ''} clé{nbKrs > 1 ? 's' : ''} · {nbTaches} tâche{nbTaches > 1 ? 's' : ''}
                        </p>
                        {isV2 && objectif.owner && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Owner : {objectif.owner}</span>
                        )}
                        {isV2 && objectif.periodes_detectees?.length > 0 && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                {objectif.periodes_detectees.join(' · ')}
                            </span>
                        )}
                        {isV2 && objectif.prime > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Prime {Number(objectif.prime).toLocaleString('fr-FR')} GNF
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Body — KRs */}
            {expanded && objectif.importer && (
                <div className="border-t border-gray-100 dark:border-dark-700">
                    {objectif.resultats_cles?.map((kr, krIndex) => (
                        <div key={krIndex} className={`border-b border-gray-50 dark:border-dark-700/50 last:border-b-0 ${
                            !kr.importer ? 'opacity-40' : ''
                        }`}>
                            {/* KR row */}
                            <div className="flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50/50 dark:hover:bg-dark-700/30">
                                <button
                                    onClick={() => handleKrToggle(krIndex)}
                                    className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                        kr.importer
                                            ? 'bg-primary-500 border-primary-500 text-white'
                                            : 'border-gray-300 dark:border-dark-600'
                                    }`}
                                >
                                    {kr.importer && <Check className="h-3 w-3" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    {/* Ligne principale : description + badges */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        {isV2 && kr.numero && (
                                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 shrink-0 w-8">
                                                {kr.numero}
                                            </span>
                                        )}
                                        <input
                                            type="text"
                                            value={kr.description || ''}
                                            onChange={(e) => handleKrChange(krIndex, 'description', e.target.value)}
                                            className="flex-1 min-w-0 text-[12px] text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 truncate"
                                            placeholder="Description du KR"
                                        />

                                        {!isV2 && kr.priorite && (
                                            <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${PRIORITE_COLORS[kr.priorite] || PRIORITE_COLORS.P3}`}>
                                                {kr.priorite}
                                            </Badge>
                                        )}

                                        {!isV2 && kr.departement && (
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">{kr.departement}</span>
                                        )}
                                    </div>

                                    {/* V2 : type · cible · unité · poids · owner */}
                                    {isV2 && (
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {kr.type_kr && (
                                                <Badge className="text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 px-1.5 py-0 shrink-0">
                                                    {kr.type_kr}
                                                </Badge>
                                            )}
                                            {kr.valeur_cible != null && (
                                                <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                                                    Cible : {Number(kr.valeur_cible).toLocaleString('fr-FR')}{kr.unite ? ` ${kr.unite}` : ''}
                                                </span>
                                            )}
                                            {kr.poids != null && kr.poids !== 1 && (
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
                                                    Poids {kr.poids}
                                                </span>
                                            )}
                                            {kr.owner && (
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
                                                    {kr.owner}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* V1 : responsables + dates + progression */}
                                    {!isV2 && (
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            {kr.responsables?.length > 0 && (
                                                <div className="flex flex-wrap gap-0.5">
                                                    {kr.responsables.map((r, ri) => (
                                                        <span key={ri} className="text-[10px] bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded px-1.5 py-0.5">
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <input
                                                    type="date"
                                                    value={kr.date_debut || ''}
                                                    onChange={(e) => handleKrChange(krIndex, 'date_debut', e.target.value)}
                                                    className={`text-[10px] w-[110px] bg-transparent border rounded px-1.5 py-0.5 ${
                                                        kr.date_debut_invalide
                                                            ? 'border-red-400 text-red-500'
                                                            : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400'
                                                    }`}
                                                />
                                                <input
                                                    type="date"
                                                    value={kr.date_cible || ''}
                                                    onChange={(e) => handleKrChange(krIndex, 'date_cible', e.target.value)}
                                                    className={`text-[10px] w-[110px] bg-transparent border rounded px-1.5 py-0.5 ${
                                                        kr.date_cible_invalide
                                                            ? 'border-red-400 text-red-500'
                                                            : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400'
                                                    }`}
                                                />
                                                {(kr.date_debut_invalide || kr.date_cible_invalide) && (
                                                    <span className="text-[9px] text-red-500 flex items-center gap-0.5 shrink-0">
                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                        Corriger
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 shrink-0 ml-auto">
                                                {formatNumber(kr.progression, 0)}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    {kr.taches?.length > 0 && (
                                        <button
                                            onClick={() => toggleKrExpand(krIndex)}
                                            className="text-[10px] text-primary-500 hover:text-primary-700 flex items-center gap-0.5"
                                        >
                                            <ListChecks className="h-3 w-3" />
                                            {kr.taches.length}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRemoveKr(krIndex)}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Tâches sous ce KR */}
                            {expandedKrs[krIndex] && kr.taches?.length > 0 && (
                                <div className="pl-12 pr-4 pb-2 space-y-1">
                                    {kr.taches.map((tache, tacheIndex) => (
                                        <div key={tacheIndex} className="flex items-center gap-2 py-1">
                                            <button
                                                onClick={() => handleTacheToggle(krIndex, tacheIndex)}
                                                className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                                                    tache.importer
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-gray-300 dark:border-dark-600'
                                                }`}
                                            >
                                                {tache.importer && <Check className="h-2.5 w-2.5" />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-[11px] ${tache.importer ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}`}>
                                                    {tache.titre}
                                                </span>
                                                {isV2 && (tache.categorie || tache.frequence) && (
                                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                        {tache.categorie && (
                                                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 rounded px-1.5 py-0">
                                                                <Tag className="h-2 w-2" />
                                                                {tache.categorie}
                                                            </span>
                                                        )}
                                                        {tache.frequence && (
                                                            <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-500 dark:text-gray-400">
                                                                <Clock className="h-2 w-2" />
                                                                {tache.frequence}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Tâches directes (v2 : KR# = "—") */}
                    {isV2 && objectif.taches_directes?.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-dark-700">
                            <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-gray-400 font-semibold bg-gray-50 dark:bg-dark-800/50">
                                Tâches directes sur l'objectif ({objectif.taches_directes.length})
                            </div>
                            <div className="pl-6 pr-4 pb-2 space-y-1">
                                {objectif.taches_directes.map((tache, ti) => (
                                    <div key={ti} className="flex items-start gap-2 py-1">
                                        <div className="h-3.5 w-3.5 mt-0.5 rounded border border-emerald-400 bg-emerald-500/20 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[11px] text-gray-700 dark:text-gray-300">{tache.titre}</span>
                                            {(tache.categorie || tache.frequence) && (
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    {tache.categorie && (
                                                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-gray-100 dark:bg-dark-700 text-gray-500 rounded px-1.5 py-0">
                                                            <Tag className="h-2 w-2" />
                                                            {tache.categorie}
                                                        </span>
                                                    )}
                                                    {tache.frequence && (
                                                        <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-500 dark:text-gray-400">
                                                            <Clock className="h-2 w-2" />
                                                            {tache.frequence}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ajouter un KR */}
                    {!isV2 && (
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-dark-700">
                            <button
                                onClick={handleAddKr}
                                className="text-[11px] text-primary-500 hover:text-primary-700 flex items-center gap-1 font-medium"
                            >
                                <Plus className="h-3 w-3" /> Ajouter un résultat clé
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
