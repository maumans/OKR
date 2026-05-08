import { useState, useMemo } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Building2, Plus, ArrowRight, Settings2, Users, Search, Activity, CalendarDays, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/Components/ui/Dialog';
import { Input } from '@/Components/ui/Input';
import { Badge } from '@/Components/ui/Badge';
import { Card, CardContent } from '@/Components/ui/Card';
import EmptyState from '@/Components/EmptyState';

export default function Index({ societes }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        nom: '',
        email: '',
        admin_nom: '',
        admin_email: '',
    });
    const [errors, setErrors] = useState({});

    // Calcul des KPI
    const totalUsers = societes.reduce((acc, s) => acc + (s.collaborateurs_count || 0), 0);
    const recentSocietes = societes.filter(s => new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

    // Filtrage
    const filteredSocietes = useMemo(() => {
        return societes.filter(s => 
            s.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [societes, searchQuery]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        router.post(route('superadmin.societes.store'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setFormData({ nom: '', email: '', admin_nom: '', admin_email: '' });
                setErrors({});
            },
            onError: (errs) => {
                setErrors(errs);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout header="SaaS Dashboard">
            <Head title="SuperAdmin - Dashboard SaaS" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold uppercase tracking-wider">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Zone d'Administration Globale
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        SuperAdmin Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Vue d'ensemble et gestion des locataires (tenants) de la plateforme SaaS Addvalis.
                    </p>
                </div>
                
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Société
                </Button>
            </div>

            {/* KPIs Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-white dark:bg-dark-900 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Sociétés</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{societes.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-dark-900 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Utilisateurs SaaS</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalUsers}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-dark-900 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                            <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Croissance (30j)</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">+{recentSocietes} <span className="text-sm font-normal text-slate-500">sociétés</span></h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des Sociétés */}
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-950/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Annuaire des clients</h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Rechercher une société..." 
                            className="pl-9 bg-white dark:bg-dark-950"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {societes.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="Aucune société"
                            description="Créez le premier locataire du SaaS pour démarrer."
                            actionLabel="Nouvelle Société"
                            onAction={() => setIsCreateModalOpen(true)}
                        />
                    ) : filteredSocietes.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            Aucune société ne correspond à votre recherche "{searchQuery}"
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-dark-900">
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                                    <TableHead className="text-center">Taille</TableHead>
                                    <TableHead className="hidden lg:table-cell">Inscription</TableHead>
                                    <TableHead className="text-right">Administration</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSocietes.map((societe) => (
                                    <TableRow key={societe.id} className="hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors group">
                                        <TableCell>
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-sm font-bold shadow-sm uppercase">
                                                {societe.nom.substring(0, 2)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-slate-900 dark:text-white">{societe.nom}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 lg:hidden mt-0.5">{societe.email || 'Aucun email'}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-300">
                                            {societe.email || <span className="text-slate-400 italic">Non renseigné</span>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-dark-800 dark:text-slate-300">
                                                <Users className="h-3.5 w-3.5 mr-1.5" />
                                                {societe.collaborateurs_count} <span className="hidden sm:inline ml-1 text-slate-400">licences</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-slate-500 text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                                {new Date(societe.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric', day: 'numeric' })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" asChild className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                                                    <Link href={route('superadmin.societes.show', societe.id)}>
                                                        Détails <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-8 bg-white dark:bg-dark-900" asChild>
                                                    <Link href={route('superadmin.societes.parametres.index', societe.id)}>
                                                        <Settings2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                                        Config.
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Modal Création Société */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Building2 className="h-5 w-5 text-red-500" />
                            Provisionner un nouveau client
                        </DialogTitle>
                        <DialogDescription>
                            Cette action créera un environnement de travail isolé pour la nouvelle entreprise et enverra une invitation à son administrateur principal.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                        <div className="space-y-4 bg-slate-50 dark:bg-dark-900 p-4 rounded-lg border border-slate-200 dark:border-dark-800">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-dark-800 text-[10px]">1</span> 
                                L'entreprise
                            </h3>
                            
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Nom de la société <span className="text-red-500">*</span></label>
                                    <Input 
                                        value={formData.nom}
                                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                                        placeholder="Ex: Acme Corp"
                                        required
                                        error={errors.nom}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Email générique de contact <span className="text-red-500">*</span></label>
                                    <Input 
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        placeholder="contact@acme.com"
                                        required
                                        error={errors.email}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-slate-50 dark:bg-dark-900 p-4 rounded-lg border border-slate-200 dark:border-dark-800">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-dark-800 text-[10px]">2</span> 
                                Compte Administrateur Client
                            </h3>
                            
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Nom complet <span className="text-red-500">*</span></label>
                                    <Input 
                                        value={formData.admin_nom}
                                        onChange={(e) => setFormData({...formData, admin_nom: e.target.value})}
                                        placeholder="Jean Dupont"
                                        required
                                        error={errors.admin_nom}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Email de connexion <span className="text-red-500">*</span></label>
                                    <Input 
                                        type="email"
                                        value={formData.admin_email}
                                        onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                                        placeholder="jean.dupont@acme.com"
                                        required
                                        error={errors.admin_email}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                                {isSubmitting ? (
                                    <>Provisionnement...</>
                                ) : (
                                    <>Créer et Inviter <ArrowRight className="h-4 w-4" /></>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
