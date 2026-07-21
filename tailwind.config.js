import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/**
 * Theme Engine — shadcn/ui token system + backward-compat shade scales.
 *
 * Setiap token dibaca dari CSS variable (format "R G B", diisi oleh
 * ThemeProvider saat runtime), menggunakan pola resmi Tailwind untuk
 * dynamic theming: rgb(var(--x) / <alpha-value>).
 *
 * Fallback value (bagian setelah koma) = Royal Indigo light mode,
 * dipakai kalau ThemeProvider belum sempat inject var (first paint).
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

// Fallback = Royal Indigo template (light mode)
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
                /* ── shadcn/ui tokens (36 per mode) ── */
                background: withOpacity('--background', '248 250 252'),
                foreground: withOpacity('--foreground', '15 23 42'),
                card: {
                    DEFAULT: withOpacity('--card', '255 255 255'),
                    foreground: withOpacity('--card-foreground', '15 23 42'),
                },
                popover: {
                    DEFAULT: withOpacity('--popover', '255 255 255'),
                    foreground: withOpacity('--popover-foreground', '15 23 42'),
                },
                primary: {
                    DEFAULT: withOpacity('--primary', '79 70 229'),
                    foreground: withOpacity('--primary-foreground', '255 255 255'),
                    ...themeColorScale('primary', PRIMARY_FALLBACK),
                },
                secondary: {
                    DEFAULT: withOpacity('--secondary', '241 245 249'),
                    foreground: withOpacity('--secondary-foreground', '15 23 42'),
                    ...themeColorScale('secondary', SECONDARY_FALLBACK),
                },
                accent: {
                    DEFAULT: withOpacity('--accent', '139 92 246'),
                    foreground: withOpacity('--accent-foreground', '255 255 255'),
                    ...themeColorScale('accent', ACCENT_FALLBACK),
                },
                muted: {
                    DEFAULT: withOpacity('--muted', '241 245 249'),
                    foreground: withOpacity('--muted-foreground', '100 116 139'),
                },
                destructive: {
                    DEFAULT: withOpacity('--destructive', '220 38 38'),
                    foreground: withOpacity('--destructive-foreground', '255 255 255'),
                },
                success: {
                    DEFAULT: withOpacity('--success', '22 163 74'),
                    foreground: withOpacity('--success-foreground', '255 255 255'),
                },
                warning: {
                    DEFAULT: withOpacity('--warning', '245 158 11'),
                    foreground: withOpacity('--warning-foreground', '255 255 255'),
                },
                info: {
                    DEFAULT: withOpacity('--info', '2 132 199'),
                    foreground: withOpacity('--info-foreground', '255 255 255'),
                },
                border: withOpacity('--border', '226 232 240'),
                input: withOpacity('--input', '226 232 240'),
                ring: withOpacity('--ring', '79 70 229'),
                chart: {
                    1: withOpacity('--chart-1', '79 70 229'),
                    2: withOpacity('--chart-2', '6 182 212'),
                    3: withOpacity('--chart-3', '22 163 74'),
                    4: withOpacity('--chart-4', '245 158 11'),
                    5: withOpacity('--chart-5', '139 92 246'),
                },
                sidebar: {
                    DEFAULT: withOpacity('--sidebar', '255 255 255'),
                    foreground: withOpacity('--sidebar-foreground', '15 23 42'),
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms, containerQueries],
};
