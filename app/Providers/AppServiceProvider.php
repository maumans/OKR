<?php

namespace App\Providers;

use App\Models\Livrable;
use App\Models\Mission;
use App\Models\Prospect;
use App\Models\Societe;
use App\Models\User;
use App\Observers\LivrableObserver;
use App\Observers\MissionObserver;
use App\Observers\ProspectObserver;
use App\Observers\SocieteObserver;
use App\Observers\UserObserver;
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

        // ─── Observers ──────────────────────────────────────────
        Societe::observe(SocieteObserver::class);
        User::observe(UserObserver::class);
        Prospect::observe(ProspectObserver::class);
        Mission::observe(MissionObserver::class);
        Livrable::observe(LivrableObserver::class);

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
