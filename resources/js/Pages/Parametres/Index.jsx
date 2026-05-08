import { useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Separator } from '@/Components/ui/Separator';
import { motion } from 'framer-motion';
import { Select } from '@/Components/ui/Select';
import { Settings, Palette, Building2, Save, Layout } from 'lucide-react';

export default function ParametresIndex({ societe }) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        nom: societe?.nom || '',
        email: societe?.email || '',
        telephone: societe?.telephone || '',
        couleur_primaire: societe?.couleur_primaire || '#00c9ff',
        couleur_secondaire: societe?.couleur_secondaire || '#FEAC00',
        mode_sombre: societe?.mode_sombre ?? true,
        layout_mode: societe?.layout_mode || 'sidebar',
    });

    const logoForm = useForm({
        logo: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('parametres.update'));
    };

    return (
        <AppLayout title="Paramètres">
            <div className="mb-8">
                <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings className="h-6 w-6 text-primary-500" /> Paramètres
                </motion.h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Configurez votre société et personnalisez l'application</p>
            </div>

            {flash?.success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
                    {flash.success}
                </motion.div>
            )}

            <div className="max-w-2xl space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary-500" />Informations société</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="nom">Nom de la société *</Label>
                                    <Input id="nom" value={data.nom} onChange={(e) => setData('nom', e.target.value)} error={errors.nom} className="mt-1.5" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label htmlFor="telephone">Téléphone</Label>
                                        <Input id="telephone" value={data.telephone} onChange={(e) => setData('telephone', e.target.value)} error={errors.telephone} className="mt-1.5" />
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                                        <Palette className="h-4 w-4 text-secondary-500" /> Personnalisation
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="couleur_primaire">Couleur primaire</Label>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <input type="color" id="couleur_primaire" value={data.couleur_primaire} onChange={(e) => setData('couleur_primaire', e.target.value)} className="h-10 w-14 rounded-lg border border-gray-200 dark:border-dark-600 cursor-pointer" />
                                                <Input value={data.couleur_primaire} onChange={(e) => setData('couleur_primaire', e.target.value)} className="flex-1" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="couleur_secondaire">Couleur secondaire</Label>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <input type="color" id="couleur_secondaire" value={data.couleur_secondaire} onChange={(e) => setData('couleur_secondaire', e.target.value)} className="h-10 w-14 rounded-lg border border-gray-200 dark:border-dark-600 cursor-pointer" />
                                                <Input value={data.couleur_secondaire} onChange={(e) => setData('couleur_secondaire', e.target.value)} className="flex-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                                        <Layout className="h-4 w-4 text-primary-500" /> Présentation
                                    </h3>
                                    <div>
                                        <Label htmlFor="layout_mode">Mode de navigation</Label>
                                        <Select id="layout_mode" value={data.layout_mode} onChange={(e) => setData('layout_mode', e.target.value)} className="mt-1.5">
                                            <option value="sidebar">Sidebar (barre latérale)</option>
                                            <option value="topbar">Topbar (barre horizontale)</option>
                                        </Select>
                                        <p className="text-xs text-gray-400 mt-1.5">
                                            {data.layout_mode === 'sidebar' ? 'Navigation classique avec menu à gauche.' : 'Navigation compacte avec barre en haut, style tracker.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
                                    <Button type="submit" disabled={processing}><Save className="h-4 w-4 mr-2" />{processing ? 'Enregistrement...' : 'Enregistrer'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-secondary-500" />Logo de la société</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                logoForm.post(route('parametres.logo'));
                            }} className="space-y-4">
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 rounded-xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-dark-700">
                                        {societe?.logo ? (
                                            <img src={`/storage/${societe.logo}`} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Building2 className="h-8 w-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor="logo">Importer un nouveau logo</Label>
                                        <Input 
                                            id="logo" 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => logoForm.setData('logo', e.target.files[0])} 
                                            className="mt-1.5"
                                        />
                                        {logoForm.errors.logo && <p className="text-sm text-red-500 mt-1">{logoForm.errors.logo}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-dark-700">
                                    <Button type="submit" disabled={logoForm.processing || !logoForm.data.logo}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {logoForm.processing ? 'Importation...' : 'Mettre à jour le logo'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </AppLayout>
    );
}
