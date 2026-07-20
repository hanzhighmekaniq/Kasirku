import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import DateRangeFilter from './components/DateRangeFilter';
import SummaryCards from './components/SummaryCards';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Expenses({ from, to, summary, dailyTrend = [], byCategory = [], expenses = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-slate-800">Laporan Pengeluaran</h2>}>
            <Head title="Laporan Pengeluaran" />
            {flash?.success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-between">
                <DateRangeFilter from={from} to={to} routeName="admin.reports.expenses" />
                <Link href={route('admin.reports.index')} className="text-sm font-medium text-primary-600 hover:underline">← Ringkasan</Link>
            </div>

            <SummaryCards items={[
                { label: 'Total Pengeluaran', value: summary?.total ?? 0, currency: true },
                { label: 'Jumlah Transaksi', value: summary?.count ?? 0 },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Trend Harian</h3>
                    {dailyTrend.length > 0 ? (
                        <div className="space-y-2">
                            {dailyTrend.map((d) => (
                                <div key={d.date} className="flex items-center gap-3">
                                    <span className="w-20 text-xs text-slate-500">{fmtDate(d.date)}</span>
                                    <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, (d.total / Math.max(...dailyTrend.map(x => x.total))) * 100)}%` }} />
                                    </div>
                                    <span className="w-24 text-right text-xs font-medium text-slate-700">{fmt(d.total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-slate-500">Belum ada data</p>}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Per Kategori</h3>
                    {byCategory.length > 0 ? byCategory.map((c, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <span className="text-sm text-slate-700">{c.name}</span>
                            <span className="text-sm font-medium text-slate-800">{fmt(c.total)}</span>
                        </div>
                    )) : <p className="text-sm text-slate-500">Belum ada data</p>}
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-800">Daftar Pengeluaran</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                            <th className="px-4 py-2.5">Tanggal</th>
                            <th className="px-4 py-2.5">Kategori</th>
                            <th className="px-4 py-2.5">Keterangan</th>
                            <th className="px-4 py-2.5 text-right">Jumlah</th>
                        </tr></thead>
                        <tbody>{expenses.length > 0 ? expenses.map((e) => (
                            <tr key={e.id} className="border-t border-slate-100">
                                <td className="px-4 py-2.5">{fmtDate(e.expense_date)}</td>
                                <td className="px-4 py-2.5">{e.expense_category?.name || '—'}</td>
                                <td className="px-4 py-2.5 text-slate-600">{e.description || '—'}</td>
                                <td className="px-4 py-2.5 text-right font-medium">{fmt(e.amount)}</td>
                            </tr>
                        )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Belum ada data</td></tr>}</tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
