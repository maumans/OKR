import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AlarmClock, Bell, Send, Loader2 } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/Components/ui/DropdownMenu';

const COMMANDS = [
    { key: 'daily',     routeName: 'admin.commands.daily-rappel',    label: 'Rappel Daily',      desc: 'Rappel aux collaborateurs sans bilan du jour', icon: Bell },
    { key: 'livrables', routeName: 'admin.commands.livrable-alerts',  label: 'Alertes livrables', desc: 'Livrables dont la deadline approche (≤ 7j)',    icon: Send },
];

export default function AdminCommandsNav({ variant = 'light' }) {
    const { auth } = usePage().props;
    const [loading, setLoading] = useState(null);

    if (!auth?.collaborateur?.isAdmin) return null;

    const run = (routeName, key) => {
        setLoading(key);
        router.post(route(routeName), {}, {
            preserveScroll: true,
            onFinish: () => setLoading(null),
        });
    };

    const isDark = variant === 'dark';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    title="Commandes admin"
                    className={`relative flex items-center justify-center rounded-lg transition-colors
                        ${isDark
                            ? 'p-1.5 text-white/50 hover:text-white hover:bg-white/10'
                            : 'h-9 w-9 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800'
                        }`}
                >
                    {loading
                        ? <Loader2 className={`animate-spin ${isDark ? 'h-3.5 w-3.5' : 'h-4 w-4 text-primary-500'}`} />
                        : <AlarmClock className={`text-amber-400 ${isDark ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    }
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Commandes manuelles</p>
                </div>
                {COMMANDS.map(cmd => {
                    const Icon = cmd.icon;
                    const isLoading = loading === cmd.key;
                    return (
                        <DropdownMenuItem
                            key={cmd.key}
                            onSelect={() => run(cmd.routeName, cmd.key)}
                            disabled={!!loading}
                            className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                        >
                            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isLoading ? 'text-primary-500' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-sm font-medium">{cmd.label}</p>
                                <p className="text-[11px] text-gray-400 leading-snug">{cmd.desc}</p>
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
