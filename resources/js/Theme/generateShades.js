/**
 * ── Theme Engine: Custom Color Generator ────────────────────────
 *
 * Menghasilkan skala 50-950 dari SATU warna hex, memakai pendekatan
 * HSL ala Tailwind/Radix Colors:
 *   - Hue dipertahankan konstan di semua shade (identitas warna tetap).
 *   - Lightness diatur per shade lewat kurva non-linear (bukan
 *     interpolasi linear / lighten() biasa) supaya distribusi terang-
 *     gelapnya mirip skala Tailwind bawaan (50 sangat terang, 900
 *     sangat gelap, 500 ≈ warna asli).
 *   - Saturation sedikit diturunkan di shade paling terang & paling
 *     gelap supaya tidak terlihat "pucat"/"kotor" (masalah umum kalau
 *     cuma pakai lighten() linear).
 *
 * Juga menyediakan pengecekan kontras WCAG AA (relative luminance
 * manual, tanpa library tambahan) dan auto-adjust ringan kalau
 * pasangan warna gagal AA.
 */

import { SHADE_KEYS } from './tokens';

/* ── Konversi warna ──────────────────────────────────────────── */

/** @param {string} hex - format "#RRGGBB" atau "RRGGBB" */
export function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

export function rgbToHex({ r, g, b }) {
    const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** RGB (0-255) → HSL ({h: 0-360, s: 0-100, l: 0-100}) */
export function rgbToHsl({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    const delta = max - min;
    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        switch (max) {
            case r:
                h = ((g - b) / delta) % 6;
                break;
            case g:
                h = (b - r) / delta + 2;
                break;
            default:
                h = (r - g) / delta + 4;
        }
        h *= 60;
        if (h < 0) h += 360;
    }

    return { h, s: s * 100, l: l * 100 };
}

/** HSL → RGB (0-255) */
export function hslToRgb({ h, s, l }) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function hexToHsl(hex) {
    return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl) {
    return rgbToHex(hslToRgb(hsl));
}

/** Hex → "R G B" (space-separated, format yang dipakai CSS variable di app.css) */
export function hexToRgbString(hex) {
    const { r, g, b } = hexToRgb(hex);
    return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

/* ── Kurva lightness ala Tailwind/Radix ──────────────────────── */

/**
 * Target lightness (%) per shade, dikalibrasi supaya mirip distribusi
 * skala default Tailwind (indigo/slate/dst). Index sejajar dengan
 * SHADE_KEYS: 50,100,200,300,400,500,600,700,800,900,950.
 */
const LIGHTNESS_CURVE = [97, 93, 86, 76, 64, 52, 45, 38, 30, 22, 13];

/**
 * Delta saturation (%) relatif terhadap saturation dasar, per shade.
 * Ekstrem (50 & 950) diturunkan supaya tidak pucat/kotor; tengah
 * (400-700, sekitar base) dinaikkan sedikit agar warna tetap "hidup".
 */
const SATURATION_DELTA = [-35, -28, -18, -8, 2, 4, 2, -4, -10, -16, -24];

/**
 * Generate skala 50-950 dari satu warna hex dasar.
 * Base hex akan didekati oleh shade 500 (bukan dipaksa identik persis,
 * karena lightness base ikut dinormalisasi ke kurva supaya konsisten
 * antar-warna — devisiasi biasanya sangat kecil).
 *
 * @param {string} baseHex
 * @returns {import('./tokens').ColorScale} object shade→hex
 */
export function generateColorScale(baseHex) {
    const base = hexToHsl(baseHex);
    /** @type {Record<string, string>} */
    const scale = {};

    SHADE_KEYS.forEach((shade, i) => {
        const l = LIGHTNESS_CURVE[i];
        const s = clamp(base.s + SATURATION_DELTA[i], 8, 100);
        scale[shade] = hslToHex({ h: base.h, s, l });
    });

    return scale;
}

/**
 * Generate skala + "R G B" string per shade (siap dipakai sebagai
 * CSS variable value langsung).
 * @param {string} baseHex
 * @returns {Record<string, string>}
 */
export function generateColorScaleRgbStrings(baseHex) {
    const hexScale = generateColorScale(baseHex);
    /** @type {Record<string, string>} */
    const out = {};
    for (const shade of SHADE_KEYS) {
        out[shade] = hexToRgbString(hexScale[shade]);
    }
    return out;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

/* ── WCAG Contrast ───────────────────────────────────────────── */

/** Relative luminance (formula WCAG 2.x) dari hex color. */
export function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const channel = (v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio (1-21) antara dua warna hex. */
export function contrastRatio(hexA, hexB) {
    const lA = relativeLuminance(hexA) + 0.05;
    const lB = relativeLuminance(hexB) + 0.05;
    return lA > lB ? lA / lB : lB / lA;
}

/** true kalau rasio lolos WCAG AA untuk teks normal (>= 4.5:1). */
export function passesAA(hexA, hexB) {
    return contrastRatio(hexA, hexB) >= 4.5;
}

/**
 * Cari shade index (dari SHADE_KEYS) pada `scale` yang paling gelap/terang
 * tapi tetap lolos AA terhadap `bgHex`. Dipakai untuk menentukan warna teks
 * yang aman ditaruh di atas suatu background (misal teks di atas primary-600).
 *
 * @param {import('./tokens').ColorScale} scale
 * @param {string} bgHex
 * @returns {string} hex warna yang lolos AA (fallback ke putih/hitam)
 */
export function pickAccessibleTextShade(scale, bgHex) {
    // Coba putih & hitam dulu (kasus paling umum utk teks di atas warna solid)
    if (passesAA('#FFFFFF', bgHex)) return '#FFFFFF';
    if (passesAA('#000000', bgHex)) return '#000000';

    // Fallback: cari shade paling ekstrem di scale sendiri yang lolos
    const candidates = [...SHADE_KEYS].reverse(); // mulai dari paling gelap (950)
    for (const shade of candidates) {
        if (passesAA(scale[shade], bgHex)) return scale[shade];
    }
    return '#000000';
}

/**
 * Auto-adjust lightness suatu hex sampai lolos AA terhadap `bgHex`,
 * menggeser lightness sedikit demi sedikit (arah otomatis: menggelapkan
 * kalau bg terang, mencerahkan kalau bg gelap) sebelum menyerah ke fallback.
 *
 * @param {string} hex
 * @param {string} bgHex
 * @param {number} [maxSteps=20]
 * @returns {string} hex yang lolos AA (atau hex asli kalau sudah lolos)
 */
export function ensureAA(hex, bgHex, maxSteps = 20) {
    if (passesAA(hex, bgHex)) return hex;

    const hsl = hexToHsl(hex);
    const bgLum = relativeLuminance(bgHex);
    const direction = bgLum > 0.5 ? -1 : 1; // bg terang → gelapkan teks, sebaliknya cerahkan

    let current = { ...hsl };
    for (let i = 0; i < maxSteps; i++) {
        current = { ...current, l: clamp(current.l + direction * 4, 0, 100) };
        const candidate = hslToHex(current);
        if (passesAA(candidate, bgHex)) return candidate;
    }
    return direction === -1 ? '#000000' : '#FFFFFF';
}

/**
 * Generate turunan token semantik dari satu warna dasar (dipakai Custom
 * Theme Engine untuk primary/secondary/accent): hover, active, soft, border.
 * Mengikuti pola: hover = 1 step lebih gelap, active = 2 step lebih gelap,
 * soft = shade sangat terang (utk background badge/pill), border = shade
 * terang-menengah (utk outline).
 *
 * @param {string} baseHex
 * @returns {{scale: import('./tokens').ColorScale, hover: string, active: string, soft: string, border: string}}
 */
export function generateDerivedTokens(baseHex) {
    const scale = generateColorScale(baseHex);
    return {
        scale,
        hover: scale['700'],
        active: scale['800'],
        soft: scale['50'],
        border: scale['200'],
    };
}

export default {
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    hexToHsl,
    hslToHex,
    hexToRgbString,
    generateColorScale,
    generateColorScaleRgbStrings,
    relativeLuminance,
    contrastRatio,
    passesAA,
    pickAccessibleTextShade,
    ensureAA,
    generateDerivedTokens,
};
