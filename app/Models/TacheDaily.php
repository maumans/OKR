<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TacheDaily extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'taches_daily';

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'tache_id',
        'titre',
        'description',
        'statut',
        'priorite',
        'type_tache',
        'categorie',
        'temps_estime',
        'temps_reel',
        'score',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function tache(): BelongsTo
    {
        return $this->belongsTo(Tache::class);
    }

    public function typeTache(): BelongsTo
    {
        return $this->belongsTo(TypeTache::class, 'type_tache');
    }
}
