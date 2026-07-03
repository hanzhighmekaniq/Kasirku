import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
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
    { value: '',             label: 'Semua Status' },
    { value: 'active',       label: 'Aktif' },
    { value: 'expiring_soon',label: 'Hampir Kadaluarsa' },
    { value: 'expired',      label: 'Kadaluarsa' },
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
        router.get(route('admin.product-batches.index'), { product_id: newProd, status: newStatus }, { preserveScroll: true });
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
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="hidden sm:inline">Tambah Batch</span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title="Batch / Expiry Produk" />

            {/* Alert banners */}
            {(counts.expired > 0 || counts.expiring_soon > 0) && (
                <div className="mb-5 space-y-2">
                    {counts.expired > 0 && (
                        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                            <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-sm text-red-700">
                                <strong>{counts.expired} batch</strong> sudah kadaluarsa dan perlu segera ditangani.
                                <button onClick={() => { setStatus('expired'); applyFilter(productId, 'expired'); }} className="ml-2 underline font-medium">Lihat</button>
                            </p>
                        </div>
                    )}
                    {counts.expiring_soon > 0 && (
                        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-amber-700">
                                <strong>{counts.expiring_soon} batch</strong> akan kadaluarsa dalam 30 hari ke depan.
                                <button onClick={() => { setStatus('expiring_soon'); applyFilter(productId, 'expiring_soon'); }} className="ml-2 underline font-medium">Lihat</button>
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
                    {/* Product filter — searchable */}
                    <div className="relative sm:w-56" ref={prodDropdownRef}>
                        <button
                            type="button"
                            onClick={() => { setProdDropdownOpen(!prodDropdownOpen); setProdSearch(''); }}
                            className={`inline-flex w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-sm transition ${
                                selectedProduct
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                            <span className="flex-1 truncate text-left">{selectedProduct ? selectedProduct.name : 'Semua Produk'}</span>
                            {selectedProduct ? (
                                <button type="button" onClick={(e) => { e.stopPropagation(); setProductId(''); applyFilter('', status); setProdDropdownOpen(false); }} className="ml-1 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            ) : (
                                <svg className={`h-4 w-4 shrink-0 text-slate-400 transition ${prodDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                            )}
                        </button>
                        {prodDropdownOpen && (
                            <div className="absolute z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
                                <div className="border-b border-slate-100 p-3">
                                    <div className="relative">
                                        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                        <input
                                            ref={prodSearchRef}
                                            type="text"
                                            value={prodSearch}
                                            onChange={(e) => setProdSearch(e.target.value)}
                                            placeholder="Cari nama atau SKU..."
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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

                    {/* Status filter */}
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { setStatus(opt.value); applyFilter(productId, opt.value); }}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                    status === opt.value
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative ml-auto w-full sm:max-w-xs">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari batch, produk, SKU..."
                            className="block w-full rounded-xl border-slate-300 pl-9 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-3.5">Produk</th>
                                        <th className="px-5 py-3.5">No. Batch</th>
                                        <th className="px-5 py-3.5">Cabang</th>
                                        <th className="px-5 py-3.5 text-right">Qty</th>
                                        <th className="px-5 py-3.5 text-right">Harga Pokok</th>
                                        <th className="px-5 py-3.5">Tgl Beli</th>
                                        <th className="px-5 py-3.5">Kadaluarsa</th>
                                        <th className="px-5 py-3.5">Status</th>
                                        <th className="px-5 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((b) => (
                                        <tr key={b.id} className={`transition hover:bg-slate-50/70 ${b.expiry_status === 'expired' ? 'bg-red-50/40' : ''}`}>
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-slate-800 leading-snug">{b.product?.name ?? '—'}</p>
                                                <p className="text-xs text-slate-400">{b.product?.sku}</p>
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-xs font-semibold text-indigo-600">{b.batch_no}</td>
                                            <td className="px-5 py-3.5 text-slate-500">{b.branch?.name ?? '—'}</td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{b.quantity}</td>
                                            <td className="px-5 py-3.5 text-right text-slate-600">{fmt(b.cost_price)}</td>
                                            <td className="px-5 py-3.5 text-slate-500">{fmtDate(b.purchase_date)}</td>
                                            <td className="px-5 py-3.5">
                                                {b.expiry_date ? (
                                                    <div>
                                                        <p className="text-slate-700">{fmtDate(b.expiry_date)}</p>
                                                        <DaysChip days={b.days_until_expiry} />
                                                    </div>
                                                ) : <span className="text-slate-400">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <ExpiryBadge status={b.expiry_date ? b.expiry_status : 'no_expiry'} />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('admin.product-batches.edit', b.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                        </svg>
                                                    </Link>
                                                    <button onClick={() => setTarget(b)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600" title="Hapus">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-slate-100 md:hidden">
                            {filtered.map((b) => (
                                <div key={b.id} className={`p-4 ${b.expiry_status === 'expired' ? 'bg-red-50/40' : ''}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{b.product?.name ?? '—'}</p>
                                            <p className="text-xs font-mono text-indigo-600">{b.batch_no}</p>
                                        </div>
                                        <ExpiryBadge status={b.expiry_date ? b.expiry_status : 'no_expiry'} />
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-1 text-sm">
                                        <div><span className="text-slate-400">Qty:</span> <span className="font-semibold text-slate-700">{b.quantity}</span></div>
                                        <div><span className="text-slate-400">HPP:</span> <span className="text-slate-700">{fmt(b.cost_price)}</span></div>
                                        <div><span className="text-slate-400">Beli:</span> <span className="text-slate-600">{fmtDate(b.purchase_date)}</span></div>
                                        <div><span className="text-slate-400">Exp:</span> {b.expiry_date ? <DaysChip days={b.days_until_expiry} /> : <span className="text-slate-400">—</span>}</div>
                                    </div>
                                    <div className="mt-3 flex justify-end gap-2">
                                        <Link href={route('admin.product-batches.edit', b.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600">Edit</Link>
                                        <button onClick={() => setTarget(b)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600">Hapus</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {filtered.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                        Menampilkan <span className="font-semibold text-slate-600">{filtered.length}</span> dari{' '}
                        <span className="font-semibold text-slate-600">{batches.length}</span> batch
                    </div>
                )}
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

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-800">Belum ada batch</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Tambah batch untuk melacak stok masuk dan tanggal kadaluarsa produk.</p>
            <Link href={route('admin.product-batches.create')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Tambah Batch
            </Link>
        </div>
    );
}
