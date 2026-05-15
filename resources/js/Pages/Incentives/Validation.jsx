import { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/Table';
import { ArrowLeft, Calculator, CheckCircle2 } from 'lucide-react';
import { NumberInput } from '@/Components/ui/NumberInput';
import { formatCurrency } from '@/lib/utils';

export default function IncentivesValidation({ objectifs }) {
    const devise = usePage().props.auth?.societe?.devise;
    const { data, setData, post, processing, reset } = useForm({
        taux_atteinte: '',
    });

    const [selectedObj, setSelectedObj] = useState(null);

    const handleValidate = (obj) => {
        setSelectedObj(obj.id);
        setData('taux_atteinte', '');
    };

    const submitValidation = (e, objId) => {
        e.preventDefault();
        post(route('incentives.validate', objId), {
            onSuccess: () => {
                setSelectedObj(null);
                reset();
            }
        });
    };

    return (
        <AppLayout title="Validation des Primes">
            <div className="mb-6">
                <Link href={route('incentives.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Retour aux Incentives
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-primary-500" /> Espace Validation
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Évaluez l'atteinte des objectifs pour débloquer les primes.
                </p>
            </div>

            <Card className="bg-white dark:bg-dark-900">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Collaborateur</TableHead>
                                <TableHead>Objectif</TableHead>
                                <TableHead className="text-right">Prime Cible</TableHead>
                                <TableHead>Taux Actuel</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {objectifs.map((obj) => (
                                <TableRow key={obj.id}>
                                    <TableCell className="font-medium">{obj.collaborateur}</TableCell>
                                    <TableCell>{obj.titre}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(obj.prime_cible, devise)}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${obj.taux_actuel >= 100 ? 'text-emerald-500' : 'text-slate-600'}`}>
                                            {Number(obj.taux_actuel).toFixed(0)}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {selectedObj === obj.id ? (
                                            <form onSubmit={(e) => submitValidation(e, obj.id)} className="flex items-center justify-end gap-2">
                                                <NumberInput
                                                    value={data.taux_atteinte}
                                                    onChange={v => setData('taux_atteinte', v)}
                                                    className="w-24 h-8 text-sm"
                                                    suffix="%"
                                                    decimals={1}
                                                    placeholder="0"
                                                />
                                                <Button type="submit" size="sm" className="h-8 bg-emerald-500 hover:bg-emerald-600" disabled={processing}>
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setSelectedObj(null)}>
                                                    Annuler
                                                </Button>
                                            </form>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => handleValidate(obj)}>
                                                Évaluer
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {objectifs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        Aucun objectif à valider.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
