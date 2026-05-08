import { Fragment } from 'react';
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
    disabled = false
}) {
    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    return (
        <div className={cn("relative", className)}>
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative mt-1">
                    <Listbox.Button className={cn(
                        "relative w-full cursor-pointer rounded-xl bg-white dark:bg-dark-800 py-2 pl-3 pr-10 text-left border transition-all duration-200 shadow-sm",
                        error
                            ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            : "border-gray-200 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}>
                        <span className="block truncate text-sm text-gray-900 dark:text-gray-100">
                            {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-dark-800 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm">
                            {options.length === 0 ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-500 dark:text-gray-400 text-sm">
                                    Aucune option
                                </div>
                            ) : (
                                options.map((option) => (
                                    <Listbox.Option
                                        key={option.value}
                                        className={({ active }) =>
                                            cn(
                                                "relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors",
                                                active ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" : "text-gray-900 dark:text-gray-100"
                                            )
                                        }
                                        value={option.value}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                                    {option.label}
                                                </span>
                                                {selected ? (
                                                    <span className={cn(
                                                        "absolute inset-y-0 left-0 flex items-center pl-3",
                                                        active ? "text-primary-600 dark:text-primary-400" : "text-primary-600 dark:text-primary-400"
                                                    )}>
                                                        <Check className="h-4 w-4" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))
                            )}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
            {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
