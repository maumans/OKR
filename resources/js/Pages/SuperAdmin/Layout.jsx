import { Link, usePage, router } from '@inertiajs/react';
import { Toaster, toast } from 'sonner';
import { useEffect, useRef } from 'react';
import {
    LayoutDashboard, Building2, Users, Package, CreditCard,
    ScrollText, Settings, LogOut, ArrowLeft, ShieldCheck,
    ChevronRight,
} from 'lucide-react';

const sidebarSections = [
    {
        name: 'VUE D\'ENSEMBLE',
        items: [
            { name: 'Tableau de bord', href: 'superadmin.dashboard', icon: LayoutDashboard },
            { name: 'Audit & Logs', href: 'superadmin.audit-logs.index', icon: ScrollText },
        ],
    },
    {
        name: 'CLIENTS',
        items: [
            { name: 'Sociétés', href: 'superadmin.societes.index', icon: Building2 },
            { name: 'Utilisateurs', href: 'superadmin.utilisateurs.index', icon: Users },
            { name: 'Abonnements', href: 'superadmin.abonnements.index', icon: CreditCard },
        ],
    },
    {
        name: 'CATALOGUE',
        items: [
            { name: 'Modules', href: 'superadmin.modules.index', icon: Package },
        ],
    },
    {
        name: 'SYSTÈME',
        items: [
            { name: 'Paramètres', href: 'superadmin.parametres.index', icon: Settings },
        ],
    },
];

function useFlashToast() {
    const { flash } = usePage().props;
    const shown = useRef({});
    useEffect(() => {
        if (flash?.success && shown.current.success !== flash.success) {
            toast.success(typeof flash.success === 'string' ? flash.success : flash.success?.message);
            shown.current.success = flash.success;
        }
        if (flash?.error && shown.current.error !== flash.error) {
            toast.error(typeof flash.error === 'string' ? flash.error : flash.error?.message);
            shown.current.error = flash.error;
        }
    }, [flash]);
}

export default function SuperAdminLayout({ title, children, breadcrumb = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    useFlashToast();

    const allNavPaths = sidebarSections.flatMap(s => s.items).map(item => {
        try { return new URL(route(item.href), window.location.origin).pathname; } catch { return ''; }
    });

    const isActive = (href) => {
        try {
            const path = new URL(route(href), window.location.origin).pathname;
            const current = window.location.pathname;
            if (current !== path && !current.startsWith(path + '/')) return false;
            // Vérifier qu'aucun autre item n'a un chemin plus spécifique qui correspond
            return !allNavPaths.some(p => p !== path && p.length > path.length && (current === p || current.startsWith(p + '/')));
        } catch {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex">
            <Toaster position="top-right" richColors closeButton duration={3000} />

            {/* ── Sidebar ── */}
            <aside className="w-[280px] bg-slate-900 flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-slate-800">
                {/* Header sidebar */}
                <div className="h-16 flex items-center px-5 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-white leading-tight">Addvalis</h1>
                            <p className="text-[9px] tracking-widest text-indigo-400 font-semibold uppercase">Console Plateforme</p>
                        </div>
                        <span className="ml-auto text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">ADMIN</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                    {sidebarSections.map((section, i) => (
                        <div key={i}>
                            <h3 className="px-3 text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                {section.name}
                            </h3>
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={route(item.href)}
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[13px] group ${
                                                active
                                                    ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }`}
                                        >
                                            <item.icon className={`h-4 w-4 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={active ? 2.5 : 2} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer sidebar */}
                <div className="p-3 border-t border-slate-800 space-y-1 shrink-0">
                    <Link
                        href={route('dashboard')}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l'app
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <Link href={route('logout')} method="post" as="button" title="Se déconnecter" className="text-slate-500 hover:text-red-400 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* ── Contenu principal ── */}
            <div className="pl-[280px] flex flex-col min-h-screen flex-1">
                {/* Top bar */}
                <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 sticky top-0 z-20">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-sm">
                        <Link href={route('superadmin.dashboard')} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            Console
                        </Link>
                        {breadcrumb.map((item, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                                {item.href ? (
                                    <Link href={item.href} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{item.label}</Link>
                                ) : (
                                    <span className="text-slate-700 dark:text-slate-200 font-medium">{item.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium hidden md:block">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {title && (
                        <div className="mb-6">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
