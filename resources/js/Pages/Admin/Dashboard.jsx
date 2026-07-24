import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import Dropdown from "@/Components/Dropdown";
import { NavIcons } from "@/Components/NavIcons";
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
// lucide-react imports removed as we are now using NavIcons


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

function TrendBadge({ value, suffix = "%" }) {
    if (value === undefined || value === null) return null;
    const isUp = value > 0;
    const isDown = value < 0;
    const isFlat = value === 0;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${isUp
                    ? "bg-success/10 text-success"
                    : isDown
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                }`}
        >
            {isUp && <NavIcons name="trendingUp" className="h-3 w-3" strokeWidth={3} />}
            {isDown && <NavIcons name="trendingDown" className="h-3 w-3" strokeWidth={3} />}
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
            <NavIcons name="fileText" className="h-3.5 w-3.5" />
            {label}
            <NavIcons name="chevronRight" className="h-3.5 w-3.5" />
        </Link>
    );
}

/* ── primitives ─────────────────────────────────────── */
function Card({ children, className = "" }) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}>
            {children}
        </div>
    );
}

function SectionHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-center justify-between border-b border-border/50 bg-base px-5 py-4">
            <div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs font-medium text-muted-foreground">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

/* ── stat card dengan trend indicator ───────────────── */
function StatCard({ label, value, sub, icon, accent = "bg-muted text-muted-foreground", trend }) {
    return (
        <Card className="hover:border-primary/30 transition-colors duration-300">
            <div className="p-5">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${accent}`}>{icon}</span>
                </div>
                <p className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
                <div className="mt-2 flex items-center gap-2">
                    {sub && <p className="text-xs font-medium text-muted-foreground">{sub}</p>}
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
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-6 shadow-sm">
            <div className="absolute -right-0 -bottom-0  text-primary/10 pointer-events-none">
                <NavIcons name="wallet" className="h-24 w-24" />
            </div>
            <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {GREETING[storeType] ?? "Penjualan Hari Ini"}
                    </p>
                    <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">
                        {fmt(todaySales)}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-muted-foreground">{fmtNum(todayCount)} transaksi</span>
                            <TrendBadge value={countTrend} />
                        </div>
                        <span className="text-border">|</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-muted-foreground">AOV {fmt(aov)}</span>
                            <TrendBadge value={aovTrend} />
                        </div>
                    </div>
                </div>
                <div className="shrink-0">
                    <TrendBadge value={salesTrend} suffix="%" />
                </div>
            </div>
        </div>
    );
}

/* ── hourly bar chart ───────────────────────────────── */
function HourlyChart({ data }) {
    if (!data?.length) {
        return (
            <div className="flex h-32 items-center justify-center px-5 pb-4 text-sm font-medium text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <NavIcons name="clock" className="h-6 w-6 text-muted-foreground/50" />
                    Belum ada transaksi hari ini
                </div>
            </div>
        );
    }
    const max = Math.max(...data.map((d) => d.total), 1);
    const hours = Array.from({ length: 24 }, (_, i) => {
        const found = data.find((d) => Number(d.hour) === i);
        return { hour: i, total: found ? Number(found.total) : 0, count: found ? Number(found.count) : 0 };
    });

    return (
        <div className="flex h-32 items-end gap-1 overflow-x-auto px-5 pb-3 pt-4">
            {hours.map((h) => {
                const pct = Math.max(h.total > 0 ? 4 : 0, Math.round((h.total / max) * 100));
                return (
                    <div key={h.hour} className="group relative flex flex-1 flex-col items-center" style={{ minWidth: "8px" }}>
                        <div
                            className={`w-full rounded-t-sm transition-all duration-300 ${h.total > 0 ? "bg-primary hover:bg-primary/80" : "bg-muted"}`}
                            style={{ height: `${pct}%` }}
                        />
                        {h.total > 0 && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-xl border border-border bg-card/95 backdrop-blur-sm px-4 py-3 text-xs shadow-xl group-hover:block animate-in fade-in zoom-in-95 duration-200">
                                <p className="font-bold text-foreground mb-1">{h.hour.toString().padStart(2, "0")}:00</p>
                                <p className="font-extrabold text-primary text-base leading-none">{fmt(h.total)}</p>
                                <p className="text-muted-foreground mt-1 font-medium">{h.count} transaksi</p>
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
    if (!data?.length) return (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <NavIcons name="clipboardList" className="h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">Belum ada transaksi terbaru</p>
        </div>
    );
    return (
        <div className="divide-y divide-border/50">
            {data.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-primary">{s.sale_no}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {s.user?.name ?? "—"} ·{" "}
                            {new Date(s.sale_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                    <div className="ml-4 text-right">
                        <p className="text-base font-bold text-foreground">{fmt(s.grand_total)}</p>
                        <span className={`inline-flex px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.payment_status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
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
    if (!data?.length) return (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <NavIcons name="package" className="h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium">Belum ada penjualan hari ini</p>
        </div>
    );
    const max = Math.max(...data.map((d) => d.revenue), 1);
    return (
        <div className="space-y-4 px-5 py-5">
            {data.map((p, i) => (
                <div key={i}>
                    <div className="mb-1.5 flex items-center justify-between">
                        <span className="truncate text-sm font-semibold text-foreground">{p.name}</span>
                        <span className="ml-2 text-xs font-bold text-muted-foreground">{fmtNum(p.qty)} pcs</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary"
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
            <div className="divide-y divide-border/50">
                {data.map((b) => (
                    <div key={b.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                            <NavIcons name="store" className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
                            <p className="text-xs font-medium text-muted-foreground">{b.today_count} transaksi hari ini</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{fmt(b.today_sales)}</p>
                            <p className="text-xs font-medium text-muted-foreground">{totalToday > 0 ? Math.round((b.today_sales / totalToday) * 100) : 0}% dari total</p>
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
            <div className="divide-y divide-border/50">
                {data.map((s) => {
                    const tm = allStoreTypes.find((t) => t.code === s.store_type) ?? {};
                    return (
                        <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <NavIcons name="store" className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-foreground">{s.name}</p>
                                <p className="text-xs font-medium text-muted-foreground mt-0.5">{tm.label ?? s.store_type} · {s.today_count} transaksi</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-foreground">{fmt(s.today_sales)}</p>
                                <p className="text-xs font-medium text-muted-foreground mt-0.5">Bulan: {fmt(s.month_sales)}</p>
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
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Penjualan per Cabang
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Halaman
                    </div>
                </div>
            }>
            <PageHeader
                title={isKasir ? "Dashboard Kasir" : "Dashboard"}
                breadcrumbs={isKasir ? ["Kasir", "Dashboard"] : ["Admin", "Beranda", "Dashboard"]}
                heading={
                    <>
                        {isKasir ? "Dashboard " : "Dashboard "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {storeLabel}
                        </span>
                    </>
                }
                description="Ringkasan aktivitas, penjualan, dan metrik penting hari ini."
            />

            <div className="space-y-5">
                {/* Shift banner (kasir) */}
                {isKasir &&
                    (!activeShift ? (
                        <div className="flex items-center justify-between rounded-2xl border border-warning/20 bg-gradient-to-r from-warning/10 to-card px-5 py-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 text-warning">
                                    <NavIcons name="clock" className="h-6 w-6" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-foreground">Belum Ada Shift Aktif</p>
                                    <p className="text-sm font-medium text-muted-foreground mt-0.5">Buka shift sebelum mulai transaksi.</p>
                                </div>
                            </div>
                            <Link
                                href={route("admin.cashier-shifts.create")}
                                className="inline-flex items-center gap-2 rounded-xl bg-warning px-5 py-2.5 text-sm font-bold text-warning-foreground shadow-md transition-all hover:bg-warning/90 hover:shadow-lg hover:shadow-warning/20 active:scale-[0.98]"
                            >
                                <NavIcons name="checkCircle" className="h-4 w-4" strokeWidth={2.5} />
                                Buka Shift Sekarang
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-gradient-to-r from-success/10 to-card px-5 py-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-success">
                                    <NavIcons name="checkCircle2" className="h-6 w-6" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-foreground">Shift Aktif: {activeShift.shift_no}</p>
                                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                                        Kas awal: <span className="text-foreground">{fmt(activeShift.opening_cash)}</span> <span className="mx-1.5">&bull;</span> Dibuka pada{" "}
                                        {new Date(activeShift.opened_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route("admin.cashier-shifts.show", activeShift.id)}
                                className="rounded-xl border border-success/30 bg-card px-4 py-2.5 text-sm font-bold text-success transition-all hover:bg-success/10 active:scale-[0.98]"
                            >
                                Lihat Detail Shift
                            </Link>
                        </div>
                    ))}

                {/* Branch filter (admin) */}
                {!isKasir && branches.length > 1 && (
                    <div className="flex items-center gap-2">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98]">
                                    <NavIcons name="filter" className="h-4 w-4" />
                                    Filter Cabang
                                    {pendingBranchIds.length > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                            {pendingBranchIds.length}
                                        </span>
                                    )}
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="left" width="64" contentClasses="p-3 bg-card border-border shadow-xl">
                                <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-3">
                                    <div className="px-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pilih Cabang</p>
                                    </div>
                                    <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                                        {branches.map((b) => {
                                            const isSelected = pendingBranchIds.includes(b.id);
                                            return (
                                                <label
                                                    key={b.id}
                                                    className={`flex cursor-pointer select-none items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${isSelected
                                                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                            : "border-border bg-card text-foreground hover:bg-muted"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => togglePending(b.id)}
                                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                                                    />
                                                    <span>{b.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            applyBranchFilter();
                                            // Biarkan tertutup alami bila dibutuhkan
                                        }}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
                                    >
                                        <NavIcons name="checkCircle" className="h-4 w-4" />
                                        Terapkan Filter
                                    </button>
                                </div>
                            </Dropdown.Content>
                        </Dropdown>

                        <div className="ml-auto">
                            <ReportBtn label="Buka Laporan" />
                        </div>
                    </div>
                )}

                {/* Report shortcut (single branch) */}
                {!isKasir && branches.length <= 1 && (
                    <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-card px-5 py-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                                <NavIcons name="barChart3" className="h-5 w-5" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">Laporan & Analitik</p>
                                <p className="text-xs font-medium text-muted-foreground mt-0.5">Lihat tren penjualan, laba, dan performa bisnis secara detail.</p>
                            </div>
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
                        icon={<NavIcons name="wallet" className="h-5 w-5" />}
                        accent="bg-success/10 text-emerald-600"
                        trend={stats.today_sales_trend}
                    />
                    <StatCard
                        label="Rata-rata per Transaksi"
                        value={fmt(stats.aov_today)}
                        sub="Avg Order Value"
                        icon={<NavIcons name="barChart3" className="h-5 w-5" />}
                        accent="bg-primary/10 text-primary"
                        trend={stats.aov_trend}
                    />
                    <StatCard
                        label="Laba Hari Ini"
                        value={fmt(stats.today_profit)}
                        sub="Revenue - Pembelian - Pengeluaran"
                        icon={<NavIcons name="banknote" className="h-5 w-5" />}
                        accent={stats.today_profit >= 0 ? "bg-success/10 text-emerald-600" : "bg-destructive/10 text-destructive"}
                        trend={stats.today_profit_trend}
                    />
                    <StatCard
                        label="Bulan Ini"
                        value={fmt(stats.month_sales)}
                        sub={`${fmtNum(stats.month_count)} transaksi`}
                        icon={<NavIcons name="trendingUp" className="h-5 w-5" />}
                        accent="bg-violet-500/10 text-violet-600"
                    />
                </div>

                {/* ── Stat Cards Row 2: Operasional ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {hasStock ? (
                        <StatCard
                            label="Stok Menipis"
                            value={`${fmtNum(stats.low_stock)} item`}
                            sub={stats.low_stock > 0 ? "Perlu segera restok" : "Stok aman"}
                            icon={stats.low_stock > 0 ? <NavIcons name="badgeAlert" className="h-5 w-5" /> : <NavIcons name="checkCircle" className="h-5 w-5" />}
                            accent={stats.low_stock > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-emerald-500"}
                        />
                    ) : (
                        <StatCard
                            label="Shift Hari Ini"
                            value={fmtNum(stats.today_shifts)}
                            sub={`${fmtNum(stats.open_shifts)} sedang buka`}
                            icon={<NavIcons name="clock" className="h-5 w-5" />}
                            accent="bg-warning/10 text-warning"
                        />
                    )}
                    <StatCard
                        label="Pembelian Hari Ini"
                        value={fmt(stats.today_purchases)}
                        sub="Dari supplier"
                        icon={<NavIcons name="shoppingCart" className="h-5 w-5" />}
                        accent="bg-primary/10 text-primary"
                    />
                    <StatCard
                        label="Pengeluaran Hari Ini"
                        value={fmt(stats.today_expenses)}
                        sub="Biaya operasional"
                        icon={<NavIcons name="creditCard" className="h-5 w-5" />}
                        accent="bg-warning/10 text-warning"
                    />
                    <StatCard
                        label={hasStock ? "Total Produk" : "Total Item/Layanan"}
                        value={fmtNum(stats.total_products)}
                        sub="Aktif"
                        icon={<NavIcons name="package" className="h-5 w-5" />}
                        accent="bg-violet-500/10 text-violet-600"
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
                            className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:scale-[0.98]"
                        >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                                {storeType === "fnb" ? <NavIcons name="utensils" className="h-7 w-7" /> : storeType === "service" ? <NavIcons name="scissors" className="h-7 w-7" /> : storeType === "rental" ? <NavIcons name="key" className="h-7 w-7" /> : storeType === "ticket" ? <NavIcons name="ticket" className="h-7 w-7" /> : storeType === "hospitality" ? <NavIcons name="bed" className="h-7 w-7" /> : storeType === "parking" ? <NavIcons name="car" className="h-7 w-7" /> : storeType === "session" ? <NavIcons name="gamepad2" className="h-7 w-7" /> : <NavIcons name="shoppingCart" className="h-7 w-7" />}
                            </span>
                            <span className="text-sm font-bold text-foreground">
                                {storeType === "fnb" ? "Buka Kasir" : storeType === "service" ? "Mulai Layanan" : storeType === "rental" ? "Buka Sewa" : storeType === "ticket" ? "Jual Tiket" : storeType === "parking" ? "Parkir Masuk" : storeType === "session" ? "Mulai Sesi" : "Buka Kasir"}
                            </span>
                        </Link>
                        <Link
                            href={route("admin.sales.index")}
                            className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:scale-[0.98]"
                        >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                                <NavIcons name="clipboardList" className="h-7 w-7" />
                            </span>
                            <span className="text-sm font-bold text-foreground">
                                {storeType === "rental" ? "Riwayat Sewa" : storeType === "service" ? "Riwayat Layanan" : "Riwayat Transaksi"}
                            </span>
                        </Link>
                        <Link
                            href={route("admin.customers.index")}
                            className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:scale-[0.98]"
                        >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                                <NavIcons name="users" className="h-7 w-7" />
                            </span>
                            <span className="text-sm font-bold text-foreground">
                                {storeType === "service" ? "Data Pelanggan" : "Pelanggan"}
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
