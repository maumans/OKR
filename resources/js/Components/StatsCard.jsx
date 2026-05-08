import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    variant = 'default',
    className,
    delay = 0,
}) {
    const variantStyles = {
        default: 'from-primary-500/10 to-primary-500/5 border-primary-500/20',
        secondary: 'from-secondary-500/10 to-secondary-500/5 border-secondary-500/20',
        success: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
        warning: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
        danger: 'from-red-500/10 to-red-500/5 border-red-500/20',
    };

    const iconStyles = {
        default: 'bg-primary-500/10 text-primary-500',
        secondary: 'bg-secondary-500/10 text-secondary-500',
        success: 'bg-emerald-500/10 text-emerald-500',
        warning: 'bg-amber-500/10 text-amber-500',
        danger: 'bg-red-500/10 text-red-500',
    };

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: delay * 0.1 }}
            className={cn(
                'relative overflow-hidden rounded-2xl border bg-white dark:bg-dark-800 p-6',
                'bg-gradient-to-br',
                'shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5',
                variantStyles[variant],
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {subtitle}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={cn('rounded-xl p-3', iconStyles[variant])}>
                        <Icon className="h-6 w-6" />
                    </div>
                )}
            </div>

            {trendValue !== undefined && (
                <div className={cn('mt-4 flex items-center gap-1 text-xs font-medium', trendColor)}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    <span>{trendValue}%</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1">vs mois dernier</span>
                </div>
            )}

            {/* Decorative gradient orb */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-current opacity-[0.03]" />
        </motion.div>
    );
}
