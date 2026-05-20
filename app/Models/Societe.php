<?php

namespace App\Models;

use Database\Seeders\DefaultOkrConfigSeeder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Societe extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::created(function (Societe $societe) {
            (new DefaultOkrConfigSeeder)->seedForSociete($societe->id);

            // Attacher automatiquement tous les modules (core activés, autres désactivés)
            $modules = Module::where('actif', true)->get();
            $now = now();
            $attach = [];
            foreach ($modules as $module) {
                $attach[$module->id] = [
                    'actif'     => $module->est_core,
                    'active_le' => $module->est_core ? $now : null,
                ];
            }
            $societe->modules()->attach($attach);
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
        'devise_id',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'mode_sombre' => 'boolean',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    public function devise(): BelongsTo
    {
        return $this->belongsTo(Devise::class);
    }

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

    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'societe_module')
            ->withPivot(['actif', 'active_le', 'desactive_le', 'active_par_user_id', 'parametres'])
            ->withTimestamps();
    }

    public function modulesActifs(): BelongsToMany
    {
        return $this->modules()->wherePivot('actif', true);
    }

    public function abonnements(): HasMany
    {
        return $this->hasMany(Abonnement::class);
    }

    public function abonnementActif(): HasOne
    {
        return $this->hasOne(Abonnement::class)->where('statut', 'actif')->latestOfMany();
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function aModule(string $code): bool
    {
        if (Module::where('code', $code)->where('est_core', true)->exists()) {
            return true;
        }

        return $this->modulesActifs()->where('code', $code)->exists();
    }

    // ─── Helpers ───────────────────────────────────────────

    public function admins(): HasMany
    {
        return $this->collaborateurs()->where('role', 'admin');
    }

    public function managers(): HasMany
    {
        return $this->collaborateurs()->where('role', 'manager');
    }
}
