<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Abonnement extends Model
{
    protected $fillable = [
        'societe_id', 'plan', 'prix_mensuel', 'devise_id',
        'date_debut', 'date_fin', 'statut',
        'limite_utilisateurs', 'limite_okr', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'date_debut' => 'date',
            'date_fin'   => 'date',
            'prix_mensuel' => 'decimal:2',
        ];
    }

    public function societe(): BelongsTo
    {
        return $this->belongsTo(Societe::class);
    }

    public function devise(): BelongsTo
    {
        return $this->belongsTo(Devise::class);
    }

    public function estActif(): bool
    {
        return $this->statut === 'actif';
    }

    public function planLabel(): string
    {
        return match ($this->plan) {
            'starter'    => 'Starter',
            'pro'        => 'Pro',
            'enterprise' => 'Enterprise',
            default      => ucfirst($this->plan),
        };
    }
}
