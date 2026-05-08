import { forwardRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

const Progress = forwardRef(({ className, value, variant = 'default', showLabel = false, ...props }, ref) => {
    const variantClasses = {
        default: 'bg-primary-500',
        secondary: 'bg-secondary-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        destructive: 'bg-red-500',
        gradient: 'bg-gradient-to-r from-primary-500 to-secondary-500',
    };

    return (
        <div className="relative">
            <ProgressPrimitive.Root
                ref={ref}
                className={cn(
                    'relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-700',
                    className
                )}
                {...props}
            >
                <ProgressPrimitive.Indicator
                    className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        variantClasses[variant]
                    )}
                    style={{ width: `${value || 0}%` }}
                />
            </ProgressPrimitive.Root>
            {showLabel && (
                <span className="absolute right-0 -top-5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {Math.round(value || 0)}%
                </span>
            )}
        </div>
    );
});
Progress.displayName = 'Progress';

export { Progress };
