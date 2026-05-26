<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationApp extends Model
{
    use BelongsToSociete;

    protected $table = 'notifications_app';

    protected $fillable = [
        'societe_id',
        'user_id',
        'type',
        'titre',
        'body',
        'data',
        'lue',
        'lue_le',
    ];

    protected function casts(): array
    {
        return [
            'data'   => 'array',
            'lue'    => 'boolean',
            'lue_le' => 'datetime',
        ];
    }

    // ─── Scopes ────────────────────────────────────────────

    public function scopeNonLues($query)
    {
        return $query->where('lue', false);
    }

    public function scopePourUser($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhereNull('user_id');
        });
    }

    // ─── Relations ─────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
