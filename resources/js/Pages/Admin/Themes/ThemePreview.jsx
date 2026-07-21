import { useMemo } from "react";

/**
 * ThemePreview — rich mini-dashboard preview matching theme-create.html's
 * live preview panel. Shows sidebar strip, topbar, stat cards, list, chart
 * bars, and a swatch row.
 *
 * @param {Object} props
 * @param {Object} props.tokens — shadcn/ui token keys (hex values)
 * @param {boolean} props.isDark — mode label
 * @param {boolean} props.compact — shorter version for card-level preview
 */
export default function ThemePreview({
    tokens = {},
    isDark = false,
    compact = false,
}) {
    const t = tokens;
    const h = compact ? 210 : 340;

    return (
        <div
            className="overflow-hidden rounded-xl border"
            style={{
                background: t.background || "#fff",
                borderColor: t.border || "#e2e8f0",
            }}
        >
            <div style={{ display: "flex", height: h }}>
                {/* Sidebar strip */}
                <div
                    style={{
                        width: compact ? 70 : 96,
                        background: t.sidebar || t.card || "#fff",
                        borderRight: `1px solid ${t.border || "#e2e8f0"}`,
                        padding: compact ? 10 : 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: compact ? 8 : 8,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <div
                            style={{
                                width: compact ? 14 : 16,
                                height: compact ? 14 : 16,
                                borderRadius: 5,
                                background: t.primary || "#4F46E5",
                            }}
                        />
                        {!compact && (
                            <div
                                style={{
                                    height: 7,
                                    flex: 1,
                                    borderRadius: 2,
                                    background: t.sidebarForeground || t.foreground || "#0f172a",
                                    opacity: 0.85,
                                }}
                            />
                        )}
                    </div>
                    <div
                        style={{
                            marginTop: 4,
                            height: compact ? 8 : 8,
                            borderRadius: 3,
                            background: t.primary || "#4F46E5",
                            opacity: 0.15,
                        }}
                    />
                    <div
                        style={{
                            height: 6,
                            borderRadius: 3,
                            background: t.sidebarForeground || t.foreground || "#0f172a",
                            opacity: 0.18,
                            width: "80%",
                        }}
                    />
                    <div
                        style={{
                            height: 6,
                            borderRadius: 3,
                            background: t.sidebarForeground || t.foreground || "#0f172a",
                            opacity: 0.18,
                            width: "65%",
                        }}
                    />
                    <div
                        style={{
                            height: 6,
                            borderRadius: 3,
                            background: t.sidebarForeground || t.foreground || "#0f172a",
                            opacity: 0.18,
                            width: "75%",
                        }}
                    />
                    <div
                        style={{
                            marginTop: "auto",
                            height: 6,
                            borderRadius: 3,
                            background: t.sidebarForeground || t.foreground || "#0f172a",
                            opacity: 0.1,
                            width: "60%",
                        }}
                    />
                </div>

                {/* Main area */}
                <div
                    style={{
                        flex: 1,
                        padding: compact ? 10 : 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: compact ? 10 : 12,
                        minWidth: 0,
                    }}
                >
                    {/* Topbar */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                height: compact ? 8 : 9,
                                width: compact ? 90 : 110,
                                borderRadius: 3,
                                background: t.foreground || "#0f172a",
                                opacity: 0.9,
                            }}
                        />
                        <div
                            style={{
                                marginLeft: "auto",
                                height: compact ? 18 : 24,
                                width: compact ? 60 : 90,
                                borderRadius: 6,
                                background: t.input || t.card || "#f1f5f9",
                                border: `1px solid ${t.border || "#e2e8f0"}`,
                            }}
                        />
                        <div
                            style={{
                                height: compact ? 18 : 24,
                                padding: `0 ${compact ? 8 : 12}px`,
                                display: "inline-flex",
                                alignItems: "center",
                                borderRadius: 6,
                                background: t.primary || "#4F46E5",
                                color: t.primaryForeground || "#fff",
                                fontSize: compact ? 9 : 10.5,
                                fontWeight: 600,
                            }}
                        >
                            Action
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: compact ? 8 : 10,
                        }}
                    >
                        {[
                            { l: "Revenue", v: "Rp 24.8k" },
                            { l: "Users", v: "1,204" },
                        ].map(({ l, v }) => (
                            <div
                                key={l}
                                style={{
                                    background: t.card || "#fff",
                                    color: t.cardForeground || "#0f172a",
                                    border: `1px solid ${t.border || "#e2e8f0"}`,
                                    borderRadius: 8,
                                    padding: compact ? "9px 10px" : "10px 12px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: compact ? 8 : 9.5,
                                        color: t.mutedForeground || "#64748b",
                                        fontWeight: 500,
                                    }}
                                >
                                    {l}
                                </div>
                                <div
                                    style={{
                                        fontSize: compact ? 12 : 14,
                                        fontWeight: 600,
                                        marginTop: 2,
                                    }}
                                >
                                    {v}
                                </div>
                                <div
                                    style={{
                                        display: "inline-block",
                                        marginTop: 6,
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        background: t.accent || t.primary + "1a" || "#EEF2FF",
                                        color: t.accentForeground || t.primary || "#4F46E5",
                                        fontSize: compact ? 8 : 9.5,
                                        fontWeight: 600,
                                    }}
                                >
                                    +12.4%
                                </div>
                            </div>
                        ))}
                    </div>

                    {!compact && (
                        <>
                            {/* List */}
                            <div
                                style={{
                                    background: t.card || "#fff",
                                    color: t.cardForeground || "#0f172a",
                                    border: `1px solid ${t.border || "#e2e8f0"}`,
                                    borderRadius: 8,
                                    padding: 10,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    flex: 1,
                                }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: 9999,
                                                background:
                                                    t.primary || "#4F46E5",
                                                opacity: 0.95 - i * 0.2,
                                            }}
                                        />
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 3,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: 6,
                                                    width: `${60 + i * 8}%`,
                                                    background:
                                                        t.foreground || "#0f172a",
                                                    opacity: 0.85,
                                                    borderRadius: 2,
                                                }}
                                            />
                                            <div
                                                style={{
                                                    height: 5,
                                                    width: `${40 + i * 5}%`,
                                                    background:
                                                        t.mutedForeground || "#64748b",
                                                    opacity: 0.6,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                padding: "2px 6px",
                                                borderRadius: 4,
                                                background:
                                                    t.accent || t.primary + "1a" || "#EEF2FF",
                                                color:
                                                    t.accentForeground ||
                                                    t.primary ||
                                                    "#4F46E5",
                                                fontSize: 9.5,
                                                fontWeight: 600,
                                            }}
                                        >
                                            Live
                                        </div>
                                        <div
                                            style={{
                                                padding: "2px 6px",
                                                borderRadius: 4,
                                                background:
                                                    t.destructive || "#DC2626",
                                                color:
                                                    t.destructiveForeground || "#fff",
                                                fontSize: 9.5,
                                                fontWeight: 600,
                                                opacity: i === 2 ? 1 : 0,
                                            }}
                                        >
                                            !
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chart bars */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                {["chart1", "chart2", "chart3", "chart4", "chart5"].map(
                                    (k, i) => (
                                        <div
                                            key={k}
                                            style={{
                                                flex: 1,
                                                height: 16 + i * 4,
                                                borderRadius: 4,
                                                background:
                                                    t[k] || "#4F46E5",
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
