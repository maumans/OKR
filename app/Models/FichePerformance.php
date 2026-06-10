<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FichePerformance extends Model
{
    use BelongsToSociete;

    protected $table = 'fiches_performance';

    protected $fillable = [
        'societe_id',
        'collaborateur_id',
        'manager_id',
        'cycle',
        'type_cycle',
        'periode_debut',
        'periode_fin',
        'statut',
        'nb_aller_retour',
        'verrouille',
        'score_commercial',    'score_auto_commercial', 'poids_commercial',
        'score_delivery',      'score_auto_delivery',   'poids_delivery',
        'score_developpement', 'poids_developpement',
        'score_comportemental','poids_comportemental',
        'score_global',
        'appreciation',
        'commentaire_manager',
        'commentaire_collaborateur',
        'commentaire_drh',
        // Champs par dimension
        'objectif_commercial',    'cible_commercial',    'objectif_okr_id_commercial',
        'commentaire_manager_commercial',    'commentaire_collaborateur_commercial',    'score_collab_commercial',
        'objectif_delivery',      'cible_delivery',      'objectif_okr_id_delivery',
        'commentaire_manager_delivery',      'commentaire_collaborateur_delivery',      'score_collab_delivery',
        'objectif_developpement', 'cible_developpement',
        'commentaire_manager_developpement', 'commentaire_collaborateur_developpement', 'score_collab_developpement',
        'objectif_comportemental','cible_comportemental',
        'commentaire_manager_comportemental','commentaire_collaborateur_comportemental','score_collab_comportemental',
        // Mid-Year Review
        'commentaire_mid_year_manager',
        'commentaire_mid_year_collaborateur',
        'forecast_revision',
        // Évaluation finale
        'final_done',
        'final_date',
        'final_score_global',
        'final_appreciation',
        'final_prime_calculee',
        'final_commentaire_manager',
        'final_commentaire_collaborateur',
        // Validation workflow
        'validated_at',
        'validated_by_id',
    ];

    protected function casts(): array
    {
        return [
            'periode_debut'         => 'date',
            'periode_fin'           => 'date',
            'validated_at'          => 'datetime',
            'final_date'            => 'datetime',
            'nb_aller_retour'       => 'integer',
            'verrouille'            => 'boolean',
            'final_done'            => 'boolean',
            'score_commercial'      => 'float',
            'score_auto_commercial' => 'float',
            'poids_commercial'      => 'float',
            'score_delivery'        => 'float',
            'score_auto_delivery'   => 'float',
            'poids_delivery'        => 'float',
            'score_developpement'   => 'float',
            'poids_developpement'   => 'float',
            'score_comportemental'  => 'float',
            'poids_comportemental'  => 'float',
            'score_global'          => 'float',
            'final_score_global'    => 'float',
            'final_prime_calculee'  => 'float',
        ];
    }

    // ─── Transitions autorisées : statut courant → [statuts cibles] ──────────
    const TRANSITIONS = [
        'brouillon'          => ['en_revision'],
        'en_revision'        => ['attente_drh', 'revision_demandee'],
        'attente_drh'        => ['confirme', 'revision_demandee'],
        'confirme'           => [],
        'revision_demandee'  => ['en_revision', 'brouillon'],
    ];

    // ─── Normalisation score OKR brut (%) → /5 ───────────────────────────────
    public static function normaliserScore(float $progression): int
    {
        if ($progression >= 100) return 5;
        if ($progression >= 80)  return 4;
        if ($progression >= 60)  return 3;
        if ($progression >= 40)  return 2;
        return 1;
    }

    // ─── Appréciation textuelle depuis un score /5 ────────────────────────────
    public static function calculerAppreciation(?float $score): ?string
    {
        if ($score === null) return null;
        $pct = ($score / 5) * 100;
        if ($pct >= 100) return 'Très au-dessus des attentes';
        if ($pct >= 80)  return 'Au-dessus des attentes';
        if ($pct >= 60)  return 'Au niveau des attentes';
        if ($pct >= 40)  return 'En cours de développement';
        return 'Non encore atteint';
    }

    // ─── Recalcule score_global + appreciation ────────────────────────────────
    public function recalculerScoreGlobal(): void
    {
        $dims = [
            ['score' => $this->score_commercial,    'poids' => $this->poids_commercial],
            ['score' => $this->score_delivery,       'poids' => $this->poids_delivery],
            ['score' => $this->score_developpement,  'poids' => $this->poids_developpement],
            ['score' => $this->score_comportemental, 'poids' => $this->poids_comportemental],
        ];

        $somme  = 0.0;
        $hasAny = false;
        foreach ($dims as $d) {
            if ($d['score'] !== null) {
                $somme  += (float) $d['score'] * (float) $d['poids'];
                $hasAny  = true;
            }
        }

        $this->score_global  = $hasAny ? round($somme, 1) : null;
        $this->appreciation  = static::calculerAppreciation($this->score_global);
        $this->saveQuietly();
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function collaborateur(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Collaborateur::class, 'manager_id');
    }

    public function validatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by_id');
    }

    public function historiqueWorkflow(): HasMany
    {
        return $this->hasMany(HistoriqueWorkflowPerformance::class)->orderBy('created_at', 'asc');
    }
}
