<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $fillable = ['code', 'nom', 'ordre'];

    public function collaborateurs(): BelongsToMany
    {
        return $this->belongsToMany(Collaborateur::class);
    }
}
