<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpsSaisie extends Model
{
    use BelongsToSociete;

    protected $table = 'ops_saisies';

    protected $fillable = [
        'societe_id',
        'ops_indicateur_id',
        'collaborateur_id',
        'periode',
        'valeur',
        'commentaire',
    ];

    protected function casts(): array
    {
        return [
            'valeur' => 'decimal:2',
        ];
    }

    public function indicateur(): BelongsTo
    {
        return $this->belongsTo(OpsIndicateur::class, 'ops_indicateur_id');
    }

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }
}
