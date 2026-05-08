<?php

namespace App\Services;

use App\Models\JournalActivite;
use App\Models\HistoriqueProgression;
use App\Models\ResultatCle;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class HistoriqueService
{
    /**
     * Enregistre une action générique dans le journal d'activités.
     */
    public function enregistrerAction(string $type, Model $entite, ?array $details = null, ?int $collaborateurId = null): void
    {
        $societeId = session('societe_id') ?? ($entite->societe_id ?? null);
        
        if (!$societeId) return;

        JournalActivite::create([
            'societe_id' => $societeId,
            'collaborateur_id' => $collaborateurId ?? request()->user()?->collaborateurActuel()?->id,
            'type' => $type,
            'entite_type' => get_class($entite),
            'entite_id' => $entite->id,
            'details' => $details,
        ]);
    }

    /**
     * Enregistre un changement de valeur d'un KR (pour tracer l'évolution).
     */
    public function enregistrerChangementKr(ResultatCle $kr, float $ancienneValeur, float $nouvelleValeur, ?string $justification = null, ?int $collaborateurId = null): void
    {
        if ($ancienneValeur === $nouvelleValeur) return;

        HistoriqueProgression::create([
            'resultat_cle_id' => $kr->id,
            'collaborateur_id' => $collaborateurId ?? request()->user()?->collaborateurActuel()?->id,
            'ancienne_valeur' => $ancienneValeur,
            'nouvelle_valeur' => $nouvelleValeur,
            'justification' => $justification,
        ]);
        
        $this->enregistrerAction('kr.progression', $kr, [
            'ancienne' => $ancienneValeur,
            'nouvelle' => $nouvelleValeur,
            'justification' => $justification
        ], $collaborateurId);
    }

    /**
     * Récupère la timeline complète d'un KR pour l'affichage graphique.
     */
    public function getHistoriqueKrTimeline(int $resultatCleId): Collection
    {
        return HistoriqueProgression::with('collaborateur:id,nom,prenom')
            ->where('resultat_cle_id', $resultatCleId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($h) => [
                'id' => $h->id,
                'date' => $h->created_at->format('Y-m-d H:i'),
                'valeur' => $h->nouvelle_valeur,
                'collaborateur' => $h->collaborateur?->nomComplet() ?? 'Système',
                'justification' => $h->justification,
            ]);
    }
}
