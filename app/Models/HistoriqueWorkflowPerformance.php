<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueWorkflowPerformance extends Model
{
    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $table = 'historique_workflow_performance';

    protected $fillable = [
        'fiche_performance_id',
        'de_statut',
        'vers_statut',
        'user_id',
        'commentaire',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function fichePerformance(): BelongsTo
    {
        return $this->belongsTo(FichePerformance::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
