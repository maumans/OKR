# 📘 DEVBOOK — Addvalis OKR Performance

Ce document sert de référence technique et de guide architectural pour le développement de la plateforme Addvalis OKR Performance. Il documente les choix techniques, les normes de codage et l'état d'avancement du projet.

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

### Composants Select (v2 — Juin 2026)

Trois composants Select coexistent selon les besoins :

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `SearchableSelect` | `ui/SearchableSelect.jsx` | Sélecteur principal avec recherche (> 5 options). Utilisé partout (filtres, modals, panneaux). |
| `CustomSelect` | `ui/CustomSelect.jsx` | Sélecteur compact sans recherche, même API que SearchableSelect. |
| `NativeSelect` | `ui/Select.jsx` | Select HTML natif avec flèche personnalisée, pour formulaires simples. Importé `{ NativeSelect as Select }`. |

**Architecture — SearchableSelect & CustomSelect** : basés sur `@radix-ui/react-popover`. Le Popover Radix cohabite nativement avec `@radix-ui/react-dialog` (les deux partagent un contexte `DismissableLayer` — le Dialog ne se ferme pas quand on interagit avec le select ouvert à l'intérieur).

**API commune SearchableSelect / CustomSelect** :
```jsx
<SearchableSelect
  value={string}             // valeur sélectionnée (toujours string)
  onChange={fn}              // callback (val: string)
  options={[{value, label}]} // tableau d'options
  placeholder="..."          // texte si vide
  nullable={false}           // ajoute une option "vide" en tête
  nullLabel="— Aucun —"      // label de l'option vide
  size="md"                  // 'md' | 'sm'
  disabled={false}
  error="message"            // affiche message d'erreur rouge
  className="..."            // classes sur le wrapper
/>
```

**Règles d'implémentation** :
- Utiliser `onPointerDown` avec `e.preventDefault()` sur les options (pas `onClick`) pour éviter tout changement de focus avant la sélection.
- `onCloseAutoFocus={(e) => e.preventDefault()}` sur `PopoverContent` pour empêcher le retour de focus sur le trigger à la fermeture.
- `--radix-popover-trigger-width` : CSS variable Radix pour aligner la largeur du dropdown sur le trigger.
- **Ne jamais** utiliser `@headlessui/react` dans les selects — installé en v2 (API complètement différente de v1).

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
- **Barre de filtres** : FILTRES label + recherche + responsables + statuts + bouton "× Effacer". Tous les `SearchableSelect` de filtre passent `placeholder=` égal au `nullLabel` pour afficher un libellé descriptif au lieu du générique "Sélectionner...".
- **Bandeau de progression globale** : barre pleine largeur avec gradient, dot coloré, pourcentage.
- **Bouton "+ Nouvel objectif"** : ouvre un **modal de création rapide** (intitulé + **périodes multi-sélection** (checkboxes) + responsable + KRs dynamiques). Utilise `router.post` avec `preserveState: true` et validation client-side. KRs vides filtrés automatiquement. Erreurs affichées dans un bandeau rouge. Un objectif peut couvrir **plusieurs trimestres** via la table pivot `objectif_periode`.
- **Regroupement par axes** : les objectifs sont organisés en sections par axe stratégique (ordre des axes configurés, "Sans axe" en dernier). Chaque groupe affiche un en-tête avec dot coloré + nom de l'axe en majuscules + compteur, une ligne de séparation, et les cartes avec une bordure latérale `couleur+40` (semi-transparente). Calculé via `useMemo` depuis `objectifs.data` et le tableau `axes`.
- **Barre de raccourcis rapides** : entre le bandeau de progression et les objectifs, 4 boutons inline :
  - **+ Ajouter un axe** (bouton sombre) → redirige vers `parametres.okr.index`.
  - **+ Objectif** (bouton outline) → ouvre `CreateObjectifModal`.
  - **+ Key Result** (bouton outline) → ouvre `QuickKRModal` (sélecteur objectif + description KR + valeur cible + unité).
  - **+ Tâche** (bouton outline) → ouvre `QuickTaskModal` (titre + sélecteur objectif + sélecteur KR chargé dynamiquement + priorité + assigné).
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
  - **Pied de carte expandée** : boutons **+ KR** (sombre) et **+ Tâche** (outline) visibles uniquement pour le responsable/propriétaire. `+ KR` ouvre `QuickKRModal` avec l'objectif pré-sélectionné (`defaultObjectifId`). `+ Tâche` ouvre `AddTaskModal` avec les KRs de l'objectif déjà chargés.
- **Modal d'édition d'objectif** (`EditObjectifModal`) : formulaire complet inline pour modifier titre, responsable, **périodes multiples** (checkboxes), axe, type, visibilité, prime, et tous les KRs (ajout/modification/suppression). Les KRs ont un champ `description_detaillee` (textarea). Envoi via `router.put` avec sync des KRs et périodes.
- **Modal d'ajout de tâche** (`AddTaskModal`) : formulaire compact avec sélection obligatoire du KR cible, `router.post` vers `taches.store`, validation client-side, `preserveState: true`.
- **`QuickKRModal`** : modal compact (max-w-md) pour ajouter un KR rapidement. Sélecteur d'objectif (pré-rempli si ouvert depuis une carte), description, valeur cible, unité. Route `POST /objectifs/{objectif}/kr` → `objectifs.kr.store`. Prop `defaultObjectifId` pour pré-sélection.
- **`QuickTaskModal`** : modal compact pour créer une tâche depuis n'importe où. Sélecteur d'objectif → KRs chargés dynamiquement depuis `objectifs.data` (sans appel API) → titre + priorité + assigné.
- **Panneau de détail tâche** (`TaskDetailPanel`) : slide-over animé (framer-motion spring) depuis la droite avec **mode édition** complet :
  - Header : titre (éditable) + sous-titre KR + boutons ×/✓/crayon.
  - Onglets : **Fiche** / **Fichiers** (upload/download/suppression) / **Note** (textarea + bouton "Sauvegarder la note").
  - Sections Fiche : 📋 Informations (badges éditables : statut, priorité, eisenhower, date, responsable), 📝 Description & Contexte (textarea), 📋 Mode Opératoire (étapes dynamiques ajout/suppression), 🔧 Outils & Ressources (input texte), ✅ Définition de "Done" (critères dynamiques ajout/suppression).
  - Footer : bouton "Modifier" / "Enregistrer" + poubelle.
  - **Note persistée** : colonne `note` (text nullable) sur la table `taches`. Route `PATCH /taches/{tache}/note` → `TacheController::updateNote`. Sauvegarde indépendante du formulaire Fiche via `router.patch`.
  - **Fichiers** : upload immédiat via axios + `router.reload({ only: ['objectifs'] })` après chaque upload pour rafraîchir les props Inertia (évite la disparition des fichiers à la réouverture du panneau).
  - **Prop `auth`** obligatoire : contrôle l'activation du champ Responsable (`disabled={!auth?.collaborateur?.isResponsable}`) et l'affichage des boutons Modifier/Supprimer dans le footer.
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
- [x] **Regroupement OKR par axes** : objectifs organisés par section d'axe (en-tête coloré + bordure latérale + compteur). `useMemo` depuis `objectifs.data` et `axes`.
- [x] **Barre de raccourcis OKR** : 4 boutons rapides (+ Axe → params, + Objectif, + KR via `QuickKRModal`, + Tâche via `QuickTaskModal`).
- [x] **Boutons inline + KR / + Tâche** dans le pied de chaque `ObjectifCard` expandée (visibles si responsable).
- [x] **Fix `SearchableSelect` placeholders** : tous les selects de filtre (OKR, Dashboard, Matrice, SuperAdmin/AuditLogs) passent désormais `placeholder=` égal au `nullLabel` pour afficher un libellé descriptif.

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

### Phase 4f : Module Missions → Projets & Delivery (refonte Juin 2026) ✅
- [x] **Tables** : `missions`, `livrables`, `mission_logs` (migration `2026_05_15_210001`).
- [x] **Nouveaux champs** (`2026_06_05_000005`) : `montant` (decimal 15,2), `email_nps_client` (string), `dir_validated` (boolean mission), `nps_score` (tinyint 0–10) + statut `en_attente_dir` ajouté à l'enum.
- [x] **Modèles** : `Mission`, `Livrable`, `MissionLog` (trait `BelongsToSociete`).
- [x] **Calcul de pression** (`Mission::getPressureAttribute`) : 6 niveaux — `pending` (en_attente_dir), `critical`, `warning`, `watch`, `ok`, `done`.
- [x] **SLA par canal** : WhatsApp 2h, Appel 4h, Email/Réunion 24h.
- [x] **Lifecycle livrables** : draft → review → validated → sent → feedback → approved → archived.
- [x] **Workflow validation DIR** : nouveau projet créé en `en_attente_dir` → bouton "Valider DIR" → passe en `active` + log automatique.
- [x] **Controller** `MissionController` : 11 routes (CRUD missions, CRUD livrables, avancement livrable, journal, `validateDir`, `updateNps`).
- [x] **Page React** `Missions/Index.jsx` — refonte complète :
  - **Sidebar module** : navigation gauche avec 6 vues (Tous les projets, En attente DIR, Projets actifs, Livrables à confirmer, Projets clôturés, NPS & Scores).
  - **Stats header** : 5 indicateurs cliquables (En attente DIR, Actifs, Livrables à conf., Avancement %, NPS moyen /10) — toute la largeur.
  - **Alertes bannières** : amber (projets en attente DIR) + blue (livrables à confirmer) avec bouton "Voir" → navigation directe.
  - **Barre d'actions** : "Nouveau projet" + "Recalculer" + recherche + "Dernière sync".
  - **Cartes projet** : dot pression, titre, client · manager · montant, barre de progression, X/Y livrables, badge NPS si renseigné, bouton "✓ Valider DIR" (visible si `en_attente_dir`).
  - **Groupement** : en vue "Tous les projets", les cartes sont groupées par statut.
  - **Panneau détail** (slide-over) : 3 onglets Livrables / Infos / Journal — champs enrichis (montant, email NPS, selects CustomSelect/SearchableSelect).
  - **Édition inline livrables** : bouton crayon au survol → formulaire in-place avec tous les champs (nom, type, statut, responsable, deadlines, URL, DIR validé, AR count). Soumission `preserveState: true`.
  - **Section NPS** : grille de boutons 0–10 par projet, badge score coloré (rouge/amber/vert), légende Détracteur/Neutre/Promoteur.
  - **Modal création** : champs NOM DU PROJET, CLIENT, MANAGER, TYPE, DATE FIN, MONTANT (NumberInput), EMAIL NPS CLIENT + notice "soumis à la validation DIR".
- [x] **Navigation** : TopbarNav pill "Missions" → `missions.index` (sky-500) + Sidebar "Missions & Delivery" sous BUSINESS.

### Phase 5a : Module d'import Excel ✅
- [x] **Table `imports`** : traçabilité des imports avec payload JSON et IDs créés pour rollback.
- [x] **Modèle `Import`** : trait `BelongsToSociete`, casts JSON, relation User.
- [x] **Service `ExcelImportService`** : parsing intelligent via `phpoffice/phpspreadsheet`.
  - Détection auto de la ligne d'entête (mots-clés ENTITE, THEME, PRIORITE...).
  - Détection de hiérarchie : lignes macro-thème (Objectifs) vs lignes détail (KRs) vs puces (Tâches).
  - Normalisation : coquilles entités (CONAKY → CONAKRY), priorités (p1 → P1), dates invalides (31/04, 01/01/12026), progression (0-1 → 0-100).
  - Parsing responsables multi-valeurs (/, \n, ,), puces actions (*, -, •).
- [x] **Controller `ImportController`** : 5 routes (index, parse, commit, historique, destroy/rollback).
- [x] **FormRequest `StoreImportRequest`** : validation fichier (mimes xlsx/xls/csv, max 10Mo).
- [x] **Commit transactionnel** : création en cascade Axes → Collaborateurs → Objectifs → KRs → Tâches avec sync pivot `objectif_periode`.
- [x] **Rollback complet** : suppression inverse (tâches → KRs → objectifs → collaborateurs → axes) via IDs stockés.
- [x] **Page React `Import/Index.jsx`** : flux 4 étapes (Upload → Mapping → Confirmation → Succès) avec animations Framer Motion.
  - **UploadStep** : drag-and-drop + bouton parcourir, validation fichier.
  - **MappingStep** : 2 colonnes (paramètres gauche + arborescence éditable droite), axes avec couleurs, collaborateurs avec statut, corrections ambre.
  - **ObjectifEditableCard** : accordéon éditable avec KRs inline, tâches expandables, checkboxes import.
  - **ConfirmModal** : résumé des éléments à créer.
  - **SuccessSummary** : card verte avec checklist + liens navigation.
- [x] **Page `Import/Historique.jsx`** : tableau des imports passés avec bouton rollback.
- [x] **Sauvegarde brouillon** : persistance localStorage du mapping édité.
- [x] **Navigation** : TopbarNav pill "Import" (emerald-500) + Sidebar section ADMINISTRATION (Import de données, Historique des imports).

### Phase 4g : Enrichissement module Prospection (Juin 2026) ✅
- [x] **Section "Performances Commerciales"** : bandeau au-dessus du Kanban — top 5 commerciaux avec barre de score (vert ≥80, amber ≥50, rouge <50), compteurs actions et RDV. Données issues de `scoresCommerciaux` (déjà calculé par `ScoreService`).
- [x] **Cartes prospect enrichies** : affichage de la `source` (avec icône TrendingUp) et du compteur d'`actions_count` (via `withCount('actionsCommerciales')` dans `ProspectController`).
- [x] **Modal prospect** : `valeur` remplacé par `<NumberInput>` (fin du bug locale française) ; `Commercial assigné` remplacé par `<SearchableSelect>` ; `preserveState: true` sur `put` et `post` ; titre dynamique "Modifier le prospect" / "Ajouter un prospect" ; erreurs de validation visibles sous chaque champ ; bouton "Enregistrement…" pendant la requête.

### Phase 4h : Module Performance (Juin 2026) ✅
- [x] **Tables** : `fiches_performance` (scores /5 par dimension, poids, score_global, workflow statut, commentaires, validated_at) ; `historique_workflow_performance` (journal horodaté) ; colonnes `grade` et `practice` ajoutées à `collaborateurs`.
- [x] **Modèles** : `FichePerformance` (trait `BelongsToSociete`, méthode `recalculerScoreGlobal()`, méthode statique `normaliserScore()`, constante `TRANSITIONS`) ; `HistoriqueWorkflowPerformance`.
- [x] **Règle métier scores** : score_global = Σ(score_dimension × poids_dimension), arrondi à 1 décimale. Poids par défaut : Commercial 50%, Delivery 25%, Développement 15%, Comportemental 10%.
- [x] **Normalisation OKR → /5** : ≥100%→5, 80-99%→4, 60-79%→3, 40-59%→2, <40%→1 (méthode `normaliserScore()` sur `FichePerformance`, prête pour le Chantier 0).
- [x] **Workflow 4 étapes** : `brouillon` → `en_revision` → `attente_drh` → `confirme`. Limite de 3 allers-retours collaborateur. Fiche confirmée verrouillée.
- [x] **Controller** `PerformanceController` : 5 routes (index, store, update, avancerWorkflow, destroy). Contrainte UNIQUE(collaborateur_id, cycle).
- [x] **Page React** `Performance/Index.jsx` — module complet :
  - **Sidebar interne** 5 vues : Fiches individuelles, Workflow validation, Cycle annuel, Mid-Year Review, Évaluation finale.
  - **Stats header** : 5 indicateurs (Total, Brouillon, En révision, Attente DRH, Confirmées).
  - **Grille de FicheCard** : avatar couleur selon score, scores /5 par dimension avec barres colorées, badge statut, score global /5.
  - **Collaborateurs sans fiche** : cards dashed avec bouton "Créer la fiche".
  - **EditScoresPanel** : slide-over Framer Motion — 3 onglets (Scores, Commentaires, Historique), preview temps réel du score global, boutons de transition workflow, suppression en brouillon.
  - **CreateFicheModal** : Dialog Radix, SearchableSelect collaborateur, CustomSelect type_cycle.
  - **VueWorkflow** : tableau des fiches en attente d'action.
  - **VueCycleAnnuel** : timeline visuelle des 5 jalons du cycle hybride avec indicateur du jalon courant.
  - Bouton "Synchroniser OKR → Performance" préparé (désactivé jusqu'au Chantier 0).
- [x] **Module enregistré** dans `ModuleSeeder` (code `performance`, catégorie MANAGEMENT, ordre 45, dépend de `okr`).
- [x] **Navigation** : Sidebar "Performance" (ClipboardCheck) dans le groupe MANAGEMENT.
- [x] **Seeder de démo** `PerformanceSeeder` : 4 fiches cycle "Q3 2026" alignées avec la maquette Laawol (scores Gando Diallo 2.4/5, Amadou Bailo 3.0/5, etc.) + champs grade/practice mis à jour.

### Phase 4h-bis : Workflow Performance réel + Rôle DRH (11 Juin 2026) ✅

**Contexte** : Le workflow de validation des fiches de performance était simulé (n'importe quel utilisateur pouvait valider toutes les étapes). Refonte pour que chaque transition soit gardée par le bon rôle.

#### Rôle DRH
- [x] **Migration** `2026_06_11_000001_add_drh_role` : insère `{code:'drh', nom:'DRH', ordre:25}` dans la table `roles` (idempotent via `if !exists`).
- [x] **`Collaborateur` model** : `estDrh(): bool` (helper), `scopeDrh(Builder $query)` (scope Eloquent).
- [x] **`HandleInertiaRequests`** : expose `isDRH => $collaborateur->estDrh()` dans le tableau `auth.collaborateur` partagé à tous les composants React.

#### Backend — Role-gating réel dans `avancerWorkflow()`
- [x] **`PerformanceController::avancerWorkflow()`** (refactorisé) :
  - Récupère le collaborateur actuel via `$request->user()->collaborateurActuel()`.
  - Calcule 3 booléens : `$estGestionnaire` (admin|directeur|manager), `$estCollaborateurEvalue` (id === fiche.collaborateur_id), `$estDrh` (drh|admin).
  - Utilise un `match ($transitionKey)` pour autoriser/refuser chaque transition par rôle :
    | Transition | Rôle requis |
    |---|---|
    | `brouillon → en_revision` | Gestionnaire |
    | `revision_demandee → brouillon` | Gestionnaire |
    | `revision_demandee → en_revision` | Gestionnaire |
    | `en_revision → attente_drh` | Gestionnaire |
    | `en_revision → brouillon` | Gestionnaire |
    | `en_revision → revision_demandee` | Collaborateur évalué (lui-même) |
    | `attente_drh → confirme` | DRH |
    | `attente_drh → revision_demandee` | DRH |
  - Renvoie `back()->withErrors(['vers_statut' => '...'])` si le rôle ne correspond pas.

#### Frontend — `Performance/Index.jsx` rôle-aware
- [x] **`EditScoresPanel`** accepte maintenant `auth` en prop (passé depuis `PerformanceIndex`).
- [x] **Calcul des rôles** dans `EditScoresPanel` :
  ```js
  const isGest   = myCollab?.isAdmin || myCollab?.isDirecteur || myCollab?.isManager;
  const isDRH    = myCollab?.isDRH || myCollab?.isAdmin;
  const isEvalue = myCollab?.id === fiche.collaborateur_id;
  ```
- [x] **`WORKFLOW_TRANSITIONS` filtré par rôle** : la constante `ALL_TRANSITIONS` définit toutes les transitions possibles avec un champ `roles: 'gest'|'drh'|'evalue'`. Le `Object.fromEntries().filter()` ne garde que les transitions du rôle de l'utilisateur courant.
- [x] **Champs score/commentaire désactivés par rôle** :
  - `score_manager_*` et `commentaire_manager_*` : `disabled={!canEditManagerFields}` (gestionnaire uniquement).
  - `score_collab_*` et `commentaire_collaborateur_*` : `disabled={!canEditCollabFields}` (collaborateur évalué en `en_revision` uniquement).
- [x] **Footer contextuel** :
  - Bandeau amber quand collaborateur évalué en `en_revision` (invite à remplir l'auto-évaluation).
  - Bandeau bleu quand DRH en `attente_drh` (invite à approuver ou renvoyer).
  - Bouton "Enregistrer" visible uniquement si `canEditManagerFields || canEditCollabFields`.
  - Bouton poubelle visible uniquement pour le gestionnaire en `brouillon`.

### Phase 4g-bis : Actions commerciales frontend — CRM Prospection (11 Juin 2026) ✅

**Contexte** : Le backend des actions commerciales était intact (`ActionCommerciale`, route `prospects.actions.store`) mais toute l'interface avait été supprimée lors d'un refactoring.

- [x] **`ProspectController::index()`** : eager load `actionsCommerciales` + mapping `actions` (type, description, date_action, durée, résultat) + `actions_count` dans chaque prospect sérialisé.
- [x] **Constante `ACTION_TYPES`** : 5 types (appel/email/réunion/note/relance) avec label, icône Lucide, et couleur badge CSS.
- [x] **Composant `ActionModal`** : Dialog (max-w-md) — type (select), description (textarea), date, durée (NumberInput), résultat (textarea). Soumission `router.post(route('prospects.actions.store', deal.id), data, { preserveState: true })`.
- [x] **Composant `DealDetailPanel`** : Dialog (max-w-lg) — résumé deal (valeur, probabilité, statut, type, responsable) + timeline chronologique des actions (icône type + date + description + durée + résultat). Bouton "Ajouter une action" → ouvre `ActionModal` pour le même deal.
- [x] **Badge actions** sur `DealCard` : `Clock + N actions` affiché si `deal.actions_count > 0`.
- [x] **Items dropdown** sur `DealCard` et `VueListe` : "Voir les actions" → `DealDetailPanel` ; "Ajouter une action" → `ActionModal`.
- [x] **États** dans `ProspectionIndex` : `actionDeal` et `detailDeal` — pilotent l'ouverture des modaux.
- [x] Build `npm run build` : succès sans erreur.

### Phase 4i : Rôle DRH visible dans le module Équipe (11 Juin 2026) ✅

**Contexte** : Le rôle `drh` existait en base (migration Phase 4h-bis) mais toutes les listes de rôles dans l'interface Équipe étaient codées en dur sans lui. Résultat : impossible d'assigner le rôle DRH depuis l'UI, et les collaborateurs DRH n'affichaient aucun badge.

#### Backend
- [x] **`CollaborateurController::index()`** : stat card `drh` ajoutée — `(clone $baseQuery)->whereHas('roles', fn ($q) => $q->where('code', 'drh'))->count()`.
- [x] **`CollaborateurController::store()` et `update()`** : `'roles.*' => 'in:admin,directeur,manager,drh,collaborateur'` — `drh` manquait, ce qui provoquait un échec silencieux de validation quand la case DRH était cochée.

#### Frontend — 4 fichiers mis à jour
- [x] **`Collaborateurs/Create.jsx`** :
  - `ROLES_DISPONIBLES` : entrée `{ value: 'drh', label: 'DRH', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300', dot: 'bg-teal-500' }` ajoutée.
  - `rolesDisponibles()` : filtre `r.value !== 'drh'` pour les non-gestionnaires globaux (seul Admin/Dir/DRH peut assigner ce rôle).
- [x] **`Collaborateurs/Edit.jsx`** : mêmes changements que `Create.jsx`.
- [x] **`Collaborateurs/Index.jsx`** :
  - `ROLE_CONFIG` : entrée `drh: { label: 'DRH', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300', dot: 'bg-teal-500' }`.
  - Stat cards : remplacement "Directeurs" par "Managers" (card bleue) + nouvelle card teal "DRH".
  - Filter pills : ajout `{ value: 'drh', label: 'DRH' }` dans la liste de filtres.
- [x] **`Collaborateurs/Show.jsx`** : `roleColors` : `drh: 'info'` ; `roleLabels` : `drh: 'DRH'`.

---

### Phase 4j : Fix email collaborateur sans compte User (11 Juin 2026) ✅

**Contexte** : Certains collaborateurs créés par import ou seeder n'avaient pas de `user_id`. Lors de la mise à jour (`update()`), la branche `if ($collaborateur->user) { ... }` était ignorée → l'email n'était jamais sauvegardé ni un compte créé.

- [x] **`CollaborateurController::update()`** : ajout de la branche `else` :
  ```php
  } else {
      $user = User::create([
          'name'     => "{$validated['prenom']} {$validated['nom']}",
          'email'    => $validated['email'],
          'password' => Hash::make('Addvalis2026!'),
      ]);
      $collaborateur->update(['user_id' => $user->id]);
  }
  ```
  Le collaborateur reçoit un compte avec mot de passe par défaut `Addvalis2026!` (à changer à la première connexion).

---

### Phase 4k : Synchronisation OKR → Performance opérationnelle (11 Juin 2026) ✅

**Contexte** : Le backend de sync était déjà complet (`OkrPerformanceSyncService`, route `performance.sync`, `OkrService::calculerProgressionObjectif()`). Trois problèmes frontend bloquaient l'usage réel :
1. Form state stale après sync — `useState` ne se réinitialise pas quand les props Inertia changent.
2. Options OKR trop restrictives — seuls les OKRs du collaborateur propre apparaissaient, mais souvent il n'en a pas.
3. UX pauvre — pas de visualisation de la progression dans le sélecteur OKR.

#### Backend — `PerformanceController::index()`
- [x] Eager load des résultats clés sur les objectifs : `->with(['resultatsCles', 'collaborateur:id,nom,prenom'])`.
- [x] Enrichissement du mapping objectifs : `'collaborateur_nom' => $obj->collaborateur?->prenom.' '.$obj->collaborateur?->nom`, `'progression' => $obj->resultatsCles->avg('progression') ?? 0` (moyenne des KRs).
- [x] Exposition de `'peutVoirTout' => $peutVoirTout` dans `Inertia::render()` pour conditionner l'affichage frontend.

#### Frontend — `Performance/Index.jsx`
- [x] **`useEffect` anti-staleness** : watch sur `fiche.score_commercial`, `fiche.score_delivery`, `fiche.score_developpement`, `fiche.score_comportemental`, `fiche.objectif_okr_id_commercial`, `fiche.objectif_okr_id_delivery` → réinitialise uniquement les champs score/OKR du form quand les props Inertia se rafraîchissent après une sync.
- [x] **`okrOptions` élargi** (`useMemo`) : OKRs propres au collaborateur listés en premier avec `Progression X%`, puis OKRs du reste de la société prefixés `[Nom collab]`. Plus de risque de liste vide.
- [x] **Bouton "Synchroniser OKR → Performance"** : condition changée de `okrOptions.length > 0 && isGest` → `!isLocked && isGest` (toujours visible pour un gestionnaire sur une fiche non verrouillée).
- [x] **Section OKR dans dimension card** : barre de progression live `X% → Y/5` (normalisation visuelle), texte d'aide `"Synchroniser pour recalculer automatiquement"`, champ désactivé si `!canEditManagerFields`.

---

### Phase 4l : Visibilité role-based du module Performance (11 Juin 2026) ✅

**Contexte** : Tous les utilisateurs voyaient toutes les fiches de performance de la société, quelle que soit leur position dans la hiérarchie.

#### Backend — `PerformanceController::index()`
- [x] **Filtre par rôle** :
  ```php
  $peutVoirTout = $collab && ($collab->estAdmin() || $collab->estDirecteur() || $collab->estDrh());

  $fichesQuery = FichePerformance::pourSociete($societeId)
      ->with(['collaborateur', 'manager', 'historiqueWorkflow.user'])
      ->when(! $peutVoirTout && $collab?->estManager(), fn ($q) =>
          $q->where(fn ($sub) =>
              $sub->where('manager_id', $collab->id)
                  ->orWhere('collaborateur_id', $collab->id)
          )
      )
      ->when(! $peutVoirTout && ! $collab?->estManager(), fn ($q) =>
          $q->where('collaborateur_id', $collab?->id)
      )
      ->orderBy('cycle', 'desc')->orderBy('created_at', 'desc');
  ```
  | Rôle | Fiches visibles |
  |---|---|
  | Admin / Directeur / DRH | Toutes les fiches de la société |
  | Manager | Fiches de son équipe + sa propre fiche |
  | Collaborateur | Uniquement sa propre fiche |
- [x] **`$collaborateurs`** filtré selon le même rôle (pour le sélecteur "Créer une fiche") : manager → son département, collaborateur → lui seul.

#### Frontend — `Performance/Index.jsx`
- [x] **Prop `peutVoirTout`** acceptée dans `PerformanceIndex` (défaut `false`).
- [x] **"Nouvelle fiche" / cards dashed "sans fiche" / "Créer la première fiche"** : conditionnés à `peutVoirTout || auth?.collaborateur?.isManager` — un collaborateur simple ne peut pas créer de fiche lui-même.

---

### Phase 4m : Référentiels CRM — Secteurs, Pratiques, Types livrable (Juin 2026) ✅

**Contexte** : Les champs `secteur` (Prospection), `practice` (Missions), et `type_livrable` (Missions livrables) étaient des inputs texte libre. Conversion en `SearchableSelect` alimentés par des listes paramétrables dans Paramètres.

- [x] **3 migrations** : tables `secteurs_activite`, `practices`, `types_livrable` — pattern identique à `departements` (`societe_id`, `nom`, `ordre`, `actif`).
- [x] **3 modèles** : `SecteurActivite`, `Practice`, `TypeLivrable` — trait `BelongsToSociete`, scopes `actifs()` et `ordonne()`, fillable, casts actif boolean. `TypeLivrable` : `protected $table = 'types_livrable'` (Laravel pluralise incorrectement en `type_livrables`).
- [x] **`ParametreCrmController`** (9 méthodes) : `store/update/destroy` pour chacune des 3 listes. 9 routes dans `routes/web.php` (`/parametres/crm/secteurs`, `/parametres/crm/practices`, `/parametres/crm/types-livrable`).
- [x] **`SocieteController::edit()`** : expose `secteursActivite`, `practices`, `typesLivrable` comme props Inertia à la page Paramètres.
- [x] **`ProspectController::index()`** : expose `secteursActivite` aux composants Prospection.
- [x] **`MissionController::index()`** : expose `practices` et `typesLivrable` aux composants Missions.
- [x] **Onglet "Référentiels CRM"** dans `Parametres/Index.jsx` : 3 `CrudSection` (Secteurs d'activité / Pratiques / Types de livrable) avec CRUD inline complet (dialog modal, champs nom/ordre/actif).
- [x] **`ClientModal` + `DealModal`** : champ `secteur` → `SearchableSelect` alimenté par `secteursActivite`.
- [x] **`CreateProjectModal` + `InfosTab`** (Missions) : champ `practice` → `SearchableSelect` alimenté par `practices`.
- [x] **`LivrableForm` + formulaire inline** (Missions) : champ `type_livrable` → `SearchableSelect` alimenté par `typesLivrable`.

**Stratégie DB** : pas de FK — valeur stockée en texte (`nom`). Les options viennent de la liste paramétrée ; les enregistrements existants conservent leur valeur si une option est supprimée.

---

### Phase 4n : Import XLSX Prospects (Juin 2026) ✅

**Contexte** : Permettre l'import en masse de prospects depuis un fichier Excel ou CSV.

- [x] **`ProspectImportController`** : 4 méthodes — `index()` (page + session preview), `parse()` (lit le fichier, stocke aperçu en session), `commit()` (crée les prospects), `reset()` (vide la session).
- [x] **4 routes** : `prospects.import.index` (GET), `prospects.import.parse` (POST), `prospects.import.commit` (POST), `prospects.import.reset` (POST).
- [x] **Validation fichier** : règle `mimes:` retirée (silencieuse sur Windows — détection MIME peu fiable) ; remplacée par vérification manuelle de l'extension (`in_array($ext, ['xlsx','xls','csv'])`).
- [x] **Session-based preview** : `parse()` stocke les lignes dans `session(['import_prospects_preview' => $rows])`. `index()` passe la session à Inertia. `commit()` consomme la session pour créer les prospects.
- [x] **Déduplication** : option `dedup` — saute les lignes dont le `nom` existe déjà pour la société.
- [x] **Options d'import** : `statut_initial` (decouverte/proposition/negociation), `collaborateur_id` (responsable assigné), `dedup` (checkbox, actif par défaut).
- [x] **Page `Prospection/Import.jsx`** — flux 2 étapes :
  - **Étape 1 (Upload)** : zone drag & drop, panneau options (NativeSelect statut, SearchableSelect responsable, checkbox dedup), tableau de format attendu, bouton "Télécharger template CSV" (génère un blob inline, sans requête serveur), bouton "Analyser le fichier".
  - **Étape 2 (Aperçu)** : tableau scrollable des lignes parsées + boutons "Importer X prospects" / "Recommencer".
- [x] **Entrée sidebar** : icône `Upload`, click → `router.visit(route('prospects.import.index'))` (navigation complète, hors gestion de vue locale).

---

### Phase 4o : Pipeline normalisé — probabilité automatique par stade (Juin 2026) ✅

**Contexte** : Finalisation du Chantier 1 Laawol — normalisation du pipeline et pondération automatique.

- [x] **5 stades normalisés** avec probabilité par défaut : `decouverte` → 20%, `proposition` → 40%, `negociation` → 70%, `gagne` → 100%, `perdu` → 0%.
- [x] **`KANBAN_COLS` avec `defaultProba`** : chaque objet colonne porte `defaultProba`. Affiché en `XX%` dans le header de la colonne Kanban.
- [x] **Auto-probabilité backend** (`ProspectController::updateStatus()`) : lors d'un changement de stade (drag Kanban), si la probabilité actuelle correspond au `defaultProba` de l'ancien stade (= jamais modifiée manuellement), la probabilité est mise à jour vers le `defaultProba` du nouveau stade. Sinon, elle est conservée.
- [x] **Auto-probabilité frontend** (`DealModal`) : changement du champ `statut` → `setF('statut', v)` met à jour automatiquement `probabilite` si `!probaManuelle`. Si l'utilisateur touche manuellement le champ `probabilite`, `probaManuelle` passe à `true` et bloque toute mise à jour automatique pour cette session modal.

---

### Phase 4p : Sidebar CRM — hub "Clients & Deals" (Juin 2026) ✅

**Contexte** : Les entrées "Clients" et "Nouveaux clients" dans la sidebar Prospection étaient redondantes et confusantes (1 client converti vs 10 deals en pipeline apparaissaient comme deux catégories distinctes).

- [x] **Fusion en 1 entrée** : "Clients & Deals" (icône `Building2`) remplace les 3 entrées séparées.
- [x] **Composant `VueClientsHub`** : wrapper interne avec barre d'onglets. Onglet "Clients" → `VueClients`. Autres onglets → `VueListe` avec `typeDealFilter`.
- [x] **`DEAL_TABS`** : `{ key:'clients', label:'Clients', filter:null }`, `{ key:'nouveaux', label:'En prospection', filter:'nouveau_client' }`, `{ key:'upsells', label:'Upsells', filter:'upsell' }`, `{ key:'renouv', label:'Renouvellements', filter:'renouvellement' }`.
- [x] **Renommage** : "Nouveaux clients" → "En prospection" (ces deals sont en cours de pipeline, pas encore convertis).

---

### Phase 5 : LMS et Reporting ⏳
- [ ] Module LMS : Formations et modules d'apprentissage (page placeholder, modèles et migration existants).
- [ ] Module Reporting : Synthèses et graphiques avancés (page placeholder).

---

## 🚀 Déploiement Production (Hostinger)

### Configuration serveur

Hostinger utilise **LiteSpeed** (pas Apache). Les directives `php_value` dans `.htaccess` **ne fonctionnent pas** avec LiteSpeed.

#### Fichier `public/.user.ini` (obligatoire pour les uploads)
```ini
upload_max_filesize = 20M
post_max_size = 25M
file_uploads = On
max_execution_time = 120
memory_limit = 256M
```

#### Permissions à appliquer via SSH
```bash
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/
php artisan storage:link
```

#### Paramètres PHP à configurer dans hPanel
- `file_uploads` → On
- `upload_max_filesize` → 20M
- `post_max_size` → 25M

### Upload de fichiers (Module Import) — Erreur 403

**Cause** : Le WAF LiteSpeed/ModSecurity bloque les uploads multipart, notamment les fichiers `.xlsx` (qui sont des archives ZIP).

**Symptôme** : `403 Forbidden — Access to this resource on the server is denied!` → erreur **serveur**, pas Laravel (pas de page d'erreur Laravel).

**Solutions** :
1. Vérifier que `public/.user.ini` est en place avec les bonnes limites.
2. Ajouter `<IfModule mod_security2.c>SecRuleEngine Off</IfModule>` dans `public/.htaccess` pour désactiver ModSecurity.
3. Si le problème persiste, contacter le support Hostinger pour exclure l'URL `/import/parse` des règles WAF.

---

## 🔐 Phase 5b — Gestion Modulaire des Accès (Mai 2026)

### Principe
Chaque société dispose d'un ensemble de modules activables à la carte. Les modules *core* (dashboard, equipe, parametres) sont toujours actifs. Les autres peuvent être activés/désactivés par le SuperAdmin ou l'admin société.

### Tables
- `modules` — Catalogue global de la plateforme (14 modules définis dans `ModuleSeeder`)
- `societe_module` — Table pivot avec `actif`, `active_le`, `desactive_le`, `active_par_user_id`, `parametres`

### Gating côté serveur
- **Middleware** `VerifierModuleActif` (alias `module`) : `Route::middleware('module:okr')`
- Retourne HTTP 403 si le module n'est pas actif pour la société

### Gating côté client
- `modulesActifs` partagé globalement via `HandleInertiaRequests`
- **Sidebar/Topbar** : filtrent les items par `moduleCode`
- **Composant** `<RequireModule code="okr">` : n'affiche les children que si le module est actif

### Modules disponibles
| Code | Nom | Core | Premium |
|------|-----|------|---------|
| dashboard | Tableau de bord | ✅ | — |
| okr | OKR | — | — |
| individuels | Objectifs Individuels | — | — |
| taches | Tâches & Projets | — | — |
| daily | Daily / Standups | — | — |
| matrice | Matrice Eisenhower | — | — |
| prospection | Prospection | — | — |
| missions | Missions | — | — |
| incentives | Incentives | — | ✅ |
| lms | Formation (LMS) | — | ✅ |
| reporting | Reporting | — | — |
| equipe | Équipe | ✅ | — |
| parametres | Paramètres | ✅ | — |
| import | Import | — | — |

---

## 🛡️ Phase 5c — Console SuperAdmin (Mai 2026)

### Architecture
URL : `/superadmin/*`, middleware `superadmin` → `IsSuperAdmin`
Layout dédié (`SuperAdmin/Layout.jsx`) : sidebar `slate-900`, accents `indigo-600`, badge ADMIN.

### Pages SuperAdmin
| Route | Composant | Description |
|-------|-----------|-------------|
| `/superadmin` | `SuperAdmin/Dashboard` | KPIs, graphiques, dernières sociétés, logs récents |
| `/superadmin/societes` | `SuperAdmin/Societes/Index` | Liste paginée avec filtres et modules chips |
| `/superadmin/societes/create` | `SuperAdmin/Societes/Create` | Wizard 4 étapes |
| `/superadmin/societes/{id}` | `SuperAdmin/Societes/Show` | Détail + toggle modules + impersonation |
| `/superadmin/societes/{id}/edit` | `SuperAdmin/Societes/Edit` | Modifier infos société |
| `/superadmin/utilisateurs` | `SuperAdmin/Utilisateurs/Index` | Liste avec promo/révocation |
| `/superadmin/modules` | `SuperAdmin/Modules/Index` | Catalogue + CRUD inline |
| `/superadmin/abonnements` | `SuperAdmin/Abonnements/Index` | Vue et édition des plans |
| `/superadmin/audit-logs` | `SuperAdmin/AuditLogs/Index` | Logs filtrables (societe, action, date) |
| `/superadmin/parametres` | `SuperAdmin/Parametres/Index` | Paramètres plateforme (à venir) |

### Impersonation
- Démarrer : `POST /superadmin/impersonation/{user}` — stocke `impersonator_id` en session, Auth::login(user)
- Arrêter : `POST /superadmin/impersonation/stop` — restaure le superadmin, audit log
- **BandeauImpersonation** : bandeau amber sticky affiché dans `AppLayout` quand impersonation active

### Audit automatique
- **SocieteObserver** : log les changements de statut et suppressions
- **UserObserver** : log les promotions/révocations superadmin
- Les actions explicites (toggleModule, create, etc.) logguent via `audit()` helper dans les controllers

### Seeders
- `ModuleSeeder` : crée/met à jour les 14 modules du catalogue
- `SuperAdminSeeder` : crée `superadmin@addvalis.com` / `Addvalis2026!`

**Diagnostic rapide** : tester avec un CSV (< 1 Mo) — si le CSV passe mais pas le XLSX, c'est le WAF qui bloque les archives ZIP.

---

## 🐛 Bugs connus et correctifs

### `$this->middleware()` supprimé dans Laravel 11+ (corrigé Juin 2026)

**Fichiers** : tous les contrôleurs utilisant `$this->middleware()` dans le constructeur.

**Problème** : Laravel 11 a supprimé la méthode `middleware()` de la classe de base `Controller`. Appel résulte en `Call to undefined method`.

**Correctif** : Implémenter l'interface `HasMiddleware` avec une méthode statique `middleware(): array` retournant des objets `Middleware`.

```php
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class MonController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(function ($request, $next) {
                // logique...
                return $next($request);
            }),
        ];
    }
}
```

---

### Note et Fichiers du `TaskDetailPanel` non persistés (corrigé Juin 2026)

**Fichier** : `resources/js/Pages/OKR/Index.jsx` — composant `TaskDetailPanel`.

**Problèmes** :
1. **Note** : la textarea de l'onglet Note n'avait aucun mécanisme de sauvegarde — `noteText` était un état local jamais persisté.
2. **Fichiers** : après upload (axios), si l'utilisateur fermait et rouvrait le panneau sans faire Edit+Save, le fichier disparaissait car `tache.fichiers` dans `taskPanel` (état React) était périmé.
3. **Prop `auth` manquante** : le champ Responsable était toujours désactivé (`disabled={true}`) et les boutons Modifier/Supprimer du footer invisibles.

**Correctifs** :
- Migration `2026_06_03_000001_add_note_to_taches` : colonne `note` text nullable.
- Route `PATCH /taches/{tache}/note` → `TacheController::updateNote` → `redirect()->back()`.
- `noteText` initialisé depuis `tache.note` à l'ouverture. Bouton "Sauvegarder la note" utilise `router.patch`.
- `router.reload({ only: ['objectifs'] })` appelé après chaque upload fichier.
- `auth={auth}` ajouté à l'invocation de `TaskDetailPanel` dans `OKRIndex`.
- `onError` dans `handleSaveTask` affiche désormais le message de validation via `toast.error`.

---

### Composants Select défaillants — Dialog incompatible + crash Headless UI (corrigé Juin 2026)

**Fichiers** : `resources/js/Components/ui/CustomSelect.jsx`, `resources/js/Components/ui/SearchableSelect.jsx`, `resources/js/Components/ui/Select.jsx`.

**Problèmes** :
1. **`CustomSelect` crash total** : utilisait l'API Headless UI v1 (`Listbox.Button`, `Listbox.Options`) alors que `@headlessui/react@^2.0.0` est installé. Ces exports n'existent plus en v2 → crash JavaScript au runtime.
2. **`SearchableSelect` ferme le Dialog** : le dropdown portal (`document.body`) était interprété par Radix `DismissableLayer` comme "hors Dialog" → le Dialog se fermait dès qu'on cliquait une option.
3. **`SearchableSelect` impossible à utiliser dans un Dialog** : le `FocusScope` de Radix Dialog piégeait le focus et empêchait de mettre le focus sur la barre de recherche (rendue dans un portal externe).
4. **`NativeSelect` sans flèche** : `appearance-none` retirait la flèche native sans en ajouter une — ressemblait visuellement à un `<input>` texte.

**Correctifs** :
- `CustomSelect` et `SearchableSelect` **réécrits** avec `@radix-ui/react-popover` (déjà en dépendance). Radix Popover et Radix Dialog partagent un contexte `DismissableLayer` — le Dialog suspend sa propre détection de fermeture quand un Popover imbriqué est ouvert.
- `onPointerDown` avec `e.preventDefault()` sur chaque option (sélection avant tout changement de focus).
- `onCloseAutoFocus={(e) => e.preventDefault()}` sur `PopoverContent` (pas de scintillement à la fermeture).
- `NativeSelect` : wrapper `<div className="relative">` + `<ChevronDown>` en absolu ; `className` reste sur le `<select>` pour compatibilité ascendante (`h-8`, `w-36`, etc.).

---

### `TypeLivrable` — mauvais nom de table (corrigé Juin 2026)

**Fichier** : `app/Models/TypeLivrable.php`.

**Problème** : Laravel pluralise `TypeLivrable` en `type_livrables` (convention Eloquent : camelCase → snake_case → pluriel). La table réelle s'appelle `types_livrable`. Résultat : `SQLSTATE[42S02]: Base table or view not found: 'addvalis_okr.type_livrables'` à chaque chargement d'une page qui touche ce modèle (ex: `SocieteController::edit()`) — ce qui cassait silencieusement des pages sans rapport apparent avec TypeLivrable.

**Correctif** : Ajouter `protected $table = 'types_livrable';` dans le modèle.

**Règle** : Tout modèle dont le nom pluriel Eloquent ne correspond pas au nom réel de la table **doit** déclarer `protected $table`. Vérifier systématiquement pour les tables dont le nom n'est pas un pluriel anglais standard.

---

### `NativeSelect` — double chevron superposé (corrigé Juin 2026)

**Fichier** : `resources/js/Components/ui/Select.jsx` — composant `NativeSelect`.

**Problème** : La classe Tailwind `appearance-none` est censée supprimer la flèche native du navigateur. Sur Chrome/Windows et Firefox, elle peut être insuffisante et laisser apparaître la flèche native en plus du `<ChevronDown>` Lucide ajouté en absolu — résultat : double chevron superposé.

**Correctif** : Ajouter `style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}` en ligne sur le `<select>`, en complément de la classe `appearance-none`. Les deux sont nécessaires pour couvrir tous les navigateurs.

---

### `useForm.post/put` sans `preserveState` ferme le panneau et avale les erreurs (corrigé Juin 2026)

**Fichiers** : `Missions/Index.jsx` (LivrablesTab), `Prospection/Index.jsx` (modal prospect).

**Problème** : Les soumissions `useForm.post` / `useForm.put` sans `preserveState: true` déclenchent une navigation Inertia complète après redirect. L'état React local (ex: `selectedMission`, `editingProspect`) est réinitialisé → le panneau se ferme, les erreurs de validation sont invisibles.

**Correctif** : Ajouter `preserveState: true` et `preserveScroll: true` à tous les appels `post`/`put` dans les panneaux et modals. La règle générale :
- Formulaires dans un panneau/modal slide-over → **toujours** `preserveState: true`.
- Formulaires de page dédiée (pleine page) → pas nécessaire.

---

### `type="number"` en locale française renvoie chaîne vide (corrigé Juin 2026)

**Fichier** : `Prospection/Index.jsx` — champ `valeur` du modal prospect.

**Problème** : En locale française, le navigateur affiche `1 000 000,00` dans un `<input type="number">`. Si l'utilisateur ne retouche pas le champ, la soumission envoie la valeur correcte. Mais si le champ est re-rendu ou si la valeur contient une virgule, `.value` retourne `""` → validation `numeric` Laravel échoue silencieusement.

**Correctif** : Remplacer systématiquement tous les `<Input type="number">` par `<NumberInput>` (cf. conventions). Le `NumberInput` gère le formatage français en interne et envoie la valeur numérique brute.

**Règle** : Ne jamais utiliser `type="number"` dans ce projet. Utiliser `<NumberInput>` partout.

---

### URL stricte sur les livrables bloquait silencieusement l'ajout (corrigé Juin 2026)

**Fichier** : `MissionController.php` — `storeLivrable` et `updateLivrable`.

**Problème** : La règle `'url' => 'nullable|url|max:500'` rejetait tout texte ne commençant pas par `http://` ou `https://` (ex: un chemin relatif ou un identifiant). L'erreur était muette faute d'affichage côté frontend.

**Correctif** : Règle passée à `'url' => 'nullable|string|max:500'`. La validation de format URL n'est pas critique pour un champ de lien livrable.

---

### `NumberInput` — valeur alignée à droite (corrigé Juin 2026)

**Fichier** : `resources/js/Components/ui/NumberInput.jsx`.

**Problème** : La classe `text-right` était codée en dur dans le composant, ce qui alignait tous les montants à droite même dans des contextes où c'est inattendu (formulaires).

**Correctif** : Remplacé `text-right` par `text-left` dans le `cn()` du composant. Le montant s'affiche maintenant aligné à gauche, cohérent avec tous les autres champs texte.

---

### Filtre "Toutes les périodes" — OKR Index (corrigé 20 Mai 2026)

**Fichier** : `resources/js/Pages/OKR/Index.jsx` — fonction `applyFilters`.

**Problème** : Sélectionner "Toutes les périodes" ne montrait pas tous les objectifs. Le frontend supprimait `periode_id` des paramètres URL quand il était vide (`''`). Le backend voyait alors une URL sans `periode_id` et **redirigeait automatiquement** vers la période en cours.

**Correctif** : `periode_id` n'est plus supprimé de l'URL même quand vide. La valeur `periode_id=` (chaîne vide) signale au backend "pas de filtre" sans déclencher la redirection automatique.

```js
// Avant
Object.keys(f).forEach(k => f[k] === '' && delete f[k]);
// Après — periode_id vide = "toutes", on le garde dans l'URL
Object.keys(f).forEach(k => k !== 'periode_id' && f[k] === '' && delete f[k]);
```

**Règle** : La redirection automatique vers la période courante dans `ObjectifController::index()` ne se déclenche que si `periode_id` est **totalement absent** de la requête (première visite). Une chaîne vide `periode_id=` suffit à la désactiver.

---

## 💡 Conventions de Codage

### Backend (Laravel)
- **Nommage** : Les classes, modèles, et contrôleurs en PascalCase. Les méthodes et variables en camelCase. La base de données en snake_case.
- **Langue** : Le code métier et la base de données sont nommés en **français** pour coller au métier (ex: `Collaborateur`, `Objectif`, `ResultatCle`).
- **Validation** : Toujours utiliser des FormRequests ou la validation dans le contrôleur.
- **Seeders** : Structure modulaire (`SocieteSeeder` → `CollaborateurSeeder` → `ParametreOKRSeeder` → `OKRSeeder` → `TacheSeeder` → `ProspectSeeder`). Les tâches seedées sont liées à des KRs spécifiques (hiérarchie Objectif → KR → Tâche).
- **Réponses Inertia** : Toujours `redirect()->back()` ou `Inertia::render()`, jamais `response()->json()`.
- **Modals** : Les formulaires de création rapide utilisent `router.post` (pas `useForm.post`) avec `preserveState: true` et `onError` pour garder le modal ouvert en cas d'erreur.
- **Validation URL** : Utiliser `nullable|string|max:500` plutôt que `nullable|url` pour les champs de lien — la règle `url` Laravel est trop stricte pour des saisies libres.

### Frontend (React)
- **Composants** : Fonctions exportées par défaut. Nommage en PascalCase.
- **Inertia** : Utilisation de `router` pour les formulaires modaux (plus fiable que `useForm` pour garder l'état). `useForm` uniquement pour les pages de formulaire dédiées.
- **Styling** : Utilisation systématique de Tailwind. Pour les variantes complexes, utiliser `cva`.
- **Imports** : Toujours `export default` pour les composants. Imports nommés `{ X }` uniquement pour les named exports (ex: UI components).
- **Nombres** : Utiliser `<NumberInput>` pour **tous** les champs numériques (interdit d'utiliser `type="number"` — bug locale française). `formatNumber()` pour l'affichage en lecture seule.
- **Langue** : Toute l'interface utilisateur doit être en **français**. Aucun texte en anglais visible par l'utilisateur.
- **Modals inline** : Les modals de création (objectif, tâche) sont des composants locaux dans le fichier de la page parent, pas des fichiers séparés.
- **`preserveState` obligatoire** : Tout `useForm.post` / `useForm.put` / `router.put` déclenché depuis un panneau slide-over ou un modal doit inclure `preserveState: true, preserveScroll: true` pour maintenir l'état React et afficher les erreurs de validation.
- **Selects** : Ne jamais utiliser `NativeSelect` dans les formulaires — utiliser `SearchableSelect` (> 5 options ou responsables) ou `CustomSelect` (≤ 5 options fixes). `NativeSelect` uniquement pour les filtres légers dans les barres de recherche.

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
| `taches` | Tâches liées à un KR (titre, description, mode_operatoire JSON, outils, definition_done JSON, note, statut, priorité, eisenhower, date, collaborateur, objectif_id, resultat_cle_id, mission_id). Hiérarchie : Objectif → KR → Tâche. |
| `missions` | Projets & Delivery (titre, client, type, statut enum incl. `en_attente_dir`, responsable, deadline, montant, email_nps_client, dir_validated, nps_score, SLA channel, next_action) |
| `livrables` | Livrables liés à une mission (nom, type_livrable, statut lifecycle, dir_validated, ar_count, url, deadlines) |
| `mission_logs` | Journal d'activité mission (type action/note/statut/livrable, content, auteur) |
| `prospects` | Prospects CRM (nom, contact, secteur, statut pipeline, prochain RDV, valeur, source, montant_final, date_premier_contact, date_conversion, notes) |
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
| `modules` | Catalogue global des modules de la plateforme (code, nom, icone, couleur, categorie, est_core, est_premium, ordre) |
| `societe_module` | Pivot modules × sociétés (actif, active_le, desactive_le, active_par_user_id, parametres) |
| `audit_logs` | Journal d'audit (user_id, societe_id, action, description, donnees JSON, ip, user_agent) |
| `abonnements` | Abonnements SaaS par société (plan starter/pro/enterprise, prix_mensuel, limite_utilisateurs, statut) |
| `fiches_performance` | Fiches de performance (collaborateur, cycle, statut workflow, 4 scores /5, poids, score_global, commentaires, validated_at) |
| `historique_workflow_performance` | Journal horodaté des transitions de workflow (de_statut, vers_statut, user, commentaire) |
| `secteurs_activite` | Référentiel secteurs d'activité par société (nom, ordre, actif) — alimente le champ `secteur` des clients et deals |
| `practices` | Référentiel pratiques/expertises par société (nom, ordre, actif) — alimente le champ `practice` des missions |
| `types_livrable` | Référentiel types de livrable par société (nom, ordre, actif) — alimente le champ `type_livrable` des livrables de mission |

---

*Dernière mise à jour : 22 Juin 2026 — Référentiels CRM paramétrables (secteurs_activite, practices, types_livrable) + ParametreCrmController + onglet Paramètres CRM ; Import XLSX Prospects (ProspectImportController, Import.jsx, flux drag-drop → aperçu → commit) ; Pipeline normalisé 5 stades avec probabilité automatique (KANBAN_COLS defaultProba, updateStatus backend, DealModal probaManuelle) ; sidebar "Clients & Deals" hub (VueClientsHub, 4 onglets, "En prospection") ; fix TypeLivrable table name (protected $table) ; fix NativeSelect double chevron (WebkitAppearance inline)*

*Précédente mise à jour : 11 Juin 2026 — Rôle DRH visible dans Équipe (4 fichiers frontend + stats controller) ; fix email collaborateur sans User ; sync OKR → Performance opérationnelle (useEffect anti-staleness, okrOptions élargi, progression live, bouton Sync toujours visible) ; visibilité role-based module Performance (admin/dir/DRH tout, manager équipe, collab sa fiche)*
