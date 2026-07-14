import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Boxes, ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Select from '@/Components/ui/Select';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Expiry badge ─────────────────────────────────────── */
const STATUS_META = {
    active:        { label: 'Aktif',          dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    expiring_soon: { label: 'Hampir Habis',   dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700'   },
    expired:       { label: 'Kadaluarsa',     dot: 'bg-red-500',     badge: 'bg-red-50 text-red-600'       },
    no_expiry:     { label: 'Tanpa Expired',  dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-500'  },
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
    if (days === null || days === undefined) return <span className="text-slate-400">—</span>;
    if (days < 0) return <span className="font-medium text-red-600">{Math.abs(days)} hari lalu</span>;
    if (days === 0) return <span className="font-semibold text-red-600">Hari ini</span>;
    return <span className={`font-medium ${days <= 30 ? 'text-amber-600' : 'text-slate-600'}`}>{days} hari lagi</span>;
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
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Batch / Expiry Produk</h2>
                    <Link
                        href={route('admin.product-batches.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">Tambah Batch</span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title="Batch / Expiry Produk" />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total Batch</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{counts.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Aktif</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{counts.active}</p>
                </div>
                <button
                    onClick={() => { setStatus('expiring_soon'); applyFilter(productId, 'expiring_soon'); }}
                    className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md"
                >
                    <p className="text-xs font-medium text-slate-400">Hampir Kadaluarsa</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{counts.expiring_soon}</p>
                </button>
                <button
                    onClick={() => { setStatus('expired'); applyFilter(productId, 'expired'); }}
                    className="rounded-2xl border border-slate-200 border-l-4 border-l-red-400 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md"
                >
                    <p className="text-xs font-medium text-slate-400">Kadaluarsa</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{counts.expired}</p>
                </button>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* Product filter — searchable dropdown */}
                        <div className="relative" ref={prodDropdownRef}>
                            <button
                                type="button"
                                onClick={() => { setProdDropdownOpen(!prodDropdownOpen); setProdSearch(''); }}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-sm transition ${
                                    selectedProduct
                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Boxes className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
                                <span className="max-w-[200px] truncate">{selectedProduct ? selectedProduct.name : 'Semua Produk'}</span>
                                {selectedProduct ? (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setProductId(''); applyFilter('', status); setProdDropdownOpen(false); }} className="ml-1 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600">
                                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                                    </button>
                                ) : (
                                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${prodDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                                )}
                            </button>
                            {prodDropdownOpen && (
                                <div className="absolute z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
                                    <div className="border-b border-slate-100 p-3">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                                            <input
                                                ref={prodSearchRef}
                                                type="text"
                                                value={prodSearch}
                                                onChange={(e) => setProdSearch(e.target.value)}
                                                placeholder="Cari nama atau SKU..."
                                                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto p-1.5">
                                        <button
                                            type="button"
                                            onClick={() => { setProductId(''); applyFilter('', status); setProdDropdownOpen(false); setProdSearch(''); }}
                                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                !productId ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            Semua Produk
                                        </button>
                                        {filteredProducts.length === 0 ? (
                                            <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada produk ditemukan.</p>
                                        ) : (
                                            filteredProducts.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => { setProductId(p.id); applyFilter(p.id, status); setProdDropdownOpen(false); setProdSearch(''); }}
                                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                        Number(productId) === p.id ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className="block truncate">{p.name}</span>
                                                    <span className="block truncate text-xs text-slate-400">{p.sku}</span>
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
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari batch, produk, SKU..."
                                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan{' '}
                            <span className="font-semibold text-slate-700">{filtered.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-slate-700">{batches.length}</span>{' '}
                            batch
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/60">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Produk</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">No. Batch</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Cabang</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Harga Pokok</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tgl Beli</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Kadaluarsa</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                                    <Boxes className="h-8 w-8 text-slate-400" strokeWidth={1.4} />
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-slate-600">
                                                    {productId || status ? 'Batch tidak ditemukan' : 'Belum ada batch'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {productId || status ? 'Coba ubah filter' : 'Tambah batch untuk melacak stok dan kadaluarsa'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((b) => (
                                        <tr key={b.id} className={`transition hover:bg-slate-50/50 ${b.expiry_status === 'expired' ? 'bg-red-50/40' : ''}`}>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <p className="text-sm font-semibold text-slate-800">{b.product?.name ?? '—'}</p>
                                                <p className="text-xs text-slate-400">{b.product?.sku}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-indigo-600">{b.batch_no}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{b.branch?.name ?? '—'}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">{b.quantity}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{fmt(b.cost_price)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{fmtDate(b.purchase_date)}</td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                {b.expiry_date ? (
                                                    <div>
                                                        <p className="text-sm text-slate-700">{fmtDate(b.expiry_date)}</p>
                                                        <DaysChip days={b.days_until_expiry} />
                                                    </div>
                                                ) : <span className="text-sm text-slate-400">—</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <ExpiryBadge status={b.expiry_date ? b.expiry_status : 'no_expiry'} />
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route('admin.product-batches.edit', b.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" strokeWidth={1.8} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setTarget(b)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <Boxes className="h-8 w-8 text-slate-400" strokeWidth={1.4} />
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-600">
                                {productId || status ? 'Batch tidak ditemukan' : 'Belum ada batch'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                {productId || status ? 'Coba ubah filter' : 'Tambah batch untuk melacak stok dan kadaluarsa'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((b) => (
                            <div key={b.id} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${b.expiry_status === 'expired' ? 'border-red-200 bg-red-50/30' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-800">{b.product?.name ?? '—'}</p>
                                        <p className="font-mono text-xs text-indigo-600">{b.batch_no}</p>
                                        {b.branch?.name && (
                                            <p className="mt-0.5 text-xs text-slate-400">{b.branch.name}</p>
                                        )}
                                    </div>
                                    <ExpiryBadge status={b.expiry_date ? b.expiry_status : 'no_expiry'} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-400">Qty</p>
                                        <p className="mt-0.5 font-semibold text-slate-800">{b.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400">HPP</p>
                                        <p className="mt-0.5 text-slate-600">{fmt(b.cost_price)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Tgl Beli</p>
                                        <p className="mt-0.5 text-slate-600">{fmtDate(b.purchase_date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400">Kadaluarsa</p>
                                        <div className="mt-0.5">
                                            {b.expiry_date ? (
                                                <>
                                                    <p className="text-slate-700">{fmtDate(b.expiry_date)}</p>
                                                    <DaysChip days={b.days_until_expiry} />
                                                </>
                                            ) : <span className="text-slate-400">—</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                                    <Link
                                        href={route('admin.product-batches.edit', b.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                                    >
                                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => setTarget(b)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
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
