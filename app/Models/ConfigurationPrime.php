<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConfigurationPrime extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'configurations_primes';

    protected $fillable = [
        'societe_id',
        'actif',
        'montant_max',
        'seuil_minimum',
        'mode_calcul',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'montant_max' => 'decimal:2',
            'seuil_minimum' => 'decimal:2',
        ];
    }

    public function paliers(): HasMany
    {
        return $this->hasMany(PalierPrime::class, 'configuration_prime_id')->orderBy('ordre');
    }
}
