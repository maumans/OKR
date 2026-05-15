import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number with French locale: 150 000,5
 * Handles strings, numbers, null, undefined gracefully.
 */
export function formatNumber(value, decimals) {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value.toString().replace(/\s/g, '').replace(',', '.')) : Number(value);
    if (isNaN(num)) return '';
    const opts = {};
    if (decimals !== undefined) {
        opts.minimumFractionDigits = 0;
        opts.maximumFractionDigits = decimals;
    }
    return new Intl.NumberFormat('fr-FR', opts).format(num);
}

/**
 * Parse a formatted French number string back to a raw number string.
 * "150 000,5" → "150000.5"
 */
export function parseFormattedNumber(str) {
    if (!str && str !== 0) return '';
    return str.toString().replace(/\s/g, '').replace(',', '.');
}

/**
 * Format currency using the society's devise object from auth.societe.devise.
 * Falls back to GNF (0 decimals) if no devise provided.
 */
export function formatCurrency(value, devise = null) {
    const decimales = devise?.decimales ?? 0;
    const code = devise?.code ?? 'GNF';
    return formatNumber(value, decimales) + ' ' + code;
}

/**
 * Get initials from name
 */
export function getInitials(name) {
    if (!name) return '??';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
