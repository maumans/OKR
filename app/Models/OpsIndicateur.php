<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OpsIndicateur extends Model
{
    use BelongsToSociete;

    protected $table = 'ops_indicateurs';

    protected $fillable = [
        'societe_id',
        'nom',
        'categorie',
        'unite',
        'frequence',
        'description',
        'actif',
        'ordre',
    ];

    protected function casts(): array
    {
        return [
            'actif'  => 'boolean',
            'ordre'  => 'integer',
        ];
    }

    public function societe(): BelongsTo
    {
        return $this->belongsTo(Societe::class);
    }

    public function saisies(): HasMany
    {
        return $this->hasMany(OpsSaisie::class, 'ops_indicateur_id');
    }
}
