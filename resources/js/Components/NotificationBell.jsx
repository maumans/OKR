import { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Bell, Check, CheckCheck, Trash2, Package, AlertTriangle, TrendingUp, Award, Info, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_CONFIG = {
    livrable_deadline: { icon: AlertTriangle, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20'   },
    livrable_statut:   { icon: Package,       color: 'text-sky-500',    bg: 'bg-sky-50 dark:bg-sky-900/20'       },
    mission_critique:  { icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20'       },
    prime_validee:     { icon: Award,         color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20'   },
    daily_rappel:      { icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    default:           { icon: Info,          color: 'text-gray-400',   bg: 'bg-gray-50 dark:bg-dark-800'        },
};

function NotifIcon({ type, className = 'h-4 w-4' }) {
    const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
    return <cfg.icon className={`${className} ${cfg.color}`} />;
}

function NotifItem({ notif, onRead, onDelete }) {
    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.default;
    const handleClick = () => {
        if (!notif.lue) onRead(notif.id);
        if (notif.data?.url) router.visit(notif.data.url);
    };

    return (
        <div className={`flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-800/60 transition-colors ${!notif.lue ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}`}>
            <button onClick={handleClick} className="flex gap-3 flex-1 min-w-0 text-left">
                <div className={`shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                    <NotifIcon type={notif.type} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-tight ${!notif.lue ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notif.titre}
                    </p>
                    {notif.body && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{notif.body}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{notif.ago}</p>
                </div>
            </button>
            <div className="flex items-start gap-1 shrink-0 pt-0.5">
                {!notif.lue && (
                    <button onClick={() => onRead(notif.id)} title="Marquer comme lu"
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                        <Check className="h-3.5 w-3.5 text-primary-500" />
                    </button>
                )}
                <button onClick={() => onDelete(notif.id)} title="Supprimer"
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                </button>
            </div>
        </div>
    );
}

export default function NotificationBell({ variant = 'light' }) {
    const { notifications: notifProps } = usePage().props;
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState(notifProps?.items ?? []);
    const [count, setCount] = useState(notifProps?.count ?? 0);
    const dropdownRef = useRef(null);

    // Sync depuis Inertia (après chaque navigation)
    useEffect(() => {
        setItems(notifProps?.items ?? []);
        setCount(notifProps?.count ?? 0);
    }, [notifProps]);

    // Fermer sur clic extérieur
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = (id) => {
        fetch(route('notifications.read', id), { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content, 'Accept': 'application/json' } });
        setItems(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
        setCount(prev => Math.max(0, prev - 1));
    };

    const markAllRead = () => {
        fetch(route('notifications.read-all'), { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content, 'Accept': 'application/json' } });
        setItems(prev => prev.map(n => ({ ...n, lue: true })));
        setCount(0);
    };

    const deleteNotif = (id) => {
        fetch(route('notifications.destroy', id), { method: 'DELETE', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content, 'Accept': 'application/json' } });
        const removed = items.find(n => n.id === id);
        setItems(prev => prev.filter(n => n.id !== id));
        if (removed && !removed.lue) setCount(prev => Math.max(0, prev - 1));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className={`relative rounded-lg h-9 w-9 flex items-center justify-center transition-colors ${
                    variant === 'dark'
                        ? 'bg-transparent hover:bg-white/10 border border-transparent'
                        : 'bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800'
                }`}
                title="Notifications"
            >
                <Bell className={`h-4 w-4 ${variant === 'dark' ? 'text-white/60' : 'text-slate-600 dark:text-slate-300'}`} />
                {count > 0 && (
                    <span className={`absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 ${variant === 'dark' ? 'border-slate-900' : 'border-white dark:border-dark-950'}`}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-11 w-[360px] bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-800">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary-500" />
                                <span className="text-[13px] font-semibold text-gray-900 dark:text-white">Notifications</span>
                                {count > 0 && (
                                    <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                                        {count} non lue{count > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            {count > 0 && (
                                <button onClick={markAllRead}
                                    className="flex items-center gap-1 text-[11px] text-primary-500 hover:text-primary-600 font-medium transition-colors">
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Tout lire
                                </button>
                            )}
                        </div>

                        {/* Liste */}
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50 dark:divide-dark-800">
                            {items.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Bell className="h-8 w-8 text-gray-200 dark:text-dark-700 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Aucune notification</p>
                                </div>
                            ) : (
                                items.map(notif => (
                                    <NotifItem key={notif.id} notif={notif} onRead={markRead} onDelete={deleteNotif} />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
