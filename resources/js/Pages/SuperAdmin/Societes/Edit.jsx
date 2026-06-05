import { useState } from 'react';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { Link, router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import { Building2, ArrowLeft, Save } from 'lucide-react';

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-[11px] text-rose-500">{error}</p>}
        </div>
    );
}

function TextInput({ error, ...props }) {
    return (
        <input
            {...props}
            className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 ${error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
        />
    );
}

export default function SocieteEdit({ societe, devises }) {
    const [form, setForm] = useState({
        nom: societe.nom || '',
        email: societe.email || '',
        layout_mode: societe.layout_mode || 'sidebar',
        devise_id: societe.devise_id || '',
        couleur_primaire: societe.couleur_primaire || '#3b82f6',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.put(route('superadmin.societes.update', societe.id), form, {
            onError: (errs) => { setErrors(errs); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <SuperAdminLayout
            title={`Modifier — ${societe.nom}`}
            breadcrumb={[
                { label: 'Sociétés', href: route('superadmin.societes.index') },
                { label: societe.nom, href: route('superadmin.societes.show', societe.id) },
                { label: 'Modifier' },
            ]}
        >
            <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href={route('superadmin.societes.show', societe.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-[13px] font-bold"
                        style={{ backgroundColor: societe.couleur_primaire || '#6366f1' }}
                    >
                        {societe.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Modifier {societe.nom}</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                        <Field label="Nom de la société" required error={errors.nom}>
                            <TextInput
                                value={form.nom}
                                onChange={e => set('nom', e.target.value)}
                                placeholder="Acme Corp"
                                required
                                error={errors.nom}
                            />
                        </Field>

                        <Field label="Email de contact" error={errors.email}>
                            <TextInput
                                type="email"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                placeholder="contact@acme.com"
                                error={errors.email}
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Layout">
                                <SearchableSelect value={form.layout_mode} onChange={v => set("layout_mode", v)} options={[{ value: "sidebar", label: "Sidebar" }, { value: "topbar", label: "Topbar" }]} />
                            </Field>

                            <Field label="Devise">
                                <SearchableSelect value={form.devise_id} onChange={v => set("devise_id", v)} options={devises.map(d => ({ value: String(d.id), label: d.code + " — " + d.nom }))} nullable nullLabel="— Devise —" />
                            </Field>
                        </div>

                        <Field label="Couleur primaire">
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={form.couleur_primaire}
                                    onChange={e => set('couleur_primaire', e.target.value)}
                                    className="h-9 w-14 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                                />
                                <span className="text-[13px] font-mono text-slate-600 dark:text-slate-400">{form.couleur_primaire}</span>
                            </div>
                        </Field>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4">
                        <Link
                            href={route('superadmin.societes.show', societe.id)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" /> {submitting ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </SuperAdminLayout>
    );
}
