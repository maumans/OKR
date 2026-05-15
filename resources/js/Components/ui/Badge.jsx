import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600',
                primary:
                    'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400',
                secondary:
                    'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-400',
                destructive:
                    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
                success:
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                warning:
                    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                outline:
                    'border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-300 bg-transparent',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

function Badge({ className, variant, ...props }) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
