import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/Dialog';
import { BookOpen, Plus, GraduationCap, ArrowLeft, Trash2, Pencil, Play, AlignLeft, FileText, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LmsShow({ formation }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        titre: '',
        contenu: '',
    });

    const openCreateModal = () => {
        setEditingModule(null);
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (module) => {
        setEditingModule(module);
        setData({
            titre: module.titre,
            contenu: module.contenu || '',
        });
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setTimeout(() => {
            reset();
            setEditingModule(null);
        }, 200);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editingModule) {
            put(route('formations.modules.update', [formation.id, editingModule.id]), {
                onSuccess: () => closeCreateModal(),
                preserveScroll: true,
            });
        } else {
            post(route('formations.modules.store', formation.id), {
                onSuccess: () => closeCreateModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = (moduleId) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
            router.delete(route('formations.modules.destroy', [formation.id, moduleId]), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout header={`Formation : ${formation.titre}`}>
            <Head title={formation.titre} />

            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-4">
                    <Button variant="outline" size="icon" asChild className="shrink-0 mt-1">
                        <Link href={route('formations.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary-500" />
                            {formation.titre}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                            {formation.description || 'Aucune description fournie.'}
                        </p>
                    </div>
                </motion.div>

                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                    {formation.modules.length > 0 && (
                        <Button asChild variant="default" className="gap-2">
                            <Link href={route('formations.modules.show', [formation.id, formation.modules[0].id])}>
                                <Play className="h-4 w-4" /> Commencer
                            </Link>
                        </Button>
                    )}
                    <Button onClick={openCreateModal} variant="outline" className="gap-2 border-primary-200 text-primary-700 hover:bg-primary-50 dark:border-primary-900/50 dark:text-primary-400 dark:hover:bg-primary-900/20">
                        <Plus className="h-4 w-4" /> Ajouter un module
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <AlignLeft className="h-5 w-5 text-slate-500" /> Sommaire des modules
                            </CardTitle>
                            <span className="text-sm text-slate-500 font-medium bg-slate-100 dark:bg-dark-800 px-2 py-1 rounded-md">
                                {formation.modules.length} module{formation.modules.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    </CardHeader>
                    
                    <CardContent>
                        {formation.modules.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-dark-700 rounded-xl">
                                <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                                <h3 className="text-slate-900 dark:text-white font-medium">Cette formation est vide</h3>
                                <p className="text-slate-500 text-sm mt-1 mb-4">Ajoutez votre premier module pour commencer à structurer le contenu.</p>
                                <Button onClick={openCreateModal} variant="outline" size="sm">Créer le premier module</Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formation.modules.map((module, index) => (
                                    <motion.div 
                                        key={module.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-950 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="cursor-move text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors px-1">
                                                <GripVertical className="h-4 w-4" />
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                                                {index + 1}
                                            </div>
                                            <Link href={route('formations.modules.show', [formation.id, module.id])} className="font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                                {module.titre}
                                            </Link>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-slate-500"
                                                onClick={() => openEditModal(module)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                                                onClick={() => handleDelete(module.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal Création / Édition Module */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingModule ? 'Modifier le module' : 'Nouveau module'}</DialogTitle>
                        <DialogDescription>
                            Créez le contenu de votre module. Vous pouvez utiliser du texte simple pour commencer.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 flex-1 overflow-hidden">
                        <div>
                            <Label htmlFor="titre">Titre du module <span className="text-red-500">*</span></Label>
                            <Input
                                id="titre"
                                value={data.titre}
                                onChange={(e) => setData('titre', e.target.value)}
                                className="mt-1.5"
                                placeholder="Ex: Introduction à l'outil"
                                autoFocus
                                error={errors.titre}
                            />
                        </div>
                        
                        <div className="flex-1 min-h-[300px] flex flex-col">
                            <Label htmlFor="contenu" className="mb-1.5">Contenu du module</Label>
                            <textarea
                                id="contenu"
                                value={data.contenu}
                                onChange={(e) => setData('contenu', e.target.value)}
                                className="flex-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 mt-1.5 dark:border-dark-700 dark:bg-dark-900/50 dark:ring-offset-dark-950 dark:placeholder:text-slate-400 font-mono"
                                placeholder="Rédigez le contenu ici... (Markdown ou texte simple)"
                            />
                            <p className="text-xs text-slate-500 mt-2 text-right">
                                L'éditeur de texte enrichi sera intégré ultérieurement.
                            </p>
                            {errors.contenu && <p className="text-sm font-medium text-red-500 mt-1">{errors.contenu}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-800 mt-auto">
                            <Button type="button" variant="outline" onClick={closeCreateModal}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingModule ? 'Enregistrer' : 'Ajouter le module'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}
