import { Link } from "@inertiajs/react";
import { Copy, Info, RotateCcw, Sun, Moon, Clipboard } from "lucide-react";
import { useState, useMemo } from "react";
import { TOKEN_LABELS } from "@/Theme/tokens";
import Button from "@/Components/ui/Button";

/* ── Token groups — same structure as theme-create.html ── */
const TOKEN_GROUPS = [
    { title: "Primary", keys: ["primary", "primaryForeground"] },
    { title: "Background & Foreground", keys: ["background", "foreground"] },
    { title: "Secondary", keys: ["secondary", "secondaryForeground"] },
    { title: "Accent", keys: ["accent", "accentForeground"] },
    { title: "Card", keys: ["card", "cardForeground"] },
    { title: "Popover", keys: ["popover", "popoverForeground"] },
    { title: "Muted", keys: ["muted", "mutedForeground"] },
    { title: "Destructive", keys: ["destructive", "destructiveForeground"] },
    { title: "Border, Input & Ring", keys: ["border", "input", "ring"] },
    { title: "Chart", keys: ["chart1", "chart2", "chart3", "chart4", "chart5"] },
    { title: "Sidebar", keys: ["sidebar", "sidebarForeground"] },
    { title: "Status", keys: ["success", "warning", "info"] },
];

const TOTAL_TOKENS = TOKEN_GROUPS.reduce((n, g) => n + g.keys.length, 0);

function describeToken(key) {
    if (key === "primary") return "Main brand color for actions";
    if (key === "primaryForeground") return "Text on primary surfaces";
    if (key === "background") return "App background";
    if (key === "foreground") return "Default text color";
    if (key === "secondary") return "Secondary surface / action";
    if (key === "secondaryForeground") return "Text on secondary";
    if (key === "accent") return "Subtle highlight background";
    if (key === "accentForeground") return "Text on accent";
    if (key === "card") return "Card surface";
    if (key === "cardForeground") return "Text inside cards";
    if (key === "popover") return "Popover / menu surface";
    if (key === "popoverForeground") return "Text inside popovers";
    if (key === "muted") return "Muted surface";
    if (key === "mutedForeground") return "Muted / secondary text";
    if (key === "destructive") return "Errors, destructive actions";
    if (key === "destructiveForeground") return "Text on destructive";
    if (key === "border") return "Divider and outlines";
    if (key === "input") return "Input background";
    if (key === "ring") return "Focus ring color";
    if (key.startsWith("chart")) return `Data series ${key.slice(-1)}`;
    if (key === "sidebar") return "Sidebar background";
    if (key === "sidebarForeground") return "Sidebar text";
    if (key === "success") return "Success state";
    if (key === "warning") return "Warning state";
    if (key === "info") return "Info state";
    return "";
}

function camelToKebab(s) {
    return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

/**
 * ThemeForm — grouped color rows with Light/Dark mode switch.
 * Matches theme-create.html visual pattern adapted to our semantic token system.
 */
export default function ThemeForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = "Simpan Tema",
    cancelHref,
    previewMode,
    setPreviewMode,
    defaultLight,
    defaultDark,
}) {
    const updateToken = (key, value) => {
        const field = previewMode === "light" ? "light_tokens" : "dark_tokens";
        const current = data[field] || {};
        setData(field, { ...current, [key]: value });
    };

    const activeTokens =
        previewMode === "dark"
            ? data.dark_tokens || {}
            : data.light_tokens || {};

    const copyFromOther = () => {
        const otherField =
            previewMode === "light" ? "dark_tokens" : "light_tokens";
        const other = data[otherField] || {};
        const field = previewMode === "light" ? "light_tokens" : "dark_tokens";
        setData(field, { ...other });
    };

    const resetMode = () => {
        const defaults =
            previewMode === "light" ? defaultLight : defaultDark;
        const field = previewMode === "light" ? "light_tokens" : "dark_tokens";
        setData(field, { ...defaults });
    };

    // CSS variables output
    const cssOutput = useMemo(() => {
        const buildBlock = (mode) => {
            const tokens =
                mode === "light"
                    ? data.light_tokens || {}
                    : data.dark_tokens || {};
            const selector = mode === "light" ? ":root" : ".dark";
            const body = Object.entries(tokens)
                .map(
                    ([k, v]) =>
                        `  --${camelToKebab(k)}: ${v};`,
                )
                .join("\n");
            return `${selector} {\n${body}\n}`;
        };
        return buildBlock("light") + "\n\n" + buildBlock("dark");
    }, [data.light_tokens, data.dark_tokens]);

    const copyCSS = () => {
        navigator.clipboard.writeText(cssOutput);
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* ── Meta: Name & Description ── */}
            <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                    <Info size={15} className="text-muted-foreground" />
                    <div className="text-sm font-semibold text-foreground">
                        Theme details
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground">
                            Theme name
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            autoFocus
                            onChange={(e) => setData("name", e.target.value)}
                            maxLength={80}
                            className="mt-1.5 block w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground shadow-sm transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                            placeholder="e.g. Ocean Blue"
                        />
                        <div className="mt-1.5 text-[11px] text-muted-foreground">
                            Display name shown in the theme list.
                        </div>
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground">
                            Description{" "}
                            <span className="font-normal text-muted-foreground/60">
                                (optional)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={data.description || ""}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            maxLength={255}
                            className="mt-1.5 block w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground shadow-sm transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                            placeholder="A short description of this theme's intent."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Color tokens card ── */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                {/* Card header with mode switch */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                            Color tokens
                        </span>
                        <span className="text-xs text-muted-foreground">
                            &middot; {TOTAL_TOKENS} tokens
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Mode switch */}
                        <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
                            <button
                                type="button"
                                onClick={() => setPreviewMode("light")}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                    previewMode === "light"
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Sun size={13} /> Light mode
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode("dark")}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                    previewMode === "dark"
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Moon size={13} /> Dark mode
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={copyFromOther}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <Copy size={13} /> Copy from other mode
                        </button>
                    </div>
                </div>

                {/* Color groups */}
                <div className="px-4 py-3">
                    {TOKEN_GROUPS.map((group) => (
                        <div key={group.title}>
                            <div className="border-t border-border pt-3.5 pb-2 first:border-t-0 first:pt-1">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {group.title}
                                </span>
                            </div>
                            {group.keys.map((key) => (
                                <ColorRow
                                    key={key}
                                    tokenKey={key}
                                    value={activeTokens[key] || "#000000"}
                                    onChange={updateToken}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Info size={13} />
                        Both Light & Dark variants are saved together when you
                        create the theme.
                    </div>
                    <button
                        type="button"
                        onClick={resetMode}
                        className="inline-flex items-center gap-1.5 transition hover:text-foreground"
                    >
                        <RotateCcw size={13} /> Reset this mode
                    </button>
                </div>
            </div>

            {/* ── CSS Variables ── */}
            <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">
                        CSS variables
                    </div>
                    <button
                        type="button"
                        onClick={copyCSS}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                        <Clipboard size={13} /> Copy
                    </button>
                </div>
                <pre className="mt-3 max-h-[220px] overflow-auto rounded-lg bg-muted/70 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {cssOutput}
                </pre>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center gap-3 border-t border-border pt-5">
                <Button type="submit" loading={processing}>
                    {processing ? "Menyimpan..." : submitLabel}
                </Button>
                {cancelHref && (
                    <Button as={Link} href={cancelHref} variant="outline">
                        Batal
                    </Button>
                )}
            </div>
        </form>
    );
}

/* ── Single color row: label + desc, swatch picker, hex input ── */
function ColorRow({ tokenKey, value, onChange }) {
    const [hexDraft, setHexDraft] = useState(null);

    const displayHex = hexDraft !== null ? hexDraft : value.toUpperCase();
    const label = TOKEN_LABELS[tokenKey] || tokenKey;
    const desc = describeToken(tokenKey);

    const handleColorInput = (e) => {
        const v = e.target.value.toUpperCase();
        setHexDraft(null);
        onChange(tokenKey, v);
    };

    const handleHexInput = (e) => {
        const raw = e.target.value;
        setHexDraft(raw);
        if (/^#([0-9a-fA-F]{6})$/.test(raw)) {
            onChange(tokenKey, raw.toUpperCase());
        }
    };

    const handleHexBlur = () => {
        setHexDraft(null);
    };

    return (
        <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted/50">
            <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-foreground">
                    {label}
                </div>
                <div className="text-[11px] text-muted-foreground/70">
                    {desc}{" "}
                    <span className="font-mono text-muted-foreground/50">
                        {camelToKebab(tokenKey)}
                    </span>
                </div>
            </div>
            <label
                className="relative h-7 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
                style={{ background: value }}
            >
                <input
                    type="color"
                    value={value}
                    onInput={handleColorInput}
                    className="absolute -inset-1 cursor-pointer opacity-0"
                />
            </label>
            <input
                type="text"
                value={displayHex}
                onChange={handleHexInput}
                onBlur={handleHexBlur}
                maxLength={7}
                className="w-[100px] shrink-0 rounded-md border border-border bg-muted/50 px-2 py-1.5 font-mono text-[11.5px] uppercase text-foreground transition focus:border-ring focus:outline-none"
            />
        </div>
    );
}
