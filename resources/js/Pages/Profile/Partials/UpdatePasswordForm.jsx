import InputError from '@/Components/InputError';
import { Label } from '@/Components/ui/Label';
import { Input } from '@/Components/ui/Input';
import { Button } from '@/Components/ui/Button';
import { useForm } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordForm() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const [showSaved, setShowSaved] = useState(false);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (recentlySuccessful) {
            setShowSaved(true);
            const t = setTimeout(() => setShowSaved(false), 3000);
            return () => clearTimeout(t);
        }
    }, [recentlySuccessful]);

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section>
            <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Modifier le mot de passe</h2>
                <p className="text-sm text-slate-500 mt-0.5">Utilisez un mot de passe long et aléatoire pour sécuriser votre compte.</p>
            </div>

            <form onSubmit={updatePassword} className="space-y-4">
                <div>
                    <Label htmlFor="current_password">Mot de passe actuel</Label>
                    <Input
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        icon={Lock}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.current_password} className="mt-2" />
                </div>

                <div>
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        icon={Lock}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
                    <Input
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        icon={Lock}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

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
