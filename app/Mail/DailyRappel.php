<?php

namespace App\Mail;

use App\Models\Collaborateur;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DailyRappel extends Mailable
{
    use Queueable, SerializesModels;

    public string $dateFormatee;
    public string $urlDaily;

    public function __construct(public readonly Collaborateur $collaborateur)
    {
        $this->dateFormatee = Carbon::today()->locale('fr')->isoFormat('dddd D MMMM YYYY');
        $this->urlDaily     = url('/daily');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '📋 Rappel Daily — ' . Carbon::today()->format('d/m/Y'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.daily-rappel',
        );
    }
}
