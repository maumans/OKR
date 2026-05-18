import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Card, CardContent } from '@/Components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/Components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import EmptyState from '@/Components/EmptyState';
import { FileSpreadsheet, Trash2, ArrowLeft, AlertTriangle, Upload } from 'lucide-react';

const STATUT_BADGE = {
    brouillon: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    importe: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    annule: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const STATUT_LABEL = {
    brouillon: 'Brouillon',
    importe: 'Importé',
    annule: 'Annulé',
};

export default function Historique({ imports }) {
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);

        router.delete(route('import.destroy', deleteTarget.id), {
            preserveState: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleteLoading(false);
            },
            onError: () => {
                setDeleteLoading(false);
            },
        });
    };

    return (
        <AppLayout title="Historique des imports">
            <div className="py-2">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Historique des imports
                        </h2>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Liste de tous les imports réalisés pour cette société.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('import.index')}>
                            <Button className="bg-primary-500 hover:bg-primary-600 text-white text-[13px]">
                                <Upload className="h-4 w-4 mr-1.5" />
                                Nouvel import
                            </Button>
                        </Link>
                    </div>
                </div>

                {imports.length === 0 ? (
                    <EmptyState
                        icon={FileSpreadsheet}
                        title="Aucun import réalisé"
                        description="Importez votre premier fichier de plan d'action pour commencer."
                        action={
                            <Link href={route('import.index')}>
                                <Button className="bg-primary-500 hover:bg-primary-600 text-white text-[13px]">
                                    <Upload className="h-4 w-4 mr-1.5" />
                                    Importer un fichier
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <Card className="rounded-xl border-gray-200 dark:border-dark-700 shadow-sm">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-[10px] uppercase tracking-wider">Fichier</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider">Statut</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider">Objectifs</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider">KRs</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider">Tâches</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider">Collabs.</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider">Utilisateur</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider">Date</TableHead>
                                        <TableHead className="text-[10px] uppercase tracking-wider text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {imports.map((imp) => (
                                        <TableRow key={imp.id}>
                                            <TableCell className="text-[13px] font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                                                    {imp.fichier_nom}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`text-[10px] px-1.5 py-0 ${STATUT_BADGE[imp.statut] || ''}`}>
                                                    {STATUT_LABEL[imp.statut] || imp.statut}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[13px] text-center">{imp.nb_objectifs_crees}</TableCell>
                                            <TableCell className="text-[13px] text-center">{imp.nb_kr_crees}</TableCell>
                                            <TableCell className="text-[13px] text-center">{imp.nb_taches_crees}</TableCell>
                                            <TableCell className="text-[13px] text-center">{imp.nb_collaborateurs_crees}</TableCell>
                                            <TableCell className="text-[13px] text-gray-500">{imp.user_nom}</TableCell>
                                            <TableCell className="text-[13px] text-gray-500">{imp.created_at}</TableCell>
                                            <TableCell className="text-right">
                                                {imp.statut === 'importe' && (
                                                    <button
                                                        onClick={() => setDeleteTarget(imp)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Annuler cet import"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Modal de confirmation rollback */}
                <Dialog open={!!deleteTarget} onOpenChange={() => !deleteLoading && setDeleteTarget(null)}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-[15px]">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Annuler l'import
                            </DialogTitle>
                        </DialogHeader>
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 py-3">
                            Cette action supprimera toutes les données créées par cet import
                            ({deleteTarget?.nb_objectifs_crees} objectifs, {deleteTarget?.nb_kr_crees} KRs,{' '}
                            {deleteTarget?.nb_taches_crees} tâches, {deleteTarget?.nb_collaborateurs_crees} collaborateurs).
                            <br /><br />
                            <strong className="text-red-600">Cette action est irréversible.</strong>
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="text-[13px]">
                                Annuler
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="bg-red-500 hover:bg-red-600 text-white text-[13px]"
                            >
                                {deleteLoading ? 'Suppression...' : 'Confirmer la suppression'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
