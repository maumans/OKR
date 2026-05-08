<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AxeObjectif extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'axes_objectifs';

    protected $fillable = [
        'societe_id',
        'nom',
        'description',
        'couleur',
        'ordre',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    public function objectifs(): HasMany
    {
        return $this->hasMany(Objectif::class, 'axe_objectif_id');
    }

    public function scopeActifs($query)
    {
        return $query->where('actif', true);
    }

    public function scopeOrdonne($query)
    {
        return $query->orderBy('ordre');
    }
}
