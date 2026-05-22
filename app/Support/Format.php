<?php

namespace App\Support;

use App\Models\Devise;

class Format
{
    /**
     * Formate un montant avec la devise fournie.
     * Équivalent PHP de formatCurrency() côté front.
     *
     * @param  float|int|string $value
     * @param  Devise|null      $devise
     * @return string  "150 000 GNF"
     */
    public static function currency(float|int|string $value, ?Devise $devise = null): string
    {
        $decimales = $devise?->decimales ?? 0;
        $code = $devise?->code ?? 'GNF';

        return number_format((float) $value, $decimales, ',', ' ') . ' ' . $code;
    }

    /**
     * Formate un nombre en notation française.
     */
    public static function number(float|int|string $value, int $decimals = 0): string
    {
        return number_format((float) $value, $decimals, ',', ' ');
    }

    /**
     * Formate un pourcentage : "87,5%"
     */
    public static function percent(float|int|string $value, int $decimals = 1): string
    {
        return number_format((float) $value, $decimals, ',', ' ') . '%';
    }
}
