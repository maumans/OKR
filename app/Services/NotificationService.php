<?php

namespace App\Services;

use App\Models\NotificationApp;
use App\Models\Collaborateur;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Crée une notification pour un utilisateur précis.
     */
    public function creer(
        int    $societeId,
        ?int   $userId,
        string $type,
        string $titre,
        string $body = '',
        array  $data = []
    ): NotificationApp {
        return NotificationApp::create([
            'societe_id' => $societeId,
            'user_id'    => $userId,
            'type'       => $type,
            'titre'      => $titre,
            'body'       => $body,
            'data'       => $data ?: null,
        ]);
    }

    /**
     * Notifie tous les collaborateurs actifs d'une société.
     */
    public function notifierSociete(
        int    $societeId,
        string $type,
        string $titre,
        string $body = '',
        array  $data = []
    ): void {
        $userIds = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->whereNotNull('user_id')
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            $this->creer($societeId, $userId, $type, $titre, $body, $data);
        }
    }

    /**
     * Notifie les responsables (admin + managers) d'une société.
     */
    public function notifierResponsables(
        int    $societeId,
        string $type,
        string $titre,
        string $body = '',
        array  $data = []
    ): void {
        $userIds = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->whereNotNull('user_id')
            ->whereIn('role', ['admin', 'directeur', 'manager'])
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            $this->creer($societeId, $userId, $type, $titre, $body, $data);
        }
    }

    /**
     * Notifie un collaborateur par son user_id.
     */
    public function notifierUser(
        int    $societeId,
        int    $userId,
        string $type,
        string $titre,
        string $body = '',
        array  $data = []
    ): void {
        $this->creer($societeId, $userId, $type, $titre, $body, $data);
    }

    /**
     * Marque une notification comme lue.
     */
    public function marquerLue(NotificationApp $notification): void
    {
        if (! $notification->lue) {
            $notification->update(['lue' => true, 'lue_le' => now()]);
        }
    }

    /**
     * Marque toutes les notifications d'un user comme lues.
     */
    public function marquerToutesLues(int $userId, int $societeId): void
    {
        NotificationApp::where('societe_id', $societeId)
            ->pourUser($userId)
            ->where('lue', false)
            ->update(['lue' => true, 'lue_le' => now()]);
    }

    /**
     * Compte les notifications non lues d'un user.
     */
    public function compterNonLues(int $userId, int $societeId): int
    {
        return NotificationApp::where('societe_id', $societeId)
            ->pourUser($userId)
            ->nonLues()
            ->count();
    }

    /**
     * Récupère les dernières notifications d'un user (pour le dropdown).
     */
    public function dernieres(int $userId, int $societeId, int $limit = 15): Collection
    {
        return NotificationApp::where('societe_id', $societeId)
            ->pourUser($userId)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Vérifie si une alerte livrable a déjà été envoyée récemment (< 6 jours)
     * pour éviter les doublons lors des appels quotidiens de la commande.
     */
    public function alerteLivrableDejaEnvoyee(int $societeId, int $livrableId): bool
    {
        return NotificationApp::where('societe_id', $societeId)
            ->where('type', 'livrable_deadline')
            ->where('created_at', '>=', now()->subDays(6))
            ->whereJsonContains('data->livrable_id', $livrableId)
            ->exists();
    }
}
