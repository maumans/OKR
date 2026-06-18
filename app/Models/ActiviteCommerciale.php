<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Client;

class ActiviteCommerciale extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'activites_commerciales';

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'type',
        'prospect_id',
        'client_id',
        'prospect_client',
        'montant',
        'cycle',
        'note',
        'date_activite',
    ];

    protected function casts(): array
    {
        return [
            'date_activite' => 'date',
            'montant'       => 'decimal:2',
        ];
    }

    const TYPES = [
        'contact_initie',
        'demo_realisee',
        'proposition_envoyee',
        'relance_effectuee',
        'negociation_engagee',
        'deal_signe',
        'deal_perdu',
    ];

    public static function cycleFromDate(string $date): string
    {
        $d = \Carbon\Carbon::parse($date);
        return 'Q' . (int) ceil($d->month / 3) . ' ' . $d->year;
    }

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(Prospect::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
