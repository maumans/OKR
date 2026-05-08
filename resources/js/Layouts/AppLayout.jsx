import { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { Toaster, toast } from 'sonner';
import Sidebar from '@/Components/Sidebar';
import TopbarNav from '@/Components/TopbarNav';
import { Bell, Menu, Search } from 'lucide-react';
import { Button } from '@/Components/ui/Button';

function useFlashToast() {
    const { flash } = usePage().props;
    const shown = useRef({});

    useEffect(() => {
        if (flash?.success && shown.current.success !== flash.success) {
            toast.success(flash.success);
            shown.current.success = flash.success;
        }
        if (flash?.error && shown.current.error !== flash.error) {
            toast.error(flash.error);
            shown.current.error = flash.error;
        }
    }, [flash]);
}

export default function AppLayout({ title, children }) {
    const { auth } = usePage().props;
    const layoutMode = auth?.societe?.layout_mode || 'sidebar';
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useFlashToast();

    // ─── Layout Topbar ──────────────────────────────────────
    if (layoutMode === 'topbar') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-950 font-sans">
                <Toaster position="top-right" richColors closeButton duration={3000} />
                <TopbarNav />
                <main className="px-4 sm:px-6 py-5">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    // ─── Layout Sidebar (défaut) ────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 font-sans">
            <Toaster position="top-right" richColors closeButton duration={3000} />
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar />
            </div>

            <div className="lg:pl-[260px] flex flex-col min-h-screen">
                <header className="h-16 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md border-b border-gray-100 dark:border-dark-800 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                            {title || 'Tableau de bord'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56 transition-all"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="relative rounded-lg bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-100 h-9 w-9">
                            <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-dark-900">
                                2
                            </span>
                        </Button>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    <div className="max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
