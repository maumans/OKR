<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'is_superadmin'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_superadmin' => 'boolean',
        ];
    }

    // ─── Relations ─────────────────────────────────────────

    /**
     * Un utilisateur peut être collaborateur dans plusieurs sociétés.
     */
    public function collaborateurs(): HasMany
    {
        return $this->hasMany(Collaborateur::class);
    }

    // ─── Helpers ───────────────────────────────────────────

    /**
     * Retourne le collaborateur de la société actuellement en session.
     */
    public function collaborateurActuel(): ?Collaborateur
    {
        $societeId = session('societe_id');

        if (!$societeId) {
            // Prendre la première société disponible
            $collab = $this->collaborateurs()->with('societe')->first();
            if ($collab) {
                session(['societe_id' => $collab->societe_id]);
                return $collab;
            }
            return null;
        }

        return $this->collaborateurs()
            ->where('societe_id', $societeId)
            ->first();
    }

    /**
     * Retourne la société actuellement en session.
     */
    public function societeActuelle(): ?Societe
    {
        return $this->collaborateurActuel()?->societe;
    }

    /**
     * L'utilisateur est-il admin de la société courante ?
     */
    public function estAdmin(): bool
    {
        return $this->collaborateurActuel()?->estAdmin() ?? false;
    }

    /**
     * L'utilisateur est-il manager de la société courante ?
     */
    public function estManager(): bool
    {
        return $this->collaborateurActuel()?->estManager() ?? false;
    }

    /**
     * L'utilisateur est-il admin OU manager ?
     */
    public function estResponsable(): bool
    {
        return $this->estAdmin() || $this->estManager();
    }

    /**
     * L'utilisateur est-il superadmin ?
     */
    public function isSuperAdmin(): bool
    {
        return $this->is_superadmin;
    }
}
