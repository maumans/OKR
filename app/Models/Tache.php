<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tache extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'objectif_id',
        'resultat_cle_id',
        'mission_id',
        'titre',
        'description',
        'mode_operatoire',
        'outils',
        'definition_done',
        'statut',
        'priorite',
        'eisenhower',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'mode_operatoire' => 'array',
            'definition_done' => 'array',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function objectif(): BelongsTo
    {
        return $this->belongsTo(Objectif::class);
    }

    public function resultatCle(): BelongsTo
    {
        return $this->belongsTo(ResultatCle::class, 'resultat_cle_id');
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class);
    }

    public function tachesDaily(): HasMany
    {
        return $this->hasMany(TacheDaily::class, 'tache_id');
    }

    public function fichiers(): HasMany
    {
        return $this->hasMany(TacheFichier::class, 'tache_id');
    }
}
