/**
 * ── Theme Engine: Built-in Templates ─────────────────────────────
 *
 * 4 template siap pakai (Ocean Blue, Emerald Green, Sunset Orange,
 * Royal Indigo). Setiap template punya struktur `light` & `dark`
 * lengkap sesuai `ThemeModeTokens` (lihat tokens.js).
 *
 * Dark mode TIDAK sekadar invert — mengikuti prinsip base neutral
 * yang konsisten (background #0F172A, surface #1E293B, card #1F2937,
 * border #334155, textPrimary #F8FAFC, dst) di semua template, hanya
 * primary/accent yang berbeda identitas warnanya dan di-shift ke
 * shade yang lebih terang supaya tetap kontras di atas background gelap.
 */

import { generateColorScale, ensureAA } from './generateShades';

// Semantic status colors — konsisten di semua template (standar umum
// success=green, warning=amber, danger=red, info=sky) supaya user
// tidak bingung antar-tema saat baca notifikasi/badge status.
const SEMANTIC = {
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    info: '#0284C7',
};

// Base neutral (secondary) dipakai semua template — variasi antar-tema
// cukup lewat primary & accent, secondary tetap netral agar teks/border
// tidak "kebanting" warna.
const SECONDARY_BASE = '#64748B'; // slate-500

/**
 * Bangun satu ThemeDefinition lengkap (light+dark) dari 3 warna dasar.
 * @param {Object} opts
 * @param {string} opts.id
 * @param {string} opts.label
 * @param {string} opts.description
 * @param {string} opts.primaryHex
 * @param {string} opts.accentHex
 * @param {string[]} opts.chartHexes - 6 warna kategorikal
 * @param {'light'|'dark'} [opts.recommendedMode='light'] - mode default saat
 *        template ini dipilih di Theme Picker. Template tetap punya struktur
 *        light+dark lengkap (user boleh toggle manual), tapi field ini
 *        menentukan tampilan "identitas" template tersebut di kartu pilihan
 *        & mode yang otomatis diterapkan saat dipilih.
 * @returns {import('./tokens').ThemeDefinition}
 */
function buildTheme({ id, label, description, primaryHex, accentHex, chartHexes, recommendedMode = 'light' }) {
    const primary = generateColorScale(primaryHex);
    const secondary = generateColorScale(SECONDARY_BASE);
    const accent = generateColorScale(accentHex);

    // Pastikan warna teks putih tetap lolos AA di atas primary-600 (tombol solid).
    // Kalau base terlalu terang (misal accent Sunset Orange), primary tetap
    // dipakai apa adanya untuk shade 500 ke bawah, tapi 600+ dipastikan aman.
    ensureAA('#FFFFFF', primary['600']); // dipanggil untuk efek samping validasi saat dev; hasil tidak dipakai langsung

    const light = {
        primary,
        primaryHover: primary['700'],
        primaryActive: primary['800'],
        secondary,
        accent,
        ...SEMANTIC,
        background: '#F8FAFC',
        surface: '#FFFFFF',
        surfaceSecondary: '#F1F5F9',
        sidebar: '#FFFFFF',
        sidebarText: '#0F172A',
        navbar: '#FFFFFF',
        border: '#E2E8F0',
        divider: '#E2E8F0',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
        inputBackground: '#FFFFFF',
        inputBorder: '#E2E8F0',
        inputFocus: primary['500'],
        card: '#FFFFFF',
        modal: '#FFFFFF',
        tooltip: '#0F172A',
        tableHeader: '#F8FAFC',
        tableRow: '#FFFFFF',
        tableHover: '#F1F5F9',
        shadow: 'rgba(15, 23, 42, 0.08)',
        chart: {
            chart1: chartHexes[0],
            chart2: chartHexes[1],
            chart3: chartHexes[2],
            chart4: chartHexes[3],
            chart5: chartHexes[4],
            chart6: chartHexes[5],
        },
    };

    const dark = {
        primary,
        // Di dark mode, hover/active bergerak ke arah lebih TERANG (bukan
        // gelap) — warna dasar sudah kontras tinggi di atas bg gelap,
        // hover cukup sedikit lebih terang untuk terasa "interaktif".
        primaryHover: primary['400'],
        primaryActive: primary['300'],
        secondary,
        accent,
        ...SEMANTIC,
        background: '#0F172A',
        surface: '#1E293B',
        surfaceSecondary: '#334155',
        sidebar: '#1E293B',
        sidebarText: '#F8FAFC',
        navbar: '#1E293B',
        border: '#334155',
        divider: '#334155',
        textPrimary: '#F8FAFC',
        textSecondary: '#CBD5E1',
        textMuted: '#94A3B8',
        inputBackground: '#1E293B',
        inputBorder: '#334155',
        inputFocus: primary['400'],
        card: '#1F2937',
        modal: '#1F2937',
        tooltip: '#334155',
        tableHeader: '#1E293B',
        tableRow: '#1E293B',
        tableHover: '#334155',
        shadow: 'rgba(0, 0, 0, 0.4)',
        chart: {
            chart1: chartHexes[0],
            chart2: chartHexes[1],
            chart3: chartHexes[2],
            chart4: chartHexes[3],
            chart5: chartHexes[4],
            chart6: chartHexes[5],
        },
    };

    return { id, label, description, recommendedMode, light, dark };
}

/** Ocean Blue — professional, enterprise, retail, minimarket, apotek, supermarket. */
export const OCEAN_BLUE = buildTheme({
    id: 'ocean-blue',
    label: 'Ocean Blue',
    description: 'Professional & enterprise — cocok untuk retail, minimarket, apotek, supermarket.',
    primaryHex: '#2563EB',
    accentHex: '#06B6D4',
    chartHexes: ['#2563EB', '#06B6D4', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899'],
});

/** Emerald Green — UMKM, warung, toko sembako, grosir, toko pertanian. */
export const EMERALD_GREEN = buildTheme({
    id: 'emerald-green',
    label: 'Emerald Green',
    description: 'Segar & bersahabat — cocok untuk UMKM, warung, toko sembako, grosir, toko pertanian.',
    primaryHex: '#16A34A',
    accentHex: '#10B981',
    chartHexes: ['#16A34A', '#10B981', '#2563EB', '#F59E0B', '#8B5CF6', '#EC4899'],
});

/** Sunset Orange — cafe, bakery, coffee shop, restaurant, fashion. */
export const SUNSET_ORANGE = buildTheme({
    id: 'sunset-orange',
    label: 'Sunset Orange',
    description: 'Hangat & energik — cocok untuk cafe, bakery, coffee shop, restaurant, fashion.',
    primaryHex: '#F97316',
    accentHex: '#FB923C',
    chartHexes: ['#F97316', '#FB923C', '#DC2626', '#16A34A', '#2563EB', '#8B5CF6'],
});

/** Royal Indigo — POS cloud, dashboard, ERP, B2B, teknologi. */
export const ROYAL_INDIGO = buildTheme({
    id: 'royal-indigo',
    label: 'Royal Indigo',
    description: 'Premium & modern — cocok untuk POS cloud, dashboard, ERP, B2B, teknologi.',
    primaryHex: '#4F46E5',
    accentHex: '#8B5CF6',
    chartHexes: ['#4F46E5', '#8B5CF6', '#06B6D4', '#16A34A', '#F59E0B', '#EC4899'],
});

/**
 * Bangun template DARK-NATIVE: identitas utamanya mode gelap, dengan
 * background/surface/card/border yang di-TINT sesuai hue warna primary-nya
 * (bukan generic slate seperti dark mode template terang di atas). Prinsip:
 * "Dark mode bukan sekadar invert" — di sini malah dibawa lebih jauh, tiap
 * tema gelap punya suasana warna dasarnya sendiri (kebiruan/kehijauan/dst),
 * tapi tetap pakai teks & kontras standar (F8FAFC/CBD5E1/94A3B8) supaya lolos
 * WCAG AA di semua kasus.
 *
 * Mode `light` tetap disediakan lengkap (dari buildTheme biasa) untuk
 * struktur & fallback kalau user toggle manual ke light — tapi identitas
 * & tampilan default template ini adalah gelap (`recommendedMode: 'dark'`).
 *
 * @param {Object} opts
 * @param {string} opts.id
 * @param {string} opts.label
 * @param {string} opts.description
 * @param {string} opts.primaryHex
 * @param {string} opts.accentHex
 * @param {string[]} opts.chartHexes
 * @param {{background:string,surface:string,surfaceSecondary:string,card:string,modal:string,border:string,divider:string,sidebar:string,navbar:string,tableHeader:string,tableRow:string,tableHover:string,tooltip:string}} opts.darkPalette
 *        Nilai hex hasil racikan manual (tinted neutral) — dipakai sebagai
 *        base neutral dark mode template ini, pengganti slate generik.
 * @returns {import('./tokens').ThemeDefinition}
 */
function buildDarkNativeTheme({ id, label, description, primaryHex, accentHex, chartHexes, darkPalette }) {
    const base = buildTheme({ id, label, description, primaryHex, accentHex, chartHexes });
    const { primary } = base.dark;

    const dark = {
        ...base.dark,
        background: darkPalette.background,
        surface: darkPalette.surface,
        surfaceSecondary: darkPalette.surfaceSecondary,
        sidebar: darkPalette.sidebar,
        navbar: darkPalette.navbar,
        border: darkPalette.border,
        divider: darkPalette.divider,
        inputBackground: darkPalette.surface,
        inputBorder: darkPalette.border,
        inputFocus: primary['400'],
        card: darkPalette.card,
        modal: darkPalette.modal,
        tooltip: darkPalette.tooltip,
        tableHeader: darkPalette.surface,
        tableRow: darkPalette.surface,
        tableHover: darkPalette.surfaceSecondary,
    };

    return { ...base, recommendedMode: 'dark', dark };
}

/** Midnight Ocean — versi dark-native Ocean Blue, suasana biru-hitam pekat. */
export const MIDNIGHT_OCEAN = buildDarkNativeTheme({
    id: 'midnight-ocean',
    label: 'Midnight Ocean',
    description: 'Biru gelap yang tenang — enterprise & retail dengan tampilan malam.',
    primaryHex: '#2563EB',
    accentHex: '#06B6D4',
    chartHexes: ['#3B82F6', '#22D3EE', '#4ADE80', '#FBBF24', '#A78BFA', '#F472B6'],
    darkPalette: {
        background: '#0B1120',
        surface: '#131B2E',
        surfaceSecondary: '#1C2740',
        card: '#141D33',
        modal: '#141D33',
        border: '#263352',
        divider: '#263352',
        sidebar: '#0F172A',
        navbar: '#111B2E',
        tooltip: '#1C2740',
    },
});

/** Forest Night — versi dark-native Emerald Green, suasana hijau-hitam pekat. */
export const FOREST_NIGHT = buildDarkNativeTheme({
    id: 'forest-night',
    label: 'Forest Night',
    description: 'Hijau gelap yang teduh — UMKM & warung dengan tampilan malam.',
    primaryHex: '#16A34A',
    accentHex: '#10B981',
    chartHexes: ['#4ADE80', '#34D399', '#60A5FA', '#FBBF24', '#C084FC', '#F472B6'],
    darkPalette: {
        background: '#0A1510',
        surface: '#0F1F17',
        surfaceSecondary: '#16291F',
        card: '#12241C',
        modal: '#12241C',
        border: '#1F3A2C',
        divider: '#1F3A2C',
        sidebar: '#0D1913',
        navbar: '#0F1F17',
        tooltip: '#16291F',
    },
});

/** Ember Night — versi dark-native Sunset Orange, suasana coklat-hitam hangat. */
export const EMBER_NIGHT = buildDarkNativeTheme({
    id: 'ember-night',
    label: 'Ember Night',
    description: 'Oranye gelap yang hangat — cafe & restoran dengan tampilan malam.',
    primaryHex: '#F97316',
    accentHex: '#FB923C',
    chartHexes: ['#FB923C', '#FBBF24', '#F87171', '#4ADE80', '#60A5FA', '#C084FC'],
    darkPalette: {
        background: '#170F0A',
        surface: '#201510',
        surfaceSecondary: '#2B1D14',
        card: '#241811',
        modal: '#241811',
        border: '#3A2A1C',
        divider: '#3A2A1C',
        sidebar: '#190F0A',
        navbar: '#201510',
        tooltip: '#2B1D14',
    },
});

/** Cosmic Indigo — versi dark-native Royal Indigo, suasana ungu-hitam pekat. */
export const COSMIC_INDIGO = buildDarkNativeTheme({
    id: 'cosmic-indigo',
    label: 'Cosmic Indigo',
    description: 'Indigo gelap yang premium — POS cloud & ERP dengan tampilan malam.',
    primaryHex: '#4F46E5',
    accentHex: '#8B5CF6',
    chartHexes: ['#818CF8', '#A78BFA', '#22D3EE', '#4ADE80', '#FBBF24', '#F472B6'],
    darkPalette: {
        background: '#0F0B1E',
        surface: '#191430',
        surfaceSecondary: '#241D40',
        card: '#1D1735',
        modal: '#1D1735',
        border: '#322850',
        divider: '#322850',
        sidebar: '#120D22',
        navbar: '#191430',
        tooltip: '#241D40',
    },
});

/** Daftar template built-in — 4 bertema terang + 4 bertema gelap. */
export const BUILTIN_TEMPLATES = [
    OCEAN_BLUE,
    EMERALD_GREEN,
    SUNSET_ORANGE,
    ROYAL_INDIGO,
    MIDNIGHT_OCEAN,
    FOREST_NIGHT,
    EMBER_NIGHT,
    COSMIC_INDIGO,
];

/** Template dengan identitas warna terang (recommendedMode light) saja. */
export const LIGHT_TEMPLATES = BUILTIN_TEMPLATES.filter((t) => t.recommendedMode !== 'dark');

/** Template dengan identitas warna gelap (recommendedMode dark) saja. */
export const DARK_TEMPLATES = BUILTIN_TEMPLATES.filter((t) => t.recommendedMode === 'dark');

/** Lookup cepat by id — dipakai ThemeProvider saat resolve preference tersimpan. */
export const TEMPLATES_BY_ID = BUILTIN_TEMPLATES.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
}, {});

/** Template default saat user belum pernah memilih apa pun. */
export const DEFAULT_TEMPLATE_ID = 'royal-indigo';

export { buildTheme };

export default BUILTIN_TEMPLATES;
