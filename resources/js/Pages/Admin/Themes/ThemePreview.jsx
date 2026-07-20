import { generateColorScale } from "@/Theme/generateShades";
import { useMemo } from "react";

const SEMANTIC = {
    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626",
};

/**
 * Bangun token preview minimal (light/dark) dari 3 warna dasar — versi
 * ringkas dari `buildTheme()` di Theme/templates.js, khusus untuk preview
 * standalone di luar ThemeProvider (tidak perlu context/CSS variable).
 */
function buildPreviewTokens({ primary, secondary, accent, isDark }) {
    const primaryScale = generateColorScale(primary || "#4F46E5");
    const accentScale = generateColorScale(accent || "#8B5CF6");
    const secondaryScale = generateColorScale(secondary || "#64748B");

    if (isDark) {
        return {
            primary: primaryScale,
            accent: accentScale,
            secondary: secondaryScale,
            ...SEMANTIC,
            background: "#0F172A",
            surface: "#1E293B",
            card: "#1F2937",
            border: "#334155",
            textPrimary: "#F8FAFC",
            textSecondary: "#CBD5E1",
            textMuted: "#94A3B8",
            tableHeader: "#1E293B",
            tableRow: "#1E293B",
            tableHover: "#334155",
        };
    }

    return {
        primary: primaryScale,
        accent: accentScale,
        secondary: secondaryScale,
        ...SEMANTIC,
        background: "#F8FAFC",
        surface: "#FFFFFF",
        card: "#FFFFFF",
        border: "#E2E8F0",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        textMuted: "#94A3B8",
        tableHeader: "#F8FAFC",
        tableRow: "#FFFFFF",
        tableHover: "#F1F5F9",
    };
}

/**
 * Preview mini dashboard standalone — dipakai di Create/Edit (live preview
 * saat user pilih warna) dan Index (preview kecil per-card). Tidak
 * bergantung pada ThemeProvider, murni generate token dari 3 hex + is_dark.
 */
export default function ThemePreview({ primary, secondary, accent, isDark = false, compact = false }) {
    const t = useMemo(
        () => buildPreviewTokens({ primary, secondary, accent, isDark }),
        [primary, secondary, accent, isDark],
    );

    const stats = [
        { label: "Penjualan", value: "Rp 2.450.000", color: t.primary["600"] },
        { label: "Transaksi", value: "48", color: t.success },
        { label: "Stok Menipis", value: "3 item", color: t.warning },
    ];

    return (
        <div
            className={`flex w-full flex-col gap-2.5 rounded-xl border p-3 ${compact ? "h-32" : "h-full"}`}
            style={{ background: t.background, borderColor: t.border }}
        >
            <div className="grid grid-cols-3 gap-2">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="rounded-lg border p-2"
                        style={{ background: t.card, borderColor: t.border }}
                    >
                        <p
                            className="truncate text-[8px] font-semibold uppercase tracking-wide"
                            style={{ color: t.textMuted }}
                        >
                            {s.label}
                        </p>
                        <p className="mt-0.5 text-xs font-bold" style={{ color: s.color }}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {!compact && (
                <div
                    className="flex-1 overflow-hidden rounded-lg border"
                    style={{ background: t.card, borderColor: t.border }}
                >
                    <div
                        className="flex items-center justify-between px-2.5 py-2"
                        style={{ background: t.tableHeader, borderBottom: `1px solid ${t.border}` }}
                    >
                        <span className="text-[10px] font-semibold" style={{ color: t.textPrimary }}>
                            Transaksi Terbaru
                        </span>
                        <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                            style={{ background: t.primary["600"] }}
                        >
                            Lihat Semua
                        </span>
                    </div>
                    {["SL-001 · 08:12", "SL-002 · 08:20", "SL-003 · 08:35"].map((row, i) => (
                        <div
                            key={row}
                            className="flex items-center justify-between px-2.5 py-1.5 text-[10px]"
                            style={{
                                background: i % 2 === 0 ? t.tableRow : t.tableHover,
                                color: t.textSecondary,
                            }}
                        >
                            <span>{row}</span>
                            <span className="font-semibold" style={{ color: t.textPrimary }}>
                                Rp {45 + i * 10}.000
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-1.5">
                {["600", "500", "400"].map((shade) => (
                    <span
                        key={shade}
                        className="h-3.5 w-3.5 rounded-full border border-black/5"
                        style={{ background: t.primary[shade] }}
                    />
                ))}
                {["600", "500"].map((shade) => (
                    <span
                        key={`a-${shade}`}
                        className="h-3.5 w-3.5 rounded-full border border-black/5"
                        style={{ background: t.accent[shade] }}
                    />
                ))}
                <span
                    className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                    style={{ background: isDark ? "#334155" : "#94A3B8" }}
                >
                    {isDark ? "Dark" : "Light"}
                </span>
            </div>
        </div>
    );
}
