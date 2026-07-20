import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ wastes, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = wastes.filter((w) => {
        if (statusFilter && w.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!w.waste_no?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleDelete = () => {
        if (!confirmDelete) return;
        setProcessing(true);
        router.delete(route('admin.wastes.destroy', confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmDelete(null); },
        });
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const categoryLabel = {
        tumpahan: 'Tumpahan',
        kedaluwarsa: 'Kedaluwarsa',
        rusak: 'Rusak',
        hilang: 'Hilang',
        lainnya: 'Lainnya',
    };

    const totalCost = filtered.filter(w => w.status === 'approved').reduce((sum, w) => {
        return sum + (w.items?.reduce((s, i) => s + Number(i.total_cost || 0), 0) || 0);
    }, 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.stock.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Kembali">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                        </Link>
                        <h2 className="text-lg font-semibold text-slate-800">Catat Waste</h2>
                    </div>
                    <Link href={route('admin.wastes.create')} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Catat Waste
                    </Link>
                </div>
            }
        >
            <Head title="Catat Waste" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard title="Total" value={stats.total} color="slate" />
                <StatCard title="Draft" value={stats.draft} color="amber" />
                <StatCard title="Disetujui" value={stats.approved} color="emerald" />
                <StatCard title="Ditolak" value={stats.rejected} color="red" />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari no. waste..." className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200">
                    <option value="">Semua Status</option>
                    <option value="draft">Draft</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th className="px-6 py-3.5 font-medium text-slate-500">No. Waste</th>
                                <th className="px-6 py-3.5 font-medium text-slate-500">Tanggal</th>
                                <th className="px-6 py-3.5 font-medium text-slate-500">Oleh</th>
                                <th className="px-6 py-3.5 font-medium text-slate-500">Total Item</th>
                                <th className="px-6 py-3.5 font-medium text-slate-500">Total Kerugian</th>
                                <th className="px-6 py-3.5 text-center font-medium text-slate-500">Status</th>
                                <th className="px-6 py-3.5 text-right font-medium text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">Tidak ada data waste.</td></tr>
                            ) : (
                                filtered.map((w) => {
                                    const itemTotal = w.items?.reduce((s, i) => s + Number(i.total_cost || 0), 0) || 0;
                                    return (
                                        <tr key={w.id} className="transition hover:bg-slate-50/50">
                                            <td className="px-6 py-3.5">
                                                <Link href={route('admin.wastes.show', w.id)} className="font-semibold text-primary-600 hover:text-primary-800">{w.waste_no}</Link>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{fmtDate(w.waste_date)}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{w.user?.name ?? '-'}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{w.items?.length ?? 0} item</td>
                                            <td className="px-6 py-3.5 font-medium text-red-600">{w.status === 'approved' ? fmtCurrency(itemTotal) : '-'}</td>
                                            <td className="px-6 py-3.5 text-center"><StatusBadge status={w.status} /></td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('admin.wastes.show', w.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" title="Lihat Detail">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </Link>
                                                    {w.status === 'draft' && (
                                                        <button onClick={() => setConfirmDelete(w)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Hapus">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirm delete modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => !processing && setConfirmDelete(null)}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900">Hapus Waste?</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Waste <strong>{confirmDelete.waste_no}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setConfirmDelete(null)} disabled={processing} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Batal</button>
                            <button onClick={handleDelete} disabled={processing} className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/30 transition hover:from-red-600 hover:to-red-700 disabled:opacity-60">
                                {processing ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, color }) {
    const colors = { slate: 'border-slate-200 bg-white', amber: 'border-amber-200 bg-amber-50', emerald: 'border-emerald-200 bg-emerald-50', red: 'border-red-200 bg-red-50' };
    const textColors = { slate: 'text-slate-800', amber: 'text-amber-700', emerald: 'text-emerald-700', red: 'text-red-700' };
    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${colors[color]}`}>
            <p className="text-sm text-slate-500">{title}</p>
            <p className={`mt-1 text-2xl font-bold ${textColors[color]}`}>{value}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-slate-100 text-slate-600', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600' };
    const label = { draft: 'Draft', approved: 'Disetujui', rejected: 'Ditolak' };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{label[status] ?? status}</span>;
}
