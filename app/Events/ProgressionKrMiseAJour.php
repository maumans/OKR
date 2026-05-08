<?php

namespace App\Events;

use App\Models\ResultatCle;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProgressionKrMiseAJour
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ResultatCle $resultatCle,
        public float $ancienneValeur,
        public float $nouvelleValeur,
        public ?string $justification = null,
        public ?int $collaborateurId = null
    ) {}
}
