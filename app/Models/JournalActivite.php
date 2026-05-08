<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JournalActivite extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'journal_activites';

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'type',
        'entite_type',
        'entite_id',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    /**
     * Relation polymorphe vers l'entité concernée.
     */
    public function entite(): MorphTo
    {
        return $this->morphTo('entite', 'entite_type', 'entite_id');
    }
}
