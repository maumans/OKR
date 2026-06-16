<?php

namespace App\Http\Controllers;

use App\Models\NotificationApp;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $service) {}

    /**
     * Page centre de notifications (Inertia).
     */
    public function page(Request $request)
    {
        $user      = $request->user();
        $societeId = session('societe_id');
        $type      = $request->get('type', 'toutes');

        $query = NotificationApp::where('societe_id', $societeId)
            ->pourUser($user->id)
            ->latest();

        if ($type === 'non_lues') {
            $query->nonLues();
        } elseif ($type && $type !== 'toutes') {
            $query->where('type', $type);
        }

        $notifications = $query->paginate(20)->through(fn ($n) => $this->format($n));

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'activeType'    => $type,
        ]);
    }

    /**
     * Liste paginée JSON des notifications de l'utilisateur courant.
     */
    public function index(Request $request)
    {
        $user      = $request->user();
        $societeId = session('societe_id');

        $notifications = NotificationApp::where('societe_id', $societeId)
            ->pourUser($user->id)
            ->latest()
            ->paginate(20)
            ->through(fn ($n) => $this->format($n));

        return response()->json($notifications);
    }

    /**
     * Marque une notification comme lue.
     */
    public function markRead(Request $request, NotificationApp $notification)
    {
        $this->authorizeNotification($request, $notification);
        $this->service->marquerLue($notification);
        return response()->json(['ok' => true]);
    }

    /**
     * Marque toutes les notifications comme lues.
     */
    public function markAllRead(Request $request)
    {
        $this->service->marquerToutesLues(
            $request->user()->id,
            session('societe_id')
        );
        return response()->json(['ok' => true]);
    }

    /**
     * Supprime une notification.
     */
    public function destroy(Request $request, NotificationApp $notification)
    {
        $this->authorizeNotification($request, $notification);
        $notification->delete();
        return response()->json(['ok' => true]);
    }

    /**
     * Endpoint léger pour le polling côté client (count + 10 dernières).
     */
    public function poll(Request $request)
    {
        $user      = $request->user();
        $societeId = session('societe_id');

        if (!$societeId) {
            return response()->json(['count' => 0, 'items' => []]);
        }

        $count = NotificationApp::where('societe_id', $societeId)
            ->pourUser($user->id)
            ->nonLues()
            ->count();

        $items = NotificationApp::where('societe_id', $societeId)
            ->pourUser($user->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($n) => $this->format($n));

        return response()->json(['count' => $count, 'items' => $items]);
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function authorizeNotification(Request $request, NotificationApp $notification): void
    {
        abort_if(
            $notification->societe_id !== session('societe_id')
            || ($notification->user_id !== null && $notification->user_id !== $request->user()->id),
            403
        );
    }

    private function format(NotificationApp $n): array
    {
        return [
            'id'         => $n->id,
            'type'       => $n->type,
            'titre'      => $n->titre,
            'body'       => $n->body,
            'data'       => $n->data,
            'lue'        => $n->lue,
            'lue_le'     => $n->lue_le?->toISOString(),
            'created_at' => $n->created_at->toISOString(),
            'ago'        => $n->created_at->diffForHumans(),
        ];
    }
}
