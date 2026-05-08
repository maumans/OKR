<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreIndividuel extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'scores_individuels';

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'mois',
        'score_global',
        'objectifs_count',
        'prime_acquise',
        'detail_axes',
    ];

    protected function casts(): array
    {
        return [
            'mois' => 'date',
            'score_global' => 'decimal:2',
            'prime_acquise' => 'decimal:2',
            'detail_axes' => 'array',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }
}
