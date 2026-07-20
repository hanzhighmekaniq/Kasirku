/**
 * ── Theme Engine: Design Tokens ─────────────────────────────────
 *
 * File ini murni definisi TIPE & KONSTANTA nama token (bukan value).
 * Value aktual tiap warna ada di `templates.js` (4 template statis)
 * atau di-generate runtime oleh `generateShades.js` (Custom Theme).
 *
 * JSDoc dipakai sebagai pengganti TypeScript types — project ini
 * memakai React JSX murni (bukan TSX), jadi tipe di sini adalah
 * dokumentasi + autocomplete di editor, tidak divalidasi compiler.
 *
 * @typedef {'50'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'|'950'} ShadeKey
 * @typedef {Record<ShadeKey, string>} ColorScale
 *
 * @typedef {Object} ThemeChartColors
 * @property {string} chart1
 * @property {string} chart2
 * @property {string} chart3
 * @property {string} chart4
 * @property {string} chart5
 * @property {string} chart6
 *
 * @typedef {Object} ThemeModeTokens
 * @property {ColorScale} primary
 * @property {string} primaryHover
 * @property {string} primaryActive
 * @property {ColorScale} secondary
 * @property {ColorScale} accent
 * @property {string} success
 * @property {string} warning
 * @property {string} danger
 * @property {string} info
 * @property {string} background
 * @property {string} surface
 * @property {string} surfaceSecondary
 * @property {string} sidebar
 * @property {string} sidebarText
 * @property {string} navbar
 * @property {string} border
 * @property {string} divider
 * @property {string} textPrimary
 * @property {string} textSecondary
 * @property {string} textMuted
 * @property {string} inputBackground
 * @property {string} inputBorder
 * @property {string} inputFocus
 * @property {string} card
 * @property {string} modal
 * @property {string} tooltip
 * @property {string} tableHeader
 * @property {string} tableRow
 * @property {string} tableHover
 * @property {string} shadow
 * @property {ThemeChartColors} chart
 *
 * @typedef {Object} ThemeDefinition
 * @property {string} id            - slug unik, misal "ocean-blue"
 * @property {string} label         - nama tampilan, misal "Ocean Blue"
 * @property {string} description   - karakter/segmen cocok
 * @property {ThemeModeTokens} light
 * @property {ThemeModeTokens} dark
 *
 * @typedef {'light'|'dark'|'system'} ColorMode
 *
 * @typedef {Object} ThemePreference
 * @property {string} templateId    - id dari ThemeDefinition, atau "custom"
 * @property {ColorMode} mode
 * @property {{primary: string, secondary: string, accent: string}|null} custom
 *           Hex mentah 3 warna dasar — hanya terisi kalau templateId === "custom".
 *           Shade 50-950 di-generate ulang dari 3 nilai ini via generateShades.js,
 *           TIDAK disimpan penuh supaya payload kecil & selalu konsisten dgn formula.
 */

/** Urutan shade standar yang dipakai di seluruh sistem token & generator. */
export const SHADE_KEYS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

/** Semua nama token non-scale (dipakai untuk validasi & iterasi CSS var). */
export const SEMANTIC_TOKEN_KEYS = [
    'primaryHover',
    'primaryActive',
    'success',
    'warning',
    'danger',
    'info',
    'background',
    'surface',
    'surfaceSecondary',
    'sidebar',
    'sidebarText',
    'navbar',
    'border',
    'divider',
    'textPrimary',
    'textSecondary',
    'textMuted',
    'inputBackground',
    'inputBorder',
    'inputFocus',
    'card',
    'modal',
    'tooltip',
    'tableHeader',
    'tableRow',
    'tableHover',
    'shadow',
];

/** Token warna berskala (butuh 11 shade masing-masing). */
export const SCALE_TOKEN_KEYS = ['primary', 'secondary', 'accent'];

/** Nama chart color slot — dipetakan ke 6 warna kategorikal per tema. */
export const CHART_COLOR_KEYS = ['chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6'];

/** Daftar id template built-in, dipakai Theme Picker & validasi preference. */
export const TEMPLATE_IDS = [
    'ocean-blue',
    'emerald-green',
    'sunset-orange',
    'royal-indigo',
    'midnight-ocean',
    'forest-night',
    'ember-night',
    'cosmic-indigo',
    'custom',
];

export default {};
