import { Input } from '@/Components/ui/Input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirmer le mot de passe" />

            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 mb-5">
                    <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h1 className="text-[1.6rem] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Zone sécurisée
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Veuillez confirmer votre mot de passe avant de continuer vers cette zone protégée.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Mot de passe
                    </label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoFocus
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        icon={Lock}
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-2 w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2"
                >
                    {processing
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ShieldCheck className="h-4 w-4" />
                    }
                    {processing ? 'Vérification…' : 'Confirmer et continuer'}
                </button>
            </form>
        </GuestLayout>
    );
}
