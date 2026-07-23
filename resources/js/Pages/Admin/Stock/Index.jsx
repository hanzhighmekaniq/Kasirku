import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import StockTabs from "@/Components/StockTabs";
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Clock, RotateCcw, ShieldCheck, Boxes, ChevronDown, X, Search } from 'lucide-react';

export default function Index({ stocks, stats, storeType = 'retail' }) {
    const { flash } = usePage().props;
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
        if (avail <= 0) return { label: 'Habis', cls: 'bg-red-100 text-destructive' };
        if (s.product?.track_stock && avail <= (s.product?.stock_minimum || 0)) {
            return { label: 'Menipis', cls: 'bg-amber-100 text-amber-700' };
        }
        return { label: 'Aman', cls: 'bg-emerald-100 text-success' };
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

    return (
        <AuthenticatedLayout>
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
                action={
                    <Link
                        href={route('admin.stock.movements')}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                        <Clock className="h-4 w-4" strokeWidth={1.8} />
                        Riwayat Pergerakan
                    </Link>
                }
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
                <div className="rounded-2xl border border-border border-l-4 border-l-primary-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Item</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total_items?.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-amber-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Stok Menipis</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.low_stock}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-red-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Stok Habis</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.out_of_stock}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-emerald-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Nilai Stok</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(stats.total_value)}</p>
                </div>
            </div>

            {/* Sub-navigation */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link href={route('admin.stock-adjustments.index')} className="group overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-100">
                            <RotateCcw className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Penyesuaian Stok</p>
                            <p className="text-xs text-muted-foreground">Koreksi selisih stok sistem vs aktual</p>
                        </div>
                    </div>
                </Link>
                <Link href={route('admin.stock-opnames.index')} className="group overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-100">
                            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Opname Stok</p>
                            <p className="text-xs text-muted-foreground">Hitung fisik dan selisih stok</p>
                        </div>
                    </div>
                </Link>
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
                                        ? 'border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100'
                                        : 'border-border bg-card text-foreground hover:bg-muted'
                                }`}
                            >
                                <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                <span className="max-w-[200px] truncate">{selectedProduct ? selectedProduct.name : `Semua ${ITEM_LABEL}`}</span>
                                {selectedProduct ? (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedProductId(''); }} className="ml-1 rounded-full p-0.5 text-primary-400 hover:bg-primary-100 hover:text-primary-600">
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
                                                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto p-1.5">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedProductId(''); setDropdownOpen(false); setDropdownSearch(''); }}
                                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                !selectedProductId ? 'bg-primary-50 font-semibold text-primary-700' : 'text-muted-foreground hover:bg-muted'
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
                                                        selectedProductId === p.id ? 'bg-primary-50 font-semibold text-primary-700' : 'text-muted-foreground hover:bg-muted'
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
                                className="block w-full rounded-xl border border-border py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ITEM_LABEL}</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reserved</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tersedia</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min. Stok</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
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
                                            <tr key={s.id} className="transition hover:bg-muted/50">
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <p className="text-sm font-semibold text-foreground">{s.product?.name}</p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{s.product?.sku || '—'}</td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-foreground">{(s.quantity || 0).toLocaleString('id-ID')}</td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{(s.reserved_quantity || 0).toLocaleString('id-ID')}</td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-foreground">{available.toLocaleString('id-ID')}</td>
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
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">{s.product?.name}</p>
                                            {s.product?.sku && (
                                                <p className="font-mono text-xs text-muted-foreground">{s.product.sku}</p>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="text-muted-foreground">Stok</p>
                                            <p className="mt-0.5 font-medium text-foreground">{(s.quantity || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-muted-foreground">Reserved</p>
                                            <p className="mt-0.5 text-muted-foreground">{(s.reserved_quantity || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Tersedia</p>
                                            <p className="mt-0.5 font-semibold text-foreground">{available.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-muted-foreground">Min. Stok</p>
                                            <p className="mt-0.5 text-muted-foreground">{s.product?.stock_minimum ?? 0}</p>
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
