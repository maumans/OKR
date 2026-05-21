import { useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { NativeSelect as Select } from '@/Components/ui/Select';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function CollaborateursCreate({ departements = [] }) {
    const { auth } = usePage().props;
    const isManager = auth?.collaborateur?.isManager;
    const aAccesGlobal = auth?.collaborateur?.aAccesGlobal;

    const { data, setData, post, processing, errors } = useForm({
        nom: '',
        prenom: '',
        email: '',
        poste: '',
        role: 'collaborateur',
        departement_id: isManager ? (auth?.collaborateur?.departement_id || '') : '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('collaborateurs.store'));
    };

    return (
        <AppLayout title="Nouveau membre">
            <div className="mb-8">
                <Link
                    href={route('collaborateurs.index')}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour à l'équipe
                </Link>
                <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-bold text-gray-900 dark:text-white">
                    Ajouter un membre
                </motion.h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Créez un nouveau membre de votre équipe
                </p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary-500" />
                            Informations du membre
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="prenom">Prénom *</Label>
                                    <Input id="prenom" value={data.prenom} onChange={(e) => setData('prenom', e.target.value)}
                                        error={errors.prenom} placeholder="Ex: Sophie" className="mt-1.5" />
                                </div>
                                <div>
                                    <Label htmlFor="nom">Nom *</Label>
                                    <Input id="nom" value={data.nom} onChange={(e) => setData('nom', e.target.value)}
                                        error={errors.nom} placeholder="Ex: Martin" className="mt-1.5" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email} placeholder="sophie.martin@exemple.com" className="mt-1.5" />
                            </div>

                            <div>
                                <Label htmlFor="poste">Poste</Label>
                                <Input id="poste" value={data.poste} onChange={(e) => setData('poste', e.target.value)}
                                    error={errors.poste} placeholder="Ex: Directrice Commerciale" className="mt-1.5" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="role">Rôle *</Label>
                                    <Select id="role" value={data.role} onChange={(e) => setData('role', e.target.value)}
                                        error={errors.role} className="mt-1.5">
                                        <option value="collaborateur">Collaborateur</option>
                                        {!isManager && <option value="manager">Manager</option>}
                                        {aAccesGlobal && <option value="directeur">Directeur Général</option>}
                                        {aAccesGlobal && <option value="admin">Administrateur</option>}
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="departement_id">Département</Label>
                                    <Select id="departement_id" value={data.departement_id || ''} onChange={(e) => setData('departement_id', e.target.value || null)}
                                        error={errors.departement_id} className="mt-1.5"
                                        disabled={isManager}>
                                        <option value="">— Aucun département —</option>
                                        {departements.map(d => (
                                            <option key={d.id} value={d.id}>{d.nom}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Création...' : 'Créer le membre'}
                                </Button>
                                <Link href={route('collaborateurs.index')}>
                                    <Button variant="outline" type="button">Annuler</Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </AppLayout>
    );
}
