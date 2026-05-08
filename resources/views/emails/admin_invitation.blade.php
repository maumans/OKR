<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation Administrateur</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3b82f6;">Addvalis SaaS Performance</h1>
    </div>

    <p>Bonjour <strong>{{ $user->name }}</strong>,</p>

    <p>La société <strong>{{ $societe->nom }}</strong> vient d'être créée sur la plateforme Addvalis, et vous en êtes l'administrateur principal.</p>

    <p>Voici vos informations de connexion pour accéder à votre espace :</p>

    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Lien de connexion :</strong> <a href="{{ route('login') }}">{{ route('login') }}</a></p>
        <p style="margin: 10px 0 0 0;"><strong>Email :</strong> {{ $user->email }}</p>
        <p style="margin: 10px 0 0 0;"><strong>Mot de passe provisoire :</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">{{ $password }}</code></p>
    </div>

    <p>Nous vous recommandons de changer ce mot de passe dès votre première connexion dans les paramètres de votre profil.</p>

    <p style="margin-top: 30px;">
        Cordialement,<br>
        L'équipe Addvalis
    </p>
</body>
</html>
