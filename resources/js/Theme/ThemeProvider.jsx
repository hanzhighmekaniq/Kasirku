/**
 * ── Theme Engine: Theme Provider (shadcn/ui, DB-driven) ──────────
 *
 * React Context yang:
 *   1. Resolve tema aktif (preset sistem dari DB ATAU custom) + mode
 *      (light/dark/system) dari localStorage → user.theme_preference (DB)
 *      → default (preset sistem pertama).
 *   2. Preset sistem dibaca dari `page.props.systemThemes` (di-share oleh
 *      HandleInertiaRequests middleware ke SEMUA halaman) — BUKAN dari
 *      file templates.js statis lagi. Ini supaya nambah/ubah tema sistem
 *      cukup lewat seeder (ThemePresetSeeder), tanpa sentuh kode JS.
 *   3. Inject 36 shadcn/ui tokens sebagai CSS variable ke `<html>`.
 *   4. Generate backward-compat shade scales (--color-primary-50..950) dari
 *      primary/secondary/accent supaya Tailwind class lama (bg-primary-600
 *      dkk) tetap jalan.
 *   5. Simpan pilihan ke localStorage (instan) + database (best-effort).
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { FALLBACK_THEME } from './templates';
import {
    SHADCN_TOKEN_KEYS,
    TOKEN_TO_CSS_VAR,
    SHADCN_TO_OLD_ALIAS,
    SHADE_KEYS,
} from './tokens';
import { generateColorScale, hexToRgbString } from './generateShades';
import ThemeSaveToast from './ThemeSaveToast';

const STORAGE_KEY = 'simkasir-theme-preference';

const ThemeContext = createContext(null);

/** Baca preference dari localStorage. */
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
    } catch { /* abaikan */ }
}

/**
 * Ubah array systemThemes (dari Inertia props, model ThemePreset) jadi
 * lookup map by slug + bentuk ThemeDefinition yang dipakai renderer.
 */
function buildSystemThemesById(systemThemes) {
    const map = {};
    for (const t of systemThemes || []) {
        if (!t?.slug) continue;
        const tokens = t.tokens || {};
        map[t.slug] = {
            id: t.slug,
            label: t.name,
            description: t.description,
            light: tokens.light || FALLBACK_THEME.light,
            dark: tokens.dark || FALLBACK_THEME.dark,
        };
    }
    return map;
}

/** Resolve ThemeDefinition aktif dari preference + lookup preset sistem. */
function resolveThemeDefinition(preference, systemThemesById) {
    // Custom tema: user buat via halaman /admin/themes — customTokens berisi
    // {light: ThemeTokens, dark: ThemeTokens} dengan 36 key per mode.
    if (preference?.templateId === 'custom' && preference.customTokens?.light && preference.customTokens?.dark) {
        return {
            id: 'custom',
            label: 'Custom Theme',
            description: 'Tema kustom buatan sendiri.',
            light: preference.customTokens.light,
            dark: preference.customTokens.dark,
        };
    }
    // Preset sistem: lookup by slug dari DB
    if (preference?.templateId && systemThemesById[preference.templateId]) {
        return systemThemesById[preference.templateId];
    }
    // Fallback: preset sistem pertama, atau tema hardcoded darurat
    const first = Object.values(systemThemesById)[0];
    return first || FALLBACK_THEME;
}

/** Apakah OS user dalam mode gelap. */
function systemPrefersDark() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Terapkan 36 shadcn/ui tokens sebagai CSS variable.
 * Juga generate backward-compat shade scales dan old semantic aliases.
 */
function applyTokensToElement(el, tokens) {
    // 1. Set 36 shadcn/ui tokens
    for (const key of SHADCN_TOKEN_KEYS) {
        const cssVar = TOKEN_TO_CSS_VAR[key];
        const value = tokens[key];
        if (!cssVar || value === undefined || value === null) continue;

        if (key === 'radius') {
            // radius bukan warna — set langsung
            el.style.setProperty(cssVar, value);
        } else {
            // Warna: konversi hex ke "R G B" format
            el.style.setProperty(cssVar, hexToRgbString(value));
        }
    }

    // 2. Generate backward-compat shade scales dari primary/secondary/accent
    const primaryHex = tokens.primary || '#4F46E5';
    const secondaryHex = tokens.secondary || '#64748B';
    const accentHex = tokens.accent || '#8B5CF6';

    for (const [name, hex] of [['primary', primaryHex], ['secondary', secondaryHex], ['accent', accentHex]]) {
        const scale = generateColorScale(hex);
        for (const shade of SHADE_KEYS) {
            el.style.setProperty(`--color-${name}-${shade}`, hexToRgbString(scale[shade]));
        }
    }

    // 3. Set backward-compat old semantic aliases
    for (const [shadcnKey, oldCssVar] of Object.entries(SHADCN_TO_OLD_ALIAS)) {
        const value = tokens[shadcnKey];
        if (value && oldCssVar) {
            el.style.setProperty(oldCssVar, hexToRgbString(value));
        }
    }

    // 4. Extra backward-compat aliases yang tidak ada mapping langsung
    if (tokens.background) el.style.setProperty('--color-surface-secondary', hexToRgbString(tokens.muted || tokens.secondary || '#F1F5F9'));
    if (tokens.popover) el.style.setProperty('--color-modal', hexToRgbString(tokens.popover));
    if (tokens.mutedForeground) el.style.setProperty('--color-text-muted', hexToRgbString(tokens.mutedForeground));
    if (tokens.foreground) {
        el.style.setProperty('--color-text-secondary', hexToRgbString(tokens.mutedForeground || tokens.foreground));
    }
    if (tokens.card) {
        el.style.setProperty('--color-table-header', hexToRgbString(tokens.muted || tokens.card));
        el.style.setProperty('--color-table-row', hexToRgbString(tokens.card));
        el.style.setProperty('--color-table-hover', hexToRgbString(tokens.muted || '#F1F5F9'));
    }
    if (tokens.destructive) el.style.setProperty('--color-danger', hexToRgbString(tokens.destructive));
    if (tokens.border) el.style.setProperty('--color-divider', hexToRgbString(tokens.border));
    if (tokens.input) el.style.setProperty('--color-input-background', hexToRgbString(tokens.card || '#FFFFFF'));
    if (tokens.popoverForeground) el.style.setProperty('--color-tooltip', hexToRgbString(tokens.popoverForeground));

    // 5. Chart colors (hex langsung, bukan RGB)
    const chartKeys = ['chart1', 'chart2', 'chart3', 'chart4', 'chart5'];
    chartKeys.forEach((key, i) => {
        if (tokens[key]) el.style.setProperty(`--chart-${i + 1}`, tokens[key]);
    });
}

export function ThemeProvider({ children }) {
    const page = usePage();
    const userId = page?.props?.auth?.user?.id ?? null;
    const userThemeFromDb = page?.props?.auth?.user?.theme_preference ?? null;
    const systemThemesRaw = page?.props?.systemThemes ?? [];

    const systemThemesById = useMemo(
        () => buildSystemThemesById(systemThemesRaw),
        [systemThemesRaw],
    );

    const systemThemesList = useMemo(
        () => Object.values(systemThemesById),
        [systemThemesById],
    );

    const defaultTemplateId = systemThemesList[0]?.id ?? FALLBACK_THEME.id;

    const [saveStatus, setSaveStatus] = useState('idle');
    const toastTimerRef = useRef(null);

    const showToast = useCallback((status) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setSaveStatus(status);
        if (status === 'saved' || status === 'error') {
            toastTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
        }
    }, []);

    const [preference, setPreference] = useState(() => {
        return (
            userThemeFromDb ??
            readLocalPreference() ?? {
                templateId: defaultTemplateId,
                mode: 'system',
                customTokens: null,
            }
        );
    });

    const prevUserIdRef = useRef(userId);

    useEffect(() => {
        const prevUserId = prevUserIdRef.current;
        prevUserIdRef.current = userId;

        if (userId === null && prevUserId !== null) {
            try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
            setPreference({ templateId: defaultTemplateId, mode: 'system', customTokens: null });
            return;
        }

        if (userThemeFromDb && (prevUserId !== userId || !readLocalPreference())) {
            setPreference(userThemeFromDb);
            writeLocalPreference(userThemeFromDb);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, userThemeFromDb]);

    const themeDefinition = useMemo(
        () => resolveThemeDefinition(preference, systemThemesById),
        [preference, systemThemesById],
    );

    const isDark = useMemo(() => {
        if (preference.mode === 'dark') return true;
        if (preference.mode === 'light') return false;
        return systemPrefersDark();
    }, [preference.mode]);

    // Terapkan token ke <html> setiap kali tema/mode berubah
    useEffect(() => {
        const root = document.documentElement;
        const tokens = isDark ? themeDefinition.dark : themeDefinition.light;
        applyTokensToElement(root, tokens);
        root.classList.toggle('dark', isDark);
    }, [themeDefinition, isDark]);

    // Listen perubahan prefers-color-scheme untuk mode "system"
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

    /** Ganti preset sistem (by slug). Setiap tema sudah punya light & dark
     * eksplisit, jadi mode user (light/dark/system) tidak perlu diubah
     * mengikuti tema — cukup ganti templateId, mode tetap seperti semula. */
    const setTemplate = useCallback((templateId) => {
        setPreference((prev) => {
            const next = {
                ...prev,
                templateId,
                customTokens: templateId === 'custom' ? prev.customTokens : null,
            };
            persist(next, showToast);
            return next;
        });
    }, [showToast]);

    /** Ganti mode (light/dark/system). */
    const setMode = useCallback((mode) => {
        setPreference((prev) => {
            const next = { ...prev, mode };
            persist(next, showToast);
            return next;
        });
    }, [showToast]);

    /** Set custom theme dari full token object (36 keys per mode). */
    const setCustomTokens = useCallback((customTokens) => {
        setPreference((prev) => {
            const next = { ...prev, templateId: 'custom', customTokens };
            persist(next, showToast);
            return next;
        });
    }, [showToast]);

    const value = useMemo(
        () => ({
            preference,
            theme: themeDefinition,
            isDark,
            templates: systemThemesList,
            setTemplate,
            setMode,
            setCustomTokens,
        }),
        [preference, themeDefinition, isDark, systemThemesList, setTemplate, setMode, setCustomTokens],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
            <ThemeSaveToast status={saveStatus} onDismiss={() => setSaveStatus('idle')} />
        </ThemeContext.Provider>
    );
}

/** Ambil XSRF-TOKEN dari cookie. */
function getXsrfTokenFromCookie() {
    const match = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/** Simpan ke localStorage + database. */
function persist(preference, showToast) {
    writeLocalPreference(preference);
    showToast?.('saving');
    try {
        const xsrfToken = getXsrfTokenFromCookie();
        fetch(route('admin.theme-preference.update'), {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
            },
            body: JSON.stringify(preference),
        })
            .then((res) => {
                if (res.ok) showToast?.('saved');
                else showToast?.('error');
            })
            .catch(() => showToast?.('error'));
    } catch {
        showToast?.('error');
    }
}

/** Hook utama. */
export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme() harus dipanggil di dalam <ThemeProvider>');
    return ctx;
}

export default ThemeProvider;
