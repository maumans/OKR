import { Link } from '@inertiajs/react';
import { Target, TrendingUp, Users2, CheckCircle2 } from 'lucide-react';

const FEATURES = [
    { icon: Target,     text: 'Suivez vos OKR en temps réel' },
    { icon: TrendingUp, text: 'Mesurez la performance individuelle' },
    { icon: Users2,     text: 'Alignez toute votre organisation' },
];

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex">

            {/* ── Panneau gauche (branding) ── */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between overflow-hidden bg-[#0a0e1a]">
                {/* Gradient de fond */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0d1530] to-[#0a1628]" />

                {/* Cercles décoratifs */}
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-3xl" />
                <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-primary-400/8 blur-3xl" />
                <div className="absolute -bottom-20 left-1/4 w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-3xl" />

                {/* Grille de points décorative */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                {/* Contenu */}
                <div className="relative z-10 flex flex-col h-full px-14 py-12 justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 w-fit group">
                        <div className="bg-primary-500 p-2.5 rounded-xl shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-shadow">
                            <Target className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-xl text-white leading-tight">Addvalis OKR</p>
                            <p className="text-[10px] tracking-[0.2em] text-primary-400 font-semibold uppercase">Performance</p>
                        </div>
                    </Link>

                    {/* Bloc central */}
                    <div className="py-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-6">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
                            Plateforme de performance
                        </div>

                        <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                            Pilotez votre<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400">
                                performance
                            </span><br />
                            en équipe
                        </h2>
                        <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                            Définissez vos objectifs, mesurez vos résultats clés et alignez toute votre organisation autour d'une vision commune.
                        </p>

                        {/* Features */}
                        <div className="mt-8 space-y-3">
                            {FEATURES.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-3 text-slate-300">
                                    <div className="h-7 w-7 rounded-lg bg-primary-500/15 border border-primary-500/20 flex items-center justify-center shrink-0">
                                        <Icon className="h-3.5 w-3.5 text-primary-400" />
                                    </div>
                                    <span className="text-sm">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-slate-600 text-xs">
                        © {new Date().getFullYear()} Addvalis · Tous droits réservés
                    </p>
                </div>

                {/* Séparateur lumineux */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary-500/20 to-transparent" />
            </div>

            {/* ── Panneau droit (formulaire) ── */}
            <div className="flex-1 flex flex-col justify-center items-center bg-white dark:bg-[#0d1117] px-6 py-12 sm:px-10">

                {/* Logo mobile only */}
                <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
                    <div className="bg-primary-500 p-2 rounded-xl">
                        <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight">Addvalis OKR</p>
                        <p className="text-[9px] tracking-[0.2em] text-primary-500 font-semibold uppercase">Performance</p>
                    </div>
                </Link>

                {/* Card formulaire */}
                <div className="w-full max-w-[420px]">
                    {children}
                </div>

                {/* Footer mobile */}
                <p className="mt-10 text-xs text-slate-400 lg:hidden text-center">
                    © {new Date().getFullYear()} Addvalis · Tous droits réservés
                </p>
            </div>
        </div>
    );
}
