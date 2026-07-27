import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import StockTabs from "@/Components/StockTabs";
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Clock, Boxes, ChevronDown, ChevronRight, X, Search, Trash2 } from 'lucide-react';
import { useStoreModules } from '@/Hooks/useStoreModules';
import { purchaseUnitHint, usesUnitConversion } from '@/Utils/unitConversion';

/**
 * Satuan pakai di belakang angka stok — hanya untuk bahan baku berkonversi,
 * karena di situlah satuan simpan (gram) berbeda dari satuan beli (kg).
 */
const unitSuffix = (product) =>
    usesUnitConversion(product) ? ` ${product.base_unit}` : '';

export default function Index({ stocks, stats, storeType = 'retail' }) {
    const { flash } = usePage().props;
    const { needsWaste } = useStoreModules();
    const [search, setSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Label dinamis per store type
    const isRawMaterial = storeType === 'fnb';
    const PAGE_TITLE   = isRawMaterial ? 'Stok Bahan Baku' : 'Stok Produk';
    const ITEM_LABEL   = isRawMaterial ? 'Bahan Baku' : storeType === 'rental' ? 'Unit' : 'Produk';
    const STAT_PRODUCT = isRawMaterial ? 'Total Bahan Baku' : storeType === 'rental' ? 'Total Unit' : 'Total Produk';

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
                setDropdownSearch('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (dropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [dropdownOpen]);

    // Unique products from stocks for the dropdown
    const allProducts = useMemo(() => {
        const map = new Map();
        stocks.forEach((s) => {
            if (s.product && !map.has(s.product.id)) {
                map.set(s.product.id, s.product);
            }
        });
        return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [stocks]);

    // Filtered products in dropdown
    const dropdownProducts = useMemo(() => {
        if (!dropdownSearch) return allProducts;
        const q = dropdownSearch.toLowerCase();
        return allProducts.filter((p) =>
            p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
        );
    }, [allProducts, dropdownSearch]);

    const selectedProduct = selectedProductId ? allProducts.find((p) => p.id === Number(selectedProductId)) : null;

    // Stock is now one row per product per store — flat list
    const filtered = useMemo(() => {
        let result = stocks;
        if (selectedProductId) {
            result = result.filter((s) => s.product_id === Number(selectedProductId));
        } else if (search) {
            const q = search.toLowerCase();
            result = result.filter((s) =>
                s.product?.name?.toLowerCase().includes(q) ||
                s.product?.sku?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [stocks, search, selectedProductId]);

    const getAvailable = (s) => (s.quantity || 0) - (s.reserved_quantity || 0);
    const getStatus = (s) => {
        const avail = getAvailable(s);
        if (avail <= 0) return { label: 'Habis', cls: 'bg-destructive/10 text-destructive' };
        if (s.product?.track_stock && avail <= (s.product?.stock_minimum || 0)) {
            return { label: 'Menipis', cls: 'bg-warning/10 text-warning' };
        }
        return { label: 'Aman', cls: 'bg-success/10 text-success' };
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        PAGE_TITLE
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <PageHeader
                title={PAGE_TITLE}
                breadcrumbs={["Admin", PAGE_TITLE]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Stok
                        </span>
                    </>
                }
                description={`Pantau ketersediaan, nilai inventaris, dan pergerakan stok ${ITEM_LABEL.toLowerCase()} Anda.`}
            />

            <StockTabs />

            <Head title={PAGE_TITLE} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground/30 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">{STAT_PRODUCT}</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total_products}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-primary bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Item</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total_items?.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-warning bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Stok Menipis</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.low_stock}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-destructive bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Stok Habis</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.out_of_stock}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-success bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Nilai Stok</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(stats.total_value)}</p>
                </div>
            </div>

            {/* Sub-navigation — tautan ke halaman lain, sengaja TIDAK ditaruh di
                PageHeader maupun toolbar tabel supaya tidak tertukar dengan aksi
                pada data yang sedang ditampilkan. */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                    href={route('admin.stock.movements')}
                    className="group overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                            <Clock className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">Riwayat Pergerakan</p>
                            <p className="truncate text-xs text-muted-foreground">Semua stok masuk &amp; keluar</p>
                        </div>
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={2} />
                    </div>
                </Link>

                {needsWaste && (
                    <Link
                        href={route('admin.wastes.index')}
                        className="group overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-destructive/30 hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition group-hover:bg-destructive/20">
                                <Trash2 className="h-5 w-5" strokeWidth={1.8} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">Pembuangan</p>
                                <p className="truncate text-xs text-muted-foreground">Stok rusak/kadaluarsa</p>
                            </div>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-destructive" strokeWidth={2} />
                        </div>
                    </Link>
                )}
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* Product dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => { setDropdownOpen(!dropdownOpen); setDropdownSearch(''); }}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-sm transition ${
                                    selectedProduct
                                        ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                                        : 'border-border bg-background text-foreground hover:bg-muted'
                                }`}
                            >
                                <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                <span className="max-w-[200px] truncate">{selectedProduct ? selectedProduct.name : `Semua ${ITEM_LABEL}`}</span>
                                {selectedProduct ? (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedProductId(''); }} className="ml-1 rounded-full p-0.5 text-primary/70 hover:bg-primary/20 hover:text-primary">
                                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                                    </button>
                                ) : (
                                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${dropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                                )}
                            </button>
                            {dropdownOpen && (
                                <div className="absolute z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-xl">
                                    <div className="border-b border-border p-3">
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={dropdownSearch}
                                                onChange={(e) => setDropdownSearch(e.target.value)}
                                                placeholder="Cari nama atau SKU..."
                                                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto p-1.5">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedProductId(''); setDropdownOpen(false); setDropdownSearch(''); }}
                                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                !selectedProductId ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            Semua {ITEM_LABEL}
                                        </button>
                                        {dropdownProducts.length === 0 ? (
                                            <p className="px-3 py-4 text-center text-xs text-muted-foreground">Tidak ada produk ditemukan.</p>
                                        ) : (
                                            dropdownProducts.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => { setSelectedProductId(p.id); setDropdownOpen(false); setDropdownSearch(''); }}
                                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                        selectedProductId === p.id ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted'
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

                        {/* Search input */}
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari produk (nama / SKU)..."
                                className="block w-full rounded-xl bg-background border border-border py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">{stocks.length}</span>{' '}
                            {ITEM_LABEL.toLowerCase()}
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">{ITEM_LABEL}</th>
                                    <th className="px-4 py-3 text-left font-semibold">SKU</th>
                                    <th className="px-4 py-3 text-left font-semibold">Stok Fisik</th>
                                    <th className="px-4 py-3 text-left font-semibold" title="Stok yang sudah dialokasikan ke pesanan dan belum keluar gudang">Dipesan</th>
                                    <th className="px-4 py-3 text-left font-semibold" title="Stok Fisik dikurangi Dipesan">Tersedia</th>
                                    <th className="px-4 py-3 text-left font-semibold">Min. Stok</th>
                                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                    <Boxes className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-muted-foreground">
                                                    {search || selectedProductId ? 'Produk tidak ditemukan' : `Belum ada data ${ITEM_LABEL.toLowerCase()}`}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {search || selectedProductId ? 'Coba ubah filter atau kata kunci' : 'Data stok akan muncul setelah ada transaksi'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((s) => {
                                        const status = getStatus(s);
                                        const available = getAvailable(s);
                                        return (
                                            <tr key={s.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <p className="text-sm font-semibold text-foreground">{s.product?.name}</p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{s.product?.sku || '—'}</td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-foreground">
                                                    {(s.quantity || 0).toLocaleString('id-ID')}
                                                    {unitSuffix(s.product)}
                                                    {/* Stok bahan baku disimpan dalam satuan pakai —
                                                        setara satuan belinya ditampilkan sebagai bantuan
                                                        baca saat mencocokkan dengan fisik gudang. */}
                                                    {purchaseUnitHint(s.product, s.quantity) && (
                                                        <span className="block text-xs font-normal text-muted-foreground">
                                                            {purchaseUnitHint(s.product, s.quantity)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{(s.reserved_quantity || 0).toLocaleString('id-ID')}</td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-foreground">
                                                    {available.toLocaleString('id-ID')}
                                                    {unitSuffix(s.product)}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{s.product?.stock_minimum ?? 0}</td>
                                                <td className="whitespace-nowrap px-5 py-4 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
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
                                {search || selectedProductId ? 'Produk tidak ditemukan' : `Belum ada data ${ITEM_LABEL.toLowerCase()}`}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {search || selectedProductId ? 'Coba ubah filter atau kata kunci' : 'Data stok akan muncul setelah ada transaksi'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((s) => {
                            const status = getStatus(s);
                            const available = getAvailable(s);
                            return (
                                <div key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    {/* Identitas + status */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">{s.product?.name}</p>
                                            {s.product?.sku && (
                                                <p className="truncate font-mono text-xs text-muted-foreground">{s.product.sku}</p>
                                            )}
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
                                    </div>

                                    {/* Angka yang paling menentukan keputusan — ditonjolkan
                                        sendiri, bukan disamakan bobotnya dengan angka lain. */}
                                    <div className="mt-3 flex items-end justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Tersedia
                                            </p>
                                            <p className="mt-0.5 text-2xl font-bold leading-none text-foreground">
                                                {available.toLocaleString('id-ID')}
                                                <span className="text-sm font-semibold">{unitSuffix(s.product)}</span>
                                            </p>
                                            {purchaseUnitHint(s.product, available) && (
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                    {purchaseUnitHint(s.product, available)}
                                                </p>
                                            )}
                                        </div>
                                        <p className="shrink-0 text-right text-[11px] text-muted-foreground">
                                            min. {(s.product?.stock_minimum ?? 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    {/* Asal angka di atas, ditulis sebagai hitungan supaya
                                        hubungan ketiganya langsung terbaca. */}
                                    <div className="mt-2 flex items-stretch gap-2 text-center">
                                        <div className="flex-1 rounded-lg border border-border px-2 py-1.5">
                                            <p className="text-[10px] text-muted-foreground">Stok Fisik</p>
                                            <p className="mt-0.5 text-sm font-semibold text-foreground">
                                                {(s.quantity || 0).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        <div className="flex items-center text-sm font-semibold text-muted-foreground">&minus;</div>
                                        <div className="flex-1 rounded-lg border border-border px-2 py-1.5">
                                            <p className="text-[10px] text-muted-foreground">Dipesan</p>
                                            <p className="mt-0.5 text-sm font-semibold text-foreground">
                                                {(s.reserved_quantity || 0).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
