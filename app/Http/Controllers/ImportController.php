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
use App\Services\Import\ExcelImportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ImportController extends Controller
{
    /**
     * Page principale d'import.
     */
    public function index()
    {
        $preview = session()->pull('import_preview');

        return Inertia::render('Import/Index', [
            'preview' => $preview,
        ]);
    }

    /**
     * Parse le fichier Excel et retourne une preview.
     */
    public function parse(StoreImportRequest $request)
    {
        $service = new ExcelImportService();
        $preview = $service->parse($request->file('fichier'));

        $societeId = session('societe_id');

        // Enrichir avec les données existantes en base
        $collaborateursExistants = Collaborateur::pourSociete($societeId)
            ->get(['id', 'nom', 'prenom', 'poste', 'role'])
            ->map(fn($c) => [
                'id' => $c->id,
                'nom_complet' => $c->nomComplet(),
                'nom' => $c->nom,
                'prenom' => $c->prenom,
            ])
            ->toArray();

        $axesExistants = AxeObjectif::pourSociete($societeId)
            ->actifs()
            ->ordonne()
            ->get(['id', 'nom', 'couleur'])
            ->toArray();

        $periodesExistantes = Periode::pourSociete($societeId)
            ->actives()
            ->orderBy('date_debut')
            ->get(['id', 'nom', 'date_debut', 'date_fin', 'type'])
            ->toArray();

        // Mapper les collaborateurs détectés avec ceux existants
        $collabsMappes = [];
        foreach ($preview['collaborateurs_detectes'] as $nomDetecte) {
            $match = null;
            foreach ($collaborateursExistants as $existant) {
                $nomCompletLower = mb_strtolower($existant['nom_complet']);
                $nomLower = mb_strtolower($existant['nom']);
                $prenomLower = mb_strtolower($existant['prenom'] ?? '');
                $detecteLower = mb_strtolower($nomDetecte);

                if ($detecteLower === $nomCompletLower || $detecteLower === $nomLower || $detecteLower === $prenomLower
                    || str_contains($nomCompletLower, $detecteLower) || str_contains($detecteLower, $nomLower)) {
                    $match = $existant;
                    break;
                }
            }

            $collabsMappes[] = [
                'nom_detecte' => $nomDetecte,
                'match' => $match,
                'existe' => $match !== null,
                'a_creer' => $match === null,
                'nom' => $match['nom'] ?? $nomDetecte,
                'prenom' => $match['prenom'] ?? '',
                'role' => 'collaborateur',
            ];
        }

        $preview['collaborateurs_mappes'] = $collabsMappes;
        $preview['collaborateurs_existants'] = $collaborateursExistants;
        $preview['axes_existants'] = $axesExistants;
        $preview['periodes_existantes'] = $periodesExistantes;

        session(['import_preview' => $preview]);

        return redirect()->route('import.index');
    }

    /**
     * Insère les données validées en base.
     */
    public function commit(Request $request)
    {
        $request->validate([
            'objectifs' => 'required|array|max:50',
            'axes_mapping' => 'required|array',
            'collaborateurs_mapping' => 'required|array',
        ]);

        $societeId = session('societe_id');
        $userId = auth()->id();
        $collaborateurId = auth()->user()->collaborateurActuel()?->id;
        $payload = $request->all();

        $idsCrees = [
            'objectif_ids' => [],
            'kr_ids' => [],
            'tache_ids' => [],
            'collaborateur_ids' => [],
            'axe_ids' => [],
        ];

        $compteurs = [
            'objectifs' => 0,
            'krs' => 0,
            'taches' => 0,
            'collaborateurs' => 0,
        ];

        DB::beginTransaction();

        try {
            // 1. Créer/mapper les axes
            $axeIdMap = [];
            foreach ($payload['axes_mapping'] as $axeData) {
                if (!($axeData['importer'] ?? true)) continue;

                $axe = AxeObjectif::firstOrCreate(
                    ['societe_id' => $societeId, 'nom' => $axeData['nom']],
                    [
                        'societe_id' => $societeId,
                        'couleur' => $axeData['couleur'] ?? $this->couleurParIndex(count($axeIdMap)),
                        'ordre' => AxeObjectif::pourSociete($societeId)->max('ordre') + 1,
                        'actif' => true,
                    ]
                );

                if ($axe->wasRecentlyCreated) {
                    $idsCrees['axe_ids'][] = $axe->id;
                }

                $axeIdMap[$axeData['nom']] = $axe->id;
                // Aussi mapper les noms originaux
                if (isset($axeData['nom_original'])) {
                    $axeIdMap[$axeData['nom_original']] = $axe->id;
                }
            }

            // 2. Créer/mapper les collaborateurs
            $collabIdMap = [];
            foreach ($payload['collaborateurs_mapping'] as $collabData) {
                if (isset($collabData['match']['id']) && $collabData['match']['id']) {
                    $collabIdMap[$collabData['nom_detecte']] = $collabData['match']['id'];
                    continue;
                }

                if (!($collabData['a_creer'] ?? true)) continue;

                $collab = Collaborateur::create([
                    'societe_id' => $societeId,
                    'nom' => $collabData['nom'] ?? $collabData['nom_detecte'],
                    'prenom' => $collabData['prenom'] ?? '',
                    'poste' => $collabData['poste'] ?? '',
                    'role' => $collabData['role'] ?? 'collaborateur',
                    'actif' => true,
                ]);

                $collabIdMap[$collabData['nom_detecte']] = $collab->id;
                $idsCrees['collaborateur_ids'][] = $collab->id;
                $compteurs['collaborateurs']++;
            }

            // 3. Créer les objectifs, KRs et tâches
            foreach ($payload['objectifs'] as $objData) {
                if (!($objData['importer'] ?? true)) continue;

                $axeId = $axeIdMap[$objData['axe_label']] ?? null;

                // Trouver ou créer la période correspondante
                $periodeIds = $this->deduirePeriodes($objData, $societeId);

                // Déterminer le label de période
                $periodeLabel = '';
                if (!empty($periodeIds)) {
                    $p = Periode::find($periodeIds[0]);
                    $periodeLabel = $p?->nom ?? ('Q' . ceil(now()->month / 3) . '-' . now()->year);
                } else {
                    $periodeLabel = 'Q' . ceil(now()->month / 3) . '-' . now()->year;
                }

                $objectif = Objectif::create([
                    'societe_id' => $societeId,
                    'collaborateur_id' => $collaborateurId,
                    'axe_objectif_id' => $axeId,
                    'periode_id' => $periodeIds[0] ?? null,
                    'periode' => $periodeLabel,
                    'titre' => $objData['titre'],
                    'note_contexte' => $objData['note_contexte'] ?? null,
                    'statut' => 'actif',
                    'visibilite' => 'equipe',
                ]);

                // Sync périodes multiples
                if (!empty($periodeIds)) {
                    $objectif->periodes()->sync($periodeIds);
                }

                $idsCrees['objectif_ids'][] = $objectif->id;
                $compteurs['objectifs']++;

                // KRs
                foreach ($objData['resultats_cles'] ?? [] as $krData) {
                    if (!($krData['importer'] ?? true)) continue;

                    $kr = ResultatCle::create([
                        'objectif_id' => $objectif->id,
                        'description' => $krData['description'] ?? '',
                        'description_detaillee' => $krData['description_detaillee'] ?? '',
                        'progression' => $krData['progression'] ?? 0,
                        'poids' => 1,
                    ]);

                    $idsCrees['kr_ids'][] = $kr->id;
                    $compteurs['krs']++;

                    // Tâches
                    foreach ($krData['taches'] ?? [] as $tacheData) {
                        if (!($tacheData['importer'] ?? true)) continue;

                        // Trouver le collaborateur responsable
                        $collabId = null;
                        $responsables = $krData['responsables'] ?? [];
                        if (!empty($responsables)) {
                            $premierResp = $responsables[0] ?? null;
                            $collabId = $collabIdMap[$premierResp] ?? null;
                        }

                        $tache = Tache::create([
                            'societe_id' => $societeId,
                            'objectif_id' => $objectif->id,
                            'resultat_cle_id' => $kr->id,
                            'collaborateur_id' => $collabId,
                            'titre' => $tacheData['titre'],
                            'statut' => 'a_faire',
                            'priorite' => $this->mapperPriorite($krData['priorite'] ?? ''),
                            'date' => $krData['date_cible'] ?? null,
                        ]);

                        $idsCrees['tache_ids'][] = $tache->id;
                        $compteurs['taches']++;
                    }
                }
            }

            // 4. Créer l'entrée d'import pour traçabilité
            $import = Import::create([
                'societe_id' => $societeId,
                'user_id' => $userId,
                'fichier_nom' => $payload['meta']['fichier'] ?? 'import.xlsx',
                'statut' => 'importe',
                'nb_objectifs_crees' => $compteurs['objectifs'],
                'nb_kr_crees' => $compteurs['krs'],
                'nb_taches_crees' => $compteurs['taches'],
                'nb_collaborateurs_crees' => $compteurs['collaborateurs'],
                'payload_json' => $payload,
                'ids_crees' => $idsCrees,
            ]);

            DB::commit();

            return redirect()->back()->with('success', [
                'message' => "Import réalisé avec succès !",
                'objectifs' => $compteurs['objectifs'],
                'krs' => $compteurs['krs'],
                'taches' => $compteurs['taches'],
                'collaborateurs' => $compteurs['collaborateurs'],
                'import_id' => $import->id,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['import' => 'Erreur lors de l\'import : ' . $e->getMessage()]);
        }
    }

    /**
     * Liste des imports passés.
     */
    public function historique()
    {
        $societeId = session('societe_id');

        $imports = Import::pourSociete($societeId)
            ->with('user')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'fichier_nom' => $i->fichier_nom,
                'statut' => $i->statut,
                'nb_objectifs_crees' => $i->nb_objectifs_crees,
                'nb_kr_crees' => $i->nb_kr_crees,
                'nb_taches_crees' => $i->nb_taches_crees,
                'nb_collaborateurs_crees' => $i->nb_collaborateurs_crees,
                'user_nom' => $i->user?->name ?? 'Inconnu',
                'created_at' => $i->created_at->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Import/Historique', [
            'imports' => $imports,
        ]);
    }

    /**
     * Rollback d'un import.
     */
    public function destroy(Import $import)
    {
        $societeId = session('societe_id');

        if ($import->societe_id !== $societeId) {
            abort(403);
        }

        if ($import->statut === 'annule') {
            return redirect()->back()->withErrors(['import' => 'Cet import a déjà été annulé.']);
        }

        DB::beginTransaction();

        try {
            $ids = $import->ids_crees ?? [];

            // Supprimer dans l'ordre inverse : tâches → KRs → objectifs → collaborateurs → axes
            if (!empty($ids['tache_ids'])) {
                Tache::whereIn('id', $ids['tache_ids'])->delete();
            }
            if (!empty($ids['kr_ids'])) {
                ResultatCle::whereIn('id', $ids['kr_ids'])->delete();
            }
            if (!empty($ids['objectif_ids'])) {
                // Détacher les périodes d'abord
                DB::table('objectif_periode')->whereIn('objectif_id', $ids['objectif_ids'])->delete();
                Objectif::whereIn('id', $ids['objectif_ids'])->delete();
            }
            if (!empty($ids['collaborateur_ids'])) {
                Collaborateur::whereIn('id', $ids['collaborateur_ids'])->delete();
            }
            if (!empty($ids['axe_ids'])) {
                AxeObjectif::whereIn('id', $ids['axe_ids'])->delete();
            }

            $import->update(['statut' => 'annule']);

            DB::commit();

            return redirect()->back()->with('success', 'Import annulé et données supprimées avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['import' => 'Erreur lors de l\'annulation : ' . $e->getMessage()]);
        }
    }

    // ─── Helpers privés ─────────────────────────────────────

    private function couleurParIndex(int $index): string
    {
        $couleurs = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        return $couleurs[$index % count($couleurs)];
    }

    private function mapperPriorite(string $priorite): string
    {
        return match(strtoupper($priorite)) {
            'P1' => 'urgente',
            'P2' => 'haute',
            'P3' => 'normale',
            'P4' => 'basse',
            default => 'normale',
        };
    }

    /**
     * Déduit les périodes depuis les dates d'un objectif et ses KRs.
     */
    private function deduirePeriodes(array $objData, int $societeId): array
    {
        $dates = [];

        foreach ($objData['resultats_cles'] ?? [] as $kr) {
            if (!empty($kr['date_debut'])) $dates[] = $kr['date_debut'];
            if (!empty($kr['date_cible'])) $dates[] = $kr['date_cible'];
        }

        if (empty($dates)) return [];

        $periodeIds = [];
        $periodesExistantes = Periode::pourSociete($societeId)->get();

        foreach ($dates as $dateStr) {
            try {
                $date = Carbon::parse($dateStr);
                foreach ($periodesExistantes as $periode) {
                    if ($date->between($periode->date_debut, $periode->date_fin)) {
                        if (!in_array($periode->id, $periodeIds)) {
                            $periodeIds[] = $periode->id;
                        }
                    }
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return $periodeIds;
    }
}
