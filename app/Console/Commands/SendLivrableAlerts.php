<?php

namespace App\Console\Commands;

use App\Mail\LivrableDeadlineApproche;
use App\Models\Livrable;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendLivrableAlerts extends Command
{
    protected $signature   = 'livrable:alerts {--dry-run : Afficher sans envoyer}';
    protected $description = 'Envoie les alertes email + in-app pour les livrables dont la deadline approche (≤ 7 jours)';

    public function handle(NotificationService $notifications): int
    {
        $isDryRun = $this->option('dry-run');

        // Livrables actifs avec deadline dans les 7 prochains jours (ou déjà passée)
        $livrables = Livrable::with(['mission.responsable.user', 'responsable.user'])
            ->whereNotNull('deadline_envoi')
            ->whereNotIn('statut', ['approved', 'archived'])
            ->whereDate('deadline_envoi', '<=', now()->addDays(7))
            ->get();

        $this->info("Livrables trouvés : {$livrables->count()}");

        $envoyes = 0;

        foreach ($livrables as $livrable) {
            $mission = $livrable->mission;
            if (! $mission) continue;

            // Déduplications : alerte déjà envoyée il y a moins de 6 jours ?
            if ($notifications->alerteLivrableDejaEnvoyee($mission->societe_id, $livrable->id)) {
                $this->line("  Skip (déjà notifié) : {$livrable->nom}");
                continue;
            }

            $joursRestants = (int) now()->startOfDay()->diffInDays($livrable->deadline_envoi, false);

            $titre = $joursRestants <= 0
                ? "Livrable en retard : {$livrable->nom}"
                : "Livrable dû dans {$joursRestants}j : {$livrable->nom}";

            $body = "Mission : {$mission->titre} — Client : {$mission->client}";

            if ($isDryRun) {
                $this->line("  [DRY-RUN] {$titre}");
                continue;
            }

            // ─── Notification in-app ────────────────────────────────
            // → Responsable du livrable
            $responsableUserId = $livrable->responsable?->user_id;
            // → Responsable de la mission si différent
            $missionUserId = $mission->responsable?->user_id;

            $notifiedUserIds = array_unique(array_filter([$responsableUserId, $missionUserId]));

            foreach ($notifiedUserIds as $userId) {
                $notifications->notifierUser(
                    societeId: $mission->societe_id,
                    userId: $userId,
                    type: 'livrable_deadline',
                    titre: $titre,
                    body: $body,
                    data: [
                        'mission_id'  => $mission->id,
                        'livrable_id' => $livrable->id,
                        'url'         => '/missions',
                    ]
                );
            }

            // ─── Email ─────────────────────────────────────────────
            $emails = collect();

            if ($livrable->responsable?->user?->email) {
                $emails->push($livrable->responsable->user->email);
            }
            if ($mission->responsable?->user?->email
                && ! $emails->contains($mission->responsable->user->email)) {
                $emails->push($mission->responsable->user->email);
            }

            foreach ($emails as $email) {
                Mail::to($email)->send(new LivrableDeadlineApproche($livrable, $mission));
            }

            $this->info("  ✓ Notifié ({$emails->count()} email(s)) : {$livrable->nom} [{$joursRestants}j]");
            $envoyes++;
        }

        $this->info("Terminé. {$envoyes} alerte(s) envoyée(s).");

        return self::SUCCESS;
    }
}
