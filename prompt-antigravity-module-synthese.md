# 🎯 PROMPT ANTIGRAVITY — Module Synthèse Mensuelle (Addvalis OKR)

> Copie/colle ce prompt **intégralement** dans Antigravity. Il contient toutes les contraintes (stack, conventions, modèle de données, UI cible, livrables) pour générer le module Synthèse de bout en bout sans aller-retour.

---

## 🧠 CONTEXTE DU PROJET

Tu travailles sur **Addvalis OKR Performance**, plateforme SaaS multi-tenant de pilotage OKR pour PME africaines.

**Stack imposée** (NE PAS DÉVIER) :
- Backend : **Laravel 13** + Inertia.js (server-side, jamais `response()->json()`, toujours `Inertia::render()` ou `redirect()->back()`)
- Frontend : **React 18** + **Inertia** + **Tailwind v3** + **shadcn/ui** (Radix) + **Framer Motion**
- DB : **MySQL**, nommage **snake_case**, code métier en **français** (`Collaborateur`, `Objectif`, `ResultatCle`, `Synthese`…)
- Multi-tenant via trait `BelongsToSociete` (filtre auto sur `societe_id`)
- Module gating via middleware `module:synthese` (HTTP 403 si désactivé) + composant `<RequireModule code="synthese">` côté front
- Langue UI : **100 % français** (aucun texte anglais visible)
- Nombres : `<NumberInput>` pour la saisie, `formatNumber()` pour l'affichage, `formatCurrency(value, devise)` pour les montants (devise dynamique depuis `auth.societe.devise`)
- Composants UI dans `resources/js/Components/ui/` (Button, Input, NumberInput, Select, Badge, Card, Dialog, Table, Tabs, Progress, Avatar, DropdownMenu, Tooltip, Separator)

---

## 🎯 OBJECTIF DU MODULE SYNTHÈSE

Le module **Synthèse** est la **vue de pilotage mensuel des primes** par collaborateur. Il agrège :

1. Les **objectifs individuels** du mois (table `objectifs` filtrée par `mois` et `type = individuel`)
2. Le **score global** = moyenne des progressions des KRs de tous les objectifs individuels du collaborateur sur ce mois
3. La **prime mensuelle** (montant max, seuil, validation manager, commentaire) — table `validations_objectifs` ou nouvelle table `primes_mensuelles`
4. L'activité **prospection** du mois (total prospects, deals signés via `prospects.status = 'won'`)
5. Une **table de synthèse** (`syntheses`) qui matérialise le résultat consolidé pour traçabilité historique / reporting

C'est la page qu'un manager ouvre **fin de mois** pour décider à qui verser la prime et combien.

---

## 📐 MODÈLE DE DONNÉES

### Tables existantes à exploiter
- `collaborateurs` : id, societe_id, nom, prenom, poste, role, couleur, initiales, prime_par_defaut, seuil_prime
- `objectifs` : id, societe_id, titre, axe_id, mois (date), type_id (individuel), responsable_id, prime, note_contexte, statut_id
- `resultats_cles` : id, objectif_id, description, progression (0-100), poids, valeur_cible, unité
- `prospects` : id, societe_id, collaborateur_id, status (contact/rdv/demo/prop/won/lost), mois
- `validations_objectifs` : id, objectif_id, montant_prime, valide_par, commentaire, valide_le
- `seuils_performance` : seuils de couleur (Critique/Faible/Moyen/Bon/Excellent)
- `devises` : devise active via `societes.devise_id`

### Table à créer : `primes_mensuelles`
Stocke la **décision managériale mensuelle** par collaborateur (1 ligne = 1 collab × 1 mois).

```php
// Migration : database/migrations/2026_05_22_000001_create_primes_mensuelles_table.php
Schema::create('primes_mensuelles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('societe_id')->constrained('societes')->cascadeOnDelete();
    $table->foreignId('collaborateur_id')->constrained('collaborateurs')->cascadeOnDelete();
    $table->date('mois'); // 1er du mois (ex: 2026-05-01)
    $table->decimal('montant_max', 12, 2)->default(0);
    $table->unsignedTinyInteger('seuil_pourcentage')->default(80); // 50-100
    $table->decimal('score_global', 5, 2)->nullable(); // figé à la validation
    $table->decimal('montant_accorde', 12, 2)->nullable();
    $table->boolean('validee')->default(false);
    $table->text('commentaire_manager')->nullable();
    $table->foreignId('validee_par_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('validee_le')->nullable();
    $table->timestamps();

    $table->unique(['societe_id', 'collaborateur_id', 'mois']);
    $table->index(['societe_id', 'mois']);
});
```

### Table à enrichir : `syntheses`
La table existe déjà (placeholder). À structurer comme **snapshot consolidé** archivé d'un mois donné (génération manuelle ou auto à la clôture du mois) :

```php
Schema::create('syntheses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('societe_id')->constrained()->cascadeOnDelete();
    $table->date('mois');
    $table->json('payload'); // snapshot : tous les scores, primes, prospection
    $table->decimal('budget_primes_total', 14, 2)->default(0);
    $table->unsignedInteger('nb_primes_accordees')->default(0);
    $table->unsignedInteger('nb_collaborateurs')->default(0);
    $table->foreignId('genere_par_user_id')->nullable()->constrained('users');
    $table->timestamps();
    $table->unique(['societe_id', 'mois']);
});
```

---

## 🗺️ ROUTES À CRÉER (`routes/web.php`)

Toutes sous le groupe `auth + module:synthese` :

```php
Route::middleware(['auth', 'verified', 'module:synthese'])->prefix('synthese')->name('synthese.')->group(function () {
    Route::get('/', [SyntheseController::class, 'index'])->name('index');               // page principale
    Route::get('/{mois}/export', [SyntheseController::class, 'export'])->name('export'); // CSV
    Route::post('/{mois}/cloturer', [SyntheseController::class, 'cloturer'])->name('cloturer'); // snapshot syntheses
    Route::get('/historique', [SyntheseController::class, 'historique'])->name('historique');
    
    // Primes mensuelles
    Route::put('/primes/{collaborateur}/{mois}', [PrimeMensuelleController::class, 'update'])->name('primes.update');
    Route::post('/primes/{collaborateur}/{mois}/valider', [PrimeMensuelleController::class, 'valider'])->name('primes.valider');
});
```

Format du paramètre `{mois}` : **`YYYY-MM`** (ex : `2026-05`).

---

## 🧮 LOGIQUE MÉTIER (Controller + Service)

Crée un service dédié `app/Services/SyntheseService.php` :

### `calculerScoreGlobalCollaborateur(int $collaborateurId, string $mois): float`
- Récupère les objectifs `type = individuel` du collaborateur sur le mois (premier jour : `Y-m-01`)
- Pour chaque objectif, calcule la moyenne des `progression` de ses KRs (ou pondérée selon `configurations_okr.mode_calcul`)
- Retourne la **moyenne arrondie** des scores des objectifs, ou 0 si aucun objectif

### `getDonneesCollaborateur(Collaborateur $c, string $mois): array`
Retourne :
```php
[
    'collaborateur' => $c->only(['id','nom','prenom','poste','couleur','initiales']),
    'score_global' => float,         // 0-100
    'nb_objectifs' => int,
    'objectifs' => Collection,        // avec score calculé + axe (avec couleur)
    'prime' => PrimeMensuelle|null,   // ligne primes_mensuelles si existe
    'prime_acquise' => bool,          // score >= seuil
    'prospection' => [
        'total' => int,
        'signes' => int,              // status = won
    ],
]
```

### `genererSnapshot(string $mois): Synthese`
- Itère sur tous les `collaborateurs` actifs
- Construit le `payload` JSON complet
- Calcule `budget_primes_total` (somme des `montant_accorde` validés)
- Upsert dans `syntheses` (un snapshot par mois)

---

## 🎨 PAGE REACT — `resources/js/Pages/Synthese/Index.jsx`

### Structure générale (inspirée maquette HTML lignes 957-969 et lignes 2740-2786)

```
┌──────────────────────────────────────────────────────────────────┐
│ 📊 Synthèse mensuelle — Primes        [Mois ▼] [📤 Export CSV]  │
│                                       [🔒 Clôturer le mois]     │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────┐│
│  │ Synth-card #1      │  │ Synth-card #2      │  │ #3          ││
│  │ ┌──┐ Nom          │  │ ┌──┐ Nom          │  │ ...         ││
│  │ │AV│ Poste        │  │ │AV│              │  │             ││
│  │ └──┘              │  │ └──┘              │  │             ││
│  │                    │  │                    │  │             ││
│  │     87%            │  │     45%            │  │             ││
│  │ 3 obj · 2 deal(s)  │  │ 1 obj · 0 deal     │  │             ││
│  │                    │  │                    │  │             ││
│  │ • Biz  Titre  92%  │  │ • Pros Titre  45%  │  │             ││
│  │ • Del  Titre  85%  │  │                    │  │             ││
│  │ • Lead Titre  82%  │  │                    │  │             ││
│  │                    │  │                    │  │             ││
│  │ ┌──────────────┐   │  │ ┌──────────────┐   │  │             ││
│  │ │🎁 Prime acq. │   │  │ │⚠️ Non acquise│   │  │             ││
│  │ │ 400 000 GNF  │   │  │ │ 500 000 GNF  │   │  │             ││
│  │ │ Score 87%≥80%│   │  │ │ Score 45%<80%│   │  │             ││
│  │ │ ✓ Validé     │   │  │ │ [✏️ Modifier] │   │  │             ││
│  │ │ "Bon travail"│   │  │ └──────────────┘   │  │             ││
│  │ └──────────────┘   │  │                    │  │             ││
│  └────────────────────┘  └────────────────────┘  └─────────────┘│
├──────────────────────────────────────────────────────────────────┤
│ 📈 Prospection globale équipe                                    │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                    │
│ │ 🟢 Mariam  │ │ 🟠 Ibrahim │ │ 🔵 Aïssatou│                    │
│ │ 12 prosp. ·│ │ 8 prosp. · │ │ 4 prosp. · │                    │
│ │ 2 signés   │ │ 1 signé    │ │ 0 signé    │                    │
│ └────────────┘ └────────────┘ └────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

### Détails visuels (à respecter strictement)

**Cartes collaborateur** (`synth-card`) :
- `bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl overflow-hidden shadow-sm`
- Header : avatar rond 36px (couleur collab) + initiales + nom (text-[13px] font-bold) + poste tronqué (text-[11px] text-gray-500)
- Score central : `text-3xl font-extrabold text-center py-3`, **couleur dynamique** selon seuils de `seuils_performance` (fallback : ≥80% vert `#22c55e`, ≥50% ambre `#f59e0b`, sinon rouge `#ef4444`)
- Sous-score : `text-[11px] text-gray-500` — "N objectifs · M deal(s) signé(s)"
- Top 3 objectifs : badge axe (couleur) + titre tronqué + % aligné droite (couleur seuils)
- Si `objs.length > 3` : ligne "+N autres objectifs" en gris

**Bloc Prime** (`prime-box`) :
- Si **prime acquise** (score >= seuil) : `bg-green-50 border border-green-300 dark:bg-green-950/30`
- Si **non acquise** : `bg-amber-50 border border-amber-300 dark:bg-amber-950/30`
- Affiche : label statut + montant en gros (`text-xl font-extrabold`) + comparaison "Score X% ≥/< seuil Y%"
- Si validée : pastille "✓ Validé manager" verte
- Commentaire manager affiché en italique gris si présent
- Bouton `[✏️ Modifier]` ouvre le modal `PrimeMensuelleDialog`

**Sélecteur de mois** :
- Liste les 12 derniers mois + mois en cours
- Format affiché : "Mai 2026", value : "2026-05"
- Sur changement → `router.get(route('synthese.index'), { mois: value }, { preserveState: false })`

**Bouton "Clôturer le mois"** :
- Visible uniquement pour `role = admin` ou `manager`
- Confirmation via `AlertDialog` shadcn
- `router.post(route('synthese.cloturer', mois))` — crée/met à jour le snapshot `syntheses`
- Toast "📊 Mois clôturé · Snapshot créé"

**Section Prospection globale** :
- Carte large (`Card` + `CardHeader` "📈 Prospection globale équipe")
- Grille `grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2`
- Mini cards : avatar 30px + prénom + "X prospects · Y signé(s)"
- Filtrer uniquement les collaborateurs avec `peut_prospecter = true` (champ existant ou à ajouter sur `collaborateurs`)

### Modal `PrimeMensuelleDialog.jsx`
Composant local dans `Synthese/Index.jsx` (pas de fichier séparé — convention modal inline).
- `Dialog` shadcn, max-width `480px`
- Champs :
  - **Prime max** (`NumberInput` avec suffix devise active)
  - **Seuil d'atteinte** (`NumberInput` 50-100, suffix `%`)
  - **Commentaire manager** (`Textarea` 3 rows)
  - **Checkbox** "Prime validée et accordée" (`Checkbox` shadcn)
- Submit : `router.put(route('synthese.primes.update', [collabId, mois]), data, { preserveState: true, onSuccess: closeModal })`
- Si checkbox cochée à la soumission → backend remplit `validee_par_user_id`, `validee_le`, `score_global` (figé), `montant_accorde` (= `montant_max` si prime acquise, 0 sinon)

---

## 📊 EXPORT CSV (`SyntheseController::export`)

Génère un CSV téléchargeable :

```
Collaborateur;Poste;Score Global;Nb Objectifs;Prime Max;Seuil;Prime Acquise;Validée Manager;Commentaire;Prospects;Signés
"Mariam Diallo";"Responsable BIZ";87%;3;400 000 GNF;80%;Oui;Oui;"Bon travail";12;2
...
```

- Séparateur : `;` (compatibilité Excel FR)
- Encodage : `UTF-8 with BOM` (pour Excel : `chr(0xEF).chr(0xBB).chr(0xBF)`)
- Format devise via `formatCurrency()` côté PHP (helper à créer si absent) avec la devise active
- Nom du fichier : `synthese-{societe_slug}-{YYYY-MM}.csv`
- Réponse : `response()->streamDownload(fn() => echo $csv, $filename)`

---

## 🧪 SEEDER

Crée `database/seeders/PrimeMensuelleSeeder.php` :
- Pour chaque collaborateur du seeder existant, génère 3 mois de primes (mois en cours + 2 précédents)
- Mix : 60% validées, 40% non validées
- `montant_max` aléatoire entre 200 000 et 800 000 dans la devise par défaut
- Ajouter au `DatabaseSeeder` après `OKRSeeder`

---

## 🧭 NAVIGATION

### TopbarNav (`resources/js/Components/TopbarNav.jsx`)
La pill "Synthèse" existe déjà (11e onglet selon devbook). Vérifier qu'elle pointe vers `route('synthese.index')` et qu'elle est filtrée par `moduleCode: 'synthese'`.

### Sidebar (`resources/js/Components/Sidebar.jsx`)
Ajouter sous le groupe **MANAGEMENT** :
```jsx
{ label: 'Synthèse', icon: BarChart3, route: 'synthese.index', moduleCode: 'synthese' }
```

### Module catalogue
Le module `synthese` doit exister dans `ModuleSeeder` (ou être ajouté) :
```php
['code' => 'synthese', 'nom' => 'Synthèse', 'icone' => 'BarChart3', 'couleur' => 'violet', 'categorie' => 'management', 'est_core' => false, 'est_premium' => false, 'ordre' => 8]
```

---

## ✅ DÉFINITION DE "DONE"

Le module est considéré terminé quand **TOUS** ces critères sont validés :

1. [ ] Migrations `primes_mensuelles` + `syntheses` créées, `php artisan migrate` passe
2. [ ] Modèles `PrimeMensuelle` et `Synthese` avec trait `BelongsToSociete` et relations Eloquent (`collaborateur()`, `valideePar()`, etc.)
3. [ ] `SyntheseController` (`index`, `export`, `cloturer`, `historique`) + `PrimeMensuelleController` (`update`, `valider`)
4. [ ] Service `SyntheseService` avec les 3 méthodes décrites
5. [ ] FormRequest `UpdatePrimeMensuelleRequest` (validation : `montant_max` numeric min:0, `seuil_pourcentage` integer between:50,100, etc.)
6. [ ] Routes ajoutées dans `routes/web.php` sous `module:synthese`
7. [ ] Page `Synthese/Index.jsx` complète avec : sélecteur mois, grille cartes, prospection globale, modal édition prime, bouton clôture (admin/manager)
8. [ ] Page `Synthese/Historique.jsx` listant les snapshots `syntheses` avec lien "Voir détail" (charge le `payload` JSON)
9. [ ] Module `synthese` ajouté à `ModuleSeeder`
10. [ ] Pill TopbarNav + entrée Sidebar fonctionnelles, filtrées par module actif
11. [ ] Export CSV fonctionnel avec BOM UTF-8 et séparateur `;`
12. [ ] Devise dynamique partout (`formatCurrency` côté front, helper PHP côté backend)
13. [ ] Mode sombre supporté (toutes les classes `dark:*` présentes)
14. [ ] Toute l'UI en français
15. [ ] Aucun `console.log`, aucun `dd()`, aucun TODO en commentaire
16. [ ] `npm run build` passe sans warning bloquant
17. [ ] Toast de confirmation après chaque action (`✏️ Prime mise à jour`, `📊 Mois clôturé`, `📤 CSV téléchargé`)

---

## ⚠️ PIÈGES À ÉVITER (lus dans le DEVBOOK)

1. **Ne JAMAIS utiliser `response()->json()`** depuis un controller Inertia — toujours `redirect()->back()->with('success', '...')` ou `Inertia::render()`
2. Pour le modal édition prime, utiliser **`router.put`** (pas `useForm`) avec `preserveState: true` et `onError` pour garder le modal ouvert en cas d'erreur de validation
3. Le format des nombres : `<NumberInput suffix="GNF">` côté saisie, `formatCurrency(value, deviseActive)` côté affichage — **jamais** `.toLocaleString()` brut
4. Récupérer la devise via `usePage().props.auth.societe.devise` (partagée par `HandleInertiaRequests`)
5. Le `mois` est stocké en `DATE` (toujours `YYYY-MM-01`) — convertir l'input `"2026-05"` en `"2026-05-01"` côté backend
6. `BelongsToSociete` filtre automatiquement les requêtes — **ne pas** refiltrer manuellement par `societe_id` dans les controllers
7. Pour le tri des collaborateurs dans les cartes : par `ordre` puis `nom` (ne pas se baser sur l'ID)
8. Mode sombre : utiliser systématiquement `dark:bg-dark-900`, `dark:border-dark-800`, `dark:text-gray-100` (pas `dark:bg-gray-900` qui n'existe pas dans la config Tailwind custom)

---

## 📦 LIVRABLES ATTENDUS

Génère **dans cet ordre** :

1. Migration `primes_mensuelles`
2. Migration enrichissement `syntheses`
3. Modèle `PrimeMensuelle`
4. Modèle `Synthese`
5. `SyntheseService`
6. `UpdatePrimeMensuelleRequest`
7. `PrimeMensuelleController`
8. `SyntheseController`
9. Routes
10. `ModuleSeeder` (ajout du module synthese si absent)
11. `PrimeMensuelleSeeder` + ajout au `DatabaseSeeder`
12. Page `Synthese/Index.jsx` (avec modal inline `PrimeMensuelleDialog`)
13. Page `Synthese/Historique.jsx`
14. Mises à jour `TopbarNav.jsx` et `Sidebar.jsx`
15. Helper PHP `formatCurrency()` dans `app/Support/Format.php` (si absent)

Après chaque fichier, **affiche le chemin complet** et **explique brièvement les choix techniques non triviaux** (ex : pourquoi `unique(societe_id, collaborateur_id, mois)`, pourquoi snapshot JSON, etc.).

À la fin, fournis :
- La liste des commandes à exécuter (`php artisan migrate`, `php artisan db:seed --class=PrimeMensuelleSeeder`, `npm run build`)
- Un mini-guide de test manuel en 5 étapes (créer un objectif individuel → renseigner KRs progression → ouvrir /synthese → éditer la prime → exporter le CSV)

---

## 🚀 GO

Commence par afficher un **plan d'exécution** numéroté (1 ligne par fichier), puis attends ma confirmation. Une fois validé, génère les fichiers un par un avec leur chemin complet en en-tête.
