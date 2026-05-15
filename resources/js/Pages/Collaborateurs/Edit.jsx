import { useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { NativeSelect as Select } from '@/Components/ui/Select';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';

export default function CollaborateursEdit({ collaborateur }) {
    const { data, setData, put, processing, errors } = useForm({
        nom: collaborateur.nom,
        prenom: collaborateur.prenom,
        email: collaborateur.user?.email || '',
        poste: collaborateur.poste || '',
        role: collaborateur.role,
        actif: collaborateur.actif,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('collaborateurs.update', collaborateur.id));
    };

    return (
        <AppLayout title="Modifier collaborateur">
            <div className="mb-8">
                <Link href={route('collaborateurs.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Retour
                </Link>
                <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-gray-900 dark:text-white">
                    Modifier {collaborateur.prenom} {collaborateur.nom}
                </motion.h1>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-2xl">
                <Card>
                    <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="prenom">Prénom *</Label>
                                    <Input id="prenom" value={data.prenom} onChange={(e) => setData('prenom', e.target.value)} error={errors.prenom} className="mt-1.5" />
                                </div>
                                <div>
                                    <Label htmlFor="nom">Nom *</Label>
                                    <Input id="nom" value={data.nom} onChange={(e) => setData('nom', e.target.value)} error={errors.nom} className="mt-1.5" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} className="mt-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="poste">Poste</Label>
                                <Input id="poste" value={data.poste} onChange={(e) => setData('poste', e.target.value)} error={errors.poste} className="mt-1.5" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="role">Rôle *</Label>
                                    <Select id="role" value={data.role} onChange={(e) => setData('role', e.target.value)} className="mt-1.5">
                                        <option value="collaborateur">Collaborateur</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Administrateur</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="actif">Statut</Label>
                                    <Select id="actif" value={data.actif ? '1' : '0'} onChange={(e) => setData('actif', e.target.value === '1')} className="mt-1.5">
                                        <option value="1">Actif</option>
                                        <option value="0">Inactif</option>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
                                <Button type="submit" disabled={processing}><Save className="h-4 w-4 mr-2" />{processing ? 'Enregistrement...' : 'Enregistrer'}</Button>
                                <Link href={route('collaborateurs.index')}><Button variant="outline" type="button">Annuler</Button></Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </AppLayout>
    );
}
