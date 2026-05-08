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
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-semibold text-gray-900 dark:text-white capitalize',
                nav: 'space-x-1 flex items-center',
                nav_button:
                    'inline-flex items-center justify-center h-7 w-7 bg-transparent rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-50 disabled:pointer-events-none',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell:
                    'text-gray-400 dark:text-gray-500 rounded-md w-9 font-medium text-[11px] uppercase',
                row: 'flex w-full mt-0.5',
                cell: cn(
                    'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                    '[&:has([aria-selected])]:bg-primary-50 dark:[&:has([aria-selected])]:bg-primary-900/20',
                    '[&:has([aria-selected].day-range-end)]:rounded-r-md',
                    '[&:has([aria-selected].day-outside)]:bg-primary-50/50',
                    'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
                ),
                day: cn(
                    'h-9 w-9 p-0 font-normal rounded-lg text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-dark-800',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30',
                    'aria-selected:opacity-100 transition-colors'
                ),
                day_selected:
                    'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 dark:text-white focus:bg-primary-500 dark:focus:bg-primary-600',
                day_today:
                    'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white font-bold',
                day_outside:
                    'text-gray-300 dark:text-gray-600 aria-selected:bg-primary-50/50 aria-selected:text-gray-400',
                day_disabled: 'text-gray-300 dark:text-gray-600 opacity-50',
                day_range_middle:
                    'aria-selected:bg-primary-50 aria-selected:text-primary-600 dark:aria-selected:bg-primary-900/20',
                day_hidden: 'invisible',
                ...classNames,
            }}
            components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };
