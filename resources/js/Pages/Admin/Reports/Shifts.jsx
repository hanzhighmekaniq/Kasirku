import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import DateRangeFilter from './components/DateRangeFilter';
import SummaryCards from './components/SummaryCards';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function Shifts({ from, to, summary, byCashier = [], shifts = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-slate-800">Laporan Shift</h2>}>
            <Head title="Laporan Shift" />
            {flash?.success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-between">
                <DateRangeFilter from={from} to={to} routeName="admin.reports.shifts" />
                <Link href={route('admin.reports.index')} className="text-sm font-medium text-primary-600 hover:underline">← Ringkasan</Link>
            </div>

            <SummaryCards items={[
                { label: 'Total Shift', value: summary?.total_shifts ?? 0 },
                { label: 'Total Kas Awal', value: summary?.total_opening ?? 0, currency: true },
                { label: 'Total Kas Akhir', value: summary?.total_closing ?? 0, currency: true },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-800">Daftar Shift</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                                <th className="px-4 py-2.5">Tanggal</th>
                                <th className="px-4 py-2.5">Kasir</th>
                                <th className="px-4 py-2.5">Cabang</th>
                                <th className="px-4 py-2.5">Buka</th>
                                <th className="px-4 py-2.5">Tutup</th>
                                <th className="px-4 py-2.5 text-right">Kas Awal</th>
                                <th className="px-4 py-2.5 text-right">Kas Akhir</th>
                            </tr></thead>
                            <tbody>{shifts.length > 0 ? shifts.map((s) => (
                                <tr key={s.id} className="border-t border-slate-100">
                                    <td className="px-4 py-2.5">{fmtDate(s.opened_at)}</td>
                                    <td className="px-4 py-2.5 font-medium text-slate-800">{s.user_name}</td>
                                    <td className="px-4 py-2.5 text-slate-600">{s.branch_name}</td>
                                    <td className="px-4 py-2.5">{fmtTime(s.opened_at)}</td>
                                    <td className="px-4 py-2.5">{fmtTime(s.closed_at)}</td>
                                    <td className="px-4 py-2.5 text-right">{fmt(s.opening_cash)}</td>
                                    <td className="px-4 py-2.5 text-right font-medium">{fmt(s.closing_cash)}</td>
                                </tr>
                            )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Belum ada data</td></tr>}</tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Per Kasir</h3>
                    {byCashier.length > 0 ? byCashier.map((c, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <div>
                                <span className="text-sm font-medium text-slate-800">{c.name}</span>
                                <span className="ml-2 text-xs text-slate-500">{c.count} shift</span>
                            </div>
                            <span className="text-sm font-medium text-slate-800">{fmt(c.total_opening)}</span>
                        </div>
                    )) : <p className="text-sm text-slate-500">Belum ada data</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
