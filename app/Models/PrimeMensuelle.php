<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrimeMensuelle extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'primes_mensuelles';

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'mois',
        'montant_max',
        'seuil_pourcentage',
        'score_global',
        'montant_accorde',
        'validee',
        'commentaire_manager',
        'validee_par_user_id',
        'validee_le',
    ];

    protected function casts(): array
    {
        return [
            'mois'             => 'date',
            'montant_max'      => 'decimal:2',
            'score_global'     => 'decimal:2',
            'montant_accorde'  => 'decimal:2',
            'validee'          => 'boolean',
            'validee_le'       => 'datetime',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function valideePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validee_par_user_id');
    }
}
