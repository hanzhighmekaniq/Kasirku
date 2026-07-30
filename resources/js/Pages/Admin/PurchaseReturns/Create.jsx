import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import Button from "@/Components/ui/Button";
import DatePicker from "@/Components/ui/DatePicker";
import Checkbox from "@/Components/ui/Checkbox";
import { Loader2, Search, ShoppingCart, X } from "lucide-react";
import { format } from "date-fns";

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
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Pembelian Asal <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary">{selected.purchase_no}</p>
                        <p className="text-xs text-muted-foreground">{selected.supplier?.name} &bull; {selected.items_count} item &bull; {formatDate(selected.purchase_date)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Ganti pembelian"
                    >
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
                Pembelian Asal <span className="text-destructive">*</span>
            </label>
            <div className="relative">
                <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); setIdx(0); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKey}
                    placeholder="Ketik nomor pembelian atau nama supplier…"
                    className="block w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    autoComplete="off"
                />
            </div>

            {open && (
                <div className="absolute z-40 mt-1.5 max-h-72 w-full overflow-y-auto rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
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
                                i === idx ? 'bg-primary/10' : 'hover:bg-muted'
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <p className={`truncate font-medium ${i === idx ? 'text-primary' : 'text-foreground'}`}>
                                    {p.purchase_no}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {p.supplier?.name || '-'} &bull; {p.items_count} item
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {formatDate(p.purchase_date)}
                            </span>
                        </button>
                    ))}
                    {purchases.length > 30 && (
                        <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
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
        `block w-full rounded-xl border bg-background text-sm shadow-sm transition focus:ring-2 ${
            errors[field]
                ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                : 'border-input focus:border-ring focus:ring-ring/20'
        }`;

    return (
        <AuthenticatedLayout
            backUrl={route("admin.purchase-returns.index")}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        {pageTitle}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Buat
                    </div>
                </div>
            }>
            <PageHeader
                title={`Buat ${pageTitle}`}
                breadcrumbs={["Admin", pageTitle, "Buat"]}
                heading={
                    <>
                        Buat{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {pageTitle}
                        </span>
                    </>
                }
                description="Pilih pembelian asal dan isi data retur."
                backUrl={route('admin.purchase-returns.index')}
            />

            <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
                {/* Header Info — sengaja TANPA overflow-hidden supaya panel
                    combobox pembelian bisa keluar dari batas card. Kalau
                    dipasang, dropdown-nya terpotong oleh card ini. */}
                <div className="relative z-20 rounded-2xl border border-border bg-card shadow-sm">
                    <div className="rounded-t-2xl border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Informasi Retur</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Pilih pembelian asal dan isi data retur.</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <PurchaseCombobox
                                purchases={purchases}
                                selectedId={data.purchase_id}
                                onSelect={(val) => handlePurchaseChange(val)}
                            />

                            <div>
                                <label className="block text-sm font-medium text-foreground">
                                    Tanggal Retur <span className="text-destructive">*</span>
                                </label>
                                <div className="mt-1.5">
                                    <DatePicker
                                        value={data.return_date ? new Date(data.return_date) : null}
                                        onChange={(d) => setData('return_date', d ? format(d, 'yyyy-MM-dd') : '')}
                                        placeholder="Pilih tanggal retur"
                                    />
                                </div>
                                {errors.return_date && <p className="mt-1.5 text-sm text-destructive">{errors.return_date}</p>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-foreground">
                                Catatan <span className="text-xs font-normal text-muted-foreground">(opsional)</span>
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
                <div className="relative z-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Item yang Diretur</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Pilih item dari pembelian asal yang akan dikembalikan ke supplier.</p>
                    </div>
                    <div className="p-6">
                        {!data.purchase_id ? (
                            <div className="rounded-xl border border-dashed border-border py-10 text-center">
                                <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                                <p className="mt-3 text-sm text-muted-foreground">Pilih pembelian asal terlebih dahulu</p>
                            </div>
                        ) : loadingItems ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={2} />
                                <span className="ml-3 text-sm text-muted-foreground">Memuat item pembelian...</span>
                            </div>
                        ) : purchaseItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border py-10 text-center">
                                <p className="text-sm text-muted-foreground">Tidak ada item pada pembelian ini</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {purchaseItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-xl border p-4 transition ${
                                            item.selected ? 'border-primary/20 bg-primary/10' : 'border-border hover:border-border'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="pt-0.5">
                                                <Checkbox
                                                    checked={item.selected}
                                                    onChange={() => toggleItem(idx)}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                                                        {/* Variant & satuan ditampilkan seperti BucketItemLabel di
                                                            StockBucketPicker supaya multi-satuan tidak ambigu. */}
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                                            {item.variant_name && (
                                                                <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                                    {item.variant_name}
                                                                </span>
                                                            )}
                                                            {item.packaging_unit_name && (
                                                                <span className="inline-flex items-center rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                                                                    {item.packaging_unit_name}
                                                                </span>
                                                            )}
                                                            <span className="truncate font-mono text-[11px] text-muted-foreground">
                                                                {item.product_sku}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 sm:text-right">
                                                        <p className="text-sm font-medium text-muted-foreground">Beli: {item.quantity}</p>
                                                        {item.returned_qty > 0 && (
                                                            <p className="text-xs text-warning">Sudah diretur: {item.returned_qty}</p>
                                                        )}
                                                        <p className={`text-xs font-medium ${item.returnable_qty > 0 ? 'text-success' : 'text-destructive'}`}>
                                                            Sisa bisa diretur: {item.returnable_qty}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatRupiah(item.cost_price)}
                                                            {item.packaging_unit_name ? ` / ${item.packaging_unit_name}` : ' / pcs'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {item.selected && (
                                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <label className="block text-xs font-medium text-muted-foreground">
                                                                Jumlah Retur <span className="text-destructive">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.returnable_qty}
                                                                value={item.return_qty || ''}
                                                                onChange={(e) => updateQty(idx, parseInt(e.target.value) || 0)}
                                                                disabled={item.returnable_qty <= 0}
                                                                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:bg-muted disabled:text-muted-foreground"
                                                            />
                                                            <p className="mt-1 text-xs text-muted-foreground">Maks: {item.returnable_qty}</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-muted-foreground">
                                                                Alasan Retur
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.reason || ''}
                                                                onChange={(e) => updateReason(idx, e.target.value)}
                                                                placeholder="Rusak, tidak sesuai, dll."
                                                                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
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

                        {errors.items && <p className="mt-2 text-sm text-destructive">{errors.items}</p>}
                    </div>
                </div>

                {/* Summary */}
                {selectedItems.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Ringkasan Retur</h3>
                            <div className="space-y-2">
                                {selectedItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {item.product_name} × {item.return_qty}
                                        </span>
                                        <span className="font-medium text-foreground">{formatRupiah(item.return_qty * item.cost_price)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-border pt-2 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-foreground">Total Retur</span>
                                        <span className="text-lg font-bold text-primary">{formatRupiah(subtotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                    <Link
                        href={route('admin.purchase-returns.index')}
                        className="inline-flex justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                        Batal
                    </Link>
                    <Button
                        type="submit"
                        loading={processing}
                        disabled={selectedItems.length === 0}
                    >
                        Simpan Retur
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
