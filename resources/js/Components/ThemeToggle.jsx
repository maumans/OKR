import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';

export default function ThemeToggle({ collapsed = false }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center gap-2 rounded-xl p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
            title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
            <motion.div
                initial={false}
                animate={{ rotate: isDark ? 0 : 180, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {isDark ? (
                    <Moon className="h-5 w-5" />
                ) : (
                    <Sun className="h-5 w-5" />
                )}
            </motion.div>
            {!collapsed && (
                <span className="text-sm font-medium">
                    {isDark ? 'Sombre' : 'Clair'}
                </span>
            )}
        </button>
    );
}
