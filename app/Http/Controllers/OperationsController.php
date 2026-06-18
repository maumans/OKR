<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\OpsIndicateur;
use App\Models\OpsSaisie;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OperationsController extends Controller
{
    private function societeId(): int
    {
        return session('societe_id');
    }

    // ─── Page principale ───────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $societeId = $this->societeId();

        $indicateurs = OpsIndicateur::where('societe_id', $societeId)
            ->where('actif', true)
            ->orderBy('categorie')
            ->orderBy('ordre')
            ->orderBy('nom')
            ->get()
            ->map(fn ($ind) => [
                'id'          => $ind->id,
                'nom'         => $ind->nom,
                'categorie'   => $ind->categorie,
                'unite'       => $ind->unite,
                'frequence'   => $ind->frequence,
                'description' => $ind->description,
                'ordre'       => $ind->ordre,
            ]);

        // Période courante par défaut
        $periode = $request->get('periode', now()->format('Y-m'));

        $saisies = OpsSaisie::where('societe_id', $societeId)
            ->where('periode', $periode)
            ->with(['collaborateur', 'indicateur'])
            ->get()
            ->map(fn ($s) => [
                'id'               => $s->id,
                'ops_indicateur_id'=> $s->ops_indicateur_id,
                'collaborateur_id' => $s->collaborateur_id,
                'collaborateur'    => $s->collaborateur
                    ? ['id' => $s->collaborateur->id, 'prenom' => $s->collaborateur->prenom, 'nom' => $s->collaborateur->nom]
                    : null,
                'periode'          => $s->periode,
                'valeur'           => $s->valeur,
                'commentaire'      => $s->commentaire,
            ]);

        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->where('actif', true)
            ->orderBy('nom')
            ->get(['id', 'prenom', 'nom', 'poste', 'practice']);

        $periodes = $this->genererPeriodes();

        return Inertia::render('Operations/Index', compact('indicateurs', 'saisies', 'collaborateurs', 'periode', 'periodes'));
    }

    // ─── CRUD indicateurs ──────────────────────────────────────────────────────

    public function storeIndicateur(Request $request)
    {
        $validated = $request->validate([
            'nom'         => 'required|string|max:150',
            'categorie'   => 'nullable|string|max:80',
            'unite'       => 'nullable|string|max:50',
            'frequence'   => 'in:mensuel,trimestriel,annuel',
            'description' => 'nullable|string|max:1000',
            'ordre'       => 'sometimes|integer|min:0',
        ]);

        OpsIndicateur::create(array_merge($validated, [
            'societe_id' => $this->societeId(),
            'frequence'  => $validated['frequence'] ?? 'mensuel',
        ]));

        return redirect()->back()->with('success', 'Indicateur créé.');
    }

    public function updateIndicateur(Request $request, OpsIndicateur $opsIndicateur)
    {
        abort_if($opsIndicateur->societe_id !== $this->societeId(), 403);

        $validated = $request->validate([
            'nom'         => 'required|string|max:150',
            'categorie'   => 'nullable|string|max:80',
            'unite'       => 'nullable|string|max:50',
            'frequence'   => 'in:mensuel,trimestriel,annuel',
            'description' => 'nullable|string|max:1000',
            'actif'       => 'sometimes|boolean',
            'ordre'       => 'sometimes|integer|min:0',
        ]);

        $opsIndicateur->update($validated);

        return redirect()->back()->with('success', 'Indicateur mis à jour.');
    }

    public function destroyIndicateur(OpsIndicateur $opsIndicateur)
    {
        abort_if($opsIndicateur->societe_id !== $this->societeId(), 403);
        $opsIndicateur->delete();

        return redirect()->back()->with('success', 'Indicateur supprimé.');
    }

    // ─── Saisie des valeurs ────────────────────────────────────────────────────

    public function saisir(Request $request)
    {
        $societeId = $this->societeId();

        $validated = $request->validate([
            'ops_indicateur_id' => 'required|exists:ops_indicateurs,id',
            'collaborateur_id'  => 'nullable|exists:collaborateurs,id',
            'periode'           => 'required|string|max:20',
            'valeur'            => 'required|numeric',
            'commentaire'       => 'nullable|string|max:500',
        ]);

        OpsSaisie::updateOrCreate(
            [
                'societe_id'        => $societeId,
                'ops_indicateur_id' => $validated['ops_indicateur_id'],
                'collaborateur_id'  => $validated['collaborateur_id'] ?? null,
                'periode'           => $validated['periode'],
            ],
            [
                'valeur'      => $validated['valeur'],
                'commentaire' => $validated['commentaire'] ?? null,
            ]
        );

        return redirect()->back()->with('success', 'Valeur enregistrée.');
    }

    public function supprimerSaisie(OpsSaisie $opsSaisie)
    {
        abort_if($opsSaisie->societe_id !== $this->societeId(), 403);
        $opsSaisie->delete();

        return redirect()->back()->with('success', 'Saisie supprimée.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function genererPeriodes(): array
    {
        $periodes = [];
        $now = now();
        for ($i = 5; $i >= 0; $i--) {
            $date    = $now->copy()->subMonths($i);
            $periodes[] = [
                'value' => $date->format('Y-m'),
                'label' => $date->translatedFormat('F Y'),
            ];
        }
        return $periodes;
    }
}
