# 📘 DEVBOOK — Addvalis SaaS Performance

Ce document sert de référence technique et de guide architectural pour le développement de la plateforme Addvalis SaaS Performance. Il documente les choix techniques, les normes de codage et l'état d'avancement du projet.

---

## 🏗️ Architecture Globale

Le projet repose sur la stack **TALL/VILT** moderne :
- **Backend** : Laravel 13
- **Frontend** : React 18 avec Inertia.js
- **Styling** : Tailwind CSS v3 avec configuration personnalisée (palette Addvalis)
- **UI Components** : Architecture basée sur **shadcn/ui** (utilisant `@radix-ui/react-*` pour l'accessibilité)
- **Animations** : Framer Motion
- **Base de données** : MySQL
- **Langue de l'interface** : Français (toute l'UI est en français)

---

## 🏢 Architecture Multi-Tenant

Le concept central de l'application est la gestion multi-sociétés (Multi-Tenant).

### Modèle de données
- Une table centrale `societes`.
- Toutes les données liées à une entreprise (collaborateurs, objectifs, tâches, etc.) contiennent une clé étrangère `societe_id`.

### Isolation des données
1. **Trait Eloquent `BelongsToSociete`** :
   - Ajouté à tous les modèles spécifiques à une entreprise.
   - Applique automatiquement un hook `creating` pour filtrer les requêtes sur le `societe_id` de l'utilisateur en cours.
   - Assigne automatiquement le `societe_id` lors de la création d'un enregistrement.
   - Fournit le scope `scopePourSociete($societeId)`.

2. **Middleware `InjecterSociete`** :
   - Vérifie la session de l'utilisateur pour déterminer sa société active.
   - Partage les données de la société via Inertia pour le frontend.

3. **Modèle `User` et `Collaborateur`** :
   - Un `User` (compte d'authentification) est lié à un ou plusieurs `Collaborateurs`.
   - Chaque `Collaborateur` a un rôle spécifique (`admin`, `manager`, `collaborateur`) au sein de sa société.

4. **Auto-seed OKR** :
   - Lorsqu'une société est créée, `Societe::created` appelle automatiquement `DefaultOkrConfigSeeder` pour pré-remplir les paramètres OKR par défaut (axes, périodes, types, statuts, seuils, config).

---

## 🎨 Design System & UI (v6 — Refonte Avril 2026)

### Design Language
- **Style** : Tracker/dashboard professionnel inspiré d'outils OKR modernes.
- **Fond** : `gray-50` light / `dark-950` dark.
- **Cards** : `rounded-xl`, `border-gray-200`, `shadow-sm`, padding `p-5`.
- **Typographie** : `text-[13px]` body, `text-[10px]–[11px]` labels uppercase tracking-wider.
- **Primary** : Bleu (`#3b82f6` / `primary-500`), fallback quand pas de seuils configurés.

### Couleurs (Palette Addvalis)
- **Primaire** : Bleu (`#3b82f6`) — utilisé comme accent principal dans l'UI.
- **Secondaire** : Ambre (`#FEAC00`).
- **Palette étendue** : Tailwind standard + custom `dark-*` et `surface-*`.

### Mode Sombre
- Le dark mode est implémenté via la stratégie `class` de Tailwind.
- Prise en charge native dans toute l'interface.

### Layouts paramétrables
- **Sidebar** (défaut) : Barre latérale **260px** à gauche, navigation groupée, état actif en teinte `primary-500/10`, typographie compacte.
- **Topbar** : Header dark gradient avec pills colorées (11 onglets : OKR, Individuels, Daily, Prospection, LMS, Missions, Incentives, Synthèse, Équipe, Offre, Matrice) + badge version `v6` + icônes d'action (paramètres, partage, fullscreen) + menu utilisateur.
- Paramétrable par société via `societes.layout_mode` (`sidebar` / `topbar`).
- Max width `1400px` pour le contenu principal.
- Header sidebar : `backdrop-blur-md`, `h-16`, border-b.

### Composants UI
- Les composants UI se trouvent dans `resources/js/Components/ui/`.
- Ils suivent l'approche shadcn/ui : code source intégré pour une personnalisation totale, basés sur Radix UI et `class-variance-authority` (cva).
- **NumberInput** : composant spécialisé pour les champs numériques avec formatage français en temps réel (`150 000,5`). Supporte `suffix` (GNF, %), `decimals`, auto-select au focus.

### Formatage des nombres
- Format français partout : `150 000,5` (espaces comme séparateur de milliers, virgule décimale).
- Utilitaires : `formatNumber(value, decimals)` et `parseFormattedNumber(str)` dans `lib/utils.js`.
- Tous les `type="number"` remplacés par `<NumberInput>`.
- Affichages : `formatNumber()` au lieu de `.toLocaleString()`.

---

## 📂 Structure du Projet

### Backend
- `app/Models/` : Modèles Eloquent (20+ modèles).
- `app/Models/Traits/` : Traits réutilisables (`BelongsToSociete`).
- `app/Http/Controllers/` : Contrôleurs groupés par logique métier.
- `app/Http/Middleware/` : Middlewares personnalisés (`InjecterSociete`, `HandleInertiaRequests`).
- `database/seeders/` : Seeders modulaires (`SocieteSeeder`, `CollaborateurSeeder`, `ParametreOKRSeeder`, `OKRSeeder`, `TacheSeeder`, `ProspectSeeder`).

### Frontend
- `resources/js/Pages/` : Vues React rendues par Inertia, groupées par module :
  - `Auth/` : Login, Register, ForgotPassword, ResetPassword, ConfirmPassword, VerifyEmail
  - `Dashboard.jsx` : Tableau de bord enrichi (stats MiniStat inline, progression par axe, pipeline, top collaborateurs, alertes)
  - `OKR/` : Index (vue hiérarchique expandable avec KRs + tâches), Create (page avancée), Show (détail + édition progression)
  - `Taches/` : Index (Kanban avec drag & drop), Daily.jsx (bilan journalier avec onglets équipe, compteurs activité, historique 7j)
  - `Collaborateurs/` : Index, Create, Edit, Show
  - `Prospection/` : Index (Kanban pipeline)
  - `Incentives/` : Index, Validation
  - `Parametres/` : Index (société), OKR (8 onglets de configuration)
  - `Missions/` : Index (tableau + panneau latéral : onglets Livrables, Infos, Journal)
  - `LMS/`, `Reporting/` : Pages placeholder
- `resources/js/Components/` : Composants réutilisables (`Sidebar`, `TopbarNav`, `StatsCard`, `EmptyState`).
- `resources/js/Components/ui/` : Composants UI (Button, Input, NumberInput, Select, Badge, Card, Dialog, Table, Tabs, Progress, Avatar, DropdownMenu, Tooltip, Separator).
- `resources/js/Layouts/` : `AppLayout` (switch dynamique Sidebar/Topbar), `GuestLayout`, `AuthenticatedLayout`.
- `resources/js/lib/utils.js` : Utilitaires (`cn`, `formatNumber`, `parseFormattedNumber`, `formatCurrency`, `getInitials`, `capitalize`).

---

## ⚙️ Système OKR Paramétrable

Le module OKR est **entièrement configurable** par société, sans aucune valeur codée en dur.

### Tables de configuration (10 tables)
| Table | Rôle |
|-------|------|
| `axes_objectifs` | Axes stratégiques (nom, couleur, ordre, actif) |
| `periodes` | Périodes OKR (nom, dates, type mensuel/trimestriel/annuel, statut) |
| `types_objectifs` | Types d'objectifs (individuel, équipe, entreprise) |
| `types_resultats_cles` | Types de KR (quantitatif, pourcentage, booléen, financier) |
| `statuts_objectifs` | Statuts personnalisés (nom, couleur, ordre, est_final) |
| `seuils_performance` | Seuils de couleur (Critique → Excellent) |
| `configurations_okr` | Config globale (mode calcul, fréquence update, visibilité, vue par défaut) |
| `configurations_primes` | Config primes (actif, montant max, seuil minimum, mode calcul) |
| `paliers_primes` | Paliers par seuils pour le calcul des primes |
| `templates_objectifs` | Modèles d'objectifs réutilisables |

### Calcul de progression
- **Moyenne simple** : moyenne des progressions de tous les KR.
- **Pondéré** : somme pondérée par le `poids` de chaque KR.
- **Manuel** : saisie directe.
- Configurable via `configurations_okr.mode_calcul`.

### Interface de configuration
- Accessible via **Paramètres OKR** (8 onglets : Axes, Périodes, Types, Résultats Clés, Statuts, Seuils, Configuration, Primes).
- CRUD complet pour chaque entité avec dialogues modaux.
- 21 routes dédiées sous `/parametres/okr`.

### Vue OKR hiérarchique (v6)
- **Onglets de période** : style underline avec plage de dates (ex: "Q2 2026 Avr-Juin"). Clic toggle sélection.
- **Barre de filtres** : FILTRES label + recherche + responsables + statuts + bouton "× Effacer".
- **Bandeau de progression globale** : barre pleine largeur avec gradient, dot coloré, pourcentage.
- **Bouton "+ Nouvel objectif"** : ouvre un **modal de création rapide** (intitulé + **périodes multi-sélection** (checkboxes) + responsable + KRs dynamiques). Utilise `router.post` avec `preserveState: true` et validation client-side. KRs vides filtrés automatiquement. Erreurs affichées dans un bandeau rouge. Un objectif peut couvrir **plusieurs trimestres** via la table pivot `objectif_periode`.
- **Cartes objectif expandables** (composant `ObjectifCard`) :
  - Header : chevron expand + dot axe + titre + badge axe (couleur) + badge type + badge % progression.
  - Sub-line : X/Y tâches · N KR + mini progress bar.
  - Actions : bouton crayon (éditer via `EditObjectifModal`) + dropdown (Détails, Supprimer).
  - **Hiérarchie Objectif → KR → Tâche** : chaque KR affiche ses tâches directement en dessous.
  - **Section Résultats Clés** : grandes barres `h-7` colorées (palette `krBarColors`) avec texte intégré, compteur tâches, et % à droite.
  - **Tâches groupées par KR** : sous chaque barre KR, les tâches associées sont affichées avec colonnes Checkbox | Tâche | Resp. | Prio. | Deadline | Actions.
  - **Checkbox fonctionnelle** : toggle `a_faire` ↔ `termine` via `PUT /taches/{id}/status`. Texte barré quand terminé.
  - **Boutons d'action tâche** : œil → ouvre panneau détail slide-over ; poubelle → suppression avec confirmation.
  - **"+ Ajouter une tâche"** par KR : chaque KR a son bouton pour ajouter une tâche directement liée à ce KR.
- **Modal d'édition d'objectif** (`EditObjectifModal`) : formulaire complet inline pour modifier titre, responsable, **périodes multiples** (checkboxes), axe, type, visibilité, prime, et tous les KRs (ajout/modification/suppression). Les KRs ont un champ `description_detaillee` (textarea). Envoi via `router.put` avec sync des KRs et périodes.
- **Modal d'ajout de tâche** (`AddTaskModal`) : formulaire compact avec sélection obligatoire du KR cible, `router.post` vers `taches.store`, validation client-side, `preserveState: true`.
- **Panneau de détail tâche** (`TaskDetailPanel`) : slide-over animé (framer-motion spring) depuis la droite avec **mode édition** complet :
  - Header : titre (éditable) + sous-titre KR + boutons ×/✓/crayon.
  - Onglets : Fiche (actif) / Note (textarea libre).
  - Sections Fiche : 📋 Informations (badges éditables : statut, priorité, eisenhower, date, responsable), 📝 Description & Contexte (textarea), 📋 Mode Opératoire (étapes dynamiques ajout/suppression), 🔧 Outils & Ressources (input texte), ✅ Définition de "Done" (critères dynamiques ajout/suppression).
  - Footer : bouton "Modifier" / "Enregistrer" + poubelle.
- **Page Create** (`OKR/Create.jsx`) : formulaire complet pour création avancée (tous les champs : axe, type, visibilité, prime, KRs détaillés avec type/cible/poids/unité).
- **Page Show** (`OKR/Show.jsx`) : détail objectif avec édition progression KR, historique progression (graphique LineChart), gestion tâches liées, sidebar infos.

---

## 📅 Module Daily (Bilan Journalier) — v6

### Architecture
- **Controller** : `BilanJournalierController` avec support multi-collaborateur.
- **Modèle** : `BilanJournalier` avec champs `note`, `blocages`, `seminaires`, `recherches`, `prospection`, `rdv`, `delivery`.
- **Migration** : `2026_04_27_000001_add_activites_to_bilans_journaliers` (5 compteurs d'activité ajoutés).

### Page Daily (`Taches/Daily.jsx`)
- **Onglets équipe** : pills colorées pour chaque collaborateur actif. Clic = changer de collaborateur.
- **Header utilisateur** : nom + poste + date formatée (JJ / MM / AAAA) + picker date + bouton "Aujourd'hui" + bouton "+ Tâche" (orange).
- **Section "Tâches déclarées"** : liste des tâches du jour avec dots de statut, empty state "Clique sur + Tâche pour commencer".
- **Section "Bilan fin de journée"** : 5 compteurs d'activité colorés éditables (Séminaires cyan, Recherches bleu, Prospection vert, RDV orange, Delivery violet) + textarea "Note (blocages, avancement, priorités demain)" + bouton "Enregistrer".
- **Section "Historique 7 jours"** : toggle Voir/Masquer, résumé par jour avec compteurs et note.
- **Mode lecture seule** : quand `isOwn === false`, champs désactivés (consultation du daily d'un collègue).

---

## � Module Matrice Eisenhower

### Architecture
- **Controller** : `EisenhowerController` avec méthodes `index()` et `updateEisenhower()`.
- **Route** : `/matrice` (GET) et `/matrice/{tache}/eisenhower` (PUT).
- **Page** : `resources/js/Pages/Matrice/Index.jsx`.

### Fonctionnalités
- **Vue 4 quadrants** en grille 2×2 responsive :
  - **Q1 — Faire maintenant** : Urgent + Important (bordure rouge).
  - **Q2 — Planifier** : Important + Pas urgent (bordure bleue).
  - **Q3 — Déléguer** : Urgent + Pas important (bordure ambre).
  - **Q4 — Éliminer** : Ni urgent ni important (bordure grise).
- **Filtrage par période** : onglets underline comme la page OKR, filtre via `objectif.periode_id`.
- **Filtrage par collaborateur** : select dans la barre de filtres.
- **Toggle statut** : clic checkbox pour marquer une tâche terminée/à faire directement.
- **Expand/collapse** : affiche 8 tâches par quadrant puis "+N de plus..." pour voir le reste.
- **Stats header** : compteur total, terminées, et mini-dots Q1-Q4.

### Champ `eisenhower` sur les tâches
- Colonne `eisenhower` (string nullable, valeurs: `Q1`, `Q2`, `Q3`, `Q4`) ajoutée par migration `2026_04_28_000001_add_structured_fields_to_taches`.
- Éditable dans : `TaskDetailPanel` (slide-over), `AddTaskModal` (modal création tâche), et la colonne "Eisen." des tables de tâches OKR.

---

## � État d'avancement des Modules

### Phase 1 : Fondations et Layout ✅
- [x] Configuration du Design System et Tailwind.
- [x] Composants UI de base (boutons, inputs, cards, NumberInput...).
- [x] Double layout paramétrable (Sidebar / Topbar) par société.
- [x] Base de données : Migrations et Modèles.
- [x] Architecture multi-tenant opérationnelle.
- [x] Tableau de bord enrichi (stats, progression par axe, pipeline, top collaborateurs, alertes urgentes).
- [x] Gestion complète des Collaborateurs (CRUD, rôles).
- [x] Paramètres de la société (Logo, couleurs, mode de navigation).
- [x] Seeders modulaires (6 seeders indépendants).
- [x] Toute l'interface en français.

### Phase 2 : OKR et Tâches ✅
- [x] Module OKR : Vue hiérarchique expandable avec KRs + tâches inline, création via modal rapide, suivi des résultats clés.
- [x] Système OKR entièrement paramétrable (10 tables, 21 routes de configuration).
- [x] Seuils de performance avec couleurs dynamiques.
- [x] Module Tâches : Vue Kanban, drag & drop, édition complète, suppression.
- [x] Bilans journaliers (Daily) : onglets équipe, compteurs activité (5 types), historique 7j, mode lecture seule.
- [x] Formatage des nombres français partout (NumberInput).
- [x] Panneau de détail tâche (slide-over) avec sections structurées et **mode édition inline complet**.
- [x] Checkbox tâche fonctionnelle (toggle statut a_faire ↔ termine).
- [x] **Objectif multi-trimestres** : table pivot `objectif_periode`, sélection multi-période (checkboxes) à la création et à l'édition. Un objectif apparaît dans chaque période sélectionnée.
- [x] **Édition complète Objectif/KR/Tâche** : `EditObjectifModal` (titre, périodes, axe, type, visibilité, prime, KRs), édition KR inline (description, description détaillée, type, cible, poids, unité), `TaskDetailPanel` avec mode édition (tous les champs).
- [x] **Description détaillée KR** : colonne `description_detaillee` (text) ajoutée à `resultats_cles`. Éditable dans le modal d'édition d'objectif via textarea.

### Phase 3 : Prospection et Incentives ✅
- [x] Module Prospection : Vue Pipeline (Kanban) avec drag & drop, recherche, création avec secteur/contact/RDV/notes.
- [x] Module Incentives : Tableau des objectifs rémunérés, création, espace de validation des primes avec calcul automatique.

### Phase 4 : Refonte UI (v6) ✅
- [x] Refonte totale du design inspirée d'un tracker professionnel.
- [x] TopbarNav : header dark compact, 11 pills colorées, badge v6, icônes d'action.
- [x] Sidebar : 260px, état actif primary/10, typographie compacte.
- [x] OKR Index : vue hiérarchique, modal création rapide, task panel slide-over, KR barres h-7 colorées.
- [x] Dashboard : composant MiniStat inline, spacing optimisé.
- [x] Daily : refonte complète avec onglets équipe, compteurs activité, historique.

### Phase 4b : Matrice Eisenhower ✅
- [x] Page Matrice Eisenhower (`/matrice`) : vue 4 quadrants (Q1 Faire, Q2 Planifier, Q3 Déléguer, Q4 Éliminer).
- [x] Controller dédié `EisenhowerController` : récupération des tâches groupées par quadrant, filtre par période et collaborateur.
- [x] Filtrage par période (via `objectif.periode_id`) et par collaborateur.
- [x] Toggle statut tâche (terminée/à faire) directement depuis la matrice.
- [x] Sélecteur Eisenhower dans le modal d'ajout de tâche (`AddTaskModal` dans OKR/Index).
- [x] Sélecteur Eisenhower dans le panneau de détail tâche (`TaskDetailPanel`).
- [x] Navigation : TopbarNav pill "Matrice" (fuchsia) + Sidebar "Matrice Eisenhower" sous MANAGEMENT.
- [x] Design : cards avec bordure latérale colorée (rouge Q1, bleu Q2, ambre Q3, gris Q4), expand/collapse "+N de plus...".
- [x] Alerte d'équilibre si plus de 50% des tâches sont urgentes (Q1/Q3).

### Phase 4c : Analytique & Data Viz avancée (Recharts) ✅
- [x] **Dashboard Global** : Intégration de filtres globaux (Période, Axe), Donut Chart pour les statuts de tâches, Bar Chart pour la progression par axe.
- [x] **Module OKR** : Indicateur dynamique de Vélocité et filtres avancés (Axe, Type).
- [x] **Kanban Tâches** : Statistiques en temps réel (Taux d'achèvement, retards) et filtres (Priorité, Eisenhower, OKR).
- [x] **Prospection (CRM)** : Funnel Chart de l'entonnoir de vente, calcul de la valeur du pipeline et filtres par secteur/commercial.
- [x] **Bilan Daily** : Radar Chart pour profiler l'historique d'activité sur 7 jours.

### Phase 4d : Module Individuels ✅
- [x] Page Individuels (`/individuels`) : vue OKR centrée par collaborateur avec filtre mensuel.
- [x] Controller dédié `IndividuelController` : CRUD objectifs individuels, calcul score global, ventilation par axe, primes.
- [x] Onglets collaborateurs (pills horizontales) : navigation rapide entre collaborateurs.
- [x] Sélecteur de mois dynamique (6 mois avant + 6 mois après).
- [x] Bandeau score : score global en %, ventilation par axe avec couleurs, encadré prime en attente.
- [x] Seuil de prime configurable via `configurations_primes.seuil_minimum` (défaut 80%).
- [x] Modal création/édition objectif : collaborateur, mois, axe, titre, KRs (texte libre), prime, note/contexte.
- [x] Colonnes `mois` (date) et `note_contexte` (text) ajoutées à la table `objectifs`.
- [x] Navigation : TopbarNav pill "Individuels" (rose) + Sidebar "Individuels" sous MANAGEMENT.

### Phase 4e : Devise & Multi-Devises ✅
- [x] Table `devises` (9 devises : GNF, XOF, XAF, CDF, MAD, DZD, TND, EUR, USD).
- [x] Relation `societes.devise_id` → `devises.id` (FK nullable).
- [x] Modèle `Devise` avec relation `societes()`.
- [x] `HandleInertiaRequests` partage `auth.societe.devise` (id, code, nom, symbole, decimales) à tous les composants.
- [x] `formatCurrency(value, devise)` dans `lib/utils.js` : formatage dynamique selon la devise active de la société.
- [x] Remplacement de tous les GNF/XOF/FCFA hardcodés dans : OKR/Show, OKR/Index, OKR/Create, Individuels/Index, Individuels/ObjectifModal, Parametres/OKR, Incentives/Index, Incentives/Validation, Prospection/Index.
- [x] Sélecteur de devise dans Paramètres société (liste déroulante des devises actives).
- [x] Seeders : `DeviseSeeder` (idempotent) → `SocieteSeeder` (GNF par défaut).

### Phase 4f : Module Missions (War Room Ops) ✅
- [x] **Tables** : `missions`, `livrables`, `mission_logs` (migration `2026_05_15_210001`).
- [x] **Modèles** : `Mission`, `Livrable`, `MissionLog` (trait `BelongsToSociete`).
- [x] **Calcul de pression** (`Mission::getPressureAttribute`) : 5 niveaux — `critical` (deadline dépassée), `warning` (deadline < 3j ou SLA dépassé), `watch` (inactif 7j+), `ok`, `done`.
- [x] **SLA par canal** : WhatsApp 2h, Appel 4h, Email/Réunion 24h.
- [x] **Lifecycle livrables** : draft → review → validated → sent → feedback → approved → archived.
- [x] **Controller** `MissionController` : 9 routes (CRUD missions, CRUD livrables, avancement livrable, journal).
- [x] **Page React** `Missions/Index.jsx` : tableau avec dots de pression + panneau latéral (slide-over Framer Motion) avec 3 onglets :
  - **Livrables** : liste des livrables avec avancement statut en 1 clic, ajout inline.
  - **Infos** : édition complète de la mission (formulaire complet : client, type, statut, responsable, deadline, canal SLA, prochaine action, note).
  - **Journal** : fil d'activité avec types (action/note/statut/livrable), ajout rapide.
- [x] **Résumé de pression** : bandeau coloré en haut de page par niveau (Critique/Alerte/Veille/OK/Terminé).
- [x] **Navigation** : TopbarNav pill "Missions" → `missions.index` (sky-500) + Sidebar "Missions & Delivery" (Briefcase) sous BUSINESS.
- [x] **Filtres** : recherche texte, filtre statut, filtre type de mission.

### Phase 5 : LMS et Reporting ⏳
- [ ] Module LMS : Formations et modules d'apprentissage (page placeholder, modèles et migration existants).
- [ ] Module Reporting : Synthèses et graphiques avancés (page placeholder).

---

## 💡 Conventions de Codage

### Backend (Laravel)
- **Nommage** : Les classes, modèles, et contrôleurs en PascalCase. Les méthodes et variables en camelCase. La base de données en snake_case.
- **Langue** : Le code métier et la base de données sont nommés en **français** pour coller au métier (ex: `Collaborateur`, `Objectif`, `ResultatCle`).
- **Validation** : Toujours utiliser des FormRequests ou la validation dans le contrôleur.
- **Seeders** : Structure modulaire (`SocieteSeeder` → `CollaborateurSeeder` → `ParametreOKRSeeder` → `OKRSeeder` → `TacheSeeder` → `ProspectSeeder`). Les tâches seedées sont liées à des KRs spécifiques (hiérarchie Objectif → KR → Tâche).
- **Réponses Inertia** : Toujours `redirect()->back()` ou `Inertia::render()`, jamais `response()->json()`.
- **Modals** : Les formulaires de création rapide utilisent `router.post` (pas `useForm.post`) avec `preserveState: true` et `onError` pour garder le modal ouvert en cas d'erreur.

### Frontend (React)
- **Composants** : Fonctions exportées par défaut. Nommage en PascalCase.
- **Inertia** : Utilisation de `router` pour les formulaires modaux (plus fiable que `useForm` pour garder l'état). `useForm` uniquement pour les pages de formulaire dédiées.
- **Styling** : Utilisation systématique de Tailwind. Pour les variantes complexes, utiliser `cva`.
- **Imports** : Toujours `export default` pour les composants. Imports nommés `{ X }` uniquement pour les named exports (ex: UI components).
- **Nombres** : Utiliser `<NumberInput>` pour les champs, `formatNumber()` pour l'affichage.
- **Langue** : Toute l'interface utilisateur doit être en **français**. Aucun texte en anglais visible par l'utilisateur.
- **Modals inline** : Les modals de création (objectif, tâche) sont des composants locaux dans le fichier de la page parent, pas des fichiers séparés.

---

## 📊 Base de données — Tables principales

| Table | Description |
|-------|-------------|
| `users` | Comptes d'authentification |
| `societes` | Entreprises (multi-tenant, layout_mode) |
| `collaborateurs` | Collaborateurs liés à une société (rôle, poste) |
| `objectifs` | Objectifs OKR (titre, axe, période, type, statut, visibilité, prime) |
| `resultats_cles` | Résultats clés liés à un objectif (description, description_detaillee, progression, poids, valeur_cible, unité, type) |
| `objectif_periode` | Table pivot multi-périodes (objectif_id, periode_id) — permet à un objectif de couvrir plusieurs trimestres |
| `taches` | Tâches liées à un KR (titre, description, statut, priorité, date, collaborateur, objectif_id, resultat_cle_id). Hiérarchie : Objectif → KR → Tâche. |
| `prospects` | Prospects CRM (nom, contact, secteur, statut pipeline, prochain RDV, notes) |
| `objectifs_remuneres` | Objectifs liés à des primes |
| `validations_objectifs` | Validations de primes par les managers |
| `bilans_journaliers` | Bilans daily (note, blocages, seminaires, recherches, prospection, rdv, delivery) |
| `formations` | Formations LMS |
| `modules_formations` | Modules de formation |
| `syntheses` | Synthèses reporting |
| `axes_objectifs` | Axes stratégiques paramétrables |
| `periodes` | Périodes OKR paramétrables |
| `types_objectifs` | Types d'objectifs paramétrables |
| `types_resultats_cles` | Types de résultats clés paramétrables |
| `statuts_objectifs` | Statuts d'objectifs paramétrables |
| `seuils_performance` | Seuils de couleur paramétrables |
| `configurations_okr` | Configuration OKR globale par société |
| `configurations_primes` | Configuration des primes par société |
| `paliers_primes` | Paliers de calcul des primes |
| `templates_objectifs` | Templates d'objectifs réutilisables |

---

*Dernière mise à jour : 15 Mai 2026*
