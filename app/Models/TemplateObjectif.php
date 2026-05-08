<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateObjectif extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'templates_objectifs';

    protected $fillable = [
        'societe_id',
        'nom',
        'description',
        'poste',
        'contenu',
    ];

    protected function casts(): array
    {
        return [
            'contenu' => 'array',
        ];
    }
}
