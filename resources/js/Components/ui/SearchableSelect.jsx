import { useState, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchableSelect({
    value,
    onChange,
    options = [],
    placeholder = "Sélectionner...",
    error,
    className,
    disabled = false,
    nullable = false,
    nullLabel = "— Aucun —",
    size = 'md',
}) {
    const [query, setQuery] = useState('');
    const [portalStyle, setPortalStyle] = useState({ position: 'fixed', top: 0, left: 0, width: 0, zIndex: 9999 });
    const wrapperRef = useRef(null);

    const allOptions = nullable
        ? [{ value: '', label: nullLabel }, ...options]
        : options;

    const filteredOptions = query === ''
        ? allOptions
        : allOptions.filter((opt) =>
            opt.label.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''))
        );

    const selectedOption = allOptions.find((opt) => String(opt.value) === String(value ?? ''));

    const updatePosition = () => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const estimatedHeight = Math.min(280, filteredOptions.length * 36 + 48);
        const spaceBelow = window.innerHeight - rect.bottom;
        const openAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

        setPortalStyle({
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
            ...(openAbove
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        });
    };

    const isSmall = size === 'sm';

    return (
        <div className={cn("relative", className)}>
            <Combobox value={value ?? ''} onChange={onChange} disabled={disabled}>
                <div ref={wrapperRef} className="relative">
                    {/* ── Trigger ── */}
                    <div className={cn(
                        "relative flex items-center w-full rounded-xl border bg-white dark:bg-dark-800 transition-all duration-200",
                        isSmall ? "h-8" : "h-10",
                        error
                            ? "border-red-400 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-400/25"
                            : "border-gray-200 dark:border-dark-600 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20",
                        disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-dark-900"
                    )}>
                        <Combobox.Input
                            className={cn(
                                "flex-1 bg-transparent border-none outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400",
                                isSmall ? "px-3 text-xs" : "px-3.5 text-sm",
                                disabled && "cursor-not-allowed"
                            )}
                            displayValue={() => selectedOption && selectedOption.value !== '' ? selectedOption.label : ''}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={updatePosition}
                            onClick={updatePosition}
                            placeholder={placeholder}
                        />
                        <div className="flex items-center pr-2 gap-0.5 shrink-0">
                            {nullable && value && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onChange(''); }}
                                    className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
                                    tabIndex={-1}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                            <Combobox.Button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" onClick={updatePosition}>
                                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            </Combobox.Button>
                        </div>
                    </div>

                    {/* ── Dropdown via portal ── */}
                    {createPortal(
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 -translate-y-1"
                            afterLeave={() => setQuery('')}
                        >
                            <Combobox.Options
                                style={portalStyle}
                                className="overflow-hidden rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 shadow-xl shadow-black/10 dark:shadow-black/30 focus:outline-none"
                            >
                                {/* Barre de recherche si plus de 5 options */}
                                {allOptions.length > 5 && (
                                    <div className="px-2.5 pt-2 pb-1.5 border-b border-gray-100 dark:border-dark-700">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-dark-900 text-gray-400">
                                            <Search className="h-3 w-3 shrink-0" />
                                            <span className="text-xs">{query || 'Rechercher…'}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="max-h-60 overflow-y-auto py-1">
                                    {filteredOptions.length === 0 && query !== '' ? (
                                        <div className="py-6 text-center text-xs text-gray-400">
                                            Aucun résultat pour « {query} »
                                        </div>
                                    ) : (
                                        filteredOptions.map((option, i) => {
                                            const isNull = option.value === '';
                                            return (
                                                <Fragment key={option.value}>
                                                    {isNull && filteredOptions.length > 1 && (
                                                        <div className="mx-2 mb-1 pb-1 border-b border-gray-100 dark:border-dark-700">
                                                            <Combobox.Option
                                                                value={option.value}
                                                                className={({ active }) => cn(
                                                                    "px-3 py-1.5 rounded-lg cursor-pointer text-xs italic transition-colors",
                                                                    active ? "bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
                                                                )}
                                                            >
                                                                {option.label}
                                                            </Combobox.Option>
                                                        </div>
                                                    )}
                                                    {!isNull && (
                                                        <Combobox.Option
                                                            value={option.value}
                                                            className={({ active }) => cn(
                                                                "mx-1 px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors",
                                                                active
                                                                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                                                                    : "text-gray-800 dark:text-gray-200"
                                                            )}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className={cn("block truncate text-sm", selected ? "font-semibold" : "font-normal")}>
                                                                        {option.label}
                                                                    </span>
                                                                    {selected && (
                                                                        <Check className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                                                                    )}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    )}
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </div>
                            </Combobox.Options>
                        </Transition>,
                        document.body
                    )}
                </div>
            </Combobox>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
