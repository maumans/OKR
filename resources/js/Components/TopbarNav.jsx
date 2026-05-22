import { useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Users, Target, CheckSquare, TrendingUp,
    Award, Settings, Settings2, PenTool, GraduationCap, BarChart3,
    LogOut, User, Briefcase, Grid3X3, Gift, Sun, Moon, Upload,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { UserAvatar } from '@/Components/ui/Avatar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';

const ALL_NAV_ITEMS = [
    { name: 'OKR',           href: 'objectifs.index',   color: 'bg-blue-500',    textColor: 'text-blue-500',    moduleCode: 'okr' },
    { name: 'Objectifs individuels',   href: 'individuels.index',  color: 'bg-rose-500',    textColor: 'text-rose-500',    moduleCode: 'individuels' },
    { name: 'Daily',         href: 'daily.index',        color: 'bg-violet-500',  textColor: 'text-violet-500',  moduleCode: 'daily' },
    { name: 'Prospection',   href: 'prospects.index',    color: 'bg-green-500',   textColor: 'text-green-500',   moduleCode: 'prospection' },
    { name: 'LMS',           href: 'formations.index',   color: 'bg-orange-500',  textColor: 'text-orange-500',  moduleCode: 'lms' },
    { name: 'Missions',      href: 'missions.index',     color: 'bg-sky-500',     textColor: 'text-sky-500',     moduleCode: 'missions' },
    { name: 'Incentives',    href: 'incentives.index',   color: 'bg-pink-500',    textColor: 'text-pink-500',    moduleCode: 'incentives' },
    { name: 'Synthèse',      href: 'synthese.index',     color: 'bg-violet-500',  textColor: 'text-violet-500',  moduleCode: 'synthese' },
    { name: 'Équipe',        href: 'collaborateurs.index',color: 'bg-teal-500',   textColor: 'text-teal-500',    moduleCode: 'equipe' },
    { name: 'Matrice',       href: 'matrice.index',      color: 'bg-fuchsia-500', textColor: 'text-fuchsia-500', moduleCode: 'matrice' },
    { name: 'Import',        href: 'import.index',       color: 'bg-emerald-500', textColor: 'text-emerald-500', moduleCode: 'import' },
];

export default function TopbarNav() {
    const { auth, modulesActifs = [] } = usePage().props;
    const user = auth.collaborateur || auth.user;
    const societe = auth.societe;
    const mobileNavRef = useRef(null);
    const { isDark, toggleTheme } = useTheme(societe?.mode_sombre);

    const codesActifs = new Set(modulesActifs.map(m => m.code));
    const navItems = ALL_NAV_ITEMS.filter(item => !item.moduleCode || codesActifs.has(item.moduleCode));

    const toPath = (href) => {
        try { return new URL(route(href), window.location.origin).pathname; }
        catch { return null; }
    };

    const allPaths = navItems.map(i => toPath(i.href)).filter(Boolean).sort((a, b) => b.length - a.length);
    const isActive = (href) => {
        const path = toPath(href);
        if (!path) return false;
        const currentPath = window.location.pathname;
        const match = allPaths.find(p => currentPath === p || currentPath.startsWith(p + '/'));
        return match === path;
    };

    useEffect(() => {
        if (mobileNavRef.current) {
            const activeEl = mobileNavRef.current.querySelector('[data-active="true"]');
            if (activeEl) activeEl.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
        }
    }, []);

    const year = new Date().getFullYear();

    return (
        <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 sticky top-0 z-50 shadow-lg">
            {/* Ligne 1 : Logo + Nav pills + Actions */}
            <div className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-white/[0.06]">
                <div className="flex items-center gap-4 shrink-0">
                    <Link href={route('dashboard')} className="flex items-center gap-2 group">
                        {societe?.logo ? (
                            <img
                                src={`/storage/${societe.logo}`}
                                alt={societe.nom}
                                className="h-7 w-7 rounded-md object-contain bg-white/10 p-0.5"
                            />
                        ) : (
                            <div className="bg-primary-500 text-white p-1 rounded-md group-hover:scale-105 transition-transform">
                                <Target className="h-4 w-4" />
                            </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="font-bold text-[13px] text-white leading-tight truncate max-w-[120px] sm:max-w-none">
                                <span>{societe?.nom || 'Addvalis'}</span>
                                <span className="hidden sm:inline"> — OKR & Ops Tracker {year}</span>
                            </h1>
                            <span className="text-[9px] font-bold bg-primary-500 text-white px-1.5 py-0.5 rounded shrink-0">v6</span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {/* Nav pills — filtrées selon modulesActifs */}
                    <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide">
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

                    <div className="flex items-center gap-0.5 ml-2 border-l border-white/10 pl-2">
                        <button
                            onClick={toggleTheme}
                            title={isDark ? 'Mode clair' : 'Mode sombre'}
                            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                        </button>
                        <Link href={route('parametres.index')} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors">
                            <Settings className="h-3.5 w-3.5" />
                        </Link>

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
                                        <Link href={route('superadmin.dashboard')} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                            <Settings2 className="h-4 w-4" />Console Admin
                                        </Link>
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

            {/* Ligne 2 : nav mobile */}
            <div ref={mobileNavRef} className="flex md:hidden items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-white/[0.06]">
                {auth.collaborateur && navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link key={item.name} href={route(item.href)}
                            data-active={active}
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
