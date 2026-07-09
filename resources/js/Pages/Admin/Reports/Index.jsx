import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState, useMemo } from "react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const CHART_COLORS = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#14b8a6",
];

export default function Index({
    from,
    to,
    branches = [],
    branchIds = [],
    summary,
    dailyBreakdown = [],
    topProducts = [],
    paymentBreakdown = [],
    categoryBreakdown = [],
}) {
    const { flash } = usePage().props;

    // ── Filters ──────────────────────────────────
    const [startDate, setStartDate] = useState(from ?? "");
    const [endDate, setEndDate] = useState(to ?? "");
    const [pendingBranchIds, setPendingBranchIds] = useState(
        branchIds.length > 0
            ? branchIds.map(Number)
            : branches.map((b) => b.id),
    );

    const toggleBranch = (id) => {
        setPendingBranchIds((prev) =>
            prev.includes(id)
                ? prev.filter((bid) => bid !== id)
                : [...prev, id],
        );
    };

    const hasBranchFilter = useMemo(
        () => pendingBranchIds.length < branches.length,
        [pendingBranchIds, branches],
    );

    const applyFilters = () => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (hasBranchFilter) params.branch_ids = pendingBranchIds;
        router.get(route("admin.reports.index"), params, {
            preserveState: false,
            replace: true,
        });
    };

    // ── Chart data ────────────────────────────────
    const maxDaily = Math.max(...dailyBreakdown.map((d) => d.total), 1);

    // ── Quick date presets ─────────────────────────
    const presets = [
        {
            label: "Hari Ini",
            start: new Date().toISOString().slice(0, 10),
            end: new Date().toISOString().slice(0, 10),
        },
        {
            label: "7 Hari",
            start: new Date(Date.now() - 6 * 86400000)
                .toISOString()
                .slice(0, 10),
            end: new Date().toISOString().slice(0, 10),
        },
        {
            label: "30 Hari",
            start: new Date(Date.now() - 29 * 86400000)
                .toISOString()
                .slice(0, 10),
            end: new Date().toISOString().slice(0, 10),
        },
        {
            label: "Bulan Ini",
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                .toISOString()
                .slice(0, 10),
            end: new Date().toISOString().slice(0, 10),
        },
    ];

    const applyPreset = (preset) => {
        setStartDate(preset.start);
        setEndDate(preset.end);
        // Auto-apply after a tick
        setTimeout(() => {
            const params = { start_date: preset.start, end_date: preset.end };
            if (hasBranchFilter) params.branch_ids = pendingBranchIds;
            router.get(route("admin.reports.index"), params, {
                preserveState: false,
                replace: true,
            });
        }, 50);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3 w-full">
                    <h2 className="text-lg font-bold text-slate-900">
                        Laporan
                    </h2>
                </div>
            }
        >
            <Head title="Laporan" />

            <div className="space-y-5">
                {/* ── Filters ──────────────────────────────── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
                        {/* Quick presets */}
                        <div className="flex items-center gap-1.5">
                            {presets.map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => applyPreset(p)}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Dari
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                            <span className="mt-5 text-slate-400">—</span>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Sampai
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                            <button
                                onClick={applyFilters}
                                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                    />
                                </svg>
                                Tampilkan
                            </button>
                        </div>
                    </div>

                    {/* Branch filter */}
                    {branches.length > 1 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                            <span className="text-xs text-slate-400 mr-1">
                                Cabang:
                            </span>
                            {branches.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => toggleBranch(b.id)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                        pendingBranchIds.includes(b.id)
                                            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={pendingBranchIds.includes(
                                            b.id,
                                        )}
                                        onChange={() => toggleBranch(b.id)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {b.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Summary Cards ────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <SummaryCard
                        label="Total Penjualan"
                        value={fmt(summary.total_sales)}
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        }
                        color="emerald"
                    />
                    <SummaryCard
                        label="Pembelian"
                        value={fmt(summary.total_purchases)}
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                            />
                        }
                        color="indigo"
                    />
                    <SummaryCard
                        label="Pengeluaran"
                        value={fmt(summary.total_expenses)}
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
                            />
                        }
                        color="amber"
                    />
                    <SummaryCard
                        label="Laba/Rugi"
                        value={fmt(summary.profit)}
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                            />
                        }
                        color={summary.profit >= 0 ? "emerald" : "red"}
                        highlight
                    />
                    <SummaryCard
                        label="Transaksi"
                        value={summary.total_transactions}
                        icon={
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                            />
                        }
                        color="violet"
                    />
                </div>

                {/* ── Daily Chart ─────────────────────────── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-700">
                        Tren Penjualan Harian
                    </h3>
                    {dailyBreakdown.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">
                            Belum ada data penjualan di rentang ini.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="flex items-end gap-1.5 h-52 min-w-[500px]">
                                {dailyBreakdown.map((d, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-1 flex-col items-center justify-end gap-1"
                                    >
                                        <span className="text-[10px] font-medium text-slate-500">
                                            {fmt(d.total)
                                                .replace("Rp", "")
                                                .trim()}
                                        </span>
                                        <div
                                            className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all hover:from-indigo-600 hover:to-indigo-500"
                                            style={{
                                                height: `${(d.total / maxDaily) * 100}%`,
                                                minHeight:
                                                    d.total > 0 ? "8px" : "0",
                                            }}
                                            title={`${fmtDate(d.date)}: ${fmt(d.total)} (${d.count} transaksi)`}
                                        />
                                        <span className="mt-1 text-[10px] text-slate-400 whitespace-nowrap">
                                            {new Date(
                                                d.date,
                                            ).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Bottom grid ─────────────────────────── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Top Products */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
                            <h3 className="text-sm font-semibold text-slate-700">
                                Produk Terlaris
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-2.5">Produk</th>
                                        <th className="px-5 py-2.5 text-right">
                                            Qty
                                        </th>
                                        <th className="px-5 py-2.5 text-right">
                                            Pendapatan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {topProducts.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-5 py-8 text-center text-sm text-slate-400"
                                            >
                                                Belum ada data.
                                            </td>
                                        </tr>
                                    ) : (
                                        topProducts.map((p, i) => (
                                            <tr
                                                key={i}
                                                className="transition hover:bg-slate-50/50"
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                                                            {i + 1}
                                                        </span>
                                                        <span className="font-medium text-slate-800">
                                                            {p.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-600">
                                                    {p.qty}
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-slate-800">
                                                    {fmt(p.revenue)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment & Category side by side */}
                    <div className="space-y-5">
                        {/* Payment Breakdown */}
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Metode Pembayaran
                                </h3>
                            </div>
                            <div className="p-4">
                                {paymentBreakdown.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-slate-400">
                                        Belum ada data.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {paymentBreakdown.map((p, i) => {
                                            const total =
                                                paymentBreakdown.reduce(
                                                    (s, x) =>
                                                        s + Number(x.total),
                                                    0,
                                                );
                                            const pct =
                                                total > 0
                                                    ? (Number(p.total) /
                                                          total) *
                                                      100
                                                    : 0;
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div
                                                        className="h-2.5 rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.max(pct, 3)}%`,
                                                            backgroundColor:
                                                                CHART_COLORS[
                                                                    i %
                                                                        CHART_COLORS.length
                                                                ],
                                                        }}
                                                    />
                                                    <span className="text-xs text-slate-500 whitespace-nowrap min-w-[100px]">
                                                        {p.name}
                                                    </span>
                                                    <span className="ml-auto text-xs font-semibold text-slate-700">
                                                        {fmt(p.total)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Per Kategori
                                </h3>
                            </div>
                            <div className="p-4">
                                {categoryBreakdown.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-slate-400">
                                        Belum ada data.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {categoryBreakdown.map((c, i) => {
                                            const total =
                                                categoryBreakdown.reduce(
                                                    (s, x) =>
                                                        s + Number(x.revenue),
                                                    0,
                                                );
                                            const pct =
                                                total > 0
                                                    ? (Number(c.revenue) /
                                                          total) *
                                                      100
                                                    : 0;
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div
                                                        className="h-2.5 rounded-full"
                                                        style={{
                                                            width: `${Math.max(pct, 3)}%`,
                                                            backgroundColor:
                                                                CHART_COLORS[
                                                                    (i + 2) %
                                                                        CHART_COLORS.length
                                                                ],
                                                        }}
                                                    />
                                                    <span className="text-xs text-slate-500 whitespace-nowrap min-w-[100px]">
                                                        {c.name}
                                                    </span>
                                                    <span className="ml-auto text-xs font-semibold text-slate-700">
                                                        {fmt(c.revenue)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    color = "emerald",
    highlight = false,
}) {
    const borderMap = {
        emerald: "border-emerald-200",
        indigo: "border-indigo-200",
        amber: "border-amber-200",
        red: "border-red-200",
        violet: "border-violet-200",
    };
    const bgMap = {
        emerald: "bg-emerald-50",
        indigo: "bg-indigo-50",
        amber: "bg-amber-50",
        red: "bg-red-50",
        violet: "bg-violet-50",
    };
    const textMap = {
        emerald: "text-emerald-600",
        indigo: "text-indigo-600",
        amber: "text-amber-600",
        red: "text-red-600",
        violet: "text-violet-600",
    };

    return (
        <div
            className={`rounded-2xl border ${highlight ? `border-${color}-300 ${bgMap[color]}` : "border-slate-200 bg-white"} p-4 shadow-sm`}
        >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <svg
                    className={`h-5 w-5 ${textMap[color]}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                >
                    {icon}
                </svg>
            </div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p
                className={`mt-1 text-xl font-bold ${highlight ? textMap[color] : "text-slate-800"}`}
            >
                {value}
            </p>
        </div>
    );
}
