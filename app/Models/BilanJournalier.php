<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BilanJournalier extends Model
{
    use HasFactory;

    protected $table = 'bilans_journaliers';

    protected $fillable = [
        'collaborateur_id',
        'note',
        'blocages',
        'priorites_demain',
        'seminaires',
        'recherches',
        'prospection',
        'rdv',
        'delivery',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }
}
