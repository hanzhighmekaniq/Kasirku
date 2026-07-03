import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';

export default function Index({ stocks, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

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
        if (avail <= 0) return { label: 'Habis', cls: 'bg-red-100 text-red-700' };
        if (s.product?.track_stock && avail <= (s.product?.stock_minimum || 0)) {
            return { label: 'Menipis', cls: 'bg-amber-100 text-amber-700' };
        }
        return { label: 'Aman', cls: 'bg-emerald-100 text-emerald-700' };
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Stok Produk</h2>
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.stock.movements')} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Riwayat Pergerakan
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Stok Produk" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            {/* Sub-navigation cards */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link href={route('admin.stock-adjustments.index')} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Penyesuaian Stok</p>
                            <p className="text-xs text-slate-400">Koreksi selisih stok sistem vs aktual</p>
                        </div>
                    </div>
                </Link>
                <Link href={route('admin.stock-opnames.index')} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-100">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Opname Stok</p>
                            <p className="text-xs text-slate-400">Hitung fisik dan selisih stok</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Summary cards */}
            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard title="Total Produk" value={stats.total_products} icon="product" color="indigo" />
                <StatCard title="Total Item" value={stats.total_items?.toLocaleString('id-ID')} icon="box" color="slate" />
                <StatCard title="Stok Menipis" value={stats.low_stock} icon="warn" color="amber" />
                <StatCard title="Stok Habis" value={stats.out_of_stock} icon="danger" color="red" />
                <StatCard title="Total Nilai Stok" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.total_value || 0)} icon="value" color="emerald" />
            </div>

            {/* Filter bar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Product combobox dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => { setDropdownOpen(!dropdownOpen); setDropdownSearch(''); }}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-sm transition ${
                            selectedProduct
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                        <span className="truncate max-w-[200px]">{selectedProduct ? selectedProduct.name : 'Semua Produk'}</span>
                        {selectedProduct ? (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedProductId(''); }} className="ml-1 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        ) : (
                            <svg className={`h-4 w-4 shrink-0 text-slate-400 transition ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        )}
                    </button>
                    {dropdownOpen && (
                        <div className="absolute z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
                            {/* Search inside dropdown */}
                            <div className="border-b border-slate-100 p-3">
                                <div className="relative">
                                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={dropdownSearch}
                                        onChange={(e) => setDropdownSearch(e.target.value)}
                                        placeholder="Cari nama atau SKU..."
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                            </div>
                            {/* Option list */}
                            <div className="max-h-72 overflow-y-auto p-1.5">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedProductId(''); setDropdownOpen(false); setDropdownSearch(''); }}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                        !selectedProductId ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Semua Produk
                                </button>
                                {dropdownProducts.length === 0 ? (
                                    <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada produk ditemukan.</p>
                                ) : (
                                    dropdownProducts.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => { setSelectedProductId(p.id); setDropdownOpen(false); setDropdownSearch(''); }}
                                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                selectedProductId === p.id ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
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

                <div className="relative flex-1">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk (nama / SKU)..." className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                </div>
            </div>

            {/* Product stock table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th className="px-6 py-3.5 font-medium text-slate-500">Produk</th>
                                <th className="px-6 py-3.5 font-medium text-slate-500">SKU</th>
                                <th className="px-6 py-3.5 text-right font-medium text-slate-500">Stok</th>
                                <th className="px-6 py-3.5 text-right font-medium text-slate-500">Reserved</th>
                                <th className="px-6 py-3.5 text-right font-medium text-slate-500">Tersedia</th>
                                <th className="px-6 py-3.5 text-right font-medium text-slate-500">Min. Stok</th>
                                <th className="px-6 py-3.5 text-center font-medium text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                                        {search ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Belum ada data stok.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s) => {
                                    const status = getStatus(s);
                                    const available = getAvailable(s);
                                    return (
                                        <tr key={s.id} className="transition hover:bg-slate-50/50">
                                            <td className="px-6 py-3.5">
                                                <p className="font-medium text-slate-800">{s.product?.name}</p>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-500">{s.product?.sku}</td>
                                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">{(s.quantity || 0).toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-3.5 text-right text-slate-500">{(s.reserved_quantity || 0).toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-3.5 text-right font-semibold text-slate-800">{available.toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-3.5 text-right text-slate-500">{s.product?.stock_minimum ?? 0}</td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, icon, color }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        slate: 'bg-slate-100 text-slate-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500">{title}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
                    {icon === 'product' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
                    {icon === 'box' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>}
                    {icon === 'warn' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
                    {icon === 'danger' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                    {icon === 'value' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
            </div>
        </div>
    );
}
