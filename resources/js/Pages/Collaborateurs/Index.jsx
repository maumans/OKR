import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { UserAvatar } from '@/Components/ui/Avatar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/Components/ui/Table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';
import { motion } from 'framer-motion';
import {
    Search, Plus, MoreVertical, Users, ShieldCheck,
    UserCheck, UserX, Eye, Pencil, PowerOff, Power, Trash2, Users2
} from 'lucide-react';

const ROLE_CONFIG = {
    admin:          { label: 'Administrateur',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         dot: 'bg-red-500' },
    directeur:      { label: 'Directeur Général', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
    manager:        { label: 'Manager',           color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', dot: 'bg-violet-500' },
    drh:            { label: 'DRH',               color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',     dot: 'bg-teal-500' },
    collaborateur:  { label: 'Collaborateur',     color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',         dot: 'bg-sky-500' },
};

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
        </motion.div>
    );
}

export default function CollaborateursIndex({ collaborateurs, filters, stats, departements = [] }) {
    const { auth } = usePage().props;
    const aAccesGlobal  = auth?.collaborateur?.aAccesGlobal;
    const isManager     = auth?.collaborateur?.isManager;
    const currentDeptId = auth?.collaborateur?.departement_id;
    const currentId     = auth?.collaborateur?.id;

    // Droits d'action sur un collaborateur donné
    const canEdit   = (c) => aAccesGlobal || (isManager && c.departement_id === currentDeptId);
    const canToggle = () => aAccesGlobal;
    const canDelete = () => aAccesGlobal;

    const [search, setSearch] = useState(filters?.search || '');
    const [activeRole, setActiveRole] = useState(filters?.role || '');
    const [activeDept, setActiveDept] = useState(filters?.departement_id || '');
    const [activeActif, setActiveActif] = useState(
        filters?.actif !== undefined ? String(filters.actif) : ''
    );

    const applyFilters = (updates) => {
        const current = { search, role: activeRole, actif: activeActif, departement_id: activeDept };
        const merged = { ...current, ...updates };
        const params = {};
        if (merged.search) params.search = merged.search;
        if (merged.role) params.role = merged.role;
        if (merged.actif !== '') params.actif = merged.actif;
        if (merged.departement_id) params.departement_id = merged.departement_id;
        router.get(route('collaborateurs.index'), params, { preserveState: true, replace: true });
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        applyFilters({ search: e.target.value });
    };

    const handleRoleFilter = (role) => {
        const next = activeRole === role ? '' : role;
        setActiveRole(next);
        applyFilters({ role: next });
    };

    const handleDeptFilter = (val) => {
        const next = activeDept === val ? '' : val;
        setActiveDept(next);
        applyFilters({ departement_id: next });
    };

    const handleActifFilter = (val) => {
        const next = activeActif === val ? '' : val;
        setActiveActif(next);
        applyFilters({ actif: next });
    };

    const toggleActif = (collab) => {
        router.patch(route('collaborateurs.toggle-actif', collab.id), {}, { preserveScroll: true });
    };

    const deleteCollab = (collab) => {
        if (!confirm(`Supprimer ${collab.prenom} ${collab.nom} ? Cette action est irréversible.`)) return;
        router.delete(route('collaborateurs.destroy', collab.id));
    };

    const hasFilter = search || activeRole || activeActif !== '' || activeDept;
    const clearFilters = () => {
        setSearch(''); setActiveRole(''); setActiveActif(''); setActiveDept('');
        router.get(route('collaborateurs.index'), {}, { preserveState: false });
    };

    return (
        <AppLayout title="Équipe">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users2 className="h-5 w-5 text-primary-500" /> Équipe
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {stats.total} membre{stats.total > 1 ? 's' : ''} · {stats.actifs} actif{stats.actifs > 1 ? 's' : ''}
                    </p>
                </motion.div>
                <Link href={route('collaborateurs.create')}>
                    <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Ajouter un membre
                    </Button>
                </Link>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <StatCard icon={Users}      label="Total"             value={stats.total}          color="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"    delay={0.0} />
                <StatCard icon={UserCheck}  label="Actifs"            value={stats.actifs}         color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"   delay={0.05} />
                <StatCard icon={ShieldCheck} label="Admins"           value={stats.admins}         color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"                   delay={0.1} />
                <StatCard icon={Users}      label="Managers"          value={stats.managers || 0}  color="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"       delay={0.12} />
                <StatCard icon={Users}      label="DRH"               value={stats.drh || 0}       color="bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400"               delay={0.15} />
            </div>

            {/* ── Filters + Table ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">

                {/* Barre de filtres — 2 lignes pour éviter le chevauchement */}
                <div className="p-4 border-b border-gray-100 dark:border-dark-800 flex flex-col gap-2.5">

                    {/* Ligne 1 : Recherche + toggle Actifs / Inactifs */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 min-w-0 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, prénom, poste..."
                                value={search}
                                onChange={handleSearch}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto shrink-0">
                            <button
                                onClick={() => handleActifFilter('true')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                                    activeActif === 'true'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
                                }`}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Actifs
                            </button>
                            <button
                                onClick={() => handleActifFilter('false')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                                    activeActif === 'false'
                                        ? 'bg-gray-600 text-white'
                                        : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
                                }`}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />Inactifs
                            </button>
                            {hasFilter && (
                                <button onClick={clearFilters} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                    × Effacer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ligne 2 : Pills rôle + séparateur + filtre département */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Rôles */}
                        {[
                            { value: '', label: 'Tous' },
                            { value: 'admin', label: 'Admins' },
                            { value: 'directeur', label: 'Directeurs' },
                            { value: 'manager', label: 'Managers' },
                            { value: 'drh', label: 'DRH' },
                            { value: 'collaborateur', label: 'Membres' },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => handleRoleFilter(value === '' ? '' : value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    (value === '' && activeRole === '') || activeRole === value
                                        ? 'bg-primary-500 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700'
                                }`}
                            >
                                {label}
                            </button>
                        ))}

                        {/* Séparateur vertical */}
                        {departements.length > 0 && (
                            <span className="h-4 w-px bg-gray-200 dark:bg-dark-700 mx-1 shrink-0" />
                        )}

                        {/* Départements */}
                        {departements.length > 0 && (
                            <>
                                <span className="text-xs text-gray-400 shrink-0">Dép.</span>
                                {departements.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => handleDeptFilter(String(d.id))}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                                            activeDept === String(d.id)
                                                ? 'text-white shadow-sm'
                                                : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-300 dark:hover:border-dark-600'
                                        }`}
                                        style={activeDept === String(d.id) ? { backgroundColor: d.couleur || '#6366f1', borderColor: d.couleur || '#6366f1' } : {}}
                                    >
                                        {d.nom}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                <Table className="min-w-[640px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Membre</TableHead>
                            <TableHead className="hidden sm:table-cell">Poste</TableHead>
                            <TableHead className="hidden md:table-cell">Département</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="hidden lg:table-cell">Depuis</TableHead>
                            <TableHead className="text-right w-20">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {collaborateurs.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl mb-3">
                                            <UserX className="h-10 w-10 text-gray-300 dark:text-dark-600" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aucun membre trouvé</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {hasFilter ? 'Essayez de modifier vos filtres.' : 'Ajoutez votre premier membre.'}
                                        </p>
                                        {!hasFilter && (
                                            <Link href={route('collaborateurs.create')} className="mt-4">
                                                <Button size="sm" className="bg-primary-500 hover:bg-primary-600 text-white">
                                                    <Plus className="h-3.5 w-3.5 mr-1.5" />Ajouter un membre
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : collaborateurs.data.map((collab, i) => {
                            return (
                                <motion.tr
                                    key={collab.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50/50 dark:hover:bg-dark-800/40 transition-colors ${!collab.actif ? 'opacity-60' : ''}`}
                                >
                                    {/* Collaborateur */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <UserAvatar name={`${collab.prenom} ${collab.nom}`} className="h-9 w-9 text-xs" />
                                                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-dark-900 ${collab.actif ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-[13px] text-gray-900 dark:text-white truncate">
                                                    {collab.prenom} {collab.nom}
                                                </p>
                                                <p className="text-[11px] text-gray-400 truncate">
                                                    {collab.user?.email || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Poste */}
                                    <TableCell className="hidden sm:table-cell">
                                        <span className="text-[13px] text-gray-600 dark:text-gray-400">
                                            {collab.poste || <span className="text-gray-300 dark:text-dark-600 italic">—</span>}
                                        </span>
                                    </TableCell>

                                    {/* Département */}
                                    <TableCell className="hidden md:table-cell">
                                        {collab.departement ? (
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                                                style={{ backgroundColor: collab.departement.couleur || '#6366f1' }}
                                            >
                                                {collab.departement.nom}
                                            </span>
                                        ) : (
                                            <span className="text-[12px] text-gray-300 dark:text-dark-600 italic">—</span>
                                        )}
                                    </TableCell>

                                    {/* Rôles */}
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(collab.roles || []).map(r => {
                                                const cfg = ROLE_CONFIG[r.code] || ROLE_CONFIG.collaborateur;
                                                return (
                                                    <span key={r.code} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </TableCell>

                                    {/* Statut */}
                                    <TableCell>
                                        {collab.actif ? (
                                            <Badge variant="success" className="text-[11px]">Actif</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[11px]">Inactif</Badge>
                                        )}
                                    </TableCell>

                                    {/* Date */}
                                    <TableCell className="hidden lg:table-cell text-[12px] text-gray-400">
                                        {new Date(collab.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right">
                                        {canEdit(collab) ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm" className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('collaborateurs.show', collab.id)} className="flex items-center gap-2">
                                                            <Eye className="h-3.5 w-3.5" />Voir le profil
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('collaborateurs.edit', collab.id)} className="flex items-center gap-2">
                                                            <Pencil className="h-3.5 w-3.5" />Modifier
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {canToggle() && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => toggleActif(collab)}
                                                                className={`flex items-center gap-2 ${collab.actif ? 'text-amber-600 focus:text-amber-700' : 'text-emerald-600 focus:text-emerald-700'}`}
                                                            >
                                                                {collab.actif
                                                                    ? <><PowerOff className="h-3.5 w-3.5" />Désactiver</>
                                                                    : <><Power className="h-3.5 w-3.5" />Activer</>
                                                                }
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {canDelete() && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => deleteCollab(collab)}
                                                                className="flex items-center gap-2 text-red-600 focus:text-red-700"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />Supprimer
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Link href={route('collaborateurs.show', collab.id)}>
                                                <Button variant="ghost" size="icon-sm" className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </TableCell>
                                </motion.tr>
                            );
                        })}
                    </TableBody>
                </Table>
                </div>

                {/* Pagination */}
                {collaborateurs.last_page > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-800 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            {collaborateurs.from}–{collaborateurs.to} sur {collaborateurs.total} membres
                        </p>
                        <div className="flex gap-1">
                            {collaborateurs.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`min-w-[32px] h-8 flex items-center justify-center px-2 text-sm rounded-lg transition-colors ${
                                        link.active
                                            ? 'bg-primary-500 text-white font-medium shadow-sm'
                                            : link.url
                                                ? 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800'
                                                : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </AppLayout>
    );
}
