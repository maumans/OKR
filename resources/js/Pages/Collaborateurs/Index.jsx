import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/Components/ui/Table';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { UserAvatar } from '@/Components/ui/Avatar';
import { Search, Settings, Plus, Edit2, MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';

export default function CollaborateursIndex({ collaborateurs, filters }) {
    const [search, setSearch] = useState(filters?.search || '');

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route('collaborateurs.index'), { search: e.target.value }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Collaborateurs">
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-slate-200 dark:border-dark-800 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-dark-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Liste des collaborateurs</h3>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Rechercher"
                                value={search}
                                onChange={handleSearch}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />
                        </div>
                        
                        <Button variant="outline" size="icon" className="shrink-0">
                            <Settings className="h-4 w-4 text-slate-600" />
                        </Button>
                        
                        <Link href={route('collaborateurs.create')}>
                            <Button className="shrink-0 bg-primary-500 hover:bg-primary-600 text-white">
                                <Plus className="h-4 w-4 mr-2" /> Ajouter
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Table */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Nom ↓</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Dernière mise à jour</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {collaborateurs.data.map((collab) => (
                            <TableRow key={collab.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={`${collab.prenom} ${collab.nom}`} />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {collab.prenom} {collab.nom}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {collab.user?.email || 'email@example.com'}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="capitalize text-slate-600">{collab.role}</TableCell>
                                <TableCell>
                                    {collab.actif ? (
                                        <Badge variant="success" className="font-medium">Actif</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="font-medium">Inactif</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-slate-500">
                                    {new Date(collab.updated_at).toLocaleDateString('fr-FR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={route('collaborateurs.edit', collab.id)}>
                                            <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-slate-600">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-slate-600">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={route('collaborateurs.show', collab.id)}>Voir profil</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">
                                                    Désactiver
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {collaborateurs.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    Aucun collaborateur trouvé.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination (if exists) */}
                {collaborateurs.links && collaborateurs.last_page > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-dark-800 flex justify-end">
                        <div className="flex gap-1">
                            {collaborateurs.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                        link.active 
                                        ? 'bg-primary-500 text-white' 
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-800'
                                    } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
