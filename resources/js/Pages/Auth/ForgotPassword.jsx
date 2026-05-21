import { Input } from '@/Components/ui/Input';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, ArrowLeft, Loader2, Send } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Mot de passe oublié" />

            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 mb-5">
                    <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-[1.6rem] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Mot de passe oublié ?
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Indiquez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
                </p>
            </div>

            {status && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
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
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        icon={Mail}
                        placeholder="vous@exemple.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-2 w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2"
                >
                    {processing
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />
                    }
                    {processing ? 'Envoi…' : 'Envoyer le lien'}
                </button>

                <div className="pt-1 text-center">
                    <Link
                        href={route('login')}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Retour à la connexion
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
