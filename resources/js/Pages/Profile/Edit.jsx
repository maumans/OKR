import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.collaborateur?.isAdmin ?? false;

    return (
        <AppLayout title="Mon profil">
            <Head title="Profil" />

            <div className="space-y-6 max-w-2xl">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mon profil</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez vos informations personnelles et la sécurité de votre compte.</p>
                </div>

                <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm p-6">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </div>

                <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm p-6">
                    <UpdatePasswordForm />
                </div>

                {isAdmin && (
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm p-6">
                        <DeleteUserForm />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
