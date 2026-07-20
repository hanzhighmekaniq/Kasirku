import { Link } from "@inertiajs/react";
import { useState } from "react";
import {
    TOKEN_PAIRS,
    SINGLE_TOKENS,
    TOKEN_LABELS,
} from "@/Theme/tokens";
import { generateColorScale } from "@/Theme/generateShades";

const TABS = [
    { key: "colors", label: "Warna Dasar" },
    { key: "surface", label: "Surface" },
    { key: "sidebar", label: "Sidebar" },
    { key: "chart", label: "Chart & Status" },
];

/**
 * Form CRUD tema dengan36 shadcn/ui tokens.
 * Diorganize dalam tab supaya tidak overwhelming.
 */
export default function ThemeForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = "Simpan Tema",
    cancelHref,
}) {
    const [activeTab, setActiveTab] = useState("colors");

    // Helper untuk update token di dalam light_tokens/dark_tokens
    const updateToken = (key, value, mode) => {
        const field = mode === "light" ? "light_tokens" : "dark_tokens";
        const current = data[field] || {};
        setData(field, { ...current, [key]: value });
    };

    const lightTokens = data.light_tokens || {};
    const darkTokens = data.dark_tokens || {};

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* Nama & Deskripsi */}
            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Nama Tema <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.name}
                    autoFocus
                    onChange={(e) => setData("name", e.target.value)}
                    maxLength={80}
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="Contoh: Tema Toko Saya"
                />
                {errors.name && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Deskripsi <span className="text-slate-400">(opsional)</span>
                </label>
                <input
                    type="text"
                    value={data.description || ""}
                    onChange={(e) => setData("description", e.target.value)}
                    maxLength={255}
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="Deskripsi singkat tema ini"
                />
                {errors.description && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.description}</p>
                )}
            </div>

            {/* Tab selector */}
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                            activeTab === tab.key
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Warna Dasar */}
            {activeTab === "colors" && (
                <div className="space-y-4">
                    <ColorPairRow
                        label="Primary"
                        bgKey="primary"
                        fgKey="primaryForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <ColorPairRow
                        label="Secondary"
                        bgKey="secondary"
                        fgKey="secondaryForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <ColorPairRow
                        label="Accent"
                        bgKey="accent"
                        fgKey="accentForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <ColorPairRow
                        label="Destructive"
                        bgKey="destructive"
                        fgKey="destructiveForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <SingleColorField
                            label="Ring (Focus)"
                            tokenKey="ring"
                            light={lightTokens}
                            dark={darkTokens}
                            onUpdate={updateToken}
                        />
                        <SingleColorField
                            label="Border"
                            tokenKey="border"
                            light={lightTokens}
                            dark={darkTokens}
                            onUpdate={updateToken}
                        />
                    </div>
                </div>
            )}

            {/* Tab: Surface */}
            {activeTab === "surface" && (
                <div className="space-y-4">
                    <ColorPairRow
                        label="Background"
                        bgKey="background"
                        fgKey="foreground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <ColorPairRow
                        label="Card"
                        bgKey="card"
                        fgKey="cardForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <ColorPairRow
                        label="Popover"
                        bgKey="popover"
                        fgKey="popoverForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <ColorPairRow
                        label="Muted"
                        bgKey="muted"
                        fgKey="mutedForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <SingleColorField
                        label="Input"
                        tokenKey="input"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                </div>
            )}

            {/* Tab: Sidebar */}
            {activeTab === "sidebar" && (
                <div className="space-y-4">
                    <ColorPairRow
                        label="Sidebar"
                        bgKey="sidebar"
                        fgKey="sidebarForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <ColorPairRow
                        label="Sidebar Primary"
                        bgKey="sidebarPrimary"
                        fgKey="sidebarPrimaryForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <ColorPairRow
                        label="Sidebar Accent"
                        bgKey="sidebarAccent"
                        fgKey="sidebarAccentForeground"
                        light={lightTokens}
                        dark={darkTokens}
                        onUpdate={updateToken}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <SingleColorField
                            label="Sidebar Border"
                            tokenKey="sidebarBorder"
                            light={lightTokens}
                            dark={darkTokens}
                            onUpdate={updateToken}
                        />
                        <SingleColorField
                            label="Sidebar Ring"
                            tokenKey="sidebarRing"
                            light={lightTokens}
                            dark={darkTokens}
                            onUpdate={updateToken}
                        />
                    </div>
                </div>
            )}

            {/* Tab: Chart & Status */}
            {activeTab === "chart" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <SingleColorField
                                key={i}
                                label={`Chart ${i}`}
                                tokenKey={`chart${i}`}
                                light={lightTokens}
                                dark={darkTokens}
                                onUpdate={updateToken}
                            />
                        ))}
                    </div>
                    <div className="border-t border-slate-100 pt-4">
                        <p className="mb-3 text-xs font-semibold text-slate-500">
                            Status Colors
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <SingleColorField
                                label="Success"
                                tokenKey="success"
                                light={lightTokens}
                                dark={darkTokens}
                                onUpdate={updateToken}
                            />
                            <SingleColorField
                                label="Warning"
                                tokenKey="warning"
                                light={lightTokens}
                                dark={darkTokens}
                                onUpdate={updateToken}
                            />
                            <SingleColorField
                                label="Info"
                                tokenKey="info"
                                light={lightTokens}
                                dark={darkTokens}
                                onUpdate={updateToken}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
                {cancelHref && (
                    <Link
                        href={cancelHref}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>
                )}
            </div>
        </form>
    );
}

/* ── Color pair row (bg + fg, light + dark) ── */
function ColorPairRow({ label, bgKey, fgKey, light, dark, onUpdate }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-600">{label}</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <p className="mb-1 text-[10px] text-slate-400">Light</p>
                    <div className="flex gap-2">
                        <MiniColorPicker
                            value={light[bgKey] || "#000000"}
                            onChange={(v) => onUpdate(bgKey, v, "light")}
                            label="BG"
                        />
                        <MiniColorPicker
                            value={light[fgKey] || "#FFFFFF"}
                            onChange={(v) => onUpdate(fgKey, v, "light")}
                            label="FG"
                        />
                    </div>
                </div>
                <div>
                    <p className="mb-1 text-[10px] text-slate-400">Dark</p>
                    <div className="flex gap-2">
                        <MiniColorPicker
                            value={dark[bgKey] || "#000000"}
                            onChange={(v) => onUpdate(bgKey, v, "dark")}
                            label="BG"
                        />
                        <MiniColorPicker
                            value={dark[fgKey] || "#FFFFFF"}
                            onChange={(v) => onUpdate(fgKey, v, "dark")}
                            label="FG"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Single color field (light + dark) ── */
function SingleColorField({ label, tokenKey, light, dark, onUpdate }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
            <p className="mb-1.5 text-[10px] font-semibold text-slate-500">{label}</p>
            <div className="flex gap-2">
                <MiniColorPicker
                    value={light[tokenKey] || "#000000"}
                    onChange={(v) => onUpdate(tokenKey, v, "light")}
                    label="L"
                />
                <MiniColorPicker
                    value={dark[tokenKey] || "#000000"}
                    onChange={(v) => onUpdate(tokenKey, v, "dark")}
                    label="D"
                />
            </div>
        </div>
    );
}

/* ── Mini color picker ── */
function MiniColorPicker({ value, onChange, label }) {
    return (
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-5 w-5 shrink-0 cursor-pointer rounded border border-slate-200"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-16 border-0 bg-transparent p-0 font-mono text-[10px] text-slate-600 focus:outline-none focus:ring-0"
            />
        </div>
    );
}
