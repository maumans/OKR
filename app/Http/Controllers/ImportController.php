<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreImportRequest;
use App\Models\AxeObjectif;
use App\Models\Collaborateur;
use App\Models\Import;
use App\Models\Objectif;
use App\Models\Periode;
use App\Models\ResultatCle;
use App\Models\Tache;
use App\Models\TypeResultatCle;
use App\Services\Import\ExcelImportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ImportController extends Controller
{
    public function index()
    {
        $preview = session()->pull('import_preview');

        return Inertia::render('Import/Index', [
            'preview' => $preview,
        ]);
    }

    public function parse(StoreImportRequest $request)
    {
        $service = new ExcelImportService();
        $preview = $service->parse($request->file('fichier'));

        $societeId = session('societe_id');
        $isV2      = ($preview['format'] ?? 'v1') === 'v2';

        $collaborateursExistants = Collaborateur::pourSociete($societeId)
            ->get(['id', 'nom', 'prenom', 'poste'])
            ->map(fn ($c) => [
                'id'         => $c->id,
                'nom_complet' => $c->nomComplet(),
                'nom'        => $c->nom,
                'prenom'     => $c->prenom,
            ])
            ->toArray();

        $axesExistants = AxeObjectif::pourSociete($societeId)
            ->actifs()->ordonne()
            ->get(['id', 'nom', 'couleur'])
            ->toArray();

        $periodesExistantes = Periode::pourSociete($societeId)
            ->actives()->orderBy('date_debut')
            ->get(['id', 'nom', 'date_debut', 'date_fin', 'type'])
            ->toArray();

        // Mapper les collaborateurs détectés avec l'existant
        $collabsMappes = [];
        foreach ($preview['collaborateurs_detectes'] as $nomDetecte) {
            $match = null;
            foreach ($collaborateursExistants as $existant) {
                $nomCompletLower = mb_strtolower($existant['nom_complet']);
                $nomLower        = mb_strtolower($existant['nom']);
                $prenomLower     = mb_strtolower($existant['prenom'] ?? '');
                $detecteLower    = mb_strtolower($nomDetecte);

                if ($detecteLower === $nomCompletLower || $detecteLower === $nomLower || $detecteLower === $prenomLower
                    || str_contains($nomCompletLower, $detecteLower) || str_contains($detecteLower, $nomLower)) {
                    $match = $existant;
                    break;
                }
            }

            $collabsMappes[] = [
                'nom_detecte' => $nomDetecte,
                'match'       => $match,
                'existe'      => $match !== null,
                'a_creer'     => $match === null,
                'nom'         => $match['nom']    ?? $nomDetecte,
                'prenom'      => $match['prenom'] ?? '',
                'role'        => 'collaborateur',
            ];
        }

        $preview['collaborateurs_mappes']   = $collabsMappes;
        $preview['collaborateurs_existants'] = $collaborateursExistants;
        $preview['axes_existants']           = $axesExistants;
        $preview['periodes_existantes']      = $periodesExistantes;

        session(['import_preview' => $preview]);

        return redirect()->route('import.index');
    }

    public function commit(Request $request)
    {
        $request->validate([
            'objectifs'               => 'required|array|max:50',
            'axes_mapping'            => 'required|array',
            'collaborateurs_mapping'  => 'required|array',
        ]);

        $societeId      = session('societe_id');
        $userId         = auth()->id();
        $collaborateurId = auth()->user()->collaborateurActuel()?->id;
        $payload        = $request->all();
        $isV2           = ($payload['meta']['format'] ?? 'v1') === 'v2';

        $idsCrees = ['objectif_ids' => [], 'kr_ids' => [], 'tache_ids' => [], 'collaborateur_ids' => [], 'axe_ids' => []];
        $compteurs = ['objectifs' => 0, 'krs' => 0, 'taches' => 0, 'collaborateurs' => 0];

        DB::beginTransaction();

        try {
            // ── 1. Axes ─────────────────────────────────────
            $axeIdMap = [];
            foreach ($payload['axes_mapping'] as $axeData) {
                if (!($axeData['importer'] ?? true)) continue;

                $nomAxe = $axeData['nom'];
                $axe = AxeObjectif::firstOrCreate(
                    ['societe_id' => $societeId, 'nom' => $nomAxe],
                    [
                        'couleur' => $axeData['couleur'] ?? $this->couleurParIndex(count($axeIdMap)),
                        'ordre'   => AxeObjectif::pourSociete($societeId)->max('ordre') + 1,
                        'actif'   => true,
                    ]
                );

                if ($axe->wasRecentlyCreated) $idsCrees['axe_ids'][] = $axe->id;

                $axeIdMap[$nomAxe] = $axe->id;
                if (isset($axeData['nom_original'])) $axeIdMap[$axeData['nom_original']] = $axe->id;
                // V2 : clé par numéro d'axe aussi
                if ($isV2 && isset($axeData['numero'])) {
                    $axeIdMap[(string)$axeData['numero']] = $axe->id;
                }
            }

            // ── 2. Collaborateurs ────────────────────────────
            $collabIdMap = [];
            foreach ($payload['collaborateurs_mapping'] as $collabData) {
                if (isset($collabData['match']['id']) && $collabData['match']['id']) {
                    $collabIdMap[$collabData['nom_detecte']] = $collabData['match']['id'];
                    continue;
                }

                if (!($collabData['a_creer'] ?? true)) continue;

                $collab = Collaborateur::create([
                    'societe_id' => $societeId,
                    'nom'        => $collabData['nom']    ?? $collabData['nom_detecte'],
                    'prenom'     => $collabData['prenom'] ?? '',
                    'poste'      => $collabData['poste']  ?? '',
                    'actif'      => true,
                ]);

                $collabIdMap[$collabData['nom_detecte']] = $collab->id;
                $idsCrees['collaborateur_ids'][] = $collab->id;
                $compteurs['collaborateurs']++;
            }

            // ── 3. Objectifs, KRs, Tâches ───────────────────
            foreach ($payload['objectifs'] as $objData) {
                if (!($objData['importer'] ?? true)) continue;

                // Résolution de l'axe
                $axeId = $axeIdMap[$objData['axe_label']] ?? null;
                if (!$axeId && $isV2 && isset($objData['axe_numero'])) {
                    $axeId = $axeIdMap[(string)$objData['axe_numero']] ?? null;
                }

                // Résolution du collaborateur responsable
                if ($isV2 && !empty($objData['owner'])) {
                    $collabIdForObj = $this->resoudreOwner($objData['owner'], $collabIdMap) ?? $collaborateurId;
                } else {
                    $collabIdForObj = $collaborateurId;
                }

                // Résolution des périodes
                if ($isV2 && !empty($objData['periodes_detectees'])) {
                    $periodeIds = $this->lookupPeriodesByNames($objData['periodes_detectees'], $societeId);
                } else {
                    $periodeIds = $this->deduirePeriodes($objData, $societeId);
                }

                $periodeLabel = '';
                if (!empty($periodeIds)) {
                    $p = Periode::find($periodeIds[0]);
                    $periodeLabel = $p?->nom ?? ($objData['periodes_detectees'][0] ?? ('Q' . ceil(now()->month / 3) . '-' . now()->year));
                } elseif ($isV2 && !empty($objData['periodes_detectees'])) {
                    $periodeLabel = $objData['periodes_detectees'][0];
                } else {
                    $periodeLabel = 'Q' . ceil(now()->month / 3) . '-' . now()->year;
                }

                $objectif = Objectif::create([
                    'societe_id'       => $societeId,
                    'collaborateur_id' => $collabIdForObj,
                    'axe_objectif_id'  => $axeId,
                    'periode_id'       => $periodeIds[0] ?? null,
                    'periode'          => $periodeLabel,
                    'titre'            => $objData['titre'],
                    'prime'            => $isV2 ? ($objData['prime'] ?? 0) : 0,
                    'note_contexte'    => $objData['note_contexte'] ?? null,
                    'statut'           => 'actif',
                    'visibilite'       => 'equipe',
                ]);

                if (!empty($periodeIds)) $objectif->periodes()->sync($periodeIds);

                $idsCrees['objectif_ids'][] = $objectif->id;
                $compteurs['objectifs']++;

                // KRs
                foreach ($objData['resultats_cles'] ?? [] as $krData) {
                    if (!($krData['importer'] ?? true)) continue;

                    $typeKrId = null;
                    if ($isV2 && !empty($krData['type_mapped'])) {
                        $typeKrId = $this->lookupTypeKrId($krData['type_mapped'], $societeId);
                    }

                    $kr = ResultatCle::create([
                        'objectif_id'          => $objectif->id,
                        'type_resultat_cle_id' => $typeKrId,
                        'description'          => $krData['description'] ?? '',
                        'description_detaillee' => $krData['description_detaillee'] ?? '',
                        'progression'          => 0,
                        'valeur_cible'         => $isV2 ? ($krData['valeur_cible'] ?? null) : null,
                        'unite'                => $isV2 ? ($krData['unite'] ?? null) : null,
                        'poids'                => $isV2 ? ($krData['poids'] ?? 1) : 1,
                    ]);

                    $idsCrees['kr_ids'][] = $kr->id;
                    $compteurs['krs']++;

                    // Tâches liées au KR
                    foreach ($krData['taches'] ?? [] as $tacheData) {
                        if (!($tacheData['importer'] ?? true)) continue;

                        $tache = $this->creerTache($tacheData, $objData, $krData, $isV2, [
                            'societe_id'      => $societeId,
                            'objectif_id'     => $objectif->id,
                            'resultat_cle_id' => $kr->id,
                        ], $collabIdMap, $collaborateurId);

                        $idsCrees['tache_ids'][] = $tache->id;
                        $compteurs['taches']++;
                    }
                }

                // Tâches directes sur l'objectif (KR# = "—" en v2)
                foreach ($objData['taches_directes'] ?? [] as $tacheData) {
                    if (!($tacheData['importer'] ?? true)) continue;

                    $tache = $this->creerTache($tacheData, $objData, [], $isV2, [
                        'societe_id'      => $societeId,
                        'objectif_id'     => $objectif->id,
                        'resultat_cle_id' => null,
                    ], $collabIdMap, $collaborateurId);

                    $idsCrees['tache_ids'][] = $tache->id;
                    $compteurs['taches']++;
                }
            }

            // ── 4. Traçabilité ───────────────────────────────
            $import = Import::create([
                'societe_id'             => $societeId,
                'user_id'                => $userId,
                'fichier_nom'            => $payload['meta']['fichier'] ?? 'import.xlsx',
                'statut'                 => 'importe',
                'nb_objectifs_crees'     => $compteurs['objectifs'],
                'nb_kr_crees'            => $compteurs['krs'],
                'nb_taches_crees'        => $compteurs['taches'],
                'nb_collaborateurs_crees' => $compteurs['collaborateurs'],
                'payload_json'           => $payload,
                'ids_crees'              => $idsCrees,
            ]);

            DB::commit();

            return redirect()->back()->with('success', [
                'message'       => 'Import réalisé avec succès !',
                'objectifs'     => $compteurs['objectifs'],
                'krs'           => $compteurs['krs'],
                'taches'        => $compteurs['taches'],
                'collaborateurs' => $compteurs['collaborateurs'],
                'import_id'     => $import->id,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['import' => 'Erreur lors de l\'import : ' . $e->getMessage()]);
        }
    }

    public function historique()
    {
        $societeId = session('societe_id');

        $imports = Import::pourSociete($societeId)
            ->with('user')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($i) => [
                'id'                     => $i->id,
                'fichier_nom'            => $i->fichier_nom,
                'statut'                 => $i->statut,
                'nb_objectifs_crees'     => $i->nb_objectifs_crees,
                'nb_kr_crees'            => $i->nb_kr_crees,
                'nb_taches_crees'        => $i->nb_taches_crees,
                'nb_collaborateurs_crees' => $i->nb_collaborateurs_crees,
                'user_nom'               => $i->user?->name ?? 'Inconnu',
                'created_at'             => $i->created_at->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Import/Historique', ['imports' => $imports]);
    }

    public function destroy(Import $import)
    {
        $societeId = session('societe_id');

        if ($import->societe_id !== $societeId) abort(403);

        if ($import->statut === 'annule') {
            return redirect()->back()->withErrors(['import' => 'Cet import a déjà été annulé.']);
        }

        DB::beginTransaction();

        try {
            $ids = $import->ids_crees ?? [];

            if (!empty($ids['tache_ids']))         Tache::whereIn('id', $ids['tache_ids'])->delete();
            if (!empty($ids['kr_ids']))             ResultatCle::whereIn('id', $ids['kr_ids'])->delete();
            if (!empty($ids['objectif_ids'])) {
                DB::table('objectif_periode')->whereIn('objectif_id', $ids['objectif_ids'])->delete();
                Objectif::whereIn('id', $ids['objectif_ids'])->delete();
            }
            if (!empty($ids['collaborateur_ids'])) Collaborateur::whereIn('id', $ids['collaborateur_ids'])->delete();
            if (!empty($ids['axe_ids']))            AxeObjectif::whereIn('id', $ids['axe_ids'])->delete();

            $import->update(['statut' => 'annule']);

            DB::commit();

            return redirect()->back()->with('success', 'Import annulé et données supprimées avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['import' => 'Erreur lors de l\'annulation : ' . $e->getMessage()]);
        }
    }

    // ─── Helpers privés ──────────────────────────────────────

    private function creerTache(
        array $tacheData,
        array $objData,
        array $krData,
        bool  $isV2,
        array $ids,
        array $collabIdMap,
        ?int  $fallbackCollabId
    ): Tache {
        if ($isV2) {
            $collabId = $this->resoudreOwner($tacheData['owner'] ?? '', $collabIdMap) ?? $fallbackCollabId;
            $priorite = $tacheData['priorite'] ?? 'normale';
        } else {
            $responsables = $krData['responsables'] ?? [];
            $collabId     = !empty($responsables) ? ($collabIdMap[$responsables[0]] ?? $fallbackCollabId) : $fallbackCollabId;
            $priorite     = $this->mapperPriorite($krData['priorite'] ?? '');
        }

        return Tache::create(array_merge($ids, [
            'collaborateur_id' => $collabId,
            'titre'            => $tacheData['titre'],
            'description'      => $tacheData['description'] ?? null,
            'mode_operatoire'  => !empty($tacheData['mode_operatoire']) ? $tacheData['mode_operatoire'] : null,
            'outils'           => $tacheData['outils'] ?? null,
            'definition_done'  => !empty($tacheData['definition_done']) ? $tacheData['definition_done'] : null,
            'statut'           => 'a_faire',
            'priorite'         => $priorite,
            'date'             => $isV2 ? null : ($krData['date_cible'] ?? null),
            'frequence'        => $isV2 ? ($tacheData['frequence'] ?? null) : null,
            'categorie'        => $isV2 ? ($tacheData['categorie'] ?? null) : null,
        ]));
    }

    private function resoudreOwner(string $owner, array $collabIdMap): ?int
    {
        if (empty($owner)) return null;

        // Prendre le premier owner (séparateurs + / , \n)
        $parts  = preg_split('/[\+\/,\n]+/', $owner);
        $premier = trim($parts[0] ?? '');
        if (empty($premier)) return null;

        // 1. Correspondance exacte
        if (isset($collabIdMap[$premier])) return $collabIdMap[$premier];

        // 2. Correspondance insensible casse
        foreach ($collabIdMap as $key => $id) {
            if (mb_strtolower($key) === mb_strtolower($premier)) return $id;
        }

        // 3. Correspondance partielle : "Amadou Bailo" ↔ "Amadou Bailo Diallo"
        foreach ($collabIdMap as $key => $id) {
            if (str_contains(mb_strtolower($key), mb_strtolower($premier)) ||
                str_contains(mb_strtolower($premier), mb_strtolower($key))) {
                return $id;
            }
        }

        // 4. Correspondance sur le prénom seul (premier mot)
        $prenom = explode(' ', $premier)[0];
        if (mb_strlen($prenom) > 3) {
            foreach ($collabIdMap as $key => $id) {
                if (str_starts_with(mb_strtolower($key), mb_strtolower($prenom))) {
                    return $id;
                }
            }
        }

        return null;
    }

    private function lookupPeriodesByNames(array $noms, int $societeId): array
    {
        $periodeIds = [];
        $periodes   = Periode::pourSociete($societeId)->get();

        foreach ($noms as $nom) {
            $nomNorm = mb_strtolower(str_replace(' ', '', $nom));
            foreach ($periodes as $p) {
                $pNorm = mb_strtolower(str_replace(' ', '', $p->nom));
                if ($pNorm === $nomNorm || str_contains($pNorm, $nomNorm) || str_contains($nomNorm, $pNorm)) {
                    if (!in_array($p->id, $periodeIds)) $periodeIds[] = $p->id;
                    break;
                }
            }
        }

        return $periodeIds;
    }

    private function lookupTypeKrId(string $typeSlug, int $societeId): ?int
    {
        return TypeResultatCle::pourSociete($societeId)
            ->where(function ($q) use ($typeSlug) {
                $q->where('type_valeur', 'like', "%{$typeSlug}%")
                    ->orWhere('nom', 'like', "%{$typeSlug}%");
            })
            ->value('id');
    }

    private function couleurParIndex(int $index): string
    {
        $couleurs = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        return $couleurs[$index % count($couleurs)];
    }

    private function mapperPriorite(string $priorite): string
    {
        return match(strtoupper($priorite)) {
            'P1'  => 'urgente',
            'P2'  => 'haute',
            'P3'  => 'normale',
            'P4'  => 'basse',
            default => 'normale',
        };
    }

    private function deduirePeriodes(array $objData, int $societeId): array
    {
        $dates = [];

        foreach ($objData['resultats_cles'] ?? [] as $kr) {
            if (!empty($kr['date_debut'])) $dates[] = $kr['date_debut'];
            if (!empty($kr['date_cible'])) $dates[] = $kr['date_cible'];
        }

        if (empty($dates)) return [];

        $periodeIds        = [];
        $periodesExistantes = Periode::pourSociete($societeId)->get();

        foreach ($dates as $dateStr) {
            try {
                $date = Carbon::parse($dateStr);
                foreach ($periodesExistantes as $periode) {
                    if ($date->between($periode->date_debut, $periode->date_fin)) {
                        if (!in_array($periode->id, $periodeIds)) $periodeIds[] = $periode->id;
                    }
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return $periodeIds;
    }
}
