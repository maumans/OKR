<?php

namespace App\Http\Controllers;

use App\Models\Collaborateur;
use App\Models\SeuilPerformance;
use App\Models\Synthese;
use App\Services\SyntheseService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SyntheseController extends Controller
{
    public function __construct(private SyntheseService $syntheseService) {}

    /**
     * Page principale — tableau de synthèse mensuelle des primes.
     */
    public function index(Request $request)
    {
        $societeId = session('societe_id');

        $moisActuel = $request->mois ?? Carbon::now()->format('Y-m');

        // Valider le format du mois
        try {
            Carbon::createFromFormat('Y-m', $moisActuel);
        } catch (\Exception $e) {
            $moisActuel = Carbon::now()->format('Y-m');
        }

        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->orderBy('nom')
            ->get();

        $donnees = $collaborateurs->map(
            fn($c) => $this->syntheseService->getDonneesCollaborateur($c, $moisActuel)
        );

        $seuils = SeuilPerformance::pourSociete($societeId)->ordonne()->get(['nom', 'couleur', 'seuil_min', 'seuil_max']);

        return Inertia::render('Synthese/Index', [
            'moisActuel'   => $moisActuel,
            'moisOptions'  => $this->getMoisOptions(),
            'donnees'      => $donnees->values(),
            'seuils'       => $seuils,
        ]);
    }

    /**
     * Clôturer un mois : génère/met à jour le snapshot syntheses.
     */
    public function cloturer(string $mois)
    {
        try {
            Carbon::createFromFormat('Y-m', $mois);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Format de mois invalide.');
        }

        $this->syntheseService->genererSnapshot($mois);

        return redirect()->back()->with('success', '📊 Mois clôturé · Snapshot créé.');
    }

    /**
     * Export CSV de la synthèse mensuelle.
     */
    public function export(string $mois)
    {
        try {
            Carbon::createFromFormat('Y-m', $mois);
        } catch (\Exception $e) {
            abort(400, 'Format de mois invalide.');
        }

        $societeId = session('societe_id');
        $societe = auth()->user()->collaborateurActuel()->societe->load('devise');
        $devise = $societe->devise;
        $deviseCode = $devise?->code ?? 'GNF';

        $collaborateurs = Collaborateur::where('societe_id', $societeId)
            ->actifs()
            ->orderBy('nom')
            ->get();

        $donnees = $collaborateurs->map(
            fn($c) => $this->syntheseService->getDonneesCollaborateur($c, $mois)
        );

        $bom = chr(0xEF) . chr(0xBB) . chr(0xBF);
        $headers = ['Collaborateur', 'Poste', 'Score Global', 'Nb Objectifs', "Prime Max ({$deviseCode})",
                    'Seuil', 'Prime Acquise', 'Validée Manager', 'Commentaire', 'Prospects', 'Signés'];

        $lines = [$bom . implode(';', $headers)];

        foreach ($donnees as $d) {
            $c = $d['collaborateur'];
            $prime = $d['prime'];
            $lines[] = implode(';', [
                '"' . $c['prenom'] . ' ' . $c['nom'] . '"',
                '"' . ($c['poste'] ?? '') . '"',
                number_format($d['score_global'], 1, ',', ' ') . '%',
                $d['nb_objectifs'],
                number_format((float)($prime?->montant_max ?? 0), 0, ',', ' ') . ' ' . $deviseCode,
                ($prime?->seuil_pourcentage ?? 80) . '%',
                $d['prime_acquise'] ? 'Oui' : 'Non',
                ($prime?->validee ? 'Oui' : 'Non'),
                '"' . str_replace('"', '""', $prime?->commentaire_manager ?? '') . '"',
                $d['prospection']['total'],
                $d['prospection']['signes'],
            ]);
        }

        $csv = implode("\r\n", $lines);
        $societeSlug = \Illuminate\Support\Str::slug($societe->nom);
        $filename = "synthese-{$societeSlug}-{$mois}.csv";

        return response()->streamDownload(
            fn() => print($csv),
            $filename,
            ['Content-Type' => 'text/csv; charset=UTF-8']
        );
    }

    /**
     * Historique des snapshots clôturés.
     */
    public function historique()
    {
        $societeId = session('societe_id');

        $syntheses = Synthese::where('societe_id', $societeId)
            ->with('generePar:id,name')
            ->orderBy('mois', 'desc')
            ->get()
            ->map(fn($s) => [
                'id'                  => $s->id,
                'mois'                => $s->mois->format('Y-m'),
                'mois_label'          => ucfirst($s->mois->translatedFormat('F Y')),
                'budget_primes_total' => (float) $s->budget_primes_total,
                'nb_primes_accordees' => $s->nb_primes_accordees,
                'nb_collaborateurs'   => $s->nb_collaborateurs,
                'genere_par'          => $s->generePar?->name,
                'genere_le'           => $s->updated_at->format('d/m/Y H:i'),
                'payload'             => $s->payload,
            ]);

        return Inertia::render('Synthese/Historique', [
            'syntheses' => $syntheses,
        ]);
    }

    // ─── Helpers ───────────────────────────────────────────

    private function getMoisOptions(): array
    {
        $options = [];
        $start = Carbon::now()->subMonths(11)->startOfMonth();
        $end = Carbon::now()->startOfMonth();

        while ($start->lte($end)) {
            $options[] = [
                'value' => $start->format('Y-m'),
                'label' => ucfirst($start->translatedFormat('F Y')),
            ];
            $start->addMonth();
        }

        return array_reverse($options);
    }
}
