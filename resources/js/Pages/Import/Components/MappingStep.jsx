import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import AxeMappingList from './AxeMappingList';
import CollaborateurMappingList from './CollaborateurMappingList';
import ObjectifEditableCard from './ObjectifEditableCard';
import {
    AlertTriangle, Layers, Users, Settings2, ChevronDown, ChevronUp,
    FileSpreadsheet, Check, Save,
} from 'lucide-react';
import { motion } from 'framer-motion';

const COULEURS_PREDEF = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function MappingStep({ preview, onCommit, loading }) {
    const { auth } = usePage().props;
    const societe = auth.societe;

    // State local pour l'édition
    const [objectifs, setObjectifs] = useState(preview.objectifs || []);
    const [axes, setAxes] = useState(
        (preview.axes_detectes || []).map((nom, i) => ({
            nom,
            nom_original: nom,
            couleur: COULEURS_PREDEF[i % COULEURS_PREDEF.length],
            importer: true,
        }))
    );
    const [collaborateurs, setCollaborateurs] = useState(preview.collaborateurs_mappes || []);
    const [expandAllKrs, setExpandAllKrs] = useState(false);

    // Brouillon localStorage
    const draftKey = `import_draft_${auth.user?.id}_${preview.meta?.fichier || ''}`;

    useEffect(() => {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                if (window.confirm('Un brouillon a été trouvé pour ce fichier. Voulez-vous le reprendre ?')) {
                    if (draft.objectifs) setObjectifs(draft.objectifs);
                    if (draft.axes) setAxes(draft.axes);
                    if (draft.collaborateurs) setCollaborateurs(draft.collaborateurs);
                }
            } catch { /* ignore */ }
        }
    }, []);

    const handleSaveDraft = () => {
        localStorage.setItem(draftKey, JSON.stringify({ objectifs, axes, collaborateurs }));
    };

    const handleObjectifUpdate = (index, updatedObj) => {
        const updated = [...objectifs];
        updated[index] = updatedObj;
        setObjectifs(updated);
    };

    const handleObjectifToggle = (index) => {
        const updated = [...objectifs];
        updated[index] = { ...updated[index], importer: !updated[index].importer };
        setObjectifs(updated);
    };

    // Calcul du résumé
    const objImportes = objectifs.filter(o => o.importer);
    const krsImportes = objImportes.flatMap(o => (o.resultats_cles || []).filter(kr => kr.importer));
    const tachesImportees = krsImportes.flatMap(kr => (kr.taches || []).filter(t => t.importer));
    const collabsACreer = collaborateurs.filter(c => c.a_creer && !c.existe);

    const allAxeLabels = [...new Set([
        ...axes.map(a => a.nom),
        ...objectifs.flatMap(o => [o.axe_label, ...(o.resultats_cles || []).map(kr => kr.axe_label)].filter(Boolean))
    ])];

    const handleCommit = () => {
        const payload = {
            meta: preview.meta,
            objectifs: objectifs.filter(o => o.importer).map(o => ({
                ...o,
                resultats_cles: (o.resultats_cles || []).filter(kr => kr.importer).map(kr => ({
                    ...kr,
                    taches: (kr.taches || []).filter(t => t.importer),
                })),
            })),
            axes_mapping: axes,
            collaborateurs_mapping: collaborateurs,
        };

        // Supprimer le brouillon
        localStorage.removeItem(draftKey);

        onCommit(payload);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Aperçu et mapping
                    </h2>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        {preview.meta?.fichier} — Feuille « {preview.meta?.feuille} » — {preview.meta?.nb_lignes} lignes détectées
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="text-[12px]"
                >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Sauvegarder le brouillon
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* ─── Colonne gauche (1/3) ─── */}
                <div className="space-y-4 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-1">
                    {/* Société cible */}
                    <Card className="rounded-xl border-gray-200 dark:border-dark-700 shadow-sm">
                        <CardContent className="p-4">
                            <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
                                Société cible
                            </h3>
                            <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                                {societe?.nom || 'Société active'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Axes détectés */}
                    <Card className="rounded-xl border-gray-200 dark:border-dark-700 shadow-sm">
                        <CardContent className="p-4">
                            <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-3 flex items-center gap-1.5">
                                <Layers className="h-3 w-3" />
                                Axes détectés ({axes.length})
                            </h3>
                            <AxeMappingList
                                axes={axes}
                                axesExistants={preview.axes_existants}
                                onChange={setAxes}
                            />
                        </CardContent>
                    </Card>

                    {/* Collaborateurs détectés */}
                    <Card className="rounded-xl border-gray-200 dark:border-dark-700 shadow-sm">
                        <CardContent className="p-4">
                            <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-3 flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                Collaborateurs détectés ({collaborateurs.length})
                            </h3>
                            <CollaborateurMappingList
                                collaborateurs={collaborateurs}
                                onChange={setCollaborateurs}
                            />
                        </CardContent>
                    </Card>

                    {/* Corrections automatiques */}
                    {preview.corrections?.length > 0 && (
                        <Card className="rounded-xl border-amber-200 dark:border-amber-500/20 shadow-sm bg-amber-50/50 dark:bg-amber-500/5">
                            <CardContent className="p-4">
                                <h3 className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-3 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3 w-3" />
                                    Corrections automatiques ({preview.corrections.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {preview.corrections.map((c, i) => (
                                        <div key={i} className="text-[11px] text-amber-700 dark:text-amber-400">
                                            {c.message}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ─── Colonne droite (2/3) — Arborescence ─── */}
                <div className="lg:col-span-2 space-y-3 min-w-0">
                    {/* Actions globales */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
                            <Settings2 className="h-3 w-3" />
                            Arborescence détectée ({objectifs.length} objectifs)
                        </h3>
                    </div>

                    {/* Légende compacte */}
                    <div className="flex items-center gap-4 px-4 text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
                        <span>Description</span>
                        <span>Prio</span>
                        <span>Dépt.</span>
                        <span>Resp.</span>
                        <span>Dates</span>
                        <span>%</span>
                    </div>

                    {/* Objectifs */}
                    {objectifs.map((obj, index) => (
                        <ObjectifEditableCard
                            key={index}
                            objectif={obj}
                            index={index}
                            axes={allAxeLabels}
                            onUpdate={handleObjectifUpdate}
                            onToggle={handleObjectifToggle}
                        />
                    ))}

                    {objectifs.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            Aucun objectif détecté dans le fichier.
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Barre d'action sticky (bas de page) ─── */}
            <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-3 bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-dark-700 flex items-center justify-between gap-4 z-20">
                <div className="flex items-center gap-3 text-[12px] text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{objImportes.length} objectifs</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span>{krsImportes.length} KR</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span>{tachesImportees.length} tâches</span>
                    {objImportes.length === 0 && (
                        <span className="text-amber-500 font-medium">— Sélectionnez au moins un objectif</span>
                    )}
                </div>
                <Button
                    onClick={handleCommit}
                    disabled={loading || objImportes.length === 0}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-[13px] shadow-md disabled:opacity-50 shrink-0 flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Import en cours...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4" />
                            Valider et importer
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
