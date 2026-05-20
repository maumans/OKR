import { usePage } from '@inertiajs/react';

/**
 * Affiche les children uniquement si le module est actif pour la société courante.
 * Les modules core (dashboard, equipe, parametres) sont toujours considérés actifs.
 */
export default function RequireModule({ code, children, fallback = null }) {
    const { modulesActifs = [] } = usePage().props;
    const codesActifs = new Set(modulesActifs.map(m => m.code));

    if (!codesActifs.has(code)) {
        return fallback;
    }

    return children;
}
