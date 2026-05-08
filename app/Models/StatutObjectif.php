<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StatutObjectif extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'statuts_objectifs';

    protected $fillable = [
        'societe_id',
        'nom',
        'couleur',
        'ordre',
        'est_final',
    ];

    protected function casts(): array
    {
        return [
            'est_final' => 'boolean',
        ];
    }

    public function objectifs(): HasMany
    {
        return $this->hasMany(Objectif::class, 'statut_objectif_id');
    }

    public function scopeOrdonne($query)
    {
        return $query->orderBy('ordre');
    }
}
