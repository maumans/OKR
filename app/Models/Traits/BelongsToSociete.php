<?php

namespace App\Models\Traits;

use App\Models\Societe;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToSociete
{
    /**
     * Boot the trait.
     * Automatically scope queries and set societe_id on creation.
     */
    public static function bootBelongsToSociete(): void
    {
        // Auto-set societe_id on creation if not provided
        static::creating(function ($model) {
            if (empty($model->societe_id)) {
                $societeId = session('societe_id');
                if ($societeId) {
                    $model->societe_id = $societeId;
                }
            }
        });
    }

    /**
     * Relation vers la société.
     */
    public function societe(): BelongsTo
    {
        return $this->belongsTo(Societe::class);
    }

    /**
     * Scope : filtrer par société.
     */
    public function scopePourSociete(Builder $query, ?int $societeId = null): Builder
    {
        $societeId = $societeId ?? session('societe_id');

        return $query->where('societe_id', $societeId);
    }
}
