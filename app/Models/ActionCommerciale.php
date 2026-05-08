<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActionCommerciale extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'actions_commerciales';

    protected $fillable = [
        'societe_id',
        'prospect_id',
        'collaborateur_id',
        'type',
        'description',
        'date_action',
        'duree',
        'resultat',
    ];

    protected function casts(): array
    {
        return [
            'date_action' => 'datetime',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(Prospect::class);
    }

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }
}
