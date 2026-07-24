import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import ReportTabs from "@/Components/ReportTabs";
import { Head, Link, usePage } from '@inertiajs/react';
import DateRangeFilter from './components/DateRangeFilter';
import SummaryCards from './components/SummaryCards';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Purchases({ from, to, summary, dailyTrend = [], bySupplier = [], purchases = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Laporan
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Pembelian
                    </div>
                </div>
            }>
            <PageHeader
                title="Laporan Pembelian"
                breadcrumbs={["Admin", "Laporan", "Pembelian"]}
                heading={
                    <>
                        Laporan{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pembelian
                        </span>
                    </>
                }
                description="Analisis performa pembelian, pengeluaran ke supplier, dan ringkasan transaksi."
            />

            <ReportTabs />

            {flash?.success && <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-between">
                <DateRangeFilter from={from} to={to} routeName="admin.reports.purchases" />
            </div>

            <SummaryCards items={[
                { label: 'Total Pembelian', value: summary?.total ?? 0, currency: true },
                { label: 'Jumlah Transaksi', value: summary?.count ?? 0 },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Trend Harian</h3>
                    {dailyTrend.length > 0 ? (
                        <div className="space-y-2">
                            {dailyTrend.map((d) => (
                                <div key={d.date} className="flex items-center gap-3">
                                    <span className="w-20 text-xs text-muted-foreground">{fmtDate(d.date)}</span>
                                    <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, (d.total / Math.max(...dailyTrend.map(x => x.total))) * 100)}%` }} />
                                    </div>
                                    <span className="w-24 text-right text-xs font-medium text-foreground">{fmt(d.total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground">Belum ada data</p>}
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Per Supplier</h3>
                    {bySupplier.length > 0 ? bySupplier.map((s, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <span className="text-sm text-foreground">{s.name}</span>
                            <span className="text-sm font-medium text-foreground">{fmt(s.total)}</span>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">Belum ada data</p>}
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Daftar Pembelian</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                            <th className="px-4 py-2.5">Tanggal</th>
                            <th className="px-4 py-2.5">Supplier</th>
                            <th className="px-4 py-2.5 text-right">Total</th>
                        </tr></thead>
                        <tbody>{purchases.length > 0 ? purchases.map((p) => (
                            <tr key={p.id} className="border-t border-border">
                                <td className="px-4 py-2.5">{fmtDate(p.purchase_date)}</td>
                                <td className="px-4 py-2.5">{p.supplier?.name || '—'}</td>
                                <td className="px-4 py-2.5 text-right font-medium">{fmt(p.grand_total)}</td>
                            </tr>
                        )) : <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Belum ada data</td></tr>}</tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
