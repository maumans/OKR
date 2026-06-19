import { useState } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Separator } from '@/Components/ui/Separator';
import { NativeSelect as Select } from '@/Components/ui/Select';
import { Badge } from '@/Components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/Table';
import { NumberInput } from '@/Components/ui/NumberInput';
import { CustomDatePicker } from '@/Components/ui/CustomDatePicker';
import { motion } from 'framer-motion';
import {
    Settings, Building2, Palette, Layout, Coins, Save,
    Settings2, Compass, CalendarRange, Target, BarChart3,
    CheckCircle2, Gauge, Award, Plus, Pencil, Trash2,
    Package, Search, Lock, CheckCircle, XCircle, Info,
    LayoutDashboard, User, ListChecks, CalendarCheck, Grid3x3,
    TrendingUp, Briefcase, Gift, GraduationCap, Users, Upload,
    Network, Users2,
} from 'lucide-react';

const LUCIDE_ICONS = {
    LayoutDashboard, Target, User, ListChecks, CalendarCheck,
    Grid3x3, TrendingUp, Briefcase, Gift, GraduationCap,
    BarChart3, Users, Settings, Upload, Package,
};

// ─── Composant CRUD Table réutilisable ───────────────────
function CrudSection({ title, icon: Icon, items, columns, renderRow, onAdd, onEdit, onDelete, addLabel = 'Ajouter' }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary-500" />{title}</span>
                    <Button size="sm" onClick={onAdd}><Plus className="h-4 w-4 mr-1" />{addLabel}</Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, i) => (
                                <TableHead key={i} className={col.className}>{col.label}</TableHead>
                            ))}
                            <TableHead className="text-right w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-20 text-center text-slate-400 italic">
                                    Aucun élément configuré
                                </TableCell>
                            </TableRow>
                        ) : items.map((item) => (
                            <TableRow key={item.id}>
                                {renderRow(item)}
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => onDelete(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// ─── Page principale ─────────────────────────────────────
// ─── Onglet Modules ──────────────────────────────────────────────────────────
function OngletModules({ modules = [], isAdmin }) {
    const [search, setSearch] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState('');
    const [moduleAConfirmer, setModuleAConfirmer] = useState(null);

    const categories = [...new Set(modules.map(m => m.categorie))];
    const modulesAffiches = modules.filter(m => {
        const matchSearch = !search || m.nom.toLowerCase().includes(search.toLowerCase());
        const matchCat = !filtreCategorie || m.categorie === filtreCategorie;
        return matchSearch && matchCat;
    });

    const nbActifs = modules.filter(m => m.actif).length;

    const handleToggle = (module) => {
        if (!isAdmin || module.est_core) return;

        // Vérifier si désactivation d'un module qui a des dépendants actifs
        if (module.actif) {
            const dependants = modules.filter(m => m.actif && (m.dependances || []).includes(module.code));
            if (dependants.length > 0) {
                setModuleAConfirmer({ module, dependants });
                return;
            }
        }
        router.put(route('parametres.modules.toggle', module.code), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const confirmerDesactivation = () => {
        if (!moduleAConfirmer) return;
        router.put(route('parametres.modules.toggle', moduleAConfirmer.module.code), {}, {
            preserveScroll: true,
            preserveState: true,
        });
        setModuleAConfirmer(null);
    };

    const COULEURS_CATEGORIE = {
        CORE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        MANAGEMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        BUSINESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        ANALYTIQUE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        ADMINISTRATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary-500" />
                        Modules activés
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {nbActifs} / {modules.length} modules activés
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filtre catégorie */}
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFiltreCategorie(filtreCategorie === cat ? '' : cat)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                filtreCategorie === cat
                                    ? COULEURS_CATEGORIE[cat] || 'bg-gray-100 text-gray-700'
                                    : 'bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-gray-400 hover:bg-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                    {/* Recherche */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-44"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm">
                <Lock className="h-4 w-4 shrink-0" />
                L'activation et la désactivation des modules est gérée par la plateforme Addvalis. Contactez votre administrateur plateforme pour toute modification.
            </div>

            {/* Grille de cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {modulesAffiches.map(module => (
                    <div
                        key={module.code}
                        className={`relative rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                            module.actif
                                ? 'bg-white dark:bg-dark-900 border-gray-200 dark:border-dark-700 shadow-sm'
                                : 'bg-gray-50 dark:bg-dark-950 border-gray-100 dark:border-dark-800 opacity-70'
                        }`}
                    >
                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                            {module.est_premium && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Premium
                                </span>
                            )}
                            {module.est_core && (
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Cœur
                                </span>
                            )}
                        </div>

                        {/* Icône + Nom */}
                        <div className="flex items-start gap-3 pr-12">
                            <div
                                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: (module.couleur || '#6366f1') + '20', color: module.couleur || '#6366f1' }}
                            >
                                {(() => { const Icon = LUCIDE_ICONS[module.icone] || Package; return <Icon className="h-4 w-4" />; })()}
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-[13px] text-gray-900 dark:text-white leading-tight">
                                    {module.nom}
                                </div>
                                <div className={`text-[10px] uppercase tracking-wider font-semibold mt-0.5 ${COULEURS_CATEGORIE[module.categorie]?.split(' ').slice(1).join(' ') || 'text-gray-400'}`}>
                                    {module.categorie}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {module.description && (
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                                {module.description}
                            </p>
                        )}

                        {/* Dépendances */}
                        {(module.dependances || []).length > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                                <Info className="h-3 w-3 shrink-0" />
                                Nécessite : {module.dependances.join(', ')}
                            </div>
                        )}

                        {/* Toggle */}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-dark-800">
                            <span className={`text-[11px] ${module.actif ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                {module.actif
                                    ? module.active_le ? `Activé le ${new Date(module.active_le).toLocaleDateString('fr-FR')}` : 'Activé'
                                    : 'Non activé'
                                }
                            </span>
                            {module.est_core ? (
                                <span title="Module cœur — toujours actif">
                                    <Lock className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleToggle(module)}
                                    disabled={!isAdmin}
                                    title={!isAdmin ? 'Réservé à l\'administrateur' : module.actif ? 'Désactiver' : 'Activer'}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                        module.actif ? 'bg-primary-500' : 'bg-gray-200 dark:bg-dark-700'
                                    }`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                        module.actif ? 'translate-x-4.5' : 'translate-x-0.5'
                                    }`} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de confirmation désactivation */}
            {moduleAConfirmer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-2">
                            Désactiver « {moduleAConfirmer.module.nom} » ?
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Les modules suivants sont actifs et en dépendent :{' '}
                            <strong>{moduleAConfirmer.dependants.map(d => d.nom).join(', ')}</strong>.
                            Ils seront également désactivés.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setModuleAConfirmer(null)}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmerDesactivation}
                                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                                Désactiver quand même
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page principale ─────────────────────────────────────
export default function ParametresIndex({
    societe, devises = [], tab = 'societe',
    axes = [], periodes = [], typesObjectifs = [], typesResultatsCles = [],
    statuts = [], seuils = [], configuration, configurationPrime, templates = [],
    modulesDisponibles = [], departements = [],
    secteursActivite = [], practices = [], typesLivrable = [],
}) {
    const { flash, auth } = usePage().props;
    const devise = auth?.societe?.devise;
    const aAccesGlobal = auth?.collaborateur?.aAccesGlobal ?? false;
    const [activeTab, setActiveTab] = useState(tab);
    const [activeDialog, setActiveDialog] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // ─── Forms Société ───────────────────────────────────
    const { data, setData, put, processing, errors } = useForm({
        nom: societe?.nom || '',
        email: societe?.email || '',
        telephone: societe?.telephone || '',
        couleur_primaire: societe?.couleur_primaire || '#00c9ff',
        couleur_secondaire: societe?.couleur_secondaire || '#FEAC00',
        mode_sombre: societe?.mode_sombre ?? true,
        layout_mode: societe?.layout_mode || 'sidebar',
        devise_id: societe?.devise_id || '',
    });

    const logoForm = useForm({ logo: null });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('parametres.update'));
    };

    // ─── Forms OKR ──────────────────────────────────────
    const axeForm = useForm({ nom: '', description: '', couleur: '#00c9ff', ordre: 0, actif: true, categorie_performance: '' });
    const periodeForm = useForm({ nom: '', date_debut: '', date_fin: '', type: 'trimestriel', statut: 'actif' });
    const typeObjForm = useForm({ nom: '', description: '', niveau: 'individuel' });
    const typeKRForm = useForm({ nom: '', type_valeur: 'number', unite: '' });
    const statutForm = useForm({ nom: '', couleur: '#6b7280', ordre: 0, est_final: false });
    const seuilForm = useForm({ nom: '', couleur: '#ef4444', seuil_min: 0, seuil_max: 100, ordre: 0 });
    const configForm = useForm({
        mode_calcul: configuration?.mode_calcul || 'moyenne',
        frequence_update: configuration?.frequence_update || 'hebdomadaire',
        rappel_automatique: configuration?.rappel_automatique ?? true,
        visibilite_defaut: configuration?.visibilite_defaut || 'equipe',
        vue_okr: configuration?.vue_okr || 'cards',
    });
    const primeForm = useForm({
        actif: configurationPrime?.actif ?? false,
        montant_max: configurationPrime?.montant_max || '',
        seuil_minimum: configurationPrime?.seuil_minimum || 70,
        mode_calcul: configurationPrime?.mode_calcul || 'proportionnel',
        paliers: configurationPrime?.paliers || [],
    });

    const deptForm          = useForm({ nom: '', description: '', couleur: '#6366f1', ordre: 0 });
    const secteurForm       = useForm({ nom: '', ordre: 0, actif: true });
    const practiceForm      = useForm({ nom: '', ordre: 0, actif: true });
    const typeLivrableForm  = useForm({ nom: '', ordre: 0, actif: true });

    const submitDept = (e) => {
        e.preventDefault();
        editingItem
            ? deptForm.put(route('departements.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : deptForm.post(route('departements.store'), { onSuccess: () => setActiveDialog(null) });
    };

    const submitSecteur = (e) => {
        e.preventDefault();
        editingItem
            ? secteurForm.put(route('parametres.crm.secteurs.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : secteurForm.post(route('parametres.crm.secteurs.store'), { onSuccess: () => setActiveDialog(null) });
    };
    const submitPractice = (e) => {
        e.preventDefault();
        editingItem
            ? practiceForm.put(route('parametres.crm.practices.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : practiceForm.post(route('parametres.crm.practices.store'), { onSuccess: () => setActiveDialog(null) });
    };
    const submitTypeLivrable = (e) => {
        e.preventDefault();
        editingItem
            ? typeLivrableForm.put(route('parametres.crm.types-livrable.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : typeLivrableForm.post(route('parametres.crm.types-livrable.store'), { onSuccess: () => setActiveDialog(null) });
    };

    // ─── Helpers dialog OKR ─────────────────────────────
    const openAdd = (type, form, defaults) => {
        form.reset();
        if (defaults) Object.entries(defaults).forEach(([k, v]) => form.setData(k, v));
        setEditingItem(null);
        setActiveDialog(type);
    };

    const openEdit = (type, form, item, fields) => {
        fields.forEach(f => form.setData(f, item[f] ?? ''));
        setEditingItem(item);
        setActiveDialog(type);
    };

    const handleDelete = (routeName, id) => {
        if (!confirm('Supprimer cet élément ?')) return;
        router.delete(route(routeName, id));
    };

    const submitAxe = (e) => {
        e.preventDefault();
        editingItem
            ? axeForm.put(route('parametres.okr.axes.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : axeForm.post(route('parametres.okr.axes.store'), { onSuccess: () => setActiveDialog(null) });
    };
    const submitPeriode = (e) => {
        e.preventDefault();
        editingItem
            ? periodeForm.put(route('parametres.okr.periodes.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : periodeForm.post(route('parametres.okr.periodes.store'), { onSuccess: () => setActiveDialog(null) });
    };
    const submitTypeObj = (e) => {
        e.preventDefault();
        editingItem
            ? typeObjForm.put(route('parametres.okr.types-objectifs.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : typeObjForm.post(route('parametres.okr.types-objectifs.store'), { onSuccess: () => setActiveDialog(null) });
    };
    const submitTypeKR = (e) => {
        e.preventDefault();
        editingItem
            ? typeKRForm.put(route('parametres.okr.types-resultats.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : typeKRForm.post(route('parametres.okr.types-resultats.store'), { onSuccess: () => setActiveDialog(null) });
    };
    const submitStatut = (e) => {
        e.preventDefault();
        editingItem
            ? statutForm.put(route('parametres.okr.statuts.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : statutForm.post(route('parametres.okr.statuts.store'), { onSuccess: () => setActiveDialog(null) });
    };
    const submitSeuil = (e) => {
        e.preventDefault();
        editingItem
            ? seuilForm.put(route('parametres.okr.seuils.update', editingItem.id), { onSuccess: () => setActiveDialog(null) })
            : seuilForm.post(route('parametres.okr.seuils.store'), { onSuccess: () => setActiveDialog(null) });
    };

    return (
        <AppLayout title="Paramètres">
            {/* Header */}
            <div className="mb-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="h-6 w-6 text-primary-500" /> Paramètres
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez votre société et la configuration OKR</p>
                </motion.div>
            </div>

            {flash?.success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
                    {flash.success}
                </motion.div>
            )}

            {/* Onglets top-level */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="societe">
                        <Building2 className="h-4 w-4 mr-1.5" />Société
                    </TabsTrigger>
                    {aAccesGlobal && (
                        <TabsTrigger value="departements">
                            <Network className="h-4 w-4 mr-1.5" />Départements
                        </TabsTrigger>
                    )}
                    {aAccesGlobal && (
                        <TabsTrigger value="crm">
                            <Briefcase className="h-4 w-4 mr-1.5" />Référentiels CRM
                        </TabsTrigger>
                    )}
                    {aAccesGlobal && (
                        <TabsTrigger value="okr">
                            <Settings2 className="h-4 w-4 mr-1.5" />Configuration OKR
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="modules">
                        <Package className="h-4 w-4 mr-1.5" />Modules
                    </TabsTrigger>
                </TabsList>

                {/* ══════════════ ONGLET SOCIÉTÉ ══════════════ */}
                <TabsContent value="societe">
                    <div className="max-w-2xl space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary-500" />Informations société
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <Label htmlFor="nom">Nom de la société *</Label>
                                            <Input id="nom" value={data.nom} onChange={(e) => setData('nom', e.target.value)} error={errors.nom} className="mt-1.5" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} className="mt-1.5" />
                                            </div>
                                            <div>
                                                <Label htmlFor="telephone">Téléphone</Label>
                                                <Input id="telephone" value={data.telephone} onChange={(e) => setData('telephone', e.target.value)} error={errors.telephone} className="mt-1.5" />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                                                <Palette className="h-4 w-4 text-secondary-500" /> Personnalisation
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="couleur_primaire">Couleur primaire</Label>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <input type="color" id="couleur_primaire" value={data.couleur_primaire} onChange={(e) => setData('couleur_primaire', e.target.value)} className="h-10 w-14 rounded-lg border border-gray-200 dark:border-dark-600 cursor-pointer" />
                                                        <Input value={data.couleur_primaire} onChange={(e) => setData('couleur_primaire', e.target.value)} className="flex-1" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="couleur_secondaire">Couleur secondaire</Label>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <input type="color" id="couleur_secondaire" value={data.couleur_secondaire} onChange={(e) => setData('couleur_secondaire', e.target.value)} className="h-10 w-14 rounded-lg border border-gray-200 dark:border-dark-600 cursor-pointer" />
                                                        <Input value={data.couleur_secondaire} onChange={(e) => setData('couleur_secondaire', e.target.value)} className="flex-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                                                <Layout className="h-4 w-4 text-primary-500" /> Présentation
                                            </h3>
                                            <div>
                                                <Label htmlFor="layout_mode">Mode de navigation</Label>
                                                <Select id="layout_mode" value={data.layout_mode} onChange={(e) => setData('layout_mode', e.target.value)} className="mt-1.5">
                                                    <option value="sidebar">Sidebar (barre latérale)</option>
                                                    <option value="topbar">Topbar (barre horizontale)</option>
                                                </Select>
                                                <p className="text-xs text-gray-400 mt-1.5">
                                                    {data.layout_mode === 'sidebar' ? 'Navigation classique avec menu à gauche.' : 'Navigation compacte avec barre en haut, style tracker.'}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                                                <Coins className="h-4 w-4 text-amber-500" /> Devise
                                            </h3>
                                            <div>
                                                <Label htmlFor="devise_id">Devise utilisée</Label>
                                                <Select id="devise_id" value={data.devise_id} onChange={(e) => setData('devise_id', e.target.value)} className="mt-1.5">
                                                    <option value="">-- Choisir une devise --</option>
                                                    {devises.map(d => (
                                                        <option key={d.id} value={d.id}>{d.code} — {d.nom} {d.symbole ? `(${d.symbole})` : ''}</option>
                                                    ))}
                                                </Select>
                                                {errors.devise_id && <p className="text-xs text-red-500 mt-1">{errors.devise_id}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
                                            <Button type="submit" disabled={processing}>
                                                <Save className="h-4 w-4 mr-2" />{processing ? 'Enregistrement...' : 'Enregistrer'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5 text-secondary-500" />Logo de la société
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={(e) => { e.preventDefault(); logoForm.post(route('parametres.logo')); }} className="space-y-4">
                                        <div className="flex items-center gap-6">
                                            <div className="h-20 w-20 rounded-xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-dark-700">
                                                {societe?.logo ? (
                                                    <img src={`/storage/${societe.logo}`} alt="Logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Building2 className="h-8 w-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Label htmlFor="logo">Importer un nouveau logo</Label>
                                                <Input id="logo" type="file" accept="image/*" onChange={(e) => logoForm.setData('logo', e.target.files[0])} className="mt-1.5" />
                                                {logoForm.errors.logo && <p className="text-sm text-red-500 mt-1">{logoForm.errors.logo}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-dark-700">
                                            <Button type="submit" disabled={logoForm.processing || !logoForm.data.logo}>
                                                <Save className="h-4 w-4 mr-2" />{logoForm.processing ? 'Importation...' : 'Mettre à jour le logo'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </TabsContent>

                {/* ══════════════ ONGLET DÉPARTEMENTS ══════════════ */}
                <TabsContent value="departements">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Network className="h-4 w-4 text-primary-500" /> Départements
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Organisez votre équipe en départements. Les managers sont restreints à leur département.
                                </p>
                            </div>
                            <Button size="sm" onClick={() => { deptForm.reset(); deptForm.setData('couleur', '#6366f1'); setEditingItem(null); setActiveDialog('dept'); }}>
                                <Plus className="h-4 w-4 mr-1" /> Ajouter
                            </Button>
                        </div>

                        {departements.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <Network className="h-10 w-10 text-gray-300 dark:text-dark-600 mb-3" />
                                    <p className="text-sm font-medium text-gray-500">Aucun département configuré</p>
                                    <p className="text-xs text-gray-400 mt-1">Créez votre premier département pour organiser votre équipe.</p>
                                    <Button size="sm" className="mt-4" onClick={() => { deptForm.reset(); deptForm.setData('couleur', '#6366f1'); setEditingItem(null); setActiveDialog('dept'); }}>
                                        <Plus className="h-4 w-4 mr-1" /> Créer un département
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {departements.map(dept => (
                                    <Card key={dept.id} className="relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: dept.couleur || '#6366f1' }} />
                                        <CardContent className="pt-5 pb-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
                                                        style={{ backgroundColor: dept.couleur || '#6366f1' }}>
                                                        <Users2 className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-[13px] text-gray-900 dark:text-white truncate">{dept.nom}</p>
                                                        {dept.description && <p className="text-[11px] text-gray-500 truncate">{dept.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                        onClick={() => { openEdit('dept', deptForm, dept, ['nom', 'description', 'couleur', 'ordre']); }}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                        onClick={() => { if (confirm(`Supprimer « ${dept.nom} » ?`)) router.delete(route('departements.destroy', dept.id)); }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-[12px] text-gray-500">
                                                    {dept.collaborateurs_count ?? 0} membre{(dept.collaborateurs_count ?? 0) !== 1 ? 's' : ''}
                                                </span>
                                                {!dept.actif && (
                                                    <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-400">Inactif</span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ══════════════ ONGLET CRM ══════════════ */}
                <TabsContent value="crm">
                    <div className="space-y-6">
                        <CrudSection title="Secteurs d'activité" icon={Building2} items={secteursActivite}
                            columns={[{ label: 'Nom' }, { label: 'Ordre', className: 'w-20' }, { label: 'Actif', className: 'w-20' }]}
                            renderRow={item => (<>
                                <TableCell className="font-medium">{item.nom}</TableCell>
                                <TableCell>{item.ordre}</TableCell>
                                <TableCell><Badge variant={item.actif ? 'success' : 'secondary'}>{item.actif ? 'Actif' : 'Inactif'}</Badge></TableCell>
                            </>)}
                            onAdd={() => openAdd('secteur', secteurForm)}
                            onEdit={item => openEdit('secteur', secteurForm, item, ['nom', 'ordre', 'actif'])}
                            onDelete={item => { if (confirm(`Supprimer « ${item.nom} » ?`)) router.delete(route('parametres.crm.secteurs.destroy', item.id)); }}
                        />
                        <CrudSection title="Pratiques (Missions)" icon={Briefcase} items={practices}
                            columns={[{ label: 'Nom' }, { label: 'Ordre', className: 'w-20' }, { label: 'Actif', className: 'w-20' }]}
                            renderRow={item => (<>
                                <TableCell className="font-medium">{item.nom}</TableCell>
                                <TableCell>{item.ordre}</TableCell>
                                <TableCell><Badge variant={item.actif ? 'success' : 'secondary'}>{item.actif ? 'Actif' : 'Inactif'}</Badge></TableCell>
                            </>)}
                            onAdd={() => openAdd('practice', practiceForm)}
                            onEdit={item => openEdit('practice', practiceForm, item, ['nom', 'ordre', 'actif'])}
                            onDelete={item => { if (confirm(`Supprimer « ${item.nom} » ?`)) router.delete(route('parametres.crm.practices.destroy', item.id)); }}
                        />
                        <CrudSection title="Types de livrable" icon={Package} items={typesLivrable}
                            columns={[{ label: 'Nom' }, { label: 'Ordre', className: 'w-20' }, { label: 'Actif', className: 'w-20' }]}
                            renderRow={item => (<>
                                <TableCell className="font-medium">{item.nom}</TableCell>
                                <TableCell>{item.ordre}</TableCell>
                                <TableCell><Badge variant={item.actif ? 'success' : 'secondary'}>{item.actif ? 'Actif' : 'Inactif'}</Badge></TableCell>
                            </>)}
                            onAdd={() => openAdd('typeLivrable', typeLivrableForm)}
                            onEdit={item => openEdit('typeLivrable', typeLivrableForm, item, ['nom', 'ordre', 'actif'])}
                            onDelete={item => { if (confirm(`Supprimer « ${item.nom} » ?`)) router.delete(route('parametres.crm.types-livrable.destroy', item.id)); }}
                        />
                    </div>
                </TabsContent>

                {/* ══════════════ ONGLET OKR ══════════════ */}
                <TabsContent value="okr">
                    <Tabs defaultValue="axes">
                        <TabsList className="flex-wrap mb-4">
                            <TabsTrigger value="axes"><Compass className="h-4 w-4 mr-1.5" />Axes</TabsTrigger>
                            <TabsTrigger value="periodes"><CalendarRange className="h-4 w-4 mr-1.5" />Périodes</TabsTrigger>
                            <TabsTrigger value="types"><Target className="h-4 w-4 mr-1.5" />Types</TabsTrigger>
                            <TabsTrigger value="resultats"><BarChart3 className="h-4 w-4 mr-1.5" />Résultats Clés</TabsTrigger>
                            <TabsTrigger value="statuts"><CheckCircle2 className="h-4 w-4 mr-1.5" />Statuts</TabsTrigger>
                            <TabsTrigger value="seuils"><Gauge className="h-4 w-4 mr-1.5" />Seuils</TabsTrigger>
                            <TabsTrigger value="config"><Settings2 className="h-4 w-4 mr-1.5" />Configuration</TabsTrigger>
                            <TabsTrigger value="primes"><Award className="h-4 w-4 mr-1.5" />Primes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="axes">
                            <CrudSection title="Axes stratégiques" icon={Compass} items={axes}
                                columns={[{ label: 'Couleur', className: 'w-16' }, { label: 'Nom' }, { label: 'Description' }, { label: 'Ordre', className: 'w-16' }, { label: 'Statut', className: 'w-20' }]}
                                renderRow={(item) => (<>
                                    <TableCell><div className="h-5 w-5 rounded-full" style={{ backgroundColor: item.couleur }} /></TableCell>
                                    <TableCell className="font-medium">{item.nom}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">{item.description}</TableCell>
                                    <TableCell>{item.ordre}</TableCell>
                                    <TableCell><Badge variant={item.actif ? 'default' : 'ghost'}>{item.actif ? 'Actif' : 'Inactif'}</Badge></TableCell>
                                </>)}
                                onAdd={() => openAdd('axe', axeForm, { couleur: '#00c9ff', ordre: axes.length + 1 })}
                                onEdit={(item) => openEdit('axe', axeForm, item, ['nom', 'description', 'couleur', 'ordre', 'actif', 'categorie_performance'])}
                                onDelete={(item) => handleDelete('parametres.okr.axes.destroy', item.id)}
                            />
                        </TabsContent>

                        <TabsContent value="periodes">
                            <CrudSection title="Périodes OKR" icon={CalendarRange} items={periodes}
                                columns={[{ label: 'Nom' }, { label: 'Type' }, { label: 'Début' }, { label: 'Fin' }, { label: 'Statut' }]}
                                renderRow={(item) => (<>
                                    <TableCell className="font-medium">{item.nom}</TableCell>
                                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                    <TableCell className="text-sm">{new Date(item.date_debut).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell className="text-sm">{new Date(item.date_fin).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell><Badge variant={item.statut === 'actif' ? 'default' : 'ghost'}>{item.statut}</Badge></TableCell>
                                </>)}
                                onAdd={() => openAdd('periode', periodeForm)}
                                onEdit={(item) => openEdit('periode', periodeForm, item, ['nom', 'date_debut', 'date_fin', 'type', 'statut'])}
                                onDelete={(item) => handleDelete('parametres.okr.periodes.destroy', item.id)}
                            />
                        </TabsContent>

                        <TabsContent value="types">
                            <CrudSection title="Types d'objectifs" icon={Target} items={typesObjectifs}
                                columns={[{ label: 'Nom' }, { label: 'Description' }, { label: 'Niveau' }]}
                                renderRow={(item) => (<>
                                    <TableCell className="font-medium">{item.nom}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">{item.description}</TableCell>
                                    <TableCell><Badge variant="outline">{item.niveau}</Badge></TableCell>
                                </>)}
                                onAdd={() => openAdd('typeObj', typeObjForm)}
                                onEdit={(item) => openEdit('typeObj', typeObjForm, item, ['nom', 'description', 'niveau'])}
                                onDelete={(item) => handleDelete('parametres.okr.types-objectifs.destroy', item.id)}
                            />
                        </TabsContent>

                        <TabsContent value="resultats">
                            <CrudSection title="Types de résultats clés" icon={BarChart3} items={typesResultatsCles}
                                columns={[{ label: 'Nom' }, { label: 'Type de valeur' }, { label: 'Unité' }]}
                                renderRow={(item) => (<>
                                    <TableCell className="font-medium">{item.nom}</TableCell>
                                    <TableCell><Badge variant="outline">{{ number: 'Quantitatif', percent: 'Pourcentage', boolean: 'Booléen', currency: 'Financier' }[item.type_valeur] || item.type_valeur}</Badge></TableCell>
                                    <TableCell className="text-slate-500">{item.unite || '—'}</TableCell>
                                </>)}
                                onAdd={() => openAdd('typeKR', typeKRForm)}
                                onEdit={(item) => openEdit('typeKR', typeKRForm, item, ['nom', 'type_valeur', 'unite'])}
                                onDelete={(item) => handleDelete('parametres.okr.types-resultats.destroy', item.id)}
                            />
                        </TabsContent>

                        <TabsContent value="statuts">
                            <CrudSection title="Statuts des objectifs" icon={CheckCircle2} items={statuts}
                                columns={[{ label: 'Couleur', className: 'w-16' }, { label: 'Nom' }, { label: 'Ordre', className: 'w-16' }, { label: 'Final', className: 'w-16' }]}
                                renderRow={(item) => (<>
                                    <TableCell><div className="h-5 w-5 rounded-full" style={{ backgroundColor: item.couleur }} /></TableCell>
                                    <TableCell className="font-medium">{item.nom}</TableCell>
                                    <TableCell>{item.ordre}</TableCell>
                                    <TableCell>{item.est_final ? '✓' : ''}</TableCell>
                                </>)}
                                onAdd={() => openAdd('statut', statutForm, { ordre: statuts.length + 1 })}
                                onEdit={(item) => openEdit('statut', statutForm, item, ['nom', 'couleur', 'ordre', 'est_final'])}
                                onDelete={(item) => handleDelete('parametres.okr.statuts.destroy', item.id)}
                            />
                        </TabsContent>

                        <TabsContent value="seuils">
                            <CrudSection title="Seuils de performance" icon={Gauge} items={seuils}
                                columns={[{ label: 'Couleur', className: 'w-16' }, { label: 'Nom' }, { label: 'Min (%)' }, { label: 'Max (%)' }]}
                                renderRow={(item) => (<>
                                    <TableCell><div className="h-5 w-5 rounded-full" style={{ backgroundColor: item.couleur }} /></TableCell>
                                    <TableCell className="font-medium">{item.nom}</TableCell>
                                    <TableCell>{item.seuil_min}%</TableCell>
                                    <TableCell>{item.seuil_max}%</TableCell>
                                </>)}
                                onAdd={() => openAdd('seuil', seuilForm, { ordre: seuils.length + 1 })}
                                onEdit={(item) => openEdit('seuil', seuilForm, item, ['nom', 'couleur', 'seuil_min', 'seuil_max', 'ordre'])}
                                onDelete={(item) => handleDelete('parametres.okr.seuils.destroy', item.id)}
                            />
                        </TabsContent>

                        <TabsContent value="config">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary-500" />Configuration générale</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={(e) => { e.preventDefault(); configForm.put(route('parametres.okr.configuration.update')); }} className="space-y-5 max-w-lg">
                                        <div>
                                            <Label>Mode de calcul de la progression</Label>
                                            <Select value={configForm.data.mode_calcul} onChange={e => configForm.setData('mode_calcul', e.target.value)} className="mt-1.5">
                                                <option value="moyenne">Moyenne simple</option>
                                                <option value="pondere">Pondéré (par poids des KR)</option>
                                                <option value="manuel">Manuel</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Fréquence de mise à jour</Label>
                                            <Select value={configForm.data.frequence_update} onChange={e => configForm.setData('frequence_update', e.target.value)} className="mt-1.5">
                                                <option value="quotidien">Quotidien</option>
                                                <option value="hebdomadaire">Hebdomadaire</option>
                                                <option value="mensuel">Mensuel</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Visibilité par défaut</Label>
                                            <Select value={configForm.data.visibilite_defaut} onChange={e => configForm.setData('visibilite_defaut', e.target.value)} className="mt-1.5">
                                                <option value="tous">Tous</option>
                                                <option value="equipe">Équipe</option>
                                                <option value="prive">Privé</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Vue par défaut des OKR</Label>
                                            <Select value={configForm.data.vue_okr} onChange={e => configForm.setData('vue_okr', e.target.value)} className="mt-1.5">
                                                <option value="cards">Cards (grille)</option>
                                                <option value="liste">Liste (compacte)</option>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="rappel" checked={configForm.data.rappel_automatique}
                                                onChange={e => configForm.setData('rappel_automatique', e.target.checked)}
                                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                            <Label htmlFor="rappel">Activer les rappels automatiques</Label>
                                        </div>
                                        <Button type="submit" disabled={configForm.processing} className="gap-2">
                                            <Save className="h-4 w-4" /> Enregistrer
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="primes">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary-500" />Configuration des primes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={(e) => { e.preventDefault(); primeForm.put(route('parametres.okr.primes.update')); }} className="space-y-5 max-w-lg">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="primeActif" checked={primeForm.data.actif}
                                                onChange={e => primeForm.setData('actif', e.target.checked)}
                                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                            <Label htmlFor="primeActif">Activer le système de primes</Label>
                                        </div>
                                        {primeForm.data.actif && (<>
                                            <div>
                                                <Label>Montant maximum (optionnel)</Label>
                                                <NumberInput value={primeForm.data.montant_max} onChange={v => primeForm.setData('montant_max', v)} className="mt-1.5" placeholder="Illimité si vide" suffix={devise?.code || 'GNF'} />
                                            </div>
                                            <div>
                                                <Label>Seuil minimum de déclenchement (%)</Label>
                                                <NumberInput value={primeForm.data.seuil_minimum} onChange={v => primeForm.setData('seuil_minimum', v)} className="mt-1.5" suffix="%" decimals={0} />
                                            </div>
                                            <div>
                                                <Label>Mode de calcul</Label>
                                                <Select value={primeForm.data.mode_calcul} onChange={e => primeForm.setData('mode_calcul', e.target.value)} className="mt-1.5">
                                                    <option value="fixe">Fixe (tout ou rien)</option>
                                                    <option value="proportionnel">Proportionnel au taux d'atteinte</option>
                                                    <option value="palier">Par paliers</option>
                                                </Select>
                                            </div>
                                            {primeForm.data.mode_calcul === 'palier' && (
                                                <div className="space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-dark-800">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="font-semibold">Paliers</Label>
                                                        <Button type="button" size="sm" variant="outline" onClick={() => {
                                                            primeForm.setData('paliers', [...primeForm.data.paliers, { seuil_min: 0, seuil_max: 100, pourcentage_prime: 0 }]);
                                                        }}><Plus className="h-3.5 w-3.5 mr-1" />Palier</Button>
                                                    </div>
                                                    {primeForm.data.paliers.map((palier, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <NumberInput placeholder="Min" value={palier.seuil_min} className="w-24" suffix="%" decimals={0}
                                                                onChange={v => { const p = [...primeForm.data.paliers]; p[i].seuil_min = v; primeForm.setData('paliers', p); }} />
                                                            <span className="text-slate-400">→</span>
                                                            <NumberInput placeholder="Max" value={palier.seuil_max} className="w-24" suffix="%" decimals={0}
                                                                onChange={v => { const p = [...primeForm.data.paliers]; p[i].seuil_max = v; primeForm.setData('paliers', p); }} />
                                                            <span className="text-slate-400">=</span>
                                                            <NumberInput placeholder="Prime" value={palier.pourcentage_prime} className="w-24" suffix="%" decimals={0}
                                                                onChange={v => { const p = [...primeForm.data.paliers]; p[i].pourcentage_prime = v; primeForm.setData('paliers', p); }} />
                                                            <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => {
                                                                const p = [...primeForm.data.paliers]; p.splice(i, 1); primeForm.setData('paliers', p);
                                                            }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>)}
                                        <Button type="submit" disabled={primeForm.processing} className="gap-2">
                                            <Save className="h-4 w-4" /> Enregistrer
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* ══════════════ ONGLET MODULES ══════════════ */}
                <TabsContent value="modules">
                    <OngletModules
                        modules={modulesDisponibles}
                        isAdmin={false}
                    />
                </TabsContent>

            </Tabs>

            {/* ═══════════ DIALOGS OKR ═══════════ */}

            <Dialog open={activeDialog === 'axe'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un axe stratégique</DialogTitle></DialogHeader>
                    <form onSubmit={submitAxe} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={axeForm.data.nom} onChange={e => axeForm.setData('nom', e.target.value)} error={axeForm.errors.nom} /></div>
                        <div><Label>Description</Label><Input value={axeForm.data.description} onChange={e => axeForm.setData('description', e.target.value)} /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Couleur</Label><Input type="color" value={axeForm.data.couleur} onChange={e => axeForm.setData('couleur', e.target.value)} className="mt-1.5 h-10" /></div>
                            <div><Label>Ordre</Label><NumberInput value={axeForm.data.ordre} onChange={v => axeForm.setData('ordre', v)} className="mt-1.5" decimals={0} /></div>
                        </div>
                        <div>
                            <Label>Dimension Performance</Label>
                            <p className="text-[11px] text-gray-400 mb-1.5">Quel score de performance cet axe alimente-t-il automatiquement ?</p>
                            <select
                                value={axeForm.data.categorie_performance ?? ''}
                                onChange={e => axeForm.setData('categorie_performance', e.target.value || null)}
                                className="w-full rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">— Aucune —</option>
                                <option value="commercial">🏆 Commercial (50%)</option>
                                <option value="delivery">✅ Delivery (25%)</option>
                            </select>
                        </div>
                        {editingItem && (
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={axeForm.data.actif} onChange={e => axeForm.setData('actif', e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                                <Label>Actif</Label>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={axeForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeDialog === 'periode'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} une période</DialogTitle></DialogHeader>
                    <form onSubmit={submitPeriode} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={periodeForm.data.nom} onChange={e => periodeForm.setData('nom', e.target.value)} error={periodeForm.errors.nom} placeholder="Ex: Q2 2026" /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Date début *</Label><CustomDatePicker value={periodeForm.data.date_debut} onChange={v => periodeForm.setData('date_debut', v)} className="mt-1.5" /></div>
                            <div><Label>Date fin *</Label><CustomDatePicker value={periodeForm.data.date_fin} onChange={v => periodeForm.setData('date_fin', v)} className="mt-1.5" /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Type *</Label>
                                <Select value={periodeForm.data.type} onChange={e => periodeForm.setData('type', e.target.value)} className="mt-1.5">
                                    <option value="mensuel">Mensuel</option><option value="trimestriel">Trimestriel</option><option value="annuel">Annuel</option>
                                </Select>
                            </div>
                            {editingItem && (
                                <div><Label>Statut</Label>
                                    <Select value={periodeForm.data.statut} onChange={e => periodeForm.setData('statut', e.target.value)} className="mt-1.5">
                                        <option value="actif">Actif</option><option value="cloture">Clôturé</option>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={periodeForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeDialog === 'typeObj'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un type d'objectif</DialogTitle></DialogHeader>
                    <form onSubmit={submitTypeObj} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={typeObjForm.data.nom} onChange={e => typeObjForm.setData('nom', e.target.value)} error={typeObjForm.errors.nom} /></div>
                        <div><Label>Description</Label><Input value={typeObjForm.data.description} onChange={e => typeObjForm.setData('description', e.target.value)} /></div>
                        <div><Label>Niveau *</Label>
                            <Select value={typeObjForm.data.niveau} onChange={e => typeObjForm.setData('niveau', e.target.value)} className="mt-1.5">
                                <option value="individuel">Individuel</option><option value="equipe">Équipe</option><option value="entreprise">Entreprise</option>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={typeObjForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeDialog === 'typeKR'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un type de résultat clé</DialogTitle></DialogHeader>
                    <form onSubmit={submitTypeKR} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={typeKRForm.data.nom} onChange={e => typeKRForm.setData('nom', e.target.value)} error={typeKRForm.errors.nom} /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Type de valeur *</Label>
                                <Select value={typeKRForm.data.type_valeur} onChange={e => typeKRForm.setData('type_valeur', e.target.value)} className="mt-1.5">
                                    <option value="number">Quantitatif</option><option value="percent">Pourcentage</option><option value="boolean">Booléen</option><option value="currency">Financier</option>
                                </Select>
                            </div>
                            <div><Label>Unité</Label><Input value={typeKRForm.data.unite} onChange={e => typeKRForm.setData('unite', e.target.value)} className="mt-1.5" placeholder="%, GNF, unités..." /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={typeKRForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeDialog === 'statut'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un statut</DialogTitle></DialogHeader>
                    <form onSubmit={submitStatut} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={statutForm.data.nom} onChange={e => statutForm.setData('nom', e.target.value)} error={statutForm.errors.nom} /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Couleur</Label><Input type="color" value={statutForm.data.couleur} onChange={e => statutForm.setData('couleur', e.target.value)} className="mt-1.5 h-10" /></div>
                            <div><Label>Ordre</Label><NumberInput value={statutForm.data.ordre} onChange={v => statutForm.setData('ordre', v)} className="mt-1.5" decimals={0} /></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={statutForm.data.est_final} onChange={e => statutForm.setData('est_final', e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                            <Label>Statut final (objectif considéré comme clos)</Label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={statutForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

                {/* ══════════════ ONGLET MODULES ══════════════ */}
            <Dialog open={activeDialog === 'seuil'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un seuil de performance</DialogTitle></DialogHeader>
                    <form onSubmit={submitSeuil} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={seuilForm.data.nom} onChange={e => seuilForm.setData('nom', e.target.value)} error={seuilForm.errors.nom} placeholder="Ex: En retard" /></div>
                        <div><Label>Couleur</Label><Input type="color" value={seuilForm.data.couleur} onChange={e => seuilForm.setData('couleur', e.target.value)} className="mt-1.5 h-10" /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Seuil min (%)</Label><NumberInput value={seuilForm.data.seuil_min} onChange={v => seuilForm.setData('seuil_min', v)} className="mt-1.5" suffix="%" decimals={0} /></div>
                            <div><Label>Seuil max (%)</Label><NumberInput value={seuilForm.data.seuil_max} onChange={v => seuilForm.setData('seuil_max', v)} className="mt-1.5" suffix="%" decimals={0} /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={seuilForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialogs CRM ── */}
            <Dialog open={activeDialog === 'secteur'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un secteur d'activité</DialogTitle></DialogHeader>
                    <form onSubmit={submitSecteur} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={secteurForm.data.nom} onChange={e => secteurForm.setData('nom', e.target.value)} error={secteurForm.errors.nom} placeholder="Ex: Banque, Télécoms…" /></div>
                        <div><Label>Ordre</Label><NumberInput value={secteurForm.data.ordre} onChange={v => secteurForm.setData('ordre', v)} className="mt-1.5" decimals={0} /></div>
                        {editingItem && (
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={secteurForm.data.actif} onChange={e => secteurForm.setData('actif', e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                                <Label>Actif</Label>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={secteurForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeDialog === 'practice'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} une pratique</DialogTitle></DialogHeader>
                    <form onSubmit={submitPractice} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={practiceForm.data.nom} onChange={e => practiceForm.setData('nom', e.target.value)} error={practiceForm.errors.nom} placeholder="Ex: Conseil, Audit, Développement…" /></div>
                        <div><Label>Ordre</Label><NumberInput value={practiceForm.data.ordre} onChange={v => practiceForm.setData('ordre', v)} className="mt-1.5" decimals={0} /></div>
                        {editingItem && (
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={practiceForm.data.actif} onChange={e => practiceForm.setData('actif', e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                                <Label>Actif</Label>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={practiceForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={activeDialog === 'typeLivrable'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un type de livrable</DialogTitle></DialogHeader>
                    <form onSubmit={submitTypeLivrable} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={typeLivrableForm.data.nom} onChange={e => typeLivrableForm.setData('nom', e.target.value)} error={typeLivrableForm.errors.nom} placeholder="Ex: Rapport, Démo, Présentation…" /></div>
                        <div><Label>Ordre</Label><NumberInput value={typeLivrableForm.data.ordre} onChange={v => typeLivrableForm.setData('ordre', v)} className="mt-1.5" decimals={0} /></div>
                        {editingItem && (
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={typeLivrableForm.data.actif} onChange={e => typeLivrableForm.setData('actif', e.target.checked)} className="rounded border-slate-300 text-primary-600" />
                                <Label>Actif</Label>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={typeLivrableForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialog Département ── */}
            <Dialog open={activeDialog === 'dept'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} un département</DialogTitle></DialogHeader>
                    <form onSubmit={submitDept} className="space-y-4 mt-4">
                        <div><Label>Nom *</Label><Input value={deptForm.data.nom} onChange={e => deptForm.setData('nom', e.target.value)} error={deptForm.errors.nom} placeholder="Ex: Commercial" /></div>
                        <div><Label>Description</Label><Input value={deptForm.data.description} onChange={e => deptForm.setData('description', e.target.value)} placeholder="Description optionnelle" /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>Couleur</Label><Input type="color" value={deptForm.data.couleur} onChange={e => deptForm.setData('couleur', e.target.value)} className="mt-1.5 h-10" /></div>
                            <div><Label>Ordre</Label><NumberInput value={deptForm.data.ordre} onChange={v => deptForm.setData('ordre', v)} className="mt-1.5" decimals={0} /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>Annuler</Button>
                            <Button type="submit" disabled={deptForm.processing}>{editingItem ? 'Enregistrer' : 'Créer'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
