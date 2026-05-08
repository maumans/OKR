<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // ─── Event → Listener mapping ──────────────────────────
        Event::listen(
            \App\Events\ProgressionKrMiseAJour::class,
            \App\Listeners\EnregistrerHistoriqueKr::class,
        );

        Event::listen(
            \App\Events\TacheStatutChange::class,
            \App\Listeners\LoggerChangementStatut::class,
        );

        Event::listen(
            \App\Events\ProspectStatutChange::class,
            \App\Listeners\LoggerConversionProspect::class,
        );
    }
}
