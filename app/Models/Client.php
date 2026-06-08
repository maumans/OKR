<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'nom',
        'contact',
        'secteur',
        'site_web',
        'adresse',
        'note',
    ];

    public function deals(): HasMany
    {
        return $this->hasMany(Prospect::class, 'client_id');
    }
}
