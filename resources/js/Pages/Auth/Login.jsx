import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { Label } from '@/Components/ui/Label';
import { Input } from '@/Components/ui/Input';
import { Button } from '@/Components/ui/Button';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Connexion" />

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bon retour</h2>
                <p className="text-sm text-slate-500 mt-2">Veuillez saisir vos identifiants pour vous connecter.</p>
            </div>

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        icon={Mail}
                        placeholder="Entrez votre e-mail"
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        icon={Lock}
                        placeholder="Entrez votre mot de passe"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-slate-300 text-primary-600 shadow-sm focus:ring-primary-500"
                        />
                        <span className="ms-2 text-sm text-slate-600 dark:text-slate-400">Se souvenir de moi</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-medium text-primary-600 hover:text-primary-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Mot de passe oublié ?
                        </Link>
                    )}
                </div>

                <div className="pt-2">
                    <Button className="w-full bg-primary-500 hover:bg-primary-600" disabled={processing}>
                        Se connecter
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
