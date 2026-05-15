import { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { NativeSelect as Select } from '@/Components/ui/Select';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { Badge } from '@/Components/ui/Badge';
import { NumberInput } from '@/Components/ui/NumberInput';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function OKRCreate({ collaborateurs, axes = [], periodes = [], typesObjectifs = [], typesResultatsCles = [], configuration }) {
    const devise = usePage().props.auth?.societe?.devise;
    const isPondere = configuration?.mode_calcul === 'pondere';

    const { data, setData, post, processing, errors } = useForm({
        titre: '',
        axe: '',
        axe_objectif_id: '',
        periode: '',
        periode_ids: [],
        type_objectif_id: '',
        visibilite: configuration?.visibilite_defaut || 'equipe',
        prime: '',
        collaborateur_id: '',
        resultats_cles: [{ description: '', description_detaillee: '', type_resultat_cle_id: '', valeur_cible: 100, poids: 1, unite: '' }],
    });

    const addResultat = () => {
        setData('resultats_cles', [...data.resultats_cles, { description: '', description_detaillee: '', type_resultat_cle_id: '', valeur_cible: 100, poids: 1, unite: '' }]);
    };

    const removeResultat = (index) => {
        const newResultats = [...data.resultats_cles];
        newResultats.splice(index, 1);
        setData('resultats_cles', newResultats);
    };

    const updateResultat = (index, field, value) => {
        const newResultats = [...data.resultats_cles];
        newResultats[index][field] = value;

        if (field === 'type_resultat_cle_id' && value) {
            const type = typesResultatsCles.find(t => t.id === Number(value));
            if (type) {
                newResultats[index].unite = type.unite || '';
                if (type.type_valeur === 'percent') {
                    newResultats[index].valeur_cible = 100;
                } else if (type.type_valeur === 'boolean') {
                    newResultats[index].valeur_cible = 1;
                }
            }
        }

        setData('resultats_cles', newResultats);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('objectifs.store'));
    };

    return (
        <AppLayout title="Nouvel Objectif">
            <div className="mb-8">
                <Link href={route('objectifs.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Retour aux OKR
                </Link>
                <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-gray-900 dark:text-white">
                    Créer un Objectif
                </motion.h1>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Objectif principal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary-500" />Informations de l'objectif</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="titre">Titre de l'objectif *</Label>
                                <Input id="titre" value={data.titre} onChange={e => setData('titre', e.target.value)} error={errors.titre} placeholder="Ex: Augmenter le chiffre d'affaires" className="mt-1.5 text-lg" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="collaborateur_id">Assigné à *</Label>
                                    <SearchableSelect 
                                        id="collaborateur_id" 
                                        value={data.collaborateur_id} 
                                        onChange={value => setData('collaborateur_id', value)} 
                                        options={collaborateurs.map(c => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))}
                                        error={errors.collaborateur_id} 
                                        className="mt-1.5" 
                                    />
                                </div>
                                <div>
                                    <Label>Périodes *</Label>
                                    {periodes.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            {periodes.map(p => (
                                                <label key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer text-sm">
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                        checked={data.periode_ids.includes(p.id)} 
                                                        onChange={(e) => {
                                                            const newIds = e.target.checked 
                                                                ? [...data.periode_ids, p.id]
                                                                : data.periode_ids.filter(id => id !== p.id);
                                                            setData('periode_ids', newIds);
                                                        }} 
                                                    />
                                                    {p.nom}
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <Input id="periode" value={data.periode} onChange={e => setData('periode', e.target.value)} error={errors.periode} className="mt-1.5" placeholder="Ex: Q2-2026" />
                                    )}
                                    {errors.periode_ids && <p className="text-xs text-red-500 mt-1">{errors.periode_ids}</p>}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="axe_objectif_id">Axe stratégique</Label>
                                    {axes.length > 0 ? (
                                        <Select id="axe_objectif_id" value={data.axe_objectif_id} onChange={e => setData('axe_objectif_id', e.target.value)} className="mt-1.5">
                                            <option value="">Aucun axe</option>
                                            {axes.map(a => (
                                                <option key={a.id} value={a.id}>{a.nom}</option>
                                            ))}
                                        </Select>
                                    ) : (
                                        <Input id="axe" value={data.axe} onChange={e => setData('axe', e.target.value)} placeholder="Ex: Croissance, Produit..." className="mt-1.5" />
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="type_objectif_id">Type d'objectif</Label>
                                    {typesObjectifs.length > 0 ? (
                                        <Select id="type_objectif_id" value={data.type_objectif_id} onChange={e => setData('type_objectif_id', e.target.value)} className="mt-1.5">
                                            <option value="">Aucun type</option>
                                            {typesObjectifs.map(t => (
                                                <option key={t.id} value={t.id}>{t.nom} ({t.niveau})</option>
                                            ))}
                                        </Select>
                                    ) : (
                                        <Input disabled placeholder="Configurer les types dans Paramètres OKR" className="mt-1.5" />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="prime">Prime associée (Optionnelle)</Label>
                                    <NumberInput id="prime" value={data.prime} onChange={v => setData('prime', v)} placeholder="0" className="mt-1.5" suffix={devise?.code || 'GNF'} />
                                </div>
                                <div>
                                    <Label htmlFor="visibilite">Visibilité</Label>
                                    <Select id="visibilite" value={data.visibilite} onChange={e => setData('visibilite', e.target.value)} className="mt-1.5">
                                        <option value="tous">Tous</option>
                                        <option value="equipe">Équipe</option>
                                        <option value="prive">Privé</option>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Résultats Clés */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-secondary-500" />
                                    Résultats Clés
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addResultat}>
                                    <Plus className="h-4 w-4 mr-1" /> Ajouter
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Les résultats clés permettent de mesurer l'atteinte de l'objectif.</p>
                            
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {data.resultats_cles.map((resultat, index) => {
                                        const selectedType = typesResultatsCles.find(t => t.id === Number(resultat.type_resultat_cle_id));
                                        const isBoolean = selectedType?.type_valeur === 'boolean';

                                        return (
                                            <motion.div key={index} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                className="p-4 rounded-lg border border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 space-y-3">
                                                <div className="flex gap-2 items-start">
                                                    <span className="text-xs font-bold text-slate-400 mt-2.5 w-5 shrink-0">#{index + 1}</span>
                                                    <div className="flex-1 space-y-2">
                                                        <Input
                                                            value={resultat.description}
                                                            onChange={e => updateResultat(index, 'description', e.target.value)}
                                                            placeholder="Titre du KR (Ex: Atteindre 100 ventes...)"
                                                            error={errors[`resultats_cles.${index}.description`]}
                                                        />
                                                        <textarea
                                                            value={resultat.description_detaillee || ''}
                                                            onChange={e => updateResultat(index, 'description_detaillee', e.target.value)}
                                                            placeholder="Description détaillée, contexte, ou notes supplémentaires..."
                                                            className="w-full rounded-md border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm focus:border-primary-500 focus:ring-primary-500 min-h-[60px]"
                                                        />
                                                    </div>
                                                    {typesResultatsCles.length > 0 && (
                                                        <Select value={resultat.type_resultat_cle_id} onChange={e => updateResultat(index, 'type_resultat_cle_id', e.target.value)} className="w-40 shrink-0">
                                                            <option value="">Type...</option>
                                                            {typesResultatsCles.map(t => (
                                                                <option key={t.id} value={t.id}>{t.nom}</option>
                                                            ))}
                                                        </Select>
                                                    )}
                                                    {data.resultats_cles.length > 1 && (
                                                        <Button type="button" variant="ghost" className="text-red-500 shrink-0 px-2" onClick={() => removeResultat(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                {selectedType && !isBoolean && (
                                                    <div className="flex items-center gap-3 ml-7">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs text-slate-400 whitespace-nowrap">Cible</Label>
                                                            <NumberInput value={resultat.valeur_cible} onChange={v => updateResultat(index, 'valeur_cible', v)} className="w-40" decimals={0} />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs text-slate-400">Unité</Label>
                                                            <Input value={resultat.unite} onChange={e => updateResultat(index, 'unite', e.target.value)} className="w-24" placeholder={selectedType.unite || '—'} />
                                                        </div>
                                                        {isPondere && (
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-xs text-slate-400">Poids</Label>
                                                                <NumberInput value={resultat.poids} onChange={v => updateResultat(index, 'poids', v)} className="w-28" decimals={1} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {isBoolean && (
                                                    <p className="ml-7 text-xs text-slate-400 italic">Fait / Non fait — pas de valeur cible nécessaire</p>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                            {errors.resultats_cles && <p className="text-sm text-red-500 mt-2">{errors.resultats_cles}</p>}
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>{processing ? 'Création...' : 'Enregistrer l\'objectif'}</Button>
                        <Link href={route('objectifs.index')}><Button type="button" variant="outline">Annuler</Button></Link>
                    </div>
                </form>
            </motion.div>
        </AppLayout>
    );
}
