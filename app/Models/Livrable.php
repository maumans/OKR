<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Livrable extends Model
{
    use BelongsToSociete;

    protected $fillable = [
        'mission_id',
        'societe_id',
        'responsable_id',
        'nom',
        'type_livrable',
        'version',
        'statut',
        'dir_validated',
        'ar_count',
        'url',
        'deadline_envoi',
        'deadline_validation',
    ];

    protected function casts(): array
    {
        return [
            'dir_validated'       => 'boolean',
            'ar_count'            => 'integer',
            'deadline_envoi'      => 'date',
            'deadline_validation' => 'date',
        ];
    }

    /** Ordered statut lifecycle */
    public static function statutOrder(): array
    {
        return ['draft', 'review', 'validated', 'sent', 'feedback', 'approved', 'archived'];
    }

    public function nextStatut(): ?string
    {
        $order = static::statutOrder();
        $idx = array_search($this->statut, $order);
        return isset($order[$idx + 1]) ? $order[$idx + 1] : null;
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class, 'responsable_id');
    }
}
