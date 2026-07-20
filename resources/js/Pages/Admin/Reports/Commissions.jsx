import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import DateRangeFilter from './components/DateRangeFilter';
import SummaryCards from './components/SummaryCards';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700' },
    approved: { label: 'Disetujui', color: 'bg-emerald-50 text-emerald-700' },
    paid: { label: 'Dibayar', color: 'bg-sky-50 text-sky-700' },
};

export default function Commissions({ from, to, summary, byEmployee = [], commissions = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout header={<h2 className="text-lg font-semibold text-slate-800">Laporan Komisi</h2>}>
            <Head title="Laporan Komisi" />
            {flash?.success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}

            <div className="mb-5 flex items-center justify-between">
                <DateRangeFilter from={from} to={to} routeName="admin.reports.commissions" />
                <Link href={route('admin.reports.index')} className="text-sm font-medium text-primary-600 hover:underline">← Ringkasan</Link>
            </div>

            <SummaryCards items={[
                { label: 'Total Komisi', value: summary?.total ?? 0, currency: true },
                { label: 'Pending', value: summary?.pending ?? 0, currency: true },
                { label: 'Disetujui', value: summary?.approved ?? 0, currency: true },
                { label: 'Jumlah', value: summary?.count ?? 0 },
            ]} />

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-800">Daftar Komisi</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                                <th className="px-4 py-2.5">Tanggal</th>
                                <th className="px-4 py-2.5">Karyawan</th>
                                <th className="px-4 py-2.5">Tipe</th>
                                <th className="px-4 py-2.5 text-right">Jumlah</th>
                                <th className="px-4 py-2.5">Status</th>
                            </tr></thead>
                            <tbody>{commissions.length > 0 ? commissions.map((c) => {
                                const meta = STATUS_META[c.status] || STATUS_META.pending;
                                return (
                                    <tr key={c.id} className="border-t border-slate-100">
                                        <td className="px-4 py-2.5">{fmtDate(c.commission_date)}</td>
                                        <td className="px-4 py-2.5 font-medium text-slate-800">{c.employee_name}</td>
                                        <td className="px-4 py-2.5 text-slate-600">{c.type || '—'}</td>
                                        <td className="px-4 py-2.5 text-right font-medium">{fmt(c.amount)}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                                        </td>
                                    </tr>
                                );
                            }) : <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Belum ada data</td></tr>}</tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">Per Karyawan</h3>
                    {byEmployee.length > 0 ? byEmployee.map((e, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                            <div>
                                <span className="text-sm font-medium text-slate-800">{e.name}</span>
                                <span className="ml-2 text-xs text-slate-500">{e.count} item</span>
                            </div>
                            <span className="text-sm font-medium text-slate-800">{fmt(e.total)}</span>
                        </div>
                    )) : <p className="text-sm text-slate-500">Belum ada data</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
