import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    Target,
    CheckSquare,
    TrendingUp,
    Award,
    Settings,
    Settings2,
    PenTool,
    Grid3X3,
    GraduationCap,
    Briefcase,
    Upload,
    History,
    LogOut,
    Sun,
    Moon,
    BarChart3,
    Gift,
    CalendarCheck,
    ListChecks,
    User,
} from 'lucide-react';
import { UserAvatar } from '@/Components/ui/Avatar';
import { useTheme } from '@/hooks/useTheme';

const ICON_MAP = {
    LayoutDashboard, Users, Target, CheckSquare, TrendingUp, Award,
    Settings, PenTool, Grid3X3, GraduationCap, Briefcase, Upload,
    History, BarChart3, Gift, CalendarCheck, ListChecks, User,
};

const navigation = [
    {
        name: 'ANALYTIQUE',
        items: [
            { name: 'Tableau de bord', href: 'dashboard', icon: LayoutDashboard },
            { name: 'Équipe', href: 'collaborateurs.index', icon: Users, moduleCode: 'equipe' },
        ]
    },
    {
        name: 'MANAGEMENT',
        items: [
            { name: 'Objectifs (OKR)', href: 'objectifs.index', icon: Target, moduleCode: 'okr' },
            { name: 'Objectifs individuels', href: 'individuels.index', icon: User, moduleCode: 'individuels' },
            { name: 'Tâches', href: 'taches.index', icon: CheckSquare, moduleCode: 'taches' },
            { name: 'Matrice Eisenhower', href: 'matrice.index', icon: Grid3X3, moduleCode: 'matrice' },
            { name: 'Daily (Bilan)', href: 'daily.index', icon: PenTool, moduleCode: 'daily' },
        ]
    },
    {
        name: 'BUSINESS',
        items: [
            { name: 'Missions / Projets', href: 'missions.index', icon: Briefcase, moduleCode: 'missions' },
            { name: 'Prospection', href: 'prospects.index', icon: TrendingUp, moduleCode: 'prospection' },
            { name: 'Incentives', href: 'incentives.index', icon: Award, moduleCode: 'incentives' },
        ]
    },
    {
        name: 'APPRENTISSAGE',
        items: [
            { name: 'Formations & LMS', href: 'formations.index', icon: GraduationCap, moduleCode: 'lms' },
        ]
    },
    {
        name: 'ANALYTIQUE',
        items: [
            { name: 'Synthèse mensuelle', href: 'synthese.index', icon: BarChart3, moduleCode: 'synthese' },
            { name: 'Historique synthèses', href: 'synthese.historique', icon: History, moduleCode: 'synthese' },
        ]
    },
    {
        name: 'ADMINISTRATION',
        items: [
            { name: 'Import de données', href: 'import.index', icon: Upload, moduleCode: 'import' },
            { name: 'Historique des imports', href: 'import.historique', icon: History, moduleCode: 'import' },
        ]
    },
    {
        name: 'PARAMÈTRES',
        items: [
            { name: 'Paramètres', href: 'parametres.index', icon: Settings },
        ]
    }
];

export default function Sidebar() {
    const { auth, modulesActifs = [] } = usePage().props;
    const user = auth.collaborateur || auth.user;
    const societe = auth?.societe;
    const { isDark, toggleTheme } = useTheme(societe?.mode_sombre);

    const codesActifs = new Set(modulesActifs.map(m => m.code));

    const toPath = (href) => {
        try { return new URL(route(href), window.location.origin).pathname; }
        catch { return null; }
    };

    const allPaths = navigation.flatMap(g => g.items.map(i => toPath(i.href))).filter(Boolean).sort((a, b) => b.length - a.length);

    const isActive = (href) => {
        const path = toPath(href);
        if (!path) return false;
        const currentPath = window.location.pathname;
        const currentMatch = allPaths.find(p => currentPath === p || currentPath.startsWith(p + '/'));
        return currentMatch === path;
    };

    // Filtrer les groupes selon les modules actifs — les items sans moduleCode sont toujours visibles
    const groupsVisibles = navigation.map(group => ({
        ...group,
        items: group.items.filter(item => !item.moduleCode || codesActifs.has(item.moduleCode)),
    })).filter(group => group.items.length > 0);

    // Dédupliquer les groupes qui auraient le même nom (ANALYTIQUE apparaît 2 fois)
    const groupsDedupliques = groupsVisibles.reduce((acc, group) => {
        const existing = acc.find(g => g.name === group.name);
        if (existing) {
            existing.items = [...existing.items, ...group.items];
        } else {
            acc.push({ ...group });
        }
        return acc;
    }, []);

    return (
        <aside className="w-[260px] bg-white dark:bg-dark-900 border-r border-gray-100 dark:border-dark-800 flex flex-col h-screen fixed left-0 top-0 z-40">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-5 border-b border-gray-100 dark:border-dark-800">
                <div className="flex items-center gap-2.5">
                    {societe?.logo ? (
                        <img
                            src={`/storage/${societe.logo}`}
                            alt={societe.nom}
                            className="h-8 w-8 rounded-lg object-contain border border-gray-100 dark:border-dark-700 bg-white"
                        />
                    ) : (
                        <div className="bg-primary-500 text-white p-1.5 rounded-lg">
                            <Target className="h-4 w-4" />
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-sm leading-tight text-gray-900 dark:text-white truncate max-w-[160px]">
                            {societe?.nom || 'Addvalis OKR'}
                        </h1>
                        <p className="text-[9px] tracking-widest text-gray-400 font-semibold uppercase">Performance</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {auth.collaborateur && groupsDedupliques.map((group, index) => (
                    <div key={index}>
                        <h3 className="px-3 text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                            {group.name}
                        </h3>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={route(item.href)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group text-[13px] ${
                                            active
                                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-800/50 dark:hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <item.icon className={`h-4 w-4 ${active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} strokeWidth={active ? 2.5 : 2} />
                                            <span>{item.name}</span>
                                        </div>
                                        {item.shortcut && (
                                            <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500 tracking-wider">
                                                {item.shortcut}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {auth.user?.is_superadmin && (
                    <div>
                        <h3 className="px-3 text-[10px] font-semibold text-indigo-400 mb-1.5 uppercase tracking-wider">
                            CONSOLE PLATEFORME
                        </h3>
                        <div className="space-y-0.5">
                            <Link
                                href={route('superadmin.dashboard')}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group text-[13px] ${
                                    window.location.pathname.startsWith('/superadmin')
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-800/50 dark:hover:text-white'
                                }`}
                            >
                                <Settings2 className={`h-4 w-4 ${window.location.pathname.startsWith('/superadmin') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} strokeWidth={2} />
                                <span>Console Admin</span>
                                <span className="ml-auto text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">ADMIN</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-dark-800 space-y-1">
                <button
                    onClick={toggleTheme}
                    title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
                >
                    {isDark
                        ? <Sun className="h-4 w-4 text-amber-400" />
                        : <Moon className="h-4 w-4 text-slate-500" />
                    }
                    <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
                </button>

                <div className="flex items-center gap-1">
                    <Link href={route('profile.edit')} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors flex-1 min-w-0">
                        <UserAvatar name={user.nom_complet || user.name} className="h-8 w-8 text-[10px] border border-gray-200 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {user.nom_complet || user.name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                                {auth.user.email}
                            </p>
                        </div>
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        title="Se déconnecter"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    >
                        <LogOut className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </aside>
    );
}
