<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Synthese extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'mois',
        'payload',
        'budget_primes_total',
        'nb_primes_accordees',
        'nb_collaborateurs',
        'genere_par_user_id',
    ];

    protected function casts(): array
    {
        return [
            'mois'                => 'date',
            'payload'             => 'array',
            'budget_primes_total' => 'decimal:2',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function generePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'genere_par_user_id');
    }
}
