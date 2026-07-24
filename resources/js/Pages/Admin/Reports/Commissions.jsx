import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import ReportTabs from "@/Components/ReportTabs";
import { Head, Link, usePage } from '@inertiajs/react';
import DateRangeFilter from './components/DateRangeFilter';
import SummaryCards from './components/SummaryCards';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700' },
    approved: { label: 'Disetujui', color: 'bg-success/10 text-success' },
    paid: { label: 'Dibayar', color: 'bg-sky-50 text-sky-700' },
};

export default function Commissions({ from, to, summary, byEmployee = [], commissions = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Laporan
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Komisi
                    </div>
                </div>
            }>
            <PageHeader
                title="Laporan Komisi"
                breadcrumbs={["Admin", "Laporan", "Komisi"]}
                heading={
                    <>
                        Laporan{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Komisi Karyawan
                        </span>
                    </>
                }
                description="Analisis komisi karyawan berdasarkan penjualan atau performa."
            />

            <ReportTabs />

            {flash?.success && <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-between">
                <DateRangeFilter from={from} to={to} routeName="admin.reports.commissions" />
            </div>

            <SummaryCards items={[
                { label: 'Total Komisi', value: summary?.total ?? 0, currency: true },
                { label: 'Pending', value: summary?.pending ?? 0, currency: true },
                { label: 'Disetujui', value: summary?.approved ?? 0, currency: true },
                { label: 'Jumlah', value: summary?.count ?? 0 },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-foreground">Daftar Komisi</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                                <th className="px-4 py-2.5">Tanggal</th>
                                <th className="px-4 py-2.5">Karyawan</th>
                                <th className="px-4 py-2.5">Tipe</th>
                                <th className="px-4 py-2.5 text-right">Jumlah</th>
                                <th className="px-4 py-2.5">Status</th>
                            </tr></thead>
                            <tbody>{commissions.length > 0 ? commissions.map((c) => {
                                const meta = STATUS_META[c.status] || STATUS_META.pending;
                                return (
                                    <tr key={c.id} className="border-t border-border">
                                        <td className="px-4 py-2.5">{fmtDate(c.commission_date)}</td>
                                        <td className="px-4 py-2.5 font-medium text-foreground">{c.employee_name}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{c.type || '—'}</td>
                                        <td className="px-4 py-2.5 text-right font-medium">{fmt(c.amount)}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                                        </td>
                                    </tr>
                                );
                            }) : <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada data</td></tr>}</tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Per Karyawan</h3>
                    {byEmployee.length > 0 ? byEmployee.map((e, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <div>
                                <span className="text-sm font-medium text-foreground">{e.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{e.count} item</span>
                            </div>
                            <span className="text-sm font-medium text-foreground">{fmt(e.total)}</span>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">Belum ada data</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
