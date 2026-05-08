<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class RegleScoring extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'regles_scoring';

    protected $fillable = [
        'societe_id',
        'contexte',
        'critere',
        'points',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    // ─── Scopes ────────────────────────────────────────────

    public function scopeActifs(Builder $query): Builder
    {
        return $query->where('actif', true);
    }

    public function scopeParContexte(Builder $query, string $contexte): Builder
    {
        return $query->where('contexte', $contexte);
    }
}
