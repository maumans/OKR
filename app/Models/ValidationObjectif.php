<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValidationObjectif extends Model
{
    use HasFactory;

    protected $table = 'validations_objectifs';

    protected $fillable = [
        'objectif_remunere_id',
        'taux_atteinte',
        'prime_versee',
    ];

    protected function casts(): array
    {
        return [
            'taux_atteinte' => 'decimal:2',
            'prime_versee' => 'decimal:2',
        ];
    }

    public function objectifRemunere(): BelongsTo
    {
        return $this->belongsTo(ObjectifRemunere::class);
    }
}
