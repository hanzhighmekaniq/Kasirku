import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const STATUS_CONFIG = {
    completed: { label: 'Selesai',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    cancelled: { label: 'Dibatalkan', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.completed;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

export default function Index({ purchaseReturns }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return purchaseReturns.filter((r) => {
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (!q) return true;
            return (
                r.return_no?.toLowerCase().includes(q) ||
                r.supplier?.name?.toLowerCase().includes(q) ||
                r.purchase?.purchase_no?.toLowerCase().includes(q)
            );
        });
    }, [purchaseReturns, search, statusFilter]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setProcessing(true);
        router.delete(route('admin.purchase-returns.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setDeleteTarget(null); },
        });
    };

    const stats = useMemo(() => {
        const total = purchaseReturns.length;
        const completed = purchaseReturns.filter((r) => r.status === 'completed').length;
        const cancelled = purchaseReturns.filter((r) => r.status === 'cancelled').length;
        const totalValue = purchaseReturns.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
        return { total, completed, cancelled, totalValue };
    }, [purchaseReturns]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Retur Pembelian</h2>
                    <Link
                        href={route('admin.purchase-returns.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Buat Retur
                    </Link>
                </div>
            }
        >
            <Head title="Retur Pembelian" />

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    { label: 'Total Retur', value: stats.total, icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
                    { label: 'Dibatalkan', value: stats.cancelled, icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182' },
                    { label: 'Selesai', value: stats.completed, icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { label: 'Total Nilai', value: formatRupiah(stats.totalValue), icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                                <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                                <p className="text-lg font-bold text-slate-800">{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nomor retur, supplier, atau pembelian..."
                        className="block w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-8 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                    <option value="all">Semua Status</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                </select>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/60">
                            <tr>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">No. Retur</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Pembelian Asal</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Supplier</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Items</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                </svg>
                                            </div>
                                            <p className="mt-4 text-sm font-medium text-slate-600">Belum ada retur pembelian</p>
                                            <p className="mt-1 text-xs text-slate-400">Klik "Buat Retur" untuk membuat retur baru</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((retur) => (
                                    <tr key={retur.id} className="transition hover:bg-slate-50/50">
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <Link
                                                href={route('admin.purchase-returns.show', retur.id)}
                                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                                            >
                                                {retur.return_no}
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className="text-sm text-slate-600">{retur.purchase?.purchase_no || '-'}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className="text-sm text-slate-600">{retur.supplier?.name || '-'}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-center">
                                            <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">
                                                {retur.items_count}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800">
                                            {formatRupiah(retur.total_amount)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                                            {formatDate(retur.return_date)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-center">
                                            <StatusBadge status={retur.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    href={route('admin.purchase-returns.show', retur.id)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                                    title="Lihat Detail"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </Link>
                                                {retur.status !== 'completed' && (
                                                    <button
                                                        onClick={() => setDeleteTarget(retur)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                        title="Hapus"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
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
            <div className="space-y-3 md:hidden">
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-600">Belum ada retur pembelian</p>
                    </div>
                ) : (
                    filtered.map((retur) => (
                        <div key={retur.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <Link
                                        href={route('admin.purchase-returns.show', retur.id)}
                                        className="text-sm font-semibold text-indigo-600"
                                    >
                                        {retur.return_no}
                                    </Link>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Dari: {retur.purchase?.purchase_no || '-'}
                                    </p>
                                </div>
                                <StatusBadge status={retur.status} />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="text-slate-400">Supplier</p>
                                    <p className="font-medium text-slate-700">{retur.supplier?.name || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400">Total</p>
                                    <p className="font-semibold text-slate-800">{formatRupiah(retur.total_amount)}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-xs text-slate-400">{formatDate(retur.return_date)}</span>
                                <div className="flex items-center gap-1">
                                    <Link
                                        href={route('admin.purchase-returns.show', retur.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Detail
                                    </Link>
                                    {retur.status !== 'completed' && (
                                        <button
                                            onClick={() => setDeleteTarget(retur)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmDeleteModal
                open={!!deleteTarget}
                title={`Hapus retur ${deleteTarget?.return_no}?`}
                description="Data retur ini akan dihapus permanen."
                processing={processing}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
