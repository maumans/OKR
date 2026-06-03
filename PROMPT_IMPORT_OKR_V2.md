# PROMPT — Adapter le module d'import au nouveau modèle de fichier OKR (v2)

## Contexte du projet

Plateforme **Addvalis OKR Performance**. Stack : **Laravel 13 + Inertia.js + React 18 + Tailwind + MySQL**, multi-tenant (`societe_id` partout via trait `BelongsToSociete`). Code métier et BDD nommés en **français**. Réponses Inertia uniquement (`redirect()->back()` / `Inertia::render()`, jamais `response()->json()`).

Un module d'import Excel existe déjà (Phase 5a) et **fonctionne sur le plan infra** :
- Table `imports` (payload JSON + IDs créés pour rollback), modèle `Import`.
- `App\Services\ExcelImportService` (parsing via `phpoffice/phpspreadsheet`).
- `ImportController` : routes `index, parse, commit, historique, destroy/rollback`.
- `StoreImportRequest` (mimes xlsx/xls/csv, max 10 Mo).
- Commit **transactionnel** en cascade : Axes → Collaborateurs → Objectifs → KR → Tâches (+ sync pivot `objectif_periode`). Rollback inverse via IDs stockés.
- Front : `Import/Index.jsx` (flux 4 étapes Upload → Mapping → Confirmation → Succès), `Import/Historique.jsx`, brouillon localStorage.

**⚠️ Le problème** : `ExcelImportService` a été écrit pour un ANCIEN format (mono-feuille, hiérarchie devinée par indentation/puces, colonnes `ENTITE/THEME/PRIORITE`, normalisation villes `CONAKY→CONAKRY`, puces `* - •`, progression `0-1`). Le **nouveau fichier a une structure totalement différente** (multi-feuilles relationnelles avec clés `O#`/`KR#`). Il faut un **parseur v2**, sans casser l'ossature controller/commit/rollback ni le multi-tenant.

---

## Objectif

Réécrire la couche de **parsing** de `ExcelImportService` pour consommer le nouveau classeur `Addvalis_OKR_Complet_Q3_2026.xlsx`, en produisant la même structure de données intermédiaire que celle attendue par le commit existant (ou en l'adaptant proprement). Conserver : commit transactionnel, rollback, traçabilité `imports`, flux front 4 étapes, multi-tenant.

**Exigence de robustesse** : détecter automatiquement le format (v1 ancien vs v2 nouveau) et router vers le bon parseur, OU prévenir clairement l'utilisateur si le format n'est pas reconnu. Ne pas supprimer le parseur v1 (garder la rétro-compat) — créer un `parseV2()` séparé.

---

## Structure EXACTE du nouveau fichier (6 feuilles)

### Feuille `OKR MASTER` (cœur — objectifs + KR)
Ligne d'entête : `AXE · O# · KR# · ÉNONCÉ · OWNER · TYPE KR · CIBLE · UNITÉ · POIDS · DESCRIPTION DÉTAILLÉE · PRIME / CONDITIONS`

- **Ligne OBJECTIF** = `TYPE KR == "OBJECTIF"` **ET** `KR#` vide. Ex : `AXE=1, O#=O1, KR#=(vide), ÉNONCÉ="FAIRE DE LA PRACTICE...", OWNER="Gando Diallo", TYPE KR=OBJECTIF, CIBLE=750 000 000, UNITÉ=GNF, POIDS=—`.
- **Ligne KR** = `KR#` rempli (`KR1`, `KR2`… ou composés `KR1a`, `KR1b`, `KR2d`…). Ex : `AXE=(vide), O#=O1, KR#=KR1, TYPE KR=Nombre, CIBLE=2, UNITÉ=clients, POIDS=0,35`.
- ⚠️ Les colonnes `AXE` et `O#` sont **fusionnées** : présentes uniquement sur la ligne objectif. → **Propager (forward-fill)** la dernière valeur `AXE`/`O#` vue sur les lignes KR qui suivent.
- `TYPE KR` (valeurs KR) ∈ `{Nombre, Pourcentage, Score, Montant, Binaire}` → mapper vers `types_resultats_cles` (quantitatif, pourcentage, financier, booléen).
- `POIDS` au format français : `0,35` → `0.35`. `—` = pas de poids (objectif).
- `CIBLE` peut contenir des espaces/NBSP : `750 000 000` → `750000000`. Binaire : `1` (unité `—`). Score : `8` (unité `/10`). %: `90` ou `100` (unité `%`).
- `DESCRIPTION DÉTAILLÉE` de la ligne objectif contient des méta : `Owner : … · Période : Q3 2026 · Axe : … · Type : …`. **Extraire la/les période(s)** : `Période : Q3 2026` → 1 période ; `Période : Q3–Q4 2026` (O5) → **2 périodes** (Q3 2026 + Q4 2026) à synchroniser via pivot `objectif_periode`.
- `DESCRIPTION DÉTAILLÉE` de la ligne KR → champ `resultats_cles.description_detaillee`.
- `PRIME / CONDITIONS` (ligne objectif) → texte conditions ; **le montant de prime canonique vient de la feuille PRIMES & CONDITIONS** (voir guide), pas de cette prose.

### Feuille `TÂCHES DÉTAILLÉES`
Entête : `O# · KR# · TYPE · TITRE TÂCHE · OWNER · FRÉQUENCE · PRIORITÉ · DESCRIPTION & CONTEXTE + MODE OPÉRATOIRE · OUTILS & RESSOURCES · DÉFINITION DE DONE`

- `O#` + `KR#` = clés de jointure → résoudre `objectif_id` (via O#) et `resultat_cle_id` (via KR#).
  - `KR# == "—"` → tâche rattachée à l'objectif uniquement (`resultat_cle_id = null`).
  - `KR#` composé `"KR1a/b/c"` ou `"KR2a/b/c/d"` → la tâche couvre plusieurs KR. **Décision recommandée** : rattacher à l'objectif (`resultat_cle_id = null`) et conserver la liste des KR couverts dans un champ note/méta, OU rattacher au 1er KR. Documenter le choix.
- `TYPE` ∈ `{SOCLE, PROSPECTION, COMMERCIAL, UPSELL, PIPELINE, GOUVERNANCE, DELIVERY, MPS, MODELE ECO, PITCH DECK, PROGRAMME, MODULE, SÉLECTION, BAILLEUR}` → **nouvelle colonne** `taches.categorie` (voir migrations).
- `PRIORITÉ` contient un emoji : `🔴 Haute`, `🟡 Moyenne`, `🟢 Basse` → **strip emoji** → `Haute|Moyenne|Basse`.
- `FRÉQUENCE` : texte libre (`"Mardi + Jeudi 10h–11h"`, `"One-shot avant 10 juillet"`, `"Chaque vendredi 16h–17h"`, `"1 fois/mois"`) → **nouvelle colonne** `taches.frequence`. Optionnel : extraire une `date` d'échéance si un pattern « avant le JJ mois » est présent.
- `DESCRIPTION & CONTEXTE + MODE OPÉRATOIRE` : **une seule cellule** combinant deux blocs séparés par le littéral `MODE OPÉRATOIRE :`.
  - Partie **avant** `MODE OPÉRATOIRE` → `taches.description`.
  - Partie **après** → `taches.mode_operatoire` (JSON array d'étapes). Découper sur les puces numérotées `1. 2. 3. …` ; conserver les sous-puces `•` à l'intérieur de l'étape parente.
- `OUTILS & RESSOURCES` : items séparés par `·` → `taches.outils` (texte, ou array selon convention existante).
- `DÉFINITION DE DONE` : prose, items souvent séparés par `·` → `taches.definition_done` (JSON array de critères).

### Feuille `AXES STRATÉGIQUES`
Entête : `AXE · NOM · AMBITION · OKR ACTIFS Q3 · NB OBJECTIFS · NB KR TOTAL`. 6 axes numérotés 1–6.
- Mapper `NOM` → `axes_objectifs.nom`. La jointure objectif↔axe se fait par **numéro** `AXE` (1..6). Attention : OKR MASTER référence les axes 1, 2 et 6 ; créer/matcher tous les axes présents.
- Ignorer la ligne `TOTAL Q3 2026`.

### Feuille `VISION & IDENTITÉ`
Section `ÉQUIPE ADDVALIS 2026` = liste autoritaire des collaborateurs : `Nom \t [CODE] Poste`.
- Codes : `[DIR]` (direction), `[CSL]` (conseil), `[TECH]` (technique). En déduire éventuellement le `rôle` (admin/manager/collaborateur).
- `DIR` dans les colonnes OWNER = **Thierno Diallo** (CEO). Construire une table de résolution.
- Servir à **créer/matcher les collaborateurs** plutôt que de les déduire des cellules OWNER.

### Feuille `PRIMES & CONDITIONS`
Entête : `OBJECTIF · OWNER · PRIME BASE · PRIME PERFORMANCE · CONDITION DÉCLENCHEMENT · CONDITION RÉDUCTION`.
- `PRIME BASE` (`3 000 000 GNF`) → `objectifs.prime` (parser le montant FR). Source canonique de la prime.
- Conserver `PRIME PERFORMANCE` / conditions dans `objectifs_remuneres` / `paliers_primes` si pertinent, sinon en note. Jointure sur le libellé objectif (`O1 — Intégration` → O1).
- O4 et O5 : pas de prime financière directe (transversale / stratégique).

### Feuille `GUIDE SAISIE PLATEFORME`
**C'est le contrat d'import** : chaque ligne mappe un champ plateforme à une colonne/feuille source. **Utiliser cette feuille comme spécification de référence** pour le mapping. (Le parseur peut même valider que les colonnes attendues existent.)

---

## Mapping cible (résumé) vers le schéma BDD

| Source (feuille → colonne) | Table.colonne |
|---|---|
| OKR MASTER ligne OBJECTIF · ÉNONCÉ | `objectifs.titre` |
| OKR MASTER · OWNER (objectif) | `objectifs` → `collaborateur` responsable |
| AXE (n°) → AXES STRAT. · NOM | `objectifs.axe` (FK `axes_objectifs`) |
| DESCRIPTION DÉTAILLÉE · `Période :` | `objectif_periode` (pivot, 1..N) |
| DESCRIPTION DÉTAILLÉE · `Type :` | `objectifs.type` (équipe/entreprise) |
| PRIMES & CONDITIONS · PRIME BASE | `objectifs.prime` |
| OKR MASTER ligne KR · ÉNONCÉ | `resultats_cles.description` |
| OKR MASTER · DESCRIPTION DÉTAILLÉE (KR) | `resultats_cles.description_detaillee` |
| OKR MASTER · TYPE KR | `resultats_cles.type` (FK `types_resultats_cles`) |
| OKR MASTER · CIBLE | `resultats_cles.valeur_cible` |
| OKR MASTER · UNITÉ | `resultats_cles.unite` |
| OKR MASTER · POIDS (FR `0,35`) | `resultats_cles.poids` |
| TÂCHES · TITRE TÂCHE | `taches.titre` |
| TÂCHES · O#/KR# | `taches.objectif_id` / `taches.resultat_cle_id` |
| TÂCHES · OWNER | `taches.collaborateur` |
| TÂCHES · PRIORITÉ (sans emoji) | `taches.priorite` |
| TÂCHES · desc avant `MODE OPÉRATOIRE` | `taches.description` |
| TÂCHES · texte après `MODE OPÉRATOIRE` | `taches.mode_operatoire` (JSON) |
| TÂCHES · OUTILS & RESSOURCES | `taches.outils` |
| TÂCHES · DÉFINITION DE DONE | `taches.definition_done` (JSON) |
| TÂCHES · FRÉQUENCE | `taches.frequence` **(NOUVELLE COLONNE)** |
| TÂCHES · TYPE | `taches.categorie` **(NOUVELLE COLONNE)** |
| VISION · ÉQUIPE | `collaborateurs` (création/matching) |

---

## Migrations à créer

1. `add_frequence_categorie_to_taches` :
   - `frequence` (string, nullable)
   - `categorie` (string, nullable) — valeurs libres (SOCLE, PROSPECTION, DELIVERY…).
2. Vérifier que `objectif_periode`, `resultats_cles.description_detaillee`, `taches.mode_operatoire/definition_done` (JSON) existent déjà (oui d'après DEVBOOK). Ne pas recréer.

---

## Règles de parsing transverses (helpers BE à écrire)

- **Nombres FR** : `parseFr("750 000 000")` → `750000000` ; gérer espace normal **et** insécable (`\u00A0`, `\u202F`), `,` décimal (`0,35`→`0.35`), `—`/`-`/vide → null.
- **Strip emoji priorité** : retirer `🔴🟡🟢` + trim.
- **Split owners multi-valeurs** : séparateurs `+`, `/`, `,`, `\n` (ex : `"DIR + Business Coach"`, `"Amadou Bailo + Maurice"`). 1er owner = responsable principal.
- **Résolution collaborateur** : matching insensible casse/accents ; alias (`DIR`→Thierno Diallo, `Amadou Bailo`↔`Amadou Bailo Diallo`). Créer si absent en se basant sur la feuille VISION.
- **Business Coach** : NE PAS créer comme collaborateur standard. Le marquer comme **profil Partenaire** (accès restreint O5). Si la gestion partenaire n'existe pas encore, le mettre de côté + signaler dans le rapport de mapping.
- **Forward-fill** `AXE` et `O#` sur les lignes KR.
- **Découpe mode opératoire** : regex sur `^\s*\d+\.` pour les étapes, sous-items `•` rattachés.
- **Découpe listes** : split sur `·` pour outils et définition de done.

---

## Cas limites à gérer explicitement

1. Objectif `O4` : OWNER ligne objectif = `DIR` (consolidation), mais ses KR ont des owners distincts (Gando/Amadou Bailo/Fanta). Le responsable du KR vient de la ligne KR.
2. KR composés `KR1a/KR1b/KR1c` (O4) : 10 KR sous un seul objectif. Bien tous les créer.
3. Tâche avec `KR# = "KR1a/b/c"` : rattachement multi-KR (voir décision recommandée plus haut).
4. `O5` multi-périodes (Q3 + Q4 2026) → 2 entrées pivot.
5. Lignes `TOTAL` / titres de feuille à ignorer.
6. CIBLE `—` / UNITÉ `—` sur lignes objectif → null.
7. Cellules vides dues aux fusions → forward-fill, pas erreur.
8. Idempotence : un ré-import ne doit pas dupliquer axes/collaborateurs déjà présents (matching avant création).

---

## Front (`Import/Index.jsx`) — ajustements

- L'étape **Mapping** doit afficher la nouvelle arborescence : Objectif → KR (avec type/cible/poids/unité) → Tâches (avec catégorie, fréquence, priorité). 
- Afficher les **corrections/normalisations** appliquées (priorité dé-émojisée, montants reformatés, owners résolus, Business Coach mis de côté) en bandeau ambre, comme l'existant.
- Afficher les périodes détectées par objectif (multi-période pour O5).
- Conserver le brouillon localStorage et le flux 4 étapes.

---

## Contraintes à NE PAS casser

- Multi-tenant : tout création passe par `societe_id` (trait `BelongsToSociete`).
- Commit **transactionnel** (DB::transaction) + **rollback** via IDs stockés dans `imports`.
- Réponses **Inertia** uniquement (pas de JSON).
- UI 100% **français**, nombres via `NumberInput`/`formatNumber`.
- Laravel 11+ : middleware via `HasMiddleware` (pas `$this->middleware()` en constructeur).
- Déploiement Hostinger/LiteSpeed : penser au WAF qui bloque les `.xlsx` (ZIP) → garder le diagnostic CSV, `public/.user.ini`, désactivation ModSecurity sur `/import/parse`.

---

## Critères d'acceptation

1. L'import de `Addvalis_OKR_Complet_Q3_2026.xlsx` crée **5 objectifs**, **18 KR** (dont les 10 KR de O4), **~45 tâches**, **6 axes**, **7 collaborateurs** (Business Coach exclu/à part).
2. O5 apparaît bien sur **2 périodes** (Q3 et Q4 2026).
3. Chaque tâche est rattachée au bon `objectif_id` (et `resultat_cle_id` quand `KR#` est simple).
4. Les `mode_operatoire` et `definition_done` sont des **arrays JSON** propres ; `description` ne contient PAS le bloc mode opératoire.
5. Priorités sans emoji ; montants GNF parsés en entiers ; poids en décimaux.
6. `frequence` et `categorie` peuplées sur les tâches.
7. Le **rollback** d'un import nouveau format supprime exactement ce qui a été créé.
8. Un **ancien fichier** (format v1) reste importable (parseur v1 conservé) OU un message clair indique le format non supporté.
9. Aucune régression multi-tenant, aucune réponse JSON, UI FR.

---

## Livrables attendus

- `ExcelImportService` refactorisé : `detectFormat()`, `parseV1()` (existant), **`parseV2()`** (nouveau), helpers FR/owner/emoji.
- Migration(s) `taches.frequence` + `taches.categorie`.
- Adaptation `Import/Index.jsx` (Mapping v2).
- Tests : un test feature qui parse le fichier d'exemple et vérifie les comptes (5/18/45/6/7) + un test de rollback.
- Mise à jour du `DEVBOOK.md` (section Phase 5a → ajouter « Parseur v2 multi-feuilles »).

> Travaille **incrémentalement** : d'abord `detectFormat` + `parseV2` (parsing pur, retour structure intermédiaire), valide avec un test sur le fichier d'exemple, PUIS branche le commit existant, PUIS le front. Ne touche pas au commit/rollback tant que le parsing v2 n'est pas vérifié.
