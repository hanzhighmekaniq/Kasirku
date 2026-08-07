import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import StockTabs from "@/Components/StockTabs";
import Button from "@/Components/ui/Button";
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import Select from '@/Components/ui/Select';
import ConfirmDeleteModal from '@/Components/ConfirmDeleteModal';

const STATUS_OPTS = [
    { value: '', label: 'Semua Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'in_progress', label: 'Dikerjakan' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

export default function Index({ opnames, stats }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = opnames.filter((o) => {
        if (statusFilter && o.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!o.opname_no?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleDelete = () => {
        if (!confirmDelete) return;
        setProcessing(true);
        router.delete(route('admin.stock-opnames.destroy', confirmDelete.id), {
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
                        Opname Stok
                    </div>
                </div>
            }>
            <PageHeader
                title="Opname Stok"
                breadcrumbs={["Admin", "Stok", "Opname Stok"]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Opname Stok
                        </span>
                    </>
                }
                description="Periksa dan cocokkan jumlah fisik stok di gudang dengan sistem."
            />

            <StockTabs />

            <Head title="Opname Stok" />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-warning bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Draft</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.draft}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-success bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Selesai</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.completed}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-destructive bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Dibatalkan</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.cancelled}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari no. opname..."
                                className="block w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <Select
                            options={STATUS_OPTS}
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v)}
                            placeholder="Semua Status"
                            className="min-w-[160px]"
                        />
                    
                        {/* Di mobile dipindah ke FAB kanan bawah */}
                        <Button
                            as={Link}
                            href={route('admin.stock-opnames.create')}
                            icon={Plus}
                            className="hidden sm:inline-flex sm:w-auto"
                        >
                            Buat Opname
                        </Button>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">{opnames.length}</span>{' '}
                            opname
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">No. Opname</th>
                                    <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                                    <th className="px-4 py-3 text-left font-semibold">Oleh</th>
                                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                                    <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted/30">
                                                    <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                                    </svg>
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-foreground">
                                                    {search || statusFilter ? 'Opname tidak ditemukan' : 'Belum ada opname stok'}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {search || statusFilter ? 'Coba ubah filter atau kata kunci' : 'Buat opname baru untuk hitung fisik stok'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((o) => (
                                        <tr key={o.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <Link
                                                    href={route('admin.stock-opnames.show', o.id)}
                                                    className="font-semibold text-primary hover:text-primary/80"
                                                >
                                                    {o.opname_no}
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDate(o.opname_date)}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{o.user?.name ?? '—'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <StatusBadge status={o.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route('admin.stock-opnames.show', o.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                                                    </Link>
                                                    {(o.status === 'draft' || o.status === 'cancelled') && (
                                                        <button
                                                            onClick={() => setConfirmDelete(o)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
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
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-muted/30">
                                <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                </svg>
                            </div>
                            <p className="mt-4 text-sm font-medium text-foreground">
                                {search || statusFilter ? 'Opname tidak ditemukan' : 'Belum ada opname stok'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {search || statusFilter ? 'Coba ubah filter atau kata kunci' : 'Buat opname baru untuk hitung fisik stok'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((o) => (
                            <div key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={route('admin.stock-opnames.show', o.id)}
                                            className="text-sm font-semibold text-primary hover:text-primary/80"
                                        >
                                            {o.opname_no}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(o.opname_date)}</p>
                                    </div>
                                    <StatusBadge status={o.status} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Oleh</p>
                                        <p className="mt-0.5 text-foreground">{o.user?.name ?? '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground">Tanggal</p>
                                        <p className="mt-0.5 text-foreground">{fmtDate(o.opname_date)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                                    <Link
                                        href={route('admin.stock-opnames.show', o.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                    >
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Lihat
                                    </Link>
                                    {(o.status === 'draft' || o.status === 'cancelled') && (
                                        <button
                                            onClick={() => setConfirmDelete(o)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/20"
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

            {/* Confirm delete — pakai komponen bersama supaya perilaku &
                pewarnaannya sama dengan modal hapus di halaman lain. */}
            <ConfirmDeleteModal
                open={!!confirmDelete}
                title="Hapus Opname?"
                description={
                    confirmDelete
                        ? `Opname "${confirmDelete.opname_no}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                        : ''
                }
                processing={processing}
                onConfirm={handleDelete}
                onClose={() => !processing && setConfirmDelete(null)}
            />

            {/* FAB — mobile only */}
            {!confirmDelete && (
                <Button
                    as={Link}
                    href={route('admin.stock-opnames.create')}
                    icon={Plus}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl sm:hidden"
                    title="Buat Opname"
                />
            )}
        </AuthenticatedLayout>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-warning/10 text-warning', in_progress: 'bg-primary/10 text-primary', completed: 'bg-success/10 text-success', cancelled: 'bg-destructive/10 text-destructive' };
    const label = { draft: 'Draft', in_progress: 'Dikerjakan', completed: 'Selesai', cancelled: 'Dibatalkan' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
            {label[status] ?? status}
        </span>
    );
}
