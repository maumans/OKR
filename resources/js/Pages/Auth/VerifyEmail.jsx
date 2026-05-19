import { Button } from '@/Components/ui/Button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Vérification de l'e-mail" />

            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 mb-4">
                    <MailCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vérifiez votre e-mail</h2>
                <p className="text-sm text-slate-500 mt-2">
                    Merci pour votre inscription ! Cliquez sur le lien envoyé à votre adresse e-mail pour activer votre compte.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-400">
                    Un nouveau lien de vérification a été envoyé à votre adresse e-mail.
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Button className="w-full bg-primary-500 hover:bg-primary-600" disabled={processing}>
                    Renvoyer l'e-mail de vérification
                </Button>

                <div className="text-center">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2"
                    >
                        Se déconnecter
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
