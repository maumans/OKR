import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import { Progress } from '@/Components/ui/Progress';
import { UserAvatar } from '@/Components/ui/Avatar';
import { Button } from '@/Components/ui/Button';
import StatsCard from '@/Components/StatsCard';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Briefcase, Target, CheckSquare, Pencil } from 'lucide-react';

const roleColors = { admin: 'destructive', manager: 'warning', collaborateur: 'default' };
const roleLabels = { admin: 'Administrateur', manager: 'Manager', collaborateur: 'Collaborateur' };

export default function CollaborateursShow({ collaborateur, stats }) {
    return (
        <AppLayout title={`${collaborateur.prenom} ${collaborateur.nom}`}>
            <div className="mb-8">
                <Link href={route('collaborateurs.index')} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Retour
                </Link>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="mb-6 overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-500">
                        <div className="absolute right-4 top-4">
                            <Link href={route('collaborateurs.edit', collaborateur.id)}>
                                <Button variant="glass" size="sm"><Pencil className="h-3.5 w-3.5 mr-1.5" />Modifier</Button>
                            </Link>
                        </div>
                    </div>
                    <CardContent className="relative px-6 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
                            <UserAvatar name={`${collaborateur.prenom} ${collaborateur.nom}`} size="xl" className="ring-4 ring-white dark:ring-dark-800" />
                            <div className="flex-1 sm:mb-1">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{collaborateur.prenom} {collaborateur.nom}</h1>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <Badge variant={roleColors[collaborateur.role]}>{roleLabels[collaborateur.role]}</Badge>
                                    {collaborateur.poste && <span className="flex items-center gap-1 text-sm text-gray-500"><Briefcase className="h-3.5 w-3.5" />{collaborateur.poste}</span>}
                                    {collaborateur.user?.email && <span className="flex items-center gap-1 text-sm text-gray-500"><Mail className="h-3.5 w-3.5" />{collaborateur.user.email}</span>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatsCard title="Objectifs actifs" value={stats?.objectifs_actifs ?? 0} icon={Target} variant="default" delay={0} />
                <StatsCard title="Obj. terminés" value={stats?.objectifs_termines ?? 0} icon={Target} variant="success" delay={1} />
                <StatsCard title="Tâches en cours" value={stats?.taches_en_cours ?? 0} icon={CheckSquare} variant="warning" delay={2} />
                <StatsCard title="Tâches terminées" value={stats?.taches_terminees ?? 0} icon={CheckSquare} variant="success" delay={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary-500" />Objectifs</CardTitle></CardHeader>
                    <CardContent>
                        {collaborateur.objectifs?.length > 0 ? collaborateur.objectifs.map((obj) => (
                            <div key={obj.id} className="p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50 mb-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{obj.titre}</p>
                                <Progress value={obj.resultats_cles?.length > 0 ? obj.resultats_cles.reduce((s, r) => s + Number(r.progression), 0) / obj.resultats_cles.length : 0} variant="gradient" className="mt-2" />
                            </div>
                        )) : <p className="text-center text-gray-400 py-6 text-sm">Aucun objectif</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-emerald-500" />Tâches</CardTitle></CardHeader>
                    <CardContent>
                        {collaborateur.taches?.length > 0 ? collaborateur.taches.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50 mb-2">
                                <p className="text-sm font-medium truncate">{t.titre}</p>
                                <Badge variant={t.statut === 'termine' ? 'success' : t.statut === 'bloque' ? 'destructive' : 'default'}>{t.statut.replace('_', ' ')}</Badge>
                            </div>
                        )) : <p className="text-center text-gray-400 py-6 text-sm">Aucune tâche</p>}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
