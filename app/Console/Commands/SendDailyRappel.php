<?php

namespace App\Console\Commands;

use App\Mail\DailyRappel;
use App\Models\BilanJournalier;
use App\Models\Collaborateur;
use App\Models\NotificationApp;
use App\Models\TacheDaily;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendDailyRappel extends Command
{
    protected $signature   = 'daily:rappel {--dry-run : Afficher sans envoyer}';
    protected $description = 'Envoie un rappel email aux collaborateurs qui n\'ont pas rempli leur Daily à 11h';

    public function __construct(private readonly NotificationService $notifService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $today   = Carbon::today();
        $dryRun  = $this->option('dry-run');

        // Ne pas envoyer le week-end
        if ($today->isWeekend()) {
            $this->info('Week-end — aucun rappel envoyé.');
            return 0;
        }

        // Tous les collaborateurs actifs ayant un compte utilisateur (email)
        $collaborateurs = Collaborateur::whereNotNull('user_id')
            ->actifs()
            ->with(['user', 'societe'])
            ->get();

        $envoyes  = 0;
        $ignores  = 0;

        foreach ($collaborateurs as $collab) {
            if (!$collab->user?->email || !$collab->societe) {
                continue;
            }

            // Bilan du jour rempli ?
            $hasBilan = BilanJournalier::where('collaborateur_id', $collab->id)
                ->whereDate('date', $today)
                ->exists();

            // Statuts de toutes les tâches du jour
            $statutsTaches = TacheDaily::where('collaborateur_id', $collab->id)
                ->whereDate('date', $today)
                ->pluck('statut');

            // Daily complet = bilan rempli OU toutes les tâches du jour terminées
            $toutesTerminees = $statutsTaches->isNotEmpty()
                && $statutsTaches->every(fn ($s) => $s === 'termine');

            if ($hasBilan || $toutesTerminees) {
                $ignores++;
                $status = $hasBilan ? 'bilan rempli' : 'toutes tâches terminées';
                $this->line("  ✓ {$collab->nomComplet()} — {$status}");
                continue;
            }

            // Déduplication : rappel déjà envoyé aujourd'hui pour ce collaborateur
            $dejaEnvoye = NotificationApp::where('societe_id', $collab->societe_id)
                ->where('user_id', $collab->user_id)
                ->where('type', 'daily_rappel')
                ->whereDate('created_at', $today)
                ->exists();

            if ($dejaEnvoye) {
                $ignores++;
                $this->line("  ~ {$collab->nomComplet()} — rappel déjà envoyé aujourd'hui");
                continue;
            }

            $this->line("  → {$collab->nomComplet()} ({$collab->user->email})");

            if (!$dryRun) {
                // Email
                Mail::to($collab->user->email)->send(new DailyRappel($collab));

                // Notification in-app
                $this->notifService->notifierUser(
                    societeId: $collab->societe_id,
                    userId:    $collab->user_id,
                    type:      'daily_rappel',
                    titre:     '📋 Rappel Daily non rempli',
                    body:      'Votre Daily du ' . $today->format('d/m/Y') . ' n\'est pas encore rempli.',
                    data:      ['url' => '/daily'],
                );
            }

            $envoyes++;
        }

        $this->info("Rappels envoyés : {$envoyes} | Ignorés (daily complet / déjà notifiés) : {$ignores}");

        return 0;
    }
}
