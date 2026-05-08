<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Synthese extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'mois',
        'total_primes',
        'donnees',
    ];

    protected function casts(): array
    {
        return [
            'total_primes' => 'decimal:2',
            'donnees' => 'array',
        ];
    }
}
