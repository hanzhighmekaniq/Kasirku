import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import SelectDropdown from "@/Components/ui/SelectDropdown";

const MOVEMENT_TYPES = {
    purchase_in:         { label: 'Pembelian Masuk',        color: 'bg-emerald-100 text-success', icon: 'arrow-down',  desc: 'Stok bertambah karena pembelian dari supplier' },
    purchase_out:        { label: 'Pembelian Dibatalkan',    color: 'bg-red-100 text-destructive',         icon: 'arrow-up',    desc: 'Pembelian dibatalkan, stok dikurangi' },
    sale_out:            { label: 'Penjualan',              color: 'bg-rose-100 text-rose-700',       icon: 'arrow-up',    desc: 'Stok berkurang karena penjualan ke pelanggan' },
    adjustment_in:       { label: 'Penyesuaian +',          color: 'bg-blue-100 text-blue-700',       icon: 'arrow-down',  desc: 'Stok ditambah dari hasil penyesuaian/oprasi' },
    adjustment_out:      { label: 'Penyesuaian -',          color: 'bg-amber-100 text-amber-700',     icon: 'arrow-up',    desc: 'Stok dikurangi dari hasil penyesuaian/oprasi' },
    transfer_in:         { label: 'Transfer Masuk',         color: 'bg-teal-100 text-teal-700',       icon: 'arrow-down',  desc: 'Stok diterima dari cabang lain' },
    transfer_out:        { label: 'Transfer Keluar',        color: 'bg-orange-100 text-orange-700',   icon: 'arrow-up',    desc: 'Stok dikirim ke cabang lain' },
    return_in:           { label: 'Retur Masuk',            color: 'bg-purple-100 text-purple-700',   icon: 'arrow-down',  desc: 'Retur pembelian dibatalkan, stok dikembalikan' },
    return_out:          { label: 'Retur ke Supplier',      color: 'bg-pink-100 text-pink-700',       icon: 'arrow-up',    desc: 'Stok dikembalikan ke supplier karena retur' },
    waste:               { label: 'Waste / Rusak',          color: 'bg-gray-100 text-gray-600',       icon: 'arrow-up',    desc: 'Stok hilang/rusak/tumpah, dicatat sebagai waste' },
    opname_adjustment:   { label: 'Opname Stok',            color: 'bg-primary-100 text-primary-700',   icon: 'arrow-down',  desc: 'Koreksi stok dari hasil penghitungan fisik' },
};

export default function Movements({ movements, products }) {
    const { flash } = usePage().props;
    const [filters, setFilters] = useState({
        product_id: '',
        movement_type: '',
        from_date: '',
        to_date: '',
    });
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
        if (dropdownOpen && searchInputRef.current) searchInputRef.current.focus();
    }, [dropdownOpen]);

    // Filtered products in dropdown
    const dropdownProducts = useMemo(() => {
        if (!dropdownSearch) return products;
        const q = dropdownSearch.toLowerCase();
        return products.filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }, [products, dropdownSearch]);

    const selectedProduct = filters.product_id ? products.find((p) => p.id === Number(filters.product_id)) : null;

    const handleFilter = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        const params = {};
        Object.entries(newFilters).forEach(([k, v]) => { if (v) params[k] = v; });
        router.get(route('admin.stock.movements'), params, { preserveState: true, replace: true });
    };

    const isIn = (type) => ['purchase_in', 'adjustment_in', 'transfer_in', 'return_in', 'opname_adjustment'].includes(type);

    // Compute summary from current page data
    const summary = useMemo(() => {
        let totalIn = 0;
        let totalOut = 0;
        movements.data.forEach((m) => {
            const absQty = Math.abs(m.quantity);
            if (isIn(m.movement_type)) totalIn += absQty;
            else totalOut += absQty;
        });
        return { totalIn, totalOut };
    }, [movements.data]);

    const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const fmtTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const hasActiveFilter = filters.product_id || filters.movement_type || filters.from_date || filters.to_date;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.stock.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Riwayat Pergerakan Stok</h2>
                        <p className="text-xs text-muted-foreground">Catatan setiap perubahan jumlah stok di gudang ini</p>
                    </div>
                </div>
            }
        >
            <Head title="Riwayat Pergerakan Stok" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>
            )}

            {/* Info Box */}
            <div className="mb-5 rounded-2xl border border-primary-100 bg-primary-50/50 px-5 py-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-primary-800">Apa itu Pergerakan Stok (Stock Movement)?</p>
                        <p className="mt-1 text-xs leading-relaxed text-primary-600/80">
                            Setiap kali stok suatu produk berubah — entah masuk karena pembelian, keluar karena penjualan, dipindah antar cabang, atau dikoreksi karena penyesuaian/opname — sistem akan mencatat satu baris "pergerakan" di sini.
                            Ini adalah <span className="font-semibold">audit trail</span> (jejak audit) yang memungkinkan Anda melihat riwayat lengkap dari mana stok berasal dan ke mana stok pergi, lengkap dengan tanggal, jumlah, dan referensi dokumennya.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Filter</p>
                    {hasActiveFilter && (
                        <button onClick={() => { setFilters({ product_id: '', movement_type: '', from_date: '', to_date: '' }); router.get(route('admin.stock.movements'), {}, { preserveState: true, replace: true }); }} className="text-xs font-medium text-primary-600 transition hover:text-primary-800">
                            Reset Semua
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    {/* Product combobox dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => { setDropdownOpen(!dropdownOpen); setDropdownSearch(''); }}
                            className={`inline-flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium shadow-sm transition ${
                                selectedProduct
                                    ? 'border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100'
                                    : 'border-border bg-card text-foreground hover:bg-muted'
                            }`}
                        >
                            <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                            <span className="truncate max-w-[180px]">{selectedProduct ? selectedProduct.name : 'Semua Produk'}</span>
                            {selectedProduct ? (
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleFilter('product_id', ''); }} className="ml-auto rounded-full p-0.5 text-primary-400 hover:bg-primary-100 hover:text-primary-600">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            ) : (
                                <svg className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                            )}
                        </button>
                        {dropdownOpen && (
                            <div className="absolute z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-xl">
                                <div className="border-b border-border p-3">
                                    <div className="relative">
                                        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={dropdownSearch}
                                            onChange={(e) => setDropdownSearch(e.target.value)}
                                            placeholder="Cari nama atau SKU..."
                                            className="w-full rounded-lg border border-border bg-muted py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-72 overflow-y-auto p-1.5">
                                    <button
                                        type="button"
                                        onClick={() => { handleFilter('product_id', ''); setDropdownOpen(false); setDropdownSearch(''); }}
                                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                            !filters.product_id ? 'bg-primary-50 font-semibold text-primary-700' : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        Semua Produk
                                    </button>
                                    {dropdownProducts.length === 0 ? (
                                        <p className="px-3 py-4 text-center text-xs text-muted-foreground">Tidak ada produk ditemukan.</p>
                                    ) : (
                                        dropdownProducts.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => { handleFilter('product_id', p.id); setDropdownOpen(false); setDropdownSearch(''); }}
                                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                    filters.product_id == p.id ? 'bg-primary-50 font-semibold text-primary-700' : 'text-muted-foreground hover:bg-muted'
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
                    <SelectDropdown
                        value={filters.movement_type}
                        options={Object.entries(MOVEMENT_TYPES).map(([k, v]) => ({ value: k, label: v.label }))}
                        onChange={(v) => handleFilter('movement_type', v)}
                        placeholder="Semua Tipe"
                    />
                    <input type="date" value={filters.from_date} onChange={(e) => handleFilter('from_date', e.target.value)} className="rounded-xl border border-border px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20" />
                    <input type="date" value={filters.to_date} onChange={(e) => handleFilter('to_date', e.target.value)} className="rounded-xl border border-border px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20" />
                </div>
            </div>

            {/* Summary cards */}
            {movements.data.length > 0 && (
                <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <p className="text-xs font-medium text-muted-foreground">Total Records</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{movements.total.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="rounded-2xl border border-success/20 bg-success/10/50 p-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                                <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                            </div>
                            <p className="text-xs font-medium text-emerald-600">Stok Masuk (halaman ini)</p>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-success">+{summary.totalIn.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
                                <svg className="h-3.5 w-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                            </div>
                            <p className="text-xs font-medium text-rose-600">Stok Keluar (halaman ini)</p>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-rose-700">-{summary.totalOut.toLocaleString('id-ID')}</p>
                    </div>
                </div>
            )}

            {/* Movements table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-6 py-3.5 font-medium text-muted-foreground">Waktu</th>
                                <th className="px-6 py-3.5 font-medium text-muted-foreground">Produk</th>
                                <th className="px-6 py-3.5 font-medium text-muted-foreground">Tipe</th>
                                <th className="px-6 py-3.5 font-medium text-muted-foreground">Cabang</th>
                                <th className="px-6 py-3.5 text-right font-medium text-muted-foreground">Jumlah</th>
                                <th className="px-6 py-3.5 font-medium text-muted-foreground">No. Ref</th>
                                <th className="px-6 py-3.5 font-medium text-muted-foreground">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {movements.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="h-10 w-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                                            <p className="text-sm text-muted-foreground">Tidak ada data pergerakan stok.</p>
                                            {hasActiveFilter && <p className="text-xs text-muted-foreground/50">Coba ubah filter yang dipilih.</p>}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                movements.data.map((m) => {
                                    const typeInfo = MOVEMENT_TYPES[m.movement_type] || { label: m.movement_type, color: 'bg-muted text-muted-foreground', desc: '' };
                                    const inBound = isIn(m.movement_type);
                                    return (
                                        <tr key={m.id} className="transition hover:bg-muted/50">
                                            <td className="px-6 py-3.5">
                                                <p className="text-foreground">{fmtDate(m.moved_at)}</p>
                                                <p className="text-xs text-muted-foreground">{fmtTime(m.moved_at)}</p>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <p className="font-medium text-foreground">{m.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">{m.product?.sku}</p>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                                {typeInfo.desc && <p className="mt-0.5 max-w-[200px] text-[10px] leading-tight text-muted-foreground">{typeInfo.desc}</p>}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-xs text-muted-foreground">{m.branch?.name ?? '-'}</span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                {(() => {
                                                    const absQty = Math.abs(m.quantity);
                                                    return (
                                                        <span className={`inline-flex items-center gap-1 text-sm font-bold ${inBound ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {inBound ? (
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                                                            ) : (
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                                                            )}
                                                            {inBound ? '+' : '-'}{absQty.toLocaleString('id-ID')}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{m.reference_no ?? '-'}</span>
                                            </td>
                                            <td className="max-w-[240px] px-6 py-3.5 text-xs text-muted-foreground" title={m.notes ?? ''}>
                                                <p className="truncate">{m.notes ?? '-'}</p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {movements.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-6 py-3">
                        <p className="text-xs text-muted-foreground">Menampilkan {movements.from}–{movements.to} dari {movements.total.toLocaleString('id-ID')} record</p>
                        <div className="flex gap-1">
                            {movements.links.map((link, i) => (
                                link.url ? (
                                    <Link key={i} href={link.url} className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${link.active ? 'bg-primary-500 text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs text-muted-foreground/50" dangerouslySetInnerHTML={{ __html: link.label }} />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
