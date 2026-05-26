<?php

namespace App\Mail;

use App\Models\Livrable;
use App\Models\Mission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LivrableDeadlineApproche extends Mailable
{
    use Queueable, SerializesModels;

    public int $joursRestants;

    public function __construct(
        public readonly Livrable $livrable,
        public readonly Mission  $mission,
    ) {
        $this->joursRestants = (int) now()->startOfDay()
            ->diffInDays($livrable->deadline_envoi, false);
    }

    public function envelope(): Envelope
    {
        $sujet = $this->joursRestants <= 0
            ? "⚠️ Livrable en retard : {$this->livrable->nom}"
            : "⏰ Livrable dû dans {$this->joursRestants} jour(s) : {$this->livrable->nom}";

        return new Envelope(subject: $sujet);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.livrable-deadline',
        );
    }
}
