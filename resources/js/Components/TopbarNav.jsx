import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Users, Target, CheckSquare, TrendingUp,
    Award, Settings, Settings2, PenTool, GraduationCap, BarChart3,
    LogOut, User, Briefcase, Grid3X3, Gift, Maximize2, Share2,
} from 'lucide-react';
import { UserAvatar } from '@/Components/ui/Avatar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';

const navItems = [
    { name: 'OKR', href: 'objectifs.index', color: 'bg-blue-500', textColor: 'text-blue-500' },
    { name: 'Individuels', href: 'individuels.index', color: 'bg-rose-500', textColor: 'text-rose-500' },
    { name: 'Daily', href: 'daily.index', color: 'bg-violet-500', textColor: 'text-violet-500' },
    { name: 'Prospection', href: 'prospects.index', color: 'bg-green-500', textColor: 'text-green-500' },
    { name: 'LMS', href: 'formations.index', color: 'bg-orange-500', textColor: 'text-orange-500' },
    { name: 'Missions', href: 'taches.index', color: 'bg-sky-500', textColor: 'text-sky-500' },
    { name: 'Incentives', href: 'incentives.index', color: 'bg-pink-500', textColor: 'text-pink-500' },
    { name: 'Synthèse', href: 'syntheses.index', color: 'bg-indigo-500', textColor: 'text-indigo-500' },
    { name: 'Équipe', href: 'collaborateurs.index', color: 'bg-teal-500', textColor: 'text-teal-500' },
    { name: 'Offre', href: 'prospects.index', color: 'bg-amber-500', textColor: 'text-amber-500' },
    { name: 'Matrice', href: 'matrice.index', color: 'bg-fuchsia-500', textColor: 'text-fuchsia-500' },
];

export default function TopbarNav() {
    const { url } = usePage();
    const { auth } = usePage().props;
    const user = auth.collaborateur || auth.user;
    const societe = auth.societe;

    const allPaths = navItems.map(i => new URL(route(i.href)).pathname).sort((a, b) => b.length - a.length);
    const isActive = (href) => {
        const path = new URL(route(href)).pathname;
        const match = allPaths.find(p => url === p || url.startsWith(p + '/'));
        return match === path;
    };

    const year = new Date().getFullYear();

    return (
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 sticky top-0 z-50 shadow-lg">
            {/* Ligne 1 : Logo + Nav pills + Actions */}
            <div className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-white/[0.06]">
                {/* Logo + title */}
                <div className="flex items-center gap-4 shrink-0">
                    <Link href={route('dashboard')} className="flex items-center gap-2 group">
                        <div className="bg-primary-500 text-white p-1 rounded-md group-hover:scale-105 transition-transform">
                            <Target className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-[13px] text-white leading-tight">
                                {societe?.nom || 'Addvalis'} — OKR & Ops Tracker {year}
                            </h1>
                            <span className="text-[9px] font-bold bg-primary-500 text-white px-1.5 py-0.5 rounded">v6</span>
                        </div>
                    </Link>
                    <div className="hidden lg:flex items-center text-[9px] text-white/40 gap-1.5">
                        <span>OKR</span><span>·</span>
                        <span>Daily</span><span>·</span>
                        <span>Missions</span><span>·</span>
                        <span>Incentives</span><span>·</span>
                        <span>LMS</span><span>·</span>
                        <span>Primes</span>
                    </div>
                </div>

                {/* Navigation pills + actions */}
                <div className="flex items-center gap-2">
                    {/* Nav pills */}
                    <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-thin">
                        {auth.collaborateur && navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link key={item.name} href={route(item.href)}
                                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                        active
                                            ? `${item.color} text-white shadow-sm shadow-black/20`
                                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Action icons */}
                    <div className="flex items-center gap-0.5 ml-2 border-l border-white/10 pl-2">
                        <Link href={route('parametres.index')} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors">
                            <Settings className="h-3.5 w-3.5" />
                        </Link>
                        <button className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors">
                            <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors">
                            <Maximize2 className="h-3.5 w-3.5" />
                        </button>

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 hover:bg-white/10 rounded-md px-1.5 py-1 transition-colors ml-1">
                                    <UserAvatar name={user.nom_complet || user.name} className="h-6 w-6 text-[10px] border border-white/20" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link href={route('profile.edit')} className="flex items-center gap-2"><User className="h-4 w-4" />Profil</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={route('parametres.index')} className="flex items-center gap-2"><Settings className="h-4 w-4" />Paramètres</Link>
                                </DropdownMenuItem>
                                {auth.user?.is_superadmin && (
                                    <DropdownMenuItem asChild>
                                        <Link href={route('superadmin.societes.index')} className="flex items-center gap-2 text-red-500"><Settings2 className="h-4 w-4" />Admin SaaS</Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link href={route('logout')} method="post" as="button" className="flex items-center gap-2 w-full text-red-500"><LogOut className="h-4 w-4" />Se déconnecter</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Ligne 2 : Version badge + sub-description (mobile nav) */}
            <div className="flex md:hidden items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-thin border-b border-white/[0.06]">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link key={item.name} href={route(item.href)}
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                active
                                    ? `${item.color} text-white shadow-sm`
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}>
                            {item.name}
                        </Link>
                    );
                })}
            </div>
        </header>
    );
}
