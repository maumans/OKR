<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'grade',
        'practice',
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

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->orderBy('ordre');
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

    public function fichesPerformance(): HasMany
    {
        return $this->hasMany(FichePerformance::class);
    }

    // ─── Scopes ────────────────────────────────────────────

    public function scopeActifs(Builder $query): Builder
    {
        return $query->where('actif', true);
    }

    public function scopeAdmins(Builder $query): Builder
    {
        return $query->whereHas('roles', fn ($q) => $q->where('code', 'admin'));
    }

    public function scopeManagers(Builder $query): Builder
    {
        return $query->whereHas('roles', fn ($q) => $q->where('code', 'manager'));
    }

    public function scopeDirecteurs(Builder $query): Builder
    {
        return $query->whereHas('roles', fn ($q) => $q->where('code', 'directeur'));
    }

    public function scopeDrh(Builder $query): Builder
    {
        return $query->whereHas('roles', fn ($q) => $q->where('code', 'drh'));
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

    public function hasRole(string $code): bool
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles->contains('code', $code);
        }
        return $this->roles()->where('code', $code)->exists();
    }

    public function estAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function estDirecteur(): bool
    {
        return $this->hasRole('directeur');
    }

    public function estManager(): bool
    {
        return $this->hasRole('manager');
    }

    public function estCollaborateur(): bool
    {
        return $this->hasRole('collaborateur');
    }

    public function estDrh(): bool
    {
        return $this->hasRole('drh');
    }

    /** Admin ou Directeur : accès à toute la société */
    public function aAccesGlobal(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('directeur');
    }

    /** Admin, Directeur ou Manager : peut gérer des objectifs/tâches */
    public function estResponsable(): bool
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles->whereIn('code', ['admin', 'directeur', 'manager'])->isNotEmpty();
        }
        return $this->roles()->whereIn('code', ['admin', 'directeur', 'manager'])->exists();
    }
}
