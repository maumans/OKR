import { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { cn, formatNumber, parseFormattedNumber } from '@/lib/utils';

// Matches any whitespace including narrow no-break space (U+202F) used by fr-FR Intl
const WS_RE = /[\s  ]/g;

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
        const input = e.target;
        const rawValue = input.value;
        const cursorPos = input.selectionStart;

        // Strip disallowed characters. For decimals=0, also discard comma/dot.
        const allowed = decimals === 0
            ? /[^\d\s  \-]/g
            : /[^\d\s  ,.\-]/g;
        const cleaned = rawValue.replace(allowed, '');

        if (cleaned === '') {
            setDisplayValue('');
            if (onChange) onChange('');
            return;
        }

        // Allow lone minus while user is still typing
        if (cleaned === '-') {
            setDisplayValue('-');
            if (onChange) onChange('');
            return;
        }

        // Detect trailing decimal separator (user is still typing fractional part)
        const hasTrailingDecimal = decimals > 0 && /[,.]$/.test(cleaned);

        // Normalize to JS number string: strip spaces, convert comma → dot
        const normalized = cleaned.replace(WS_RE, '').replace(',', '.');
        const numVal = parseFloat(normalized);

        if (isNaN(numVal)) return;

        // How many decimal places has the user typed so far
        const dotIdx = normalized.indexOf('.');
        const typedDec = dotIdx >= 0
            ? Math.min(normalized.length - dotIdx - 1, decimals)
            : 0;

        // Build the formatted display value
        let formatted;
        if (hasTrailingDecimal) {
            const intStr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(numVal);
            formatted = intStr + ',';
        } else {
            formatted = new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: typedDec,
                maximumFractionDigits: decimals,
            }).format(numVal);
        }

        // Count significant chars (digits + comma) before the cursor in the raw input.
        // This is used to reposition the cursor in the reformatted string.
        const sigCount = (rawValue.slice(0, cursorPos).match(/[\d,]/g) || []).length;

        setDisplayValue(formatted);
        if (onChange) onChange(String(numVal));

        // Reposition cursor after React re-renders the input value
        requestAnimationFrame(() => {
            const el = inputRef && typeof inputRef !== 'function' ? inputRef.current : null;
            if (!el || document.activeElement !== el) return;
            let count = 0;
            let newPos = formatted.length;
            if (sigCount === 0) {
                newPos = 0;
            } else {
                for (let i = 0; i < formatted.length; i++) {
                    if (/[\d,]/.test(formatted[i])) {
                        count++;
                        if (count === sigCount) { newPos = i + 1; break; }
                    }
                }
            }
            el.setSelectionRange(newPos, newPos);
        });
    };

    const handleBlur = () => {
        setFocused(false);
        const parsed = parseFormattedNumber(displayValue);
        if (parsed !== '' && !isNaN(Number(parsed))) {
            setDisplayValue(formatNumber(parsed, decimals));
        } else if (displayValue === '-') {
            setDisplayValue('');
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
                    'flex w-full rounded-lg border border-gray-200 dark:border-dark-600',
                    'bg-white dark:bg-dark-800 px-3 py-2 text-sm',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'hover:border-gray-300 dark:hover:border-dark-500',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-colors duration-150',
                    'text-left tabular-nums',
                    Icon && 'pl-10',
                    suffix && 'pr-14',
                    error && 'border-red-400 hover:border-red-400 focus:ring-red-400/20 focus:border-red-400',
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
