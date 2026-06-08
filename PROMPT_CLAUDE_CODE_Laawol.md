# 🧭 Brief d'évolution — Addvalis OKR Performance → vision « Laawol »

> **À coller dans Claude Code au début de la session.** Ce document décrit le contexte du projet, la vision cible et un **catalogue de chantiers à la carte**. Tu n'implémentes **rien tout de suite** : tu lis, tu confirmes ta compréhension, puis j'attaque **un chantier à la fois**.

---

## 1. Contexte du projet existant

Le projet est **Addvalis OKR Performance**, une plateforme SaaS de gestion de la performance déjà en production. Lis le fichier `DEVBOOK.md` à la racine : il fait foi pour l'architecture, les conventions et l'état d'avancement. En résumé :

- **Stack** : Laravel 13, React 18 + Inertia.js, Tailwind v3, shadcn/ui (Radix), Framer Motion, MySQL. Interface **100 % en français**.
- **Multi-tenant** : tout est filtré par `societe_id` via le trait `BelongsToSociete` + middleware `InjecterSociete`. Toute nouvelle table métier doit porter `societe_id` et utiliser ce trait.
- **Modules activables** : gating serveur via `module:code` (middleware `VerifierModuleActif`) et client via `<RequireModule code="...">`. Tout nouveau module doit être déclaré dans `ModuleSeeder` + table `modules`.
- **Modules déjà livrés** : OKR (hiérarchie Axe→Objectif→KR→Tâche), Individuels, Daily, Matrice Eisenhower, Prospection, Projets/Missions & Delivery (avec NPS + workflow DIR), Incentives, Import Excel, SuperAdmin, multi-devises.
- **Placeholders** : LMS, Reporting.

### Conventions impératives (ne jamais les enfreindre)
- **Nombres** : interdit d'utiliser `type="number"` (bug locale FR). Utiliser `<NumberInput>` partout en saisie, `formatNumber()` / `formatCurrency()` en lecture seule.
- **Selects** : `SearchableSelect` (>5 options / responsables), `CustomSelect` (≤5 options), `NativeSelect` réservé aux filtres légers. Jamais `@headlessui/react`.
- **Modals / slide-overs** : `router.post`/`router.put` avec **`preserveState: true, preserveScroll: true`** + `onError`.
- **Réponses Inertia** : toujours `redirect()->back()` ou `Inertia::render()`, jamais `response()->json()`.
- **Controllers Laravel 11+** : pas de `$this->middleware()` dans le constructeur — implémenter `HasMiddleware`.
- **Nommage métier en français** (`Collaborateur`, `Objectif`, `ResultatCle`...). DB en snake_case.
- **Devise dynamique** : pas de GNF/FCFA codé en dur, utiliser `formatCurrency(value, devise)`.

---

## 2. Vision cible « Laawol »

L'objectif est de faire évoluer Addvalis vers le prototype **Laawol**, fourni dans deux fichiers HTML autonomes à placer à la racine (ou dans `/docs`) :

- **`laawol_appv2.html`** = prototype interactif → **référence pour l'UI, les écrans, la logique JS et les structures de données** (objets `MODULE_META`, `SIDEBAR_ITEMS`, `SEED_*`, et les fonctions `render*`, `consolidate*`, `runAutoValidation`, `calc*`...).
- **`laawol_manual.html`** = manuel utilisateur → **référence pour les règles métier, les formules, les référentiels de champs et les workflows**.

> ⚠️ Ces fichiers sont des maquettes statiques (données en `localStorage`). Tu dois **traduire leur logique métier** dans la stack Laravel/Inertia existante, **pas copier le HTML**. L'apparence finale suit le design system Addvalis du DEVBOOK, en s'inspirant des écrans Laawol.

### L'idée centrale à respecter partout : « une seule source de vérité »
La donnée saisie dans le **CRM**, dans un **Projet** ou dans les **indicateurs d'Opérations** doit **remonter automatiquement dans les KR OKR**, qui alimentent la **Performance**, qui calcule la **Prime**. Cette **chaîne de consolidation automatique** est le fil rouge de tous les chantiers ci-dessous.

### Rôles & droits (transverses, à intégrer au fil des chantiers)
- **DIR** : accès complet, valide les projets, approuve les primes, paramètre l'entreprise.
- **Manager** : crée projets/livrables, confirme livraisons, saisit NPS, évalue ses collaborateurs, gère ses deals. Ne voit pas les évaluations des autres équipes ; ne modifie pas les paramètres entreprise.
- **Collaborateur** : déclare ses livrables (uniquement à la **date du jour** — **rétroactivité interdite, règle absolue**), voit ses tâches/objectifs, commente sa fiche de perf. Ne voit pas les évaluations des collègues ; ne modifie pas les cibles de ses KR.

---

## 3. Catalogue des chantiers (à la carte)

Chaque chantier est autonome et livrable séparément. Pour chacun : migration(s) + modèle(s) + controller + page(s) React + seeders/démo + mise à jour du `DEVBOOK.md`. **Respecte l'ordre de dépendance** indiqué au § 4.

---

### 🔧 Chantier 0 — Moteur de consolidation & sources automatiques des KR `[SOCLE]`
**Pourquoi** : c'est le cœur du système. Sans lui, les chantiers CRM/Projets/Ops/Perf/Prime n'ont pas de sens.

**À ajouter**
- Sur `resultats_cles` : colonnes `type` (`nombre` | `montant` | `pourcentage` | `score` | `binaire`), `valeur_cible`, `valeur_actuelle`, `unite`, `poids` (0–1), et **`source_auto`** (enum : `manuel`, `crm_new_clients`, `crm_upsell`, `crm_pipeline`, `crm_revenue`, `projects_nps`, `projects_delais`, `ops_indicateur`), + `source_config` (JSON : filtres responsable/type/secteur, id indicateur lié...).
- **Formules de progression par type** (cf. manuel, section « Calcul du score OKR ») :
  - Nombre / Montant / Pourcentage / Score : `MIN(100, ROUND(actuel / cible × 100))`.
  - Score « moins = mieux » (ex : bugs, cible 0) : `actuel ≤ cible → 100`, sinon dégressif.
  - Binaire : `actuel ≥ cible → 100`, sinon `0`.
- **Score d'objectif** : `Σ(progression_KR × poids_KR) / Σ(poids_KR)`. Contrainte : somme des poids des KR d'un objectif = 1.00 (2 à 5 KR).
- **Service `ConsolidationService`** : méthode `consolidateKR($kr)` qui recalcule `valeur_actuelle` selon `source_auto`, puis recalcule en cascade score objectif → (plus tard) score perf → prime. À appeler depuis les événements CRM/Projets/Ops.
- **Normalisation OKR → /5** (table de mapping, cf. manuel) à exposer comme helper réutilisable :

  | Score OKR brut | Appréciation | /5 | Impact prime |
  |---|---|---|---|
  | ≥ 100 % | Exceptionnel | 5 | ×120 % |
  | 80–99 % | Très bon | 4 | ×110 % |
  | 60–79 % | Zone cible | 3 | ×100 % |
  | 40–59 % | En dessous | 2 | ×50 % |
  | < 40 % | Insuffisant | 1 | ×0 % |

**Réf.** : `laawol_appv2.html` (`computeKR`, `calcKRProgress`, `calcObjectiveScore`, `consolidateAllKRs`, `normalizeOKRScore`) ; manuel chapitre OKR.

---

### 💼 Chantier 1 — Mini CRM (évolution de Prospection)
**Existant** : pipeline Kanban basique (`prospects`).

**À ajouter**
- 5 stades normalisés : `decouverte`, `proposition`, `negociation`, `gagne`, `perdu`.
- `type_deal` : `nouveau_client` | `upsell` | `renouvellement` (détermine quel KR est incrémenté).
- `probabilite` (%) + calcul du **pipeline pondéré** = `Σ(montant × probabilité)` des deals actifs.
- **Consolidation auto** : passage d'un deal à `gagne` → appel `ConsolidationService` pour incrémenter `crm_new_clients` ou `crm_upsell` selon le type.
- Vues sidebar : Pipeline Kanban, Liste des deals, Nouveaux clients, Upsells, Stats & Consolidation.

**Réf.** : `renderCRM*`, `addDeal`/`editDeal`, `consolidateAllKRs` (volet CRM) ; manuel chapitre « Mini CRM » (référentiel des champs deal).

---

### 📁 Chantier 2 — Projets & Delivery (Modèle A, finalisation)
**Existant** : module Missions/Projets déjà bien avancé (NPS, workflow DIR, livrables, journal).

**À ajouter / formaliser**
- **Poids** (%) sur chaque livrable ; somme = 100 % → progression projet pondérée.
- **NPS auto consolidé** : à la clôture (tous livrables `validated`), saisie du score → recalcul du **NPS moyen des projets clôturés du manager** → met à jour les KR avec `source_auto = projects_nps`.
- **Auto-validation à 72 h** des livrables déclarés mais non confirmés (filet de sécurité — pas la norme).
- **Rétroactivité interdite** : la déclaration « livré » d'un collaborateur prend toujours la **date du jour** (verrou serveur).
- KR `projects_delais` (alimenté par « 100 % projets dans les délais contractuels »).

**Réf.** : `renderProjects`, `declareDeliverable`/`confirmDeliverable`, `runAutoValidation`, `simulateNPS`/`updateNPSPreview` ; manuel chapitres « Projets & Delivery » + « Score NPS ».

---

### 📈 Chantier 3 — Module Opérations (Modèle B) `[NOUVEAU]`
**Pourquoi** : alternative au Modèle A pour les activités en flux continu (banque, assurance, logistique, mining, retail). Une entreprise peut utiliser A **et** B.

**À ajouter**
- Tables `ops_indicateurs` (nom, unite, `direction` ↑/↓, `cible`, `type_calcul` `moyenne`|`pourcentage`|`comptage`, `frequence` mensuelle|hebdo, responsable, `kr_id` lié, icône) et `ops_saisies` (indicateur, responsable, `periode` `YYYY-MM`/`YYYY-WXX`, valeur, numérateur, dénominateur, note).
- **Remplacement** : une nouvelle saisie sur (indicateur + responsable + période) **écrase** l'ancienne (pas de doublon).
- **Bibliothèque sectorielle** : indicateurs pré-définis par secteur, ajoutables en un clic.
- **Consolidation auto** : chaque saisie → recalcul de l'indicateur → mise à jour du KR lié (`source_auto = ops_indicateur`) → cascade.
- Vues sidebar : Tableau de bord, Saisir indicateurs, Configurer, Bibliothèque sectorielle, Historique.
- Nouveau module à enregistrer dans `ModuleSeeder` (code `operations`/`ops`).

**Réf.** : `renderOps*`, `addOpsEntry`, `consolidateOpsKRs`, `DEFAULT_OPS_INDICATORS_BANQUE` ; manuel chapitre « Opérations (Modèle B) ».

---

### 🎯 Chantier 4 — Module Performance `[NOUVEAU / au-delà d'Individuels]`
**À ajouter**
- **Fiche de performance** auto-créée par collaborateur et par cycle, avec **4 types d'objectifs pondérés** :

  | Type | Source | Poids défaut | Saisie |
  |---|---|---|---|
  | Commercial | KR OKR commerciaux (CRM) | 50 % | auto |
  | Delivery | KR OKR delivery (Projets/Ops) | 25 % | auto |
  | Développement | formations/certifs | 15 % | Manager |
  | Comportemental | référentiel compétences | 10 % | Manager |

- **Score global** = `Commercial×50% + Delivery×25% + Dev×15% + Comportemental×10%` (chaque sous-score sur /5, issu de la normalisation du chantier 0).
- **Workflow 4 étapes** : `brouillon` (Manager) → `en_revision` (Collaborateur, jusqu'à 3 A/R) → `attente_drh` (DRH) → `confirme` (verrouillé). Historique horodaté.
- **Cycle hybride** : Janvier Fixation · Avril Q1 Review · Juillet Mid-Year · Octobre Q3 Review · Décembre Évaluation finale.
- Vues sidebar : Fiches individuelles, Workflow validation, Cycle annuel, Mid-Year Review, Évaluation finale.

**Réf.** : `renderPerformance`, `createPerformance`, `advanceWorkflow`, `calcGlobalPerfScore`, `openMidReview`/`openFinalReview` ; manuel chapitre « Module Performance » (cycle + workflow + référentiel des champs de fiche).

---

### 💰 Chantier 5 — Module Prime (évolution d'Incentives)
**À ajouter**
- **3 modèles** (configurables par société) :
  - **% Salaire** : `Prime = base × (Score_global / 5)`.
  - **Paliers** (défaut Addvalis) : `Prime = base × palier`, paliers selon score OKR brut commercial.
  - **Collectif** : `(base × 0.5 × Perf_équipe/5) + (base × 0.5 × Score_indiv/5)`.
- **Règle NPS** : si NPS moyen de la practice du manager `< 7/10` (seuil **configurable**), prime commerciale **−30 %**, quel que soit le modèle.
- **Simulateur** : compare les 3 modèles, avec et sans la condition NPS.
- **Validation DRH** : individuelle ou en masse, **une seule validation par cycle**, archivage dans l'historique + fiche RH du collaborateur.

**Réf.** : `renderPrime*`, `calcPrimeAmount`, `setPrimeModel`, `simulatePrime`, `validatePrime`/`validateAllPrimes` ; manuel chapitre « Module Prime » (3 modèles + règle NPS + validation DRH).

---

### 👥 Chantier 6 — Module RH `[NOUVEAU / au-delà de Collaborateurs]`
**À ajouter**
- Fiche collaborateur enrichie : `grade` (Manager / Collaborateur...), `practice`, **`can_pros`** (booléen, éligible CRM), historique rémunération.
- **Organigramme** (arbre hiérarchique manager → équipe).
- **Référentiel de compétences** (alimente l'objectif Comportemental de la Perf).
- **Paramètres entreprise** : modèle de prime actif, seuil NPS, poids par défaut des types de perf, etc.

**Réf.** : `renderRH*`, `buildTree`/`showOrgChart`, `editCompetencies`, `editCompanySettings` ; manuel chapitre « Module RH ».

---

## 4. Ordre de réalisation recommandé (dépendances)

```
Chantier 0 (Socle consolidation)  ←  PREREQUIS de tout
        │
        ├─► Chantier 1 (CRM)        ─┐
        ├─► Chantier 2 (Projets A)   ├─► alimentent les KR
        ├─► Chantier 3 (Ops B)      ─┘
        │
        ├─► Chantier 6 (RH : grades, can_pros, compétences, params)  ← utile tôt
        │
        └─► Chantier 4 (Performance)  ─► consomme les KR normalisés
                    │
                    └─► Chantier 5 (Prime)  ─► consomme la Performance
```

Suggestion : **0 → 6 → 1 → 2 → 3 → 4 → 5**. (Le chantier 6 tôt car `grade`/`can_pros` et les paramètres entreprise sont référencés par les autres.)

---

## 5. Comment on travaille ensemble

1. **Maintenant** : lis `DEVBOOK.md`, `laawol_appv2.html` et `laawol_manual.html`. Confirme-moi en quelques lignes ta compréhension de la chaîne de consolidation et liste les chantiers tels que tu les as compris. **N'écris aucun code à ce stade.**
2. Je te dirai **quel chantier** attaquer (ex : « on fait le Chantier 0 »).
3. Pour le chantier choisi, tu proposes d'abord un **plan court** (migrations, modèles, routes, controllers, pages React, seeders de démo) ; j'approuve ; tu implémentes.
4. Tu **respectes scrupuleusement** les conventions du § 1 (NumberInput, SearchableSelect, preserveState, multi-tenant, gating module, français, devise dynamique, `HasMiddleware`).
5. À la fin de chaque chantier, tu **mets à jour `DEVBOOK.md`** (nouvelle phase cochée + tables ajoutées + règles métier) et tu me donnes les **commandes** à lancer (`php artisan migrate`, `db:seed`, `npm run build`...).
6. Les données de démo des fichiers Laawol (Addvalis = Modèle A, Banque de Conakry = Modèle B) servent de référence pour des seeders cohérents.

> Question d'amorçage : confirme ta compréhension, puis demande-moi par lequel des 7 chantiers on commence.
