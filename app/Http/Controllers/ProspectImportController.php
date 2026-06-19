<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\Prospect;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ProspectImportController extends Controller
{
    // Aliases de colonnes acceptés (minuscules, underscores)
    private const ALIASES = [
        'nom'     => ['nom', 'name', 'entreprise', 'company', 'raison_sociale', 'societe', 'organisation'],
        'secteur' => ['secteur', 'sector', 'secteur_activite', 'industrie', 'domaine'],
        'contact' => ['contact', 'contact_nom', 'responsable', 'interlocuteur', 'nom_contact', 'referent'],
        'valeur'  => ['valeur', 'montant', 'value', 'budget', 'montant_deal', 'ca_potentiel'],
        'note'    => ['note', 'notes', 'commentaire', 'commentaires', 'description', 'remarque', 'remarques'],
        'titre'   => ['titre', 'title', 'objet', 'intitule', 'sujet', 'opportunite'],
        'source'  => ['source', 'canal', 'origine', 'provenance'],
    ];

    // ─── Pages ──────────────────────────────────────────────

    public function index()
    {
        return Inertia::render('Prospection/Import', [
            'preview'        => session('import_prospects_preview'),
            'options'        => session('import_prospects_options', []),
            'nomFichier'     => session('import_prospects_fichier'),
            'collaborateurs' => Collaborateur::where('societe_id', session('societe_id'))
                ->where('actif', true)
                ->orderBy('prenom')
                ->get(['id', 'prenom', 'nom']),
        ]);
    }

    // ─── Parse ──────────────────────────────────────────────

    public function parse(Request $request)
    {
        $request->validate([
            'fichier'          => 'required|file|max:20480',
            'statut_initial'   => 'nullable|in:decouverte,proposition,negociation',
            'collaborateur_id' => 'nullable|exists:collaborateurs,id',
        ]);

        $file = $request->file('fichier');
        $ext  = strtolower($file->getClientOriginalExtension());

        if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
            return redirect()->route('prospects.import.index')
                ->with('error', 'Format non supporté. Utilisez .xlsx, .xls ou .csv');
        }

        try {
            $rows = $ext === 'csv'
                ? $this->parseCsv($file->getPathname())
                : $this->parseExcel($file->getPathname());
        } catch (\Throwable $e) {
            return redirect()->route('prospects.import.index')
                ->with('error', 'Erreur lors de la lecture du fichier : ' . $e->getMessage());
        }

        if (empty($rows)) {
            return redirect()->route('prospects.import.index')
                ->with('error', 'Aucune ligne valide trouvée dans le fichier. Vérifiez que la colonne "nom" est présente.');
        }

        session([
            'import_prospects_preview' => $rows,
            'import_prospects_options' => [
                'dedup'            => $request->boolean('dedup', true),
                'statut_initial'   => $request->input('statut_initial', 'decouverte'),
                'collaborateur_id' => $request->input('collaborateur_id'),
            ],
            'import_prospects_fichier' => $file->getClientOriginalName(),
        ]);

        return redirect()->route('prospects.import.index');
    }

    // ─── Commit ─────────────────────────────────────────────

    public function commit()
    {
        $rows      = session('import_prospects_preview', []);
        $options   = session('import_prospects_options', []);
        $societeId = session('societe_id');

        $dedup           = (bool) ($options['dedup'] ?? false);
        $statut          = $options['statut_initial'] ?? 'decouverte';
        $collaborateurId = $options['collaborateur_id'] ?: null;

        $imported = 0;
        $skipped  = 0;

        DB::transaction(function () use ($rows, $societeId, $dedup, $statut, $collaborateurId, &$imported, &$skipped) {
            foreach ($rows as $row) {
                $nom = trim($row['nom'] ?? '');
                if ($nom === '') continue;

                if ($dedup) {
                    $exists = Prospect::where('societe_id', $societeId)
                        ->whereRaw('LOWER(TRIM(nom)) = ?', [mb_strtolower($nom)])
                        ->exists();
                    if ($exists) { $skipped++; continue; }
                }

                $valeur = null;
                if (!empty($row['valeur'])) {
                    $v = preg_replace('/[^\d.,]/', '', $row['valeur']);
                    $v = str_replace(',', '.', $v);
                    $valeur = is_numeric($v) ? (float) $v : null;
                }

                Prospect::create([
                    'societe_id'       => $societeId,
                    'nom'              => $nom,
                    'titre'            => $row['titre'] ?? null,
                    'secteur'          => $row['secteur'] ?? null,
                    'contact'          => $row['contact'] ?? null,
                    'valeur'           => $valeur,
                    'note'             => $row['note'] ?? null,
                    'source'           => $row['source'] ?? 'import',
                    'statut'           => $statut,
                    'probabilite'      => 20,
                    'type_deal'        => 'nouveau_client',
                    'collaborateur_id' => $collaborateurId,
                ]);
                $imported++;
            }
        });

        session()->forget(['import_prospects_preview', 'import_prospects_options', 'import_prospects_fichier']);

        $msg = "{$imported} prospect(s) importé(s)";
        if ($skipped) $msg .= ", {$skipped} ignoré(s) (doublons).";

        return redirect()->route('prospects.index')->with('success', $msg);
    }

    // ─── Reset ──────────────────────────────────────────────

    public function reset()
    {
        session()->forget(['import_prospects_preview', 'import_prospects_options', 'import_prospects_fichier']);
        return redirect()->route('prospects.import.index');
    }

    // ─── Parsing Excel ──────────────────────────────────────

    private function parseExcel(string $path): array
    {
        $spreadsheet = IOFactory::load($path);
        $sheet       = $spreadsheet->getActiveSheet();
        $rawRows     = $sheet->toArray(null, true, false, false);

        if (count($rawRows) < 2) return [];

        $headers = $this->normalizeHeaders((array) $rawRows[0]);
        $data    = [];

        foreach (array_slice($rawRows, 1) as $row) {
            if (empty(array_filter((array) $row, fn($v) => $v !== null && $v !== ''))) continue;
            $mapped = $this->mapRow($headers, (array) $row);
            if (trim($mapped['nom'] ?? '') !== '') $data[] = $mapped;
        }

        return $data;
    }

    // ─── Parsing CSV ────────────────────────────────────────

    private function parseCsv(string $path): array
    {
        // Détecte le délimiteur (; ou ,)
        $sample = file_get_contents($path, false, null, 0, 4096) ?: '';
        $delim  = substr_count($sample, ';') >= substr_count($sample, ',') ? ';' : ',';

        $data    = [];
        $headers = null;
        $handle  = fopen($path, 'r');

        // Skip BOM UTF-8 si présent
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") rewind($handle);

        while (($row = fgetcsv($handle, 0, $delim)) !== false) {
            if ($headers === null) {
                $headers = $this->normalizeHeaders($row);
                continue;
            }
            if (empty(array_filter($row))) continue;
            $mapped = $this->mapRow($headers, $row);
            if (trim($mapped['nom'] ?? '') !== '') $data[] = $mapped;
        }

        fclose($handle);
        return $data;
    }

    // ─── Helpers ────────────────────────────────────────────

    private function normalizeHeaders(array $headers): array
    {
        return array_map(
            fn($h) => strtolower(trim(preg_replace('/[\s\-]+/', '_', (string) ($h ?? '')))),
            $headers
        );
    }

    private function mapRow(array $headers, array $row): array
    {
        $combined = array_combine(
            $headers,
            array_pad($row, count($headers), null)
        );

        $result = [];
        foreach (self::ALIASES as $field => $aliases) {
            foreach ($aliases as $alias) {
                $val = $combined[$alias] ?? null;
                if ($val !== null && trim((string) $val) !== '') {
                    $result[$field] = trim((string) $val);
                    break;
                }
            }
        }

        return $result;
    }
}
