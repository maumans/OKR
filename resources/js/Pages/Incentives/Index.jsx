import { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select } from '@/Components/ui/Select';
import { Badge } from '@/Components/ui/Badge';
import { Card, CardContent } from '@/Components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/Table';
import { Progress } from '@/Components/ui/Progress';
import { Award, Plus, Calculator } from 'lucide-react';
import { NumberInput } from '@/Components/ui/NumberInput';
import { formatNumber } from '@/lib/utils';

export default function IncentivesIndex({ objectifs, collaborateurs }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        collaborateur_id: '',
        titre: '',
        type: 'trimestriel',
        indicateur: '',
        periode: '',
        prime: '',
    });

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('incentives.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            }
        });
    };

    return (
        <AppLayout title="Incentives & Primes">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Award className="h-6 w-6 text-primary-500" /> Objectifs Rémunérés
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Gérez les primes et objectifs financiers
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Link href={route('incentives.validation')}>
                        <Button variant="outline" className="text-slate-600">
                            <Calculator className="h-4 w-4 mr-2" /> Espace Validation
                        </Button>
                    </Link>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-primary-500 hover:bg-primary-600">
                        <Plus className="h-4 w-4 mr-2" />Nouvel Objectif
                    </Button>
                </div>
            </div>

            <Card className="bg-white dark:bg-dark-900 shadow-sm border-slate-200 dark:border-dark-800">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Collaborateur</TableHead>
                                <TableHead>Objectif</TableHead>
                                <TableHead>Période</TableHead>
                                <TableHead className="text-right">Prime Cible</TableHead>
                                <TableHead>Taux Atteinte</TableHead>
                                <TableHead className="text-right">Prime Versée</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {objectifs.map((obj) => (
                                <TableRow key={obj.id}>
                                    <TableCell className="font-medium">{obj.collaborateur}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{obj.titre}</span>
                                            <span className="text-xs text-slate-400">{obj.indicateur}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{obj.periode}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-900 dark:text-white">
                                        {formatNumber(obj.prime_cible, 0)} FCFA
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={obj.taux_atteinte} className="w-24 h-2" variant={obj.taux_atteinte >= 100 ? 'success' : 'default'} />
                                            <span className="text-xs font-semibold">{Number(obj.taux_atteinte).toFixed(0)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">
                                        {formatNumber(obj.prime_versee, 0)} FCFA
                                    </TableCell>
                                </TableRow>
                            ))}
                            {objectifs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        Aucun objectif rémunéré défini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Définir un objectif rémunéré</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4 mt-4">
                        <div>
                            <Label>Collaborateur *</Label>
                            <Select value={data.collaborateur_id} onChange={e => setData('collaborateur_id', e.target.value)} error={errors.collaborateur_id}>
                                <option value="">Sélectionner...</option>
                                {collaborateurs.map(c => (
                                    <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label>Titre de l'objectif *</Label>
                            <Input value={data.titre} onChange={e => setData('titre', e.target.value)} placeholder="Ex: Atteindre 100k€ de CA" error={errors.titre} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Indicateur (KPI)</Label>
                                <Input value={data.indicateur} onChange={e => setData('indicateur', e.target.value)} placeholder="Ex: CA Généré" error={errors.indicateur} />
                            </div>
                            <div>
                                <Label>Période *</Label>
                                <Input value={data.periode} onChange={e => setData('periode', e.target.value)} placeholder="Ex: Q3-2026" error={errors.periode} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Type</Label>
                                <Select value={data.type} onChange={e => setData('type', e.target.value)}>
                                    <option value="mensuel">Mensuel</option>
                                    <option value="trimestriel">Trimestriel</option>
                                    <option value="annuel">Annuel</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Prime Cible (FCFA) *</Label>
                                <NumberInput value={data.prime} onChange={v => setData('prime', v)} error={errors.prime} suffix="GNF" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={processing} className="bg-primary-500 hover:bg-primary-600">Créer</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
