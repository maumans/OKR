import { useState, useRef, useCallback } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/Button';
import { Label } from '@/Components/ui/Label';
import { NativeSelect as Select } from '@/Components/ui/Select';
import { SearchableSelect } from '@/Components/ui/SearchableSelect';
import {
    Upload, CheckCircle2, AlertCircle, Download, X,
    LayoutGrid, List, Activity, Building2, UserPlus,
    TrendingUp, BarChart3, Briefcase, FileSpreadsheet,
    ArrowLeft, Info,
} from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────

const STATUTS_INITIAL = [
    { value: 'decouverte',  label: 'Découverte' },
    { value: 'proposition', label: 'Proposition' },
    { value: 'negociation', label: 'Négociation' },
];

const COLONNES = [
    { name: 'nom',     requis: true,  desc: 'Nom de l\'entreprise ou du prospect' },
    { name: 'secteur', requis: false, desc: 'Secteur d\'activité' },
    { name: 'contact', requis: false, desc: 'Nom du contact / interlocuteur' },
    { name: 'valeur',  requis: false, desc: 'Montant estimé du deal (numérique)' },
    { name: 'titre',   requis: false, desc: 'Intitulé de l\'opportunité' },
    { name: 'source',  requis: false, desc: 'Origine : linkedin, referral…' },
    { name: 'note',    requis: false, desc: 'Notes libres' },
];

const SIDEBAR_ITEMS = [
    { key: 'crm',      label: 'Prospects & Clients',   icon: Briefcase,  href: 'prospects.index' },
    { key: 'import',   label: 'Importer XLSX',          icon: Upload,     href: 'prospects.import.index', active: true },
    { key: 'kanban',   label: 'Pipeline Kanban',        icon: LayoutGrid, href: 'prospects.index' },
    { key: 'liste',    label: 'Liste des deals',         icon: List,       href: 'prospects.index' },
    { key: 'activites',label: 'Activités commerciales', icon: Activity,   href: 'prospects.index' },
    { key: 'clients',  label: 'Clients',                 icon: Building2,  href: 'prospects.index' },
    { key: 'nouveaux', label: 'Nouveaux clients',        icon: UserPlus,   href: 'prospects.index' },
    { key: 'upsells',  label: 'Upsells',                 icon: TrendingUp, href: 'prospects.index' },
    { key: 'stats',    label: 'Stats & Consolidation',   icon: BarChart3,  href: 'prospects.index' },
];

function fmt(n) {
    if (!n && n !== 0) return '—';
    const num = parseFloat(String(n).replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(num)) return n;
    return new Intl.NumberFormat('fr-FR').format(num);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProspectionImport({
    preview    = null,
    options    = {},
    nomFichier = null,
    collaborateurs = [],
}) {
    const { flash, errors } = usePage().props;

    const [dragging, setDragging]           = useState(false);
    const [file, setFile]                   = useState(null);
    const [dedup, setDedup]                 = useState(options.dedup ?? true);
    const [statutInitial, setStatutInitial] = useState(options.statut_initial ?? 'decouverte');
    const [collabId, setCollabId]           = useState(String(options.collaborateur_id ?? ''));
    const [parsing, setParsing]             = useState(false);
    const [committing, setCommitting]       = useState(false);

    const fileInputRef = useRef();

    // ── Handlers fichier ──────────────────────────────────────

    const setFichier = (f) => {
        if (!f) return;
        const ext = f.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            alert('Format non supporté. Utilisez .xlsx, .xls ou .csv');
            return;
        }
        setFile(f);
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        setFichier(e.dataTransfer.files[0]);
    }, []);

    // ── Parse ─────────────────────────────────────────────────

    const handleParse = () => {
        if (!file) return;
        setParsing(true);
        const fd = new FormData();
        fd.append('fichier', file);
        fd.append('dedup', dedup ? '1' : '0');
        fd.append('statut_initial', statutInitial);
        if (collabId) fd.append('collaborateur_id', collabId);

        router.post(route('prospects.import.parse'), fd, {
            forceFormData: true,
            onFinish: () => setParsing(false),
        });
    };

    // ── Commit ────────────────────────────────────────────────

    const handleCommit = () => {
        if (!window.confirm(`Importer ${preview.length} prospect(s) dans le CRM ?`)) return;
        setCommitting(true);
        router.post(route('prospects.import.commit'), {}, {
            onFinish: () => setCommitting(false),
        });
    };

    // ── Reset ─────────────────────────────────────────────────

    const handleReset = () => {
        router.post(route('prospects.import.reset'));
    };

    // ── Template CSV ──────────────────────────────────────────

    const downloadTemplate = () => {
        const lines = [
            'nom;secteur;contact;valeur;titre;source;note',
            'BICIGUI;banque;Mamadou Diallo;95000000;Intégration SI;referral;Banque prioritaire',
            'Orange Guinée;telecom;Kadiatou Bah;50000000;;linkedin;',
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'modele_prospects.csv';
        a.click(); URL.revokeObjectURL(url);
    };

    // ── Render ────────────────────────────────────────────────

    return (
        <AppLayout title="Import XLSX — Prospects">
            <div className="flex gap-0">

                {/* ── Sidebar ─────────────────────────────────────────── */}
                <aside className="w-52 shrink-0 border-r border-gray-100 dark:border-dark-700 pr-3 mr-5 sticky top-20 self-start">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">MINI CRM</p>
                    <nav className="space-y-0.5">
                        {SIDEBAR_ITEMS.map(item => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.key} href={route(item.href)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${
                                        item.active
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800'
                                    }`}>
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* ── Contenu principal ───────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary-500 flex items-center justify-center shrink-0 shadow-sm">
                            <Upload className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Import XLSX — Prospects</h1>
                            <p className="text-[11px] text-gray-400">Importez votre liste de prospects depuis un fichier Excel ou CSV</p>
                        </div>
                    </div>

                    {/* Flash */}
                    {flash?.success && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />{flash.success}
                        </div>
                    )}
                    {(flash?.error || errors?.fichier) && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />{flash?.error || errors?.fichier}
                        </div>
                    )}

                    {/* ═══════════════ ÉTAPE 1 : Upload ═══════════════ */}
                    {!preview ? (
                        <>
                            {/* Zone drag & drop */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current.click()}
                                className={`relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-all select-none ${
                                    dragging
                                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10 scale-[1.01]'
                                        : file
                                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                                            : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-900 hover:border-primary-300 hover:bg-primary-50/30 dark:hover:bg-primary-900/5'
                                }`}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={e => setFichier(e.target.files[0])}
                                />

                                {file ? (
                                    <>
                                        <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                                            <FileSpreadsheet className="h-7 w-7 text-emerald-500" />
                                        </div>
                                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">{file.name}</p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            {(file.size / 1024).toFixed(1)} Ko · Cliquez pour changer
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center mb-4">
                                            <Upload className="h-7 w-7 text-gray-400" />
                                        </div>
                                        <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Glissez votre fichier ici</p>
                                        <p className="text-[11px] text-gray-400 mt-1">ou cliquez pour sélectionner</p>
                                        <div className="flex items-center gap-2 mt-4">
                                            {['.xlsx', '.xls', '.csv'].map(ext => (
                                                <span key={ext} className="px-2 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 rounded">
                                                    {ext}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Options */}
                            <div className="p-5 bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Options d'import</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <Label className="mb-1.5 block">Statut initial</Label>
                                        <Select value={statutInitial} onChange={e => setStatutInitial(e.target.value)}>
                                            {STATUTS_INITIAL.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </Select>
                                        <p className="text-[10px] text-gray-400 mt-1">Étape pipeline assignée à l'import</p>
                                    </div>
                                    <div>
                                        <Label className="mb-1.5 block">Responsable assigné</Label>
                                        <SearchableSelect
                                            value={collabId}
                                            onChange={setCollabId}
                                            options={collaborateurs.map(c => ({ value: String(c.id), label: `${c.prenom} ${c.nom}` }))}
                                            nullable nullLabel="— Non assigné —"
                                            placeholder="Rechercher…"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Assigner tous les prospects à un collab</p>
                                    </div>
                                    <div className="flex items-start gap-3 pt-1">
                                        <input
                                            id="dedup"
                                            type="checkbox"
                                            checked={dedup}
                                            onChange={e => setDedup(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div>
                                            <label htmlFor="dedup" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                                                Dédupliquer par nom
                                            </label>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Ignorer les prospects dont le nom existe déjà</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Format attendu */}
                            <div className="p-5 bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Format de fichier attendu</h3>
                                    <button
                                        onClick={e => { e.stopPropagation(); downloadTemplate(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                                        <Download className="h-3.5 w-3.5" /> Télécharger le modèle
                                    </button>
                                </div>

                                {/* Aperçu du format */}
                                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-dark-700 mb-4">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50 dark:bg-dark-800">
                                            <tr>
                                                {COLONNES.map(col => (
                                                    <th key={col.name} className="text-left px-3 py-2 font-mono text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
                                                        {col.name}{col.requis && <span className="text-red-500 ml-0.5">*</span>}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-t border-gray-100 dark:border-dark-700">
                                                <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">BICIGUI</td>
                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">banque</td>
                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Mamadou Diallo</td>
                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">95 000 000</td>
                                                <td className="px-3 py-2 text-gray-400">Intégration SI</td>
                                                <td className="px-3 py-2 text-gray-400">referral</td>
                                                <td className="px-3 py-2 text-gray-400">Banque prioritaire</td>
                                            </tr>
                                            <tr className="border-t border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/30">
                                                <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">Orange Guinée</td>
                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">telecom</td>
                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Kadiatou Bah</td>
                                                <td className="px-3 py-2 text-gray-400">—</td>
                                                <td className="px-3 py-2 text-gray-400">—</td>
                                                <td className="px-3 py-2 text-gray-400">linkedin</td>
                                                <td className="px-3 py-2 text-gray-400">—</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                                    <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                    <div className="text-[11px] text-blue-700 dark:text-blue-300 space-y-0.5">
                                        <p><span className="font-semibold">Colonne obligatoire :</span> nom</p>
                                        <p><span className="font-semibold">Optionnelles :</span> secteur · contact · valeur · titre · source · note</p>
                                        <p className="text-blue-500">Les noms de colonnes sont insensibles à la casse. Les colonnes inconnues sont ignorées.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton analyser */}
                            <div className="flex justify-end gap-3">
                                <Link href={route('prospects.index')}>
                                    <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour au CRM</Button>
                                </Link>
                                <Button onClick={handleParse} disabled={!file || parsing} className="min-w-[180px]">
                                    {parsing ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                            Analyse en cours…
                                        </span>
                                    ) : (
                                        <><FileSpreadsheet className="h-4 w-4 mr-1.5" />Analyser le fichier</>
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : (
                        /* ═══════════════ ÉTAPE 2 : Aperçu ═══════════════ */
                        <>
                            {/* Header aperçu */}
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-primary-500" />
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{nomFichier}</span>
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                                            {preview.length} prospect(s)
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Statut initial : <span className="font-medium text-gray-600 dark:text-gray-300">
                                            {STATUTS_INITIAL.find(s => s.value === options.statut_initial)?.label ?? 'Découverte'}
                                        </span>
                                        {(options.dedup === true || options.dedup === '1') && (
                                            <span className="ml-2 text-amber-600 dark:text-amber-400">· Déduplication activée</span>
                                        )}
                                        {options.collaborateur_id && (
                                            <span className="ml-2">· Responsable assigné</span>
                                        )}
                                    </p>
                                </div>
                                <button onClick={handleReset}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded">
                                    <X className="h-3.5 w-3.5" /> Recommencer
                                </button>
                            </div>

                            {/* Tableau aperçu */}
                            <div className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                                <div className="overflow-x-auto" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-gray-50 dark:bg-dark-800 z-10">
                                            <tr className="border-b border-gray-100 dark:border-dark-700">
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-10">#</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nom *</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Secteur</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valeur</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Titre</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Source</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i}
                                                    className={`border-b border-gray-50 dark:border-dark-800 hover:bg-primary-50/30 dark:hover:bg-primary-900/5 transition-colors ${
                                                        i % 2 === 1 ? 'bg-gray-50/40 dark:bg-dark-800/20' : ''
                                                    }`}>
                                                    <td className="px-4 py-2 text-gray-400 tabular-nums">{i + 1}</td>
                                                    <td className="px-4 py-2 font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                                                        {row.nom || <span className="text-red-400 italic">vide</span>}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {row.secteur ? (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                                {row.secteur}
                                                            </span>
                                                        ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                        {row.contact || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                                        {row.valeur ? fmt(row.valeur) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400 max-w-[140px] truncate">
                                                        {row.titre || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                        {row.source || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-400 max-w-[160px] truncate">
                                                        {row.note || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{preview.length}</span> prospect(s) prêt(s) à être importés dans le CRM.
                                    {(options.dedup === true || options.dedup === '1') && (
                                        <span className="ml-1 text-amber-600 dark:text-amber-400">Les doublons seront ignorés.</span>
                                    )}
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" onClick={handleReset}>
                                        <X className="h-4 w-4 mr-1.5" />Annuler
                                    </Button>
                                    <Button
                                        onClick={handleCommit}
                                        disabled={committing || preview.length === 0}
                                        className="min-w-[220px] bg-emerald-600 hover:bg-emerald-700">
                                        {committing ? (
                                            <span className="flex items-center gap-2">
                                                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                                Import en cours…
                                            </span>
                                        ) : (
                                            <><CheckCircle2 className="h-4 w-4 mr-1.5" />Importer {preview.length} prospect(s)</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
