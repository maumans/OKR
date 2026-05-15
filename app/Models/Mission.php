<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mission extends Model
{
    use BelongsToSociete;

    protected $fillable = [
        'societe_id',
        'responsable_id',
        'client',
        'titre',
        'type',
        'practice',
        'statut',
        'deadline',
        'note',
        'next_action',
        'next_action_date',
        'last_channel',
        'last_contact_at',
    ];

    protected function casts(): array
    {
        return [
            'deadline'         => 'date',
            'next_action_date' => 'date',
            'last_contact_at'  => 'datetime',
        ];
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class, 'responsable_id');
    }

    public function livrables(): HasMany
    {
        return $this->hasMany(Livrable::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(MissionLog::class);
    }

    /** SLA delays in hours per channel */
    public static function slaDelays(): array
    {
        return [
            'whatsapp' => 2,
            'email'    => 24,
            'call'     => 4,
            'meeting'  => 24,
        ];
    }

    /** Pressure level: critical / warning / watch / ok / done */
    public function getPressureAttribute(): string
    {
        if (in_array($this->statut, ['completed', 'archived'])) {
            return 'done';
        }

        $now = now();

        // Deadline overdue
        if ($this->deadline && $now->isAfter($this->deadline->endOfDay())) {
            return 'critical';
        }

        // Deadline within 3 days
        if ($this->deadline && $now->diffInDays($this->deadline, false) <= 3) {
            return 'warning';
        }

        // SLA breach on last contact
        if ($this->last_contact_at && $this->last_channel) {
            $slaHours = static::slaDelays()[$this->last_channel] ?? 24;
            if ($now->diffInHours($this->last_contact_at) > $slaHours) {
                return 'warning';
            }
        }

        // No contact for 7+ days
        if (!$this->last_contact_at || $now->diffInDays($this->last_contact_at) >= 7) {
            return 'watch';
        }

        return 'ok';
    }
}
