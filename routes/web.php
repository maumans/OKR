<?php

use App\Http\Controllers\CollaborateurController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SocieteController;
use App\Http\Controllers\ObjectifController;
use App\Http\Controllers\TacheController;
use App\Http\Controllers\BilanJournalierController;
use App\Http\Controllers\ProspectController;
use App\Http\Controllers\IncentiveController;
use App\Http\Controllers\ParametreOkrController;
use App\Http\Controllers\EisenhowerController;
use App\Http\Controllers\IndividuelController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('dashboard');
});

// ─── Routes authentifiées ──────────────────────────────────
Route::middleware(['auth', 'verified', \App\Http\Middleware\InjecterSociete::class])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Collaborateurs
    Route::resource('collaborateurs', CollaborateurController::class);

    // Paramètres société
    Route::get('/parametres', [SocieteController::class, 'edit'])->name('parametres.index');
    Route::put('/parametres', [SocieteController::class, 'update'])->name('parametres.update');
    Route::post('/parametres/logo', [SocieteController::class, 'updateLogo'])->name('parametres.logo');

    // Profil utilisateur (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ─── Routes placeholder pour les modules futurs ────────
    // OKR
    Route::resource('objectifs', ObjectifController::class)->except(['edit']);
    Route::put('/objectifs/{objectif}/progress', [ObjectifController::class, 'updateProgress'])->name('objectifs.progress');
    Route::put('/objectifs/{objectif}/status', [ObjectifController::class, 'updateStatus'])->name('objectifs.status');
    // Individuels (OKR par collaborateur / mois)
    Route::get('/individuels', [IndividuelController::class, 'index'])->name('individuels.index');
    Route::post('/individuels', [IndividuelController::class, 'store'])->name('individuels.store');
    Route::put('/individuels/{objectif}', [IndividuelController::class, 'update'])->name('individuels.update');
    Route::delete('/individuels/{objectif}', [IndividuelController::class, 'destroy'])->name('individuels.destroy');
    Route::put('/individuels/kr/{resultatCle}/progression', [IndividuelController::class, 'updateKrProgression'])->name('individuels.kr.progression');
    // Tâches & Daily Management
    Route::get('/taches', [TacheController::class, 'index'])->name('taches.index');
    Route::post('/taches', [TacheController::class, 'store'])->name('taches.store');
    Route::put('/taches/{tache}', [TacheController::class, 'update'])->name('taches.update');
    Route::put('/taches/{tache}/status', [TacheController::class, 'updateStatus'])->name('taches.status');
    Route::delete('/taches/{tache}', [TacheController::class, 'destroy'])->name('taches.destroy');
    
    // Bilans & Daily Tasks
    Route::get('/daily', [BilanJournalierController::class, 'index'])->name('daily.index');
    Route::post('/daily', [BilanJournalierController::class, 'store'])->name('daily.store');
    Route::post('/daily/taches', [BilanJournalierController::class, 'storeTask'])->name('daily.taches.store');
    Route::put('/daily/taches/{tacheDaily}', [BilanJournalierController::class, 'updateTask'])->name('daily.taches.update');
    Route::put('/daily/taches/{tacheDaily}/status', [BilanJournalierController::class, 'updateTaskStatus'])->name('daily.taches.status');
    Route::delete('/daily/taches/{tacheDaily}', [BilanJournalierController::class, 'destroyTask'])->name('daily.taches.destroy');
    // Prospection (Pipeline CRM)
    Route::get('/prospects', [ProspectController::class, 'index'])->name('prospects.index');
    Route::post('/prospects', [ProspectController::class, 'store'])->name('prospects.store');
    Route::put('/prospects/{prospect}/status', [ProspectController::class, 'updateStatus'])->name('prospects.status');
    Route::post('/prospects/{prospect}/actions', [ProspectController::class, 'storeAction'])->name('prospects.actions.store');
    Route::delete('/prospects/{prospect}', [ProspectController::class, 'destroy'])->name('prospects.destroy');
    // Formations (LMS)
    Route::get('/formations', [\App\Http\Controllers\FormationController::class, 'index'])->name('formations.index');
    Route::post('/formations', [\App\Http\Controllers\FormationController::class, 'store'])->name('formations.store');
    Route::get('/formations/{formation}', [\App\Http\Controllers\FormationController::class, 'show'])->name('formations.show');
    Route::put('/formations/{formation}', [\App\Http\Controllers\FormationController::class, 'update'])->name('formations.update');
    Route::delete('/formations/{formation}', [\App\Http\Controllers\FormationController::class, 'destroy'])->name('formations.destroy');
    Route::post('/formations/{formation}/modules', [\App\Http\Controllers\FormationController::class, 'storeModule'])->name('formations.modules.store');
    Route::put('/formations/{formation}/modules/{module}', [\App\Http\Controllers\FormationController::class, 'updateModule'])->name('formations.modules.update');
    Route::delete('/formations/{formation}/modules/{module}', [\App\Http\Controllers\FormationController::class, 'destroyModule'])->name('formations.modules.destroy');
    Route::get('/formations/{formation}/modules/{module}', [\App\Http\Controllers\FormationController::class, 'showModule'])->name('formations.modules.show');
    // Incentives & Primes
    Route::get('/incentives', [IncentiveController::class, 'index'])->name('incentives.index');
    Route::post('/incentives', [IncentiveController::class, 'store'])->name('incentives.store');
    Route::get('/incentives/validation', [IncentiveController::class, 'validationIndex'])->name('incentives.validation');
    Route::post('/incentives/{objectifRemunere}/validate', [IncentiveController::class, 'validateIncentive'])->name('incentives.validate');
    // Reporting
    Route::get('/syntheses', fn () => Inertia::render('Reporting/Index'))->name('syntheses.index');
    // Matrice Eisenhower
    Route::get('/matrice', [EisenhowerController::class, 'index'])->name('matrice.index');
    Route::put('/matrice/{tache}/eisenhower', [EisenhowerController::class, 'updateEisenhower'])->name('matrice.eisenhower');

    // ─── Paramètres OKR ─────────────────────────────────────
    Route::prefix('parametres/okr')->name('parametres.okr.')->group(function () {
        Route::get('/', [ParametreOkrController::class, 'index'])->name('index');
        // Axes
        Route::post('/axes', [ParametreOkrController::class, 'storeAxe'])->name('axes.store');
        Route::put('/axes/{axe}', [ParametreOkrController::class, 'updateAxe'])->name('axes.update');
        Route::delete('/axes/{axe}', [ParametreOkrController::class, 'destroyAxe'])->name('axes.destroy');
        // Périodes
        Route::post('/periodes', [ParametreOkrController::class, 'storePeriode'])->name('periodes.store');
        Route::put('/periodes/{periode}', [ParametreOkrController::class, 'updatePeriode'])->name('periodes.update');
        Route::delete('/periodes/{periode}', [ParametreOkrController::class, 'destroyPeriode'])->name('periodes.destroy');
        // Types d'objectifs
        Route::post('/types-objectifs', [ParametreOkrController::class, 'storeTypeObjectif'])->name('types-objectifs.store');
        Route::put('/types-objectifs/{typeObjectif}', [ParametreOkrController::class, 'updateTypeObjectif'])->name('types-objectifs.update');
        Route::delete('/types-objectifs/{typeObjectif}', [ParametreOkrController::class, 'destroyTypeObjectif'])->name('types-objectifs.destroy');
        // Types de résultats clés
        Route::post('/types-resultats', [ParametreOkrController::class, 'storeTypeResultat'])->name('types-resultats.store');
        Route::put('/types-resultats/{typeResultat}', [ParametreOkrController::class, 'updateTypeResultat'])->name('types-resultats.update');
        Route::delete('/types-resultats/{typeResultat}', [ParametreOkrController::class, 'destroyTypeResultat'])->name('types-resultats.destroy');
        // Statuts
        Route::post('/statuts', [ParametreOkrController::class, 'storeStatut'])->name('statuts.store');
        Route::put('/statuts/{statut}', [ParametreOkrController::class, 'updateStatut'])->name('statuts.update');
        Route::delete('/statuts/{statut}', [ParametreOkrController::class, 'destroyStatut'])->name('statuts.destroy');
        // Seuils
        Route::post('/seuils', [ParametreOkrController::class, 'storeSeuil'])->name('seuils.store');
        Route::put('/seuils/{seuil}', [ParametreOkrController::class, 'updateSeuil'])->name('seuils.update');
        Route::delete('/seuils/{seuil}', [ParametreOkrController::class, 'destroySeuil'])->name('seuils.destroy');
        // Configuration globale
        Route::put('/configuration', [ParametreOkrController::class, 'updateConfiguration'])->name('configuration.update');
    });
});

// ─── Routes SuperAdmin ─────────────────────────────────────
Route::middleware(['auth', 'verified', 'superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/societes', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'index'])->name('societes.index');
    Route::post('/societes', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'store'])->name('societes.store');
    Route::get('/societes/{societe}', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'show'])->name('societes.show');
    
    // Paramètres de la société
    Route::get('/societes/{societe}/parametres', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'index'])->name('societes.parametres.index');
    Route::post('/societes/{societe}/parametres/axes', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'storeAxe'])->name('societes.parametres.axes.store');
    Route::put('/societes/{societe}/parametres/axes/{axe}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'updateAxe'])->name('societes.parametres.axes.update');
    Route::delete('/societes/{societe}/parametres/axes/{axe}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'destroyAxe'])->name('societes.parametres.axes.destroy');
    
    Route::post('/societes/{societe}/parametres/periodes', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'storePeriode'])->name('societes.parametres.periodes.store');
    Route::put('/societes/{societe}/parametres/periodes/{periode}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'updatePeriode'])->name('societes.parametres.periodes.update');
    Route::delete('/societes/{societe}/parametres/periodes/{periode}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'destroyPeriode'])->name('societes.parametres.periodes.destroy');
    
    Route::post('/societes/{societe}/parametres/types-objectifs', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'storeTypeObjectif'])->name('societes.parametres.types-objectifs.store');
    Route::put('/societes/{societe}/parametres/types-objectifs/{typeObjectif}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'updateTypeObjectif'])->name('societes.parametres.types-objectifs.update');
    Route::delete('/societes/{societe}/parametres/types-objectifs/{typeObjectif}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'destroyTypeObjectif'])->name('societes.parametres.types-objectifs.destroy');
    
    Route::post('/societes/{societe}/parametres/types-resultats', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'storeTypeResultat'])->name('societes.parametres.types-resultats.store');
    Route::put('/societes/{societe}/parametres/types-resultats/{typeResultat}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'updateTypeResultat'])->name('societes.parametres.types-resultats.update');
    Route::delete('/societes/{societe}/parametres/types-resultats/{typeResultat}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'destroyTypeResultat'])->name('societes.parametres.types-resultats.destroy');
    
    Route::post('/societes/{societe}/parametres/statuts', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'storeStatut'])->name('societes.parametres.statuts.store');
    Route::put('/societes/{societe}/parametres/statuts/{statut}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'updateStatut'])->name('societes.parametres.statuts.update');
    Route::delete('/societes/{societe}/parametres/statuts/{statut}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'destroyStatut'])->name('societes.parametres.statuts.destroy');
    
    Route::post('/societes/{societe}/parametres/seuils', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'storeSeuil'])->name('societes.parametres.seuils.store');
    Route::put('/societes/{societe}/parametres/seuils/{seuil}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'updateSeuil'])->name('societes.parametres.seuils.update');
    Route::delete('/societes/{societe}/parametres/seuils/{seuil}', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'destroySeuil'])->name('societes.parametres.seuils.destroy');
    
    Route::put('/societes/{societe}/parametres/configuration', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'updateConfiguration'])->name('societes.parametres.configuration.update');
    Route::put('/societes/{societe}/parametres/primes', [\App\Http\Controllers\SuperAdmin\ConfigurationController::class, 'updateConfigurationPrime'])->name('societes.parametres.primes.update');
});

require __DIR__.'/auth.php';
