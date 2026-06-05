import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fr } from 'date-fns/locale';

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
    return (
        <DayPicker
            locale={fr}
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                /* ── Conteneur ─────────────────── */
                root            : 'w-fit',
                months          : 'flex flex-col',
                month           : 'space-y-3',

                /* ── En-tête (mois + nav) ──────── */
                month_caption   : 'flex justify-center items-center relative h-9 mb-1',
                caption_label   : 'text-sm font-semibold text-gray-900 dark:text-white capitalize',
                nav             : 'absolute inset-x-0 flex justify-between items-center pointer-events-none',
                button_previous : cn(
                    'pointer-events-auto inline-flex items-center justify-center h-7 w-7',
                    'rounded-lg border border-gray-200 dark:border-dark-700',
                    'bg-white dark:bg-dark-800',
                    'hover:bg-gray-50 dark:hover:bg-dark-700',
                    'text-gray-500 dark:text-gray-400',
                    'transition-colors disabled:opacity-40 disabled:pointer-events-none'
                ),
                button_next     : cn(
                    'pointer-events-auto inline-flex items-center justify-center h-7 w-7',
                    'rounded-lg border border-gray-200 dark:border-dark-700',
                    'bg-white dark:bg-dark-800',
                    'hover:bg-gray-50 dark:hover:bg-dark-700',
                    'text-gray-500 dark:text-gray-400',
                    'transition-colors disabled:opacity-40 disabled:pointer-events-none'
                ),

                /* ── Grille ────────────────────── */
                month_grid      : 'w-full border-collapse',
                weekdays        : 'flex',
                weekday         : 'text-gray-400 dark:text-gray-500 w-9 text-center text-[11px] font-medium pb-1 capitalize',
                week            : 'flex w-full mt-0.5',

                /* ── Jours ─────────────────────── */
                day             : 'relative p-0 text-center',
                day_button      : cn(
                    'h-9 w-9 p-0 rounded-lg text-sm font-normal',
                    'text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-dark-700',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
                    'transition-colors'
                ),

                /* ── États ─────────────────────── */
                selected        : 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 rounded-lg',
                today           : 'bg-gray-100 dark:bg-dark-700 font-bold text-gray-900 dark:text-white',
                outside         : 'text-gray-300 dark:text-gray-600 opacity-60',
                disabled        : 'text-gray-300 dark:text-gray-600 opacity-40 pointer-events-none',
                hidden          : 'invisible',
                range_start     : 'rounded-l-lg',
                range_end       : 'rounded-r-lg',
                range_middle    : 'rounded-none bg-primary-50 dark:bg-primary-900/20 text-primary-600',

                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === 'left'
                        ? <ChevronLeft  className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };
