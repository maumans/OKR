import { useState } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Progress } from '@/Components/ui/Progress';
import { UserAvatar } from '@/Components/ui/Avatar';
import { NumberInput } from '@/Components/ui/NumberInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Input } from '@/Components/ui/Input';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';
import { Label } from '@/Components/ui/Label';
import { Select } from '@/Components/ui/Select';
import { formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import {
    ArrowLeft, Target, Save, CheckCircle2, History,
    CheckSquare, Plus, Calendar, ExternalLink,
    Clock, AlertCircle, CheckCheck, Ban,
} from 'lucide-react';

const statutColors  = { brouillon: 'outline', actif: 'default', termine: 'success', annule: 'destructive' };
const statutLabels  = { brouillon: 'Brouillon', actif: 'Actif', termine: 'Terminé', annule: 'Annulé' };

const tacheStatutConfig = {
    a_faire:  { label: 'À faire',  icon: Clock,         variant: 'outline',     color: 'text-gray-500' },
    en_cours: { label: 'En cours', icon: AlertCircle,   variant: 'default',     color: 'text-primary-500' },
    termine:  { label: 'Terminé',  icon: CheckCheck,    variant: 'success',     color: 'text-emerald-500' },
    bloque:   { label: 'Bloqué',   icon: Ban,           variant: 'destructive', color: 'text-red-500' },
};

const prioriteColors = { basse: 'ghost', normale: 'secondary', haute: 'warning', urgente: 'destructive' };

function getSeuilColor(progression, seuils) {
    if (!seuils || seuils.length === 0) return null;
    const seuil = seuils.find(s => progression >= Number(s.seuil_min) && progression <= Number(s.seuil_max));
    return seuil?.couleur || null;
}

export default function OKRShow({ objectif, seuils = [], configuration, taches = [], collaborateurs = [] }) {
    const isPondere = configuration?.mode_calcul === 'pondere';
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Historique Modal
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedKrForHistory, setSelectedKrForHistory] = useState(null);

    const openHistory = (kr) => {
        setSelectedKrForHistory(kr);
        setHistoryOpen(true);
    };

    const { data, setData, put, processing } = useForm({
        resultats: objectif.resultats_cles.map(r => ({ id: r.id, progression: r.progression }))
    });

    const { put: putStatus } = useForm({});

    const { data: taskData, setData: setTaskData, post: postTask, processing: processingTask, errors: taskErrors, reset: resetTask } = useForm({
        titre: '',
        description: '',
        priorite: 'normale',
        collaborateur_id: objectif.collaborateur_id,
        date: '',
        objectif_id: objectif.id,
        resultat_cle_id: objectif.resultats_cles[0]?.id || null,
    });

    const handleProgressChange = (index, value) => {
        let val = Number(value);
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        const newResultats = [...data.resultats];
        newResultats[index].progression = val;
        setData('resultats', newResultats);
    };

    const handleSaveProgress = () => {
        put(route('objectifs.progress', objectif.id), { preserveScroll: true, onSuccess: () => toast.success('Progression enregistrée') });
    };

    const handleStatusChange = (newStatus) => {
        putStatus(route('objectifs.status', objectif.id), {
            data: { statut: newStatus },
            preserveScroll: true,
            onSuccess: () => toast.success('Statut mis à jour'),
        });
    };

    const submitCreateTask = (e) => {
        e.preventDefault();
        postTask(route('taches.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Tâche créée avec succès');
                setIsCreateOpen(false);
                resetTask();
            }
        });
    };

    // Stats tâches
    const tachesParStatut = {
        a_faire:  taches.filter(t => t.statut === 'a_faire').length,
        en_cours: taches.filter(t => t.statut === 'en_cours').length,
        termine:  taches.filter(t => t.statut === 'termine').length,
        bloque:   taches.filter(t => t.statut === 'bloque').length,
    };
    const tauxAchevementTaches = taches.length > 0
        ? Math.round((tachesParStatut.termine / taches.length) * 100)
        : 0;

    return (
        <AppLayout title={objectif.titre}>
            <div className="mb-8">
                <Link href={route('objectifs.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Retour aux OKR
                </Link>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{objectif.titre}</h1>
                            <Badge variant={statutColors[objectif.statut]}>{statutLabels[objectif.statut]}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                            {objectif.periode_nom && <span>Période : {objectif.periode_nom}</span>}
                            {objectif.axe_nom && (
                                <>
                                    <span>•</span>
                                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={objectif.axe_couleur ? { backgroundColor: objectif.axe_couleur + '20', color: objectif.axe_couleur } : {}}>
                                        {objectif.axe_nom}
                                    </span>
                                </>
                            )}
                            {objectif.type_nom && <><span>•</span><Badge variant="outline" className="text-xs">{objectif.type_nom}</Badge></>}
                            {Number(objectif.prime) > 0 && <><span>•</span><span>Prime : {formatNumber(objectif.prime, 0)} FCFA</span></>}
                        </div>
                    </motion.div>

                    <div className="flex gap-2 shrink-0">
                        {objectif.statut !== 'termine' && (
                            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => handleStatusChange('termine')}>
                                Marquer terminé
                            </Button>
                        )}
                        {objectif.statut !== 'actif' && (
                            <Button variant="outline" onClick={() => handleStatusChange('actif')}>Rendre actif</Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Colonne principale ─────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Progression globale */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex justify-between items-end">
                                    <span className="flex items-center gap-2"><Target className="h-5 w-5 text-primary-500" /> Progression Globale</span>
                                    <span className="text-3xl font-bold" style={{ color: getSeuilColor(objectif.progression_globale, seuils) || '#00c9ff' }}>
                                        {Math.round(objectif.progression_globale)}%
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(objectif.progression_globale, 100)}%`,
                                            backgroundColor: getSeuilColor(objectif.progression_globale, seuils) || '#00c9ff',
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Résultats Clés */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-secondary-500" /> Résultats Clés</CardTitle>
                                {objectif.statut === 'actif' && (
                                    <Button size="sm" onClick={handleSaveProgress} disabled={processing}><Save className="h-4 w-4 mr-2" /> Enregistrer</Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {objectif.resultats_cles.map((resultat, index) => {
                                    const tachesKr = taches.filter(t => t.resultat_cle_id === resultat.id);
                                    return (
                                        <div key={resultat.id} className="p-4 rounded-xl border border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{resultat.description}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {resultat.type_resultat_cle && (
                                                            <Badge variant="outline" className="text-[10px]">{resultat.type_resultat_cle.nom}</Badge>
                                                        )}
                                                        {resultat.valeur_cible && (
                                                            <span className="text-xs text-gray-400">Cible : {formatNumber(resultat.valeur_cible)}{resultat.unite ? ` ${resultat.unite}` : ''}</span>
                                                        )}
                                                        {isPondere && resultat.poids && (
                                                            <span className="text-xs text-gray-400">Poids : {resultat.poids}</span>
                                                        )}
                                                        {tachesKr.length > 0 && (
                                                            <span className="text-xs text-primary-500 flex items-center gap-1">
                                                                <CheckSquare className="h-3 w-3" />
                                                                {tachesKr.length} tâche{tachesKr.length > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => openHistory(resultat)}>
                                                            <History className="h-3 w-3 mr-1" /> Historique
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Progress value={data.resultats[index].progression} className="flex-1" variant={data.resultats[index].progression >= 100 ? 'success' : 'default'} />
                                                {objectif.statut === 'actif' ? (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <NumberInput
                                                            decimals={1}
                                                            className="w-28 font-semibold"
                                                            value={data.resultats[index].progression}
                                                            onChange={(v) => handleProgressChange(index, v)}
                                                            suffix="%"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-gray-700 dark:text-gray-300 w-12 text-right">{resultat.progression}%</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* ── Section Tâches liées ──────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-emerald-500" />
                                    Tâches liées
                                    <span className="ml-1 text-sm font-normal text-gray-400">({taches.length})</span>
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    {taches.length > 0 && (
                                        <Link
                                            href={route('taches.index', { objectif_id: objectif.id })}
                                            className="text-xs text-primary-500 hover:underline flex items-center gap-1"
                                        >
                                            <ExternalLink className="h-3 w-3" /> Voir dans le Kanban
                                        </Link>
                                    )}
                                    <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
                                        <Plus className="h-4 w-4 mr-1" /> Ajouter
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {taches.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                                        <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Aucune tâche liée à cet objectif.</p>
                                        <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsCreateOpen(true)}>
                                            <Plus className="h-4 w-4 mr-1" /> Créer une tâche
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Stats mini */}
                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            {Object.entries(tachesParStatut).map(([statut, count]) => {
                                                const cfg = tacheStatutConfig[statut];
                                                const Icon = cfg.icon;
                                                return (
                                                    <div key={statut} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700">
                                                        <Icon className={`h-4 w-4 mx-auto mb-1 ${cfg.color}`} />
                                                        <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{count}</div>
                                                        <div className="text-[10px] text-gray-400 leading-tight">{cfg.label}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Barre achèvement */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Taux d'achèvement des tâches</span>
                                                <span className="font-semibold text-emerald-500">{tauxAchevementTaches}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                                                    style={{ width: `${tauxAchevementTaches}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Liste des tâches */}
                                        <div className="space-y-2">
                                            {taches.map(tache => {
                                                const cfg = tacheStatutConfig[tache.statut] ?? tacheStatutConfig.a_faire;
                                                const Icon = cfg.icon;
                                                return (
                                                    <div key={tache.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors group">
                                                        <Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{tache.titre}</p>
                                                            <p className="text-xs text-gray-400 truncate">{tache.collaborateur}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant={prioriteColors[tache.priorite]} className="text-[10px] py-0">{tache.priorite}</Badge>
                                                            {tache.date && (
                                                                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {new Date(tache.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* ── Sidebar droite ──────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Assigné à</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <UserAvatar name={objectif.collaborateur.nom_complet} />
                                <div>
                                    <p className="font-medium">{objectif.collaborateur.nom_complet}</p>
                                    <p className="text-sm text-gray-500">{objectif.collaborateur.poste || 'Collaborateur'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Détails</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Créé le</p>
                                <p className="font-medium">{new Date(objectif.created_at).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
                                <p className="font-medium">{new Date(objectif.updated_at).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Résultats clés</p>
                                <p className="font-medium">{objectif.resultats_cles.length} KR</p>
                            </div>
                            {taches.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Tâches liées</p>
                                    <p className="font-medium">{taches.length} tâche{taches.length > 1 ? 's' : ''} ({tauxAchevementTaches}% terminées)</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ── Dialog Créer Tâche ────────────────────────────────── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nouvelle tâche pour cet OKR</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreateTask} className="space-y-4 mt-4">
                        <div>
                            <Label>Titre *</Label>
                            <Input value={taskData.titre} onChange={e => setTaskData('titre', e.target.value)} error={taskErrors.titre} className="mt-1" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-700 dark:bg-dark-900 dark:ring-offset-dark-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-primary-500 mt-1.5"
                                value={taskData.description}
                                onChange={e => setTaskData('description', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Priorité</Label>
                                <Select value={taskData.priorite} onChange={e => setTaskData('priorite', e.target.value)} className="mt-1.5">
                                    <option value="basse">Basse</option>
                                    <option value="normale">Normale</option>
                                    <option value="haute">Haute</option>
                                    <option value="urgente">Urgente</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Date d'échéance</Label>
                                <CustomDatePicker value={taskData.date} onChange={v => setTaskData('date', v)} error={taskErrors.date} className="mt-1.5" />
                            </div>
                        </div>
                        <div>
                            <Label>Assigné à *</Label>
                            <Select value={taskData.collaborateur_id} onChange={e => setTaskData('collaborateur_id', e.target.value)} error={taskErrors.collaborateur_id} className="mt-1.5">
                                <option value="">Sélectionner...</option>
                                {collaborateurs.map(c => (
                                    <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                                ))}
                            </Select>
                        </div>
                        
                        {objectif.resultats_cles.length > 0 && (
                            <div>
                                <Label>Résultat Clé *</Label>
                                <Select value={taskData.resultat_cle_id || ''} onChange={e => setTaskData('resultat_cle_id', e.target.value || null)} className="mt-1.5">
                                    {objectif.resultats_cles.map(r => (
                                        <option key={r.id} value={r.id}>{r.description}</option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={processingTask}>Créer</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Historique */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Historique de progression</DialogTitle>
                    </DialogHeader>
                    {selectedKrForHistory && (
                        <div className="space-y-4">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedKrForHistory.description}</p>
                            {selectedKrForHistory.historique_progressions && selectedKrForHistory.historique_progressions.length > 0 ? (
                                <div className="h-64 mt-4 bg-white dark:bg-dark-900 rounded-xl p-4 border border-gray-100 dark:border-dark-800">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={selectedKrForHistory.historique_progressions.map(h => ({
                                            date: new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                                            valeur: h.nouvelle_valeur
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-dark-700" />
                                            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} />
                                            <YAxis domain={[0, 'auto']} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem', fontSize: '12px' }}
                                            />
                                            <Line type="stepAfter" dataKey="valeur" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="p-4 text-center border border-dashed border-gray-200 dark:border-dark-800 rounded-lg">
                                    <p className="text-sm text-gray-500">Aucun historique disponible pour ce résultat clé.</p>
                                </div>
                            )}
                            <div className="max-h-60 overflow-y-auto space-y-3 mt-4 pr-2">
                                {selectedKrForHistory.historique_progressions?.map((h, i) => (
                                    <div key={i} className="text-sm p-3 bg-gray-50 dark:bg-dark-800/50 rounded-lg border border-gray-100 dark:border-dark-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                <span className="text-gray-400 line-through mr-2">{h.valeur_precedente}%</span>
                                                <span className="text-emerald-500">➔ {h.nouvelle_valeur}%</span>
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(h.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {h.justification && <p className="text-gray-600 dark:text-gray-400 mt-1.5 italic">"{h.justification}"</p>}
                                        {h.collaborateur && <p className="text-[10px] text-blue-500 mt-1 font-medium">Par {h.collaborateur.prenom} {h.collaborateur.nom}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
