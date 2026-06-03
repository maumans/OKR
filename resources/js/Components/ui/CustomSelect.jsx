import { useState, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
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
}) {
    const wrapperRef = useRef(null);
    const [portalStyle, setPortalStyle] = useState({ position: 'fixed', top: 0, left: 0, width: 0, zIndex: 9999 });
    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    const updatePosition = () => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const estimatedHeight = Math.min(280, options.length * 36 + 8);
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
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div ref={wrapperRef} className="relative">
                    {/* ── Trigger ── */}
                    <Listbox.Button
                        onClick={updatePosition}
                        className={cn(
                            "relative w-full flex items-center justify-between gap-2 rounded-xl border bg-white dark:bg-dark-800 transition-all duration-200 cursor-pointer text-left",
                            isSmall ? "h-8 px-3 text-xs" : "h-10 px-3.5 text-sm",
                            error
                                ? "border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/25"
                                : "border-gray-200 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                            disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-dark-900"
                        )}
                    >
                        <span className={cn("block truncate", selectedOption ? "text-gray-900 dark:text-gray-100" : "text-gray-400")}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
                    </Listbox.Button>

                    {/* ── Dropdown via portal ── */}
                    {createPortal(
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 -translate-y-1"
                        >
                            <Listbox.Options
                                style={portalStyle}
                                className="overflow-hidden rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 shadow-xl shadow-black/10 dark:shadow-black/30 focus:outline-none"
                            >
                                <div className="max-h-60 overflow-y-auto py-1">
                                    {options.length === 0 ? (
                                        <div className="py-6 text-center text-xs text-gray-400">
                                            Aucune option
                                        </div>
                                    ) : (
                                        options.map((option) => (
                                            <Listbox.Option
                                                key={option.value}
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
                                            </Listbox.Option>
                                        ))
                                    )}
                                </div>
                            </Listbox.Options>
                        </Transition>,
                        document.body
                    )}
                </div>
            </Listbox>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
