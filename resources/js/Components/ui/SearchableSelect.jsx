import { useState, useRef, useEffect } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, X, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchableSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Sélectionner...',
    nullable = false,
    nullLabel = '— Aucun —',
    size = 'md',
    disabled = false,
    error,
    className,
}) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState('');
    const searchRef         = useRef(null);

    const isSmall    = size === 'sm';
    const allOptions = nullable
        ? [{ value: '', label: nullLabel }, ...options]
        : options;
    const showSearch = allOptions.length > 5;
    const filtered   = query.trim() === ''
        ? allOptions
        : allOptions.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
    const selected   = allOptions.find(o => String(o.value) === String(value ?? ''));
    const hasValue   = selected != null && selected.value !== '';

    /* ── Focus auto sur la recherche à l'ouverture ─────────────── */
    useEffect(() => {
        if (open && showSearch) {
            const t = setTimeout(() => searchRef.current?.focus(), 30);
            return () => clearTimeout(t);
        }
    }, [open, showSearch]);

    const pick = (val) => {
        onChange(val);
        setOpen(false);
        setQuery('');
    };

    const handleOpenChange = (v) => {
        if (disabled) return;
        setOpen(v);
        if (!v) setQuery('');
    };

    /* ── Classes du trigger ─────────────────────────────────────── */
    const triggerCls = cn(
        'flex items-center w-full rounded-lg border bg-white dark:bg-dark-800',
        'cursor-pointer transition-colors duration-150 select-none',
        isSmall ? 'h-8' : 'h-[38px]',
        open
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : error
                ? 'border-red-400 ring-2 ring-red-400/20'
                : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
    );

    return (
        <div className={cn('relative', className)}>
            <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
                <PopoverPrimitive.Trigger asChild>
                    <div
                        role="button"
                        aria-expanded={open}
                        aria-haspopup="listbox"
                        tabIndex={disabled ? -1 : 0}
                        className={triggerCls}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenChange(!open);
                            }
                        }}
                    >
                        <span className={cn(
                            'flex-1 truncate text-sm min-w-0',
                            isSmall ? 'px-2.5' : 'px-3',
                            hasValue ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'
                        )}>
                            {hasValue ? selected.label : placeholder}
                        </span>

                        <span className={cn(
                            'flex items-center gap-0.5 self-stretch shrink-0',
                            'border-l border-gray-100 dark:border-dark-700',
                            'bg-gray-50 dark:bg-dark-900/50',
                            isSmall ? 'px-1.5' : 'px-2'
                        )}>
                            {nullable && value !== '' && value != null && (
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(''); }}
                                    className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                            <ChevronDown className={cn(
                                'text-gray-400 transition-transform duration-200 shrink-0',
                                isSmall ? 'h-3.5 w-3.5' : 'h-[15px] w-[15px]',
                                open && 'rotate-180'
                            )} />
                        </span>
                    </div>
                </PopoverPrimitive.Trigger>

                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        align="start"
                        sideOffset={4}
                        avoidCollisions
                        collisionPadding={8}
                        style={{ minWidth: 'var(--radix-popover-trigger-width)' }}
                        className={cn(
                            'z-[9999] overflow-hidden',
                            'rounded-xl border border-gray-200 dark:border-dark-600',
                            'bg-white dark:bg-dark-800',
                            'shadow-[0_0_0_1px_rgba(0,0,0,.08),0_4px_6px_-1px_rgba(0,0,0,.08),0_12px_20px_-4px_rgba(0,0,0,.1)]',
                            'data-[state=open]:animate-in data-[state=closed]:animate-out',
                            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
                        )}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        {/* ── Barre de recherche (> 5 options) ─── */}
                        {showSearch && (
                            <div className="px-2 pt-2 pb-1">
                                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700">
                                    <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Rechercher..."
                                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                                    />
                                    {query && (
                                        <button
                                            type="button"
                                            onPointerDown={(e) => { e.preventDefault(); setQuery(''); }}
                                            className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Liste des options ──────────────────── */}
                        <div
                            className={cn(
                                'overflow-y-auto overscroll-contain pb-1 px-1',
                                showSearch ? 'max-h-[260px]' : 'max-h-[300px]'
                            )}
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            {filtered.length === 0 ? (
                                <p className="px-3 py-4 text-center text-xs text-gray-400">
                                    Aucun résultat pour « {query} »
                                </p>
                            ) : filtered.map((opt) => {
                                const isNull     = opt.value === '';
                                const isSelected = String(opt.value) === String(value ?? '');

                                if (isNull) return (
                                    <div key="__null__">
                                        <button
                                            type="button"
                                            onPointerDown={(e) => { e.preventDefault(); pick(''); }}
                                            className="w-full text-left px-3 py-2 text-xs italic text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                        >
                                            {opt.label}
                                        </button>
                                        {filtered.length > 1 && (
                                            <div className="mx-2 my-0.5 h-px bg-gray-100 dark:bg-dark-700" />
                                        )}
                                    </div>
                                );

                                return (
                                    <button
                                        key={String(opt.value)}
                                        type="button"
                                        onPointerDown={(e) => { e.preventDefault(); pick(opt.value); }}
                                        className={cn(
                                            'w-full text-left flex items-center justify-between gap-2',
                                            'px-3 py-2 rounded-lg text-sm transition-colors',
                                            isSelected
                                                ? 'text-primary-600 dark:text-primary-400 font-medium'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                                        )}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && (
                                            <Check className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>

            {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
        </div>
    );
}
