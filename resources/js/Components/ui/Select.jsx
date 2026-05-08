import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({ className, children, error, ...props }, ref) => {
    return (
        <div className="relative">
            <select
                className={cn(
                    'flex h-10 w-full appearance-none rounded-xl border bg-white dark:bg-dark-800 px-4 py-2 pr-10 text-sm',
                    'border-gray-200 dark:border-dark-600',
                    'text-gray-900 dark:text-gray-100',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
                    'transition-all duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500 focus:ring-red-500/30 focus:border-red-500',
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
});
Select.displayName = 'Select';

export { Select };
