<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TacheFichier extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'tache_fichiers';

    protected $fillable = [
        'societe_id',
        'tache_id',
        'collaborateur_id',
        'nom_original',
        'nom_stockage',
        'mime_type',
        'taille',
    ];

    public function tache(): BelongsTo
    {
        return $this->belongsTo(Tache::class);
    }

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function tailleFormatee(): string
    {
        $bytes = $this->taille;
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' Mo';
        if ($bytes >= 1024) return round($bytes / 1024, 0) . ' Ko';
        return $bytes . ' o';
    }
}
