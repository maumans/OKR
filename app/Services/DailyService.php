<?php

namespace App\Services;

use App\Models\TacheDaily;
use App\Models\TypeTache;
use Carbon\Carbon;

class DailyService
{
    /**
     * Calcule le score d'un jour précis en fonction des tâches terminées et de leur type.
     */
    public function calculerScoreJour(int $collabId, Carbon $date): int
    {
        $taches = TacheDaily::with('typeTache')
            ->where('collaborateur_id', $collabId)
            ->whereDate('date', $date)
            ->where('statut', 'termine')
            ->get();

        $score = 0;
        foreach ($taches as $tache) {
            $basePoints = $tache->typeTache?->score_base ?? 1;
            
            // Bonus de priorité
            $prioBonus = match ($tache->priorite) {
                'urgente' => 2,
                'haute' => 1,
                default => 0,
            };
            
            $score += ($basePoints + $prioBonus);
            
            // Sauvegarder le score sur la tâche si pas encore fait
            if ($tache->score === null) {
                $tache->update(['score' => ($basePoints + $prioBonus)]);
            }
        }
        
        return $score;
    }

    public function calculerActivitesJour(int $collabId, Carbon $date): void
    {
        // Map categorie enum values → bilan column names
        $catMap = [
            'seminaire'   => 'seminaires',
            'recherche'   => 'recherches',
            'prospection' => 'prospection',
            'rdv'         => 'rdv',
            'delivery'    => 'delivery',
        ];

        $counts = TacheDaily::where('collaborateur_id', $collabId)
            ->whereDate('date', $date)
            ->where('statut', 'termine')
            ->whereNotNull('categorie')
            ->whereIn('categorie', array_keys($catMap))
            ->get(['categorie'])
            ->groupBy('categorie')
            ->map->count();

        $activites = [];
        foreach ($catMap as $cat => $col) {
            $activites[$col] = $counts[$cat] ?? 0;
        }

        $bilan = \App\Models\BilanJournalier::firstOrCreate(
            ['collaborateur_id' => $collabId, 'date' => $date->format('Y-m-d')]
        );
        $bilan->update($activites);
    }

    /**
     * Obtient les stats sur 7 jours avec le score journalier.
     */
    public function getStatistiquesHebdo(int $collabId, Carbon $dateFin): array
    {
        $stats = [];
        $date = $dateFin->copy()->subDays(6);
        
        while ($date->lte($dateFin)) {
            $dateStr = $date->format('Y-m-d');
            
            $tachesTotal = TacheDaily::where('collaborateur_id', $collabId)
                ->whereDate('date', $dateStr)
                ->count();
                
            $tachesTerminees = TacheDaily::where('collaborateur_id', $collabId)
                ->whereDate('date', $dateStr)
                ->where('statut', 'termine')
                ->count();
                
            $stats[] = [
                'date' => $dateStr,
                'taches_total' => $tachesTotal,
                'taches_terminees' => $tachesTerminees,
                'score' => $this->calculerScoreJour($collabId, $date),
            ];
            
            $date->addDay();
        }
        
        return $stats;
    }
}
