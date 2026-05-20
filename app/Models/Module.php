<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Module extends Model
{
    protected $fillable = [
        'code', 'nom', 'description', 'icone', 'couleur',
        'categorie', 'routes', 'dependances',
        'est_core', 'est_premium', 'ordre', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'routes'      => 'array',
            'dependances' => 'array',
            'est_core'    => 'boolean',
            'est_premium' => 'boolean',
            'actif'       => 'boolean',
        ];
    }

    public function societes(): BelongsToMany
    {
        return $this->belongsToMany(Societe::class)
            ->withPivot(['actif', 'active_le', 'desactive_le', 'active_par_user_id', 'parametres'])
            ->withTimestamps();
    }
}
