import { useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { NativeSelect as Select } from '@/Components/ui/Select';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';

const ROLES_DISPONIBLES = [
    { value: 'collaborateur', label: 'Collaborateur',     color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',           dot: 'bg-sky-500' },
    { value: 'manager',       label: 'Manager',           color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', dot: 'bg-violet-500' },
    { value: 'directeur',     label: 'Directeur Général', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',     dot: 'bg-amber-500' },
    { value: 'admin',         label: 'Administrateur',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',             dot: 'bg-red-500' },
];

export default function CollaborateursEdit({ collaborateur, departements = [] }) {
    const { auth } = usePage().props;
    const isManager = auth?.collaborateur?.isManager;
    const aAccesGlobal = auth?.collaborateur?.aAccesGlobal;

    const initialRoles = collaborateur.roles?.map(r => r.code) || ['collaborateur'];

    const { data, setData, put, processing, errors } = useForm({
        nom: collaborateur.nom,
        prenom: collaborateur.prenom,
        email: collaborateur.user?.email || '',
        poste: collaborateur.poste || '',
        roles: initialRoles,
        departement_id: collaborateur.departement_id || '',
        actif: collaborateur.actif,
    });

    const toggleRole = (code) => {
        if (isManager) return;
        const current = data.roles || [];
        if (current.includes(code)) {
            if (current.length === 1) return;
            setData('roles', current.filter(r => r !== code));
        } else {
            setData('roles', [...current, code]);
        }
    };

    const rolesDisponibles = () => {
        if (isManager) return ROLES_DISPONIBLES.filter(r => r.value === 'collaborateur');
        if (!aAccesGlobal) return ROLES_DISPONIBLES.filter(r => r.value !== 'admin' && r.value !== 'directeur');
        return ROLES_DISPONIBLES;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('collaborateurs.update', collaborateur.id));
    };

    return (
        <AppLayout title="Modifier le membre">
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

                            {/* Rôles — checkboxes multi-sélection */}
                            <div>
                                <Label>Rôle(s) *</Label>
                                <p className="text-[11px] text-gray-400 mt-0.5 mb-2">Un collaborateur peut avoir plusieurs rôles simultanément.</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {rolesDisponibles().map(role => {
                                        const selected = (data.roles || []).includes(role.value);
                                        return (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => toggleRole(role.value)}
                                                disabled={isManager}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                                                    isManager ? 'opacity-50 cursor-not-allowed' : ''
                                                } ${
                                                    selected
                                                        ? `${role.color} border-current shadow-sm`
                                                        : 'bg-gray-50 dark:bg-dark-800 text-gray-400 border-gray-200 dark:border-dark-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className={`h-2 w-2 rounded-full ${selected ? role.dot : 'bg-gray-300'}`} />
                                                {role.label}
                                                {selected && <span className="ml-0.5">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.roles && <p className="text-xs text-red-500 mt-1">{errors.roles}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="actif">Statut</Label>
                                    <Select id="actif" value={data.actif ? '1' : '0'} onChange={(e) => setData('actif', e.target.value === '1')} className="mt-1.5">
                                        <option value="1">Actif</option>
                                        <option value="0">Inactif</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="departement_id">Département</Label>
                                    <Select id="departement_id" value={data.departement_id || ''} onChange={(e) => setData('departement_id', e.target.value || null)}
                                        error={errors.departement_id} className="mt-1.5" disabled={isManager}>
                                        <option value="">— Aucun département —</option>
                                        {departements.map(d => (
                                            <option key={d.id} value={d.id}>{d.nom}</option>
                                        ))}
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
