import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Textarea = forwardRef(({ className, error, ...props }, ref) => {
    return (
        <div className="relative">
            <textarea
                ref={ref}
                className={cn(
                    'flex w-full rounded-lg border border-gray-200 dark:border-dark-600',
                    'bg-white dark:bg-dark-800 px-3 py-2 text-sm',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'hover:border-gray-300 dark:hover:border-dark-500',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-colors duration-150 resize-none',
                    error && 'border-red-400 hover:border-red-400 focus:ring-red-400/20 focus:border-red-400',
                    className
                )}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
});
Textarea.displayName = 'Textarea';

export { Textarea };
