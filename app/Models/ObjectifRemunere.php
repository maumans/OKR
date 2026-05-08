<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ObjectifRemunere extends Model
{
    use HasFactory;

    protected $table = 'objectifs_remuneres';

    protected $fillable = [
        'collaborateur_id',
        'titre',
        'type',
        'indicateur',
        'periode',
        'prime',
    ];

    protected function casts(): array
    {
        return [
            'prime' => 'decimal:2',
        ];
    }

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function validations(): HasMany
    {
        return $this->hasMany(ValidationObjectif::class);
    }
}
