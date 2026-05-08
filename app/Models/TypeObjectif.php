<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeObjectif extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'types_objectifs';

    protected $fillable = [
        'societe_id',
        'nom',
        'description',
        'niveau',
    ];

    public function objectifs(): HasMany
    {
        return $this->hasMany(Objectif::class, 'type_objectif_id');
    }
}
