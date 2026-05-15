import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './node_modules/react-tailwindcss-datepicker/dist/index.esm.js',
    ],

    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6', // Bleu "Property Builder"
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                secondary: {
                    50: '#fff9e6',
                    100: '#feefb3',
                    200: '#fee580',
                    300: '#fedb4d',
                    400: '#fed11a',
                    500: '#FEAC00',
                    600: '#cb8a00',
                    700: '#986700',
                    800: '#664500',
                    900: '#332200',
                },
                dark: {
                    50: '#f7f7f8',
                    100: '#eeeef0',
                    200: '#d5d5d9',
                    300: '#b0b0b8',
                    400: '#85858f',
                    500: '#666674',
                    600: '#525260',
                    700: '#3d3d4a',
                    800: '#2a2a35',
                    900: '#1a1a24',
                    950: '#0f0f17',
                },
                surface: {
                    light: '#ffffff',
                    dark: '#1e1e2d',
                    'dark-alt': '#252536',
                },
            },
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            borderRadius: {
                'xl': '0.875rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                'glow-primary': '0 0 20px rgba(0, 201, 255, 0.15)',
                'glow-secondary': '0 0 20px rgba(254, 172, 0, 0.15)',
                'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 10px 25px rgba(0, 0, 0, 0.1), 0 6px 10px rgba(0, 0, 0, 0.08)',
                'sidebar': '4px 0 15px rgba(0, 0, 0, 0.05)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateX(-10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 5px rgba(0, 201, 255, 0.2)' },
                    '50%': { boxShadow: '0 0 20px rgba(0, 201, 255, 0.4)' },
                },
            },
        },
    },

    plugins: [forms({ strategy: 'class' })],
};
