import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select } from '@/Components/ui/Select';
import { Badge } from '@/Components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/Table';
import { motion } from 'framer-motion';
import {
    Settings2, Compass, CalendarRange, Target, BarChart3, CheckCircle2,
    Gauge, Award, Plus, Pencil, Trash2, Save
} from 'lucide-react';
import { NumberInput } from '@/Components/ui/NumberInput';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';

// ─── Composant CRUD Table réutilisable ───────────────────
function CrudSection({ title, icon: Icon, items, columns, renderRow, onAdd, onEdit, onDelete, addLabel = 'Ajouter' }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary-500" />{title}</span>
                    <Button size="sm" onClick={onAdd}><Plus className="h-4 w-4 mr-1" />{addLabel}</Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, i) => (
                                <TableHead key={i} className={col.className}>{col.label}</TableHead>
                            ))}
                            <TableHead className="text-right w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-20 text-center text-slate-400 italic">
                                    Aucun élément configuré
                                </TableCell>
                            </TableRow>
                        ) : items.map((item) => (
                            <TableRow key={item.id}>
                                {renderRow(item)}
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => onDelete(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// ─── Page principale ─────────────────────────────────────
export default function ParametresOKR({
    axes, periodes, typesObjectifs, typesResultatsCles,
    statuts, seuils, configuration, configurationPrime, templates
}) {
    const [activeDialog, setActiveDialog] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // ─── Forms ───────────────────────────────────────────
    const axeForm = useForm({ nom: '', description: '', couleur: '#00c9ff', ordre: 0, actif: true });
    const periodeForm = useForm({ nom: '', date_debut: '', date_fin: '', type: 'trimestriel', statut: 'actif' });
    const typeObjForm = useForm({ nom: '', description: '', niveau: 'individuel' });
    const typeKRForm = useForm({ nom: '', type_valeur: 'number', unite: '' });
    const statutForm = useForm({ nom: '', couleur: '#6b7280', ordre: 0, est_final: false });
    const seuilForm = useForm({ nom: '', couleur: '#ef4444', seuil_min: 0, seuil_max: 100, ordre: 0 });
    const configForm = useForm({
        mode_calcul: configuration?.mode_calcul || 'moyenne',
        frequence_update: configuration?.frequence_update || 'hebdomadaire',
        rappel_automatique: configuration?.rappel_automatique ?? true,
        visibilite_defaut: configuration?.visibilite_defaut || 'equipe',
        vue_okr: configuration?.vue_okr || 'cards',
    });
    const primeForm = useForm({
        actif: configurationPrime?.actif ?? false,
        montant_max: configurationPrime?.montant_max || '',
        seuil_minimum: configurationPrime?.seuil_minimum || 70,
        mode_calcul: configurationPrime?.mode_calcul || 'proportionnel',
        paliers: configurationPrime?.paliers || [],
    });

    // ─── Generic dialog helpers ──────────────────────────
    const openAdd = (type, form, defaults) => {
        form.reset();
        if (defaults) Object.entries(defaults).forEach(([k, v]) => form.setData(k, v));
        setEditingItem(null);
        setActiveDialog(type);
    };

    const openEdit = (type, form, item, fields) => {
        fields.forEach(f => form.setData(f, item[f] ?? ''));
        setEditingItem(item);
        setActiveDialog(type);
    };

    const handleDelete = (routeName, id) => {
        if (!confirm('Supprimer cet élément ?')) return;
        router.delete(route(routeName, id));
    };

    // ─── Submit helpers ──────────────────────────────────
    const submitAxe = (e) => {
        e.preventDefault();
        const action = editingItem ? () => axeForm.put(route('parametres.okr.axes.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : () => axeForm.post(route('parametres.okr.axes.store'), { onSuccess: () => setActiveDialog(null) });
        action();
    };
    const submitPeriode = (e) => {
        e.preventDefault();
        const action = editingItem ? () => periodeForm.put(route('parametres.okr.periodes.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : () => periodeForm.post(route('parametres.okr.periodes.store'), { onSuccess: () => setActiveDialog(null) });
        action();
    };
    const submitTypeObj = (e) => {
        e.preventDefault();
        const action = editingItem ? () => typeObjForm.put(route('parametres.okr.types-objectifs.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : () => typeObjForm.post(route('parametres.okr.types-objectifs.store'), { onSuccess: () => setActiveDialog(null) });
        action();
    };
    const submitTypeKR = (e) => {
        e.preventDefault();
        const action = editingItem ? () => typeKRForm.put(route('parametres.okr.types-resultats.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : () => typeKRForm.post(route('parametres.okr.types-resultats.store'), { onSuccess: () => setActiveDialog(null) });
        action();
    };
    const submitStatut = (e) => {
        e.preventDefault();
        const action = editingItem ? () => statutForm.put(route('parametres.okr.statuts.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : () => statutForm.post(route('parametres.okr.statuts.store'), { onSuccess: () => setActiveDialog(null) });
        action();
    };
    const submitSeuil = (e) => {
        e.preventDefault();
        const action = editingItem ? () => seuilForm.put(route('parametres.okr.seuils.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : () => seuilForm.post(route('parametres.okr.seuils.store'), { onSuccess: () => setActiveDialog(null) });
        action();
    };

    return (
        <AppLayout title="Paramètres OKR">
            <div className="mb-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings2 className="h-6 w-6 text-primary-500" /> Paramètres OKR
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Configurez entièrement le système OKR de votre société</p>
                </motion.div>
            </div>

            <Tabs defaultValue="axes">
                <TabsList className="flex-wrap">
                    <TabsTrigger value="axes"><Compass className="h-4 w-4 mr-1.5" />Axes</TabsTrigger>
                    <TabsTrigger value="periodes"><CalendarRange className="h-4 w-4 mr-1.5" />Périodes</TabsTrigger>
                    <TabsTrigger value="types"><Target className="h-4 w-4 mr-1.5" />Types</TabsTrigger>
                    <TabsTrigger value="resultats"><BarChart3 className="h-4 w-4 mr-1.5" />Résultats Clés</TabsTrigger>
                    <TabsTrigger value="statuts"><CheckCircle2 className="h-4 w-4 mr-1.5" />Statuts</TabsTrigger>
                    <TabsTrigger value="seuils"><Gauge className="h-4 w-4 mr-1.5" />Seuils</TabsTrigger>
                    <TabsTrigger value="config"><Settings2 className="h-4 w-4 mr-1.5" />Configuration</TabsTrigger>
                    <TabsTrigger value="primes"><Award className="h-4 w-4 mr-1.5" />Primes</TabsTrigger>
                </TabsList>

                {/* ─── Axes stratégiques ──────────────────────── */}
                <TabsContent value="axes">
                    <CrudSection
                        title="Axes stratégiques" icon={Compass} items={axes}
                        columns={[
                            { label: 'Couleur', className: 'w-16' },
                            { label: 'Nom' },
                            { label: 'Description' },
                            { label: 'Ordre', className: 'w-16' },
                            { label: 'Statut', className: 'w-20' },
                        ]}
                        renderRow={(item) => (<>
                            <TableCell><div className="h-5 w-5 rounded-full" style={{ backgroundColor: item.couleur }} /></TableCell>
                            <TableCell className="font-medium">{item.nom}</TableCell>
                            <TableCell className="text-slate-500 text-sm">{item.description}</TableCell>
                            <TableCell>{item.ordre}</TableCell>
                            <TableCell><Badge variant={item.actif ? 'default' : 'ghost'}>{item.actif ? 'Actif' : 'Inactif'}</Badge></TableCell>
                        </>)}
                        onAdd={() => openAdd('axe', axeForm, { couleur: '#00c9ff', ordre: axes.length + 1 })}
                        onEdit={(item) => openEdit('axe', axeForm, item, ['nom', 'description', 'couleur', 'ordre', 'actif'])}
                        onDelete={(item) => handleDelete('parametres.okr.axes.destroy', item.id)}
                    />
                </TabsContent>

                {/* ─── Périodes ───────────────────────────────── */}
                <TabsContent value="periodes">
                    <CrudSection
                        title="Périodes OKR" icon={CalendarRange} items={periodes}
                        columns={[
                            { label: 'Nom' },
                            { label: 'Type' },
                            { label: 'Début' },
                            { label: 'Fin' },
                            { label: 'Statut' },
                        ]}
                        renderRow={(item) => (<>
                            <TableCell className="font-medium">{item.nom}</TableCell>
                            <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                            <TableCell className="text-sm">{new Date(item.date_debut).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell className="text-sm">{new Date(item.date_fin).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell><Badge variant={item.statut === 'actif' ? 'default' : 'ghost'}>{item.statut}</Badge></TableCell>
                        </>)}
                        onAdd={() => openAdd('periode', periodeForm)}
                        onEdit={(item) => openEdit('periode', periodeForm, item, ['nom', 'date_debut', 'date_fin', 'type', 'statut'])}
                        onDelete={(item) => handleDelete('parametres.okr.periodes.destroy', item.id)}
                    />
                </TabsContent>

                {/* ─── Types d'objectifs ──────────────────────── */}
                <TabsContent value="types">
                    <CrudSection
                        title="Types d'objectifs" icon={Target} items={typesObjectifs}
                        columns={[
                            { label: 'Nom' },
                            { label: 'Description' },
                            { label: 'Niveau' },
                        ]}
                        renderRow={(item) => (<>
                            <TableCell className="font-medium">{item.nom}</TableCell>
                            <TableCell className="text-slate-500 text-sm">{item.description}</TableCell>
                            <TableCell><Badge variant="outline">{item.niveau}</Badge></TableCell>
                        </>)}
                        onAdd={() => openAdd('typeObj', typeObjForm)}
                        onEdit={(item) => openEdit('typeObj', typeObjForm, item, ['nom', 'description', 'niveau'])}
                        onDelete={(item) => handleDelete('parametres.okr.types-objectifs.destroy', item.id)}
                    />
                </TabsContent>

                {/* ─── Types de résultats clés ────────────────── */}
                <TabsContent value="resultats">
                    <CrudSection
                        title="Types de résultats clés" icon={BarChart3} items={typesResultatsCles}
                        columns={[
                            { label: 'Nom' },
                            { label: 'Type de valeur' },
                            { label: 'Unité' },
                        ]}
                        renderRow={(item) => (<>
                            <TableCell className="font-medium">{item.nom}</TableCell>
                            <TableCell><Badge variant="outline">{{ number: 'Quantitatif', percent: 'Pourcentage', boolean: 'Booléen', currency: 'Financier' }[item.type_valeur] || item.type_valeur}</Badge></TableCell>
                            <TableCell className="text-slate-500">{item.unite || '—'}</TableCell>
                        </>)}
                        onAdd={() => openAdd('typeKR', typeKRForm)}
                        onEdit={(item) => openEdit('typeKR', typeKRForm, item, ['nom', 'type_valeur', 'unite'])}
                        onDelete={(item) => handleDelete('parametres.okr.types-resultats.destroy', item.id)}
                    />
                </TabsContent>

                {/* ─── Statuts ────────────────────────────────── */}
                <TabsContent value="statuts">
                    <CrudSection
                        title="Statuts des objectifs" icon={CheckCircle2} items={statuts}
                        columns={[
                            { label: 'Couleur', className: 'w-16' },
                            { label: 'Nom' },
                            { label: 'Ordre', className: 'w-16' },
                            { label: 'Final', className: 'w-16' },
                        ]}
                        renderRow={(item) => (<>
                            <TableCell><div className="h-5 w-5 rounded-full" style={{ backgroundColor: item.couleur }} /></TableCell>
                            <TableCell className="font-medium">{item.nom}</TableCell>
                            <TableCell>{item.ordre}</TableCell>
                            <TableCell>{item.est_final ? '✓' : ''}</TableCell>
                        </>)}
                        onAdd={() => openAdd('statut', statutForm, { ordre: statuts.length + 1 })}
                        onEdit={(item) => openEdit('statut', statutForm, item, ['nom', 'couleur', 'ordre', 'est_final'])}
                        onDelete={(item) => handleDelete('parametres.okr.statuts.destroy', item.id)}
                    />
                </TabsContent>

                {/* ─── Seuils ─────────────────────────────────── */}
                <TabsContent value="seuils">
                    <CrudSection
                        title="Seuils de performance" icon={Gauge} items={seuils}
                        columns={[
                            { label: 'Couleur', className: 'w-16' },
                            { label: 'Nom' },
                            { label: 'Min (%)' },
                            { label: 'Max (%)' },
                        ]}
                        renderRow={(item) => (<>
                            <TableCell><div className="h-5 w-5 rounded-full" style={{ backgroundColor: item.couleur }} /></TableCell>
                            <TableCell className="font-medium">{item.nom}</TableCell>
                            <TableCell>{item.seuil_min}%</TableCell>
                            <TableCell>{item.seuil_max}%</TableCell>
                        </>)}
                        onAdd={() => openAdd('seuil', seuilForm, { ordre: seuils.length + 1 })}
                        onEdit={(item) => openEdit('seuil', seuilForm, item, ['nom', 'couleur', 'seuil_min', 'seuil_max', 'ordre'])}
                        onDelete={(item) => handleDelete('parametres.okr.seuils.destroy', item.id)}
                    />
                </TabsContent>

                {/* ─── Configuration globale ──────────────────── */}
                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary-500" />Configuration générale</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => { e.preventDefault(); configForm.put(route('parametres.okr.configuration.update')); }} className="space-y-5 max-w-lg">
                                <div>
                                    <Label>Mode de calcul de la progression</Label>
                                    <Select value={configForm.data.mode_calcul} onChange={e => configForm.setData('mode_calcul', e.target.value)} className="mt-1.5">
                                        <option value="moyenne">Moyenne simple</option>
                                        <option value="pondere">Pondéré (par poids des KR)</option>
                                        <option value="manuel">Manuel</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Fréquence de mise à jour</Label>
                                    <Select value={configForm.data.frequence_update} onChange={e => configForm.setData('frequence_update', e.target.value)} className="mt-1.5">
                                        <option value="quotidien">Quotidien</option>
                                        <option value="hebdomadaire">Hebdomadaire</option>
                                        <option value="mensuel">Mensuel</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Visibilité par défaut</Label>
                                    <Select value={configForm.data.visibilite_defaut} onChange={e => configForm.setData('visibilite_defaut', e.target.value)} className="mt-1.5">
                                        <option value="tous">Tous</option>
                                        <option value="equipe">Équipe</option>
                                        <option value="prive">Privé</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Vue par défaut des OKR</Label>
                                    <Select value={configForm.data.vue_okr} onChange={e => configForm.setData('vue_okr', e.target.value)} className="mt-1.5">
                                        <option value="cards">Cards (grille)</option>
                                        <option value="liste">Liste (compacte)</option>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="rappel" checked={configForm.data.rappel_automatique}
                                        onChange={e => configForm.setData('rappel_automatique', e.target.checked)}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    <Label htmlFor="rappel">Activer les rappels automatiques</Label>
                                </div>
                                <Button type="submit" disabled={configForm.processing} className="gap-2">
                                    <Save className="h-4 w-4" /> Enregistrer
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── Primes ─────────────────────────────────── */}
                <TabsContent value="primes">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary-500" />Configuration des primes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => { e.preventDefault(); primeForm.put(route('parametres.okr.primes.update')); }} className="space-y-5 max-w-lg">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="primeActif" checked={primeForm.data.actif}
                                        onChange={e => primeForm.setData('actif', e.target.checked)}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    <Label htmlFor="primeActif">Activer le système de primes</Label>
                                </div>
                                {primeForm.data.actif && (<>
                                    <div>
                                        <Label>Montant maximum (optionnel)</Label>
                                        <NumberInput value={primeForm.data.montant_max} onChange={v => primeForm.setData('montant_max', v)} className="mt-1.5" placeholder="Illimité si vide" suffix="GNF" />
                                    </div>
                                    <div>
                                        <Label>Seuil minimum de déclenchement (%)</Label>
                                        <NumberInput value={primeForm.data.seuil_minimum} onChange={v => primeForm.setData('seuil_minimum', v)} className="mt-1.5" suffix="%" decimals={0} />
                                    </div>
                                    <div>
                                        <Label>Mode de calcul</Label>
                                        <Select value={primeForm.data.mode_calcul} onChange={e => primeForm.setData('mode_calcul', e.target.value)} className="mt-1.5">
                                            <option value="fixe">Fixe (tout ou rien)</option>
                                            <option value="proportionnel">Proportionnel au taux d'atteinte</option>
                                            <option value="palier">Par paliers</option>
                                        </Select>
                                    </div>
                                    {primeForm.data.mode_calcul === 'palier' && (
                                        <div className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-dark-800">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-semibold">Paliers</Label>
                                                <Button type="button" size="sm" variant="outline" onClick={() => {
                                                    primeForm.setData('paliers', [...primeForm.data.paliers, { seuil_min: 0, seuil_max: 100, pourcentage_prime: 0 }]);
                                                }}><Plus className="h-3.5 w-3.5 mr-1" />Palier</Button>
                                            </div>
                                            {primeForm.data.paliers.map((palier, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <NumberInput placeholder="Min" value={palier.seuil_min} className="w-24" suffix="%" decimals={0}
                                                        onChange={v => { const p = [...primeForm.data.paliers]; p[i].seuil_min = v; primeForm.setData('paliers', p); }} />
                                                    <span className="text-slate-400">→</span>
                                                    <NumberInput placeholder="Max" value={palier.seuil_max} className="w-24" suffix="%" decimals={0}
                                                        onChange={v => { const p = [...primeForm.data.paliers]; p[i].seuil_max = v; primeForm.setData('paliers', p); }} />
                                                    <span className="text-slate-400">=</span>
                                                    <NumberInput placeholder="Prime" value={palier.pourcentage_prime} className="w-24" suffix="%" decimals={0}
                                                        onChange={v => { const p = [...primeForm.data.paliers]; p[i].pourcentage_prime = v; primeForm.setData('paliers', p); }} />
                                                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => {
                                                        const p = [...primeForm.data.paliers]; p.splice(i, 1); primeForm.setData('paliers', p);
                                                    }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>)}
                                <Button type="submit" disabled={primeForm.processing} className="gap-2">
                                    <Save className="h-4 w-4" /> Enregistrer
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ═══════════════════════════════════════════════════════════
                 DIALOGS
               ═══════════════════════════════════════════════════════════ */}

            {/* Axe Dialog */}
            <Dialog open={activeDialog === 'axe'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un axe stratégique</DialogTitle></DialogHeader>
                    <form onSubmit={submitAxe} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={axeForm.data.nom} onChange={e => axeForm.setData('nom', e.target.value)} error={axeForm.errors.nom} /></div>
                        <div><Label>Description</Label><Input value={axeForm.data.description} onChange={e => axeForm.setData('description', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Couleur</Label><Input type="color" value={axeForm.data.couleur} onChange={e => axeForm.setData('couleur', e.target.value)} className="mt-1.5 h-10" /></div>
                            <div><Label>Ordre</Label><NumberInput value={axeForm.data.ordre} onChange={v => axeForm.setData('ordre', v)} className="mt-1.5" decimals={0} /></div>
                        </div>
                        {editingItem && (
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={axeForm.data.actif} onChange={e => axeForm.setData('actif', e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                                <Label>Actif</Label>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={axeForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Periode Dialog */}
            <Dialog open={activeDialog === 'periode'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} une période</DialogTitle></DialogHeader>
                    <form onSubmit={submitPeriode} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={periodeForm.data.nom} onChange={e => periodeForm.setData('nom', e.target.value)} error={periodeForm.errors.nom} placeholder="Ex: Q2 2026" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Date début *</Label><CustomDatePicker value={periodeForm.data.date_debut} onChange={v => periodeForm.setData('date_debut', v)} className="mt-1.5" /></div>
                            <div><Label>Date fin *</Label><CustomDatePicker value={periodeForm.data.date_fin} onChange={v => periodeForm.setData('date_fin', v)} className="mt-1.5" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Type *</Label>
                                <Select value={periodeForm.data.type} onChange={e => periodeForm.setData('type', e.target.value)} className="mt-1.5">
                                    <option value="mensuel">Mensuel</option><option value="trimestriel">Trimestriel</option><option value="annuel">Annuel</option>
                                </Select>
                            </div>
                            {editingItem && (
                                <div><Label>Statut</Label>
                                    <Select value={periodeForm.data.statut} onChange={e => periodeForm.setData('statut', e.target.value)} className="mt-1.5">
                                        <option value="actif">Actif</option><option value="cloture">Clôturé</option>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={periodeForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Type Objectif Dialog */}
            <Dialog open={activeDialog === 'typeObj'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un type d'objectif</DialogTitle></DialogHeader>
                    <form onSubmit={submitTypeObj} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={typeObjForm.data.nom} onChange={e => typeObjForm.setData('nom', e.target.value)} error={typeObjForm.errors.nom} /></div>
                        <div><Label>Description</Label><Input value={typeObjForm.data.description} onChange={e => typeObjForm.setData('description', e.target.value)} /></div>
                        <div><Label>Niveau *</Label>
                            <Select value={typeObjForm.data.niveau} onChange={e => typeObjForm.setData('niveau', e.target.value)} className="mt-1.5">
                                <option value="individuel">Individuel</option><option value="equipe">Équipe</option><option value="entreprise">Entreprise</option>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={typeObjForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Type KR Dialog */}
            <Dialog open={activeDialog === 'typeKR'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un type de résultat clé</DialogTitle></DialogHeader>
                    <form onSubmit={submitTypeKR} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={typeKRForm.data.nom} onChange={e => typeKRForm.setData('nom', e.target.value)} error={typeKRForm.errors.nom} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Type de valeur *</Label>
                                <Select value={typeKRForm.data.type_valeur} onChange={e => typeKRForm.setData('type_valeur', e.target.value)} className="mt-1.5">
                                    <option value="number">Quantitatif</option><option value="percent">Pourcentage</option><option value="boolean">Booléen</option><option value="currency">Financier</option>
                                </Select>
                            </div>
                            <div><Label>Unité</Label><Input value={typeKRForm.data.unite} onChange={e => typeKRForm.setData('unite', e.target.value)} className="mt-1.5" placeholder="%, GNF, unités..." /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={typeKRForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Statut Dialog */}
            <Dialog open={activeDialog === 'statut'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un statut</DialogTitle></DialogHeader>
                    <form onSubmit={submitStatut} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={statutForm.data.nom} onChange={e => statutForm.setData('nom', e.target.value)} error={statutForm.errors.nom} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Couleur</Label><Input type="color" value={statutForm.data.couleur} onChange={e => statutForm.setData('couleur', e.target.value)} className="mt-1.5 h-10" /></div>
                            <div><Label>Ordre</Label><NumberInput value={statutForm.data.ordre} onChange={v => statutForm.setData('ordre', v)} className="mt-1.5" decimals={0} /></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={statutForm.data.est_final} onChange={e => statutForm.setData('est_final', e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                            <Label>Statut final (objectif considéré comme clos)</Label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={statutForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Seuil Dialog */}
            <Dialog open={activeDialog === 'seuil'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un seuil de performance</DialogTitle></DialogHeader>
                    <form onSubmit={submitSeuil} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={seuilForm.data.nom} onChange={e => seuilForm.setData('nom', e.target.value)} error={seuilForm.errors.nom} placeholder="Ex: En retard" /></div>
                        <div><Label>Couleur</Label><Input type="color" value={seuilForm.data.couleur} onChange={e => seuilForm.setData('couleur', e.target.value)} className="mt-1.5 h-10" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Seuil min (%)</Label><NumberInput value={seuilForm.data.seuil_min} onChange={v => seuilForm.setData('seuil_min', v)} className="mt-1.5" suffix="%" decimals={0} /></div>
                            <div><Label>Seuil max (%)</Label><NumberInput value={seuilForm.data.seuil_max} onChange={v => seuilForm.setData('seuil_max', v)} className="mt-1.5" suffix="%" decimals={0} /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={seuilForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
