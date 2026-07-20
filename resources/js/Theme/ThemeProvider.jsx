/**
 * ── Theme Engine: Theme Provider ──────────────────────────────────
 *
 * React Context yang:
 *   1. Resolve tema aktif (template built-in ATAU custom) + mode
 *      (light/dark/system) dari: localStorage → user.theme_preference
 *      (dikirim lewat Inertia shared props) → default (Royal Indigo).
 *   2. Inject seluruh token sebagai CSS variable ke `<html>` (`:root`
 *      untuk light, class `.dark` ditambahkan saat mode gelap aktif).
 *   3. Simpan pilihan baru ke localStorage (instan) + database user
 *      (best-effort, tidak memblokir UI kalau gagal/offline).
 *
 * Dipasang SEKALI di resources/js/app.jsx, membungkus <App/>, supaya
 * seluruh halaman Inertia otomatis dapat tema tanpa provider berulang.
 */

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { BUILTIN_TEMPLATES, TEMPLATES_BY_ID, DEFAULT_TEMPLATE_ID, buildTheme } from './templates';
import { SCALE_TOKEN_KEYS, SEMANTIC_TOKEN_KEYS, CHART_COLOR_KEYS, SHADE_KEYS } from './tokens';
import { hexToRgbString } from './generateShades';

const STORAGE_KEY = 'simkasir-theme-preference';

const ThemeContext = createContext(null);

/** @returns {{primary:string,secondary:string,accent:string}} */
const DEFAULT_CUSTOM_SEED = { primary: '#4F46E5', secondary: '#64748B', accent: '#8B5CF6' };

/** Baca preference tersimpan di localStorage (sync, dipakai saat initial render biar tidak flash). */
function readLocalPreference() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeLocalPreference(pref) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    } catch {
        // localStorage penuh/disabled — abaikan, tema tetap jalan di sesi ini.
    }
}

/** Resolve ThemeDefinition aktif dari preference (built-in atau custom-generated). */
function resolveThemeDefinition(preference) {
    if (preference?.templateId === 'custom' && preference.custom) {
        const { primary, secondary, accent } = preference.custom;
        return buildTheme({
            id: 'custom',
            label: 'Custom Theme',
            description: 'Tema kustom buatan sendiri.',
            primaryHex: primary,
            accentHex: accent,
            chartHexes: [primary, accent, '#16A34A', '#F59E0B', '#DC2626', secondary],
        });
    }
    return TEMPLATES_BY_ID[preference?.templateId] ?? TEMPLATES_BY_ID[DEFAULT_TEMPLATE_ID];
}

/** Apakah OS/browser user lagi dalam mode gelap (dipakai untuk mode "system"). */
function systemPrefersDark() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Terapkan seluruh token satu ThemeModeTokens sebagai CSS variable ke elemen target. */
function applyTokensToElement(el, tokens) {
    // Scale tokens (primary/secondary/accent) → --color-{name}-{shade}
    for (const scaleName of SCALE_TOKEN_KEYS) {
        const scale = tokens[scaleName];
        if (!scale) continue;
        for (const shade of SHADE_KEYS) {
            const hex = scale[shade];
            if (hex) el.style.setProperty(`--color-${scaleName}-${shade}`, hexToRgbString(hex));
        }
    }

    // Semantic tokens → --color-{camelToKebab}
    for (const key of SEMANTIC_TOKEN_KEYS) {
        const value = tokens[key];
        if (!value) continue;
        const cssVarName = `--color-${camelToKebab(key)}`;
        // shadow adalah rgba() string, sisanya hex solid — keduanya valid utk custom property langsung.
        if (value.startsWith('#')) {
            el.style.setProperty(cssVarName, hexToRgbString(value));
        } else {
            el.style.setProperty(cssVarName, value);
        }
    }

    // Chart colors → --chart-1 .. --chart-6 (dipakai langsung sbg hex di komponen chart JS, bukan lewat Tailwind)
    if (tokens.chart) {
        CHART_COLOR_KEYS.forEach((key, i) => {
            el.style.setProperty(`--chart-${i + 1}`, tokens.chart[key]);
        });
    }
}

function camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function ThemeProvider({ children }) {
    const page = usePage();
    const userThemeFromDb = page?.props?.auth?.user?.theme_preference ?? null;

    const [preference, setPreference] = useState(() => {
        return (
            readLocalPreference() ??
            userThemeFromDb ?? {
                templateId: DEFAULT_TEMPLATE_ID,
                mode: 'system',
                custom: null,
            }
        );
    });

    // Kalau localStorage kosong (device baru) tapi DB punya preference (user login
    // di device lain sebelumnya), sinkronkan begitu prop Inertia tersedia.
    useEffect(() => {
        if (!readLocalPreference() && userThemeFromDb) {
            setPreference(userThemeFromDb);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userThemeFromDb]);

    const themeDefinition = useMemo(() => resolveThemeDefinition(preference), [preference]);

    const isDark = useMemo(() => {
        if (preference.mode === 'dark') return true;
        if (preference.mode === 'light') return false;
        return systemPrefersDark();
    }, [preference.mode]);

    // Terapkan token + class `dark` ke <html> setiap kali tema/mode berubah.
    useEffect(() => {
        const root = document.documentElement;
        const tokens = isDark ? themeDefinition.dark : themeDefinition.light;
        applyTokensToElement(root, tokens);
        root.classList.toggle('dark', isDark);
    }, [themeDefinition, isDark]);

    // Kalau mode "system", ikuti perubahan preferensi OS secara live (tanpa reload).
    useEffect(() => {
        if (preference.mode !== 'system' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const root = document.documentElement;
            const dark = mq.matches;
            const tokens = dark ? themeDefinition.dark : themeDefinition.light;
            applyTokensToElement(root, tokens);
            root.classList.toggle('dark', dark);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [preference.mode, themeDefinition]);

    /**
     * Ganti template built-in. Kalau user belum pernah menyentuh mode
     * secara manual (mode masih "system"), mode ikut disetel ke
     * `recommendedMode` template — supaya template dark-native (Midnight
     * Ocean, dst) langsung tampil gelap begitu dipilih. Kalau user sudah
     * memilih mode manual (light/dark), pilihan itu dihormati dan tidak
     * ditimpa saat ganti template.
     */
    const setTemplate = useCallback((templateId) => {
        setPreference((prev) => {
            const def = TEMPLATES_BY_ID[templateId];
            const next = {
                ...prev,
                templateId,
                custom: templateId === 'custom' ? prev.custom : null,
                mode: prev.mode === 'system' && def?.recommendedMode ? def.recommendedMode : prev.mode,
            };
            persist(next);
            return next;
        });
    }, []);

    /** Ganti mode warna (light/dark/system). */
    const setMode = useCallback((mode) => {
        setPreference((prev) => {
            const next = { ...prev, mode };
            persist(next);
            return next;
        });
    }, []);

    /** Set Custom Theme dari 3 warna dasar (primary/secondary/accent hex). */
    const setCustomColors = useCallback((custom) => {
        setPreference((prev) => {
            const next = { ...prev, templateId: 'custom', custom: { ...DEFAULT_CUSTOM_SEED, ...custom } };
            persist(next);
            return next;
        });
    }, []);

    const value = useMemo(
        () => ({
            preference,
            theme: themeDefinition,
            isDark,
            templates: BUILTIN_TEMPLATES,
            setTemplate,
            setMode,
            setCustomColors,
        }),
        [preference, themeDefinition, isDark, setTemplate, setMode, setCustomColors],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Simpan ke localStorage instan + database secara best-effort (tidak memblokir UI). */
function persist(preference) {
    writeLocalPreference(preference);
    try {
        fetch(route('admin.theme-preference.update'), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
            },
            body: JSON.stringify(preference),
        }).catch(() => {
            // Gagal simpan ke DB (offline/network) — localStorage tetap jadi source
            // of truth untuk sesi ini, tidak apa-apa kalau sync ke DB tertunda.
        });
    } catch {
        // route() helper mungkin belum ready / fetch tidak didukung — abaikan.
    }
}

/** Hook utama: const { theme, isDark, setTemplate, setMode, setCustomColors, templates } = useTheme(); */
export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme() harus dipanggil di dalam <ThemeProvider>');
    }
    return ctx;
}

export default ThemeProvider;
