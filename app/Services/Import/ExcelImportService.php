<?php

namespace App\Services\Import;

use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Carbon\Carbon;

class ExcelImportService
{
    private array $corrections = [];

    /**
     * Parse un fichier Excel et retourne la structure détectée.
     */
    public function parse(UploadedFile $file): array
    {
        $this->corrections = [];

        $spreadsheet = IOFactory::load($file->getPathname());
        $feuilles = $spreadsheet->getSheetNames();
        $sheet = $spreadsheet->getActiveSheet();
        $data = $sheet->toArray(null, true, true, true);

        // Détection de la ligne d'entête
        $ligneEntete = $this->detecterLigneEntete($data);
        $entetes = $data[$ligneEntete] ?? [];

        // Mapping des colonnes
        $colonneMap = $this->mapperColonnes($entetes);

        // Extraction des lignes de données (après l'entête, jusqu'à la première ligne vide ou légende)
        $lignesDonnees = $this->extraireLignesDonnees($data, $ligneEntete, $colonneMap);

        // Détection de hiérarchie et construction de l'arbre
        $objectifs = $this->construireArborescence($lignesDonnees, $colonneMap);

        // Extraction des axes et collaborateurs uniques
        $axesDetectes = $this->extraireAxes($lignesDonnees, $colonneMap);
        $collaborateursDetectes = $this->extraireCollaborateurs($lignesDonnees, $colonneMap);

        return [
            'meta' => [
                'fichier' => $file->getClientOriginalName(),
                'feuille' => $sheet->getTitle(),
                'feuilles_disponibles' => $feuilles,
                'ligne_entete' => $ligneEntete,
                'nb_lignes' => count($lignesDonnees),
            ],
            'axes_detectes' => $axesDetectes,
            'collaborateurs_detectes' => $collaborateursDetectes,
            'corrections' => $this->corrections,
            'objectifs' => $objectifs,
        ];
    }

    /**
     * Détecte la ligne d'entête en cherchant les mots-clés.
     */
    private function detecterLigneEntete(array $data): int
    {
        $motsCles = ['ENTITE', 'THEME', 'PRIORITE', 'DEPARTEMENT', 'PROCHAINES ACTIONS', 'RESPONSABLE'];

        foreach ($data as $index => $row) {
            $rowUpper = array_map(fn($v) => strtoupper(trim((string)$v)), $row);
            $matches = 0;
            foreach ($motsCles as $mot) {
                if (in_array($mot, $rowUpper)) {
                    $matches++;
                }
            }
            if ($matches >= 3) {
                return $index;
            }
        }

        return 3; // Fallback ligne 3
    }

    /**
     * Mappe les colonnes détectées (A-J) aux champs attendus.
     */
    private function mapperColonnes(array $entetes): array
    {
        $map = [
            'entite' => null,
            'theme' => null,
            'priorite' => null,
            'departement' => null,
            'prochaines_actions' => null,
            'date_debut' => null,
            'date_cible' => null,
            'responsable' => null,
            'pourcentage' => null,
            'status' => null,
        ];

        $aliases = [
            'entite' => ['ENTITE', 'ENTITÉ', 'ENTITY', 'SOCIETE', 'SOCIÉTÉ'],
            'theme' => ['THEME', 'THÈME', 'PROJET', 'ACTION', 'TITRE'],
            'priorite' => ['PRIORITE', 'PRIORITÉ', 'PRIO', 'P'],
            'departement' => ['DEPARTEMENT', 'DÉPARTEMENT', 'DEPT', 'DIRECTION', 'SERVICE'],
            'prochaines_actions' => ['PROCHAINES ACTIONS', 'ACTIONS', 'NEXT STEPS', 'TACHES', 'TÂCHES'],
            'date_debut' => ['DATE DEBUT', 'DATE DÉBUT', 'DEBUT', 'DÉBUT', 'START'],
            'date_cible' => ['DATE CIBLE', 'DATE FIN', 'ECHEANCE', 'ÉCHÉANCE', 'DEADLINE', 'TARGET'],
            'responsable' => ['RESPONSABLE', 'RESPONSABLES', 'RESP', 'PILOTE', 'OWNER'],
            'pourcentage' => ['POURCENTAGE', "POURCENTAGE D'EXECUTION", "POURCENTAGE D'EXÉCUTION", '% EXEC', '%', 'PROGRESSION', 'AVANCEMENT'],
            'status' => ["STATUS D'AVANCEMENT", "STATUT D'AVANCEMENT", 'STATUS', 'STATUT', 'COMMENTAIRES'],
        ];

        foreach ($entetes as $col => $valeur) {
            $valeurUpper = strtoupper(trim((string)$valeur));
            foreach ($aliases as $champ => $possibles) {
                if (in_array($valeurUpper, $possibles) || $this->contientMotCle($valeurUpper, $possibles)) {
                    if ($map[$champ] === null) {
                        $map[$champ] = $col;
                    }
                }
            }
        }

        // Fallback sur colonnes A-J si pas détecté
        $defaultCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        $defaultFields = ['entite', 'theme', 'priorite', 'departement', 'prochaines_actions', 'date_debut', 'date_cible', 'responsable', 'pourcentage', 'status'];
        foreach ($defaultFields as $i => $field) {
            if ($map[$field] === null && isset($defaultCols[$i])) {
                $map[$field] = $defaultCols[$i];
            }
        }

        return $map;
    }

    private function contientMotCle(string $valeur, array $motsCles): bool
    {
        foreach ($motsCles as $mot) {
            if (str_contains($valeur, $mot)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extrait les lignes de données (après entête, avant légende).
     */
    private function extraireLignesDonnees(array $data, int $ligneEntete, array $colonneMap): array
    {
        $lignes = [];
        $lignesVides = 0;

        foreach ($data as $index => $row) {
            if ($index <= $ligneEntete) continue;

            $theme = trim((string)($row[$colonneMap['theme']] ?? ''));

            // Arrêter si 3 lignes vides consécutives
            if (empty($theme)) {
                $lignesVides++;
                if ($lignesVides >= 3) break;
                continue;
            }
            $lignesVides = 0;

            $lignes[] = [
                'ligne' => $index,
                'row' => $row,
            ];
        }

        return $lignes;
    }

    /**
     * Détermine si une ligne est un macro-thème (futur Objectif parent).
     */
    private function estLigneMacro(array $row, array $colonneMap): bool
    {
        $theme = trim((string)($row[$colonneMap['theme']] ?? ''));
        $priorite = trim((string)($row[$colonneMap['priorite']] ?? ''));
        $departement = trim((string)($row[$colonneMap['departement']] ?? ''));
        $actions = trim((string)($row[$colonneMap['prochaines_actions']] ?? ''));
        $responsable = trim((string)($row[$colonneMap['responsable']] ?? ''));

        if (empty($theme)) return false;

        // Critère 1 : B rempli + C/D/E/H vides ou peu remplis + titre en majuscules
        $champsVidesCount = 0;
        if (empty($priorite)) $champsVidesCount++;
        if (empty($departement)) $champsVidesCount++;
        if (empty($actions)) $champsVidesCount++;
        if (empty($responsable)) $champsVidesCount++;

        // Titre entièrement en majuscules et > 15 caractères
        $estMajuscules = mb_strtoupper($theme) === $theme && mb_strlen($theme) > 15;

        // Si majorité des champs vides ET titre en majuscules → macro
        if ($champsVidesCount >= 3 && $estMajuscules) {
            return true;
        }

        // Si C, D, E tous vides → macro (même si pas en majuscules)
        if (empty($priorite) && empty($departement) && empty($actions) && mb_strlen($theme) > 10) {
            return true;
        }

        return false;
    }

    /**
     * Construit l'arborescence Objectif → KR → Tâches.
     */
    private function construireArborescence(array $lignes, array $colonneMap): array
    {
        $objectifs = [];
        $currentObjectif = null;
        $orphelins = [];

        foreach ($lignes as $ligneData) {
            $row = $ligneData['row'];
            $numLigne = $ligneData['ligne'];

            if ($this->estLigneMacro($row, $colonneMap)) {
                // Sauvegarder l'objectif précédent
                if ($currentObjectif !== null) {
                    $objectifs[] = $currentObjectif;
                }

                $theme = trim((string)($row[$colonneMap['theme']] ?? ''));
                $entite = $this->normaliserEntite(trim((string)($row[$colonneMap['entite']] ?? '')));
                $progression = $this->normaliserProgression($row[$colonneMap['pourcentage']] ?? null);

                $currentObjectif = [
                    'ligne' => $numLigne,
                    'titre' => $theme,
                    'axe_label' => $entite,
                    'progression' => $progression,
                    'importer' => true,
                    'resultats_cles' => [],
                ];
            } else {
                // Ligne détail → KR
                $kr = $this->extraireKR($row, $colonneMap, $numLigne);

                if ($currentObjectif !== null) {
                    $currentObjectif['resultats_cles'][] = $kr;
                    // Mettre à jour l'axe de l'objectif si pas encore défini
                    if (empty($currentObjectif['axe_label']) && !empty($kr['axe_label'])) {
                        $currentObjectif['axe_label'] = $kr['axe_label'];
                    }
                } else {
                    $orphelins[] = $kr;
                }
            }
        }

        // Ajouter le dernier objectif
        if ($currentObjectif !== null) {
            $objectifs[] = $currentObjectif;
        }

        // Créer un objectif "Divers / Autonome" pour les orphelins
        if (!empty($orphelins)) {
            $objectifs[] = [
                'ligne' => 0,
                'titre' => 'Divers / Actions autonomes',
                'axe_label' => $orphelins[0]['axe_label'] ?? '',
                'progression' => 0,
                'importer' => true,
                'resultats_cles' => $orphelins,
            ];
        }

        return $objectifs;
    }

    /**
     * Extrait un KR depuis une ligne détail.
     */
    private function extraireKR(array $row, array $colonneMap, int $numLigne): array
    {
        $theme = trim((string)($row[$colonneMap['theme']] ?? ''));
        $entite = $this->normaliserEntite(trim((string)($row[$colonneMap['entite']] ?? '')));
        $priorite = $this->normaliserPriorite(trim((string)($row[$colonneMap['priorite']] ?? '')));
        $departement = trim((string)($row[$colonneMap['departement']] ?? ''));
        $actionsRaw = trim((string)($row[$colonneMap['prochaines_actions']] ?? ''));
        $dateDebut = $this->normaliserDate($row[$colonneMap['date_debut']] ?? null);
        $dateCible = $this->normaliserDate($row[$colonneMap['date_cible']] ?? null);
        $responsablesRaw = trim((string)($row[$colonneMap['responsable']] ?? ''));
        $progression = $this->normaliserProgression($row[$colonneMap['pourcentage']] ?? null);
        $statusRaw = trim((string)($row[$colonneMap['status']] ?? ''));

        // Parser les tâches depuis les prochaines actions
        $taches = $this->parserTaches($actionsRaw);

        return [
            'ligne' => $numLigne,
            'description' => $theme,
            'description_detaillee' => '',
            'axe_label' => $entite,
            'progression' => $progression,
            'priorite' => $priorite,
            'departement' => $departement,
            'date_debut' => $dateDebut['valeur'],
            'date_debut_invalide' => $dateDebut['invalide'],
            'date_debut_brute' => $dateDebut['brute'],
            'date_cible' => $dateCible['valeur'],
            'date_cible_invalide' => $dateCible['invalide'],
            'date_cible_brute' => $dateCible['brute'],
            'responsables_bruts' => $responsablesRaw,
            'responsables' => $this->parserResponsables($responsablesRaw),
            'note_status' => $statusRaw,
            'importer' => true,
            'taches' => $taches,
        ];
    }

    /**
     * Normalise le nom d'entité (corrige les coquilles).
     */
    private function normaliserEntite(string $entite): string
    {
        if (empty($entite)) return '';

        $corrections = [
            'CONAKY TERMINAL' => 'CONAKRY TERMINAL',
            'CONAKRY TERMINALE' => 'CONAKRY TERMINAL',
        ];

        $upper = mb_strtoupper($entite);
        foreach ($corrections as $faute => $correction) {
            if ($upper === $faute) {
                $this->corrections[] = [
                    'type' => 'entite',
                    'avant' => $entite,
                    'apres' => $correction,
                    'message' => "Coquille corrigée : « {$entite} » → « {$correction} »",
                ];
                return $correction;
            }
        }

        return $entite;
    }

    /**
     * Normalise la priorité.
     */
    private function normaliserPriorite(string $priorite): string
    {
        if (empty($priorite)) return '';

        $upper = strtoupper(trim($priorite));
        $valides = ['P1', 'P2', 'P3', 'P4'];

        if (in_array($upper, $valides)) {
            if ($upper !== $priorite) {
                $this->corrections[] = [
                    'type' => 'priorite',
                    'avant' => $priorite,
                    'apres' => $upper,
                    'message' => "Priorité normalisée : « {$priorite} » → « {$upper} »",
                ];
            }
            return $upper;
        }

        return $priorite;
    }

    /**
     * Normalise une date Excel.
     */
    private function normaliserDate($valeur): array
    {
        if (empty($valeur)) {
            return ['valeur' => null, 'invalide' => false, 'brute' => null];
        }

        // Si c'est un nombre (date Excel sérialisée)
        if (is_numeric($valeur)) {
            try {
                $date = ExcelDate::excelToDateTimeObject((float)$valeur);
                return [
                    'valeur' => Carbon::instance($date)->format('Y-m-d'),
                    'invalide' => false,
                    'brute' => (string)$valeur,
                ];
            } catch (\Exception $e) {
                return ['valeur' => null, 'invalide' => true, 'brute' => (string)$valeur];
            }
        }

        // Si c'est une chaîne
        $valeurStr = trim((string)$valeur);

        // Corriger les dates aberrantes connues (ex: 01/01/12026)
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{5,})$/', $valeurStr, $m)) {
            $anneeCorrigee = substr($m[3], 0, 4);
            $valeurStr = "{$m[1]}/{$m[2]}/{$anneeCorrigee}";
            $this->corrections[] = [
                'type' => 'date',
                'avant' => (string)$valeur,
                'apres' => $valeurStr,
                'message' => "Date corrigée : « {$valeur} » → « {$valeurStr} »",
            ];
        }

        // Corriger les dates avec jour impossible (ex: 31/04/2026)
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $valeurStr, $m)) {
            $jour = (int)$m[1];
            $mois = (int)$m[2];
            $annee = (int)$m[3];

            if (!checkdate($mois, $jour, $annee)) {
                // Vérifier que mois et année sont dans des plages valides avant d'appeler cal_days_in_month
                if ($mois >= 1 && $mois <= 12 && $annee >= 1 && $annee <= 9999) {
                    $dernierJour = cal_days_in_month(CAL_GREGORIAN, $mois, $annee);
                    if ($jour > $dernierJour) {
                        $jourCorrige = $dernierJour;
                        $dateCorrigee = "{$jourCorrige}/{$m[2]}/{$m[3]}";
                        $this->corrections[] = [
                            'type' => 'date',
                            'avant' => $valeurStr,
                            'apres' => $dateCorrigee,
                            'message' => "Date corrigée (jour invalide) : « {$valeurStr} » → « {$dateCorrigee} »",
                        ];
                        $valeurStr = $dateCorrigee;
                    }
                } else {
                    return ['valeur' => null, 'invalide' => true, 'brute' => (string)$valeur];
                }
            }
        }

        try {
            $parsed = Carbon::createFromFormat('d/m/Y', $valeurStr);
            if ($parsed) {
                return ['valeur' => $parsed->format('Y-m-d'), 'invalide' => false, 'brute' => (string)$valeur];
            }
        } catch (\Exception $e) {
            // Essayer d'autres formats
        }

        try {
            $parsed = Carbon::parse($valeurStr);
            return ['valeur' => $parsed->format('Y-m-d'), 'invalide' => false, 'brute' => (string)$valeur];
        } catch (\Exception $e) {
            return ['valeur' => null, 'invalide' => true, 'brute' => (string)$valeur];
        }
    }

    /**
     * Normalise la progression (0-1 → 0-100, clamper).
     */
    private function normaliserProgression($valeur): float
    {
        if (empty($valeur) && $valeur !== 0 && $valeur !== '0') return 0;

        $v = (float)$valeur;

        if ($v >= 0 && $v <= 1) {
            return round($v * 100, 1);
        }

        if ($v > 1 && $v <= 100) {
            return round($v, 1);
        }

        if ($v > 100) {
            $this->corrections[] = [
                'type' => 'progression',
                'avant' => $valeur,
                'apres' => 100,
                'message' => "Progression clampée : {$valeur} → 100",
            ];
            return 100;
        }

        return max(0, round($v, 1));
    }

    /**
     * Parse les responsables depuis une chaîne multi-valeurs.
     */
    private function parserResponsables(string $raw): array
    {
        if (empty($raw)) return [];

        // Éclater sur /, \n, ,
        $tokens = preg_split('/[\/\n,]+/', $raw);
        $responsables = [];

        foreach ($tokens as $token) {
            $token = trim($token);
            if (!empty($token) && mb_strlen($token) > 1) {
                $responsables[] = $token;
            }
        }

        return array_values(array_unique($responsables));
    }

    /**
     * Parse les tâches depuis la colonne Prochaines Actions.
     */
    private function parserTaches(string $raw): array
    {
        if (empty($raw)) return [];

        // Split sur regex : lignes commençant par *, -, •
        $items = preg_split('/(?:^|\n)\s*[\*\-•]\s*/u', $raw);
        $taches = [];

        foreach ($items as $item) {
            $item = trim($item);
            if (!empty($item) && mb_strlen($item) > 2) {
                $taches[] = [
                    'titre' => $item,
                    'importer' => true,
                ];
            }
        }

        // Si pas de puces détectées, essayer de split sur \n
        if (empty($taches) && str_contains($raw, "\n")) {
            $lines = explode("\n", $raw);
            foreach ($lines as $line) {
                $line = trim($line);
                if (!empty($line) && mb_strlen($line) > 2) {
                    $taches[] = [
                        'titre' => $line,
                        'importer' => true,
                    ];
                }
            }
        }

        // Si toujours rien mais le texte est assez long, créer une seule tâche
        if (empty($taches) && mb_strlen($raw) > 5) {
            $taches[] = [
                'titre' => $raw,
                'importer' => true,
            ];
        }

        return $taches;
    }

    /**
     * Extrait les axes/entités uniques.
     */
    private function extraireAxes(array $lignes, array $colonneMap): array
    {
        $axes = [];
        foreach ($lignes as $ligneData) {
            $entite = $this->normaliserEntite(trim((string)($ligneData['row'][$colonneMap['entite']] ?? '')));
            if (!empty($entite) && !in_array($entite, $axes)) {
                $axes[] = $entite;
            }
        }
        return $axes;
    }

    /**
     * Extrait les collaborateurs uniques.
     */
    private function extraireCollaborateurs(array $lignes, array $colonneMap): array
    {
        $collabs = [];
        foreach ($lignes as $ligneData) {
            $raw = trim((string)($ligneData['row'][$colonneMap['responsable']] ?? ''));
            $parsed = $this->parserResponsables($raw);
            foreach ($parsed as $nom) {
                if (!in_array($nom, $collabs)) {
                    $collabs[] = $nom;
                }
            }
        }
        return $collabs;
    }
}
