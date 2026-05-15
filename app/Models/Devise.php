<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Devise extends Model
{
    protected $fillable = ['code', 'nom', 'symbole', 'decimales', 'actif'];

    public function societes(): HasMany
    {
        return $this->hasMany(Societe::class);
    }
}
