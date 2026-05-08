import React, { useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/Components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/Popover';

/**
 * CustomDatePicker — Composant DatePicker basé sur shadcn Calendar + Popover.
 * 
 * @param {string} value - Date au format 'YYYY-MM-DD' (string) ou ''
 * @param {function} onChange - Callback avec la date au format 'YYYY-MM-DD' ou ''
 * @param {string} placeholder - Texte affiché quand aucune date n'est sélectionnée
 * @param {string} error - Message d'erreur à afficher
 * @param {string} className - Classes CSS additionnelles pour le wrapper
 * @param {boolean} disabled - Désactiver le composant
 * @param {string} size - 'default' | 'sm' pour contrôler la taille du bouton
 */
export function CustomDatePicker({
    value,
    onChange,
    placeholder = 'Sélectionner une date',
    error,
    className,
    disabled = false,
    size = 'default',
}) {
    const [open, setOpen] = useState(false);

    // Convertir string YYYY-MM-DD en objet Date
    const dateValue = (() => {
        if (!value) return undefined;
        // Si c'est un objet { startDate, endDate }, prendre startDate (rétro-compat)
        const dateStr = typeof value === 'object' && value?.startDate ? value.startDate : value;
        if (!dateStr) return undefined;
        const d = parse(dateStr, 'yyyy-MM-dd', new Date());
        return isValid(d) ? d : undefined;
    })();

    const handleSelect = (date) => {
        if (typeof onChange === 'function') {
            if (date && isValid(date)) {
                onChange(format(date, 'yyyy-MM-dd'));
            } else {
                onChange('');
            }
        }
        setOpen(false);
    };

    const isSm = size === 'sm';

    return (
        <div className={cn('relative', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                            'relative w-full flex items-center gap-2 rounded-xl bg-white dark:bg-dark-800 text-left border transition-all duration-200 shadow-sm',
                            isSm
                                ? 'px-2 py-1.5 text-[11px]'
                                : 'py-2 pl-3 pr-3 text-sm',
                            error
                                ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30'
                                : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
                            disabled && 'opacity-50 cursor-not-allowed',
                            !disabled && 'cursor-pointer'
                        )}
                    >
                        <CalendarIcon className={cn(
                            'shrink-0 text-gray-400',
                            isSm ? 'h-3 w-3' : 'h-4 w-4'
                        )} />
                        <span
                            className={cn(
                                'flex-1 truncate',
                                dateValue
                                    ? 'text-gray-900 dark:text-gray-100'
                                    : 'text-gray-400 dark:text-gray-500'
                            )}
                        >
                            {dateValue
                                ? format(dateValue, 'dd/MM/yyyy', { locale: fr })
                                : placeholder}
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={handleSelect}
                        defaultMonth={dateValue}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
