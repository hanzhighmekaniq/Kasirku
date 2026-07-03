import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';

export default function Create({ products }) {
    const { flash } = usePage().props;
    const [selectedProduct, setSelectedProduct] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        adjustment_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: '',
        items: [],
    });

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

    const availableProducts = useMemo(() => products.filter((p) => !data.items.some((i) => i.product_id === p.id)), [products, data.items]);

    const filteredProds = useMemo(() => {
        if (!prodSearch) return availableProducts;
        const q = prodSearch.toLowerCase();
        return availableProducts.filter((p) =>
            p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
        );
    }, [availableProducts, prodSearch]);

    const selectedProductObj = useMemo(() => products.find((p) => p.id === Number(selectedProduct)), [products, selectedProduct]);

    const addItem = () => {
        if (!selectedProduct) return;
        const product = products.find((p) => p.id === Number(selectedProduct));
        if (!product) return;
        if (data.items.some((i) => i.product_id === product.id)) return;

        // Get current stock from product.stocks
        const currentStock = product.stocks?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;

        setData('items', [...data.items, {
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            system_qty: currentStock,
            actual_qty: currentStock,
            unit_cost: Number(product.cost_price) || 0,
            notes: '',
        }]);
        setSelectedProduct('');
    };

    const removeItem = (idx) => {
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...data.items];
        updated[idx] = { ...updated[idx], [field]: field === 'notes' ? value : (Number(value) || 0) };
        setData('items', updated);
    };

    const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const totalDiff = useMemo(() =>
        data.items.reduce((sum, item) => sum + (item.actual_qty - item.system_qty), 0),
    [data.items]);

    const totalLoss = useMemo(() =>
        data.items.reduce((sum, item) => {
            const diff = item.actual_qty - item.system_qty;
            return sum + (diff < 0 ? Math.abs(diff) * item.unit_cost : 0);
        }, 0),
    [data.items]);

    const totalGain = useMemo(() =>
        data.items.reduce((sum, item) => {
            const diff = item.actual_qty - item.system_qty;
            return sum + (diff > 0 ? diff * item.unit_cost : 0);
        }, 0),
    [data.items]);

    const submit = (e) => {
        e.preventDefault();
        if (data.items.length === 0) return;
        post(route('admin.stock-adjustments.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('admin.stock-adjustments.index')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Kembali">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Buat Penyesuaian Stok</h2>
                </div>
            }
        >
            <Head title="Buat Penyesuaian Stok" />

            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Main */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* Info */}
                        <SectionCard title="Informasi Penyesuaian">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Tanggal" required error={errors.adjustment_date}>
                                    <input type="date" value={data.adjustment_date} onChange={(e) => setData('adjustment_date', e.target.value)} className={inputCls(!!errors.adjustment_date)} />
                                </Field>
                                <div />
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Alasan" error={errors.reason}>
                                    <input type="text" value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="Contoh: Kerusakan, Selisih audit..." className={inputCls(!!errors.reason)} />
                                </Field>
                                <Field label="Catatan" error={errors.notes}>
                                    <input type="text" value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Catatan tambahan..." className={inputCls(!!errors.notes)} />
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Items */}
                        <SectionCard title="Item Penyesuaian" subtitle="Masukkan stok sistem dan stok aktual">
                            <div className="space-y-4">
                                {/* Add item row */}
                                <div className="flex items-end gap-3">
                                    <div className="relative flex-1" ref={prodDropdownRef}>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Produk</label>
                                        <button
                                            type="button"
                                            onClick={() => { setProdDropdownOpen(!prodDropdownOpen); setProdSearch(''); }}
                                            className="flex w-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                                        >
                                            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                                            <span className="flex-1 truncate text-left">{selectedProduct ? products.find((p) => p.id === Number(selectedProduct))?.name : 'Pilih Produk'}</span>
                                            <svg className={`h-4 w-4 shrink-0 text-slate-400 transition ${prodDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                        </button>
                                        {prodDropdownOpen && (
                                            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
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
                                                    {filteredProds.length === 0 ? (
                                                        <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada produk ditemukan.</p>
                                                    ) : (
                                                        filteredProds.map((p) => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => { setSelectedProduct(p.id); setProdDropdownOpen(false); setProdSearch(''); }}
                                                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                                                    Number(selectedProduct) === p.id ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
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
                                    <button type="button" onClick={addItem} disabled={!selectedProduct} className="rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50">
                                        + Tambah
                                    </button>
                                </div>

                                {errors.items && <p className="text-xs text-red-500">{typeof errors.items === 'string' ? errors.items : 'Minimal 1 item harus ditambahkan'}</p>}

                                {data.items.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm text-slate-400">
                                        Belum ada item. Pilih produk di atas untuk menambahkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.items.map((item, idx) => {
                                            const diff = item.actual_qty - item.system_qty;
                                            return (
                                                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">{item.product_name}</p>
                                                            <p className="text-xs text-slate-400">{item.product_sku}</p>
                                                        </div>
                                                        <button type="button" onClick={() => removeItem(idx)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="mb-1 block text-xs text-slate-500">Stok Sistem</label>
                                                            <input type="number" value={item.system_qty} onChange={(e) => updateItem(idx, 'system_qty', e.target.value)} min="0" className="h-9 w-full rounded-lg border border-slate-300 px-2 text-center text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs text-slate-500">Stok Aktual</label>
                                                            <input type="number" value={item.actual_qty} onChange={(e) => updateItem(idx, 'actual_qty', e.target.value)} min="0" className="h-9 w-full rounded-lg border border-slate-300 px-2 text-center text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs text-slate-500">Selisih</label>
                                                            <div className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold ${diff > 0 ? 'bg-emerald-100 text-emerald-700' : diff < 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                {diff > 0 ? '+' : ''}{diff}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between text-xs">
                                                        <span className="text-slate-400">Modal: {fmtCurrency(item.unit_cost)}/unit</span>
                                                        {diff !== 0 && (
                                                            <span className={`font-medium ${diff < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                {diff < 0 ? '-' : '+'}{fmtCurrency(Math.abs(diff) * item.unit_cost)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-slate-500">Item</dt><dd className="font-medium text-slate-700">{data.items.length} produk</dd></div>
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex justify-between">
                                    <dt className="font-semibold text-slate-700">Total Selisih</dt>
                                    <dd className={`text-lg font-bold ${totalDiff > 0 ? 'text-emerald-600' : totalDiff < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                        {totalDiff > 0 ? '+' : ''}{totalDiff}
                                    </dd>
                                </div>
                                {(totalLoss > 0 || totalGain > 0) && (
                                    <div className="my-2 border-t border-slate-100" />
                                )}
                                {totalLoss > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-red-600">Nilai Kerugian</dt>
                                        <dd className="font-semibold text-red-600">{fmtCurrency(totalLoss)}</dd>
                                    </div>
                                )}
                                {totalGain > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-emerald-600">Nilai Penambahan</dt>
                                        <dd className="font-semibold text-emerald-600">{fmtCurrency(totalGain)}</dd>
                                    </div>
                                )}
                                <p className="text-xs text-slate-400">
                                    {totalDiff > 0 ? 'Stok akan bertambah jika disetujui' : totalDiff < 0 ? 'Stok akan berkurang jika disetujui' : 'Tidak ada selisih'}
                                </p>
                            </dl>
                        </SectionCard>

                        <div className="flex flex-col gap-2">
                            <button type="submit" disabled={processing || data.items.length === 0} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60">
                                {processing ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                            </button>
                            <Link href={route('admin.stock-adjustments.index')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function SectionCard({ title, subtitle, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function inputCls(hasError) {
    return `block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`;
}
