import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Eye, Plus, Search, Trash2 } from 'lucide-react';
import Select from '@/Components/ui/Select';

const STATUS_OPTS = [
    { value: '', label: 'Semua Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
];

export default function Index({ adjustments, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = adjustments.filter((a) => {
        if (statusFilter && a.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!a.adjustment_no?.toLowerCase().includes(q) && !a.reason?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleDelete = () => {
        if (!confirmDelete) return;
        setProcessing(true);
        router.delete(route('admin.stock-adjustments.destroy', confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmDelete(null); },
        });
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('admin.stock.index')}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Kembali"
                        >
                            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                        </Link>
                        <h2 className="text-lg font-semibold text-slate-800">Penyesuaian Stok</h2>
                    </div>
                    <Link
                        href={route('admin.stock-adjustments.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">Buat Penyesuaian</span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title="Penyesuaian Stok" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Draft</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.draft}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Disetujui</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.approved}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-red-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Ditolak</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.rejected}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari no. penyesuaian / alasan..."
                                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                            />
                        </div>
                        <Select
                            options={STATUS_OPTS}
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v)}
                            placeholder="Semua Status"
                            className="min-w-[160px]"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan{' '}
                            <span className="font-semibold text-slate-700">{filtered.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-slate-700">{adjustments.length}</span>{' '}
                            penyesuaian
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/60">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">No. Penyesuaian</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Alasan</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Oleh</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                                    </svg>
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-slate-600">
                                                    {search || statusFilter ? 'Penyesuaian tidak ditemukan' : 'Belum ada penyesuaian stok'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {search || statusFilter ? 'Coba ubah filter atau kata kunci' : 'Buat penyesuaian baru untuk mengkoreksi stok'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((a) => (
                                        <tr key={a.id} className="transition hover:bg-slate-50/50">
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <Link
                                                    href={route('admin.stock-adjustments.show', a.id)}
                                                    className="text-sm font-semibold text-primary-600 hover:text-primary-800"
                                                >
                                                    {a.adjustment_no}
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{fmtDate(a.adjustment_date)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{a.reason || '—'}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{a.user?.name ?? '—'}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <StatusBadge status={a.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route('admin.stock-adjustments.show', a.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-primary-50 hover:text-primary-600"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                                                    </Link>
                                                    {a.status === 'draft' && (
                                                        <button
                                                            onClick={() => setConfirmDelete(a)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-3 p-3 md:hidden">
                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-600">
                                {search || statusFilter ? 'Penyesuaian tidak ditemukan' : 'Belum ada penyesuaian stok'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                {search || statusFilter ? 'Coba ubah filter atau kata kunci' : 'Buat penyesuaian baru untuk mengkoreksi stok'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((a) => (
                            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={route('admin.stock-adjustments.show', a.id)}
                                            className="text-sm font-semibold text-primary-600 hover:text-primary-800"
                                        >
                                            {a.adjustment_no}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-slate-400">{fmtDate(a.adjustment_date)}</p>
                                    </div>
                                    <StatusBadge status={a.status} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-400">Alasan</p>
                                        <p className="mt-0.5 text-slate-700">{a.reason || '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400">Oleh</p>
                                        <p className="mt-0.5 text-slate-700">{a.user?.name ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                                    <Link
                                        href={route('admin.stock-adjustments.show', a.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                                    >
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Lihat
                                    </Link>
                                    {a.status === 'draft' && (
                                        <button
                                            onClick={() => setConfirmDelete(a)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Confirm delete modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => !processing && setConfirmDelete(null)}>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-600" strokeWidth={1.8} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-slate-900">Hapus Penyesuaian?</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Penyesuaian <strong>{confirmDelete.adjustment_no}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button onClick={() => setConfirmDelete(null)} disabled={processing} className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">Batal</button>
                            <button onClick={handleDelete} disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60">
                                {processing ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-slate-100 text-slate-600', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600' };
    const label = { draft: 'Draft', approved: 'Disetujui', rejected: 'Ditolak' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
            {label[status] ?? status}
        </span>
    );
}
