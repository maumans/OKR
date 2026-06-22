<?php

namespace App\Models;

use App\Models\Traits\BelongsToSociete;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class RegleScoring extends Model
{
    use HasFactory, BelongsToSociete;

    protected $table = 'regles_scoring';

    const CTX_PROSPECT_FIT        = 'prospect_fit';
    const CTX_PROSPECT_ENGAGEMENT = 'prospect_engagement';

    // Libellés affichés dans l'interface Paramètres CRM
    const LIBELLES = [
        // Fit
        'poste_executif'    => 'Poste exécutif (PDG, DG, CEO)',
        'poste_directeur'   => 'Poste directeur (Directeur, VP, DAF)',
        'poste_manager'     => 'Poste manager (Manager, Responsable)',
        'source_referral'   => 'Source : Référral / recommandation',
        'source_salon'      => 'Source : Salon professionnel',
        'source_site_web'   => 'Source : Site web / inbound',
        'source_appel_froid'=> 'Source : Appel à froid',
        'secteur_cible'     => 'Secteur d\'activité "cible"',
        'valeur_haute'      => 'Valeur du deal ≥ 50 000',
        'valeur_moyenne'    => 'Valeur du deal entre 10 000 et 50 000',
        // Engagement
        'statut_negociation'=> 'Stade : Négociation',
        'statut_proposition'=> 'Stade : Proposition',
        'statut_decouverte' => 'Stade : Découverte',
        'actions_cinq_plus' => 'Actions commerciales ≥ 5',
        'actions_deux_quatre'=> 'Actions commerciales 2 à 4',
        'actions_une'       => 'Actions commerciales = 1',
        'rdv_planifie'      => 'RDV planifié à venir',
        'inactivite_faible' => 'Contact récent (< 7 jours)',
        'inactivite_elevee' => 'Inactivité > 30 jours (malus)',
    ];

    // Points par défaut pour initialiser une nouvelle société
    const DEFAULTS = [
        self::CTX_PROSPECT_FIT => [
            'poste_executif'     => 30,
            'poste_directeur'    => 20,
            'poste_manager'      => 10,
            'source_referral'    => 20,
            'source_salon'       => 15,
            'source_site_web'    => 10,
            'source_appel_froid' => 5,
            'secteur_cible'      => 15,
            'valeur_haute'       => 20,
            'valeur_moyenne'     => 10,
        ],
        self::CTX_PROSPECT_ENGAGEMENT => [
            'statut_negociation' => 25,
            'statut_proposition' => 15,
            'statut_decouverte'  => 5,
            'actions_cinq_plus'  => 20,
            'actions_deux_quatre'=> 10,
            'actions_une'        => 5,
            'rdv_planifie'       => 15,
            'inactivite_faible'  => 10,
            'inactivite_elevee'  => -15,
        ],
    ];

    protected $fillable = [
        'societe_id',
        'contexte',
        'critere',
        'points',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    // ─── Scopes ────────────────────────────────────────────

    public function scopeActifs(Builder $query): Builder
    {
        return $query->where('actif', true);
    }

    public function scopeParContexte(Builder $query, string $contexte): Builder
    {
        return $query->where('contexte', $contexte);
    }
}
