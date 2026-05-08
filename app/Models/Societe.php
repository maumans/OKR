<?php

namespace App\Models;

use Database\Seeders\DefaultOkrConfigSeeder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Societe extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::created(function (Societe $societe) {
            (new DefaultOkrConfigSeeder)->seedForSociete($societe->id);
        });
    }

    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'logo',
        'couleur_primaire',
        'couleur_secondaire',
        'mode_sombre',
        'layout_mode',
    ];

    protected function casts(): array
    {
        return [
            'mode_sombre' => 'boolean',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function collaborateurs(): HasMany
    {
        return $this->hasMany(Collaborateur::class);
    }

    public function objectifs(): HasMany
    {
        return $this->hasMany(Objectif::class);
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class);
    }

    public function prospects(): HasMany
    {
        return $this->hasMany(Prospect::class);
    }

    public function formations(): HasMany
    {
        return $this->hasMany(Formation::class);
    }

    public function syntheses(): HasMany
    {
        return $this->hasMany(Synthese::class);
    }

    // ─── Helpers ───────────────────────────────────────────

    /**
     * Retourne les admins de la société.
     */
    public function admins(): HasMany
    {
        return $this->collaborateurs()->where('role', 'admin');
    }

    /**
     * Retourne les managers de la société.
     */
    public function managers(): HasMany
    {
        return $this->collaborateurs()->where('role', 'manager');
    }
}
