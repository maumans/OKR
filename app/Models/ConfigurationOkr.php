<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConfigurationOkr extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'configurations_okr';

    protected $fillable = [
        'societe_id',
        'mode_calcul',
        'frequence_update',
        'rappel_automatique',
        'visibilite_defaut',
        'vue_okr',
    ];

    protected function casts(): array
    {
        return [
            'rappel_automatique' => 'boolean',
        ];
    }
}
