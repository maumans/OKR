import InputError from '@/Components/InputError';
import { Label } from '@/Components/ui/Label';
import { Input } from '@/Components/ui/Input';
import { Button } from '@/Components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/Components/ui/Dialog';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Trash2, Lock, AlertTriangle } from 'lucide-react';

export default function DeleteUserForm() {
    const [open, setOpen] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    });

    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setOpen(false);
        clearErrors();
        reset();
    };

    return (
        <section>
            <div className="mb-5">
                <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Supprimer le compte</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                </p>
            </div>

            <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer le compte
            </Button>

            <Dialog open={open} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <DialogTitle className="text-red-600 dark:text-red-400">Supprimer le compte ?</DialogTitle>
                        </div>
                        <DialogDescription>
                            Cette action est irréversible. Toutes les données liées à votre compte seront définitivement effacées.
                            Veuillez entrer votre mot de passe pour confirmer.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={deleteUser} className="space-y-4 mt-2">
                        <div>
                            <Label htmlFor="delete_password" className="sr-only">Mot de passe</Label>
                            <Input
                                id="delete_password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                isFocused
                                icon={Lock}
                                placeholder="Confirmez votre mot de passe"
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="flex justify-end gap-3 pt-1">
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={processing}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer définitivement
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
