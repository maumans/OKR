import { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomSelect({
    value,
    onChange,
    options = [],
    placeholder = "Sélectionner...",
    error,
    className,
    disabled = false,
    size = 'md',
    nullable = false,
    nullLabel = '— Aucun —',
}) {
    const [open, setOpen] = useState(false);

    const isSmall    = size === 'sm';
    const allOptions = nullable ? [{ value: '', label: nullLabel }, ...options] : options;
    const selected   = allOptions.find(o => String(o.value) === String(value ?? ''));
    const hasValue   = selected != null && selected.value !== '';

    const pick = (val) => { onChange(val); setOpen(false); };

    const handleOpenChange = (v) => {
        if (disabled) return;
        setOpen(v);
    };

    /* ── Classes du trigger ─────────────────────────────────────── */
    const triggerCls = cn(
        'flex items-center w-full rounded-xl border bg-white dark:bg-dark-800',
        'cursor-pointer transition-all duration-200 select-none text-left',
        isSmall ? 'h-8 px-3' : 'h-10 px-3.5',
        open
            ? 'border-primary-500 ring-2 ring-primary-500/20 outline-none'
            : error
                ? 'border-red-400 ring-2 ring-red-400/20'
                : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none bg-gray-50 dark:bg-dark-900'
    );

    return (
        <div className={cn('relative', className)}>
            <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
                <PopoverPrimitive.Trigger asChild>
                    <button
                        type="button"
                        className={triggerCls}
                        disabled={disabled}
                        aria-expanded={open}
                        aria-haspopup="listbox"
                    >
                        <span className={cn(
                            'flex-1 truncate',
                            isSmall ? 'text-xs' : 'text-sm',
                            hasValue ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
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
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(''); }}
                                    className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            )}
                            <ChevronDown className={cn(
                                'text-gray-400 transition-transform duration-200 shrink-0',
                                isSmall ? 'h-3.5 w-3.5' : 'h-[15px] w-[15px]',
                                open && 'rotate-180'
                            )} />
                        </span>
                    </button>
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
                        <div className="max-h-60 overflow-y-auto overscroll-contain py-1 px-1">
                            {allOptions.length === 0 ? (
                                <div className="py-6 text-center text-xs text-gray-400">Aucune option</div>
                            ) : allOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value ?? '');
                                const isNull     = opt.value === '';

                                if (isNull) return (
                                    <div key="__null__">
                                        <button
                                            type="button"
                                            onPointerDown={(e) => { e.preventDefault(); pick(''); }}
                                            className="w-full text-left px-3 py-2 text-xs italic text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                        >
                                            {opt.label}
                                        </button>
                                        {allOptions.length > 1 && (
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
                                            'px-3 py-2 rounded-lg transition-colors',
                                            isSmall ? 'text-xs' : 'text-sm',
                                            isSelected
                                                ? 'text-primary-600 dark:text-primary-400 font-medium'
                                                : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700'
                                        )}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && !isNull && <Check className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
