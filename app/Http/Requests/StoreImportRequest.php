<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fichier' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'fichier.required' => 'Veuillez sélectionner un fichier à importer.',
            'fichier.file' => 'Le fichier est invalide.',
            'fichier.mimes' => 'Le fichier doit être au format Excel (.xlsx, .xls) ou CSV (.csv).',
            'fichier.max' => 'Le fichier ne doit pas dépasser 10 Mo.',
        ];
    }
}
