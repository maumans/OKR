<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Import extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'user_id',
        'fichier_nom',
        'statut',
        'nb_objectifs_crees',
        'nb_kr_crees',
        'nb_taches_crees',
        'nb_collaborateurs_crees',
        'payload_json',
        'ids_crees',
    ];

    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'ids_crees' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
