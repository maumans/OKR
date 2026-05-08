<?php

namespace App\Events;

use App\Models\Prospect;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProspectStatutChange
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Prospect $prospect,
        public string $ancienStatut,
        public string $nouveauStatut,
        public ?int $collaborateurId = null
    ) {}
}
