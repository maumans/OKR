import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/Dialog';
import { BookOpen, Plus, GraduationCap, Search, Trash2, Pencil, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LmsIndex({ formations }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingFormation, setEditingFormation] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        titre: '',
        description: '',
    });

    const filteredFormations = formations.filter(f =>
        f.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const openCreateModal = () => {
        setEditingFormation(null);
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (formation) => {
        setEditingFormation(formation);
        setData({
            titre: formation.titre,
            description: formation.description || '',
        });
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setTimeout(() => {
            reset();
            setEditingFormation(null);
        }, 200);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editingFormation) {
            put(route('formations.update', editingFormation.id), {
                onSuccess: () => closeCreateModal(),
                preserveScroll: true,
            });
        } else {
            post(route('formations.store'), {
                onSuccess: () => closeCreateModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ? Tous les modules associés seront supprimés.')) {
            router.delete(route('formations.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout header="Base de connaissances & Formations">
            <Head title="Formations" />

            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary-500" />
                        Catalogue de formations
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Gérez et consultez la base de connaissances de votre entreprise.
                    </p>
                </motion.div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher une formation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={openCreateModal} className="gap-2 shrink-0">
                        <Plus className="h-4 w-4" /> Nouvelle formation
                    </Button>
                </div>
            </div>

            {filteredFormations.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-900/50"
                >
                    <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                        <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {searchQuery ? "Aucune formation trouvée" : "Aucune formation"}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                        {searchQuery 
                            ? "Essayez de modifier vos termes de recherche." 
                            : "Commencez par créer votre première formation pour construire votre base de connaissances."}
                    </p>
                    {!searchQuery && (
                        <Button onClick={openCreateModal} className="gap-2">
                            <Plus className="h-4 w-4" /> Créer une formation
                        </Button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFormations.map((formation, index) => (
                        <motion.div 
                            key={formation.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="h-full flex flex-col group hover:shadow-md transition-shadow">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                            <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                onClick={(e) => { e.preventDefault(); openEditModal(formation); }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-400 hover:text-red-600"
                                                onClick={(e) => { e.preventDefault(); handleDelete(formation.id); }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="mt-4 text-xl line-clamp-1" title={formation.titre}>
                                        {formation.titre}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-2 h-10">
                                        {formation.description || <span className="italic text-slate-400">Aucune description</span>}
                                    </CardDescription>
                                </CardHeader>
                                
                                <CardContent className="pb-4 mt-auto">
                                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-3.5 w-3.5" />
                                            {formation.modules_count} module{formation.modules_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            Créée le {new Date(formation.created_at).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                </CardContent>
                                
                                <CardFooter className="pt-0">
                                    <Button asChild className="w-full" variant="outline">
                                        <Link href={route('formations.show', formation.id)}>
                                            Gérer les modules
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal Création / Édition */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingFormation ? 'Modifier la formation' : 'Nouvelle formation'}</DialogTitle>
                        <DialogDescription>
                            {editingFormation 
                                ? 'Modifiez les informations de base de cette formation.' 
                                : 'Créez un nouveau conteneur pour organiser vos modules d\'apprentissage.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="titre">Titre de la formation <span className="text-red-500">*</span></Label>
                            <Input
                                id="titre"
                                value={data.titre}
                                onChange={(e) => setData('titre', e.target.value)}
                                className="mt-1.5"
                                placeholder="Ex: Onboarding Nouveaux Arrivants"
                                autoFocus
                                error={errors.titre}
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="description">Description courte</Label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5 dark:border-dark-700 dark:bg-dark-900/50 dark:ring-offset-dark-950 dark:placeholder:text-slate-400"
                                placeholder="Décrivez brièvement le contenu et l'objectif de cette formation..."
                            />
                            {errors.description && <p className="text-sm font-medium text-red-500 mt-1">{errors.description}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-800">
                            <Button type="button" variant="outline" onClick={closeCreateModal}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingFormation ? 'Enregistrer' : 'Créer la formation'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}
