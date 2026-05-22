<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePrimeMensuelleRequest;
use App\Models\Collaborateur;
use App\Models\PrimeMensuelle;
use App\Services\SyntheseService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PrimeMensuelleController extends Controller
{
    public function __construct(private SyntheseService $syntheseService) {}

    /**
     * Créer ou mettre à jour la prime mensuelle d'un collaborateur.
     */
    public function update(UpdatePrimeMensuelleRequest $request, Collaborateur $collaborateur, string $mois)
    {
        $moisDate = Carbon::createFromFormat('Y-m', $mois)->startOfMonth()->format('Y-m-d');

        $prime = PrimeMensuelle::updateOrCreate(
            [
                'collaborateur_id' => $collaborateur->id,
                'mois'             => $moisDate,
            ],
            [
                'montant_max'         => $request->montant_max,
                'seuil_pourcentage'   => $request->seuil_pourcentage,
                'commentaire_manager' => $request->commentaire_manager,
            ]
        );

        // Si validation demandée, figer le score et calculer le montant accordé
        if ($request->boolean('validee') && !$prime->validee) {
            $scoreGlobal = $this->syntheseService->calculerScoreGlobalCollaborateur($collaborateur->id, $mois);
            $primeAcquise = $scoreGlobal >= $prime->seuil_pourcentage;

            $prime->update([
                'validee'              => true,
                'score_global'         => $scoreGlobal,
                'montant_accorde'      => $primeAcquise ? $prime->montant_max : 0,
                'validee_par_user_id'  => auth()->id(),
                'validee_le'           => now(),
            ]);
        } elseif (!$request->boolean('validee') && $prime->validee) {
            // Dévalidation
            $prime->update([
                'validee'             => false,
                'score_global'        => null,
                'montant_accorde'     => null,
                'validee_par_user_id' => null,
                'validee_le'          => null,
            ]);
        }

        return redirect()->back()->with('success', '✏️ Prime mise à jour.');
    }

    /**
     * Valider la prime (endpoint dédié pour validation rapide).
     */
    public function valider(Request $request, Collaborateur $collaborateur, string $mois)
    {
        $moisDate = Carbon::createFromFormat('Y-m', $mois)->startOfMonth()->format('Y-m-d');

        $prime = PrimeMensuelle::where('collaborateur_id', $collaborateur->id)
            ->where('mois', $moisDate)
            ->firstOrFail();

        if ($prime->validee) {
            return redirect()->back()->with('error', 'Prime déjà validée.');
        }

        $scoreGlobal = $this->syntheseService->calculerScoreGlobalCollaborateur($collaborateur->id, $mois);
        $primeAcquise = $scoreGlobal >= $prime->seuil_pourcentage;

        $prime->update([
            'validee'             => true,
            'score_global'        => $scoreGlobal,
            'montant_accorde'     => $primeAcquise ? $prime->montant_max : 0,
            'validee_par_user_id' => auth()->id(),
            'validee_le'          => now(),
        ]);

        return redirect()->back()->with('success', '✏️ Prime validée.');
    }
}
