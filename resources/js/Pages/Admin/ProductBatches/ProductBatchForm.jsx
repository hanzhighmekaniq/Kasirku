import { Link } from '@inertiajs/react';
import { useEffect, useState, useMemo, useRef } from 'react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);

export default function ProductBatchForm({ data, setData, errors, processing, onSubmit, submitLabel = 'Simpan', cancelHref, products, branches }) {
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

    useEffect(() => {
        if (dropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [dropdownOpen]);

    const dropdownProducts = useMemo(() => {
        if (!dropdownSearch) return products;
        const q = dropdownSearch.toLowerCase();
        return products.filter((p) =>
            p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
        );
    }, [products, dropdownSearch]);

    const selectedProduct = data.product_id ? products.find((p) => p.id === Number(data.product_id)) : null;

    // Auto-fill cost_price when product changes
    useEffect(() => {
        if (!data.product_id) return;
        const prod = products.find((p) => p.id === Number(data.product_id));
        if (prod && !data._cost_locked) {
            setData('cost_price', prod.cost_price ?? '');
        }
    }, [data.product_id]);

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* Produk — searchable autocomplete */}
            <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-slate-700">
                    Produk <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : dropdownSearch}
                        onChange={(e) => {
                            setDropdownSearch(e.target.value);
                            if (data.product_id) {
                                setData((d) => ({ ...d, product_id: '', _cost_locked: false }));
                            }
                            if (!dropdownOpen) setDropdownOpen(true);
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        placeholder="Cari produk (nama / SKU)..."
                        className={`block w-full rounded-xl py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:ring-2 ${errors.product_id ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-primary-200'}`}
                    />
                    {selectedProduct && (
                        <button type="button" onClick={() => { setData((d) => ({ ...d, product_id: '', _cost_locked: false })); setDropdownSearch(''); setDropdownOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                {errors.product_id && <p className="mt-1.5 text-sm text-red-600">{errors.product_id}</p>}
                {dropdownOpen && (
                    <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="max-h-72 overflow-y-auto p-1.5">
                            {dropdownProducts.length === 0 ? (
                                <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada produk ditemukan.</p>
                            ) : (
                                dropdownProducts.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setData((d) => ({ ...d, product_id: p.id, _cost_locked: false })); setDropdownSearch(''); setDropdownOpen(false); }}
                                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                            Number(data.product_id) === p.id ? 'bg-primary-50 font-semibold text-primary-700' : 'text-slate-600 hover:bg-slate-50'
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

            {/* Nomor Batch + Cabang */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="batch_no" className="block text-sm font-medium text-slate-700">
                        Nomor Batch <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="batch_no"
                        type="text"
                        value={data.batch_no}
                        onChange={(e) => setData('batch_no', e.target.value)}
                        placeholder="cth. BATCH-20260601-001"
                        className={`mt-1.5 block w-full rounded-xl font-mono text-sm shadow-sm transition focus:ring-2 ${errors.batch_no ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-primary-200'}`}
                    />
                    <p className="mt-1 text-xs text-slate-400">Harus unik per produk.</p>
                    {errors.batch_no && <p className="mt-1 text-sm text-red-600">{errors.batch_no}</p>}
                </div>

                <div>
                    <label htmlFor="branch_id" className="block text-sm font-medium text-slate-700">Cabang</label>
                    <select
                        id="branch_id"
                        value={data.branch_id}
                        onChange={(e) => setData('branch_id', e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    >
                        <option value="">— Semua Cabang —</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tanggal beli + kadaluarsa */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="purchase_date" className="block text-sm font-medium text-slate-700">Tanggal Beli</label>
                    <input
                        id="purchase_date"
                        type="date"
                        value={data.purchase_date}
                        onChange={(e) => setData('purchase_date', e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                    {errors.purchase_date && <p className="mt-1 text-sm text-red-600">{errors.purchase_date}</p>}
                </div>

                <div>
                    <label htmlFor="expiry_date" className="block text-sm font-medium text-slate-700">
                        Tanggal Kadaluarsa
                        <span className="ml-1 text-xs font-normal text-slate-400">(opsional)</span>
                    </label>
                    <input
                        id="expiry_date"
                        type="date"
                        value={data.expiry_date}
                        onChange={(e) => setData('expiry_date', e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                    <p className="mt-1 text-xs text-slate-400">Kosongkan jika produk tidak kadaluarsa.</p>
                    {errors.expiry_date && <p className="mt-1 text-sm text-red-600">{errors.expiry_date}</p>}
                </div>
            </div>

            {/* Jumlah + Harga Pokok */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
                        Jumlah <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="quantity"
                        type="number"
                        min="0"
                        value={data.quantity}
                        onChange={(e) => setData('quantity', e.target.value)}
                        className={`mt-1.5 block w-full rounded-xl shadow-sm transition focus:ring-2 ${errors.quantity ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-primary-200'}`}
                    />
                    {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                </div>

                <div>
                    <label htmlFor="cost_price" className="block text-sm font-medium text-slate-700">
                        Harga Pokok <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1.5">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                        <input
                            id="cost_price"
                            type="number"
                            min="0"
                            step="100"
                            value={data.cost_price}
                            onChange={(e) => setData((d) => ({ ...d, cost_price: e.target.value, _cost_locked: true }))}
                            className={`block w-full rounded-xl pl-10 shadow-sm transition focus:ring-2 ${errors.cost_price ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-primary-200'}`}
                        />
                    </div>
                    {data.product_id && (
                        <p className="mt-1 text-xs text-slate-400">
                            Harga pokok produk: {fmt(products.find((p) => p.id === Number(data.product_id))?.cost_price)}
                        </p>
                    )}
                    {errors.cost_price && <p className="mt-1 text-sm text-red-600">{errors.cost_price}</p>}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link href={cancelHref} className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Batal
                </Link>
                <button type="submit" disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60">
                    {processing ? 'Menyimpan...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
