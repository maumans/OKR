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
        'mode_calcul',
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
            'progression' => 'decimal:2',
            'valeur_cible' => 'decimal:2',
            'valeur_actuelle' => 'decimal:2',
            'poids' => 'decimal:2',
            'milestones' => 'array',
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
}
