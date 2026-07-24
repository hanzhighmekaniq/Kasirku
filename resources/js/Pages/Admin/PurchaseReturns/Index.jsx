import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import PageTabs from "@/Components/PageTabs";
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChevronDown, Eye, Plus, Trash2, ShoppingBag, Undo2 } from 'lucide-react';
import Button from "@/Components/ui/Button";
import Dropdown from '@/Components/Dropdown';
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const STATUS_CONFIG = {
    completed: { label: 'Selesai',    color: 'bg-emerald-100 text-success', dot: 'bg-success/100' },
    cancelled: { label: 'Dibatalkan', color: 'bg-muted text-muted-foreground', dot: 'bg-slate-400' },
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

const PAGE_TITLE = {
    retail: 'Retur Pembelian',
    fnb: 'Retur Bahan Baku',
    rental: 'Retur Pembelian Unit',
};

export default function Index({ purchaseReturns, storeType = 'retail' }) {
    const pageTitle = PAGE_TITLE[storeType] ?? 'Retur Pembelian';
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
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        pageTitle
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <PageHeader
                title={pageTitle}
                breadcrumbs={["Admin", pageTitle]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {pageTitle}
                        </span>
                    </>
                }
                description="Catat dan pantau retur pembelian stok atau bahan baku ke supplier."
                action={
                    <Button
                        as={Link}
                        href={route('admin.purchase-returns.create')}
                        icon={Plus}
                    >
                        <span className="hidden sm:inline">Buat Retur</span>
                        <span className="sm:hidden">Retur</span>
                    </Button>
                }
            />

            <PageTabs
                tabs={[
                    {
                        name: "Riwayat Pembelian",
                        href: route("admin.purchases.index"),
                        active: route().current("admin.purchases.index"),
                        icon: <ShoppingBag className="h-4 w-4" />,
                    },
                    {
                        name: "Retur Pembelian",
                        href: route("admin.purchase-returns.index"),
                        active: route().current("admin.purchase-returns.index"),
                        icon: <Undo2 className="h-4 w-4" />,
                    }
                ]}
            />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground/30 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Retur</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-rose-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Dibatalkan</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.cancelled}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-emerald-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Selesai</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.completed}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-primary-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Nilai</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{formatRupiah(stats.totalValue)}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nomor retur, supplier, atau pembelian..."
                                className="block w-full rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-sm transition hover:bg-muted">
                                    <span className={statusFilter !== "all" ? "text-foreground" : "text-muted-foreground"}>
                                        {statusFilter === "completed" ? "Selesai" : statusFilter === "cancelled" ? "Dibatalkan" : "Semua Status"}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content width="48">
                                <button onClick={() => setStatusFilter("all")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${statusFilter === "all" ? "bg-primary-50 font-medium text-primary-600" : "text-muted-foreground hover:bg-muted"}`}>Semua Status</button>
                                <button onClick={() => setStatusFilter("completed")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${statusFilter === "completed" ? "bg-primary-50 font-medium text-primary-600" : "text-muted-foreground hover:bg-muted"}`}>Selesai</button>
                                <button onClick={() => setStatusFilter("cancelled")} className={`block w-full px-4 py-2.5 text-left text-sm transition ${statusFilter === "cancelled" ? "bg-primary-50 font-medium text-primary-600" : "text-muted-foreground hover:bg-muted"}`}>Dibatalkan</button>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                            dari{" "}
                            <span className="font-semibold text-foreground">{purchaseReturns.length}</span>{" "}
                            retur
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">No. Retur</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pembelian Asal</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                </svg>
                                            </div>
                                            <p className="mt-4 text-sm font-medium text-muted-foreground">Belum ada {pageTitle.toLowerCase()}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">Klik "Buat Retur" untuk membuat retur baru</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((retur) => (
                                    <tr key={retur.id} className="transition hover:bg-muted/50">
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <Link
                                                href={route('admin.purchase-returns.show', retur.id)}
                                                className="text-sm font-semibold text-primary-600 hover:text-primary-800"
                                            >
                                                {retur.return_no}
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className="text-sm text-muted-foreground">{retur.purchase?.purchase_no || '-'}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className="text-sm text-muted-foreground">{retur.supplier?.name || '-'}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-center">
                                            <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                                                {retur.items_count}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-foreground">
                                            {formatRupiah(retur.total_amount)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                                            {formatDate(retur.return_date)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-center">
                                            <StatusBadge status={retur.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    href={route('admin.purchase-returns.show', retur.id)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-muted-foreground"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" strokeWidth={1.8} />
                                                </Link>
                                                {retur.status !== 'completed' && (
                                                    <button
                                                        onClick={() => setDeleteTarget(retur)}
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
                <div className="space-y-3 md:hidden">
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                        </div>
                        <p className="mt-4 text-sm font-medium text-muted-foreground">Belum ada {pageTitle.toLowerCase()}</p>
                    </div>
                ) : (
                    filtered.map((retur) => (
                        <div key={retur.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <Link
                                        href={route('admin.purchase-returns.show', retur.id)}
                                        className="text-sm font-semibold text-primary-600"
                                    >
                                        {retur.return_no}
                                    </Link>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Dari: {retur.purchase?.purchase_no || '-'}
                                    </p>
                                </div>
                                <StatusBadge status={retur.status} />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="text-muted-foreground">Supplier</p>
                                    <p className="font-medium text-foreground">{retur.supplier?.name || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground">Total</p>
                                    <p className="font-semibold text-foreground">{formatRupiah(retur.total_amount)}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                                <span className="text-xs text-muted-foreground">{formatDate(retur.return_date)}</span>
                                <div className="flex items-center gap-1">
                                    <Link
                                        href={route('admin.purchase-returns.show', retur.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/70"
                                    >
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Detail
                                    </Link>
                                    {retur.status !== 'completed' && (
                                        <button
                                            onClick={() => setDeleteTarget(retur)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-red-100"
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
