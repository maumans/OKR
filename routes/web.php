<?php

use App\Http\Controllers\CollaborateurController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartementController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SocieteController;
use App\Http\Controllers\ObjectifController;
use App\Http\Controllers\TacheController;
use App\Http\Controllers\BilanJournalierController;
use App\Http\Controllers\ProspectController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\IncentiveController;
use App\Http\Controllers\ParametreOkrController;
use App\Http\Controllers\EisenhowerController;
use App\Http\Controllers\IndividuelController;
use App\Http\Controllers\MissionController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\Parametres\ModuleSocieteController;
use App\Http\Controllers\SyntheseController;
use App\Http\Controllers\PrimeMensuelleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PerformanceController;
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

    // ─── Notifications in-app ─────────────────────────────────
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/centre', [NotificationController::class, 'page'])->name('page');
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::post('/{notification}/read', [NotificationController::class, 'markRead'])->name('read');
        Route::post('/read-all', [NotificationController::class, 'markAllRead'])->name('read-all');
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])->name('destroy');
    });

    // Collaborateurs
    Route::resource('collaborateurs', CollaborateurController::class);
    Route::patch('collaborateurs/{collaborateur}/toggle-actif', [CollaborateurController::class, 'toggleActif'])->name('collaborateurs.toggle-actif');

    // Départements
    Route::post('/departements', [DepartementController::class, 'store'])->name('departements.store');
    Route::put('/departements/{departement}', [DepartementController::class, 'update'])->name('departements.update');
    Route::delete('/departements/{departement}', [DepartementController::class, 'destroy'])->name('departements.destroy');

    // Paramètres société
    Route::get('/parametres', [SocieteController::class, 'edit'])->name('parametres.index');
    Route::put('/parametres', [SocieteController::class, 'update'])->name('parametres.update');
    Route::post('/parametres/logo', [SocieteController::class, 'updateLogo'])->name('parametres.logo');

    // Profil utilisateur (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ─── Modules société (gestion des accès) ───────────────────
    Route::get('/parametres/modules', [ModuleSocieteController::class, 'index'])->name('parametres.modules.index');
    Route::put('/parametres/modules/{module}/toggle', [ModuleSocieteController::class, 'toggle'])->name('parametres.modules.toggle');

    // ─── OKR ────────────────────────────────────────────────
    Route::middleware('module:okr')->group(function () {
        Route::put('/objectifs/kr/{resultatCle}', [ObjectifController::class, 'updateKr'])->name('objectifs.kr.update');
        Route::delete('/objectifs/kr/{resultatCle}', [ObjectifController::class, 'destroyKr'])->name('objectifs.kr.destroy');
        Route::post('/objectifs/{objectif}/kr', [ObjectifController::class, 'storeKr'])->name('objectifs.kr.store');
        Route::resource('objectifs', ObjectifController::class)->except(['edit']);
        Route::put('/objectifs/{objectif}/progress', [ObjectifController::class, 'updateProgress'])->name('objectifs.progress');
        Route::put('/objectifs/{objectif}/status', [ObjectifController::class, 'updateStatus'])->name('objectifs.status');
    });

    // ─── Individuels (OKR par collaborateur / mois) ─────────
    Route::middleware('module:individuels')->group(function () {
        Route::get('/individuels', [IndividuelController::class, 'index'])->name('individuels.index');
        Route::post('/individuels', [IndividuelController::class, 'store'])->name('individuels.store');
        Route::put('/individuels/{objectif}', [IndividuelController::class, 'update'])->name('individuels.update');
        Route::delete('/individuels/{objectif}', [IndividuelController::class, 'destroy'])->name('individuels.destroy');
        Route::put('/individuels/kr/{resultatCle}/progression', [IndividuelController::class, 'updateKrProgression'])->name('individuels.kr.progression');
    });

    // ─── Performance ─────────────────────────────────────────
    Route::middleware('module:performance')->group(function () {
        Route::get('/performance', [PerformanceController::class, 'index'])->name('performance.index');
        Route::post('/performance', [PerformanceController::class, 'store'])->name('performance.store');
        Route::put('/performance/{fiche}', [PerformanceController::class, 'update'])->name('performance.update');
        Route::post('/performance/{fiche}/avancer', [PerformanceController::class, 'avancerWorkflow'])->name('performance.avancer');
        Route::post('/performance/{fiche}/cloturer', [PerformanceController::class, 'cloturerFinale'])->name('performance.cloturer');
        Route::delete('/performance/{fiche}', [PerformanceController::class, 'destroy'])->name('performance.destroy');
    });

    // ─── Tâches ──────────────────────────────────────────────
    Route::middleware('module:taches')->group(function () {
        Route::get('/taches', [TacheController::class, 'index'])->name('taches.index');
        Route::post('/taches', [TacheController::class, 'store'])->name('taches.store');
        Route::put('/taches/{tache}', [TacheController::class, 'update'])->name('taches.update');
        Route::put('/taches/{tache}/status', [TacheController::class, 'updateStatus'])->name('taches.status');
        Route::patch('/taches/{tache}/note', [TacheController::class, 'updateNote'])->name('taches.note');
        Route::patch('/taches/{tache}/assignee', [TacheController::class, 'updateAssignee'])->name('taches.assignee');
        Route::delete('/taches/{tache}', [TacheController::class, 'destroy'])->name('taches.destroy');
        Route::post('/taches/{tache}/fichiers', [TacheController::class, 'uploadFichier'])->name('taches.fichiers.store');
        Route::get('/taches/{tache}/fichiers/{fichier}/download', [TacheController::class, 'downloadFichier'])->name('taches.fichiers.download');
        Route::delete('/taches/{tache}/fichiers/{fichier}', [TacheController::class, 'destroyFichier'])->name('taches.fichiers.destroy');
    });

    // ─── Daily ───────────────────────────────────────────────
    Route::middleware('module:daily')->group(function () {
        Route::get('/daily', [BilanJournalierController::class, 'index'])->name('daily.index');
        Route::get('/daily/overview', [BilanJournalierController::class, 'overview'])->name('daily.overview');
        Route::post('/daily', [BilanJournalierController::class, 'store'])->name('daily.store');
        Route::post('/daily/taches', [BilanJournalierController::class, 'storeTask'])->name('daily.taches.store');
        Route::put('/daily/taches/{tacheDaily}', [BilanJournalierController::class, 'updateTask'])->name('daily.taches.update');
        Route::put('/daily/taches/{tacheDaily}/status', [BilanJournalierController::class, 'updateTaskStatus'])->name('daily.taches.status');
        Route::delete('/daily/taches/{tacheDaily}', [BilanJournalierController::class, 'destroyTask'])->name('daily.taches.destroy');
    });

    // ─── Prospection (Pipeline CRM) ─────────────────────────
    Route::middleware('module:prospection')->group(function () {
        Route::get('/prospects', [ProspectController::class, 'index'])->name('prospects.index');
        Route::post('/prospects', [ProspectController::class, 'store'])->name('prospects.store');
        Route::put('/prospects/{prospect}', [ProspectController::class, 'update'])->name('prospects.update');
        Route::put('/prospects/{prospect}/status', [ProspectController::class, 'updateStatus'])->name('prospects.status');
        Route::post('/prospects/{prospect}/actions', [ProspectController::class, 'storeAction'])->name('prospects.actions.store');
        Route::delete('/prospects/{prospect}', [ProspectController::class, 'destroy'])->name('prospects.destroy');

        Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
        Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
        Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');
    });

    // ─── Formations (LMS) ────────────────────────────────────
    Route::middleware('module:lms')->group(function () {
        Route::get('/formations', [\App\Http\Controllers\FormationController::class, 'index'])->name('formations.index');
        Route::post('/formations', [\App\Http\Controllers\FormationController::class, 'store'])->name('formations.store');
        Route::get('/formations/{formation}', [\App\Http\Controllers\FormationController::class, 'show'])->name('formations.show');
        Route::put('/formations/{formation}', [\App\Http\Controllers\FormationController::class, 'update'])->name('formations.update');
        Route::delete('/formations/{formation}', [\App\Http\Controllers\FormationController::class, 'destroy'])->name('formations.destroy');
        Route::post('/formations/{formation}/modules', [\App\Http\Controllers\FormationController::class, 'storeModule'])->name('formations.modules.store');
        Route::put('/formations/{formation}/modules/{module}', [\App\Http\Controllers\FormationController::class, 'updateModule'])->name('formations.modules.update');
        Route::delete('/formations/{formation}/modules/{module}', [\App\Http\Controllers\FormationController::class, 'destroyModule'])->name('formations.modules.destroy');
        Route::get('/formations/{formation}/modules/{module}', [\App\Http\Controllers\FormationController::class, 'showModule'])->name('formations.modules.show');
    });

    // ─── Incentives & Primes ─────────────────────────────────
    Route::middleware('module:incentives')->group(function () {
        Route::get('/incentives', [IncentiveController::class, 'index'])->name('incentives.index');
        Route::post('/incentives', [IncentiveController::class, 'store'])->name('incentives.store');
        Route::get('/incentives/validation', [IncentiveController::class, 'validationIndex'])->name('incentives.validation');
        Route::post('/incentives/{objectifRemunere}/validate', [IncentiveController::class, 'validateIncentive'])->name('incentives.validate');
    });

    // ─── Missions (War Room Ops) ──────────────────────────────
    Route::middleware('module:missions')->group(function () {
        Route::get('/missions', [MissionController::class, 'index'])->name('missions.index');
        Route::post('/missions', [MissionController::class, 'store'])->name('missions.store');
        Route::put('/missions/{mission}', [MissionController::class, 'update'])->name('missions.update');
        Route::delete('/missions/{mission}', [MissionController::class, 'destroy'])->name('missions.destroy');
        Route::post('/missions/{mission}/livrables', [MissionController::class, 'storeLivrable'])->name('missions.livrables.store');
        Route::put('/missions/{mission}/livrables/{livrable}', [MissionController::class, 'updateLivrable'])->name('missions.livrables.update');
        Route::put('/missions/{mission}/livrables/{livrable}/advance', [MissionController::class, 'advanceLivrable'])->name('missions.livrables.advance');
        Route::delete('/missions/{mission}/livrables/{livrable}', [MissionController::class, 'destroyLivrable'])->name('missions.livrables.destroy');
        Route::post('/missions/{mission}/logs', [MissionController::class, 'storeLog'])->name('missions.logs.store');
        Route::put('/missions/{mission}/validate-dir', [MissionController::class, 'validateDir'])->name('missions.validate_dir');
        Route::put('/missions/{mission}/nps', [MissionController::class, 'updateNps'])->name('missions.nps.update');
    });

    // ─── Import Excel ─────────────────────────────────────────
    Route::middleware('module:import')->group(function () {
        Route::get('/import', [ImportController::class, 'index'])->name('import.index');
        Route::post('/import/parse', [ImportController::class, 'parse'])->name('import.parse');
        Route::post('/import/commit', [ImportController::class, 'commit'])->name('import.commit');
        Route::get('/import/historique', [ImportController::class, 'historique'])->name('import.historique');
        Route::delete('/import/{import}', [ImportController::class, 'destroy'])->name('import.destroy');
    });

    // ─── Reporting ────────────────────────────────────────────
    Route::middleware('module:reporting')->group(function () {
        Route::get('/reporting', fn () => Inertia::render('Reporting/Index'))->name('syntheses.index');
    });

    // ─── Synthèse mensuelle (primes) ─────────────────────────
    Route::middleware('module:synthese')->prefix('synthese')->name('synthese.')->group(function () {
        Route::get('/', [SyntheseController::class, 'index'])->name('index');
        Route::get('/historique', [SyntheseController::class, 'historique'])->name('historique');
        Route::get('/{mois}/export', [SyntheseController::class, 'export'])->name('export');
        Route::post('/{mois}/cloturer', [SyntheseController::class, 'cloturer'])->name('cloturer');

        // Primes mensuelles
        Route::put('/primes/{collaborateur}/{mois}', [PrimeMensuelleController::class, 'update'])->name('primes.update');
        Route::post('/primes/{collaborateur}/{mois}/valider', [PrimeMensuelleController::class, 'valider'])->name('primes.valider');
    });

    // ─── Matrice Eisenhower ───────────────────────────────────
    Route::middleware('module:matrice')->group(function () {
        Route::get('/matrice', [EisenhowerController::class, 'index'])->name('matrice.index');
        Route::put('/matrice/{tache}/eisenhower', [EisenhowerController::class, 'updateEisenhower'])->name('matrice.eisenhower');
    });

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

    // Dashboard
    Route::get('/', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'index'])->name('dashboard');

    // Sociétés
    Route::get('/societes', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'index'])->name('societes.index');
    Route::get('/societes/create', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'create'])->name('societes.create');
    Route::post('/societes', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'store'])->name('societes.store');
    Route::get('/societes/{societe}', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'show'])->name('societes.show');
    Route::get('/societes/{societe}/edit', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'edit'])->name('societes.edit');
    Route::put('/societes/{societe}', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'update'])->name('societes.update');
    Route::delete('/societes/{societe}', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'destroy'])->name('societes.destroy');
    Route::post('/societes/{societe}/modules/{module}/toggle', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'toggleModule'])->name('societes.modules.toggle');
    Route::post('/societes/{societe}/suspendre', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'suspendre'])->name('societes.suspendre');
    Route::post('/societes/{societe}/reactiver', [\App\Http\Controllers\SuperAdmin\SocieteController::class, 'reactiver'])->name('societes.reactiver');

    // Utilisateurs
    Route::get('/utilisateurs', [\App\Http\Controllers\SuperAdmin\UtilisateurController::class, 'index'])->name('utilisateurs.index');
    Route::get('/utilisateurs/{user}', [\App\Http\Controllers\SuperAdmin\UtilisateurController::class, 'show'])->name('utilisateurs.show');
    Route::post('/utilisateurs/{user}/promouvoir', [\App\Http\Controllers\SuperAdmin\UtilisateurController::class, 'promouvoir'])->name('utilisateurs.promouvoir');
    Route::post('/utilisateurs/{user}/revoquer', [\App\Http\Controllers\SuperAdmin\UtilisateurController::class, 'revoquer'])->name('utilisateurs.revoquer');

    // Modules (catalogue plateforme)
    Route::get('/modules', [\App\Http\Controllers\SuperAdmin\ModuleController::class, 'index'])->name('modules.index');
    Route::post('/modules', [\App\Http\Controllers\SuperAdmin\ModuleController::class, 'store'])->name('modules.store');
    Route::put('/modules/{module}', [\App\Http\Controllers\SuperAdmin\ModuleController::class, 'update'])->name('modules.update');

    // Abonnements
    Route::get('/abonnements', [\App\Http\Controllers\SuperAdmin\AbonnementController::class, 'index'])->name('abonnements.index');
    Route::post('/abonnements', [\App\Http\Controllers\SuperAdmin\AbonnementController::class, 'store'])->name('abonnements.store');
    Route::put('/abonnements/{abonnement}', [\App\Http\Controllers\SuperAdmin\AbonnementController::class, 'update'])->name('abonnements.update');

    // Audit logs
    Route::get('/audit-logs', [\App\Http\Controllers\SuperAdmin\AuditLogController::class, 'index'])->name('audit-logs.index');

    // Impersonation (stop doit être avant {user} pour éviter le conflit de route model binding)
    Route::post('/impersonation/stop', [\App\Http\Controllers\SuperAdmin\ImpersonationController::class, 'stop'])->name('impersonation.stop');
    Route::post('/impersonation/{user}', [\App\Http\Controllers\SuperAdmin\ImpersonationController::class, 'start'])->name('impersonation.start');

    // Paramètres plateforme
    Route::get('/parametres', [\App\Http\Controllers\SuperAdmin\ParametresPlateformeController::class, 'index'])->name('parametres.index');

    // Paramètres OKR d'une société (inchangé)
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
