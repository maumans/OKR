<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id', 'societe_id', 'action',
        'description', 'donnees', 'ip', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'donnees' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function societe(): BelongsTo
    {
        return $this->belongsTo(Societe::class);
    }
}
