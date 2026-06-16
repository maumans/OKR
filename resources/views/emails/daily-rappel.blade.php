@component('mail::message')
# 📋 Rappel — Daily non rempli

Bonjour **{{ $collaborateur->prenom }}**,

Il est déjà **{{ $heureEnvoi }}** et votre bilan Daily du **{{ $dateFormatee }}** n'a pas encore été rempli.

Prenez 2 minutes pour déclarer vos tâches du jour et remplir votre bilan de fin de journée.

**Pourquoi c'est important ?**
- Garder la traçabilité de votre activité quotidienne
- Permettre à votre équipe de suivre l'avancement
- Identifier les blocages au plus vite

@component('mail::button', ['url' => $urlDaily, 'color' => 'primary'])
Remplir mon Daily maintenant
@endcomponent

Si vous avez déjà rempli votre Daily, vous pouvez ignorer ce message.

Cordialement,<br>
**Addvalis OKR** — Votre plateforme de performance
@endcomponent
