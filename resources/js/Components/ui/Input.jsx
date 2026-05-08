import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ className, type, icon: Icon, error, ...props }, ref) => {
    return (
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <Icon className="h-4 w-4" />
                </div>
            )}
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-xl border bg-white dark:bg-dark-800 px-4 py-2 text-sm',
                    'border-gray-200 dark:border-dark-600',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
                    'transition-all duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    Icon && 'pl-10',
                    error && 'border-red-500 focus:ring-red-500/30 focus:border-red-500',
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
