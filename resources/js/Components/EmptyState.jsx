import { cn } from '@/lib/utils';

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}) {
    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-16 px-4 text-center',
            className
        )}>
            {Icon && (
                <div className="mb-4 rounded-2xl bg-gray-100 dark:bg-dark-700 p-4">
                    <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                    {description}
                </p>
            )}
            {action && action}
        </div>
    );
}
