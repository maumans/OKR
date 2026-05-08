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
    Bell,
    Grid3X3,
    GraduationCap
} from 'lucide-react';
import { UserAvatar } from '@/Components/ui/Avatar';

const navigation = [
    {
        name: 'ANALYTIQUE',
        items: [
            { name: 'Tableau de bord', href: 'dashboard', icon: LayoutDashboard },
            { name: 'Collaborateurs', href: 'collaborateurs.index', icon: Users },
        ]
    },
    {
        name: 'MANAGEMENT',
        items: [
            { name: 'Objectifs (OKR)', href: 'objectifs.index', icon: Target },
            { name: 'Individuels', href: 'individuels.index', icon: Users },
            { name: 'Tâches', href: 'taches.index', icon: CheckSquare },
            { name: 'Matrice Eisenhower', href: 'matrice.index', icon: Grid3X3 },
            { name: 'Daily (Bilan)', href: 'daily.index', icon: PenTool },
        ]
    },
    {
        name: 'BUSINESS',
        items: [
            { name: 'Prospection', href: 'prospects.index', icon: TrendingUp },
            { name: 'Incentives', href: 'incentives.index', icon: Award },
        ]
    },
    {
        name: 'APPRENTISSAGE',
        items: [
            { name: 'Formations & LMS', href: 'formations.index', icon: GraduationCap },
        ]
    },
    {
        name: 'PARAMÈTRES',
        items: [
            { name: 'Paramètres OKR', href: 'parametres.okr.index', icon: Settings2 },
            { name: 'Société', href: 'parametres.index', icon: Settings },
        ]
    }
];

export default function Sidebar() {
    const { url } = usePage();
    const { auth } = usePage().props;
    const user = auth.collaborateur || auth.user;

    const allPaths = navigation.flatMap(g => g.items.map(i => new URL(route(i.href)).pathname)).sort((a, b) => b.length - a.length);

    const isActive = (href) => {
        const path = new URL(route(href)).pathname;
        const currentMatch = allPaths.find(p => url === p || url.startsWith(p + '/'));
        return currentMatch === path;
    };

    return (
        <aside className="w-[260px] bg-white dark:bg-dark-900 border-r border-gray-100 dark:border-dark-800 flex flex-col h-screen fixed left-0 top-0 z-40">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-5 border-b border-gray-100 dark:border-dark-800">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary-500 text-white p-1.5 rounded-lg">
                        <Target className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm leading-tight text-gray-900 dark:text-white">Addvalis SaaS</h1>
                        <p className="text-[9px] tracking-widest text-gray-400 font-semibold uppercase">Performance</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {auth.collaborateur && navigation.map((group, index) => (
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
                        <h3 className="px-3 text-[10px] font-semibold text-red-400 mb-1.5 uppercase tracking-wider">
                            SUPER ADMIN
                        </h3>
                        <div className="space-y-0.5">
                            <Link
                                href={route('superadmin.societes.index')}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group text-[13px] ${
                                    isActive('superadmin.societes.index') 
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-800/50 dark:hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Settings2 className={`h-4 w-4 ${isActive('superadmin.societes.index') ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} strokeWidth={isActive('superadmin.societes.index') ? 2.5 : 2} />
                                    <span>Administration SaaS</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-dark-800">
                <Link href={route('profile.edit')} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                    <UserAvatar name={user.nom_complet || user.name} className="h-8 w-8 text-[10px] border border-gray-200" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {user.nom_complet || user.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                            {auth.user.email}
                        </p>
                    </div>
                </Link>
            </div>
        </aside>
    );
}
