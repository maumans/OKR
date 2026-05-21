import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Input } from '@/Components/ui/Input';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => reset('password');
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Connexion" />

            <div className="mb-8">
                <h1 className="text-[1.6rem] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Bon retour
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Connectez-vous à votre espace de performance.
                </p>
            </div>

            {status && (
                <div className="mb-5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Adresse e-mail
                    </label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        icon={Mail}
                        placeholder="vous@exemple.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Mot de passe
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                                Oublié ?
                            </Link>
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        icon={Lock}
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                    <input
                        id="remember"
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                        Se souvenir de moi
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-2 w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2"
                >
                    {processing
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <LogIn className="h-4 w-4" />
                    }
                    {processing ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>
        </GuestLayout>
    );
}
