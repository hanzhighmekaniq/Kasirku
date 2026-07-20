import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/**
 * Theme Engine — palet primary/secondary/accent tidak lagi hex statis.
 * Setiap shade dibaca dari CSS variable (format "R G B", diisi oleh
 * ThemeProvider saat runtime), memakai pola resmi Tailwind untuk
 * dynamic theming: rgb(var(--x) / <alpha-value>).
 *
 * Fallback value (bagian setelah koma) = Royal Indigo, dipakai kalau
 * ThemeProvider belum sempat inject var (first paint / SSR-less flash).
 */
function withOpacity(cssVar, fallback) {
    return ({ opacityValue }) =>
        opacityValue === undefined
            ? `rgb(var(${cssVar}, ${fallback}))`
            : `rgb(var(${cssVar}, ${fallback}) / ${opacityValue})`;
}

function themeColorScale(name, fallbacks) {
    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    const scale = {};
    shades.forEach((shade, i) => {
        scale[shade] = withOpacity(`--color-${name}-${shade}`, fallbacks[i]);
    });
    return scale;
}

// Fallback = Royal Indigo template (light mode), dipakai sebelum ThemeProvider inject vars.
const PRIMARY_FALLBACK = ['238 242 255', '224 231 255', '199 210 254', '165 180 252', '129 140 248', '99 102 241', '79 70 229', '67 56 202', '55 48 163', '49 46 129', '30 27 75'];
const SECONDARY_FALLBACK = ['241 245 249', '226 232 240', '203 213 225', '148 163 184', '100 116 139', '71 85 105', '51 65 85', '30 41 59', '15 23 42', '2 6 23', '2 6 23'];
const ACCENT_FALLBACK = ['245 243 255', '237 233 254', '221 214 254', '196 181 253', '167 139 250', '139 92 246', '124 58 237', '109 40 217', '91 33 182', '74 29 150', '46 16 101'];

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                primary: themeColorScale('primary', PRIMARY_FALLBACK),
                secondary: themeColorScale('secondary', SECONDARY_FALLBACK),
                accent: themeColorScale('accent', ACCENT_FALLBACK),
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms, containerQueries],
};
