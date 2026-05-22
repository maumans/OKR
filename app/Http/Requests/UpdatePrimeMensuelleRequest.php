<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePrimeMensuelleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'montant_max'          => 'required|numeric|min:0',
            'seuil_pourcentage'    => 'required|integer|between:50,100',
            'commentaire_manager'  => 'nullable|string|max:2000',
            'validee'              => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'montant_max.required'       => 'Le montant maximum est obligatoire.',
            'montant_max.numeric'        => 'Le montant doit être un nombre.',
            'montant_max.min'            => 'Le montant ne peut pas être négatif.',
            'seuil_pourcentage.required' => 'Le seuil d\'atteinte est obligatoire.',
            'seuil_pourcentage.integer'  => 'Le seuil doit être un entier.',
            'seuil_pourcentage.between'  => 'Le seuil doit être compris entre 50 et 100.',
        ];
    }
}
