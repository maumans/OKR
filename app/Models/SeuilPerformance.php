<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeuilPerformance extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'seuils_performance';

    protected $fillable = [
        'societe_id',
        'nom',
        'couleur',
        'seuil_min',
        'seuil_max',
        'ordre',
    ];

    protected function casts(): array
    {
        return [
            'seuil_min' => 'decimal:2',
            'seuil_max' => 'decimal:2',
        ];
    }

    public function scopeOrdonne($query)
    {
        return $query->orderBy('ordre');
    }
}
