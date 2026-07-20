/**
 * ── Theme Engine: Template Helper + Fallback ─────────────────────
 *
 * Preset tema sistem SEKARANG dibaca dari database (tabel theme_presets,
 * is_system=true) via `systemThemes` yang di-share HandleInertiaRequests
 * middleware ke semua halaman Inertia — BUKAN dari daftar statis di file
 * ini lagi. Untuk menambah/mengubah tema sistem, edit
 * `database/seeders/DatabaseSeeder/ThemePresetSeeder.php` lalu jalankan:
 *   php artisan db:seed --class=ThemePresetSeeder
 *
 * File ini hanya menyisakan:
 *   1. `buildShadcnTemplate()` — helper generate 36 token shadcn/ui dari
 *      2 warna dasar (primary + accent). Dipakai untuk Custom Theme
 *      (setCustomColors di ThemeProvider) dan sebagai basis default form
 *      Create tema baru.
 *   2. `FALLBACK_THEME` — tema darurat hardcoded, dipakai HANYA kalau
 *      tabel theme_presets kosong (fresh install sebelum seeding, atau
 *      query systemThemes gagal). Tanpa ini, ThemeProvider tidak punya
 *      apapun untuk di-render saat first paint.
 */

import { generateColorScale } from './generateShades';

const SECONDARY_BASE = '#64748B'; // slate-500

/**
 * Generate satu ThemeTokens lengkap (36 key) dari primary + accent hex.
 * Mengikuti pola shadcn/ui: foreground = putih di atas primary, muted =
 * slate netral, border = slate terang.
 */
export function buildShadcnTemplate({ primaryHex, accentHex, overrides = {} }) {
    // generateColorScale dipertahankan sebagai side-effect import supaya
    // konsumen lama (jika ada) yang berharap shade scale tersedia tidak patah;
    // hasil generate saat ini tidak dipakai langsung di token flat di bawah.
    void generateColorScale;

    const base = {
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: '#FFFFFF',
        cardForeground: '#0F172A',
        popover: '#FFFFFF',
        popoverForeground: '#0F172A',
        primary: primaryHex,
        primaryForeground: '#FFFFFF',
        secondary: '#F1F5F9',
        secondaryForeground: '#0F172A',
        muted: '#F1F5F9',
        mutedForeground: '#64748B',
        accent: accentHex,
        accentForeground: '#FFFFFF',
        destructive: '#DC2626',
        destructiveForeground: '#FFFFFF',
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: primaryHex,
        chart1: primaryHex,
        chart2: accentHex,
        chart3: '#16A34A',
        chart4: '#F59E0B',
        chart5: '#8B5CF6',
        radius: '0.5rem',
        success: '#16A34A',
        successForeground: '#FFFFFF',
        warning: '#F59E0B',
        warningForeground: '#FFFFFF',
        info: '#0284C7',
        infoForeground: '#FFFFFF',
        sidebar: '#FFFFFF',
        sidebarForeground: '#0F172A',
        sidebarPrimary: primaryHex,
        sidebarPrimaryForeground: '#FFFFFF',
        sidebarAccent: '#F1F5F9',
        sidebarAccentForeground: '#0F172A',
        sidebarBorder: '#E2E8F0',
        sidebarRing: primaryHex,
        ...overrides,
    };

    return base;
}

const FALLBACK_LIGHT = buildShadcnTemplate({
    primaryHex: '#4F46E5',
    accentHex: '#8B5CF6',
});

const FALLBACK_DARK = {
    ...FALLBACK_LIGHT,
    background: '#0F172A',
    foreground: '#F8FAFC',
    card: '#1F2937',
    cardForeground: '#F8FAFC',
    popover: '#1F2937',
    popoverForeground: '#F8FAFC',
    secondary: '#334155',
    secondaryForeground: '#F8FAFC',
    muted: '#334155',
    mutedForeground: '#94A3B8',
    border: '#334155',
    input: '#334155',
    primary: '#818CF8',
    ring: '#818CF8',
    sidebar: '#1E293B',
    sidebarForeground: '#F8FAFC',
    sidebarAccent: '#334155',
    sidebarAccentForeground: '#F8FAFC',
    sidebarBorder: '#334155',
    sidebarPrimary: '#818CF8',
    sidebarRing: '#818CF8',
};

/**
 * Tema darurat — dipakai ThemeProvider HANYA kalau `systemThemes` kosong
 * (DB belum di-seed). Setelah `php artisan db:seed --class=ThemePresetSeeder`
 * dijalankan, ini tidak akan pernah dipakai lagi.
 */
export const FALLBACK_THEME = {
    id: 'fallback',
    label: 'Default',
    description: 'Tema default sementara — jalankan seeder untuk tema lengkap.',
    recommendedMode: 'light',
    light: FALLBACK_LIGHT,
    dark: FALLBACK_DARK,
};

export default { buildShadcnTemplate, FALLBACK_THEME };
