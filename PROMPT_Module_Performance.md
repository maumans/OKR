# 🎯 Chantier « Module Performance » — Spécification pour Claude Code

> **À coller dans Claude Code.** Objectif : implémenter (ou parfaire) le **Module Performance** de la plateforme, en alignant l'existant sur la cible « Laawol ». Tu ne codes pas tout de suite : tu lis cette spec + les fichiers de référence, tu compares à l'état actuel du dépôt, puis tu me proposes un **plan** avant d'implémenter.

---

## 0. Rappels de contexte (voir `DEVBOOK.md`)

Stack : Laravel 13 + React/Inertia + Tailwind + shadcn/Radix, multi-tenant (`societe_id` + trait `BelongsToSociete`), modules activables (`module:code`), **interface 100 % français**.

**Conventions impératives** : `<NumberInput>` (jamais `type="number"`) · `SearchableSelect`/`CustomSelect` (jamais headlessui) · `router.post/put` avec `preserveState:true, preserveScroll:true` dans modals/slide-overs · `redirect()->back()` (jamais `response()->json()`) · controllers Laravel 11 via `HasMiddleware` · nommage métier FR · `formatCurrency(value, devise)` (pas de devise codée en dur).

**Fichiers de référence à consulter** (à placer dans le dépôt, ex. `/docs`) :
- `laawol_manual.html` → règles métier. Chapitre **« Module Performance »** (cycle hybride, 4 types d'objectifs, référentiel des champs de fiche, workflow de validation, scénario d'évaluation annuelle de Gando Diallo).
- `laawol_appv2.html` → logique & data model. Fonctions : `createPerformance`, `initAllPerformances`, `calcGlobalPerfScore`, `normalizeOKRScore`, `advanceWorkflow`, `openPerfFiche`, `openMidReview`, `openFinalReview`, `renderPerformance`, `renderWorkflowView`, `renderCycleView`, `renderMidReviewList`, `renderFinalReviewList`, `apprBadge`, `workflowStatusBadge`, `updatePerfScore`, `updatePerfComment`.

> Ces fichiers sont des maquettes statiques (données en `localStorage`, objets imbriqués). Tu dois **transposer leur logique** en Laravel/Inertia avec un schéma relationnel propre — **pas copier le HTML**. L'apparence suit le design system Addvalis.

---

## 1. But du module

Le Module Performance **traduit les scores OKR opérationnels en évaluations individuelles structurées**, avec un workflow de validation RH et un score global qui alimente ensuite le calcul de prime. C'est le maillon **OKR → Performance → Prime** de la chaîne « une seule source de vérité ».

---

## 2. Ce qui existe déjà dans le projet (à auditer avant de coder)

⚠️ **Ne pas dupliquer.** Vérifie l'état réel du dépôt, mais d'après le DEVBOOK il existe déjà des briques proches :

- **Module « Individuels »** (`Individuels/Index.jsx`, `IndividuelController`) : vue OKR par collaborateur, **filtre mensuel**, score global en %, ventilation par axe, encadré prime en attente, modal objectif individuel (collaborateur, mois, axe, titre, KRs texte libre, prime, note). Colonnes `mois` et `note_contexte` sur `objectifs`.
- **Module « Incentives »** : `objectifs_remuneres`, `validations_objectifs`, `configurations_primes`, `paliers_primes`.
- **Collaborateurs** avec `role` (`admin`/`manager`/`collaborateur`).
- **OKR** : calcul de score d'objectif déjà existant (progression des KR).

**Décision attendue de ta part** (à me proposer) : le module Performance cible est **différent** d'Individuels (annuel, typé, pondéré, avec workflow et cycle). Recommande si on :
(a) crée un module Performance distinct et on garde Individuels tel quel, ou
(b) on fait évoluer/absorbe Individuels. Mon intuition : **(a) module distinct**, mais argumente.

---

## 3. Ce qui MANQUE pour parfaire le module (le cœur de la demande)

Par rapport à la cible Laawol, il manque aujourd'hui :

1. **La notion de fiche de performance annuelle** par collaborateur et par cycle (≠ objectifs mensuels).
2. **Les 4 types d'objectifs pondérés** (Commercial / Delivery / Développement / Comportemental).
3. **Le score global pondéré sur /5** et la **normalisation OKR brut → /5**.
4. **Le workflow de validation à 4 étapes** (+ état « révision demandée »).
5. **Le cycle hybride** à 5 jalons (Fixation, Q1, Mid-Year, Q3, Finale).
6. **Mid-Year Review** et **Évaluation finale** avec archivage et calcul de prime.
7. La **liaison automatique** des objectifs Commercial/Delivery aux objectifs OKR (consolidation).

---

## 4. Modèle de données recommandé

Transposition relationnelle du prototype (qui stocke tout en JSON imbriqué). **Adapte aux conventions existantes**, propose la version finale avant migration.

### Table `fiches_performance`
| Colonne | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `societe_id` | FK | trait `BelongsToSociete` |
| `collaborateur_id` | FK | sujet de l'évaluation |
| `manager_id` | FK nullable | évaluateur (manager du collaborateur) |
| `cycle` | string | ex. `"2026"` |
| `statut_workflow` | enum | `brouillon` / `en_revision` / `attente_drh` / `confirme` / `revision_demandee` |
| `nb_allers_retours` | tinyint | compteur A/R en révision (max 3) |
| `score_global` | decimal(3,2) nullable | sur /5, recalculé |
| `appreciation` | string nullable | libellé normalisé |
| `commentaire_global_manager` | text nullable | |
| `commentaire_global_collab` | text nullable | |
| `verrouille` | boolean | true quand `confirme` |
| timestamps | | |

### Table `objectifs_performance` (4 lignes par fiche)
| Colonne | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `fiche_performance_id` | FK | |
| `type` | enum | `commercial` / `delivery` / `dev` / `comportemental` |
| `description` | string | ex. « CA Practice Intégration ≥ 750M » |
| `cible` | string | libellé cible (ex. « NPS 8/10 ») |
| `poids` | decimal(5,2) | en % ; défauts 50/25/15/10 |
| `objectif_okr_id` | FK nullable | pour Commercial/Delivery : objectif OKR source |
| `score_manager` | tinyint nullable | 1–5 ; saisi pour Dev/Comportemental |
| `score_collab` | tinyint nullable | auto-évaluation 1–5 (optionnel) |
| `commentaire_manager` | text nullable | |
| `commentaire_collab` | text nullable | |

### Table `performance_workflow_logs`
`id`, `fiche_performance_id`, `etape` (string), `par_user_id`, `commentaire` (text nullable), `created_at`. → journal horodaté de chaque transition.

### Reviews (au choix : colonnes sur `fiches_performance` ou table dédiée `performance_reviews`)
Champs Mid-Year : `mid_done` (bool), `mid_date`, `mid_commentaire_manager`, `mid_commentaire_collab`, `mid_forecast` (text — révision éventuelle des cibles, justification obligatoire).
Champs Finale : `final_done` (bool), `final_date`, `final_score_global` (decimal), `final_appreciation`, `final_commentaire_manager`, `final_commentaire_collab`, `final_prime_calculee` (decimal nullable). → **fige** le score et la prime au moment de la clôture.

### Pondérations par défaut (paramètres entreprise)
Stocke `poids_commercial=50`, `poids_delivery=25`, `poids_dev=15`, `poids_comportemental=10` au niveau société (table `configurations_*` existante ou nouvelle table de config Performance). Ces poids alimentent `objectifs_performance.poids` à la création de fiche et restent modifiables (futur Module RH / Paramètres).

---

## 5. Règles de calcul (à implémenter fidèlement)

### 5.1 Normalisation OKR brut → appréciation /5 (helper réutilisable)
Réf. `normalizeOKRScore` + manuel « Normalisation OKR → Performance ». À exposer comme service partagé (servira aussi à la Prime).

| Score OKR brut | Niveau /5 | Appréciation | Impact prime |
|---|---|---|---|
| ≥ 100 % | 5 | Très au-dessus des attentes | ×120 % |
| 80–99 % | 4 | Au-dessus des attentes | ×110 % |
| 60–79 % | 3 | Au niveau des attentes | ×100 % |
| 40–59 % | 2 | En cours de développement | ×50 % |
| < 40 % | 1 | Non encore atteint | ×0 % |

### 5.2 Score par type d'objectif
- **Commercial** et **Delivery** : `objectif_okr_id` renseigné → calculer le score OKR brut de cet objectif (progression pondérée de ses KR, logique OKR existante) → **normaliser en /5** (niveau ci-dessus).
- **Développement** et **Comportemental** : `score_manager` (1–5) saisi manuellement par le manager.
- **Défaut à 3/5** si une composante n'est pas encore renseignée (comme le prototype), mais signale visuellement « non renseigné ».

### 5.3 Score global pondéré (réf. `calcGlobalPerfScore`)
```
score_global = (score_commercial × poids_commercial/100)
             + (score_delivery   × poids_delivery/100)
             + (score_dev        × poids_dev/100)
             + (score_comportemental × poids_comportemental/100)
```
Résultat sur **/5**, arrondi à 2 décimales. L'appréciation affichée se déduit en reconvertissant `score_global/5×100` puis en re-normalisant (badge couleur via `apprBadge`).

> Le **score_global** est l'entrée du Module Prime (chantier suivant).

---

## 6. Workflow de validation (réf. manuel « Workflow » + `advanceWorkflow`)

5 états, transitions horodatées dans `performance_workflow_logs` :

| # | État | Acteur | Action sortante |
|---|---|---|---|
| 1 | `brouillon` | Manager | « Soumettre pour révision » → `en_revision` |
| 2 | `en_revision` | Collaborateur | Manager : « Envoyer à la DRH » → `attente_drh` · Collaborateur : « Demander révision » → `revision_demandee` (**max 3 A/R**) |
| 3 | `attente_drh` | DRH | « Approuver (DRH) » → `confirme` · ou renvoi → `revision_demandee` |
| 4 | `confirme` | Système | **Objectifs verrouillés** (`verrouille=true`). Toute modif ultérieure relance le workflow complet. |
| — | `revision_demandee` | — | branche de retour vers `brouillon`/`en_revision` |

**Verrouillage** : au statut `confirme`, bloquer côté serveur **et** client toute édition des objectifs/poids/scores tant qu'on ne relance pas le workflow. C'est une règle d'intégrité du cycle.

---

## 7. Cycle hybride (réf. `renderCycleView` + manuel « cycle hybride »)

5 jalons Performance entrelacés avec le pilotage OKR :

| Mois | Jalon | Détail |
|---|---|---|
| Janvier | **Fixation des objectifs** | Entretien 1h · workflow complet obligatoire · objectifs verrouillés · DRH obligatoire |
| Avril | **Q1 Review** | Checkpoint 30 min · avancement · blocages · **pas** de workflow complet |
| Juillet | **Mid-Year Review** | Éval mi-parcours 1h · forecast · **révision des cibles possible** (justification) · DRH si révision majeure |
| Octobre | **Q3 Review** | Checkpoint 30 min · trajectoire fin d'année · préparation éval finale |
| Décembre | **Évaluation finale** | Score global auto · prime calculée · commentaires croisés · **archivage** · DRH obligatoire |

Affiche une **frise du cycle** indiquant le jalon courant.

---

## 8. Mid-Year & Évaluation finale

- **Mid-Year** (`openMidReview`) : commentaire manager + commentaire collaborateur + **forecast** (révision éventuelle des cibles avec justification). Marque `mid_done`, journalise.
- **Finale** (`openFinalReview`) : récapitule les 4 scores, calcule le **score global** et la **prime** (appel au service Prime — voir dépendances), fige `final_*`, archive. **DRH obligatoire**. **Une seule clôture par cycle.**

---

## 9. Rôles & droits (à appliquer côté serveur ET client)

- **Manager** : crée la fiche, saisit les objectifs Dev/Comportemental et les commentaires manager, fait avancer le workflow jusqu'à `attente_drh`, conduit Mid-Year et propose l'éval finale. Ne voit **que ses collaborateurs**.
- **Collaborateur** : consulte sa fiche, ajoute commentaires/auto-évaluation, peut « Demander révision » (max 3). Ne voit pas les fiches des collègues. Ne modifie pas les cibles de ses KR.
- **DRH / DIR** : approuve (`attente_drh → confirme`), peut renvoyer en révision, valide les primes, paramètre les poids et le seuil NPS.

---

## 10. Écrans React (sidebar du module, réf. `SIDEBAR_ITEMS.performance`)

5 vues :
1. **Fiches individuelles** : grille de cartes collaborateur (avatar, rôle, score global /5, badge appréciation, statut workflow). Bouton « Synchroniser OKR → Performance » (= `initAllPerformances` : crée les fiches manquantes + pré-remplit Commercial/Delivery depuis les KR). Carte « fiche inexistante » → bouton créer.
2. **Workflow de validation** : Kanban 5 colonnes (Brouillon / En révision / Attente DRH / Confirmé / Révision demandée) avec compteurs, cartes déplaçables selon droits.
3. **Cycle annuel** : la frise des 5 jalons.
4. **Mid-Year Review** : liste des fiches avec statut mid-review + bouton « Conduire la review ».
5. **Évaluation finale** : liste avec score auto + prime estimée + bouton « Conduire l'éval. ».

**Fiche détail** (slide-over ou modal, réf. `openPerfFiche`) : bandeau sombre (avatar + score global /5 + badge appréciation) ; statut workflow + boutons d'action contextuels selon le rôle ; les 4 sections d'objectifs (description, cible, score, sélecteur 1–5 pour Dev/Comportemental, commentaires manager + collaborateur) ; historique workflow horodaté. Édition désactivée si `verrouille`.

---

## 11. Dépendances & liaisons

- **Amont (OKR)** : les objectifs Commercial/Delivery doivent pouvoir pointer un `objectif_okr_id`. Idéalement le « socle » (sources automatiques des KR + service de consolidation + helper de normalisation) est posé d'abord ; sinon, construis le **helper de normalisation** ici et branche-le sur le calcul de score d'objectif OKR existant.
- **Aval (Prime)** : `score_global` et l'impact NPS (réduction −30 % si NPS practice < seuil) seront consommés par le Module Prime. Prévois que `final_prime_calculee` soit alimentée par un service Prime (à créer au chantier suivant) — pour l'instant, expose un point d'extension / interface claire.
- **Module à enregistrer** : déclare/active le code module `performance` dans `ModuleSeeder` + navigation (Topbar pill + Sidebar) avec gating `module:performance`.

---

## 12. Seeders / données de démo
Crée des fiches de démo cohérentes avec le scénario du manuel (ex. **Gando Diallo**, Manager Practice Intégration : Commercial 3/5, Delivery 4/5, Dev 4/5, Comportemental 4/5 → global ≈ 3.50/5). Utilise les collaborateurs déjà seedés.

---

## 13. Ce que j'attends de toi maintenant

1. **Audit** : ouvre le dépôt, confirme ce qui existe (Individuels, Incentives, calcul de score OKR) et identifie précisément l'écart avec cette spec.
2. **Recommandation** : module Performance distinct vs évolution d'Individuels (§2), et schéma final (§4).
3. **Plan** : migrations, modèles, controller(s), service de calcul/normalisation, routes, pages React, seeders, mise à jour `DEVBOOK.md`. **N'implémente qu'après mon feu vert.**
4. Respecte toutes les conventions du §0 et mets à jour le `DEVBOOK.md` (nouvelle phase) + donne-moi les commandes (`migrate`, `db:seed`, `npm run build`).

> Commence par l'audit et le plan. Ne code rien avant que je valide.
