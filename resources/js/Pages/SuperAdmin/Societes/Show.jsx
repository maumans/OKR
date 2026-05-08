import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Building2, Settings2, Users, ArrowLeft, Mail, Calendar, LayoutTemplate, Palette, Crown, ShieldAlert } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import { UserAvatar } from '@/Components/ui/Avatar';

export default function Show({ societe, administrateurs }) {
    return (
        <AppLayout header={`SaaS : ${societe.nom}`}>
            <Head title={`SuperAdmin - ${societe.nom}`} />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full">
                        <Link href={route('superadmin.societes.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-full bg-slate-100 text-slate-600 dark:bg-dark-800 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                            Fiche Client SaaS
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {societe.nom}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20">
                        <ShieldAlert className="h-4 w-4" /> Suspendre l'accès
                    </Button>
                    <Button className="bg-slate-800 hover:bg-slate-900 text-white gap-2" asChild>
                        <Link href={route('superadmin.societes.parametres.index', societe.id)}>
                            <Settings2 className="h-4 w-4" />
                            Configurations
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Header Client Immersif */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-dark-950 dark:to-dark-900 p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Building2 className="h-48 w-48 text-white" />
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="h-24 w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-800 shrink-0 border-4 border-white/10 uppercase">
                        {societe.nom.substring(0, 2)}
                    </div>
                    <div className="text-center sm:text-left text-white mt-2">
                        <h2 className="text-3xl font-bold mb-2">{societe.nom}</h2>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-slate-300 text-sm">
                            <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-400" /> {societe.email || 'Aucun email'}</span>
                            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-400" /> Inscrit le {new Date(societe.created_at).toLocaleDateString('fr-FR')}</span>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 ml-2">Actif</Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Administrateurs */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-dark-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-amber-500" /> 
                                        Administrateurs de l'espace
                                    </CardTitle>
                                    <CardDescription>Comptes disposant des droits de configuration sur ce locataire.</CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    {administrateurs?.length || 0} Admin(s)
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {administrateurs && administrateurs.length > 0 ? (
                                <div className="space-y-4">
                                    {administrateurs.map(admin => (
                                        <div key={admin.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/50">
                                            <UserAvatar name={admin.nom} className="h-10 w-10 border-2 border-white shadow-sm" />
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {admin.nom}
                                                    {admin.actif ? (
                                                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                    ) : (
                                                        <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-500">{admin.email}</div>
                                            </div>
                                            <div className="ml-auto">
                                                <Button variant="ghost" size="sm">Contacter</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-500 italic">
                                    Aucun administrateur trouvé pour cette société.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Zone de danger contextuelle */}
                    <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <Settings2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-1">Paramétrage Technique (SuperAdmin)</h3>
                                    <p className="text-sm text-red-700/80 dark:text-red-300/80 max-w-2xl mb-4 leading-relaxed">
                                        Vous avez la main sur l'ensemble de la configuration par défaut de cette entreprise : 
                                        axes stratégiques, périodes OKR, types de résultats clés, seuils d'évaluation et système de primes.
                                        <strong> Toute modification impactera directement l'espace de travail du client.</strong>
                                    </p>
                                    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm gap-2" asChild>
                                        <Link href={route('superadmin.societes.parametres.index', societe.id)}>
                                            <Settings2 className="h-4 w-4" /> Configurer l'environnement
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Infos */}
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-dark-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" /> Usage & Licences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 text-center">
                            <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">{societe.collaborateurs_count}</div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Utilisateurs Actifs</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-dark-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Palette className="h-5 w-5 text-purple-500" /> Interface & Marque Blanche
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 text-sm">
                            <div className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-dark-800">
                                <span className="text-slate-500 flex items-center gap-2"><LayoutTemplate className="h-4 w-4" /> Layout</span>
                                <span className="font-semibold capitalize text-slate-900 dark:text-white">{societe.layout_mode || 'Sidebar'}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-dark-800">
                                <span className="text-slate-500">Mode Sombre par défaut</span>
                                <Badge variant={societe.mode_sombre ? 'default' : 'outline'}>{societe.mode_sombre ? 'Activé' : 'Désactivé'}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
