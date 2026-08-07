import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import ReportTabs from "@/Components/ReportTabs";
import ExportButton from './components/ExportButton';
import { Head } from '@inertiajs/react';
import DateRangeFilter from './components/DateRangeFilter';
import SummaryCards from './components/SummaryCards';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function SaleReturns({ from, to, summary = {}, returns = [], byReason = [] }) {

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Laporan
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Retur Penjualan
                    </div>
                </div>
            }>
            <Head title="Laporan Retur Penjualan" />

            <PageHeader
                title="Laporan Retur Penjualan"
                breadcrumbs={["Admin", "Laporan", "Retur"]}
                heading={
                    <>
                        Laporan{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Retur Penjualan
                        </span>
                    </>
                }
                description="Analisis retur barang, total nilai retur, dan alasan retur."
            />

            <ReportTabs />

            <div className="mb-5 flex items-center justify-between">
                <DateRangeFilter from={from} to={to} routeName="admin.reports.sale-returns" />
                <ExportButton routeName="admin.reports.export.sale-returns" from={from} to={to} />
            </div>

            <SummaryCards items={[
                { label: 'Total Retur', value: summary.total_returned ?? 0, currency: true },
                { label: 'Jumlah Retur', value: summary.return_count ?? 0 },
                { label: 'Total Penjualan', value: summary.total_sales ?? 0, currency: true },
                { label: 'Tingkat Retur', value: `${summary.return_rate ?? 0}%` },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Alasan Retur</h3>
                    {byReason.length > 0 ? (
                        <div className="space-y-3">
                            {byReason.map((r, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-40 text-sm text-foreground truncate">{r.reason}</span>
                                    <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, (r.total / Math.max(...byReason.map(x => x.total))) * 100)}%` }} />
                                    </div>
                                    <span className="w-24 text-right text-xs font-medium text-foreground">{r.count}x</span>
                                    <span className="w-24 text-right text-xs font-medium text-foreground">{fmt(r.total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground">Belum ada data retur</p>}
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Ringkasan</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-border pb-2">
                            <span className="text-sm text-muted-foreground">Total Penjualan</span>
                            <span className="text-sm font-medium text-foreground">{fmt(summary.total_sales ?? 0)}</span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                            <span className="text-sm text-muted-foreground">Total Retur</span>
                            <span className="text-sm font-medium text-orange-500">{fmt(summary.total_returned ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tingkat Retur</span>
                            <span className={`text-sm font-medium ${(summary.return_rate ?? 0) > 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {summary.return_rate ?? 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Daftar Retur</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground"><tr>
                            <th className="px-4 py-2.5 text-left font-semibold">No. Retur</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Tanggal</th>
                            <th className="px-4 py-2.5 text-left font-semibold">No. Penjualan</th>
                            <th className="px-4 py-2.5 text-left font-semibold">PIC</th>
                            <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                            <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border bg-background">{returns.length > 0 ? returns.map((r) => (
                            <tr key={r.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                <td className="px-4 py-2.5 font-medium">{r.return_no}</td>
                                <td className="px-4 py-2.5">{fmtDate(r.return_date)}</td>
                                <td className="px-4 py-2.5">{r.sale?.sale_no || '—'}</td>
                                <td className="px-4 py-2.5">{r.user?.name || '—'}</td>
                                <td className="px-4 py-2.5 text-right font-medium">{fmt(r.total_amount)}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        r.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}>{r.status}</span>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada data retur</td></tr>}</tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
