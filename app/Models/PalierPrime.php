<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PalierPrime extends Model
{
    use HasFactory;

    protected $table = 'paliers_primes';

    protected $fillable = [
        'configuration_prime_id',
        'seuil_min',
        'seuil_max',
        'pourcentage_prime',
        'ordre',
    ];

    protected function casts(): array
    {
        return [
            'seuil_min' => 'decimal:2',
            'seuil_max' => 'decimal:2',
            'pourcentage_prime' => 'decimal:2',
        ];
    }

    public function configurationPrime(): BelongsTo
    {
        return $this->belongsTo(ConfigurationPrime::class, 'configuration_prime_id');
    }
}
