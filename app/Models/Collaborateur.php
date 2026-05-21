<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Collaborateur extends Model
{
    use HasFactory, BelongsToSociete;

    protected $fillable = [
        'user_id',
        'societe_id',
        'departement_id',
        'nom',
        'prenom',
        'poste',
        'role',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    public function objectifs(): HasMany
    {
        return $this->hasMany(Objectif::class);
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class);
    }

    public function bilansJournaliers(): HasMany
    {
        return $this->hasMany(BilanJournalier::class);
    }

    public function objectifsRemuneres(): HasMany
    {
        return $this->hasMany(ObjectifRemunere::class);
    }

    public function actionsCommerciales(): HasMany
    {
        return $this->hasMany(ActionCommerciale::class);
    }

    public function tachesDaily(): HasMany
    {
        return $this->hasMany(TacheDaily::class);
    }

    // ─── Scopes ────────────────────────────────────────────

    public function scopeActifs(Builder $query): Builder
    {
        return $query->where('actif', true);
    }

    public function scopeAdmins(Builder $query): Builder
    {
        return $query->where('role', 'admin');
    }

    public function scopeManagers(Builder $query): Builder
    {
        return $query->where('role', 'manager');
    }

    public function scopeDirecteurs(Builder $query): Builder
    {
        return $query->where('role', 'directeur');
    }

    public function scopeDansDepartement(Builder $query, int $departementId): Builder
    {
        return $query->where('departement_id', $departementId);
    }

    // ─── Helpers ───────────────────────────────────────────

    public function nomComplet(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    public function estAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function estDirecteur(): bool
    {
        return $this->role === 'directeur';
    }

    public function estManager(): bool
    {
        return $this->role === 'manager';
    }

    public function estCollaborateur(): bool
    {
        return $this->role === 'collaborateur';
    }

    /** Admin ou Directeur : accès à toute la société */
    public function aAccesGlobal(): bool
    {
        return $this->role === 'admin' || $this->role === 'directeur';
    }

    /** Admin, Directeur ou Manager : peut gérer des objectifs/tâches */
    public function estResponsable(): bool
    {
        return in_array($this->role, ['admin', 'directeur', 'manager']);
    }
}
