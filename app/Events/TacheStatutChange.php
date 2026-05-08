<?php

namespace App\Events;

use App\Models\Tache;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TacheStatutChange
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Tache $tache,
        public string $ancienStatut,
        public string $nouveauStatut,
        public ?int $collaborateurId = null
    ) {}
}
