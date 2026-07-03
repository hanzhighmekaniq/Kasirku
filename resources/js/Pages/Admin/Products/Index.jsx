import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const TYPE_LABEL = {
    finished_goods: { label: 'Barang Jadi', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    raw_material:   { label: 'Bahan Baku',  bg: 'bg-amber-100', text: 'text-amber-700' },
    combo:          { label: 'Combo/Paket', bg: 'bg-violet-100', text: 'text-violet-700' },
};

export default function Index({ products }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const categories = useMemo(() => {
        const map = new Map();
        products.forEach((p) => {
            if (p.category?.id && !map.has(p.category.id)) map.set(p.category.id, p.category.name);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [products]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products.filter((p) => {
            const matchSearch =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.barcode ?? '').toLowerCase().includes(q);
            const matchType = !filterType || p.type === filterType;
            const matchCategory = !filterCategory || String(p.category_id) === filterCategory;
            const matchStatus =
                filterStatus === '' ? true : filterStatus === '1' ? p.is_active : !p.is_active;
            return matchSearch && matchType && matchCategory && matchStatus;
        });
    }, [products, search, filterType, filterCategory, filterStatus]);

    const stats = useMemo(() => ({
        total: products.length,
        active: products.filter((p) => p.is_active).length,
        lowStock: products.filter((p) => p.track_stock && p.stock <= p.stock_minimum).length,
        inactive: products.filter((p) => !p.is_active).length,
    }), [products]);

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route('admin.products.destroy', target.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setTarget(null); },
        });
    };

    const hasFilters = search || filterType || filterCategory || filterStatus;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Manajemen Produk</h2>
                    <Link
                        href={route('admin.products.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="hidden sm:inline">Tambah Produk</span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title="Manajemen Produk" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: 'Total Produk', value: stats.total, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10', color: 'text-slate-700' },
                    { label: 'Aktif', value: stats.active, icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-600' },
                    { label: 'Stok Menipis', value: stats.lowStock, icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z', color: 'text-red-600' },
                    { label: 'Nonaktif', value: stats.inactive, icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', color: 'text-slate-400' },
                ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <svg className={`h-5 w-5 ${s.color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, SKU, atau barcode..."
                                className="block w-full rounded-xl border-slate-300 pl-9 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">Semua Tipe</option>
                                <option value="finished_goods">Barang Jadi</option>
                                <option value="raw_material">Bahan Baku</option>
                                <option value="combo">Combo/Paket</option>
                            </select>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">Semua Status</option>
                                <option value="1">Aktif</option>
                                <option value="0">Nonaktif</option>
                            </select>
                            {hasFilters && (
                                <button
                                    onClick={() => { setSearch(''); setFilterType(''); setFilterCategory(''); setFilterStatus(''); }}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-semibold text-slate-700">{filtered.length}</span> dari {products.length} produk
                        </p>
                    </div>
                </div>

                {/* Desktop table */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {hasFilters ? 'Produk tidak ditemukan' : 'Belum ada produk'}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {hasFilters ? 'Coba kata kunci atau filter lain.' : 'Mulai dengan menambahkan produk pertama.'}
                        </p>
                        {!hasFilters && (
                            <Link
                                href={route('admin.products.create')}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Tambah Produk
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-3.5">Produk</th>
                                        <th className="px-5 py-3.5">Tipe</th>
                                        <th className="px-5 py-3.5 hidden lg:table-cell">Kategori</th>
                                        <th className="px-5 py-3.5 hidden xl:table-cell">Supplier</th>
                                        <th className="px-5 py-3.5 text-right">Harga Beli</th>
                                        <th className="px-5 py-3.5 text-right">Harga Jual</th>
                                        <th className="px-5 py-3.5 text-center">Stok</th>
                                        <th className="px-5 py-3.5 text-center">Status</th>
                                        <th className="px-5 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((product) => (
                                        <tr key={product.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product.image ? (
                                                        <img src={`/storage/${product.image}`} alt={product.name} className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200" />
                                                    ) : (
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                                                            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={route('admin.products.show', product.id)}
                                                            className="font-medium text-slate-800 hover:text-indigo-600 transition-colors truncate max-w-[200px] block"
                                                        >
                                                            {product.name}
                                                        </Link>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-xs text-slate-400">SKU: {product.sku}</span>
                                                            {product.barcode && <span className="text-xs text-slate-400">&middot; {product.barcode}</span>}
                                                        </div>
                                                        <span className="text-xs text-slate-400">Satuan: {product.unit}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <TypeBadge type={product.type} />
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 hidden lg:table-cell">
                                                {product.category?.name ?? <span className="text-slate-300 italic text-xs">&mdash;</span>}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 hidden xl:table-cell">
                                                {product.supplier?.name ?? <span className="text-slate-300 italic text-xs">&mdash;</span>}
                                            </td>
                                            <td className="px-5 py-4 text-right text-slate-500">
                                                Rp {Number(product.cost_price || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-5 py-4 text-right font-medium text-slate-800">
                                                Rp {Number(product.sell_price || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <StockBadge product={product} />
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {product.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('admin.variants.index', product.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600" title="Kelola Varian">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                                                        </svg>
                                                    </Link>
                                                    {product.type !== 'raw_material' && (
                                                        <Link href={route('admin.products.recipes.index', product.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-orange-50 hover:text-orange-600" title="Kelola Resep">
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l.43 2.146a2.25 2.25 0 01-2.19 2.754H6.01a2.25 2.25 0 01-2.19-2.754l.43-2.146M5 14.5l-.43.107" />
                                                            </svg>
                                                        </Link>
                                                    )}
                                                    <Link href={route('admin.products.edit', product.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                        </svg>
                                                    </Link>
                                                    <button onClick={() => setTarget(product)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600" title="Hapus">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
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
                            {filtered.map((product) => (
                                <div key={product.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        {product.image ? (
                                            <img src={`/storage/${product.image}`} alt={product.name} className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-200" />
                                        ) : (
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                                                <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-medium text-slate-800">{product.name}</p>
                                                <TypeBadge type={product.type} />
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-400">SKU: {product.sku}{product.barcode ? ` · ${product.barcode}` : ''}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                                <span className="text-sm font-semibold text-slate-800">
                                                    Rp {Number(product.sell_price || 0).toLocaleString('id-ID')}
                                                </span>
                                                {product.category?.name && (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                                        {product.category.name}
                                                    </span>
                                                )}
                                                <StockBadge product={product} />
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {product.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-center gap-1">
                                                <Link href={route('admin.variants.index', product.id)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-amber-600 transition hover:bg-amber-50">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                                                    </svg>
                                                    Varian
                                                </Link>
                                                {product.type !== 'raw_material' && (
                                                    <Link href={route('admin.products.recipes.index', product.id)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-orange-600 transition hover:bg-orange-50">
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l.43 2.146a2.25 2.25 0 01-2.19 2.754H6.01a2.25 2.25 0 01-2.19-2.754l.43-2.146M5 14.5l-.43.107" />
                                                        </svg>
                                                        Resep
                                                    </Link>
                                                )}
                                                <Link href={route('admin.products.edit', product.id)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                    </svg>
                                                    Edit
                                                </Link>
                                                <button onClick={() => setTarget(product)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus produk?"
                description={target ? `Produk "${target.name}" akan dihapus permanen. Stok dan data terkait tidak akan terhapus.` : ''}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}

function TypeBadge({ type }) {
    const t = TYPE_LABEL[type] ?? { label: type, bg: 'bg-slate-100', text: 'text-slate-600' };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${t.bg} ${t.text}`}>
            {t.label}
        </span>
    );
}

function StockBadge({ product }) {
    if (!product.track_stock) {
        return <span className="text-xs italic text-slate-400">N/A</span>;
    }
    const isLow = product.stock <= product.stock_minimum;
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isLow ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
            {product.stock}
            {isLow && <span className="ml-1 text-[10px]">Menipis</span>}
        </span>
    );
}
