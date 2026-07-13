import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChevronDown, Eye, Plus, Trash2 } from 'lucide-react';
import Dropdown from '@/Components/Dropdown';
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
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Retur Pembelian</h2>
                    <Link
                        href={route('admin.purchase-returns.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">Buat Retur</span>
                        <span className="sm:hidden">Retur</span>
                    </Link>
                </div>
            }
        >
            <Head title="Retur Pembelian" />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total Retur</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-rose-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Dibatalkan</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.cancelled}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Selesai</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.completed}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total Nilai</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{formatRupiah(stats.totalValue)}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nomor retur, supplier, atau pembelian..."
                                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition hover:bg-slate-50">
                                    <span className={statusFilter !== "all" ? "text-slate-700" : "text-slate-400"}>
                                        {statusFilter === "completed" ? "Selesai" : statusFilter === "cancelled" ? "Dibatalkan" : "Semua Status"}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content width="48">
                                <button onClick={() => setStatusFilter("all")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${statusFilter === "all" ? "bg-indigo-50 font-medium text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>Semua Status</button>
                                <button onClick={() => setStatusFilter("completed")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${statusFilter === "completed" ? "bg-indigo-50 font-medium text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>Selesai</button>
                                <button onClick={() => setStatusFilter("cancelled")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${statusFilter === "cancelled" ? "bg-indigo-50 font-medium text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>Dibatalkan</button>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan{" "}
                            <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
                            dari{" "}
                            <span className="font-semibold text-slate-700">{purchaseReturns.length}</span>{" "}
                            retur
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
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
                                                    <Eye className="h-4 w-4" strokeWidth={1.8} />
                                                </Link>
                                                {retur.status !== 'completed' && (
                                                    <button
                                                        onClick={() => setDeleteTarget(retur)}
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
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Detail
                                    </Link>
                                    {retur.status !== 'completed' && (
                                        <button
                                            onClick={() => setDeleteTarget(retur)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
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
