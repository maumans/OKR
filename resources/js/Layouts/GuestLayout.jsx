import { Link } from '@inertiajs/react';
import { Target } from 'lucide-react';

export default function Guest({ children }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-slate-50 dark:bg-dark-950 px-4">
            <div>
                <Link href="/" className="flex flex-col items-center gap-3">
                    <div className="bg-primary-500 text-white p-3 rounded-xl shadow-lg shadow-primary-500/20">
                        <Target className="h-10 w-10" />
                    </div>
                    <div className="text-center">
                        <h1 className="font-bold text-2xl leading-tight text-slate-900 dark:text-white">Addvalis SaaS</h1>
                        <p className="text-xs tracking-widest text-slate-500 font-semibold uppercase mt-1">Performance</p>
                    </div>
                </Link>
            </div>

            <div className="w-full sm:max-w-md mt-8 px-8 py-10 bg-white dark:bg-dark-900 shadow-card border border-slate-200 dark:border-dark-800 rounded-2xl">
                {children}
            </div>
        </div>
    );
}
