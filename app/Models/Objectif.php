<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Objectif extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'axe_objectif_id',
        'periode_id',
        'type_objectif_id',
        'statut_objectif_id',
        'titre',
        'axe',
        'periode',
        'mois',
        'prime',
        'note_contexte',
        'statut',
        'visibilite',
    ];

    protected function casts(): array
    {
        return [
            'prime' => 'decimal:2',
            'mois' => 'date',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function resultatsCles(): HasMany
    {
        return $this->hasMany(ResultatCle::class);
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class);
    }

    public function axeObjectif(): BelongsTo
    {
        return $this->belongsTo(AxeObjectif::class, 'axe_objectif_id');
    }

    public function periodeRelation(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function typeObjectif(): BelongsTo
    {
        return $this->belongsTo(TypeObjectif::class, 'type_objectif_id');
    }

    public function statutObjectif(): BelongsTo
    {
        return $this->belongsTo(StatutObjectif::class, 'statut_objectif_id');
    }

    // ─── Accessors ─────────────────────────────────────────

    /**
     * Progression globale de l'objectif (moyenne des résultats clés).
     */
    public function getProgressionGlobaleAttribute(): float
    {
        $resultats = $this->resultatsCles;

        if ($resultats->isEmpty()) {
            return 0;
        }

        $config = ConfigurationOkr::where('societe_id', $this->societe_id)->first();
        $mode = $config?->mode_calcul ?? 'moyenne';

        if ($mode === 'pondere') {
            $totalPoids = $resultats->sum('poids');
            if ($totalPoids <= 0) {
                return round($resultats->avg('progression'), 2);
            }
            $somme = $resultats->sum(fn ($r) => $r->progression * $r->poids);
            return round($somme / $totalPoids, 2);
        }

        return round($resultats->avg('progression'), 2);
    }
}
