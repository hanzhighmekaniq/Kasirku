import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState, useMemo, useRef } from 'react';

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Purchase Combobox ──────────────────────────────── */
function PurchaseCombobox({ purchases, selectedId, onSelect }) {
    const [query, setQuery]     = useState('');
    const [open, setOpen]       = useState(false);
    const [idx, setIdx]         = useState(0);
    const containerRef          = useRef(null);
    const inputRef              = useRef(null);

    const selected = purchases.find((p) => p.id === Number(selectedId));

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = !q ? purchases : purchases.filter((p) =>
            p.purchase_no?.toLowerCase().includes(q) ||
            p.supplier?.name?.toLowerCase().includes(q)
        );
        return list.slice(0, 30);
    }, [query, purchases]);

    useEffect(() => {
        const fn = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const pick = (p) => {
        onSelect(String(p.id));
        setQuery('');
        setOpen(false);
        setIdx(0);
    };

    const clearSelection = () => {
        onSelect('');
        setQuery('');
        inputRef.current?.focus();
    };

    const onKey = (e) => {
        if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true); return; }
        if (e.key === 'ArrowDown')       { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp')    { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter')      { e.preventDefault(); if (filtered[idx]) pick(filtered[idx]); }
        else if (e.key === 'Escape')     { setOpen(false); }
    };

    // If already selected and dropdown not open, show selection summary
    if (selected && !open) {
        return (
            <div ref={containerRef}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Pembelian Asal <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/40 px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-indigo-700">{selected.purchase_no}</p>
                        <p className="text-xs text-slate-500">{selected.supplier?.name} &bull; {selected.items_count} item &bull; {formatDate(selected.purchase_date)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                        title="Ganti pembelian"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Pembelian Asal <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <svg className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); setIdx(0); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKey}
                    placeholder="Ketik nomor pembelian atau nama supplier…"
                    className="block w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    autoComplete="off"
                />
            </div>

            {open && (
                <div className="absolute z-40 mt-1.5 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">
                            Pembelian tidak ditemukan
                        </div>
                    ) : filtered.map((p, i) => (
                        <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pick(p)}
                            onMouseEnter={() => setIdx(i)}
                            className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                                i === idx ? 'bg-indigo-50' : 'hover:bg-slate-50'
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <p className={`truncate font-medium ${i === idx ? 'text-indigo-700' : 'text-slate-800'}`}>
                                    {p.purchase_no}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {p.supplier?.name || '-'} &bull; {p.items_count} item
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-slate-400">
                                {formatDate(p.purchase_date)}
                            </span>
                        </button>
                    ))}
                    {purchases.length > 30 && (
                        <div className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400">
                            Ketik untuk menyaring lebih lanjut
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const PAGE_TITLE = {
    retail: 'Retur Pembelian',
    fnb: 'Retur Bahan Baku',
    rental: 'Retur Pembelian Unit',
};

export default function Create({ purchases, storeType = 'retail' }) {
    const pageTitle = PAGE_TITLE[storeType] ?? 'Retur Pembelian';
    const { data, setData, post, processing, errors } = useForm({
        purchase_id: '',
        return_date: new Date().toISOString().slice(0, 10),
        notes: '',
        items: [],
    });

    const [purchaseItems, setPurchaseItems] = useState([]);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [loadingItems, setLoadingItems] = useState(false);

    // When purchase is selected, fetch its items
    const handlePurchaseChange = (purchaseId) => {
        setData('purchase_id', purchaseId);
        setData('items', []);
        setPurchaseItems([]);

        if (!purchaseId) {
            setSelectedPurchase(null);
            return;
        }

        const purchase = purchases.find((p) => p.id === Number(purchaseId));
        setSelectedPurchase(purchase || null);

        setLoadingItems(true);
        fetch(route('admin.purchase-returns.getPurchaseItems', purchaseId))
            .then((res) => res.json())
            .then((json) => {
                setPurchaseItems(json.purchase.items.map((item) => ({
                    ...item,
                    selected: false,
                    return_qty: 0,
                    reason: '',
                })));
            })
            .finally(() => setLoadingItems(false));
    };

    // Toggle item selection
    const toggleItem = (index) => {
        const updated = [...purchaseItems];
        updated[index].selected = !updated[index].selected;
        if (!updated[index].selected) {
            updated[index].return_qty = 0;
            updated[index].reason = '';
        } else {
            updated[index].return_qty = updated[index].returnable_qty;
        }
        setPurchaseItems(updated);
        syncItems(updated);
    };

    // Update return quantity
    const updateQty = (index, qty) => {
        const updated = [...purchaseItems];
        updated[index].return_qty = Math.max(0, Math.min(qty, updated[index].returnable_qty));
        setPurchaseItems(updated);
        syncItems(updated);
    };

    // Update reason
    const updateReason = (index, reason) => {
        const updated = [...purchaseItems];
        updated[index].reason = reason;
        setPurchaseItems(updated);
        syncItems(updated);
    };

    // Sync purchase items to form data
    const syncItems = (items) => {
        setData('items', items
            .filter((item) => item.selected && item.return_qty > 0)
            .map((item) => ({
                product_id: item.product_id,
                purchase_item_id: item.id,
                quantity: item.return_qty,
                cost_price: item.cost_price,
                reason: item.reason,
            }))
        );
    };

    const selectedItems = useMemo(() => purchaseItems.filter((i) => i.selected), [purchaseItems]);
    const subtotal = useMemo(() => selectedItems.reduce((sum, i) => sum + (i.return_qty * i.cost_price), 0), [selectedItems]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.purchase-returns.store'));
    };

    const inputCls = (field) =>
        `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${
            errors[field]
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
        }`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.purchase-returns.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Buat {pageTitle}</h2>
                </div>
            }
        >
            <Head title={`Buat ${pageTitle}`} />

            <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
                {/* Header Info */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Informasi Retur</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Pilih pembelian asal dan isi data retur.</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <PurchaseCombobox
                                purchases={purchases}
                                selectedId={data.purchase_id}
                                onSelect={(val) => handlePurchaseChange(val)}
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Tanggal Retur <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.return_date}
                                    onChange={(e) => setData('return_date', e.target.value)}
                                    className={`mt-1.5 ${inputCls('return_date')}`}
                                />
                                {errors.return_date && <p className="mt-1.5 text-sm text-red-600">{errors.return_date}</p>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Catatan <span className="text-xs font-normal text-slate-400">(opsional)</span>
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                placeholder="Alasan retur, keterangan tambahan..."
                                className={`mt-1.5 ${inputCls('notes')}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Items Selection */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Item yang Diretur</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Pilih item dari pembelian asal yang akan dikembalikan ke supplier.</p>
                    </div>
                    <div className="p-6">
                        {!data.purchase_id ? (
                            <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
                                <svg className="mx-auto h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272" />
                                </svg>
                                <p className="mt-3 text-sm text-slate-500">Pilih pembelian asal terlebih dahulu</p>
                            </div>
                        ) : loadingItems ? (
                            <div className="flex items-center justify-center py-10">
                                <svg className="h-6 w-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span className="ml-3 text-sm text-slate-500">Memuat item pembelian...</span>
                            </div>
                        ) : purchaseItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
                                <p className="text-sm text-slate-500">Tidak ada item pada pembelian ini</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {purchaseItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-xl border p-4 transition ${
                                            item.selected ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="pt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={item.selected}
                                                    onChange={() => toggleItem(idx)}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{item.product_name}</p>
                                                        <p className="text-xs text-slate-400">SKU: {item.product_sku}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-slate-600">Beli: {item.quantity}</p>
                                                        {item.returned_qty > 0 && (
                                                            <p className="text-xs text-amber-600">Sudah diretur: {item.returned_qty}</p>
                                                        )}
                                                        <p className={`text-xs font-medium ${item.returnable_qty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            Sisa bisa diretur: {item.returnable_qty}
                                                        </p>
                                                        <p className="text-xs text-slate-400">{formatRupiah(item.cost_price)}/pc</p>
                                                    </div>
                                                </div>

                                                {item.selected && (
                                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-600">
                                                                Jumlah Retur <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.returnable_qty}
                                                                value={item.return_qty || ''}
                                                                onChange={(e) => updateQty(idx, parseInt(e.target.value) || 0)}
                                                                disabled={item.returnable_qty <= 0}
                                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-400"
                                                            />
                                                            <p className="mt-1 text-xs text-slate-400">Maks: {item.returnable_qty}</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-600">
                                                                Alasan Retur
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.reason || ''}
                                                                onChange={(e) => updateReason(idx, e.target.value)}
                                                                placeholder="Rusak, tidak sesuai, dll."
                                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.items && <p className="mt-2 text-sm text-red-600">{errors.items}</p>}
                    </div>
                </div>

                {/* Summary */}
                {selectedItems.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Retur</h3>
                            <div className="space-y-2">
                                {selectedItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">
                                            {item.product_name} × {item.return_qty}
                                        </span>
                                        <span className="font-medium text-slate-800">{formatRupiah(item.return_qty * item.cost_price)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-100 pt-2 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">Total Retur</span>
                                        <span className="text-lg font-bold text-indigo-600">{formatRupiah(subtotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <Link
                        href={route('admin.purchase-returns.index')}
                        className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={processing || selectedItems.length === 0}
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Retur'}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
