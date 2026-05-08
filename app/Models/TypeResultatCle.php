<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeResultatCle extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'types_resultats_cles';

    protected $fillable = [
        'societe_id',
        'nom',
        'type_valeur',
        'unite',
    ];

    public function resultatsCles(): HasMany
    {
        return $this->hasMany(ResultatCle::class, 'type_resultat_cle_id');
    }
}
