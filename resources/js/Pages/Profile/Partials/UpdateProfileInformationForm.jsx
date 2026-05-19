import InputError from '@/Components/InputError';
import { Label } from '@/Components/ui/Label';
import { Input } from '@/Components/ui/Input';
import { Button } from '@/Components/ui/Button';
import { Link, useForm, usePage } from '@inertiajs/react';
import { User, Mail, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function UpdateProfileInformationForm({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const [showSaved, setShowSaved] = useState(false);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    useEffect(() => {
        if (recentlySuccessful) {
            setShowSaved(true);
            const t = setTimeout(() => setShowSaved(false), 3000);
            return () => clearTimeout(t);
        }
    }, [recentlySuccessful]);

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section>
            <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Informations du profil</h2>
                <p className="text-sm text-slate-500 mt-0.5">Mettez à jour votre nom et votre adresse e-mail.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="name">Nom</Label>
                    <Input
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                        icon={User}
                        placeholder="Votre nom complet"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        icon={Mail}
                        placeholder="votre@email.com"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            Votre adresse e-mail n'est pas vérifiée.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-300"
                            >
                                Renvoyer l'e-mail de vérification
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                                Lien de vérification envoyé.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                    <Button className="bg-primary-500 hover:bg-primary-600" disabled={processing}>
                        Enregistrer
                    </Button>
                    {showSaved && (
                        <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Enregistré
                        </span>
                    )}
                </div>
            </form>
        </section>
    );
}
