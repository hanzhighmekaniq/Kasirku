import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Sector,
} from "recharts";
import { useState, useCallback } from "react";
import { useTheme } from "@/Theme/ThemeProvider";

/* ── formatters ─────────────────────────────────────── */
const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);
const fmtNum = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);

/* ── date helpers ───────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) =>
    new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const monthStart = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
};

/* ── trend badge ────────────────────────────────────── */
function TrendBadge({ value, suffix = "%" }) {
    if (value === undefined || value === null) return null;
    const isUp = value > 0;
    const isDown = value < 0;
    const isFlat = value === 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isUp
                    ? "bg-emerald-100 text-success"
                    : isDown
                      ? "bg-red-100 text-destructive"
                      : "bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))]"
            }`}
        >
            {isUp && (
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
            )}
            {isDown && (
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                </svg>
            )}
            {isFlat ? "—" : `${Math.abs(value)}${suffix}`}
        </span>
    );
}

/* ── report shortcut ────────────────────────────────── */
function ReportBtn({ label = "Lihat Laporan", dateRange, branchIds }) {
    const params = {};
    if (dateRange?.start) params.start_date = dateRange.start;
    if (dateRange?.end) params.end_date = dateRange.end;
    if (branchIds?.length) params.branch_ids = branchIds;

    return (
        <Link
            href={route("admin.reports.index", params)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--color-text-secondary))] shadow-sm transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
        >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            {label}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
        </Link>
    );
}

/* ── primitives ─────────────────────────────────────── */
function Card({ children, className = "" }) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] shadow-sm ${className}`}>
            {children}
        </div>
    );
}

function SectionHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-divider))] px-5 py-4">
            <div>
                <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-[rgb(var(--color-text-muted))]">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

/* ── stat card dengan trend indicator ───────────────── */
function StatCard({ label, value, sub, icon, accent = "bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))]", trend }) {
    return (
        <Card>
            <div className="p-5">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">{label}</p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${accent}`}>{icon}</span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-[rgb(var(--color-text-primary))]">{value}</p>
                <div className="mt-1 flex items-center gap-2">
                    {sub && <p className="text-xs text-[rgb(var(--color-text-muted))]">{sub}</p>}
                    <TrendBadge value={trend} />
                </div>
            </div>
        </Card>
    );
}

/* ── hero revenue card ──────────────────────────────── */
function HeroRevenueCard({ todaySales, todayCount, aov, salesTrend, countTrend, aovTrend, storeType }) {
    const GREETING = {
        retail: "Penjualan Hari Ini",
        fnb: "Transaksi Hari Ini",
        service: "Layanan Hari Ini",
        rental: "Sewa Hari Ini",
        ticket: "Tiket Hari Ini",
        hospitality: "Check-in Hari Ini",
        parking: "Kendaraan Hari Ini",
        session: "Sesi Hari Ini",
    };
    return (
        <div className="rounded-2xl border border-primary-200 bg-[rgb(var(--color-card))] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase text-[rgb(var(--color-cardForeground))] tracking-wider text-primary-600">
                        {GREETING[storeType] ?? "Penjualan Hari Ini"}
                    </p>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-[rgb(var(--color-text-primary))]">
                        {fmt(todaySales)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm text-[rgb(var(--color-text-secondary))]">{fmtNum(todayCount)} transaksi</span>
                            <TrendBadge value={countTrend} />
                        </div>
                        <span className="text-[rgb(var(--color-text-muted))]">·</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm text-[rgb(var(--color-text-secondary))]">AOV {fmt(aov)}</span>
                            <TrendBadge value={aovTrend} />
                        </div>
                    </div>
                </div>
                <TrendBadge value={salesTrend} suffix="%" />
            </div>
        </div>
    );
}

/* ── hourly bar chart ───────────────────────────────── */
function HourlyChart({ data }) {
    if (!data?.length) {
        return (
            <div className="flex h-32 items-center justify-center px-5 pb-4 text-sm text-[rgb(var(--color-text-muted))]">
                Belum ada transaksi hari ini
            </div>
        );
    }
    const max = Math.max(...data.map((d) => d.total), 1);
    const hours = Array.from({ length: 24 }, (_, i) => {
        const found = data.find((d) => Number(d.hour) === i);
        return { hour: i, total: found ? Number(found.total) : 0, count: found ? Number(found.count) : 0 };
    });

    return (
        <div className="flex h-28 items-end gap-0.5 overflow-x-auto px-5 pb-3 pt-4">
            {hours.map((h) => {
                const pct = Math.max(h.total > 0 ? 4 : 0, Math.round((h.total / max) * 100));
                return (
                    <div key={h.hour} className="group relative flex flex-1 flex-col items-center" style={{ minWidth: "8px" }}>
                        <div
                            className={`w-full rounded-t transition-all duration-200 ${h.total > 0 ? "bg-primary-500 group-hover:bg-primary-600" : "bg-[rgb(var(--color-surface-secondary))]"}`}
                            style={{ height: `${pct}%` }}
                        />
                        {h.total > 0 && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3 py-2 text-xs shadow-lg group-hover:block">
                                <p className="font-semibold text-[rgb(var(--color-text-primary))]">{h.hour.toString().padStart(2, "0")}:00</p>
                                <p className="text-primary-600">{fmt(h.total)}</p>
                                <p className="text-[rgb(var(--color-text-muted))]">{h.count} transaksi</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ── recent sales ───────────────────────────────────── */
function RecentSales({ data }) {
    if (!data?.length) return <p className="px-5 py-8 text-center text-sm text-[rgb(var(--color-text-muted))]">Belum ada transaksi</p>;
    return (
        <div className="divide-y divide-[rgb(var(--color-divider))]">
            {data.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold text-primary-600">{s.sale_no}</p>
                        <p className="text-xs text-[rgb(var(--color-text-muted))]">
                            {s.user?.name ?? "—"} ·{" "}
                            {new Date(s.sale_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                    <div className="ml-4 text-right">
                        <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{fmt(s.grand_total)}</p>
                        <span className={`text-xs ${s.payment_status === "paid" ? "text-emerald-600" : "text-[rgb(var(--color-text-muted))]"}`}>
                            {s.payment_status === "paid" ? "Lunas" : "Pending"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── top products ───────────────────────────────────── */
function TopToday({ data }) {
    if (!data?.length) return <p className="px-5 py-8 text-center text-sm text-[rgb(var(--color-text-muted))]">Belum ada penjualan hari ini</p>;
    const max = Math.max(...data.map((d) => d.revenue), 1);
    return (
        <div className="space-y-3 px-5 py-4">
            {data.map((p, i) => (
                <div key={i}>
                    <div className="mb-1 flex items-center justify-between">
                        <span className="truncate text-sm text-[rgb(var(--color-text-secondary))]">{p.name}</span>
                        <span className="ml-2 text-xs font-semibold text-[rgb(var(--color-text-secondary))]">{fmtNum(p.qty)} pcs</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--color-surface-secondary))]">
                        <div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${Math.max(4, Math.round((p.revenue / max) * 100))}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── branch breakdown ───────────────────────────────── */
function BranchBreakdown({ data }) {
    if (!data?.length) return null;
    const totalToday = data.reduce((s, b) => s + b.today_sales, 0);
    return (
        <Card>
            <SectionHeader title="Penjualan per Cabang" subtitle="Hari ini" action={<ReportBtn dateRange={{ start: today(), end: today() }} />} />
            <div className="divide-y divide-[rgb(var(--color-divider))]">
                {data.map((b) => (
                    <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--color-surface-secondary))] text-xs font-bold text-[rgb(var(--color-text-secondary))]">
                            {b.code?.charAt(0) ?? b.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">{b.name}</p>
                            <p className="text-xs text-[rgb(var(--color-text-muted))]">{b.today_count} transaksi hari ini</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{fmt(b.today_sales)}</p>
                            <p className="text-xs text-[rgb(var(--color-text-muted))]">{totalToday > 0 ? Math.round((b.today_sales / totalToday) * 100) : 0}% dari total</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

/* ── store overview ─────────────────────────────────── */
function StoreOverview({ data, allStoreTypes = [] }) {
    if (!data?.length) return null;
    return (
        <Card>
            <SectionHeader title="Overview Semua Toko" subtitle="Penjualan hari ini" action={<ReportBtn dateRange={{ start: today(), end: today() }} />} />
            <div className="divide-y divide-[rgb(var(--color-divider))]">
                {data.map((s) => {
                    const tm = allStoreTypes.find((t) => t.code === s.store_type) ?? {};
                    return (
                        <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                            <span className="text-xl shrink-0">{tm.icon ?? "🏬"}</span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[rgb(var(--color-text-primary))]">{s.name}</p>
                                <p className="text-xs text-[rgb(var(--color-text-muted))]">{tm.label ?? s.store_type} · {s.today_count} transaksi hari ini</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-[rgb(var(--color-text-primary))]">{fmt(s.today_sales)}</p>
                                <p className="text-xs text-[rgb(var(--color-text-muted))]">Bulan: {fmt(s.month_sales)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

/* ── weekly trend chart ─────────────────────────────── */
function WeeklyTrendChart({ data }) {
    const { theme, isDark } = useTheme();
    const tokens = isDark ? theme.dark : theme.light;
    const chartColor = tokens.chart1 || tokens.primary || '#4F46E5';
    const mutedHex = tokens.mutedForeground || '#94A3B8';

    if (!data?.length) return null;
    return (
        <div className="px-2 py-3">
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <defs>
                        <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: mutedHex }} dy={6} />
                    <YAxis hide />
                    <Tooltip
                        cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: "4 4" }}
                        content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const d = payload[0].payload;
                            return (
                                <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))]/95 px-4 py-3 shadow-lg backdrop-blur-sm">
                                    <p className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">{d.fullDate}</p>
                                    <p className="mt-1 text-base font-bold text-primary-600">{fmt(d.total)}</p>
                                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{d.count} transaksi</p>
                                </div>
                            );
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke={chartColor}
                        strokeWidth={2.5}
                        fill="url(#weeklyGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: chartColor, stroke: "#fff", strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
            <div className="mt-1 flex items-center justify-between px-1 text-xs text-[rgb(var(--color-text-muted))]">
                <span>{data[0]?.fullDate}</span>
                <span>7 Hari Terakhir</span>
                <span>{data[data.length - 1]?.fullDate}</span>
            </div>
        </div>
    );
}

/* ── payment donut ──────────────────────────────────── */
function PaymentDonutChart({ data }) {
    const { theme, isDark } = useTheme();
    const tokens = isDark ? theme.dark : theme.light;
    const donutColors = [
        tokens.chart1 || tokens.primary || '#4F46E5',
        tokens.chart2 || tokens.accent || '#8B5CF6',
        tokens.chart3 || '#16A34A',
        tokens.chart4 || '#F59E0B',
        tokens.chart5 || '#06B6D4',
        tokens.chart1 || '#EC4899',
    ];
    const textPrimaryHex = tokens.foreground || '#0F172A';
    const textMutedHex = tokens.mutedForeground || '#94A3B8';

    const [activeIndex, setActiveIndex] = useState(null);
    if (!data?.length) return <div className="flex h-52 items-center justify-center text-sm text-[rgb(var(--color-text-muted))]">Belum ada data bulan ini</div>;

    const onPieEnter = useCallback((_, idx) => setActiveIndex(idx), []);
    const onPieLeave = useCallback(() => setActiveIndex(null), []);

    const renderActiveShape = useCallback(
        (props) => {
            const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
            return (
                <g>
                    <text x={cx} y={cy - 8} textAnchor="middle" fill={textPrimaryHex} fontSize={14} fontWeight={700}>
                        {fmt(Number(payload.total))}
                    </text>
                    <text x={cx} y={cy + 12} textAnchor="middle" fill={textMutedHex} fontSize={11}>
                        {(percent * 100).toFixed(1)}%
                    </text>
                    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
                    <Sector cx={cx} cy={cy} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.3} />
                </g>
            );
        },
        [textPrimaryHex, textMutedHex],
    );

    return (
        <div className="flex flex-col items-center px-2 py-3">
            <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={82}
                        dataKey="total"
                        nameKey="name"
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                        stroke="none"
                    >
                        {data.map((_, idx) => (
                            <Cell key={idx} fill={donutColors[idx % donutColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const d = payload[0].payload;
                            return (
                                <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))]/95 px-4 py-3 shadow-lg backdrop-blur-sm">
                                    <p className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">{d.name}</p>
                                    <p className="mt-1 text-sm font-bold text-[rgb(var(--color-text-primary))]">{fmt(Number(d.total))}</p>
                                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{d.count} transaksi</p>
                                </div>
                            );
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {data.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-[rgb(var(--color-text-secondary))]">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: donutColors[idx % donutColors.length] }} />
                        {d.name}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── main Dashboard ─────────────────────────────────── */
export default function Dashboard({
    mode,
    currentStore,
    branches = [],
    filters = {},
    stats,
    hourlySales,
    recentSales,
    branchBreakdown,
    storeOverview,
    topToday,
    weeklySales,
    paymentDist,
    activeShift = null,
}) {
    const { currentBranch, allStoreTypes = [] } = usePage().props;
    const isKasir = mode === "kasir";
    const storeType = currentStore?.store_type ?? "retail";
    const hasStock = ["retail", "fnb", "rental"].includes(storeType);

    const storeLabel = currentStore
        ? `${currentStore.name}${currentBranch ? ` — ${currentBranch.name}` : ""}`
        : "Dashboard";

    // Branch filter state
    const [pendingBranchIds, setPendingBranchIds] = useState(
        (filters.branch_ids ?? []).length > 0
            ? (filters.branch_ids ?? []).map(Number)
            : branches.map((b) => b.id),
    );
    const togglePending = (branchId) => {
        setPendingBranchIds((prev) =>
            prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId],
        );
    };
    const applyBranchFilter = () => {
        const params = {};
        if (pendingBranchIds.length < branches.length) params.branch_ids = pendingBranchIds;
        router.get(route("admin.dashboard"), params, { preserveState: false, replace: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">
                        {isKasir ? "Dashboard Kasir" : "Dashboard"}
                    </h2>
                    {currentStore && (
                        <span className="hidden max-w-xs truncate rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-secondary))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--color-text-secondary))] sm:inline">
                            {storeLabel}
                        </span>
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-5">
                {/* Shift banner (kasir) */}
                {isKasir &&
                    (!activeShift ? (
                        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-[rgb(var(--color-card))] px-5 py-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Belum Ada Shift Aktif</p>
                                    <p className="text-xs text-amber-600">Buka shift sebelum mulai transaksi.</p>
                                </div>
                            </div>
                            <Link
                                href={route("admin.cashier-shifts.create")}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:from-amber-600 hover:to-orange-600"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Buka Shift
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-gradient-to-r from-emerald-50 to-[rgb(var(--color-card))] px-5 py-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/100">
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">Shift Aktif: {activeShift.shift_no}</p>
                                    <p className="text-xs text-emerald-600">
                                        Kas awal: {fmt(activeShift.opening_cash)} · Dibuka{" "}
                                        {new Date(activeShift.opened_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route("admin.cashier-shifts.show", activeShift.id)}
                                className="rounded-lg border border-success/20 bg-[rgb(var(--color-card))] px-3 py-1.5 text-xs font-medium text-success transition hover:bg-success/10"
                            >
                                Lihat Shift
                            </Link>
                        </div>
                    ))}

                {/* Branch filter (admin) */}
                {!isKasir && branches.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {branches.map((b) => (
                            <label
                                key={b.id}
                                className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                    pendingBranchIds.includes(b.id)
                                        ? "border-primary-400 bg-primary-50 text-primary-700"
                                        : "border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] text-[rgb(var(--color-text-secondary))] hover:border-primary-300"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={pendingBranchIds.includes(b.id)}
                                    onChange={() => togglePending(b.id)}
                                    className="h-3.5 w-3.5 rounded border-[rgb(var(--color-border))] text-primary-600 focus:ring-primary-500"
                                />
                                {b.name}
                            </label>
                        ))}
                        <button
                            onClick={applyBranchFilter}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-primary/90"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Terapkan
                        </button>
                        <div className="ml-auto">
                            <ReportBtn label="Buka Laporan" />
                        </div>
                    </div>
                )}

                {/* Report shortcut (single branch) */}
                {!isKasir && branches.length <= 1 && (
                    <div className="flex items-center justify-between rounded-2xl border border-[rgb(var(--color-border))] bg-gradient-to-r from-primary-50/60 to-[rgb(var(--color-card))] px-5 py-3 shadow-sm">
                        <div>
                            <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Laporan & Analitik</p>
                            <p className="text-xs text-[rgb(var(--color-text-muted))]">Lihat tren penjualan, laba, dan lainnya</p>
                        </div>
                        <ReportBtn label="Buka Laporan" />
                    </div>
                )}

                {/* ── Hero Revenue Card ── */}
                <HeroRevenueCard
                    todaySales={stats.today_sales}
                    todayCount={stats.today_count}
                    aov={stats.aov_today}
                    salesTrend={stats.today_sales_trend}
                    countTrend={stats.today_count_trend}
                    aovTrend={stats.aov_trend}
                    storeType={storeType}
                />

                {/* ── Stat Cards Row 1: Penjualan ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        label="Revenue Hari Ini"
                        value={fmt(stats.today_sales)}
                        sub={`${fmtNum(stats.today_count)} transaksi`}
                        icon="💰"
                        accent="bg-success/10 text-emerald-600"
                        trend={stats.today_sales_trend}
                    />
                    <StatCard
                        label="Rata-rata per Transaksi"
                        value={fmt(stats.aov_today)}
                        sub="Avg Order Value"
                        icon="📊"
                        accent="bg-primary-50 text-primary-600"
                        trend={stats.aov_trend}
                    />
                    <StatCard
                        label="Laba Hari Ini"
                        value={fmt(stats.today_profit)}
                        sub="Revenue - Pembelian - Pengeluaran"
                        icon="💵"
                        accent={stats.today_profit >= 0 ? "bg-success/10 text-emerald-600" : "bg-destructive/10 text-destructive"}
                        trend={stats.today_profit_trend}
                    />
                    <StatCard
                        label="Bulan Ini"
                        value={fmt(stats.month_sales)}
                        sub={`${fmtNum(stats.month_count)} transaksi`}
                        icon="📈"
                        accent="bg-violet-50 text-violet-600"
                    />
                </div>

                {/* ── Stat Cards Row 2: Operasional ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {hasStock ? (
                        <StatCard
                            label="Stok Menipis"
                            value={`${fmtNum(stats.low_stock)} item`}
                            sub={stats.low_stock > 0 ? "Perlu segera restok" : "Stok aman"}
                            icon={stats.low_stock > 0 ? "⚠️" : "✅"}
                            accent={stats.low_stock > 0 ? "bg-amber-50 text-amber-600" : "bg-success/10 text-emerald-500"}
                        />
                    ) : (
                        <StatCard
                            label="Shift Hari Ini"
                            value={fmtNum(stats.today_shifts)}
                            sub={`${fmtNum(stats.open_shifts)} sedang buka`}
                            icon="🕐"
                            accent="bg-amber-50 text-amber-600"
                        />
                    )}
                    <StatCard
                        label="Pembelian Hari Ini"
                        value={fmt(stats.today_purchases)}
                        sub="Dari supplier"
                        icon="🛒"
                        accent="bg-primary-50 text-primary-600"
                    />
                    <StatCard
                        label="Pengeluaran Hari Ini"
                        value={fmt(stats.today_expenses)}
                        sub="Biaya operasional"
                        icon="💸"
                        accent="bg-amber-50 text-amber-600"
                    />
                    <StatCard
                        label={hasStock ? "Total Produk" : "Total Item/Layanan"}
                        value={fmtNum(stats.total_products)}
                        sub="Aktif"
                        icon="📦"
                        accent="bg-violet-50 text-violet-600"
                    />
                </div>

                {/* ── Store overview ── */}
                {storeOverview?.length > 0 && <StoreOverview data={storeOverview} allStoreTypes={allStoreTypes} />}

                {/* ── Branch breakdown ── */}
                {branchBreakdown?.length > 1 && <BranchBreakdown data={branchBreakdown} />}

                {/* ── Weekly Trend + Payment Donut ── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <SectionHeader
                            title="Tren Penjualan 7 Hari"
                            subtitle="Total penjualan harian"
                            action={<ReportBtn dateRange={{ start: daysAgo(6), end: today() }} />}
                        />
                        <WeeklyTrendChart data={weeklySales} />
                    </Card>
                    <Card>
                        <SectionHeader
                            title="Metode Pembayaran"
                            subtitle="Bulan ini"
                            action={<ReportBtn label="Detail" dateRange={{ start: monthStart(), end: today() }} />}
                        />
                        <PaymentDonutChart data={paymentDist} />
                    </Card>
                </div>

                {/* ── Hourly Chart + Top Products ── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <SectionHeader
                            title="Tren Penjualan Hari Ini"
                            subtitle="Per jam (00:00 – 23:00)"
                            action={<ReportBtn dateRange={{ start: today(), end: today() }} />}
                        />
                        <HourlyChart data={hourlySales} />
                        <div className="flex items-center justify-between border-t border-[rgb(var(--color-divider))] px-5 py-2.5 text-xs text-[rgb(var(--color-text-muted))]">
                            <span>00:00</span>
                            <span>
                                Hari ini,{" "}
                                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                            </span>
                            <span>23:00</span>
                        </div>
                    </Card>
                    <Card>
                        <SectionHeader
                            title={storeType === "fnb" ? "Menu Terlaris" : storeType === "service" ? "Layanan Terlaris" : "Produk Terlaris"}
                            subtitle="Hari ini"
                            action={<ReportBtn label="Detail" dateRange={{ start: today(), end: today() }} />}
                        />
                        <TopToday data={topToday} />
                    </Card>
                </div>

                {/* ── Recent Sales ── */}
                <Card>
                    <SectionHeader
                        title="Transaksi Terbaru"
                        subtitle="5 transaksi terakhir"
                        action={
                            <div className="flex items-center gap-2">
                                <Link href={route("admin.sales.index")} className="text-xs font-medium text-primary-600 hover:underline">
                                    Lihat semua →
                                </Link>
                                <ReportBtn label="Laporan" dateRange={{ start: today(), end: today() }} />
                            </div>
                        }
                    />
                    <RecentSales data={recentSales} />
                </Card>

                {/* ── Kasir Quick Actions ── */}
                {isKasir && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <Link
                            href={route("admin.kasir.index")}
                            className="flex flex-col items-center gap-2 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] p-5 text-center shadow-sm transition hover:border-primary-300 hover:bg-primary-50/50"
                        >
                            <span className="text-3xl">
                                {storeType === "fnb" ? "🍽️" : storeType === "service" ? "✂️" : storeType === "rental" ? "🔑" : storeType === "ticket" ? "🎟️" : storeType === "hospitality" ? "🛏️" : storeType === "parking" ? "🅿️" : storeType === "session" ? "🎮" : "🛒"}
                            </span>
                            <span className="text-sm font-semibold text-[rgb(var(--color-text-secondary))]">
                                {storeType === "fnb" ? "Buka Kasir" : storeType === "service" ? "Mulai Layanan" : storeType === "rental" ? "Buka Sewa" : storeType === "ticket" ? "Jual Tiket" : storeType === "parking" ? "Parkir Masuk" : storeType === "session" ? "Mulai Sesi" : "Buka Kasir"}
                            </span>
                        </Link>
                        <Link
                            href={route("admin.sales.index")}
                            className="flex flex-col items-center gap-2 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] p-5 text-center shadow-sm transition hover:border-primary-300 hover:bg-primary-50/50"
                        >
                            <span className="text-3xl">📋</span>
                            <span className="text-sm font-semibold text-[rgb(var(--color-text-secondary))]">
                                {storeType === "rental" ? "Riwayat Sewa" : storeType === "service" ? "Riwayat Layanan" : "Riwayat Transaksi"}
                            </span>
                        </Link>
                        <Link
                            href={route("admin.customers.index")}
                            className="flex flex-col items-center gap-2 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] p-5 text-center shadow-sm transition hover:border-primary-300 hover:bg-primary-50/50"
                        >
                            <span className="text-3xl">👥</span>
                            <span className="text-sm font-semibold text-[rgb(var(--color-text-secondary))]">
                                {storeType === "service" ? "Data Pelanggan" : "Pelanggan"}
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
