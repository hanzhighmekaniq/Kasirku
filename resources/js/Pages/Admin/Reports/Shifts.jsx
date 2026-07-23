import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import ReportTabs from "@/Components/ReportTabs";
import { Head, Link, usePage } from '@inertiajs/react';
import DateRangeFilter from './components/DateRangeFilter';
import SummaryCards from './components/SummaryCards';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function Shifts({ from, to, summary, byCashier = [], shifts = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout>
            <PageHeader
                title="Laporan Shift"
                breadcrumbs={["Admin", "Laporan", "Shift"]}
                heading={
                    <>
                        Laporan{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Shift Kasir
                        </span>
                    </>
                }
                description="Analisis riwayat pembukaan dan penutupan kas, serta rekonsiliasi dana kasir."
            />

            <ReportTabs />

            {flash?.success && <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-between">
                <DateRangeFilter from={from} to={to} routeName="admin.reports.shifts" />
            </div>

            <SummaryCards items={[
                { label: 'Total Shift', value: summary?.total_shifts ?? 0 },
                { label: 'Total Kas Awal', value: summary?.total_opening ?? 0, currency: true },
                { label: 'Total Kas Akhir', value: summary?.total_closing ?? 0, currency: true },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-foreground">Daftar Shift</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                                <th className="px-4 py-2.5">Tanggal</th>
                                <th className="px-4 py-2.5">Kasir</th>
                                <th className="px-4 py-2.5">Cabang</th>
                                <th className="px-4 py-2.5">Buka</th>
                                <th className="px-4 py-2.5">Tutup</th>
                                <th className="px-4 py-2.5 text-right">Kas Awal</th>
                                <th className="px-4 py-2.5 text-right">Kas Akhir</th>
                            </tr></thead>
                            <tbody>{shifts.length > 0 ? shifts.map((s) => (
                                <tr key={s.id} className="border-t border-border">
                                    <td className="px-4 py-2.5">{fmtDate(s.opened_at)}</td>
                                    <td className="px-4 py-2.5 font-medium text-foreground">{s.user_name}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground">{s.branch_name}</td>
                                    <td className="px-4 py-2.5">{fmtTime(s.opened_at)}</td>
                                    <td className="px-4 py-2.5">{fmtTime(s.closed_at)}</td>
                                    <td className="px-4 py-2.5 text-right">{fmt(s.opening_cash)}</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{fmt(s.closing_cash)}</td>
                                </tr>
                            )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Belum ada data</td></tr>}</tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Per Kasir</h3>
                    {byCashier.length > 0 ? byCashier.map((c, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <div>
                                <span className="text-sm font-medium text-foreground">{c.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{c.count} shift</span>
                            </div>
                            <span className="text-sm font-medium text-foreground">{fmt(c.total_opening)}</span>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">Belum ada data</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
