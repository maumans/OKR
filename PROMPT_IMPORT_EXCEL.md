# 🎯 Prompt — Module d'import intelligent de plans d'action Excel dans Addvalis OKR Performance

## 📌 Contexte du projet (rappel)

Je travaille sur **Addvalis OKR Performance**, une plateforme SaaS multi-tenant de pilotage de performance (OKR) construite en :
- **Backend** : Laravel 13 (PHP) avec architecture multi-société via trait `BelongsToSociete` + middleware `InjecterSociete`
- **Frontend** : React 18 + Inertia.js, Tailwind CSS v3, shadcn/ui (Radix), Framer Motion
- **DB** : MySQL, modèles en français (`Societe`, `Collaborateur`, `Objectif`, `ResultatCle`, `Tache`, `AxeObjectif`, `Periode`, etc.)
- **Convention** : code métier et tables en français, UI 100% en français, formatage des nombres FR (`150 000,5`), `<NumberInput>` partout, `router.post` avec `preserveState: true` pour les modals
- **Hiérarchie centrale** : `Societe → Objectif → ResultatCle → Tache`
- **Table pivot multi-périodes** : `objectif_periode` (un objectif peut couvrir plusieurs trimestres)
- **Auto-seed** : à la création d'une `Societe`, `DefaultOkrConfigSeeder` initialise axes/périodes/types/statuts/seuils/config OKR

J'ai déjà terminé les phases 1 → 4f (OKR, Tâches, Daily, Prospection, Incentives, Matrice Eisenhower, Multi-devises, Missions). La phase 5 (LMS + Reporting) reste en placeholder.

---

## 🎯 Objectif de la mission

Construire un **module d'import Excel intelligent et réutilisable** (page `Import/Index.jsx` + backend) qui me permet d'aspirer un fichier de plan d'action Excel d'une entreprise cliente et de **mapper automatiquement** ses lignes vers le modèle Addvalis (Société → Objectif → KR → Tâche), avec **prévisualisation, édition manuelle du mapping, validation, et confirmation** avant insertion en base.

Ce module sera la première étape d'onboarding pour chaque nouvelle société cliente. Il doit être **générique** (gérer d'autres fichiers similaires demain) tout en absorbant les spécificités du fichier de référence fourni.

---

## 📄 Fichier de référence à supporter (livré séparément)

**Nom** : `PLAN_D_ACTION_DGP_-_DAF_2026.xlsx`
**Feuille unique** : `Dashboard`
**Société** : AGL Guinée / Conakry Terminal (2 entités opérationnelles + 1 entité partagée)

### Structure réelle du fichier
- **Ligne 1** : entêtes de mois (Fev-26, Mars, Avril… Dec-26) en colonnes K, O, T, X, AB, AG, AK, AO, AS, AW, BB → bandeau de timeline visuel
- **Ligne 2** : `Mise à jour le : 18/02/2026`
- **Ligne 3** : entêtes réels des colonnes (A à BE)
- **Lignes 4 à 47** : données mélangées (macro-thèmes + actions détaillées + sous-actions)
- **Lignes 51-54** : légende des priorités (P1 = 1 mois, P2 = 2-3 mois, P3 = 3-6 mois, P4 = 6-12 mois)

### Colonnes utiles (A à J)
| Col | Entête | Contenu | Cible Addvalis |
|-----|--------|---------|----------------|
| A | ENTITE | `AGL GUINEE`, `CONAKRY TERMINAL`, `AGL GUINEE & CONAKRY TERMINAL` (+ coquille `CONAKY TERMINAL`) | `axes_objectifs` (axe = entité) |
| B | THEME | Titre du projet (macro) OU titre de l'action (détail) | `objectifs.titre` ou `resultats_cles.description` |
| C | PRIORITE | `P1`, `P2`, `P3`, `P4` (+ coquille `p1`) | `objectifs.priorite` ou tâche.priorite |
| D | DEPARTEMENT | DAF, DSI, EXPLOITATION, DRH, ACHAT, QHSE, INFORMATIQUE, CLIENT, MANUTENTION, JURIDIQUE, CONTENTIEUX, EVEA, DIRECTION GENERALE | Tag secondaire / 2e axe / champ libre |
| E | PROCHAINES ACTIONS | Liste à puces multi-lignes (séparées par `*` ou `\n`) | `taches[]` du KR |
| F | DATE DEBUT | Date Excel | `objectifs.date_debut` |
| G | DATE CIBLE | Date Excel (parfois texte mal formé : `31/04/2026`, `01/01/12026`) | `objectifs.date_cible` + déduction `periode` |
| H | RESPONSABLE | Multi-valeurs (`Vessou / DAF`, `DSI/DEX Intoch\nDAF`) | `collaborateurs` (parser, créer si inexistant) |
| I | Pourcentage d'exécution | Décimal 0–1 (ex 0.55 = 55%) | `progression` (0–100) |
| J | STATUS D'AVANCEMENT | Historique horodaté multi-lignes (`02/03: ...\n10/04: ...`) | `note_contexte` + entrées de journal |

### Règles de détection de hiérarchie (CRITIQUE)
**Une ligne "macro-thème" (= futur Objectif parent)** se reconnaît à :
- Colonne B remplie EN MAJUSCULES (ou titre long sans verbe d'action)
- Colonnes C, D, E, F, G, H vides ou très peu remplies
- Colonne I présente (= % agrégé) MAIS pas de prochaines actions concrètes

**Une ligne "détail" (= futur Résultat Clé)** :
- Colonne B + Colonne C (priorité) + Colonne D (département) toutes remplies
- Rattachée à la macro-ligne précédente la plus récente

**Une puce dans la colonne E (= future Tâche)** :
- Une ligne commençant par `*` ou `-` ou séparée par `\n` dans `PROCHAINES ACTIONS`
- Rattachée au KR de sa ligne

**Exemples concrets observés dans le fichier** :
- Ligne 4 (macro) : `MISE EN PLACE DU PAIEMENT ELECTRONIQUE` → Objectif parent
- Lignes 5-9 (détails) : 4 KRs sous cet objectif
- Ligne 10 (macro) : `DIGITALISATION DES PROCESSUS (LOT 1)` → Objectif parent
- Lignes 11-18 (détails) : 8 KRs sous cet objectif
- Lignes 20-21 : actions isolées (pas de macro parent → créer un objectif "Divers / Autonome")

---

## 🛠️ Spécifications techniques attendues

### 1. Backend Laravel

**Migration / modèles**
- Aucune nouvelle table métier requise (utiliser l'existant : `societes`, `axes_objectifs`, `periodes`, `objectifs`, `resultats_cles`, `taches`, `collaborateurs`).
- Optionnel : table `imports` (id, societe_id, user_id, fichier_nom, statut, nb_objectifs_crees, nb_kr_crees, nb_taches_crees, nb_collaborateurs_crees, payload_json, created_at) pour traçabilité et rollback.

**Controller** : `ImportController` avec ces routes (dans `routes/web.php`, sous middleware `auth` + `InjecterSociete`) :
```
GET    /import                           → import.index    (page upload)
POST   /import/parse                     → import.parse    (parse Excel et renvoie preview JSON)
POST   /import/commit                    → import.commit   (insert en base après validation utilisateur)
GET    /import/historique                → import.historique (liste des imports passés)
DELETE /import/{import}                  → import.destroy  (rollback)
```

**Service dédié** : `app/Services/Import/ExcelImportService.php`
- Méthode `parse(UploadedFile $file): array` qui lit le fichier avec `phpoffice/phpspreadsheet` (déjà courant) ou `Maatwebsite/Laravel-Excel`
- Détection auto de la feuille (par défaut première, mais sélecteur si plusieurs)
- Détection auto de la ligne d'entête (cherche `ENTITE`, `THEME`, `PRIORITE`)
- Retourne un tableau structuré :
```php
[
  'meta' => ['fichier' => ..., 'feuille' => ..., 'ligne_entete' => 3, 'nb_lignes' => 44],
  'axes_detectes' => ['AGL GUINEE', 'CONAKRY TERMINAL', 'AGL GUINEE & CONAKRY TERMINAL'],
  'collaborateurs_detectes' => ['Vessou', 'DAF', 'DSI', 'Ibrahima KALIL TOURE', ...],
  'objectifs' => [
    [
      'titre' => 'MISE EN PLACE DU PAIEMENT ELECTRONIQUE',
      'axe_label' => 'CONAKRY TERMINAL',
      'progression' => 55,
      'resultats_cles' => [
        [
          'description' => 'Système de paiement électronique des encaissements...',
          'description_detaillee' => '...',
          'progression' => 100,
          'priorite' => 'P1',
          'departement' => 'DAF',
          'date_debut' => '2025-12-01',
          'date_cible' => '2026-02-28',
          'responsables_bruts' => 'DSI/DEX Intoch\nDAF\nIntoch\nDSI',
          'note_status' => '*Démarrage des travaux ...',
          'taches' => [
            ['titre' => 'Formations des équipes de facturation, comptabilité, services clients'],
            ['titre' => 'Etendre sur l\'ensemble des utilisateurs après le suivi des clients pilotes'],
          ],
        ],
        ...
      ],
    ],
    ...
  ],
]
```

**Normalisation/nettoyage automatique** (dans le service) :
- Trim + uppercase pour comparaison des entités, mais conserver la casse d'origine pour stockage
- Détecter et corriger automatiquement les coquilles évidentes : `CONAKY TERMINAL` → `CONAKRY TERMINAL`, `p1` → `P1`. Lister les corrections appliquées dans la réponse pour info utilisateur.
- Parsing des dates : essayer `Carbon::parse()`, sinon flag `date_invalide` avec valeur brute → afficher en rouge dans la preview pour correction manuelle.
- Parsing responsables : éclater sur `/`, `\n`, `,` → liste de tokens. Pour chaque token, tenter de matcher un `Collaborateur` existant (nom ou trigramme), sinon proposer création.
- Parsing puces colonne E : split sur regex `/(?:^|\n)\s*[\*\-•]\s+/` puis filtrer vides.
- Parsing colonne J : split sur regex `/\n(?=\d{1,2}\/\d{1,2}\s*:)/` → liste d'événements horodatés (à stocker comme `note_contexte` agrégée pour l'instant).
- Si `I` est entre 0 et 1, multiplier par 100. Si > 1 et ≤ 100, laisser. Sinon clamper.

**Détection hiérarchie** :
- Implémenter une fonction `estLigneMacro($row): bool` selon les règles ci-dessus (B rempli + C/D/E vides + I rempli, OU titre entièrement en majuscules > 15 caractères).
- Sinon, rattacher à la dernière macro-ligne rencontrée.

**Endpoint `/import/parse`** : retourne le JSON ci-dessus à React. Ne touche pas à la base.

**Endpoint `/import/commit`** :
- Reçoit le JSON validé/édité par l'utilisateur
- Démarre une transaction DB
- Pour chaque axe → `firstOrCreate` dans `axes_objectifs` (couleur auto-assignée par index)
- Pour chaque collaborateur → `firstOrCreate` (avec rôle par défaut `collaborateur`)
- Déduit les périodes nécessaires depuis les dates et utilise/crée les `periodes` correspondantes (T1 2026 = Jan-Mars, T2 = Avr-Juin, etc.)
- Crée les `objectifs`, `resultats_cles`, `taches` en cascade avec les bonnes FK
- Sync la table pivot `objectif_periode`
- Crée une entrée dans `imports` (si table créée) avec snapshot complet pour rollback
- Retour Inertia `redirect()->back()->with('success', '...')` (jamais `response()->json()`)

**Sécurité / validation** :
- `FormRequest` `StoreImportRequest` : `fichier` requis, mimes:xlsx,xls,csv, max 10Mo
- Vérifier `societe_id` du user (multi-tenant)
- Limiter à 500 lignes / 50 objectifs par import (paramètrable)

---

### 2. Frontend React (Inertia)

**Page principale** : `resources/js/Pages/Import/Index.jsx`

#### Étape 1 — Upload (state `step = 'upload'`)
- Composant central drag-and-drop (Tailwind `border-dashed border-2`) + bouton "Parcourir"
- Affiche `EmptyState` si pas de fichier sélectionné
- Bouton "Analyser le fichier" → `router.post(route('import.parse'), { fichier })` avec `forceFormData: true` et `preserveState: true`
- Une fois la réponse reçue (via `usePage().props.preview`), passer à step 2

#### Étape 2 — Mapping & Preview (state `step = 'mapping'`)
Layout en 2 colonnes principales :

**Colonne gauche (1/3) — Récapitulatif & paramètres globaux**
- Card "Société cible" : `<Select>` des sociétés existantes OU bouton "Créer une nouvelle société" (modal inline : nom, code, devise, layout_mode)
- Card "Axes détectés" : liste des axes/entités trouvés avec checkbox import + couleur pickable + bouton "fusionner" si doublon
- Card "Collaborateurs détectés" : liste avec statut (✅ trouvé en base / 🆕 à créer) + email auto-généré + rôle par défaut éditable
- Card "Corrections automatiques" : alerte ambre listant les normalisations appliquées (coquilles, dates, %)
- Bouton "Valider et importer" en bas (gros, bleu `primary-500`)

**Colonne droite (2/3) — Arborescence éditable**
- Vue hiérarchique style accordéon (réutiliser le composant `ObjectifCard` existant en mode édition)
- Pour chaque **Objectif** :
  - Header : icône expand + titre éditable inline + badge axe (éditable via dropdown) + badge priorité + % global
  - Checkbox "Importer cet objectif" (permet d'exclure des lignes)
  - Sous-section **Résultats Clés** : tableau éditable
    | ✓ | KR | Priorité | Département | Responsables | Date début | Date cible | Progression | Tâches |
    - Chaque cellule éditable inline (click to edit)
    - Cellule "Tâches" : compteur cliquable qui déplie un sous-tableau de tâches éditable
    - Cellule responsable : multi-select de chips colorés (`Vessou`, `DAF`...)
    - Bouton 🗑️ par ligne pour exclure ce KR
  - Bouton "+ Ajouter un KR manuellement"
- Boutons globaux en bas de chaque objectif : "Expandre tous les KR" / "Collapser tous"

**Validation visuelle** :
- Dates invalides en rouge avec icône ⚠️ et placeholder "Cliquer pour corriger"
- Lignes dont l'axe n'est pas mappé en jaune
- Lignes avec responsable inconnu en bleu (= "sera créé")

**Sauvegarde brouillon** :
- Bouton "Sauvegarder le brouillon" qui persiste le JSON édité dans `localStorage` (clé : `import_draft_<user_id>_<file_hash>`)
- Au chargement, proposer de reprendre un brouillon existant

#### Étape 3 — Confirmation (state `step = 'confirm'`)
- Modal de confirmation avec résumé : "Vous êtes sur le point de créer X objectifs, Y résultats clés, Z tâches, W collaborateurs dans la société «...»"
- Bouton "Confirmer l'import" → `router.post(route('import.commit'), payload, { preserveState: false })`
- Affichage de progression (barre animée) pendant l'insertion

#### Étape 4 — Succès (state `step = 'done'`)
- Card verte avec checklist :
  - ✅ N objectifs créés
  - ✅ M KRs créés
  - ✅ K tâches créées
  - ✅ J collaborateurs créés
- Boutons : "Voir les OKR" (redirige `/okr`) / "Importer un autre fichier" (reset état) / "Annuler cet import" (DELETE → rollback)

#### Composants à créer
- `Pages/Import/Index.jsx` (page principale avec switch sur `step`)
- `Pages/Import/Components/UploadStep.jsx`
- `Pages/Import/Components/MappingStep.jsx`
- `Pages/Import/Components/ObjectifEditableCard.jsx` (réutilise look de `ObjectifCard` existant mais en mode édition complète)
- `Pages/Import/Components/CollaborateurMappingList.jsx`
- `Pages/Import/Components/AxeMappingList.jsx`
- `Pages/Import/Components/ConfirmModal.jsx`
- `Pages/Import/Components/SuccessSummary.jsx`
- `Pages/Import/Historique.jsx` (page secondaire listant les imports passés avec bouton rollback)

#### Navigation
- Ajouter dans `TopbarNav` une nouvelle pill "Import" (couleur emerald-500) → `route('import.index')`
- Ajouter dans `Sidebar` sous une nouvelle section "ADMINISTRATION" un lien "Import de données" (icône `Upload` de `lucide-react`)
- Ajouter sous-lien "Historique des imports" → `route('import.historique')`

---

### 3. Règles UX/Design (à respecter strictement)

- **Style** : tracker professionnel — `rounded-xl`, `border-gray-200`, `shadow-sm`, padding `p-5`, `text-[13px]` body, labels `text-[10px] uppercase tracking-wider`
- **Couleurs** : primaire `primary-500` bleu pour CTA, ambre `#FEAC00` pour alertes, états de validation (vert/jaune/rouge) avec couleurs Tailwind standards
- **Dark mode** : tous les composants doivent supporter `dark:` (classes Tailwind)
- **Formatage nombres** : `<NumberInput>` pour les % et nombres, jamais `<input type="number">`. Affichage avec `formatNumber()`.
- **Langue** : 100% en français — aucun mot anglais visible (utiliser "Importer", "Téléverser", "Aperçu", "Valider", "Annuler", "Brouillon", etc.)
- **Modals** : utiliser `router.post` (jamais `useForm.post`) avec `preserveState: true` et `onError` pour garder le modal ouvert si erreur
- **Animations** : utiliser `framer-motion` pour les transitions entre les 4 étapes (slide left/right)
- **Accessibilité** : focus rings, aria-labels, navigation clavier (Tab/Enter)

---

### 4. Tests & vérifications attendues

À la fin du développement, je veux pouvoir :
1. Téléverser le fichier `PLAN_D_ACTION_DGP_-_DAF_2026.xlsx`
2. Voir une preview détectant 7 objectifs macro + ~33 KRs + ~60-80 tâches + ~15 collaborateurs uniques
3. Pouvoir éditer un titre de KR inline et voir la mise à jour persister dans le state
4. Pouvoir décocher un objectif et le voir disparaître du payload final
5. Valider l'import et voir les données apparaître dans `/okr` avec la hiérarchie correcte
6. Voir les bons axes dans `/parametres/okr` (onglet Axes)
7. Voir les collaborateurs nouvellement créés dans `/collaborateurs`
8. Pouvoir annuler l'import depuis `/import/historique` (rollback complet)

---

### 5. Livrables attendus

1. **Migrations** : `2026_05_18_xxxxxx_create_imports_table.php` (optionnel mais recommandé)
2. **Modèles** : `app/Models/Import.php` (si table créée) avec trait `BelongsToSociete`
3. **Service** : `app/Services/Import/ExcelImportService.php` + classes Parser (`ExcelStructureDetector`, `ResponsableParser`, `DateNormalizer`, `HierarchyDetector`)
4. **Controller** : `app/Http/Controllers/ImportController.php`
5. **FormRequest** : `app/Http/Requests/StoreImportRequest.php`
6. **Routes** : ajout dans `routes/web.php` du groupe `Route::prefix('import')->group(...)`
7. **Pages React** : `Pages/Import/Index.jsx` + composants enfants listés ci-dessus
8. **Navigation** : mise à jour `TopbarNav.jsx` et `Sidebar.jsx`
9. **Seeder de démo** : `database/seeders/ImportDemoSeeder.php` (optionnel, pour faciliter les tests)
10. **README** : section ajoutée au `DEVBOOK.md` documentant cette nouvelle phase (Phase 5a : Module d'import)

---

## 🚨 Contraintes à respecter absolument

- ❌ **Ne JAMAIS** utiliser `response()->json()` — toujours `Inertia::render()` ou `redirect()->back()`
- ❌ **Ne JAMAIS** utiliser `useForm` pour les modals — toujours `router.post` avec `preserveState: true`
- ❌ **Ne JAMAIS** mettre de texte en anglais dans l'UI
- ❌ **Ne JAMAIS** hardcoder un `societe_id` — toujours passer par le contexte multi-tenant
- ✅ **TOUJOURS** utiliser le trait `BelongsToSociete` sur les nouveaux modèles
- ✅ **TOUJOURS** valider côté serveur (FormRequest) ET côté client (validation inline avec messages d'erreur)
- ✅ **TOUJOURS** utiliser `<NumberInput>` pour les champs numériques
- ✅ **TOUJOURS** rester dans la stack existante (pas de nouvelle lib sans justification)
- ✅ **TOUJOURS** suivre le design system v6 (couleurs, espacements, typographie)

---

## 🎬 Pour démarrer

1. Lis attentivement le `DEVBOOK.md` du projet pour t'imprégner du contexte et des conventions
2. Inspecte la structure de `Pages/OKR/Index.jsx` et `Pages/Collaborateurs/Index.jsx` pour calquer le style
3. Vérifie que `phpoffice/phpspreadsheet` est dispo dans `composer.json`, sinon ajoute-le (`composer require phpoffice/phpspreadsheet`)
4. Crée d'abord le squelette backend (migration + modèle + controller + route + service vide qui retourne un mock) pour pouvoir avancer en parallèle sur le frontend
5. Branche le frontend sur le mock, valide le flow UX étape par étape
6. Implémente le parsing réel dans le service, en commençant par la détection de hiérarchie (la partie la plus délicate)
7. Implémente le commit transactionnel en dernier, avec tests manuels sur le fichier réel
8. Mets à jour le `DEVBOOK.md` avec une section "Phase 5a : Module d'import Excel"

Pose-moi des questions si tu as besoin de précisions sur un point. Sinon, propose-moi un plan d'attaque structuré en étapes avant de coder, pour validation.
