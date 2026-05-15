import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ className, type, icon: Icon, error, ...props }, ref) => {
    return (
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <Icon className="h-4 w-4" />
                </div>
            )}
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-xl border border-gray-200 dark:border-dark-600',
                    'bg-white dark:bg-dark-800 px-3 py-2 text-sm',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:border-primary-500',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-all duration-200',
                    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                    Icon && 'pl-9',
                    error && 'border-red-400 focus-visible:ring-red-400/30 focus-visible:border-red-400',
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
});
Input.displayName = 'Input';

export { Input };
