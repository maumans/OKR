<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Periode extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'nom',
        'date_debut',
        'date_fin',
        'type',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }

    public function objectifs(): HasMany
    {
        return $this->hasMany(Objectif::class, 'periode_id');
    }

    public function scopeActives($query)
    {
        return $query->where('statut', 'actif');
    }

    public function scopeEnCours($query)
    {
        return $query->where('date_debut', '<=', now())
                     ->where('date_fin', '>=', now())
                     ->where('statut', 'actif');
    }
}
