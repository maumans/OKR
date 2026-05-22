import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/Select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription,
} from '@/Components/ui/Dialog';
import { NumberInput } from '@/Components/ui/NumberInput';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BarChart3, Download, Lock, Pencil, CheckCircle, AlertTriangle, Users, TrendingUp } from 'lucide-react';

// ─── Couleur selon seuils ─────────────────────────────────────
function couleurScore(score, seuils) {
    if (seuils && seuils.length > 0) {
        const match = [...seuils]
            .sort((a, b) => b.seuil_min - a.seuil_min)
            .find(s => score >= s.seuil_min);
        if (match) return match.couleur;
    }
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
}

// ─── Avatar collaborateur ─────────────────────────────────────
function AvatarCollab({ couleur, initiales, size = 36 }) {
    return (
        <div
            className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
            style={{ width: size, height: size, backgroundColor: couleur, fontSize: Math.round(size * 0.35) }}
        >
            {initiales}
        </div>
    );
}

// ─── Modal édition prime ──────────────────────────────────────
function PrimeMensuelleDialog({ open, onClose, collab, prime, mois, devise }) {
    const [form, setForm] = useState({
        montant_max:         prime?.montant_max ?? 0,
        seuil_pourcentage:   prime?.seuil_pourcentage ?? 80,
        commentaire_manager: prime?.commentaire_manager ?? '',
        validee:             prime?.validee ?? false,
    });
    const [errors, setErrors] = useState({});

    const handleSubmit = () => {
        router.put(
            route('synthese.primes.update', [collab.id, mois]),
            form,
            {
                preserveState: true,
                onSuccess: () => onClose(),
                onError: (e) => setErrors(e),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-primary-500" />
                        Prime — {collab.prenom} {collab.nom}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Prime maximum
                        </label>
                        <NumberInput
                            value={form.montant_max}
                            onChange={(v) => setForm(f => ({ ...f, montant_max: v }))}
                            suffix={devise?.code ?? 'GNF'}
                            decimals={0}
                            error={errors.montant_max}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Seuil d'atteinte (%)
                        </label>
                        <NumberInput
                            value={form.seuil_pourcentage}
                            onChange={(v) => setForm(f => ({ ...f, seuil_pourcentage: v }))}
                            suffix="%"
                            decimals={0}
                            error={errors.seuil_pourcentage}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Commentaire manager
                        </label>
                        <textarea
                            rows={3}
                            value={form.commentaire_manager}
                            onChange={(e) => setForm(f => ({ ...f, commentaire_manager: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none"
                            placeholder="Remarques, justification…"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.validee}
                            onChange={(e) => setForm(f => ({ ...f, validee: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Prime validée et accordée
                        </span>
                    </label>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={handleSubmit}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Dialog confirmation clôture ─────────────────────────────
function CloturDialog({ open, onClose, onConfirm, loading }) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Clôturer le mois ?</DialogTitle>
                    <DialogDescription>
                        Un snapshot de toutes les données du mois sera créé et archivé dans l'historique. Cette action peut être répétée.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={onConfirm} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
                        {loading ? 'Génération…' : 'Confirmer la clôture'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Carte collaborateur ──────────────────────────────────────
function SynthCard({ data, mois, seuils, devise, onEdit, isAdmin }) {
    const { collaborateur: c, score_global, nb_objectifs, objectifs, prime, prime_acquise, prospection } = data;
    const couleur = couleurScore(score_global, seuils);

    return (
        <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-center gap-3 border-b border-gray-100 dark:border-dark-800">
                <AvatarCollab couleur={c.couleur} initiales={c.initiales} />
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                        {c.prenom} {c.nom}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{c.poste}</p>
                </div>
            </div>

            {/* Score central */}
            <div className="px-4 py-3 text-center">
                <div className="text-3xl font-extrabold" style={{ color: couleur }}>
                    {formatNumber(score_global, 1)}%
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {nb_objectifs} objectif{nb_objectifs !== 1 ? 's' : ''}
                    {' · '}
                    {prospection.signes} deal{prospection.signes !== 1 ? 's' : ''} signé{prospection.signes !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Top 3 objectifs */}
            {objectifs.length > 0 && (
                <div className="px-4 pb-3 space-y-1">
                    {objectifs.slice(0, 3).map((o, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <span
                                className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                                style={{ backgroundColor: o.axe_couleur || '#6b7280' }}
                            >
                                {(o.axe || '—').slice(0, 3).toUpperCase()}
                            </span>
                            <span className="flex-1 text-[11px] text-gray-700 dark:text-gray-300 truncate">{o.titre}</span>
                            <span className="text-[11px] font-semibold shrink-0" style={{ color: couleurScore(o.score, seuils) }}>
                                {formatNumber(o.score, 0)}%
                            </span>
                        </div>
                    ))}
                    {objectifs.length > 3 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            +{objectifs.length - 3} autre{objectifs.length - 3 > 1 ? 's' : ''} objectif{objectifs.length - 3 > 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            )}

            {/* Bloc prime */}
            <div className="mx-3 mb-3 mt-auto">
                <div className={`rounded-lg p-3 border ${
                    prime_acquise
                        ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800'
                        : 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800'
                }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        {prime_acquise
                            ? <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            : <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        }
                        <span className={`text-[11px] font-semibold ${prime_acquise ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                            {prime_acquise ? 'Prime acquise' : 'Prime non acquise'}
                        </span>
                        {prime?.validee && (
                            <span className="ml-auto text-[9px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded">
                                ✓ Validé
                            </span>
                        )}
                    </div>

                    <div className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {formatCurrency(prime?.montant_max ?? 0, devise)}
                    </div>

                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Score {formatNumber(score_global, 0)}%
                        {prime_acquise ? ' ≥ ' : ' < '}
                        seuil {prime?.seuil_pourcentage ?? 80}%
                    </p>

                    {prime?.commentaire_manager && (
                        <p className="text-[11px] italic text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            "{prime.commentaire_manager}"
                        </p>
                    )}

                    {isAdmin && (
                        <button
                            onClick={() => onEdit(data)}
                            className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <Pencil className="h-3 w-3" />
                            Modifier
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────
export default function SyntheseIndex({ moisActuel, moisOptions, donnees, seuils }) {
    const { auth } = usePage().props;
    const devise = auth.societe?.devise;
    const isAdmin = auth.collaborateur?.isAdmin || auth.collaborateur?.isManager;

    const [editData, setEditData] = useState(null);
    const [showClotureDialog, setShowClotureDialog] = useState(false);
    const [cloturePending, setCloturePending] = useState(false);

    const handleMoisChange = (val) => {
        router.get(route('synthese.index'), { mois: val }, { preserveState: false });
    };

    const handleCloturer = () => {
        setCloturePending(true);
        router.post(route('synthese.cloturer', moisActuel), {}, {
            onFinish: () => {
                setCloturePending(false);
                setShowClotureDialog(false);
            },
        });
    };

    const handleExport = () => {
        window.location.href = route('synthese.export', moisActuel);
    };

    const totalPrimesAccordees = donnees
        .filter(d => d.prime?.validee)
        .reduce((s, d) => s + parseFloat(d.prime?.montant_accorde ?? 0), 0);
    const nbPrimesAcquises = donnees.filter(d => d.prime_acquise).length;
    const scoreMoyen = donnees.length > 0
        ? donnees.reduce((s, d) => s + d.score_global, 0) / donnees.length
        : 0;

    const prospecteurs = donnees.filter(d => d.prospection.total > 0 || d.prospection.signes > 0);

    return (
        <AppLayout title="Synthèse mensuelle">
            <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1600px] mx-auto">

                {/* En-tête */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                            <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Synthèse mensuelle</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pilotage des primes par collaborateur</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={moisActuel} onValueChange={handleMoisChange}>
                            <SelectTrigger className="w-[160px] h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {moisOptions.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                            <Download className="h-3.5 w-3.5" />
                            Export CSV
                        </Button>

                        {isAdmin && (
                            <Button
                                size="sm"
                                onClick={() => setShowClotureDialog(true)}
                                className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                <Lock className="h-3.5 w-3.5" />
                                Clôturer le mois
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats globales */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Collaborateurs', value: donnees.length, icon: Users, color: 'text-blue-600' },
                        { label: 'Score moyen', value: `${formatNumber(scoreMoyen, 1)}%`, icon: BarChart3, color: 'text-violet-600' },
                        { label: 'Primes acquises', value: `${nbPrimesAcquises} / ${donnees.length}`, icon: CheckCircle, color: 'text-green-600' },
                        { label: 'Budget accordé', value: formatCurrency(totalPrimesAccordees, devise), icon: TrendingUp, color: 'text-amber-600' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`h-4 w-4 ${color}`} />
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Grille cartes */}
                {donnees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Aucun objectif individuel pour ce mois.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {donnees.map((data) => (
                            <SynthCard
                                key={data.collaborateur.id}
                                data={data}
                                mois={moisActuel}
                                seuils={seuils}
                                devise={devise}
                                onEdit={setEditData}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </div>
                )}

                {/* Prospection globale */}
                {prospecteurs.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-cyan-500" />
                                Prospection globale équipe
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="grid gap-2"
                                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
                            >
                                {prospecteurs.map((d) => (
                                    <div
                                        key={d.collaborateur.id}
                                        className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700"
                                    >
                                        <AvatarCollab couleur={d.collaborateur.couleur} initiales={d.collaborateur.initiales} size={30} />
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-semibold text-gray-900 dark:text-white truncate">
                                                {d.collaborateur.prenom}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                {d.prospection.total} prospect{d.prospection.total !== 1 ? 's' : ''}
                                                {' · '}
                                                {d.prospection.signes} signé{d.prospection.signes !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal édition prime */}
            {editData && (
                <PrimeMensuelleDialog
                    open={!!editData}
                    onClose={() => setEditData(null)}
                    collab={editData.collaborateur}
                    prime={editData.prime}
                    mois={moisActuel}
                    devise={devise}
                />
            )}

            {/* Dialog clôture */}
            <CloturDialog
                open={showClotureDialog}
                onClose={() => setShowClotureDialog(false)}
                onConfirm={handleCloturer}
                loading={cloturePending}
            />
        </AppLayout>
    );
}
