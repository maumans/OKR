import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/Components/ui/Dialog';
import { Button } from '@/Components/ui/Button';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { BarChart3, History, Eye, CheckCircle, Users, TrendingUp, ArrowLeft } from 'lucide-react';

// ─── Panel détail snapshot ────────────────────────────────────
function SnapshotDetailDialog({ open, onClose, synthese, devise }) {
    if (!synthese) return null;
    const payload = synthese.payload ?? [];

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-4 w-4 text-violet-500" />
                        Snapshot — {synthese.mois_label}
                    </DialogTitle>
                    <DialogDescription>
                        Généré le {synthese.genere_le}
                        {synthese.genere_par && ` par ${synthese.genere_par}`}
                    </DialogDescription>
                </DialogHeader>

                {/* Stats résumé */}
                <div className="grid grid-cols-3 gap-3 my-4">
                    {[
                        { label: 'Collaborateurs', value: synthese.nb_collaborateurs },
                        { label: 'Primes accordées', value: synthese.nb_primes_accordees },
                        { label: 'Budget total', value: formatCurrency(synthese.budget_primes_total, devise) },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Tableau des collaborateurs */}
                {payload.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-700">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">Collaborateur</th>
                                    <th className="px-3 py-2 text-center font-semibold text-gray-600 dark:text-gray-400">Score</th>
                                    <th className="px-3 py-2 text-center font-semibold text-gray-600 dark:text-gray-400">Obj.</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">Prime max</th>
                                    <th className="px-3 py-2 text-center font-semibold text-gray-600 dark:text-gray-400">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                                {payload.map((d, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                                        <td className="px-3 py-2">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {d.collaborateur?.prenom} {d.collaborateur?.nom}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">{d.collaborateur?.poste}</p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`font-bold ${d.score_global >= 80 ? 'text-green-600' : d.score_global >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                                {formatNumber(d.score_global, 1)}%
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                            {d.nb_objectifs}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                                            {formatCurrency(d.prime?.montant_max ?? 0, devise)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {d.prime?.validee ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                                    <CheckCircle className="h-3 w-3" /> Validée
                                                </span>
                                            ) : d.prime_acquise ? (
                                                <span className="text-amber-600 dark:text-amber-400">Acquise</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Page historique ──────────────────────────────────────────
export default function SyntheseHistorique({ syntheses }) {
    const { auth } = usePage().props;
    const devise = auth.societe?.devise;
    const [detail, setDetail] = useState(null);

    return (
        <AppLayout title="Historique des synthèses">
            <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1200px] mx-auto">

                {/* En-tête */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                            <History className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Historique des synthèses</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Snapshots mensuels clôturés</p>
                        </div>
                    </div>

                    <Link href={route('synthese.index')}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Retour
                        </Button>
                    </Link>
                </div>

                {/* Liste des snapshots */}
                {syntheses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Aucun mois clôturé pour l'instant.
                        </p>
                        <Link href={route('synthese.index')} className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                            Aller à la synthèse mensuelle →
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {syntheses.map((s) => (
                            <div
                                key={s.id}
                                className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                            >
                                {/* Mois + date */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg shrink-0">
                                        <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white">{s.mois_label}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                            Généré le {s.genere_le}
                                            {s.genere_par && ` par ${s.genere_par}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats inline */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-gray-400">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{s.nb_collaborateurs} collab.</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-gray-400">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                        <span>{s.nb_primes_accordees} prime{s.nb_primes_accordees !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-800 dark:text-gray-200">
                                        <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                                        <span>{formatCurrency(s.budget_primes_total, devise)}</span>
                                    </div>
                                </div>

                                {/* Bouton voir */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDetail(s)}
                                    className="gap-1.5 shrink-0"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Voir détail
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dialog détail snapshot */}
            <SnapshotDetailDialog
                open={!!detail}
                onClose={() => setDetail(null)}
                synthese={detail}
                devise={devise}
            />
        </AppLayout>
    );
}
