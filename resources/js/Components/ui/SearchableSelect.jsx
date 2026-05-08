import { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchableSelect({
    value,
    onChange,
    options = [],
    placeholder = "Sélectionner...",
    searchPlaceholder = "Rechercher...",
    error,
    className,
    disabled = false
}) {
    const [query, setQuery] = useState('');

    const filteredOptions = query === ''
        ? options
        : options.filter((option) =>
            option.label
                .toLowerCase()
                .replace(/\s+/g, '')
                .includes(query.toLowerCase().replace(/\s+/g, ''))
        );

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    return (
        <div className={cn("relative", className)}>
            <Combobox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative mt-1">
                    <div className={cn(
                        "relative w-full cursor-default overflow-hidden rounded-xl bg-white dark:bg-dark-800 text-left border transition-all duration-200",
                        error
                            ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/30"
                            : "border-gray-200 dark:border-dark-600 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/30",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}>
                        <Combobox.Input
                            className={cn(
                                "w-full border-none py-2 pl-4 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-transparent focus:ring-0",
                                disabled && "cursor-not-allowed"
                            )}
                            displayValue={() => selectedOption ? selectedOption.label : ''}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </Combobox.Button>
                    </div>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-dark-800 py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm">
                            {filteredOptions.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-500 dark:text-gray-400 text-sm">
                                    Aucun résultat trouvé.
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <Combobox.Option
                                        key={option.value}
                                        className={({ active }) =>
                                            cn(
                                                "relative cursor-default select-none py-2 pl-10 pr-4 transition-colors",
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
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
            {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
