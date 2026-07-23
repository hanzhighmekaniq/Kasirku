import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import ReportTabs from "@/Components/ReportTabs";
import { Head, Link, usePage } from '@inertiajs/react';
import DateRangeFilter from './components/DateRangeFilter';
import SummaryCards from './components/SummaryCards';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Expenses({ from, to, summary, dailyTrend = [], byCategory = [], expenses = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout>
            <PageHeader
                title="Laporan Pengeluaran"
                breadcrumbs={["Admin", "Laporan", "Pengeluaran"]}
                heading={
                    <>
                        Laporan{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pengeluaran
                        </span>
                    </>
                }
                description="Analisis pengeluaran operasional toko dan ringkasan biaya."
            />

            <ReportTabs />

            {flash?.success && <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-between">
                <DateRangeFilter from={from} to={to} routeName="admin.reports.expenses" />
            </div>

            <SummaryCards items={[
                { label: 'Total Pengeluaran', value: summary?.total ?? 0, currency: true },
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
                                        <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, (d.total / Math.max(...dailyTrend.map(x => x.total))) * 100)}%` }} />
                                    </div>
                                    <span className="w-24 text-right text-xs font-medium text-foreground">{fmt(d.total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground">Belum ada data</p>}
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Per Kategori</h3>
                    {byCategory.length > 0 ? byCategory.map((c, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <span className="text-sm text-foreground">{c.name}</span>
                            <span className="text-sm font-medium text-foreground">{fmt(c.total)}</span>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">Belum ada data</p>}
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Daftar Pengeluaran</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                            <th className="px-4 py-2.5">Tanggal</th>
                            <th className="px-4 py-2.5">Kategori</th>
                            <th className="px-4 py-2.5">Keterangan</th>
                            <th className="px-4 py-2.5 text-right">Jumlah</th>
                        </tr></thead>
                        <tbody>{expenses.length > 0 ? expenses.map((e) => (
                            <tr key={e.id} className="border-t border-border">
                                <td className="px-4 py-2.5">{fmtDate(e.expense_date)}</td>
                                <td className="px-4 py-2.5">{e.expense_category?.name || '—'}</td>
                                <td className="px-4 py-2.5 text-muted-foreground">{e.description || '—'}</td>
                                <td className="px-4 py-2.5 text-right font-medium">{fmt(e.amount)}</td>
                            </tr>
                        )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Belum ada data</td></tr>}</tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
