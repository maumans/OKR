<?php

namespace App\Console\Commands;

use App\Models\Societe;
use App\Services\ConsolidationService;
use Illuminate\Console\Command;

class ConsoliderKrs extends Command
{
    protected $signature = 'okr:consolider
                            {--societe= : ID d\'une société spécifique (toutes si absent)}
                            {--source=  : Source à consolider (crm_activites, crm_deals, crm_pipeline, missions_nps, missions_livrables)}';

    protected $description = 'Recalcule tous les KRs automatiques depuis leurs sources (CRM, Missions)';

    public function handle(ConsolidationService $consolidation): int
    {
        $societeId = $this->option('societe') ? (int) $this->option('societe') : null;
        $source    = $this->option('source');

        $societes = $societeId
            ? Societe::where('id', $societeId)->get(['id', 'nom'])
            : Societe::all(['id', 'nom']);

        if ($societes->isEmpty()) {
            $this->error('Aucune société trouvée.');
            return self::FAILURE;
        }

        $totalUpdated = 0;

        foreach ($societes as $societe) {
            $this->line("→ Société : <info>{$societe->nom}</info> (#{$societe->id})");

            if ($source) {
                $updated = $consolidation->syncKrsParSociete($societe->id, $source);
                $this->line("  Source <comment>{$source}</comment> : {$updated} KR(s) mis à jour.");
            } else {
                $updated = $consolidation->syncSociete($societe->id);
                $this->line("  Total : {$updated} KR(s) mis à jour.");
            }

            $totalUpdated += $updated;
        }

        $this->info("Consolidation terminée : {$totalUpdated} KR(s) mis à jour au total.");

        return self::SUCCESS;
    }
}
