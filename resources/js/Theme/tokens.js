/**
 * ── Theme Engine: shadcn/ui Token Definitions ─────────────────
 *
 * 36 token per mode (light + dark) sesuai shadcn/ui convention + 4 status.
 * Format hex — akan dikonversi ke "R G B" oleh ThemeProvider saat apply.
 */

/**
 * shadcn/ui core tokens (32) + status (4) = 36 keys per mode.
 * Setiap key muncul di light dan dark mode.
 * @type {string[]}
 */
export const SHADCN_TOKEN_KEYS = [
    'background',
    'foreground',
    'card',
    'cardForeground',
    'popover',
    'popoverForeground',
    'primary',
    'primaryForeground',
    'secondary',
    'secondaryForeground',
    'muted',
    'mutedForeground',
    'accent',
    'accentForeground',
    'destructive',
    'destructiveForeground',
    'border',
    'input',
    'ring',
    'chart1',
    'chart2',
    'chart3',
    'chart4',
    'chart5',
    'radius',
    'sidebar',
    'sidebarForeground',
                      'success',
    'warning',
    'info',
];

/**
 * Mapping camelCase JS key → CSS variable name.
 * @type {Record<string, string>}
 */
export const TOKEN_TO_CSS_VAR = {
    background: '--background',
    foreground: '--foreground',
    card: '--card',
    cardForeground: '--card-foreground',
    popover: '--popover',
    popoverForeground: '--popover-foreground',
    primary: '--primary',
    primaryForeground: '--primary-foreground',
    secondary: '--secondary',
    secondaryForeground: '--secondary-foreground',
    muted: '--muted',
    mutedForeground: '--muted-foreground',
    accent: '--accent',
    accentForeground: '--accent-foreground',
    destructive: '--destructive',
    destructiveForeground: '--destructive-foreground',
    border: '--border',
    input: '--input',
    ring: '--ring',
    chart1: '--chart-1',
    chart2: '--chart-2',
    chart3: '--chart-3',
    chart4: '--chart-4',
    chart5: '--chart-5',
    radius: '--radius',
    sidebar: '--sidebar',
    sidebarForeground: '--sidebar-foreground',
    success: '--success',
    warning: '--warning',
    info: '--info',
};

/**
 * Backward-compat: mapping shadcn/ui key → old --color-* CSS variable names.
 * ThemeProvider akan set ini juga supaya kode lama tetap jalan.
 * @type {Record<string, string>}
 */
export const SHADCN_TO_OLD_ALIAS = {
    background: '--color-background',
    foreground: '--color-text-primary',
    card: '--color-card',
    cardForeground: '--color-text-primary',
    popover: '--color-modal',
    popoverForeground: '--color-text-primary',
    primary: '--color-primary-500',     // primary DEFAULT ≈ shade 500
    primaryForeground: '--color-primary-foreground',
    secondary: '--color-surface-secondary',
    secondaryForeground: '--color-text-primary',
    muted: '--color-surface-secondary',
    mutedForeground: '--color-text-muted',
    accent: '--color-accent-500',
    accentForeground: '--color-primary-foreground',
    border: '--color-border',
    input: '--color-input-border',
    ring: '--color-input-focus',
    sidebar: '--color-sidebar',
    sidebarForeground: '--color-sidebar-text',
    success: '--color-success',
    warning: '--color-warning',
    info: '--color-info',
};

/**
 * Token keys yang punya foreground pair (bg + fg).
 * Dipakai ThemeForm untuk render color picker berpasangan.
 * @type {string[][]}
 */
export const TOKEN_PAIRS = [
    ['background', 'foreground'],
    ['card', 'cardForeground'],
    ['popover', 'popoverForeground'],
    ['primary', 'primaryForeground'],
    ['secondary', 'secondaryForeground'],
    ['muted', 'mutedForeground'],
    ['accent', 'accentForeground'],
    ['destructive', 'destructiveForeground'],
    ['sidebar', 'sidebarForeground'],
];

/**
 * Token keys yang single value (tidak punya foreground pair).
 * @type {string[]}
 */
export const SINGLE_TOKENS = [
    'border',
    'input',
    'ring',
    'chart1',
    'chart2',
    'chart3',
    'chart4',
    'chart5',
    'radius',
          'success',
    'warning',
    'info',
];

/**
 * Label tampilan untuk setiap token key (Indonesia).
 * @type {Record<string, string>}
 */
export const TOKEN_LABELS = {
    background: 'Background',
    foreground: 'Foreground',
    card: 'Card',
    cardForeground: 'Card Foreground',
    popover: 'Popover',
    popoverForeground: 'Popover Foreground',
    primary: 'Primary',
    primaryForeground: 'Primary Foreground',
    secondary: 'Secondary',
    secondaryForeground: 'Secondary Foreground',
    muted: 'Muted',
    mutedForeground: 'Muted Foreground',
    accent: 'Accent',
    accentForeground: 'Accent Foreground',
    destructive: 'Destructive',
    destructiveForeground: 'Destructive Foreground',
    border: 'Border',
    input: 'Input',
    ring: 'Ring (Focus)',
    chart1: 'Chart 1',
    chart2: 'Chart 2',
    chart3: 'Chart 3',
    chart4: 'Chart 4',
    chart5: 'Chart 5',
    radius: 'Radius',
    sidebar: 'Sidebar',
    sidebarForeground: 'Sidebar Foreground',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
};

/** Urutan shade standar (dipakai backward-compat shade generation). */
export const SHADE_KEYS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

/** Token warna yang perlu shade scale (backward compat). */
export const SCALE_TOKEN_KEYS = ['primary', 'secondary', 'accent'];

/** Nama chart color slot. */
export const CHART_COLOR_KEYS = ['chart1', 'chart2', 'chart3', 'chart4', 'chart5'];

/** Daftar id template built-in. */
export const TEMPLATE_IDS = [
    'ocean-blue',
    'emerald-green',
    'sunset-orange',
    'royal-indigo',
    'supabase-mint',
    'midnight-ocean',
    'forest-night',
    'ember-night',
    'cosmic-indigo',
    'custom',
];

/**
 * @typedef {'light'|'dark'|'system'} ColorMode
 *
 * @typedef {Object} ThemeTokens
 * @property {string} background
 * @property {string} foreground
 * @property {string} card
 * @property {string} cardForeground
 * @property {string} popover
 * @property {string} popoverForeground
 * @property {string} primary
 * @property {string} primaryForeground
 * @property {string} secondary
 * @property {string} secondaryForeground
 * @property {string} muted
 * @property {string} mutedForeground
 * @property {string} accent
 * @property {string} accentForeground
 * @property {string} destructive
 * @property {string} destructiveForeground
 * @property {string} border
 * @property {string} input
 * @property {string} ring
 * @property {string} chart1
 * @property {string} chart2
 * @property {string} chart3
 * @property {string} chart4
 * @property {string} chart5
 * @property {string} radius
 * @property {string} sidebar
 * @property {string} sidebarForeground
 * @property {string} success
 * @property {string} warning
 * @property {string} info
 *
 * @typedef {Object} ThemeDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {ThemeTokens} light
 * @property {ThemeTokens} dark
 *
 * @typedef {Object} ThemePreference
 * @property {string} templateId
 * @property {ColorMode} mode
 * @property {ThemeTokens|null} customTokens
 */

export default {};
