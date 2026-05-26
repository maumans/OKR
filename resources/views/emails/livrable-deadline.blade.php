@component('mail::message')
# {{ $joursRestants <= 0 ? '⚠️ Livrable en retard' : '⏰ Échéance proche' }}

Bonjour,

@if ($joursRestants <= 0)
Le livrable **{{ $livrable->nom }}** de la mission **{{ $mission->titre }}** (client : {{ $mission->client }}) est **en retard** depuis {{ abs($joursRestants) }} jour(s).
@elseif ($joursRestants === 1)
Le livrable **{{ $livrable->nom }}** de la mission **{{ $mission->titre }}** (client : {{ $mission->client }}) doit être envoyé **demain**.
@else
Le livrable **{{ $livrable->nom }}** de la mission **{{ $mission->titre }}** (client : {{ $mission->client }}) doit être envoyé dans **{{ $joursRestants }} jours**.
@endif

**Détails du livrable :**

| Champ | Valeur |
|---|---|
| Statut actuel | {{ ucfirst(str_replace('_', ' ', $livrable->statut)) }} |
| Type | {{ $livrable->type_livrable ?? 'N/A' }} |
| Version | {{ $livrable->version }} |
| Date d'envoi prévue | {{ $livrable->deadline_envoi?->format('d/m/Y') ?? 'Non définie' }} |
@if ($livrable->deadline_validation)
| Date de validation | {{ $livrable->deadline_validation->format('d/m/Y') }} |
@endif

@component('mail::button', ['url' => url('/missions'), 'color' => $joursRestants <= 0 ? 'red' : ($joursRestants <= 3 ? 'orange' : 'primary')])
Voir la mission
@endcomponent

Merci de mettre à jour le statut du livrable dès que possible.

Cordialement,<br>
**Addvalis OKR** — Votre plateforme de performance
@endcomponent
