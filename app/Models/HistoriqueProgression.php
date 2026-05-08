<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueProgression extends Model
{
    use HasFactory;

    protected $table = 'historique_progressions';

    protected $fillable = [
        'resultat_cle_id',
        'collaborateur_id',
        'ancienne_valeur',
        'nouvelle_valeur',
        'justification',
    ];

    protected function casts(): array
    {
        return [
            'ancienne_valeur' => 'decimal:2',
            'nouvelle_valeur' => 'decimal:2',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function resultatCle(): BelongsTo
    {
        return $this->belongsTo(ResultatCle::class, 'resultat_cle_id');
    }

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }
}
