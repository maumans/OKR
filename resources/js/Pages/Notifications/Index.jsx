import { router, usePage, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Bell, Check, CheckCheck, Trash2, Package, AlertTriangle,
    Award, Info, ClipboardList, BellOff,
} from 'lucide-react';

// ─── Config types ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    livrable_deadline: {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        label: 'Échéances',
    },
    livrable_statut: {
        icon: Package,
        color: 'text-sky-500',
        bg: 'bg-sky-50 dark:bg-sky-900/20',
        label: 'Livrables',
    },
    mission_critique: {
        icon: AlertTriangle,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20',
        label: 'Projets critiques',
    },
    prime_validee: {
        icon: Award,
        color: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-900/20',
        label: 'Primes',
    },
    daily_rappel: {
        icon: ClipboardList,
        color: 'text-violet-500',
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        label: 'Rappels Daily',
    },
    default: {
        icon: Info,
        color: 'text-gray-400',
        bg: 'bg-gray-50 dark:bg-dark-800',
        label: 'Autres',
    },
};

const TABS = [
    { key: 'toutes',           label: 'Toutes' },
    { key: 'non_lues',         label: 'Non lues' },
    { key: 'livrable_deadline', label: TYPE_CONFIG.livrable_deadline.label },
    { key: 'livrable_statut',  label: TYPE_CONFIG.livrable_statut.label },
    { key: 'mission_critique', label: TYPE_CONFIG.mission_critique.label },
    { key: 'prime_validee',    label: TYPE_CONFIG.prime_validee.label },
    { key: 'daily_rappel',     label: TYPE_CONFIG.daily_rappel.label },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

function apiFetch(url, method) {
    return fetch(url, {
        method,
        headers: { 'X-CSRF-TOKEN': csrfToken(), Accept: 'application/json' },
    });
}

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─── NotifCard ────────────────────────────────────────────────────────────────

function NotifCard({ notif, onRead, onDelete }) {
    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.default;
    const Icon = cfg.icon;

    const handleClick = () => {
        if (!notif.lue) onRead(notif.id);
        if (notif.data?.url) router.visit(notif.data.url);
    };

    return (
        <div className={`
            flex items-start gap-4 px-5 py-4 rounded-xl border transition-colors
            ${notif.lue
                ? 'bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800'
                : 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30'
            }
        `}>
            {/* Icône type */}
            <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                <Icon className={`h-5 w-5 ${cfg.color}`} />
            </div>

            {/* Contenu */}
            <button
                onClick={handleClick}
                className="flex-1 min-w-0 text-left"
            >
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${notif.lue ? 'text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                        {notif.titre}
                    </p>
                    {!notif.lue && (
                        <span className="shrink-0 h-2 w-2 mt-1.5 rounded-full bg-primary-500" />
                    )}
                </div>
                {notif.body && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1" title={formatDate(notif.created_at)}>
                    {notif.ago}
                </p>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {!notif.lue && (
                    <button
                        onClick={() => onRead(notif.id)}
                        title="Marquer comme lu"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    >
                        <Check className="h-4 w-4 text-primary-500" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(notif.id)}
                    title="Supprimer"
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function NotificationsIndex({ notifications, activeType }) {
    const { notifications: sharedNotifs } = usePage().props;
    const nonLuesCount = sharedNotifs?.count ?? 0;

    const items      = notifications.data ?? [];
    const pagination = notifications;

    const navigate = (type) => {
        router.get(route('notifications.page'), type !== 'toutes' ? { type } : {}, {
            preserveState: false,
        });
    };

    const markRead = (id) => {
        apiFetch(route('notifications.read', id), 'POST');
        router.reload({ only: ['notifications'] });
    };

    const markAllRead = () => {
        apiFetch(route('notifications.read-all'), 'POST').then(() => {
            router.reload({ only: ['notifications'] });
        });
    };

    const deleteNotif = (id) => {
        apiFetch(route('notifications.destroy', id), 'DELETE').then(() => {
            router.reload({ only: ['notifications'] });
        });
    };

    return (
        <AppLayout title="Notifications">
            <Head title="Notifications" />

            <div className="max-w-3xl mx-auto py-6 px-4 sm:px-0 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-primary-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                            {nonLuesCount > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {nonLuesCount} non lue{nonLuesCount > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {nonLuesCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Tout marquer comme lu
                        </button>
                    )}
                </div>

                {/* Tabs filtres */}
                <div className="flex gap-1.5 flex-wrap">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => navigate(tab.key)}
                            className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                ${activeType === tab.key
                                    ? 'bg-primary-500 text-white shadow-sm'
                                    : 'bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 hover:text-primary-600'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Liste */}
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center mb-4">
                            <BellOff className="h-8 w-8 text-gray-300 dark:text-dark-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aucune notification</p>
                        {activeType !== 'toutes' && (
                            <button
                                onClick={() => navigate('toutes')}
                                className="mt-3 text-xs text-primary-500 hover:underline"
                            >
                                Voir toutes les notifications
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map(notif => (
                            <NotifCard
                                key={notif.id}
                                notif={notif}
                                onRead={markRead}
                                onDelete={deleteNotif}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {(pagination.prev_page_url || pagination.next_page_url) && (
                    <div className="flex items-center justify-between pt-2">
                        <button
                            disabled={!pagination.prev_page_url}
                            onClick={() => router.get(pagination.prev_page_url)}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Précédent
                        </button>
                        <span className="text-xs text-gray-400">
                            Page {pagination.current_page} / {pagination.last_page}
                        </span>
                        <button
                            disabled={!pagination.next_page_url}
                            onClick={() => router.get(pagination.next_page_url)}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Suivant →
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
