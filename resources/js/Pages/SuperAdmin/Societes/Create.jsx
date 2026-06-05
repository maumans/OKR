import { useState } from 'react';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import { router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import { Building2, Users, Package, Check, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
    { id: 1, label: 'Société',  icon: Building2 },
    { id: 2, label: 'Modules',  icon: Package },
    { id: 3, label: 'Admin',    icon: Users },
];

const CATEGORIES = [
    { key: 'MANAGEMENT',      label: 'Management' },
    { key: 'BUSINESS',        label: 'Business' },
    { key: 'ANALYTIQUE',      label: 'Analytique' },
    { key: 'ADMINISTRATION',  label: 'Administration' },
];

function Stepper({ current }) {
    return (
        <div className="flex items-center mb-8">
            {STEPS.map((step, i) => {
                const done   = current > step.id;
                const active = current === step.id;
                const Icon   = step.icon;
                return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex items-center gap-2 shrink-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <span className={`text-[13px] font-medium hidden sm:block ${active ? 'text-slate-900 dark:text-white' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-px mx-3 ${done ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

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

export default function SocieteCreate({ modules, devises }) {
    const [step, setStep]           = useState(1);
    const [errors, setErrors]       = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        // Étape 1
        nom: '', email: '', layout_mode: 'sidebar', devise_id: '', couleur_primaire: '#3b82f6',
        // Étape 2
        modules_actifs: [],
        // Étape 3
        admin_prenom: '', admin_nom: '', admin_email: '', admin_password: '',
        envoyer_email: false,
    });

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const toggleModule = (id) => {
        set('modules_actifs', form.modules_actifs.includes(id)
            ? form.modules_actifs.filter(x => x !== id)
            : [...form.modules_actifs, id]
        );
    };

    const selectAll = (mods) => {
        const ids = mods.map(m => m.id);
        const allSelected = ids.every(id => form.modules_actifs.includes(id));
        if (allSelected) {
            set('modules_actifs', form.modules_actifs.filter(id => !ids.includes(id)));
        } else {
            const merged = [...new Set([...form.modules_actifs, ...ids])];
            set('modules_actifs', merged);
        }
    };

    const coreModules     = modules.filter(m => m.est_core);
    const optionalModules = modules.filter(m => !m.est_core);

    const groupedModules = CATEGORIES.reduce((acc, { key, label }) => {
        const mods = optionalModules.filter(m => m.categorie === key);
        if (mods.length) acc.push({ key, label, mods });
        return acc;
    }, []);

    // Modules non couverts par CATEGORIES
    const knownKeys  = CATEGORIES.map(c => c.key);
    const otherMods  = optionalModules.filter(m => !knownKeys.includes(m.categorie));
    if (otherMods.length) groupedModules.push({ key: 'AUTRE', label: 'Autres', mods: otherMods });

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(route('superadmin.societes.store'), {
            ...form,
            devise_id: form.devise_id || null,
            plan: null,
        }, {
            onError:  (errs) => { setErrors(errs); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
        });
    };

    const canNext = () => {
        if (step === 1) return form.nom.trim().length > 0;
        if (step === 3) return form.admin_prenom && form.admin_nom && form.admin_email && form.admin_password;
        return true;
    };

    return (
        <SuperAdminLayout
            title="Nouvelle société"
            breadcrumb={[
                { label: 'Sociétés', href: route('superadmin.societes.index') },
                { label: 'Nouvelle société' },
            ]}
        >
            <div className="max-w-2xl mx-auto">
                <Stepper current={step} />

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">

                    {/* ── Étape 1 — Société ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-5">
                                <Building2 className="h-5 w-5 text-indigo-500" /> Informations société
                            </h3>

                            <Field label="Nom de la société" required error={errors.nom}>
                                <TextInput value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex : Acme Corp" error={errors.nom} />
                            </Field>

                            <Field label="Email de contact" error={errors.email}>
                                <TextInput type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@acme.com" />
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
                                    <input type="color" value={form.couleur_primaire} onChange={e => set('couleur_primaire', e.target.value)}
                                        className="h-9 w-14 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" />
                                    <span className="text-[13px] font-mono text-slate-500">{form.couleur_primaire}</span>
                                </div>
                            </Field>
                        </div>
                    )}

                    {/* ── Étape 2 — Modules ── */}
                    {step === 2 && (
                        <div>
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Package className="h-5 w-5 text-indigo-500" /> Modules à activer
                                    </h3>
                                    <p className="text-[12px] text-slate-400 mt-0.5">
                                        {form.modules_actifs.length} module{form.modules_actifs.length > 1 ? 's' : ''} sélectionné{form.modules_actifs.length > 1 ? 's' : ''} (hors core)
                                    </p>
                                </div>
                            </div>

                            {/* Modules Core */}
                            <div className="mb-5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Core — toujours actifs
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {coreModules.map(m => (
                                        <span key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                                            <Check className="h-3 w-3" /> {m.nom}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Modules optionnels par catégorie */}
                            <div className="space-y-5">
                                {groupedModules.map(({ key, label, mods }) => {
                                    const allSel = mods.every(m => form.modules_actifs.includes(m.id));
                                    return (
                                        <div key={key}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                                                <button type="button" onClick={() => selectAll(mods)}
                                                    className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium">
                                                    {allSel ? 'Tout désélectionner' : 'Tout sélectionner'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {mods.map(m => {
                                                    const selected = form.modules_actifs.includes(m.id);
                                                    return (
                                                        <button key={m.id} type="button" onClick={() => toggleModule(m.id)}
                                                            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${selected
                                                                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-600'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                            <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'}`}>
                                                                {selected && <Check className="h-3 w-3 text-white" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">{m.nom}</p>
                                                                {m.est_premium && (
                                                                    <span className="text-[10px] text-amber-500 font-semibold">Premium</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Étape 3 — Admin ── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-5">
                                <Users className="h-5 w-5 text-indigo-500" /> Administrateur principal
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Prénom" required error={errors.admin_prenom}>
                                    <TextInput value={form.admin_prenom} onChange={e => set('admin_prenom', e.target.value)} error={errors.admin_prenom} />
                                </Field>
                                <Field label="Nom" required error={errors.admin_nom}>
                                    <TextInput value={form.admin_nom} onChange={e => set('admin_nom', e.target.value)} error={errors.admin_nom} />
                                </Field>
                            </div>

                            <Field label="Email" required error={errors.admin_email}>
                                <TextInput type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} placeholder="admin@acme.com" error={errors.admin_email} />
                            </Field>

                            <Field label="Mot de passe initial" required error={errors.admin_password}>
                                <TextInput type="text" value={form.admin_password} onChange={e => set('admin_password', e.target.value)} placeholder="Min. 6 caractères" error={errors.admin_password} />
                            </Field>

                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input type="checkbox" checked={form.envoyer_email} onChange={e => set('envoyer_email', e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-[13px] text-slate-600 dark:text-slate-400">Envoyer l'email d'invitation à l'administrateur</span>
                            </label>

                            {/* Récapitulatif */}
                            <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-[12px]">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Récapitulatif</p>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Société</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{form.nom}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Modules sélectionnés</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                                        {form.modules_actifs.length} optionnel{form.modules_actifs.length > 1 ? 's' : ''} + {coreModules.length} core
                                    </span>
                                </div>
                                {form.modules_actifs.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {modules.filter(m => form.modules_actifs.includes(m.id)).map(m => (
                                            <span key={m.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white" style={{ backgroundColor: m.couleur || '#6366f1' }}>
                                                {m.nom}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Navigation ── */}
                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft className="h-4 w-4" /> Précédent
                        </button>

                        {step < 3 ? (
                            <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                Suivant <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={submitting || !canNext()}
                                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                                <Check className="h-4 w-4" /> {submitting ? 'Création...' : 'Créer la société'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
