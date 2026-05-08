<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleFormation extends Model
{
    use HasFactory;

    protected $table = 'modules_formation';

    protected $fillable = [
        'formation_id',
        'titre',
        'contenu',
        'ordre',
    ];

    public function formation(): BelongsTo
    {
        return $this->belongsTo(Formation::class);
    }
}
