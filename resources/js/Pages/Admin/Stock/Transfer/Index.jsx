import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import StockTabs from "@/Components/StockTabs";
import Button from "@/Components/ui/Button";
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Eye, Plus, Search, Trash2 } from 'lucide-react';
import Select from '@/Components/ui/Select';

const STATUS_OPTS = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_transit', label: 'Dalam Perjalanan' },
    { value: 'received', label: 'Diterima' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

export default function Index({ transfers, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = transfers.filter((t) => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!t.transfer_no?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleDelete = () => {
        if (!confirmDelete) return;
        setProcessing(true);
        router.delete(route('admin.stock-transfers.destroy', confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmDelete(null); },
        });
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Stok
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Transfer Stok
                    </div>
                </div>
            }>
            <PageHeader
                title="Transfer Stok"
                breadcrumbs={["Admin", "Stok", "Transfer Stok"]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Transfer Stok
                        </span>
                    </>
                }
                description="Pindahkan stok antar cabang dengan mudah."
                action={
                    <Button
                        as={Link}
                        href={route('admin.stock-transfers.create')}
                        icon={Plus}
                    >
                        <span className="hidden sm:inline">Transfer Stok</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                }
            />

            <StockTabs />

            <Head title="Transfer Stok" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-2xl border border-border border-l-4 border-l-slate-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-amber-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Pending</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-sky-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Dalam Perjalanan</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.in_transit}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-emerald-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Diterima</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.received}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-red-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Dibatalkan</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.cancelled}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari no. transfer..."
                                className="block w-full rounded-xl border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground shadow-sm transition outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <Select
                            options={STATUS_OPTS}
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v)}
                            placeholder="Semua Status"
                            className="min-w-[160px]"
                        />
                    
                        <Button
                            as={Link}
                            href={route('admin.stock-transfers.create')}
                            icon={Plus}
                            className="w-full justify-center sm:w-auto"
                        >
                            <span className="hidden sm:inline">Buat Transfer</span>
                            <span className="sm:hidden">Tambah</span>
                        </Button>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">{transfers.length}</span>{' '}
                            transfer
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">No. Transfer</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dari</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ke</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Oleh</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                                    </svg>
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-foreground">
                                                    {search || statusFilter ? 'Transfer tidak ditemukan' : 'Belum ada transfer stok'}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {search || statusFilter ? 'Coba ubah filter atau kata kunci' : 'Buat transfer antar cabang untuk memindahkan stok'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((t) => (
                                        <tr key={t.id} className="transition hover:bg-muted/50">
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <Link
                                                    href={route('admin.stock-transfers.show', t.id)}
                                                    className="text-sm font-semibold text-primary-600 hover:text-primary-800"
                                                >
                                                    {t.transfer_no}
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{fmtDate(t.transfer_date)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{t.from_branch?.name ?? '—'}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{t.to_branch?.name ?? '—'}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{t.user?.name ?? '—'}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <StatusBadge status={t.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route('admin.stock-transfers.show', t.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                                                    </Link>
                                                    {(t.status === 'pending' || t.status === 'cancelled') && (
                                                        <button
                                                            onClick={() => setConfirmDelete(t)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
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
                        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                </svg>
                            </div>
                            <p className="mt-4 text-sm font-medium text-foreground">
                                {search || statusFilter ? 'Transfer tidak ditemukan' : 'Belum ada transfer stok'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {search || statusFilter ? 'Coba ubah filter atau kata kunci' : 'Buat transfer antar cabang untuk memindahkan stok'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((t) => (
                            <div key={t.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={route('admin.stock-transfers.show', t.id)}
                                            className="text-sm font-semibold text-primary-600 hover:text-primary-800"
                                        >
                                            {t.transfer_no}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(t.transfer_date)}</p>
                                    </div>
                                    <StatusBadge status={t.status} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Dari</p>
                                        <p className="mt-0.5 text-foreground">{t.from_branch?.name ?? '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground">Ke</p>
                                        <p className="mt-0.5 text-foreground">{t.to_branch?.name ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                                    <Link
                                        href={route('admin.stock-transfers.show', t.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-slate-200"
                                    >
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Lihat
                                    </Link>
                                    {(t.status === 'pending' || t.status === 'cancelled') && (
                                        <button
                                            onClick={() => setConfirmDelete(t)}
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
                    <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-600" strokeWidth={1.8} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-slate-900">Hapus Transfer?</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Transfer <strong>{confirmDelete.transfer_no}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button onClick={() => setConfirmDelete(null)} disabled={processing} className="inline-flex justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60">Batal</button>
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
    const map = {
        pending: 'bg-amber-100 text-amber-700',
        in_transit: 'bg-sky-100 text-sky-700',
        received: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-600',
    };
    const label = {
        pending: 'Pending',
        in_transit: 'Dalam Perjalanan',
        received: 'Diterima',
        cancelled: 'Dibatalkan',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-foreground'}`}>
            {label[status] ?? status}
        </span>
    );
}
