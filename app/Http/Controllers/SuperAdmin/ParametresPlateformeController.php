<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ParametresPlateformeController extends Controller
{
    public function index()
    {
        return Inertia::render('SuperAdmin/Parametres/Index');
    }
}
