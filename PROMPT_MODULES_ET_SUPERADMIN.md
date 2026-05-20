# 🎯 Prompt — Gestion modulaire des accès & refonte console SuperAdmin (Addvalis SaaS Performance)

## 📌 Contexte du projet (rappel)

Je travaille sur **Addvalis SaaS Performance**, plateforme SaaS multi-tenant de pilotage de performance (OKR) :
- **Backend** : Laravel 13 (PHP), architecture multi-société via trait `BelongsToSociete` + middleware `InjecterSociete`
- **Frontend** : React 18 + Inertia.js, Tailwind CSS v3, shadcn/ui (Radix), Framer Motion, Recharts
- **DB** : MySQL, modèles en français (`Societe`, `Collaborateur`, `Objectif`, `ResultatCle`, `Tache`, etc.)
- **UI** : 100 % en français, design system v6 (cards `rounded-xl`, `border-gray-200`, `shadow-sm`, padding `p-5`, `text-[13px]` body, labels `text-[10px] uppercase tracking-wider`, primaire bleu `#3b82f6`, secondaire ambre `#FEAC00`, dark mode via classe Tailwind)
- **Convention strictes** :
  - `Inertia::render()` ou `redirect()->back()` — JAMAIS `response()->json()`
  - `router.post` avec `preserveState: true` dans les modals — JAMAIS `useForm` pour les modals
  - `<NumberInput>` pour tous les champs numériques, `formatNumber()` pour l'affichage
  - Trait `BelongsToSociete` obligatoire pour les modèles métier
- **Phases terminées (1 → 5a)** : Fondations, OKR/Tâches, Prospection/Incentives, Refonte UI v6, Matrice Eisenhower, Data Viz Recharts, Individuels, Multi-devises, Missions War Room, Import Excel
- **Modules existants accessibles via navigation** (11 pills dans `TopbarNav` + items dans `Sidebar`) :
  OKR, Individuels, Daily, Tâches (Kanban), Prospection, LMS, Missions, Incentives, Synthèse, Équipe (Collaborateurs), Matrice Eisenhower, Import (admin)

---

## 🎯 Objectifs de cette mission (2 chantiers liés)

### Chantier 1 — Gestion modulaire des accès par société
Permettre, à la création d'une société **et à tout moment ensuite**, de choisir quels modules sont activés/désactivés. Un module désactivé doit disparaître entièrement de la navigation et bloquer les routes côté serveur (HTTP 403). Le but : facturer/livrer à la carte.

### Chantier 2 — Refonte de la console SuperAdmin
La zone d'administration de la plateforme (gestion des sociétés clientes, des utilisateurs globaux, des modules, du monitoring) est actuellement **inexistante ou très basique** dans le projet. Il faut créer une vraie console SaaS moderne, comparable à ce que proposent Linear, Vercel ou Notion en backoffice, avec sidebar dédiée, KPIs globaux, gestion fine et UX premium.

Les deux chantiers se complètent : c'est depuis la console SuperAdmin qu'on créera/éditera les sociétés et qu'on activera leurs modules.

---

# 🧩 CHANTIER 1 — Gestion modulaire des accès

## 1.1 Modèle de données

### Nouvelle table `modules` (catalogue plateforme)
```php
Schema::create('modules', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique();           // 'okr', 'taches', 'prospection', 'missions', 'lms', ...
    $table->string('nom');                       // 'Module OKR'
    $table->text('description')->nullable();
    $table->string('icone')->nullable();         // nom d'icône lucide-react ('Target', 'Briefcase', ...)
    $table->string('couleur', 20)->default('#3b82f6');  // accent pour la pill / la card
    $table->string('categorie');                 // 'MANAGEMENT', 'BUSINESS', 'ADMINISTRATION', 'ANALYTIQUE'
    $table->json('routes')->nullable();          // ['okr.*', 'taches.*'] — liste des patterns de routes protégées
    $table->json('dependances')->nullable();     // ['okr'] — codes des modules requis (ex: Individuels nécessite OKR)
    $table->boolean('est_core')->default(false); // true = activé en dur, non désactivable (ex: Dashboard, Paramètres)
    $table->boolean('est_premium')->default(false); // affichage badge "Premium"
    $table->integer('ordre')->default(0);
    $table->boolean('actif')->default(true);     // module disponible dans le catalogue plateforme
    $table->timestamps();
});
```

### Pivot `societe_module`
```php
Schema::create('societe_module', function (Blueprint $table) {
    $table->id();
    $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
    $table->foreignId('module_id')->constrained()->cascadeOnDelete();
    $table->boolean('actif')->default(true);
    $table->timestamp('active_le')->nullable();
    $table->timestamp('desactive_le')->nullable();
    $table->foreignId('active_par_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->json('parametres')->nullable();      // futurs paramètres spécifiques par société (quotas, etc.)
    $table->timestamps();
    $table->unique(['societe_id', 'module_id']);
});
```

### Seeder `ModuleSeeder` (idempotent)
Préseed le catalogue des modules existants. Exemple :
```php
$modules = [
    ['code' => 'dashboard',    'nom' => 'Tableau de bord',     'categorie' => 'CORE',          'est_core' => true,  'icone' => 'LayoutDashboard', 'couleur' => '#3b82f6'],
    ['code' => 'okr',          'nom' => 'Objectifs (OKR)',     'categorie' => 'MANAGEMENT',    'icone' => 'Target',          'couleur' => '#8b5cf6', 'routes' => ['okr.*', 'parametres.okr.*']],
    ['code' => 'individuels',  'nom' => 'Individuels',         'categorie' => 'MANAGEMENT',    'icone' => 'User',            'couleur' => '#ec4899', 'routes' => ['individuels.*'], 'dependances' => ['okr']],
    ['code' => 'taches',       'nom' => 'Tâches (Kanban)',     'categorie' => 'MANAGEMENT',    'icone' => 'ListChecks',      'couleur' => '#10b981', 'routes' => ['taches.*']],
    ['code' => 'daily',        'nom' => 'Bilan Daily',         'categorie' => 'MANAGEMENT',    'icone' => 'CalendarCheck',   'couleur' => '#f59e0b', 'routes' => ['daily.*', 'taches.daily']],
    ['code' => 'matrice',      'nom' => 'Matrice Eisenhower',  'categorie' => 'MANAGEMENT',    'icone' => 'Grid3x3',         'couleur' => '#d946ef', 'routes' => ['matrice.*'], 'dependances' => ['taches']],
    ['code' => 'prospection',  'nom' => 'Prospection (CRM)',   'categorie' => 'BUSINESS',      'icone' => 'TrendingUp',      'couleur' => '#06b6d4', 'routes' => ['prospection.*']],
    ['code' => 'missions',     'nom' => 'Missions & Delivery', 'categorie' => 'BUSINESS',      'icone' => 'Briefcase',       'couleur' => '#0ea5e9', 'routes' => ['missions.*']],
    ['code' => 'incentives',   'nom' => 'Primes & Incentives', 'categorie' => 'BUSINESS',      'icone' => 'Gift',            'couleur' => '#f43f5e', 'routes' => ['incentives.*'], 'est_premium' => true],
    ['code' => 'lms',          'nom' => 'Formations (LMS)',    'categorie' => 'BUSINESS',      'icone' => 'GraduationCap',   'couleur' => '#a855f7', 'routes' => ['lms.*'], 'est_premium' => true],
    ['code' => 'reporting',    'nom' => 'Synthèse & Reporting','categorie' => 'ANALYTIQUE',    'icone' => 'BarChart3',       'couleur' => '#22c55e', 'routes' => ['reporting.*', 'syntheses.*']],
    ['code' => 'equipe',       'nom' => 'Équipe / Collaborateurs', 'categorie' => 'CORE',     'est_core' => true,  'icone' => 'Users',          'couleur' => '#64748b', 'routes' => ['collaborateurs.*']],
    ['code' => 'parametres',   'nom' => 'Paramètres',          'categorie' => 'CORE',          'est_core' => true,  'icone' => 'Settings',        'couleur' => '#64748b', 'routes' => ['parametres.*']],
    ['code' => 'import',       'nom' => 'Import de données',   'categorie' => 'ADMINISTRATION','icone' => 'Upload',          'couleur' => '#10b981', 'routes' => ['import.*']],
];
```

### Modèle `Module`
```php
class Module extends Model {
    protected $fillable = ['code', 'nom', 'description', 'icone', 'couleur', 'categorie', 'routes', 'dependances', 'est_core', 'est_premium', 'ordre', 'actif'];
    protected $casts = ['routes' => 'array', 'dependances' => 'array', 'est_core' => 'boolean', 'est_premium' => 'boolean', 'actif' => 'boolean'];
    public function societes() { return $this->belongsToMany(Societe::class)->withPivot(['actif', 'active_le', 'desactive_le'])->withTimestamps(); }
}
```

### Extension du modèle `Societe`
```php
public function modules() {
    return $this->belongsToMany(Module::class)->withPivot(['actif', 'active_le', 'desactive_le', 'active_par_user_id', 'parametres'])->withTimestamps();
}
public function modulesActifs() {
    return $this->modules()->wherePivot('actif', true);
}
public function aModule(string $code): bool {
    return $this->modulesActifs()->where('code', $code)->exists()
        || Module::where('code', $code)->where('est_core', true)->exists();
}
```

## 1.2 Logique de protection (gating)

### Middleware `VerifierModuleActif`
Crée `app/Http/Middleware/VerifierModuleActif.php` :
```php
public function handle(Request $request, Closure $next, string $codeModule) {
    $societe = $request->user()?->collaborateurActif?->societe;
    if (!$societe) abort(403, 'Société non identifiée.');
    if (!$societe->aModule($codeModule)) {
        abort(403, "Le module « {$codeModule} » n'est pas activé pour votre société.");
    }
    return $next($request);
}
```
Enregistrer dans `bootstrap/app.php` (Laravel 11+/13) sous l'alias `module`.

### Application sur les routes
Dans `routes/web.php` :
```php
Route::middleware(['auth', 'inject.societe'])->group(function () {
    Route::middleware('module:okr')->prefix('okr')->group(function () {
        Route::get('/', [ObjectifController::class, 'index'])->name('okr.index');
        // ...
    });
    Route::middleware('module:prospection')->prefix('prospection')->group(function () { /* ... */ });
    Route::middleware('module:missions')->prefix('missions')->group(function () { /* ... */ });
    Route::middleware('module:incentives')->prefix('incentives')->group(function () { /* ... */ });
    Route::middleware('module:lms')->prefix('lms')->group(function () { /* ... */ });
    Route::middleware('module:matrice')->prefix('matrice')->group(function () { /* ... */ });
    Route::middleware('module:individuels')->prefix('individuels')->group(function () { /* ... */ });
    Route::middleware('module:reporting')->prefix('reporting')->group(function () { /* ... */ });
    Route::middleware('module:import')->prefix('import')->group(function () { /* ... */ });
    // Les routes core (dashboard, paramètres, collaborateurs) restent sans middleware module.
});
```

### Partage Inertia
Dans `HandleInertiaRequests::share()`, ajouter :
```php
'modulesActifs' => fn() => $request->user()
    ? $request->user()->collaborateurActif?->societe?->modulesActifs()
        ->orderBy('ordre')->get(['code', 'nom', 'icone', 'couleur', 'categorie'])
    : [],
```
→ disponible côté React via `usePage().props.modulesActifs`.

## 1.3 Gating côté frontend (Navigation)

### Refactor de `Sidebar.jsx` et `TopbarNav.jsx`
Les deux composants doivent **filtrer dynamiquement** les items selon `modulesActifs` :
```jsx
const { modulesActifs } = usePage().props;
const codesActifs = new Set(modulesActifs.map(m => m.code));
const itemsVisibles = TOUS_LES_ITEMS.filter(item => !item.moduleCode || codesActifs.has(item.moduleCode));
```
Pour chaque item de nav, ajouter une prop `moduleCode` qui correspond au code du module. Les items sans `moduleCode` (Dashboard, Paramètres) restent toujours visibles.

### Composant utilitaire `<RequireModule code="okr">{children}</RequireModule>`
Optionnel mais propre : empêche le rendu d'un bloc si le module n'est pas actif. Utile pour les boutons cross-modules (ex: bouton "Convertir en prospect" depuis un Objectif).

## 1.4 Interface de gestion par la société (Paramètres)

Dans `Pages/Parametres/Index.jsx`, **ajouter un nouvel onglet** « Modules » :
- Layout en **grille de cards** (3-4 colonnes responsive) — une card par module disponible.
- Chaque card affiche :
  - Icône du module (lucide-react) avec halo de la couleur du module
  - Nom du module + catégorie en label uppercase
  - Description courte (2 lignes max)
  - Badge "Premium" si applicable (ambre `#FEAC00`)
  - Badge "Cœur" gris pour les modules `est_core` (non désactivables)
  - **Toggle switch** (composant `<Switch>` shadcn) à droite, désactivé si `est_core`
  - Pied de card : "Activé le DD/MM/YYYY" ou "Non activé"
- Header de l'onglet :
  - Compteur "X / Y modules activés"
  - Recherche
  - Filtre par catégorie (pills colorées)
- Toggle → `router.put(route('parametres.modules.toggle', module.code), {}, { preserveScroll: true, preserveState: true })` avec confirmation modale si on désactive un module qui a des **dépendants** (ex: désactiver OKR si Individuels est encore actif → bloquer ou cascader avec avertissement).
- Affichage des **dépendances** : "Nécessite : Module OKR" sous le nom du module si dépendances présentes.

**Restriction** : seul un user avec rôle `admin` (au sein de la société) peut activer/désactiver les modules. Les `manager` et `collaborateur` voient l'onglet en lecture seule (toggles désactivés avec tooltip "Réservé à l'administrateur").

## 1.5 Contrôleur côté société
`app/Http/Controllers/Parametres/ModuleSocieteController.php` :
- `index()` : liste tous les modules avec leur état d'activation pour la société courante.
- `toggle(Module $module)` : bascule l'état du module. Vérifie : (1) user est `admin`, (2) module n'est pas `est_core` si on désactive, (3) gère les dépendances.

---

# 🎛️ CHANTIER 2 — Refonte SuperAdmin (console moderne)

## 2.1 Concept général

Une **zone totalement séparée** de l'app société, dédiée aux administrateurs de la plateforme Addvalis. URL préfixée `/superadmin/*`. Design **distinct mais cohérent** avec l'app cliente : palette légèrement différente (sidebar plus sombre, accents indigo `#6366f1` à la place du primary-500 bleu pour bien marquer le territoire), badge "ADMIN" visible.

## 2.2 Modèle de données

### Extension du modèle `User`
Ajouter une colonne `est_superadmin` (boolean, default false) via migration. Un superadmin :
- N'est pas attaché à une `societe_id` (peut être null) — ou attaché à une société "système" technique.
- Peut accéder à toutes les sociétés via **impersonation** (voir 2.5).

### Nouvelles tables
- `audit_logs` : id, user_id (nullable), societe_id (nullable), action (string), description (text), donnees (json), ip (string), user_agent (string), created_at. Pour tracer toutes les actions sensibles (création société, activation module, suppression données, impersonation, etc.).
- `abonnements` : id, societe_id, plan ('starter', 'pro', 'enterprise'), prix_mensuel (decimal), devise_id, date_debut, date_fin (nullable), statut ('actif', 'suspendu', 'annule'), limite_utilisateurs (int), limite_okr (int, nullable = illimité), notes (text).
- `factures` (optionnel — v1 peut s'en passer) : id, abonnement_id, numero, montant_ht, montant_ttc, statut ('en_attente', 'payee', 'en_retard'), date_emission, date_echeance, lien_pdf.

### Middleware `EstSuperAdmin`
```php
public function handle(Request $request, Closure $next) {
    if (!$request->user()?->est_superadmin) abort(403, 'Accès réservé aux super-administrateurs.');
    return $next($request);
}
```

## 2.3 Architecture du superadmin (côté code)

### Structure backend
```
app/Http/Controllers/SuperAdmin/
├── DashboardController.php       # Vue d'ensemble plateforme
├── SocieteController.php         # CRUD complet sociétés
├── UtilisateurController.php     # CRUD users globaux
├── ModuleController.php          # Catalogue des modules + activation distante
├── AbonnementController.php      # Plans + facturation
├── AuditLogController.php        # Consultation logs
├── ImpersonationController.php   # start/stop impersonation
└── ParametresPlateformeController.php  # Réglages globaux
```

### Structure frontend
```
resources/js/Pages/SuperAdmin/
├── Layout.jsx                    # Layout dédié (sidebar dark, header différent)
├── Dashboard.jsx                 # KPIs plateforme + graphs
├── Societes/
│   ├── Index.jsx                 # Tableau filtrable + actions bulk
│   ├── Create.jsx                # Wizard de création (multi-step)
│   ├── Show.jsx                  # Détail société : onglets Aperçu / Modules / Utilisateurs / Abonnement / Audit
│   └── Edit.jsx
├── Utilisateurs/
│   ├── Index.jsx
│   └── Show.jsx
├── Modules/
│   └── Index.jsx                 # Catalogue plateforme (édition métadonnées des modules)
├── Abonnements/
│   ├── Index.jsx
│   └── Plans.jsx                 # Gestion des plans Starter/Pro/Enterprise
├── AuditLogs/
│   └── Index.jsx                 # Timeline filtrable
└── Parametres/
    └── Index.jsx                 # Réglages globaux plateforme
```

### Routes
```php
Route::middleware(['auth', 'superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('societes', SocieteController::class);
    Route::post('societes/{societe}/modules/{module}/toggle', [SocieteController::class, 'toggleModule'])->name('societes.modules.toggle');
    Route::post('societes/{societe}/suspendre', [SocieteController::class, 'suspendre'])->name('societes.suspendre');
    Route::post('societes/{societe}/reactiver', [SocieteController::class, 'reactiver'])->name('societes.reactiver');
    Route::resource('utilisateurs', UtilisateurController::class);
    Route::resource('modules', ModuleController::class);
    Route::resource('abonnements', AbonnementController::class);
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::post('impersonation/{user}', [ImpersonationController::class, 'start'])->name('impersonation.start');
    Route::post('impersonation/stop', [ImpersonationController::class, 'stop'])->name('impersonation.stop');
    Route::get('parametres', [ParametresPlateformeController::class, 'index'])->name('parametres.index');
});
```

## 2.4 UI/UX détaillée — pages clés

### Layout SuperAdmin (`SuperAdmin/Layout.jsx`)
- **Sidebar dédiée** 280px, fond `slate-900` (vraiment dark, distinct du sidebar normal), accents `indigo-500`
- En-tête sidebar : logo Addvalis + sous-titre "Console Plateforme" en uppercase tracking-wider
- Sections :
  - **Vue d'ensemble** (Dashboard, Audit)
  - **Clients** (Sociétés, Utilisateurs, Abonnements)
  - **Catalogue** (Modules, Plans)
  - **Système** (Paramètres, Logs)
- Pied de sidebar : bloc user superadmin avec photo + nom + bouton "Quitter le superadmin" → renvoie vers `/dashboard`
- **Top bar** : breadcrumb + barre de recherche globale (Cmd+K) + bouton "Nouvelle société" + cloche notifications + avatar
- Background du contenu : `slate-50` light / `slate-950` dark (légèrement plus sombre/froid que l'app société pour différencier)

### `Dashboard.jsx` — Vue d'ensemble plateforme
Layout en grille 12 colonnes :

**Rangée 1 — KPIs hero (4 grandes cards)**
- Sociétés actives (compteur + Δ mois) — icône Building2 indigo
- Utilisateurs total (compteur + Δ) — icône Users sky
- MRR (Monthly Recurring Revenue) en devise master (`formatCurrency()`) — icône TrendingUp emerald
- Modules les plus actifs (top 3 inline avec mini-bars) — icône Package amber

**Rangée 2 — Graphs (2x 6 colonnes)**
- **Croissance** : LineChart (Recharts) des inscriptions sur 12 mois
- **Répartition par plan** : DonutChart Starter/Pro/Enterprise avec pourcentages

**Rangée 3 — Listes (2x 6 colonnes)**
- **Dernières sociétés inscrites** (table 5 lignes : Nom, Plan, Date, Statut badge, action "Voir")
- **Activité récente** (timeline des 10 derniers audit_logs avec icônes par type d'action)

**Rangée 4 — Alertes (pleine largeur)**
- Bandeau si abonnements expirant dans < 30 jours
- Bandeau si sociétés sans activité depuis > 30 jours

### `Societes/Index.jsx` — Liste des sociétés clientes
Header :
- Titre "Sociétés clientes" + compteur
- Bouton primaire **"+ Nouvelle société"** → ouvre le wizard de création
- Filtres : recherche, statut (actif/suspendu/annulé), plan, dropdown "Modules activés contenant…"
- Vue toggle : Tableau ↔ Cards

**Tableau** :
| ☐ | Logo | Nom | Code | Pays/Devise | Plan | Modules actifs | Utilisateurs | MRR | Statut | Dernière activité | Actions |
- Pastille colorée à gauche pour le statut (vert/ambre/rouge)
- Colonne "Modules actifs" : mini-chips colorés (max 5 + "+N")
- Actions dropdown : Voir, Éditer, Impersonner, Suspendre, Supprimer
- Bulk actions en haut quand sélection : Suspendre / Réactiver / Exporter CSV
- Pagination en bas, 20 lignes/page par défaut

### `Societes/Create.jsx` — **Wizard de création multi-étapes** (CRUCIAL)
**Architecture en 4 étapes** (composant `<Stepper>` en haut, état step dans React) :

**Étape 1 — Informations générales**
- Nom de la société (input)
- Code court (slug auto-généré, éditable)
- Logo (upload avec preview circulaire)
- Pays (Select avec drapeaux)
- Devise (Select des devises existantes, par défaut GNF)
- Layout par défaut (radio : Sidebar / Topbar)
- Couleur primaire (color picker, défaut `#3b82f6`)

**Étape 2 — Abonnement & limites**
- Choix du plan (3 grandes cards radio : Starter / Pro / Enterprise) — chaque card affiche prix, limites, modules inclus suggérés
- Date de début (par défaut aujourd'hui)
- Durée (mensuel / annuel / personnalisé)
- Limite utilisateurs (NumberInput, suggérée selon le plan, ajustable)
- Limite objectifs OKR (NumberInput, illimité par défaut sur Pro/Enterprise)

**Étape 3 — Sélection des modules** ⭐ *(point clé du chantier 1)*
- Section "Modules cœur" (toujours activés, désactivable seulement avec confirmation explicite — affichés grisés cochés)
- Sections par catégorie : MANAGEMENT, BUSINESS, ANALYTIQUE, ADMINISTRATION
- Chaque section = grille de **cards interactives** :
  - Card avec : icône colorée + nom + description courte + checkbox/toggle
  - Hover : élévation `shadow-lg`, ring `ring-2 ring-indigo-500`
  - Card sélectionnée : fond `indigo-50 dark:indigo-950/30` + check vert
  - Badge "Premium" en haut à droite si applicable
  - Affichage des dépendances : "Active automatiquement : Module OKR" en pied de card
- **Bouton "Sélection rapide"** en haut : `Tout sélectionner`, `Recommandé pour ce plan`, `Modules essentiels uniquement`
- Sidebar droite : résumé en temps réel "X modules sélectionnés" + liste compacte

**Étape 4 — Compte administrateur**
- Création du premier compte admin de la société :
  - Prénom, Nom, Email, Téléphone
  - Mot de passe (avec bouton "Générer un mot de passe sécurisé")
  - Case "Envoyer un email de bienvenue avec les identifiants"
  - Case "Pré-remplir avec des données de démonstration" (lance `DefaultOkrConfigSeeder` + dataset démo des modules activés)

**Footer du wizard** : boutons "Précédent" / "Suivant" / "Créer la société" (dernier step). Validation par step. Animation Framer Motion (slide horizontal entre steps).

À la soumission finale : `router.post(route('superadmin.societes.store'), data)` qui crée tout en transaction.

### `Societes/Show.jsx` — Détail d'une société
**Header** : logo + nom + statut badge + boutons (Éditer, Impersonner, Suspendre, Supprimer)
**KPIs en bandeau** : Utilisateurs actifs / Objectifs créés / Taux d'activité / MRR

**Onglets** (composant `<Tabs>` shadcn) :
1. **Aperçu** : infos générales, dates clés, dernière activité, mini-graph d'usage 30 jours
2. **Modules** ⭐ : la **même UI cards que l'étape 3 du wizard** mais éditable à la volée. Toggle d'un module → activation immédiate avec confirmation. Bandeau jaune si modification depuis < 5 min.
3. **Utilisateurs** : liste des collaborateurs de la société avec rôle, dernière connexion, bouton "Impersonner"
4. **Abonnement** : plan actuel, historique des renouvellements, bouton "Changer de plan"
5. **Audit** : timeline des actions sur cette société (qui a fait quoi, quand)
6. **Données** : stats (X objectifs, Y tâches, Z prospects…) + bouton "Exporter toutes les données" (RGPD) + bouton danger "Supprimer définitivement la société"

### `Modules/Index.jsx` — Catalogue plateforme
Vue d'ensemble du catalogue des modules :
- Grille de cards (mêmes cards que le wizard)
- Pour chaque module : nom, code, catégorie, nb de sociétés qui l'ont activé, est_core/est_premium
- Bouton "Éditer" sur chaque card → modal d'édition (nom, description, icône, couleur, catégorie, est_premium, ordre, actif)
- Bouton "+ Nouveau module" en haut → modal de création (utile pour préparer un module futur même avant son dev)
- Graphique : adoption des modules (bar chart horizontal du % de sociétés qui ont chaque module activé)

### `Utilisateurs/Index.jsx`
- Tableau de tous les users globaux + filtre par société
- Colonnes : Avatar, Nom, Email, Société(s), Rôle, Dernière connexion, Statut, Actions
- Action "Impersonner" sur chaque ligne
- Action "Promouvoir superadmin" / "Révoquer superadmin"

### `AuditLogs/Index.jsx`
- Timeline verticale avec icônes par type d'action
- Filtres : date range, société, user, type d'action
- Recherche full-text dans la description
- Export CSV

## 2.5 Fonctionnalité d'impersonation

**Backend** :
- `ImpersonationController::start(User $user)` : stocke `session('impersonator_id')` = id du superadmin actuel, puis `Auth::login($user)`. Log dans audit.
- `ImpersonationController::stop()` : récupère `impersonator_id`, le relog, oublie la session, log audit.

**Frontend** :
- Quand on impersonne, **bandeau jaune fixe en haut** de toutes les pages : "⚠ Vous êtes connecté en tant que **{nom user}** dans **{nom société}** — [Quitter l'impersonation]"
- Partagé via `HandleInertiaRequests` : `'impersonation' => session('impersonator_id') ? ['user' => Auth::user(), 'societe' => …] : null`

## 2.6 Audit Logs — Traçabilité

Créer un **Observer ou listener générique** qui logge automatiquement :
- Création / modification / suppression de société
- Activation / désactivation de module pour une société
- Création / suppression / modification d'utilisateur
- Changement de plan d'abonnement
- Démarrage / arrêt d'impersonation
- Connexion superadmin

Helper global :
```php
function audit(string $action, ?string $description = null, array $donnees = [], ?int $societeId = null): void {
    AuditLog::create([
        'user_id' => Auth::id(),
        'societe_id' => $societeId ?? Auth::user()?->collaborateurActif?->societe_id,
        'action' => $action,
        'description' => $description,
        'donnees' => $donnees,
        'ip' => request()->ip(),
        'user_agent' => request()->userAgent(),
    ]);
}
```

## 2.7 Navigation entre app société et superadmin

- **Pour un user superadmin connecté** : un bouton discret "Console" dans le menu utilisateur (avatar dropdown) qui redirige vers `/superadmin`
- **Depuis le superadmin** : bouton "Retour à l'app" qui ramène vers `/dashboard`
- **Distinction visuelle forte** : couleurs, icône logo différente, badge "ADMIN" toujours visible

## 2.8 Design tokens spécifiques au superadmin

Pour bien différencier visuellement la console superadmin de l'app société, utiliser une variante de la palette :
- **Accent primaire superadmin** : Indigo `#6366f1` (au lieu du bleu `#3b82f6` de l'app société)
- **Fond sidebar superadmin** : `slate-900` (vs `white` ou `gray-50` côté société)
- **Cards de section** : utiliser un léger gradient `from-white to-slate-50` (light) et `from-slate-900 to-slate-950` (dark)
- **Badges de statut société** :
  - Actif : `bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400`
  - Suspendu : `bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`
  - Annulé : `bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400`
- **Badge "ADMIN"** : `bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold` dans le header du layout

---

## 📦 Livrables attendus (les deux chantiers)

### Migrations
1. `2026_xx_xx_create_modules_table.php`
2. `2026_xx_xx_create_societe_module_table.php`
3. `2026_xx_xx_add_est_superadmin_to_users_table.php`
4. `2026_xx_xx_create_audit_logs_table.php`
5. `2026_xx_xx_create_abonnements_table.php`

### Seeders
1. `ModuleSeeder` (idempotent, liste complète des modules existants)
2. `SuperAdminSeeder` (crée un compte superadmin par défaut `superadmin@addvalis.com` en dev)
3. Modifier `SocieteSeeder` pour attacher tous les modules par défaut aux sociétés seedées
4. Modifier l'event listener `Societe::created` pour attacher automatiquement les modules `est_core` à toute nouvelle société

### Backend
1. Modèles : `Module`, `Abonnement`, `AuditLog`
2. Extension de `Societe` (relation `modules()`, méthode `aModule()`)
3. Extension de `User` (champ `est_superadmin`, scope `superadmins()`)
4. Middleware `VerifierModuleActif` (alias `module`)
5. Middleware `EstSuperAdmin` (alias `superadmin`)
6. 8 controllers SuperAdmin (Dashboard, Societe, Utilisateur, Module, Abonnement, AuditLog, Impersonation, ParametresPlateforme)
7. 1 controller société : `ModuleSocieteController`
8. Helper global `audit()`
9. Routes ajoutées dans `routes/web.php` (groupes `superadmin` et `module:*`)
10. Partage Inertia étendu : `modulesActifs`, `impersonation`, `estSuperadmin`
11. Application du middleware `module:*` sur toutes les routes des modules concernés

### Frontend
1. Filtrage dynamique de `Sidebar.jsx` et `TopbarNav.jsx` selon `modulesActifs`
2. Nouvel onglet "Modules" dans `Pages/Parametres/Index.jsx` (vue société, en lecture seule pour non-admins)
3. Composant utilitaire `<RequireModule>`
4. Page bouton menu user "Console" pour superadmin
5. Layout dédié `Pages/SuperAdmin/Layout.jsx`
6. Pages SuperAdmin complètes (Dashboard, Sociétés Index/Create-wizard/Show/Edit, Utilisateurs, Modules, Abonnements, AuditLogs, Paramètres)
7. Bandeau d'impersonation global (intégré dans `AppLayout`)
8. Composants partagés : `ModuleCard` (réutilisé dans wizard, Show société, et onglet Paramètres société), `StatusBadge`, `KPICard`, `AuditTimeline`, `Stepper`

### Documentation
1. Mise à jour du `DEVBOOK.md` avec deux nouvelles sections :
   - **Phase 5b : Gestion modulaire des accès**
   - **Phase 5c : Console SuperAdmin**
2. Ajout des tables nouvelles dans la liste "Base de données — Tables principales"

---

## ⚙️ Plan d'attaque suggéré

Pour éviter de tout casser, voici l'ordre recommandé :

1. **DB + modèles** : créer les tables `modules`, `societe_module`, `audit_logs`, `abonnements`, et la colonne `est_superadmin`. Seeder `ModuleSeeder`.
2. **Backend gating** : middleware `VerifierModuleActif`, extension `Societe::aModule()`, helper `audit()`, partage Inertia.
3. **Frontend gating** : filtrage Sidebar/TopbarNav + onglet Modules dans Paramètres société (test côté société d'abord — c'est l'usage le plus immédiat).
4. **Application sur les routes** : ajouter `module:*` progressivement, en testant chaque module l'un après l'autre.
5. **SuperAdmin — squelette** : middleware `EstSuperAdmin`, layout dédié, page Dashboard avec KPIs basiques.
6. **SuperAdmin — Sociétés Index** + page Show (sans wizard).
7. **SuperAdmin — Wizard de création** (le morceau le plus complexe).
8. **SuperAdmin — Impersonation** + bandeau global.
9. **SuperAdmin — Audit logs** + observers automatiques.
10. **SuperAdmin — Modules / Utilisateurs / Abonnements** (CRUD restants).
11. **Polish UI** : animations Framer Motion, dark mode, responsive.
12. **Mise à jour du DEVBOOK.md**.

---

## 🚨 Contraintes à respecter absolument

- ❌ **Ne JAMAIS** utiliser `response()->json()` — toujours `Inertia::render()` ou `redirect()->back()`
- ❌ **Ne JAMAIS** utiliser `useForm` pour les modals — toujours `router.post` avec `preserveState: true`
- ❌ **Ne JAMAIS** mettre de texte en anglais dans l'UI
- ❌ **Ne JAMAIS** hardcoder un `societe_id` ou un module en dur dans la navigation
- ❌ **Ne JAMAIS** désactiver un module `est_core` sans confirmation explicite, et ne pas permettre de le désactiver côté société (uniquement superadmin)
- ✅ **TOUJOURS** vérifier le rôle `admin` côté société pour modifier les modules
- ✅ **TOUJOURS** vérifier `est_superadmin` côté superadmin
- ✅ **TOUJOURS** logger les actions sensibles dans `audit_logs`
- ✅ **TOUJOURS** utiliser le trait `BelongsToSociete` sur les nouveaux modèles métier
- ✅ **TOUJOURS** utiliser `<NumberInput>` pour les champs numériques (limites utilisateurs, prix, etc.)
- ✅ **TOUJOURS** suivre le design system v6 côté société, et la variante "console" (indigo + slate-900) côté superadmin
- ✅ **TOUJOURS** rester dans la stack existante (Laravel 13 + Inertia + React + Tailwind + shadcn/ui + Framer Motion + Recharts)

---

## 🎬 Pour démarrer

1. Lis intégralement le `DEVBOOK.md` du projet, en particulier les sections "Conventions de Codage", "Architecture Multi-Tenant", "Design System & UI", et la liste des phases déjà complétées.
2. Inspecte `Sidebar.jsx`, `TopbarNav.jsx`, `AppLayout.jsx`, `HandleInertiaRequests.php`, et `Pages/Parametres/Index.jsx` pour comprendre les conventions visuelles et de partage Inertia.
3. Avant de coder, **propose-moi un plan d'attaque détaillé** sous forme de checklist, en respectant l'ordre suggéré ci-dessus. Je validerai puis tu commenceras à coder par petits incréments testables.
4. À chaque étape importante, commit Git avec un message clair (ex: `feat(modules): table modules + pivot societe_module + seeder`).
5. À la fin, mets à jour le `DEVBOOK.md` avec les deux nouvelles phases.

Pose-moi des questions si quelque chose te paraît ambigu — notamment sur le découpage des plans (Starter/Pro/Enterprise), la stratégie de pricing, ou des choix d'UX précis sur le wizard. Ne pars pas sur des suppositions risquées.
