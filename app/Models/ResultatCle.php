<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResultatCle extends Model
{
    use HasFactory;

    protected $table = 'resultats_cles';

    protected $fillable = [
        'objectif_id',
        'type_resultat_cle_id',
        'description',
        'description_detaillee',
        'mode_calcul',
        'source_crm',
        'source_crm_filtre',
        'milestones',
        'progression',
        'justification',
        'valeur_cible',
        'valeur_actuelle',
        'poids',
        'unite',
    ];

    protected function casts(): array
    {
        return [
            'progression'       => 'decimal:2',
            'valeur_cible'      => 'decimal:2',
            'valeur_actuelle'   => 'decimal:2',
            'poids'             => 'decimal:2',
            'milestones'        => 'array',
            'source_crm'        => 'boolean',
            'source_crm_filtre' => 'array',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function objectif(): BelongsTo
    {
        return $this->belongsTo(Objectif::class);
    }

    public function typeResultatCle(): BelongsTo
    {
        return $this->belongsTo(TypeResultatCle::class, 'type_resultat_cle_id');
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'resultat_cle_id');
    }

    public function historiqueProgressions(): HasMany
    {
        return $this->hasMany(HistoriqueProgression::class, 'resultat_cle_id');
    }

    /**
     * Recalcule la progression du KR à partir du taux de complétion de ses tâches.
     * Utilisé uniquement si le mode_calcul est 'pourcentage' (défaut) et que des tâches existent.
     */
    public function recalculerDepuisTaches(): void
    {
        // Ne pas écraser la progression manuelle si pas de tâches
        $taches = $this->taches;
        if ($taches->isEmpty()) {
            return;
        }

        $total = $taches->count();
        $terminees = $taches->where('statut', 'termine')->count();
        $enCours = $taches->where('statut', 'en_cours')->count();

        // Terminé = 100%, En cours = 50%, reste = 0%
        $progression = round((($terminees * 100) + ($enCours * 50)) / $total, 2);

        $this->update(['progression' => $progression]);
    }
}
