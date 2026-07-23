import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import StockTabs from "@/Components/StockTabs";
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Boxes, ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Button from "@/Components/ui/Button";
import Select from '@/Components/ui/Select';
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Expiry badge ─────────────────────────────────────── */
const STATUS_META = {
    active:        { label: 'Aktif',          dot: 'bg-success/100', badge: 'bg-success/10 text-success' },
    expiring_soon: { label: 'Hampir Habis',   dot: 'bg-warning',   badge: 'bg-warning/10 text-warning'   },
    expired:       { label: 'Kadaluarsa',     dot: 'bg-destructive/100',     badge: 'bg-destructive/10 text-destructive'       },
    no_expiry:     { label: 'Tanpa Expired',  dot: 'bg-muted-foreground',   badge: 'bg-muted text-muted-foreground'  },
};

function ExpiryBadge({ status }) {
    const m = STATUS_META[status] ?? STATUS_META.active;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
            {m.label}
        </span>
    );
}

/* ── Days remaining chip ──────────────────────────────── */
function DaysChip({ days }) {
    if (days === null || days === undefined) return <span className="text-muted-foreground">—</span>;
    if (days < 0) return <span className="font-medium text-destructive">{Math.abs(days)} hari lalu</span>;
    if (days === 0) return <span className="font-semibold text-destructive">Hari ini</span>;
    return <span className={`font-medium ${days <= 30 ? 'text-warning' : 'text-muted-foreground'}`}>{days} hari lagi</span>;
}

const STATUS_OPTS = [
    { value: '',              label: 'Semua Status' },
    { value: 'active',        label: 'Aktif' },
    { value: 'expiring_soon', label: 'Hampir Kadaluarsa' },
    { value: 'expired',       label: 'Kadaluarsa' },
];

export default function Index({ batches, products, filters }) {
    const [search, setSearch]       = useState('');
    const [productId, setProductId] = useState(filters.product_id ?? '');
    const [status, setStatus]       = useState(filters.status ?? '');
    const [target, setTarget]       = useState(null);
    const [deleting, setDeleting]   = useState(false);
    const [prodDropdownOpen, setProdDropdownOpen] = useState(false);
    const [prodSearch, setProdSearch] = useState('');
    const prodDropdownRef = useRef(null);
    const prodSearchRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (prodDropdownRef.current && !prodDropdownRef.current.contains(e.target)) {
                setProdDropdownOpen(false);
                setProdSearch('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (prodDropdownOpen && prodSearchRef.current) {
            prodSearchRef.current.focus();
        }
    }, [prodDropdownOpen]);

    const filteredProducts = useMemo(() => {
        if (!prodSearch) return products;
        const q = prodSearch.toLowerCase();
        return products.filter((p) =>
            p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
        );
    }, [products, prodSearch]);

    const selectedProduct = productId ? products.find((p) => p.id === Number(productId)) : null;

    /* client-side search on top of server filters */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return batches;
        return batches.filter((b) =>
            b.batch_no.toLowerCase().includes(q) ||
            (b.product?.name ?? '').toLowerCase().includes(q) ||
            (b.product?.sku ?? '').toLowerCase().includes(q)
        );
    }, [batches, search]);

    const applyFilter = (newProd, newStatus) => {
        router.get(route('admin.product-batches.index'), { product_id: newProd || undefined, status: newStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route('admin.product-batches.destroy', target.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setTarget(null); },
        });
    };

    /* expiry summary counts */
    const counts = useMemo(() => ({
        total:         batches.length,
        active:        batches.filter((b) => b.expiry_status === 'active').length,
        expired:       batches.filter((b) => b.expiry_status === 'expired').length,
        expiring_soon: batches.filter((b) => b.expiry_status === 'expiring_soon').length,
    }), [batches]);

    return (
        <AuthenticatedLayout>
            <PageHeader
                title="Batch / Expiry Produk"
                breadcrumbs={["Admin", "Stok", "Batch & Expiry"]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Batch & Expiry
                        </span>
                    </>
                }
                description="Pantau tanggal kadaluarsa dan kelola batch produk Anda."
                action={
                    <Button as={Link} href={route('admin.product-batches.create')} icon={Plus}>
                        <span className="hidden sm:inline">Tambah Batch</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                }
            />

            <StockTabs />

            <Head title="Batch / Expiry Produk" />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground/30 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Batch</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{counts.total}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-emerald-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Aktif</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{counts.active}</p>
                </div>
                <button
                    onClick={() => { setStatus('expiring_soon'); applyFilter(productId, 'expiring_soon'); }}
                    className="rounded-2xl border border-border border-l-4 border-l-amber-400 bg-card p-4 text-left shadow-sm transition hover:border-warning/30 hover:shadow-md"
                >
                    <p className="text-xs font-medium text-muted-foreground">Hampir Kadaluarsa</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{counts.expiring_soon}</p>
                </button>
                <button
                    onClick={() => { setStatus('expired'); applyFilter(productId, 'expired'); }}
                    className="rounded-2xl border border-border border-l-4 border-l-destructive/40 bg-card p-4 text-left shadow-sm transition hover:border-destructive/30 hover:shadow-md"
                >
                    <p className="text-xs font-medium text-muted-foreground">Kadaluarsa</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{counts.expired}</p>
                </button>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* Product filter — searchable dropdown */}
                        <div className="relative" ref={prodDropdownRef}>
                            <button
                                type="button"
                                onClick={() => { setProdDropdownOpen(!prodDropdownOpen); setProdSearch(''); }}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-sm transition ${
                                    selectedProduct
                                        ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/10'
                                        : 'border-border bg-card text-foreground hover:bg-muted'
                                }`}
                            >
                                <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                <span className="max-w-[200px] truncate">{selectedProduct ? selectedProduct.name : 'Semua Produk'}</span>
                                {selectedProduct ? (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setProductId(''); applyFilter('', status); setProdDropdownOpen(false); }} className="ml-1 rounded-full p-0.5 text-primary hover:bg-primary/10 hover:text-primary">
                                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                                    </button>
                                ) : (
                                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${prodDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                                )}
                            </button>
                            {prodDropdownOpen && (
                                <div className="absolute z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-xl">
                                    <div className="border-b border-border p-3">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                                            <input
                                                ref={prodSearchRef}
                                                type="text"
                                                value={prodSearch}
                                                onChange={(e) => setProdSearch(e.target.value)}
                                                placeholder="Cari nama atau SKU..."
                                                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto p-1.5">
                                        <button
                                            type="button"
                                            onClick={() => { setProductId(''); applyFilter('', status); setProdDropdownOpen(false); setProdSearch(''); }}
                                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                !productId ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            Semua Produk
                                        </button>
                                        {filteredProducts.length === 0 ? (
                                            <p className="px-3 py-4 text-center text-xs text-muted-foreground">Tidak ada produk ditemukan.</p>
                                        ) : (
                                            filteredProducts.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => { setProductId(p.id); applyFilter(p.id, status); setProdDropdownOpen(false); setProdSearch(''); }}
                                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                        Number(productId) === p.id ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                    <span className="block truncate">{p.name}</span>
                                                    <span className="block truncate text-xs text-muted-foreground">{p.sku}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status filter — using Select component */}
                        <Select
                            options={STATUS_OPTS}
                            value={status}
                            onChange={(v) => { setStatus(v); applyFilter(productId, v); }}
                            placeholder="Semua Status"
                            className="min-w-[180px]"
                        />

                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari batch, produk, SKU..."
                                className="block w-full rounded-xl border border-border py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">{batches.length}</span>{' '}
                            batch
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produk</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">No. Batch</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cabang</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Harga Pokok</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tgl Beli</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kadaluarsa</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                    <Boxes className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-muted-foreground">
                                                    {productId || status ? 'Batch tidak ditemukan' : 'Belum ada batch'}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {productId || status ? 'Coba ubah filter' : 'Tambah batch untuk melacak stok dan kadaluarsa'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((b) => (
                                        <tr key={b.id} className={`transition hover:bg-muted/50 ${b.expiry_status === 'expired' ? 'bg-destructive/10/40' : ''}`}>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <p className="text-sm font-semibold text-foreground">{b.product?.name ?? '—'}</p>
                                                <p className="text-xs text-muted-foreground">{b.product?.sku}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-primary">{b.batch_no}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{b.branch?.name ?? '—'}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-foreground">{b.quantity}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{fmt(b.cost_price)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{fmtDate(b.purchase_date)}</td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                {b.expiry_date ? (
                                                    <div>
                                                        <p className="text-sm text-foreground">{fmtDate(b.expiry_date)}</p>
                                                        <DaysChip days={b.days_until_expiry} />
                                                    </div>
                                                ) : <span className="text-sm text-muted-foreground">—</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <ExpiryBadge status={b.expiry_date ? b.expiry_status : 'no_expiry'} />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route('admin.product-batches.edit', b.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" strokeWidth={1.8} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setTarget(b)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                                                    </button>
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
                                <Boxes className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
                            </div>
                            <p className="mt-4 text-sm font-medium text-muted-foreground">
                                {productId || status ? 'Batch tidak ditemukan' : 'Belum ada batch'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {productId || status ? 'Coba ubah filter' : 'Tambah batch untuk melacak stok dan kadaluarsa'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((b) => (
                            <div key={b.id} className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${b.expiry_status === 'expired' ? 'border-destructive/20 bg-destructive/10/30' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">{b.product?.name ?? '—'}</p>
                                        <p className="font-mono text-xs text-primary">{b.batch_no}</p>
                                        {b.branch?.name && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">{b.branch.name}</p>
                                        )}
                                    </div>
                                    <ExpiryBadge status={b.expiry_date ? b.expiry_status : 'no_expiry'} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Qty</p>
                                        <p className="mt-0.5 font-semibold text-foreground">{b.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground">HPP</p>
                                        <p className="mt-0.5 text-muted-foreground">{fmt(b.cost_price)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Tgl Beli</p>
                                        <p className="mt-0.5 text-muted-foreground">{fmtDate(b.purchase_date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground">Kadaluarsa</p>
                                        <div className="mt-0.5">
                                            {b.expiry_date ? (
                                                <>
                                                    <p className="text-foreground">{fmtDate(b.expiry_date)}</p>
                                                    <DaysChip days={b.days_until_expiry} />
                                                </>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                                    <Link
                                        href={route('admin.product-batches.edit', b.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/70"
                                    >
                                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => setTarget(b)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus batch ini?"
                description={target ? `Batch "${target.batch_no}" untuk produk ${target.product?.name} akan dihapus permanen.` : ''}
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
