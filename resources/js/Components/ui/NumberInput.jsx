import { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { cn, formatNumber, parseFormattedNumber } from '@/lib/utils';

const NumberInput = forwardRef(({ className, value, onChange, decimals = 2, suffix, icon: Icon, error, ...props }, ref) => {
    const innerRef = useRef(null);
    const inputRef = ref || innerRef;
    const [focused, setFocused] = useState(false);

    const toDisplay = useCallback((val) => {
        if (val === '' || val === null || val === undefined) return '';
        return formatNumber(val, decimals);
    }, [decimals]);

    const [displayValue, setDisplayValue] = useState(() => toDisplay(value));

    useEffect(() => {
        if (!focused) {
            setDisplayValue(toDisplay(value));
        }
    }, [value, focused, toDisplay]);

    const handleChange = (e) => {
        const raw = e.target.value.replace(/[^\d\s,.\-]/g, '');
        setDisplayValue(raw);
        const parsed = parseFormattedNumber(raw);
        if (onChange) onChange(parsed);
    };

    const handleBlur = () => {
        setFocused(false);
        const parsed = parseFormattedNumber(displayValue);
        if (parsed !== '' && !isNaN(Number(parsed))) {
            setDisplayValue(formatNumber(parsed, decimals));
        }
    };

    const handleFocus = (e) => {
        setFocused(true);
        setTimeout(() => e.target.select(), 0);
    };

    return (
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <Icon className="h-4 w-4" />
                </div>
            )}
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className={cn(
                    'flex h-10 w-full rounded-xl border bg-white dark:bg-dark-800 px-4 py-2 text-sm',
                    'border-gray-200 dark:border-dark-600',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
                    'transition-all duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'text-right tabular-nums',
                    Icon && 'pl-10',
                    suffix && 'pr-14',
                    error && 'border-red-500 focus:ring-red-500/30 focus:border-red-500',
                    className
                )}
                {...props}
            />
            {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                    {suffix}
                </span>
            )}
            {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
});
NumberInput.displayName = 'NumberInput';

export { NumberInput };
