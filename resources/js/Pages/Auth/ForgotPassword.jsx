import InputError from '@/Components/InputError';
import { Label } from '@/Components/ui/Label';
import { Input } from '@/Components/ui/Input';
import { Button } from '@/Components/ui/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';

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

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mot de passe oublié ?</h2>
                <p className="text-sm text-slate-500 mt-2">
                    Indiquez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-400">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        icon={Mail}
                        placeholder="votre@email.com"
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="pt-2">
                    <Button className="w-full bg-primary-500 hover:bg-primary-600" disabled={processing}>
                        Envoyer le lien de réinitialisation
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
