import { Link, router } from '@inertiajs/react';
import SuperAdminLayout from '../Layout';
import { ArrowLeft, Shield, ShieldOff, Building2, Mail, Calendar, LogIn } from 'lucide-react';

export default function UtilisateurShow({ utilisateur }) {
    const handlePromouvoir = () => {
        if (!confirm(`Promouvoir « ${utilisateur.name} » en super-administrateur ?`)) return;
        router.post(route('superadmin.utilisateurs.promouvoir', utilisateur.id), {}, { preserveScroll: true });
    };
    const handleRevoquer = () => {
        if (!confirm(`Révoquer les droits superadmin de « ${utilisateur.name} » ?`)) return;
        router.post(route('superadmin.utilisateurs.revoquer', utilisateur.id), {}, { preserveScroll: true });
    };

    return (
        <SuperAdminLayout
            title={utilisateur.name}
            breadcrumb={[
                { label: 'Utilisateurs', href: route('superadmin.utilisateurs.index') },
                { label: utilisateur.name },
            ]}
        >
            <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Link href={route('superadmin.utilisateurs.index')} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {utilisateur.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">{utilisateur.name}</h2>
                        <p className="text-[12px] text-slate-400">{utilisateur.email}</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Infos */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Informations</h3>
                        <dl className="space-y-3 text-[13px]">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                                <div>
                                    <dt className="text-slate-400">Email</dt>
                                    <dd className="font-medium text-slate-700 dark:text-slate-300">{utilisateur.email}</dd>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                                <div>
                                    <dt className="text-slate-400">Inscrit le</dt>
                                    <dd className="font-medium text-slate-700 dark:text-slate-300">{new Date(utilisateur.created_at).toLocaleDateString('fr-FR')}</dd>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                                <div>
                                    <dt className="text-slate-400">Droits</dt>
                                    <dd>
                                        {utilisateur.is_superadmin ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                <Shield className="h-3 w-3" /> Super-Admin
                                            </span>
                                        ) : (
                                            <span className="text-[12px] text-slate-400">Standard</span>
                                        )}
                                    </dd>
                                </div>
                            </div>
                        </dl>
                    </div>

                    {/* Sociétés */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sociétés ({utilisateur.collaborateurs?.length || 0})</h3>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {(utilisateur.collaborateurs || []).length === 0 && (
                                <p className="px-5 py-4 text-sm text-slate-400 italic">Aucune société</p>
                            )}
                            {(utilisateur.collaborateurs || []).map(c => (
                                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        <div>
                                            <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{c.societe?.nom || '—'}</p>
                                            <p className="text-[11px] text-slate-400 capitalize">{c.role}</p>
                                        </div>
                                    </div>
                                    {c.societe && (
                                        <Link href={route('superadmin.societes.show', c.societe.id)} className="text-[12px] text-indigo-500 hover:text-indigo-600">
                                            Voir →
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Actions</h3>
                        <div className="flex flex-wrap gap-2">
                            {utilisateur.is_superadmin ? (
                                <button onClick={handleRevoquer} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors">
                                    <ShieldOff className="h-4 w-4" /> Révoquer droits superadmin
                                </button>
                            ) : (
                                <button onClick={handlePromouvoir} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
                                    <Shield className="h-4 w-4" /> Promouvoir superadmin
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
