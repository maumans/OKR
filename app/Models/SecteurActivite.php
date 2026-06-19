<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecteurActivite extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'secteurs_activite';

    protected $fillable = [
        'societe_id',
        'nom',
        'ordre',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    public function scopeActifs(Builder $query): Builder
    {
        return $query->where('actif', true);
    }

    public function scopeOrdonne(Builder $query): Builder
    {
        return $query->orderBy('ordre')->orderBy('nom');
    }
}
