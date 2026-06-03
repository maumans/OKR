<?php

namespace App\Services\Import;

use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class ExcelImportService
{
    private array $corrections = [];

    // ─── Entrée publique ─────────────────────────────────────

    public function parse(UploadedFile $file): array
    {
        $this->corrections = [];
        $spreadsheet = IOFactory::load($file->getPathname());
        $format = $this->detectFormat($spreadsheet);

        if ($format === 'v2') {
            return $this->parseV2($spreadsheet, $file);
        }

        return $this->parseV1($spreadsheet, $file);
    }

    // ─── Détection de format ─────────────────────────────────

    private function detectFormat(Spreadsheet $spreadsheet): string
    {
        $sheetNames = array_map(fn($n) => $this->normHeader($n), $spreadsheet->getSheetNames());
        $v2Markers = ['OKR MASTER', 'AXES STRATEGIQUES', 'TACHES DETAILLEES'];
        $found = 0;
        foreach ($v2Markers as $marker) {
            if (in_array($marker, $sheetNames)) {
                $found++;
            }
        }
        return $found >= 2 ? 'v2' : 'v1';
    }

    // ─── Parseur V1 (format ancien, mono-feuille) ────────────

    private function parseV1(Spreadsheet $spreadsheet, UploadedFile $file): array
    {
        $feuilles = $spreadsheet->getSheetNames();
        $sheet = $spreadsheet->getActiveSheet();
        $data = $sheet->toArray(null, true, true, true);

        $ligneEntete = $this->detecterLigneEntete($data);
        $entetes = $data[$ligneEntete] ?? [];
        $colonneMap = $this->mapperColonnes($entetes);
        $lignesDonnees = $this->extraireLignesDonnees($data, $ligneEntete, $colonneMap);
        $objectifs = $this->construireArborescence($lignesDonnees, $colonneMap);
        $axesDetectes = $this->extraireAxes($lignesDonnees, $colonneMap);
        $collaborateursDetectes = $this->extraireCollaborateurs($lignesDonnees, $colonneMap);

        return [
            'meta' => [
                'fichier' => $file->getClientOriginalName(),
                'feuille' => $sheet->getTitle(),
                'feuilles_disponibles' => $feuilles,
                'format' => 'v1',
                'ligne_entete' => $ligneEntete,
                'nb_lignes' => count($lignesDonnees),
            ],
            'format' => 'v1',
            'axes_detectes' => $axesDetectes,
            'collaborateurs_detectes' => $collaborateursDetectes,
            'corrections' => $this->corrections,
            'objectifs' => $objectifs,
        ];
    }

    // ─── Parseur V2 (format multi-feuilles OKR Q3-2026) ─────

    private function parseV2(Spreadsheet $spreadsheet, UploadedFile $file): array
    {
        $sheetNames = $spreadsheet->getSheetNames();

        $sheetAxes     = $this->getSheetByName($spreadsheet, 'AXES STRATÉGIQUES');
        $sheetVision   = $this->getSheetByName($spreadsheet, 'VISION & IDENTITÉ');
        $sheetPrimes   = $this->getSheetByName($spreadsheet, 'PRIMES & CONDITIONS');
        $sheetMaster   = $this->getSheetByName($spreadsheet, 'OKR MASTER');
        $sheetTaches   = $this->getSheetByName($spreadsheet, 'TÂCHES DÉTAILLÉES');

        $axes        = $sheetAxes   ? $this->parseFeuilleAxes($sheetAxes)     : [];
        $visionnaires = $sheetVision ? $this->parseFeuilleVision($sheetVision)  : [];
        $primes      = $sheetPrimes  ? $this->parseFeuillesPrimes($sheetPrimes) : [];

        // Index axes par numéro pour lookup rapide
        $axesMap = [];
        foreach ($axes as $axe) {
            $axesMap[(string)$axe['numero']] = $axe['nom'];
        }

        $objectifs  = $sheetMaster ? $this->parseOkrMaster($sheetMaster, $axesMap, $primes) : [];
        $tachesData = $sheetTaches ? $this->parseTachesDetaillees($sheetTaches)               : [];

        $this->joinTachesAuxObjectifs($objectifs, $tachesData);

        // Extraire collaborateurs uniques (toutes feuilles)
        $collabsDetectes = $this->extraireCollaborateursV2($objectifs, $tachesData, $visionnaires);

        // Business Coach → exclure + avertissement
        $businessCoachDetecte = false;
        $collabsDetectes = array_values(array_filter($collabsDetectes, function ($c) use (&$businessCoachDetecte) {
            if (mb_strtolower($c) === 'business coach') {
                $businessCoachDetecte = true;
                return false;
            }
            return true;
        }));

        if ($businessCoachDetecte) {
            $this->corrections[] = [
                'type' => 'partenaire',
                'avant' => 'Business Coach',
                'apres' => '(Partenaire)',
                'message' => '"Business Coach" exclu des collaborateurs : profil Partenaire (accès restreint O5), non créé comme collaborateur standard.',
            ];
        }

        // Déduplication : si "Amadou Bailo" ET "Amadou Bailo Diallo" sont présents, garder le plus long
        $collabsDetectes = $this->deduplicerNoms($collabsDetectes);

        $nbTaches = array_sum(array_map(function ($obj) {
            $direct = count($obj['taches_directes'] ?? []);
            $viaKr  = array_sum(array_map(fn ($kr) => count($kr['taches'] ?? []), $obj['resultats_cles'] ?? []));
            return $direct + $viaKr;
        }, $objectifs));

        return [
            'meta' => [
                'fichier' => $file->getClientOriginalName(),
                'feuille' => 'OKR MASTER',
                'feuilles_disponibles' => $sheetNames,
                'format' => 'v2',
                'nb_lignes' => count($objectifs),
                'nb_taches' => $nbTaches,
            ],
            'format' => 'v2',
            'axes_detectes' => $axes,
            'collaborateurs_detectes' => $collabsDetectes,
            'corrections' => $this->corrections,
            'objectifs' => $objectifs,
        ];
    }

    // ─── Parseurs de feuilles V2 ─────────────────────────────

    private function parseFeuilleAxes(Worksheet $sheet): array
    {
        $data = $sheet->toArray(null, true, false, true);
        $headerRow = null;

        foreach ($data as $rowIdx => $row) {
            foreach ($row as $cell) {
                if ($this->normHeader((string)$cell) === 'AXE') {
                    $headerRow = $rowIdx;
                    break 2;
                }
            }
        }

        if ($headerRow === null) return [];

        $cols = $this->mapperColonnesV2($data[$headerRow], [
            'axe'      => ['AXE'],
            'nom'      => ['NOM'],
            'ambition' => ['AMBITION'],
        ]);

        if (!$cols['axe'] || !$cols['nom']) return [];

        $axes = [];
        foreach ($data as $rowIdx => $row) {
            if ($rowIdx <= $headerRow) continue;

            $axeNum = trim((string)($row[$cols['axe']] ?? ''));
            $nom    = trim((string)($row[$cols['nom']] ?? ''));

            if (empty($axeNum) || !is_numeric($axeNum)) continue;
            if (empty($nom) || $this->normHeader($nom) === 'TOTAL') continue;

            $axes[] = [
                'numero'   => (int)$axeNum,
                'nom'      => $nom,
                'ambition' => trim((string)($row[$cols['ambition']] ?? '')),
            ];
        }

        return $axes;
    }

    private function parseFeuilleVision(Worksheet $sheet): array
    {
        $data = $sheet->toArray(null, true, false, true);
        $collaborateurs = [];
        $inSection = false;

        foreach ($data as $row) {
            // Détecter la section ÉQUIPE
            foreach ($row as $cell) {
                $cellNorm = $this->normHeader((string)$cell);
                if (str_contains($cellNorm, 'EQUIPE ADDVALIS') || str_contains($cellNorm, 'EQUIPE 2026')) {
                    $inSection = true;
                    break;
                }
            }

            if (!$inSection) continue;

            // Collecter cellules non vides de la ligne
            $cells = array_values(array_filter(array_map('trim', $row), fn ($c) => $c !== '' && $c !== null));
            if (empty($cells)) continue;

            $nom = $code = $poste = null;

            // Chercher pattern [CODE] dans n'importe quelle cellule
            foreach ($cells as $ci => $cellVal) {
                if (preg_match('/\[(DIR|CSL|TECH)\]/u', $cellVal, $cm)) {
                    $code = $cm[1];
                    if (preg_match('/^(.+?)\s+\[(?:DIR|CSL|TECH)\]\s*(.*)$/u', $cellVal, $nm)) {
                        $nom   = trim($nm[1]);
                        $poste = trim($nm[2]);
                    } elseif ($ci > 0) {
                        $nom   = $cells[$ci - 1];
                        $poste = trim(preg_replace('/^\[(?:DIR|CSL|TECH)\]\s*/u', '', $cellVal));
                    }
                    break;
                }
            }

            // Fallback : première cellule comme nom si pas de code
            if (!$nom && !empty($cells[0])) {
                $first = $cells[0];
                $normFirst = $this->normHeader($first);
                $skipPatterns = ['EQUIPE', 'ADDVALIS', 'NOM', 'POSTE', 'CODE', '---', 'ROLE'];
                $skip = false;
                foreach ($skipPatterns as $p) {
                    if (str_contains($normFirst, $p)) { $skip = true; break; }
                }
                if (!$skip && mb_strlen($first) > 3 && !is_numeric($first)) {
                    $nom = $first;
                }
            }

            if ($nom && mb_strlen($nom) > 2) {
                $role = match($code) {
                    'DIR'  => 'admin',
                    'CSL', 'TECH' => 'collaborateur',
                    default => 'collaborateur',
                };
                $collaborateurs[$nom] = compact('nom', 'code', 'poste', 'role');
            }
        }

        // Alias DIR → nom réel du directeur
        foreach ($collaborateurs as $nom => $data) {
            if ($data['code'] === 'DIR') {
                $collaborateurs['DIR'] = array_merge($data, ['alias_pour' => $nom]);
                break;
            }
        }

        return $collaborateurs;
    }

    private function parseFeuillesPrimes(Worksheet $sheet): array
    {
        $data = $sheet->toArray(null, true, false, true);
        $headerRow = null;

        foreach ($data as $rowIdx => $row) {
            foreach ($row as $cell) {
                if (str_contains($this->normHeader((string)$cell), 'PRIME BASE')) {
                    $headerRow = $rowIdx;
                    break 2;
                }
            }
        }

        if ($headerRow === null) return [];

        $cols = $this->mapperColonnesV2($data[$headerRow], [
            'objectif'   => ['OBJECTIF'],
            'prime_base' => ['PRIME BASE'],
        ]);

        if (!$cols['objectif'] || !$cols['prime_base']) return [];

        $primes = [];
        foreach ($data as $rowIdx => $row) {
            if ($rowIdx <= $headerRow) continue;

            $objectifLabel = trim((string)($row[$cols['objectif']] ?? ''));
            $primeBase     = $row[$cols['prime_base']] ?? null;

            if (empty($objectifLabel)) continue;

            // Extraire le numéro O1, O2… du libellé
            if (!preg_match('/^(O\d+)/i', $objectifLabel, $m)) continue;
            $oNum = strtoupper($m[1]);

            // Parser le montant (PHP float ou chaîne "3 000 000 GNF")
            if (is_float($primeBase) || is_int($primeBase)) {
                $montant = (float)$primeBase;
            } else {
                $montant = $this->parseFr(preg_replace('/\s*GNF\s*/iu', '', (string)($primeBase ?? '')));
            }

            $primes[$oNum] = ['montant' => $montant, 'libelle' => $objectifLabel];
        }

        return $primes;
    }

    private function parseOkrMaster(Worksheet $sheet, array $axesMap, array $primes): array
    {
        $data = $sheet->toArray(null, true, false, true);
        $headerRow = null;

        // Détection robuste : compter les marqueurs reconnus dans chaque ligne
        $headerMarkers = ['O#', 'KR#', 'OWNER', 'ENONCE', 'TYPE KR', 'CIBLE', 'POIDS'];
        foreach ($data as $rowIdx => $row) {
            $score = 0;
            foreach ($row as $cell) {
                $norm = $this->normHeader((string)$cell);
                if (in_array($norm, $headerMarkers)) $score++;
            }
            if ($score >= 3) {
                $headerRow = $rowIdx;
                break;
            }
        }

        if ($headerRow === null) return [];

        $cols = $this->mapperColonnesV2($data[$headerRow], [
            'axe'            => ['AXE'],
            'o_num'          => ['O#'],
            'kr_num'         => ['KR#'],
            'enonce'         => ['ENONCE'],
            'owner'          => ['OWNER'],
            'type_kr'        => ['TYPE KR'],
            'cible'          => ['CIBLE'],
            'unite'          => ['UNITE'],
            'poids'          => ['POIDS'],
            'desc_detaillee' => ['DESCRIPTION DETAILLEE'],
            'prime_cond'     => ['PRIME / CONDITIONS', 'PRIME'],
        ]);

        $objectifs     = [];
        $currentAxe    = null;
        $currentONum   = null;
        $currentObj    = null;

        foreach ($data as $rowIdx => $row) {
            if ($rowIdx <= $headerRow) continue;

            $axeRaw  = trim((string)($row[$cols['axe']]    ?? ''));
            $oNum    = trim((string)($row[$cols['o_num']]   ?? ''));
            $krNum   = trim((string)($row[$cols['kr_num']]  ?? ''));
            $enonce  = trim((string)($row[$cols['enonce']]  ?? ''));
            $owner   = trim((string)($row[$cols['owner']]   ?? ''));
            $typeKr  = trim((string)($row[$cols['type_kr']] ?? ''));
            $cible   = $row[$cols['cible']] ?? null;
            $uniteRaw = trim((string)($row[$cols['unite']]  ?? ''));
            $poidsRaw = trim((string)($row[$cols['poids']]  ?? ''));
            $desc    = trim((string)($row[$cols['desc_detaillee']] ?? ''));

            // Forward-fill AXE et O#
            if (!empty($axeRaw)) $currentAxe  = $axeRaw;
            if (!empty($oNum))   $currentONum  = $oNum;

            if (empty($enonce)) continue;

            $typeKrNorm = $this->normHeader($typeKr);

            // ── Ligne OBJECTIF ──────────────────────────────
            if ($typeKrNorm === 'OBJECTIF' && empty($krNum)) {
                if ($currentObj !== null) {
                    $objectifs[] = $currentObj;
                }

                $periodes = $this->extrairePeriodesFromDesc($desc);
                $typeObj  = (str_contains(mb_strtolower($desc), 'entreprise')) ? 'entreprise' : 'equipe';

                // Fallback owner : extraire "Owner : Nom Prénom" depuis la description si le champ OWNER est vide ou un code court
                $ownerFinal = $owner;
                if (empty($ownerFinal) || mb_strlen(trim($ownerFinal)) <= 4) {
                    if (preg_match('/Owner\s*:\s*([^·\n]+)/ui', $desc, $om)) {
                        $ownerFinal = trim($om[1]);
                    }
                }

                $axeLabel  = $axesMap[$currentAxe] ?? ($currentAxe ?? '');
                $primeInfo = $primes[strtoupper((string)$currentONum)] ?? null;
                $prime     = $primeInfo['montant'] ?? null;

                $currentObj = [
                    'numero'            => $currentONum,
                    'titre'             => $enonce,
                    'axe_label'         => $axeLabel,
                    'axe_numero'        => $currentAxe ? (int)$currentAxe : null,
                    'owner'             => $ownerFinal,
                    'type'              => $typeObj,
                    'periodes_detectees' => $periodes,
                    'prime'             => $prime,
                    'note_contexte'     => $desc,
                    'importer'          => true,
                    'resultats_cles'    => [],
                    'taches_directes'   => [],
                ];

            // ── Ligne KR ────────────────────────────────────
            } elseif (!empty($krNum) && $currentObj !== null) {
                $poids      = $this->parseFr($poidsRaw);
                $valCible   = is_numeric($cible) ? (float)$cible : $this->parseFr((string)$cible);
                $unite      = ($uniteRaw === '—' || $uniteRaw === '-' || $uniteRaw === '') ? null : $uniteRaw;
                $typeMapped = $this->mapperTypeKr($typeKr);

                $currentObj['resultats_cles'][] = [
                    'numero'              => $krNum,
                    'description'         => $enonce,
                    'description_detaillee' => $desc,
                    'type_kr'             => $typeKr,
                    'type_mapped'         => $typeMapped,
                    'valeur_cible'        => $valCible,
                    'unite'               => $unite,
                    'poids'               => $poids ?? 1.0,
                    'owner'               => $owner,
                    'importer'            => true,
                    'taches'              => [],
                ];
            }
        }

        if ($currentObj !== null) {
            $objectifs[] = $currentObj;
        }

        return $objectifs;
    }

    private function parseTachesDetaillees(Worksheet $sheet): array
    {
        $data = $sheet->toArray(null, true, false, true);
        $headerRow = null;

        $tacheHeaderMarkers = ['O#', 'KR#', 'OWNER', 'FREQUENCE', 'PRIORITE'];
        foreach ($data as $rowIdx => $row) {
            $score = 0;
            foreach ($row as $cell) {
                $norm = $this->normHeader((string)$cell);
                if (in_array($norm, $tacheHeaderMarkers) || str_contains($norm, 'TITRE TACHE')) {
                    $score++;
                }
            }
            if ($score >= 3) {
                $headerRow = $rowIdx;
                break;
            }
        }

        if ($headerRow === null) return [];

        $cols = $this->mapperColonnesV2($data[$headerRow], [
            'o_num'       => ['O#'],
            'kr_num'      => ['KR#'],
            'type'        => ['TYPE'],
            'titre'       => ['TITRE TACHE', 'TITRE'],
            'owner'       => ['OWNER'],
            'frequence'   => ['FREQUENCE'],
            'priorite'    => ['PRIORITE'],
            'desc_mode'   => ['DESCRIPTION & CONTEXTE', 'DESCRIPTION', 'CONTEXTE'],
            'outils'      => ['OUTILS & RESSOURCES', 'OUTIL'],
            'def_done'    => ['DEFINITION DE DONE', 'DEFINITION'],
        ]);

        $taches = [];
        foreach ($data as $rowIdx => $row) {
            if ($rowIdx <= $headerRow) continue;

            $titre    = trim((string)($row[$cols['titre']]    ?? ''));
            if (empty($titre)) continue;

            $oNum         = strtoupper(trim((string)($row[$cols['o_num']]     ?? '')));
            $krNumRaw     = trim((string)($row[$cols['kr_num']]    ?? ''));
            $type         = trim((string)($row[$cols['type']]      ?? ''));
            $owner        = trim((string)($row[$cols['owner']]     ?? ''));
            $frequence    = trim((string)($row[$cols['frequence']] ?? ''));
            $prioriteRaw  = trim((string)($row[$cols['priorite']]  ?? ''));
            $descModeRaw  = trim((string)($row[$cols['desc_mode']] ?? ''));
            $outilsRaw    = trim((string)($row[$cols['outils']]    ?? ''));
            $defDoneRaw   = trim((string)($row[$cols['def_done']]  ?? ''));

            [$description, $modeOperatoire] = $this->splitModeOperatoire($descModeRaw);
            $priorite  = $this->normalizePrioriteV2($this->stripEmoji($prioriteRaw));
            $outils    = $this->splitListe($outilsRaw, '·');
            $defDone   = $this->splitListe($defDoneRaw, '·');

            // KR# = "—" ou vide → pas de KR direct
            $krNum = ($krNumRaw === '—' || $krNumRaw === '-' || $krNumRaw === '') ? null : $krNumRaw;

            $taches[] = [
                'o_num'          => $oNum,
                'kr_num'         => $krNum,
                'categorie'      => $type,
                'titre'          => $titre,
                'owner'          => $owner,
                'frequence'      => $frequence,
                'priorite'       => $priorite,
                'description'    => $description,
                'mode_operatoire' => $modeOperatoire,
                'outils'         => implode(' · ', array_filter($outils)),
                'definition_done' => $defDone,
                'importer'       => true,
            ];
        }

        return $taches;
    }

    private function joinTachesAuxObjectifs(array &$objectifs, array $taches): void
    {
        // Index par O# et par (O#, KR#)
        $objectifMap = [];
        $krMap       = [];
        foreach ($objectifs as $oi => $obj) {
            $objectifMap[strtoupper((string)$obj['numero'])] = $oi;
            foreach ($obj['resultats_cles'] as $ki => $kr) {
                $krMap[strtoupper((string)$obj['numero'])][strtoupper((string)$kr['numero'])] = $ki;
            }
        }

        foreach ($taches as $tache) {
            $oNum  = strtoupper($tache['o_num']);
            $krNum = $tache['kr_num'] ? strtoupper($tache['kr_num']) : null;

            if (!isset($objectifMap[$oNum])) continue;
            $oi = $objectifMap[$oNum];

            $tacheData = [
                'titre'           => $tache['titre'],
                'owner'           => $tache['owner'],
                'categorie'       => $tache['categorie'],
                'frequence'       => $tache['frequence'],
                'priorite'        => $tache['priorite'],
                'description'     => $tache['description'],
                'mode_operatoire' => $tache['mode_operatoire'],
                'outils'          => $tache['outils'],
                'definition_done' => $tache['definition_done'],
                'importer'        => true,
            ];

            if ($krNum === null) {
                // KR# = "—" → attaché à l'objectif directement
                $objectifs[$oi]['taches_directes'][] = $tacheData;
            } elseif (isset($krMap[$oNum][$krNum])) {
                // Correspondance exacte
                $ki = $krMap[$oNum][$krNum];
                $objectifs[$oi]['resultats_cles'][$ki]['taches'][] = $tacheData;
            } else {
                // KR composé "KR1A/B/C" → tenter correspondance partielle ou attacher au 1er KR
                $matched = false;
                // Essayer chaque partie du KR composé (ex: KR1A, KR1B)
                foreach (preg_split('/[\/,]+/', $krNum) as $part) {
                    $part = trim($part);
                    if (!empty($part) && isset($krMap[$oNum][$part])) {
                        $ki = $krMap[$oNum][$part];
                        $objectifs[$oi]['resultats_cles'][$ki]['taches'][] = array_merge(
                            $tacheData, ['kr_couverts' => $krNum]
                        );
                        $matched = true;
                        break;
                    }
                }

                if (!$matched) {
                    // Fallback : attacher à l'objectif directement
                    $objectifs[$oi]['taches_directes'][] = array_merge(
                        $tacheData, ['kr_couverts' => $krNum]
                    );
                }
            }
        }
    }

    // ─── Helpers V2 ─────────────────────────────────────────

    private function deduplicerNoms(array $noms): array
    {
        $result = [];
        foreach ($noms as $i => $nom) {
            $estDoublon = false;
            foreach ($noms as $j => $autre) {
                if ($i === $j) continue;
                if (mb_strlen($autre) > mb_strlen($nom) &&
                    str_contains(mb_strtolower($autre), mb_strtolower($nom))) {
                    $estDoublon = true;
                    break;
                }
            }
            if (!$estDoublon) $result[] = $nom;
        }
        return array_values($result);
    }

    private function parseFr($valeur): ?float
    {
        if ($valeur === null || $valeur === '') return null;
        if (is_float($valeur) || is_int($valeur)) return (float)$valeur;

        $str = trim((string)$valeur);
        if ($str === '' || $str === chr(226).chr(128).chr(148) || $str === '-' || $str === chr(226).chr(128).chr(147)) return null;

        // Supprimer espaces normaux, insecables et sauts de ligne
        $str = preg_replace('/[\s\xc2\xa0\xe2\x80\xaf\r\n]+/u', '', $str);

        $nbVirgules = substr_count($str, ',');
        $nbPoints   = substr_count($str, '.');
        if ($nbVirgules === 1 && $nbPoints === 0) {
            $str = str_replace(',', '.', $str);
        } elseif ($nbVirgules >= 1) {
            $str = str_replace(',', '', $str);
        }

        return is_numeric($str) ? (float)$str : null;
    }
    private function stripEmoji(string $text): string
    {
        return trim(preg_replace(
            '/[\x{1F000}-\x{1FFFF}]|[\x{2600}-\x{27BF}]|[\x{FE00}-\x{FEFF}]/u',
            '',
            $text
        ));
    }

    private function splitOwners(string $raw): array
    {
        if (empty($raw)) return [];
        $tokens = preg_split('/[\+\/,\n]+/', $raw);
        return array_values(array_filter(array_map('trim', $tokens), fn ($t) => mb_strlen($t) > 1));
    }

    private function resolveOwnerAlias(string $owner, array $visionnaires): string
    {
        if (empty($owner)) return '';
        $ownerTrimmed = trim($owner);

        // 1. Résolution via alias code (ex: "DIR" → nom réel)
        $ownerUpper = mb_strtoupper($ownerTrimmed);
        if (isset($visionnaires[$ownerUpper])) {
            $v = $visionnaires[$ownerUpper];
            return $v['alias_pour'] ?? $v['nom'];
        }

        // 2. Correspondance exacte insensible à la casse dans la feuille VISION
        foreach ($visionnaires as $nom => $data) {
            if (mb_strtolower($nom) === mb_strtolower($ownerTrimmed)) return $nom;
        }

        // 3. Correspondance partielle dans la feuille VISION
        foreach ($visionnaires as $nom => $data) {
            if (str_contains(mb_strtolower($nom), mb_strtolower($ownerTrimmed)) ||
                str_contains(mb_strtolower($ownerTrimmed), mb_strtolower($nom))) {
                return $nom;
            }
        }

        // 4. Fallback : retourner le nom tel quel (sera utilisé pour créer/matcher le collaborateur)
        return $ownerTrimmed;
    }

    private function extrairePeriodesFromDesc(string $desc): array
    {
        if (empty($desc)) return [];

        $periodes = [];
        // Période : Q3 2026 ou Q3–Q4 2026
        if (preg_match('/P[ée]riode\s*:\s*(Q[\d]+(?:\s*[–\-]\s*Q[\d]+)?\s+\d{4})/u', $desc, $m)) {
            $raw = trim($m[1]);
            if (preg_match('/^(Q\d+)\s*[–\-]\s*(Q\d+)\s+(\d{4})$/u', $raw, $rm)) {
                $periodes[] = $rm[1] . ' ' . $rm[3];
                $periodes[] = $rm[2] . ' ' . $rm[3];
            } elseif (preg_match('/^(Q\d+)\s+(\d{4})$/u', $raw, $rm)) {
                $periodes[] = $rm[1] . ' ' . $rm[2];
            } else {
                $periodes[] = $raw;
            }
        }

        return $periodes;
    }

    private function splitModeOperatoire(string $raw): array
    {
        if (empty($raw)) return ['', []];

        // Chercher le séparateur "MODE OPÉRATOIRE :" (avec ou sans accent)
        $sep = null;
        foreach (['MODE OPÉRATOIRE :', 'MODE OPERATOIRE :'] as $candidate) {
            $pos = mb_strpos(mb_strtoupper($raw), mb_strtoupper($candidate));
            if ($pos !== false) {
                $sep = $pos;
                $sepLen = mb_strlen($candidate);
                break;
            }
        }

        if ($sep === null) return [trim($raw), []];

        $description = trim(mb_substr($raw, 0, $sep));
        $modeRaw     = trim(mb_substr($raw, $sep + $sepLen));

        if (empty($modeRaw)) return [$description, []];

        // Découper sur les étapes numérotées "1. 2. 3. …"
        $parts = preg_split('/(?=\n?\s*\d+\.\s)/u', $modeRaw);
        $steps = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if (!empty($part)) $steps[] = $part;
        }

        return [$description, $steps ?: [$modeRaw]];
    }

    private function splitListe(string $raw, string $sep = '·'): array
    {
        if (empty($raw)) return [];
        return array_values(array_filter(array_map('trim', explode($sep, $raw))));
    }

    private function mapperTypeKr(string $type): string
    {
        return match(mb_strtolower(trim($type))) {
            'nombre'      => 'quantitatif',
            'pourcentage' => 'pourcentage',
            'score'       => 'quantitatif',
            'montant'     => 'financier',
            'binaire'     => 'booleen',
            default       => 'quantitatif',
        };
    }

    private function normalizePrioriteV2(string $priorite): string
    {
        $p = mb_strtolower(trim($priorite));
        if (str_contains($p, 'haute'))   return 'haute';
        if (str_contains($p, 'moyenne')) return 'normale';
        if (str_contains($p, 'basse'))   return 'basse';
        return 'normale';
    }

    private function extraireCollaborateursV2(array $objectifs, array $taches, array $visionnaires): array
    {
        $collabs = [];

        $add = function (string $owner) use (&$collabs, $visionnaires) {
            foreach ($this->splitOwners($owner) as $o) {
                $resolved = $this->resolveOwnerAlias($o, $visionnaires);
                if ($resolved && !in_array($resolved, $collabs)) $collabs[] = $resolved;
            }
        };

        foreach ($objectifs as $obj) {
            $add($obj['owner'] ?? '');
            foreach ($obj['resultats_cles'] as $kr) {
                $add($kr['owner'] ?? '');
            }
        }

        foreach ($taches as $tache) {
            $add($tache['owner'] ?? '');
        }

        return $collabs;
    }

    private function normHeader(string $v): string
    {
        $v = mb_strtoupper(trim($v));
        return strtr($v, [
            'É' => 'E', 'È' => 'E', 'Ê' => 'E', 'Ë' => 'E',
            'À' => 'A', 'Â' => 'A', 'Î' => 'I', 'Ï' => 'I',
            'Ô' => 'O', 'Ù' => 'U', 'Û' => 'U', 'Ü' => 'U',
            'Ç' => 'C', 'Œ' => 'OE', 'Æ' => 'AE',
        ]);
    }

    private function mapperColonnesV2(array $row, array $aliases): array
    {
        $map = array_fill_keys(array_keys($aliases), null);

        // Passe 1 : correspondance EXACTE (évite les faux positifs de str_contains)
        foreach ($row as $col => $val) {
            $norm = $this->normHeader((string)$val);
            foreach ($aliases as $field => $patterns) {
                if ($map[$field] !== null) continue;
                foreach ($patterns as $pattern) {
                    if ($norm === $pattern) {
                        $map[$field] = $col;
                        break;
                    }
                }
            }
        }

        // Passe 2 : correspondance partielle (str_contains) pour les champs encore non mappés
        foreach ($row as $col => $val) {
            $norm = $this->normHeader((string)$val);
            foreach ($aliases as $field => $patterns) {
                if ($map[$field] !== null) continue;
                foreach ($patterns as $pattern) {
                    if (str_contains($norm, $pattern)) {
                        $map[$field] = $col;
                        break;
                    }
                }
            }
        }

        return $map;
    }

    private function getSheetByName(Spreadsheet $spreadsheet, string $name): ?Worksheet
    {
        $normTarget = $this->normHeader($name);
        foreach ($spreadsheet->getSheetNames() as $i => $sheetName) {
            if ($this->normHeader($sheetName) === $normTarget) {
                return $spreadsheet->getSheet($i);
            }
        }
        return null;
    }

    // ─── Méthodes V1 (inchangées) ────────────────────────────

    private function detecterLigneEntete(array $data): int
    {
        $motsCles = ['ENTITE', 'THEME', 'PRIORITE', 'DEPARTEMENT', 'PROCHAINES ACTIONS', 'RESPONSABLE'];

        foreach ($data as $index => $row) {
            $rowUpper = array_map(fn ($v) => strtoupper(trim((string)$v)), $row);
            $matches = 0;
            foreach ($motsCles as $mot) {
                if (in_array($mot, $rowUpper)) $matches++;
            }
            if ($matches >= 3) return $index;
        }

        return 3;
    }

    private function mapperColonnes(array $entetes): array
    {
        $map = [
            'entite' => null, 'theme' => null, 'priorite' => null, 'departement' => null,
            'prochaines_actions' => null, 'date_debut' => null, 'date_cible' => null,
            'responsable' => null, 'pourcentage' => null, 'status' => null,
        ];

        $aliases = [
            'entite'             => ['ENTITE', 'ENTITÉ', 'ENTITY', 'SOCIETE', 'SOCIÉTÉ'],
            'theme'              => ['THEME', 'THÈME', 'PROJET', 'ACTION', 'TITRE'],
            'priorite'           => ['PRIORITE', 'PRIORITÉ', 'PRIO', 'P'],
            'departement'        => ['DEPARTEMENT', 'DÉPARTEMENT', 'DEPT', 'DIRECTION', 'SERVICE'],
            'prochaines_actions' => ['PROCHAINES ACTIONS', 'ACTIONS', 'NEXT STEPS', 'TACHES', 'TÂCHES'],
            'date_debut'         => ['DATE DEBUT', 'DATE DÉBUT', 'DEBUT', 'DÉBUT', 'START'],
            'date_cible'         => ['DATE CIBLE', 'DATE FIN', 'ECHEANCE', 'ÉCHÉANCE', 'DEADLINE', 'TARGET'],
            'responsable'        => ['RESPONSABLE', 'RESPONSABLES', 'RESP', 'PILOTE', 'OWNER'],
            'pourcentage'        => ['POURCENTAGE', "POURCENTAGE D'EXECUTION", "POURCENTAGE D'EXÉCUTION", '% EXEC', '%', 'PROGRESSION', 'AVANCEMENT'],
            'status'             => ["STATUS D'AVANCEMENT", "STATUT D'AVANCEMENT", 'STATUS', 'STATUT', 'COMMENTAIRES'],
        ];

        foreach ($entetes as $col => $valeur) {
            $valeurUpper = strtoupper(trim((string)$valeur));
            foreach ($aliases as $champ => $possibles) {
                if (in_array($valeurUpper, $possibles) || $this->contientMotCle($valeurUpper, $possibles)) {
                    if ($map[$champ] === null) $map[$champ] = $col;
                }
            }
        }

        $defaultCols   = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        $defaultFields = ['entite', 'theme', 'priorite', 'departement', 'prochaines_actions', 'date_debut', 'date_cible', 'responsable', 'pourcentage', 'status'];
        foreach ($defaultFields as $i => $field) {
            if ($map[$field] === null && isset($defaultCols[$i])) $map[$field] = $defaultCols[$i];
        }

        return $map;
    }

    private function contientMotCle(string $valeur, array $motsCles): bool
    {
        foreach ($motsCles as $mot) {
            if (str_contains($valeur, $mot)) return true;
        }
        return false;
    }

    private function extraireLignesDonnees(array $data, int $ligneEntete, array $colonneMap): array
    {
        $lignes = [];
        $lignesVides = 0;

        foreach ($data as $index => $row) {
            if ($index <= $ligneEntete) continue;

            $theme = trim((string)($row[$colonneMap['theme']] ?? ''));

            if (empty($theme)) {
                $lignesVides++;
                if ($lignesVides >= 3) break;
                continue;
            }
            $lignesVides = 0;

            $lignes[] = ['ligne' => $index, 'row' => $row];
        }

        return $lignes;
    }

    private function estLigneMacro(array $row, array $colonneMap): bool
    {
        $theme       = trim((string)($row[$colonneMap['theme']] ?? ''));
        $priorite    = trim((string)($row[$colonneMap['priorite']] ?? ''));
        $departement = trim((string)($row[$colonneMap['departement']] ?? ''));
        $actions     = trim((string)($row[$colonneMap['prochaines_actions']] ?? ''));
        $responsable = trim((string)($row[$colonneMap['responsable']] ?? ''));

        if (empty($theme)) return false;

        $champsVidesCount = 0;
        if (empty($priorite))    $champsVidesCount++;
        if (empty($departement)) $champsVidesCount++;
        if (empty($actions))     $champsVidesCount++;
        if (empty($responsable)) $champsVidesCount++;

        $estMajuscules = mb_strtoupper($theme) === $theme && mb_strlen($theme) > 15;

        if ($champsVidesCount >= 3 && $estMajuscules) return true;
        if (empty($priorite) && empty($departement) && empty($actions) && mb_strlen($theme) > 10) return true;

        return false;
    }

    private function construireArborescence(array $lignes, array $colonneMap): array
    {
        $objectifs      = [];
        $currentObjectif = null;
        $orphelins      = [];

        foreach ($lignes as $ligneData) {
            $row      = $ligneData['row'];
            $numLigne = $ligneData['ligne'];

            if ($this->estLigneMacro($row, $colonneMap)) {
                if ($currentObjectif !== null) $objectifs[] = $currentObjectif;

                $theme    = trim((string)($row[$colonneMap['theme']] ?? ''));
                $entite   = $this->normaliserEntite(trim((string)($row[$colonneMap['entite']] ?? '')));
                $progress = $this->normaliserProgression($row[$colonneMap['pourcentage']] ?? null);

                $currentObjectif = [
                    'ligne' => $numLigne, 'titre' => $theme, 'axe_label' => $entite,
                    'progression' => $progress, 'importer' => true, 'resultats_cles' => [],
                ];
            } else {
                $kr = $this->extraireKR($row, $colonneMap, $numLigne);

                if ($currentObjectif !== null) {
                    $currentObjectif['resultats_cles'][] = $kr;
                    if (empty($currentObjectif['axe_label']) && !empty($kr['axe_label'])) {
                        $currentObjectif['axe_label'] = $kr['axe_label'];
                    }
                } else {
                    $orphelins[] = $kr;
                }
            }
        }

        if ($currentObjectif !== null) $objectifs[] = $currentObjectif;

        if (!empty($orphelins)) {
            $objectifs[] = [
                'ligne' => 0, 'titre' => 'Divers / Actions autonomes',
                'axe_label' => $orphelins[0]['axe_label'] ?? '', 'progression' => 0,
                'importer' => true, 'resultats_cles' => $orphelins,
            ];
        }

        return $objectifs;
    }

    private function extraireKR(array $row, array $colonneMap, int $numLigne): array
    {
        $theme          = trim((string)($row[$colonneMap['theme']] ?? ''));
        $entite         = $this->normaliserEntite(trim((string)($row[$colonneMap['entite']] ?? '')));
        $priorite       = $this->normaliserPriorite(trim((string)($row[$colonneMap['priorite']] ?? '')));
        $departement    = trim((string)($row[$colonneMap['departement']] ?? ''));
        $actionsRaw     = trim((string)($row[$colonneMap['prochaines_actions']] ?? ''));
        $dateDebut      = $this->normaliserDate($row[$colonneMap['date_debut']] ?? null);
        $dateCible      = $this->normaliserDate($row[$colonneMap['date_cible']] ?? null);
        $responsablesRaw = trim((string)($row[$colonneMap['responsable']] ?? ''));
        $progression    = $this->normaliserProgression($row[$colonneMap['pourcentage']] ?? null);
        $statusRaw      = trim((string)($row[$colonneMap['status']] ?? ''));

        $taches = $this->parserTaches($actionsRaw);

        return [
            'ligne'             => $numLigne,
            'description'       => $theme,
            'description_detaillee' => '',
            'axe_label'         => $entite,
            'progression'       => $progression,
            'priorite'          => $priorite,
            'departement'       => $departement,
            'date_debut'        => $dateDebut['valeur'],
            'date_debut_invalide' => $dateDebut['invalide'],
            'date_debut_brute'  => $dateDebut['brute'],
            'date_cible'        => $dateCible['valeur'],
            'date_cible_invalide' => $dateCible['invalide'],
            'date_cible_brute'  => $dateCible['brute'],
            'responsables_bruts' => $responsablesRaw,
            'responsables'      => $this->parserResponsables($responsablesRaw),
            'note_status'       => $statusRaw,
            'importer'          => true,
            'taches'            => $taches,
        ];
    }

    private function normaliserEntite(string $entite): string
    {
        if (empty($entite)) return '';

        $corrections = ['CONAKY TERMINAL' => 'CONAKRY TERMINAL', 'CONAKRY TERMINALE' => 'CONAKRY TERMINAL'];
        $upper = mb_strtoupper($entite);

        foreach ($corrections as $faute => $correction) {
            if ($upper === $faute) {
                $this->corrections[] = ['type' => 'entite', 'avant' => $entite, 'apres' => $correction,
                    'message' => "Coquille corrigée : « {$entite} » → « {$correction} »"];
                return $correction;
            }
        }

        return $entite;
    }

    private function normaliserPriorite(string $priorite): string
    {
        if (empty($priorite)) return '';

        $upper  = strtoupper(trim($priorite));
        $valides = ['P1', 'P2', 'P3', 'P4'];

        if (in_array($upper, $valides)) {
            if ($upper !== $priorite) {
                $this->corrections[] = ['type' => 'priorite', 'avant' => $priorite, 'apres' => $upper,
                    'message' => "Priorité normalisée : « {$priorite} » → « {$upper} »"];
            }
            return $upper;
        }

        return $priorite;
    }

    private function normaliserDate($valeur): array
    {
        if (empty($valeur)) return ['valeur' => null, 'invalide' => false, 'brute' => null];

        if (is_numeric($valeur)) {
            try {
                $date = ExcelDate::excelToDateTimeObject((float)$valeur);
                return ['valeur' => Carbon::instance($date)->format('Y-m-d'), 'invalide' => false, 'brute' => (string)$valeur];
            } catch (\Exception $e) {
                return ['valeur' => null, 'invalide' => true, 'brute' => (string)$valeur];
            }
        }

        $valeurStr = trim((string)$valeur);

        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{5,})$/', $valeurStr, $m)) {
            $anneeCorrigee = substr($m[3], 0, 4);
            $valeurStr = "{$m[1]}/{$m[2]}/{$anneeCorrigee}";
            $this->corrections[] = ['type' => 'date', 'avant' => (string)$valeur, 'apres' => $valeurStr,
                'message' => "Date corrigée : « {$valeur} » → « {$valeurStr} »"];
        }

        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $valeurStr, $m)) {
            $jour = (int)$m[1]; $mois = (int)$m[2]; $annee = (int)$m[3];
            if (!checkdate($mois, $jour, $annee) && $mois >= 1 && $mois <= 12 && $annee >= 1 && $annee <= 9999) {
                $dernierJour  = cal_days_in_month(CAL_GREGORIAN, $mois, $annee);
                if ($jour > $dernierJour) {
                    $dateCorrigee = "{$dernierJour}/{$m[2]}/{$m[3]}";
                    $this->corrections[] = ['type' => 'date', 'avant' => $valeurStr, 'apres' => $dateCorrigee,
                        'message' => "Date corrigée (jour invalide) : « {$valeurStr} » → « {$dateCorrigee} »"];
                    $valeurStr = $dateCorrigee;
                }
            }
        }

        try {
            $parsed = Carbon::createFromFormat('d/m/Y', $valeurStr);
            if ($parsed) return ['valeur' => $parsed->format('Y-m-d'), 'invalide' => false, 'brute' => (string)$valeur];
        } catch (\Exception $e) {
            // continue
        }

        try {
            $parsed = Carbon::parse($valeurStr);
            return ['valeur' => $parsed->format('Y-m-d'), 'invalide' => false, 'brute' => (string)$valeur];
        } catch (\Exception $e) {
            return ['valeur' => null, 'invalide' => true, 'brute' => (string)$valeur];
        }
    }

    private function normaliserProgression($valeur): float
    {
        if (empty($valeur) && $valeur !== 0 && $valeur !== '0') return 0;

        $v = (float)$valeur;
        if ($v >= 0 && $v <= 1)   return round($v * 100, 1);
        if ($v > 1 && $v <= 100)  return round($v, 1);
        if ($v > 100) {
            $this->corrections[] = ['type' => 'progression', 'avant' => $valeur, 'apres' => 100,
                'message' => "Progression clampée : {$valeur} → 100"];
            return 100;
        }

        return max(0, round($v, 1));
    }

    private function parserResponsables(string $raw): array
    {
        if (empty($raw)) return [];

        $tokens = preg_split('/[\/\n,]+/', $raw);
        $responsables = [];
        foreach ($tokens as $token) {
            $token = trim($token);
            if (!empty($token) && mb_strlen($token) > 1) $responsables[] = $token;
        }

        return array_values(array_unique($responsables));
    }

    private function parserTaches(string $raw): array
    {
        if (empty($raw)) return [];

        $items = preg_split('/(?:^|\n)\s*[\*\-•]\s*/u', $raw);
        $taches = [];

        foreach ($items as $item) {
            $item = trim($item);
            if (!empty($item) && mb_strlen($item) > 2) $taches[] = ['titre' => $item, 'importer' => true];
        }

        if (empty($taches) && str_contains($raw, "\n")) {
            foreach (explode("\n", $raw) as $line) {
                $line = trim($line);
                if (!empty($line) && mb_strlen($line) > 2) $taches[] = ['titre' => $line, 'importer' => true];
            }
        }

        if (empty($taches) && mb_strlen($raw) > 5) {
            $taches[] = ['titre' => $raw, 'importer' => true];
        }

        return $taches;
    }

    private function extraireAxes(array $lignes, array $colonneMap): array
    {
        $axes = [];
        foreach ($lignes as $ligneData) {
            $entite = $this->normaliserEntite(trim((string)($ligneData['row'][$colonneMap['entite']] ?? '')));
            if (!empty($entite) && !in_array($entite, $axes)) $axes[] = $entite;
        }
        return $axes;
    }

    private function extraireCollaborateurs(array $lignes, array $colonneMap): array
    {
        $collabs = [];
        foreach ($lignes as $ligneData) {
            $raw    = trim((string)($ligneData['row'][$colonneMap['responsable']] ?? ''));
            $parsed = $this->parserResponsables($raw);
            foreach ($parsed as $nom) {
                if (!in_array($nom, $collabs)) $collabs[] = $nom;
            }
        }
        return $collabs;
    }
}
