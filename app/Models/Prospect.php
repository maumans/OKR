<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prospect extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'nom',
        'contact',
        'secteur',
        'valeur',
        'statut',
        'prochain_rdv',
        'date_premier_contact',
        'date_conversion',
        'source',
        'montant_final',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'prochain_rdv' => 'date',
            'date_premier_contact' => 'datetime',
            'date_conversion' => 'datetime',
            'valeur' => 'decimal:2',
            'montant_final' => 'decimal:2',
        ];
    }

    public function collaborateur()
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function actionsCommerciales(): HasMany
    {
        return $this->hasMany(ActionCommerciale::class);
    }
}
