import SuperAdminLayout from '../Layout';
import { Settings, Info } from 'lucide-react';

export default function ParametresIndex() {
    return (
        <SuperAdminLayout title="Paramètres plateforme" breadcrumb={[{ label: 'Paramètres' }]}>
            <div className="max-w-2xl">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4">
                        <Settings className="h-7 w-7 text-indigo-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Paramètres de la plateforme</h3>
                    <p className="text-[13px] text-slate-400">Les paramètres globaux de la plateforme Addvalis seront disponibles ici.</p>
                    <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-start gap-2 text-left">
                        <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-[12px] text-indigo-700 dark:text-indigo-300">
                            Cette section permettra de configurer : les emails de la plateforme, les paramètres SMTP, les limites globales et les options de déploiement.
                        </p>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
