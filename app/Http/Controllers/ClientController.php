<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'     => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'secteur' => 'nullable|string|max:255',
            'site_web'=> 'nullable|string|max:255',
            'adresse' => 'nullable|string',
            'note'    => 'nullable|string',
        ]);

        Client::create(array_merge($validated, [
            'societe_id' => session('societe_id'),
        ]));

        return redirect()->back()->with('success', 'Client créé.');
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'nom'     => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'secteur' => 'nullable|string|max:255',
            'site_web'=> 'nullable|string|max:255',
            'adresse' => 'nullable|string',
            'note'    => 'nullable|string',
        ]);

        $client->update($validated);

        return redirect()->back()->with('success', 'Client mis à jour.');
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->back()->with('success', 'Client supprimé.');
    }
}
