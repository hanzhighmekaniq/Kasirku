import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AIChatWidget from '@/Components/AIChatWidget';

/* ── helpers ──────────────────────────────────────────── */
const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtNum = (n) => new Intl.NumberFormat('id-ID').format(n ?? 0);

function pct(part, total) {
    if (!total) return 0;
    return Math.min(100, Math.round((part / total) * 100));
}

/* ── tiny reusable primitives ─────────────────────────── */
function Card({ children, className = '' }) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
            {children}
        </div>
    );
}

function SectionHeader({ title, subtitle }) {
    return (
        <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
    );
}

function Badge({ children, variant = 'default' }) {
    const styles = {
        success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
        default: 'bg-slate-50 text-slate-600 ring-slate-500/10',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${styles[variant]}`}>
            {children}
        </span>
    );
}

function EmptyState({ text }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200/60">
                <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            </div>
            <p className="text-sm text-slate-400">{text}</p>
        </div>
    );
}

/* ── summary stat card ───────────────────────────────── */
function StatCard({ label, value, sub }) {
    return (
        <Card>
            <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900">{value}</p>
                {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
            </div>
        </Card>
    );
}

function DateFilter({ filters, onApply }) {
    const [start, setStart] = useState(filters.start_date);
    const [end, setEnd] = useState(filters.end_date);

    const presets = [
        { label: 'Hari ini', start: () => today(), end: () => today() },
        { label: '7 hari', start: () => daysAgo(6), end: () => today() },
        { label: 'Bulan ini', start: () => monthStart(), end: () => today() },
        { label: 'Bulan lalu', start: () => lastMonthStart(), end: () => lastMonthEnd() },
    ];

    function today() { return new Date().toISOString().slice(0, 10); }
    function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
    function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
    function lastMonthStart() { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); }
    function lastMonthEnd() { const d = new Date(); d.setDate(0); return d.toISOString().slice(0, 10); }

    const handlePreset = (p) => {
        const s = p.start(); const e = p.end();
        setStart(s); setEnd(e);
        onApply(s, e);
    };

    return (
        <Card>
            <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex flex-wrap gap-1.5">
                    {presets.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => handlePreset(p)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                        <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border-0 bg-transparent p-0 text-sm text-slate-600 focus:ring-0 [color-scheme:light]" />
                        <span className="text-slate-300">—</span>
                        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border-0 bg-transparent p-0 text-sm text-slate-600 focus:ring-0 [color-scheme:light]" />
                    </div>
                    <button
                        onClick={() => onApply(start, end)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-slate-950"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        Terapkan
                    </button>
                </div>
            </div>
        </Card>
    );
}

/* ── daily trend bar chart ───────────────────────────── */
function DailyTrend({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada data transaksi pada periode ini." />;
    const max = Math.max(...data.map((d) => d.total), 1);

    return (
        <div className="flex h-40 items-end gap-px overflow-x-auto px-5 pb-3 pt-4">
            {data.map((d) => {
                const h = Math.max(4, pct(d.total, max));
                return (
                    <div key={d.date} className="group relative flex min-w-0 flex-1 flex-col items-center" style={{ minWidth: '6px' }}>
                        <div
                            className="w-full rounded-t bg-slate-900 transition-all duration-200 group-hover:bg-indigo-500"
                            style={{ height: `${h}%` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg group-hover:block">
                            <p className="font-semibold text-slate-800">{d.date}</p>
                            <p className="text-slate-600">{fmt(d.total)}</p>
                            <p className="text-slate-400">{fmtNum(d.count)} transaksi</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── horizontal bar chart ────────────────────────────── */
function HBarChart({ data, valueKey = 'total', labelKey = 'name', formatValue = fmt }) {
    if (!data?.length) return <EmptyState text="Tidak ada data pada periode ini." />;
    const max = Math.max(...data.map((d) => d[valueKey]), 1);

    return (
        <div className="space-y-3 px-5 py-4">
            {data.map((item, i) => (
                <div key={i}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="max-w-[60%] truncate text-sm text-slate-600">{item[labelKey]}</span>
                        <span className="text-xs font-semibold text-slate-800">{formatValue(item[valueKey])}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-slate-900 transition-all duration-500"
                            style={{ width: `${pct(item[valueKey], max)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── top products table ──────────────────────────────── */
function TopProductsTable({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada data produk pada periode ini." />;
    const maxRev = Math.max(...data.map((p) => p.total_revenue), 1);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3">#</th>
                        <th className="px-5 py-3">Produk</th>
                        <th className="px-5 py-3 text-right">Terjual</th>
                        <th className="px-5 py-3 text-right">Pendapatan</th>
                        <th className="px-5 py-3 text-right">Profit</th>
                        <th className="px-5 py-3 w-24">Porsi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                    {data.map((p, i) => (
                        <tr key={p.id} className="transition hover:bg-slate-50/50">
                            <td className="px-5 py-3 text-slate-300 font-medium text-xs">{i + 1}</td>
                            <td className="px-5 py-3">
                                <p className="font-medium text-slate-800">{p.name}</p>
                                {p.sku && <p className="text-[11px] text-slate-400 mt-0.5">{p.sku}</p>}
                            </td>
                            <td className="px-5 py-3 text-right text-slate-600 font-medium">{fmtNum(p.total_qty)}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(p.total_revenue)}</td>
                            <td className="px-5 py-3 text-right">
                                <span className={`font-semibold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {fmt(p.profit)}
                                </span>
                            </td>
                            <td className="px-5 py-3">
                                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-slate-900"
                                        style={{ width: `${pct(p.total_revenue, maxRev)}%` }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── recent transactions tables ──────────────────────── */
function RecentSalesTable({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada transaksi penjualan pada periode ini." />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3">No. Transaksi</th>
                        <th className="px-5 py-3">Kasir</th>
                        <th className="px-5 py-3">Tanggal</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                    {data.map((s) => (
                        <tr key={s.id} className="transition hover:bg-slate-50/50">
                            <td className="px-5 py-3 font-mono text-xs text-slate-700 font-medium">{s.sale_no}</td>
                            <td className="px-5 py-3 text-slate-600">{s.user?.name ?? '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{new Date(s.sale_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(s.grand_total)}</td>
                            <td className="px-5 py-3 text-center">
                                <Badge variant={s.payment_status === 'paid' ? 'success' : 'default'}>
                                    {s.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RecentPurchasesTable({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada pembelian pada periode ini." />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3">No. Pembelian</th>
                        <th className="px-5 py-3">Supplier</th>
                        <th className="px-5 py-3">Tanggal</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                    {data.map((p) => (
                        <tr key={p.id} className="transition hover:bg-slate-50/50">
                            <td className="px-5 py-3 font-mono text-xs text-slate-700 font-medium">{p.purchase_no}</td>
                            <td className="px-5 py-3 text-slate-600">{p.supplier?.name ?? '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{new Date(p.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(p.grand_total)}</td>
                            <td className="px-5 py-3 text-center">
                                <Badge variant={p.payment_status === 'paid' ? 'success' : 'default'}>
                                    {p.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── payment breakdown ───────────────────────────────── */
function PaymentBreakdown({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada data pembayaran pada periode ini." />;
    const total = data.reduce((s, d) => s + Number(d.total), 0);

    return (
        <div className="space-y-3 px-5 py-4">
            {data.map((item, i) => {
                const share = pct(item.total, total);
                return (
                    <div key={item.name} className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                            {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="truncate text-sm text-slate-600">{item.name}</span>
                                <span className="ml-2 text-xs font-semibold text-slate-800">{share}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-slate-900 transition-all duration-500"
                                    style={{ width: `${share}%` }}
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">{fmt(item.total)} · {fmtNum(item.count)} transaksi</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── tabs ────────────────────────────────────────────── */
function Tabs({ tabs, active, onChange }) {
    return (
        <div className="flex border-b border-slate-100">
            {tabs.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onChange(t.id)}
                    className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                        active === t.id
                            ? 'text-slate-900'
                            : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {t.label}
                    {active === t.id && (
                        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-slate-900" />
                    )}
                </button>
            ))}
        </div>
    );
}

/* ── cash flow mini bar chart (paired bars) ────────── */
function CashFlowChart({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada data arus kas pada periode ini." />;
    const maxVal = Math.max(...data.flatMap((d) => [d.inflow, d.outflow]), 1);

    return (
        <div className="flex h-40 items-end gap-1 px-5 pb-3 pt-2 overflow-x-auto">
            {data.map((d) => {
                const inflowH = Math.max(3, pct(d.inflow, maxVal));
                const outflowH = Math.max(3, pct(d.outflow, maxVal));
                return (
                    <div key={d.date} className="group relative flex min-w-0 flex-1 flex-col items-center gap-px" style={{ minWidth: '8px' }}>
                        <div
                            className="w-full rounded-t bg-emerald-400 transition-all duration-200 group-hover:brightness-110"
                            style={{ height: `${inflowH}%` }}
                        />
                        <div
                            className="w-full rounded-t bg-red-400 transition-all duration-200 group-hover:brightness-110"
                            style={{ height: `${outflowH}%` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg group-hover:block">
                            <p className="font-semibold text-slate-800">{d.date}</p>
                            <p className="text-emerald-600">Masuk: {fmt(d.inflow)}</p>
                            <p className="text-red-500">Keluar: {fmt(d.outflow)}</p>
                            <p className={`font-semibold ${d.inflow - d.outflow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                Selisih: {fmt(d.inflow - d.outflow)}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── inventory value table ──────────────────────────── */
function InventoryTable({ items, totalValue }) {
    if (!items?.length) return <EmptyState text="Tidak ada data stok." />;
    const maxVal = Math.max(...items.map((i) => i.total_value), 1);

    return (
        <div className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Total Nilai Stok</span>
                <span className="text-lg font-bold text-slate-900">{fmt(totalValue)}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            <th className="pb-2">Produk</th>
                            <th className="pb-2 text-right">Stok</th>
                            <th className="pb-2 text-right">Tersedia</th>
                            <th className="pb-2 text-right">Nilai</th>
                            <th className="pb-2 w-24">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                        {items.map((item) => (
                            <tr key={item.id} className="transition hover:bg-slate-50/50">
                                <td className="py-2.5 pr-4">
                                    <p className="font-medium text-slate-800">{item.name}</p>
                                    {item.sku && <p className="text-[11px] text-slate-400">{item.sku}</p>}
                                </td>
                                <td className="py-2.5 text-right text-slate-600">
                                    {fmtNum(item.stock_qty)}
                                    {item.reserved_qty > 0 && (
                                        <span className="ml-1 text-[11px] text-amber-500">(-{item.reserved_qty})</span>
                                    )}
                                </td>
                                <td className="py-2.5 text-right font-medium text-slate-700">{fmtNum(item.available_qty)}</td>
                                <td className="py-2.5 text-right font-semibold text-slate-800">{fmt(item.total_value)}</td>
                                <td className="py-2.5">
                                    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct(item.total_value, maxVal)}%` }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── low stock table ────────────────────────────────── */
function LowStockTable({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada produk dengan stok menipis." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3">Produk</th>
                        <th className="px-5 py-3 text-right">Stok</th>
                        <th className="px-5 py-3 text-right">Tersedia</th>
                        <th className="px-5 py-3 text-right">Minimal</th>
                        <th className="px-5 py-3 w-28">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                    {data.map((p) => {
                        const ratio = p.available_qty / p.stock_minimum;
                        const urgent = ratio <= 0.5;
                        const warning = ratio <= 1;
                        return (
                            <tr key={p.id} className="transition hover:bg-slate-50/50">
                                <td className="px-5 py-3">
                                    <p className="font-medium text-slate-800">{p.name}</p>
                                    {p.sku && <p className="text-[11px] text-slate-400">{p.sku}</p>}
                                </td>
                                <td className="px-5 py-3 text-right text-slate-600">{fmtNum(p.stock_qty)}</td>
                                <td className="px-5 py-3 text-right font-semibold">
                                    <span className={urgent ? 'text-red-600' : warning ? 'text-amber-600' : 'text-slate-700'}>
                                        {fmtNum(p.available_qty)}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right text-slate-500">{fmtNum(p.stock_minimum)}</td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                                        urgent
                                            ? 'bg-red-50 text-red-700 ring-red-600/10'
                                            : 'bg-amber-50 text-amber-700 ring-amber-600/10'
                                    }`}>
                                        {urgent ? 'Kritis' : 'Menipis'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ── top customers table ────────────────────────────── */
function TopCustomersTable({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada data pelanggan pada periode ini." />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3">#</th>
                        <th className="px-5 py-3">Pelanggan</th>
                        <th className="px-5 py-3 text-center">Tier</th>
                        <th className="px-5 py-3 text-right">Transaksi</th>
                        <th className="px-5 py-3 text-right">Total Belanja</th>
                        <th className="px-5 py-3 text-right">Terakhir</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                    {data.map((c, i) => (
                        <tr key={c.id} className="transition hover:bg-slate-50/50">
                            <td className="px-5 py-3 text-xs font-medium text-slate-300">{i + 1}</td>
                            <td className="px-5 py-3">
                                <p className="font-medium text-slate-800">{c.name}</p>
                                {c.phone && <p className="text-[11px] text-slate-400">{c.phone}</p>}
                            </td>
                            <td className="px-5 py-3 text-center">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-600/10 capitalize">
                                    {c.tier ?? 'regular'}
                                </span>
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-slate-700">{fmtNum(c.transaction_count)}</td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(c.total_spent)}</td>
                            <td className="px-5 py-3 text-right text-slate-500 text-[11px]">
                                {c.last_visit ? new Date(c.last_visit).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── expiring batches table ─────────────────────────── */
function ExpiringBatchesTable({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada batch yang akan kadaluarsa dalam 30 hari." />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3">Produk</th>
                        <th className="px-5 py-3">Batch</th>
                        <th className="px-5 py-3 text-right">Sisa Stok</th>
                        <th className="px-5 py-3 text-right">Nilai</th>
                        <th className="px-5 py-3 text-center">Kadaluarsa</th>
                        <th className="px-5 py-3 w-24">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                    {data.map((b) => {
                        const urgent = b.days_left <= 7;
                        return (
                            <tr key={b.id} className="transition hover:bg-slate-50/50">
                                <td className="px-5 py-3">
                                    <p className="font-medium text-slate-800">{b.product_name}</p>
                                    {b.sku && <p className="text-[11px] text-slate-400">{b.sku}</p>}
                                </td>
                                <td className="px-5 py-3 font-mono text-xs text-slate-500">{b.batch_no}</td>
                                <td className="px-5 py-3 text-right text-slate-600">{fmtNum(b.quantity)}</td>
                                <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(b.total_value)}</td>
                                <td className="px-5 py-3 text-center text-slate-600 text-[11px]">
                                    {new Date(b.expiry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                                        urgent
                                            ? 'bg-red-50 text-red-700 ring-red-600/10'
                                            : 'bg-amber-50 text-amber-700 ring-amber-600/10'
                                    }`}>
                                        {urgent ? `${b.days_left} hari` : `${b.days_left} hari`}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ── waste section ──────────────────────────────────── */
function WasteSection({ total, byCategory, topProducts }) {
    if (!byCategory?.length && !topProducts?.length) return <EmptyState text="Tidak ada data waste pada periode ini." />;
    const catTotal = byCategory.reduce((s, c) => s + Number(c.total), 0);
    return (
        <div className="px-5 py-4">
            {/* Total card */}
            <div className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                <span className="text-sm text-rose-700">Total Nilai Waste</span>
                <span className="text-lg font-bold text-rose-700">{fmt(total)}</span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
                {/* By category */}
                {byCategory?.length > 0 && (
                    <div>
                        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Per Kategori</h4>
                        <div className="space-y-2.5">
                            {byCategory.map((c) => {
                                const share = pct(c.total, catTotal);
                                return (
                                    <div key={c.waste_category}>
                                        <div className="mb-0.5 flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-600 capitalize">{c.waste_category}</span>
                                            <span className="text-xs text-slate-500">{fmt(c.total)} · {fmtNum(c.qty)} qty</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full rounded-full bg-rose-400" style={{ width: `${share}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {/* Top waste products */}
                {topProducts?.length > 0 && (
                    <div>
                        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Produk Terbuang</h4>
                        <div className="space-y-2">
                            {topProducts.map((p) => (
                                <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-700">{p.name}</p>
                                        <p className="text-[11px] text-slate-400">{fmtNum(p.total_qty)} {p.sku && `· ${p.sku}`}</p>
                                    </div>
                                    <span className="ml-2 text-xs font-semibold text-rose-600">{fmt(p.total_cost)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── supplier performance table ────────────────────── */
function SupplierPerformanceTable({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada data supplier pada periode ini." />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3">Supplier</th>
                        <th className="px-5 py-3 text-right">Pembelian</th>
                        <th className="px-5 py-3 text-right">Total Belanja</th>
                        <th className="px-5 py-3 text-right">Retur</th>
                        <th className="px-5 py-3 text-right">Net</th>
                        <th className="px-5 py-3 w-24">Retur Rate</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                    {data.map((s) => {
                        const returRate = s.total_purchases > 0 ? pct(Number(s.total_returns), Number(s.total_purchases)) : 0;
                        return (
                            <tr key={s.id} className="transition hover:bg-slate-50/50">
                                <td className="px-5 py-3">
                                    <p className="font-medium text-slate-800">{s.name}</p>
                                    {s.code && <p className="text-[11px] text-slate-400">{s.code}</p>}
                                </td>
                                <td className="px-5 py-3 text-right font-medium text-slate-700">{fmtNum(s.purchase_count)}</td>
                                <td className="px-5 py-3 text-right text-slate-600">{fmt(s.total_purchases)}</td>
                                <td className="px-5 py-3 text-right text-rose-600">{fmt(s.total_returns)}</td>
                                <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(s.net_spent)}</td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                                        returRate > 10
                                            ? 'bg-rose-50 text-rose-700 ring-rose-600/10'
                                            : 'bg-slate-50 text-slate-600 ring-slate-500/10'
                                    }`}>
                                        {returRate}%
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ── promotion effectiveness table ──────────────────── */
function PromotionEffectivenessTable({ data }) {
    if (!data?.length) return <EmptyState text="Tidak ada data promosi pada periode ini." />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3">Promosi</th>
                        <th className="px-5 py-3 text-center">Tipe</th>
                        <th className="px-5 py-3 text-right">Digunakan</th>
                        <th className="px-5 py-3 text-right">Item Terjual</th>
                        <th className="px-5 py-3 text-right">Total Diskon</th>
                        <th className="px-5 py-3 text-right">Gross Revenue</th>
                        <th className="px-5 py-3 w-24">Diskon %</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                    {data.map((p) => {
                        const discPct = p.gross_revenue > 0 ? pct(Number(p.total_discount), Number(p.gross_revenue)) : 0;
                        return (
                            <tr key={p.id} className="transition hover:bg-slate-50/50">
                                <td className="px-5 py-3">
                                    <p className="font-medium text-slate-800">{p.name}</p>
                                    <p className="text-[11px] font-mono text-slate-400">{p.code}</p>
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10 capitalize">
                                        {p.type}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right font-medium text-slate-700">{fmtNum(p.use_count)}</td>
                                <td className="px-5 py-3 text-right text-slate-600">{fmtNum(p.items_count)}</td>
                                <td className="px-5 py-3 text-right font-semibold text-rose-600">{fmt(p.total_discount)}</td>
                                <td className="px-5 py-3 text-right text-slate-600">{fmt(p.gross_revenue)}</td>
                                <td className="px-5 py-3">
                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/10">
                                        {discPct}%
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ── main page ───────────────────────────────────────── */
export default function Index({
    summary,
    dailySales,
    topProducts,
    salesByPayment,
    salesByCategory,
    expensesByCategory,
    recentSales,
    recentPurchases,
    cashFlow,
    inventoryItems,
    totalInventoryValue,
    lowStockProducts,
    topCustomers,
    expiringBatches,
    wasteTotal,
    wasteByCategory,
    topWasteProducts,
    supplierPerformance,
    promotionEffectiveness,
    filters,
    branches = [],
    storeType = 'retail',
    canViewAll = false,
}) {
    const [activeTab, setActiveTab] = useState('sales');

    // Flags dari storeType
    const hasStock    = ['retail', 'fnb', 'rental'].includes(storeType);
    const hasSupplier = ['retail', 'fnb', 'rental'].includes(storeType);
    const hasWaste    = storeType === 'fnb';
    const hasCashFlow = ['retail', 'fnb', 'service', 'rental'].includes(storeType);

    // Label disesuaikan per store type
    const PAGE_TITLE = {
        retail:      'Laporan Keuangan',
        fnb:         'Laporan Keuangan',
        service:     'Laporan Jasa',
        rental:      'Laporan Sewa',
        ticket:      'Laporan Tiket',
        hospitality: 'Laporan Penginapan',
        parking:     'Laporan Parkir',
        session:     'Laporan Sesi',
    };
    const PRODUCT_LABEL = {
        retail:      'Top 10 Produk',
        fnb:         'Top 10 Menu',
        service:     'Top 10 Layanan',
        rental:      'Top 10 Item Sewa',
        ticket:      'Top 10 Tiket',
        hospitality: 'Top 10 Kamar / Paket',
        parking:     'Top 10 Tarif',
        session:     'Top 10 Paket Sesi',
    };

    // Local pending state — baru dikirim saat Terapkan diklik
    const [pendingBranchIds, setPendingBranchIds] = useState(
        // Default: semua cabang tercentang
        (filters.branch_ids ?? []).length > 0
            ? (filters.branch_ids ?? []).map(Number)
            : branches.map((b) => b.id)
    );

    const togglePending = (branchId) => {
        setPendingBranchIds((prev) =>
            prev.includes(branchId)
                ? prev.filter((id) => id !== branchId)
                : [...prev, branchId]
        );
    };

    const applyFilters = (start, end) => {
        const params = { start_date: start, end_date: end };
        // Kirim branch_ids hanya jika tidak semua dipilih
        if (pendingBranchIds.length < branches.length) {
            params.branch_ids = pendingBranchIds;
        }
        router.get(route('admin.reports.index'), params, { preserveScroll: true, preserveState: false });
    };

    const applyBranchFilter = () => {
        applyFilters(filters.start_date, filters.end_date);
    };

    const statCards = [
        { label: 'Penjualan', value: fmt(summary.total_sales), sub: `${fmtNum(summary.sales_count)} transaksi` },
        ...(hasSupplier ? [{ label: 'Pembelian', value: fmt(summary.total_purchases), sub: `${fmtNum(summary.purchase_count)} pembelian` }] : []),
        { label: 'Pengeluaran', value: fmt(summary.total_expenses), sub: 'Operasional & lainnya' },
        { label: 'Laba Bersih', value: fmt(summary.net_profit), sub: `Kotor: ${fmt(summary.gross_profit)}` },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3 w-full">
                    <h2 className="text-lg font-bold text-slate-900">{PAGE_TITLE[storeType] ?? 'Laporan Keuangan'}</h2>
                    <span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 sm:inline">
                        {new Date(filters.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' — '}
                        {new Date(filters.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            }
        >
            <Head title="Laporan" />

            <div className="space-y-5">
                {/* Date filter */}
                <DateFilter filters={filters} onApply={(s, e) => applyFilters(s, e)} />

                {/* Branch checkboxes (hanya user dengan akses penuh, >1 branch) */}
                {canViewAll && branches.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">Cabang:</span>
                        {branches.map((b) => (
                            <label
                                key={b.id}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition select-none ${
                                    pendingBranchIds.includes(b.id)
                                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={pendingBranchIds.includes(b.id)}
                                    onChange={() => togglePending(b.id)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                {b.name}
                            </label>
                        ))}
                        <button
                            onClick={applyBranchFilter}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Terapkan
                        </button>
                    </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {statCards.map((s) => <StatCard key={s.label} {...s} />)}
                </div>

                {/* Profit breakdown — hanya store type yang punya COGS & purchase */}
                {hasSupplier && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'HPP (COGS)', value: fmt(summary.cogs) },
                        { label: 'Laba Kotor', value: fmt(summary.gross_profit), positive: summary.gross_profit >= 0 },
                        { label: 'Retur Jual', value: fmt(summary.total_sale_returns), negative: true },
                        { label: 'Retur Beli', value: fmt(summary.total_purchase_returns), positive: true },
                    ].map((item) => (
                        <Card key={item.label}>
                            <div className="p-4">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{item.label}</p>
                                <p className={`mt-1.5 truncate text-lg font-bold ${
                                    item.positive ? 'text-emerald-600'
                                    : item.negative ? 'text-red-500'
                                    : 'text-slate-800'
                                }`}>{item.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>
                )}

                {/* Trend + Payment */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <SectionHeader title="Tren Penjualan Harian" subtitle="Total penjualan per hari" />
                        <DailyTrend data={dailySales} />
                        {dailySales?.length > 0 && (
                            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 text-[11px] text-slate-400">
                                <span>{dailySales[0]?.date}</span>
                                <span>{dailySales[dailySales.length - 1]?.date}</span>
                            </div>
                        )}
                    </Card>
                    <Card>
                        <SectionHeader title="Metode Pembayaran" subtitle="Distribusi berdasarkan nilai" />
                        <PaymentBreakdown data={salesByPayment} />
                    </Card>
                </div>

                {/* Category + Expenses */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Card>
                        <SectionHeader title="Penjualan per Kategori" subtitle="Pendapatan berdasarkan kategori" />
                        <HBarChart data={salesByCategory} labelKey="category" valueKey="total" />
                    </Card>
                    <Card>
                        <SectionHeader title="Pengeluaran per Kategori" subtitle="Rincian biaya operasional" />
                        <HBarChart data={expensesByCategory} labelKey="category" valueKey="total" />
                    </Card>
                </div>

                {/* Top products */}
                <Card>
                    <SectionHeader title={PRODUCT_LABEL[storeType] ?? 'Top 10 Produk'} subtitle="Pendapatan tertinggi pada periode ini" />
                    <TopProductsTable data={topProducts} />
                </Card>

                {/* Cash Flow — hanya retail, fnb, service, rental */}
                {hasCashFlow && (
                <Card>
                    <SectionHeader title="Arus Kas Harian" subtitle="Pemasukan (penjualan) vs Pengeluaran (pembelian + biaya)" />
                    <div className="flex items-center gap-4 px-5 pt-3 pb-1 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-600">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                            Pemasukan
                        </span>
                        <span className="flex items-center gap-1.5 text-red-500">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" />
                            Pengeluaran
                        </span>
                    </div>
                    <CashFlowChart data={cashFlow} />
                    {cashFlow?.length > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 text-[11px] text-slate-400">
                            <span>{cashFlow[0]?.date}</span>
                            <span>{cashFlow[cashFlow.length - 1]?.date}</span>
                        </div>
                    )}
                </Card>
                )}

                {/* Top Customers */}
                <Card>
                    <SectionHeader title="Top Pelanggan" subtitle="10 pelanggan dengan total belanja tertinggi" />
                    <TopCustomersTable data={topCustomers} />
                </Card>

                {/* Inventory Value — hanya retail, fnb, rental */}
                {hasStock && (
                <Card>
                    <SectionHeader title="Nilai Stok" subtitle="20 produk dengan nilai stok tertinggi" />
                    <InventoryTable items={inventoryItems} totalValue={totalInventoryValue} />
                </Card>
                )}

                {/* Expiring Batches — hanya retail, fnb, rental */}
                {hasStock && (
                <Card>
                    <SectionHeader title="Stok Akan Kadaluarsa" subtitle="Batch yang kadaluarsa dalam 30 hari ke depan" />
                    <ExpiringBatchesTable data={expiringBatches} />
                </Card>
                )}

                {/* Low Stock Warning — hanya retail, fnb, rental */}
                {hasStock && (
                <Card>
                    <SectionHeader title="Stok Menipis" subtitle="Produk yang stoknya mendekati atau di bawah batas minimum" />
                    <LowStockTable data={lowStockProducts} />
                </Card>
                )}

                {/* Waste — hanya fnb */}
                {hasWaste && (
                <Card>
                    <SectionHeader title="Waste / Produk Terbuang" subtitle="Kerugian akibat produk rusak, kadaluarsa, atau terbuang" />
                    <WasteSection total={wasteTotal} byCategory={wasteByCategory} topProducts={topWasteProducts} />
                </Card>
                )}

                {/* Supplier Performance — hanya retail, fnb, rental */}
                {hasSupplier && (
                <Card>
                    <SectionHeader title="Kinerja Supplier" subtitle="10 supplier dengan total pembelian tertinggi" />
                    <SupplierPerformanceTable data={supplierPerformance} />
                </Card>
                )}

                {/* Promotion Effectiveness */}
                <Card>
                    <SectionHeader title="Efektivitas Promosi" subtitle="Ringkasan penggunaan dan diskon promosi" />
                    <PromotionEffectivenessTable data={promotionEffectiveness} />
                </Card>

                {/* Recent transactions */}
                <Card>
                    <SectionHeader title="Transaksi Terbaru" subtitle="5 transaksi terakhir" />
                    {hasSupplier ? (
                        <>
                            <Tabs
                                tabs={[
                                    { id: 'sales', label: 'Penjualan' },
                                    { id: 'purchases', label: 'Pembelian' },
                                ]}
                                active={activeTab}
                                onChange={setActiveTab}
                            />
                            {activeTab === 'sales' ? (
                                <RecentSalesTable data={recentSales} />
                            ) : (
                                <RecentPurchasesTable data={recentPurchases} />
                            )}
                        </>
                    ) : (
                        <RecentSalesTable data={recentSales} />
                    )}
                </Card>
            </div>

            <AIChatWidget filters={filters} />
        </AuthenticatedLayout>
    );
}
