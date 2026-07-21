import { useState } from "react";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";
import SearchableSelect from "@/Components/ui/SearchableSelect";

export default function QuickStockModal({ product, type, variant: initialVariant, onClose, onSuccess }) {
    const variants = product.variants ?? [];
    const hasVariants = variants.length > 0;

    const [localType, setLocalType] = useState(type || "in");
    const [selectedVariant, setSelectedVariant] = useState(initialVariant || (hasVariants ? null : null));
    const [qty, setQty] = useState("");
    const [costPrice, setCostPrice] = useState(
        initialVariant?.cost_price || product.cost_price || ""
    );
    const [reason, setReason] = useState(
        (type || "in") === "in" ? "received" : "correction",
    );
    const [notes, setNotes] = useState("");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const isIn = localType === "in";
    const qtyNum = Number(qty) || 0;
    const isLargeQty = qtyNum > 100;

    // Active target: variant or product
    const activeTarget = selectedVariant || product;
    const activeName = selectedVariant
        ? `${product.name} — ${selectedVariant.name}`
        : product.name;
    const activeSku = selectedVariant?.sku || product.sku;
    const activeStock = selectedVariant
        ? (selectedVariant.stock ?? 0)
        : (product.stock ?? 0);
    const activeUnit = product.unit;
    const activeCostPrice = selectedVariant?.cost_price || product.cost_price;

    const reasonsIn = [
        { id: "received", name: "Terima Barang" },
        { id: "initial_stock", name: "Stok Awal" },
        { id: "production", name: "Produksi Sendiri" },
        { id: "correction", name: "Koreksi Stok" },
        { id: "other", name: "Lainnya" },
    ];

    const reasonsOut = [
        { id: "correction", name: "Koreksi Stok" },
        { id: "damaged", name: "Barang Rusak" },
        { id: "expired", name: "Barang Expired" },
        { id: "lost", name: "Barang Hilang" },
        { id: "other", name: "Lainnya" },
    ];

    const reasonOptions = isIn ? reasonsIn : reasonsOut;

    const handleTypeChange = (newType) => {
        setLocalType(newType);
        setReason(newType === "in" ? "received" : "correction");
        setCostPrice(activeCostPrice || "");
    };

    const submit = () => {
        if (!qty || Number(qty) <= 0) return;
        setProcessing(true);
        setError(null);
        router.post(
            route("admin.stock-adjustments.quick"),
            {
                product_id: product.id,
                ...(selectedVariant ? { variant_id: selectedVariant.id } : {}),
                type: localType,
                quantity: Number(qty),
                reason: reason,
                notes: notes,
                ...(isIn && Number(costPrice) > 0
                    ? { cost_price: Number(costPrice) }
                    : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onSuccess?.();
                },
                onError: (err) => {
                    setProcessing(false);
                    setError(err?.message ?? "Gagal menyimpan");
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={() => !processing && onClose?.()}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-modal))] p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))]">
                        Atur Stok
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1 text-[rgb(var(--color-text-muted))] transition hover:bg-[rgb(var(--color-surface-secondary))] hover:text-[rgb(var(--color-text-secondary))] disabled:opacity-60"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Info: pencatatan manual — tanpa supplier */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                        <p className="font-medium">
                            📋 Pencatatan Manual (Tanpa Supplier)
                        </p>
                        <p className="mt-0.5 leading-relaxed text-amber-600">
                            Stok dicatat langsung tanpa melalui supplier. Untuk
                            pembelian dari supplier, gunakan tombol{" "}
                            <strong>Beli Stok</strong> di daftar produk.
                        </p>
                    </div>

                    {/* Toggle: Stok Masuk / Stok Keluar */}
                    <div className="flex rounded-xl bg-[rgb(var(--color-surface-secondary))] p-1">
                        <button
                            type="button"
                            onClick={() => handleTypeChange("in")}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                                isIn
                                    ? "bg-[rgb(var(--color-card))] text-success shadow-sm"
                                    : "text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-secondary))]"
                            }`}
                        >
                            ➕ Stok Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange("out")}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                                !isIn
                                    ? "bg-[rgb(var(--color-card))] text-destructive shadow-sm"
                                    : "text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-secondary))]"
                            }`}
                        >
                            ➖ Stok Keluar
                        </button>
                    </div>

                    {/* Variant Selector — hanya jika product punya variant */}
                    {hasVariants && !initialVariant && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--color-text-secondary))]">
                                Pilih Variant
                            </label>
                            <div className="space-y-1.5">
                                {variants.map((v) => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedVariant(v);
                                            setCostPrice(v.cost_price || "");
                                        }}
                                        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                            selectedVariant?.id === v.id
                                                ? "border-primary-300 bg-primary-50 ring-2 ring-primary-200"
                                                : "border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-secondary))]"
                                        }`}
                                    >
                                        <div>
                                            <span className="font-medium text-[rgb(var(--color-text-primary))]">
                                                {v.name}
                                            </span>
                                            <span className="ml-2 text-xs text-[rgb(var(--color-text-muted))] font-mono">
                                                {v.sku}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold text-[rgb(var(--color-text-secondary))]">
                                            Stok: {v.stock ?? 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Produk / Variant Info */}
                    {(!hasVariants || selectedVariant || initialVariant) && (
                        <>
                            <div>
                                <p className="text-xs font-medium text-[rgb(var(--color-text-muted))]">
                                    {selectedVariant ? "Variant" : "Produk"}
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-[rgb(var(--color-text-primary))]">
                                    {activeName}
                                </p>
                                <p className="text-xs text-[rgb(var(--color-text-muted))]">
                                    SKU: {activeSku} &middot; {activeUnit}
                                </p>
                            </div>

                            {/* Stok Saat Ini */}
                            <div>
                                <p className="text-xs font-medium text-[rgb(var(--color-text-muted))]">
                                    Stok Saat Ini
                                </p>
                                <p
                                    className={`mt-0.5 text-xl font-bold ${
                                        product.track_stock &&
                                        activeStock <= (product.stock_minimum || 0)
                                            ? "text-destructive"
                                            : "text-[rgb(var(--color-text-primary))]"
                                    }`}
                                >
                                    {product.track_stock
                                        ? `${activeStock} ${activeUnit}`
                                        : "Tidak dilacak"}
                                </p>
                            </div>

                            {/* Qty */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--color-text-secondary))]">
                                    Qty ({activeUnit})
                                </label>
                                <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    placeholder="0"
                                    min="0.0001"
                                    step="any"
                                    className={`w-full rounded-xl border py-2.5 px-3.5 text-sm shadow-sm transition placeholder:text-[rgb(var(--color-text-muted))] focus:border-ring focus:ring-2 focus:ring-ring/20 ${
                                        isLargeQty
                                            ? "border-amber-400 bg-amber-50"
                                            : "border-[rgb(var(--color-input-border))] bg-[rgb(var(--color-input-background))] text-[rgb(var(--color-text-primary))]"
                                    }`}
                                    autoFocus
                                />
                                {isLargeQty && (
                                    <p className="mt-1 text-xs font-medium text-amber-600">
                                        ⚠️ Jumlah besar ({qtyNum.toLocaleString("id-ID")}{" "}
                                        {activeUnit}). Pastikan angka sudah benar
                                        sebelum simpan.
                                    </p>
                                )}
                                {!isIn && qty && Number(qty) > activeStock && (
                                    <p className="mt-1 text-xs text-destructive">
                                        ⚠️ Qty melebihi stok saat ini (
                                        {activeStock} {activeUnit})
                                    </p>
                                )}
                            </div>

                            {/* Harga Modal — hanya saat Stok Masuk */}
                            {isIn && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--color-text-secondary))]">
                                        Harga Modal / Unit{" "}
                                        <span className="font-normal text-[rgb(var(--color-text-muted))]">
                                            (opsional)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[rgb(var(--color-text-muted))]">
                                            Rp
                                        </span>
                                        <input
                                            type="number"
                                            value={costPrice}
                                            onChange={(e) =>
                                                setCostPrice(e.target.value)
                                            }
                                            placeholder={activeCostPrice || "0"}
                                            min="0"
                                            step="any"
                                            className="w-full rounded-xl border border-[rgb(var(--color-input-border))] bg-[rgb(var(--color-input-background))] py-2.5 pl-10 pr-3.5 text-sm text-[rgb(var(--color-text-primary))] shadow-sm transition placeholder:text-[rgb(var(--color-text-muted))] focus:border-ring focus:ring-2 focus:ring-ring/20"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                                        Harga produksi per unit. Kalau diisi, harga
                                        modal produk akan diperbarui.
                                    </p>
                                </div>
                            )}

                            {/* Alasan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--color-text-secondary))]">
                                    Alasan
                                </label>
                                <SearchableSelect
                                    options={reasonOptions}
                                    value={reason}
                                    onChange={(id) => setReason(id)}
                                    placeholder="Pilih alasan..."
                                    searchPlaceholder="Ketik alasan…"
                                />
                            </div>

                            {/* Catatan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--color-text-secondary))]">
                                    Catatan{" "}
                                    <span className="font-normal text-[rgb(var(--color-text-muted))]">
                                        (opsional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="misal: produksi batch #45"
                                    className="w-full rounded-xl border border-[rgb(var(--color-input-border))] bg-[rgb(var(--color-input-background))] py-2.5 px-3.5 text-sm text-[rgb(var(--color-text-primary))] shadow-sm transition placeholder:text-[rgb(var(--color-text-muted))] focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))] transition hover:bg-[rgb(var(--color-surface-secondary))] disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        onClick={submit}
                        disabled={
                            processing ||
                            !qty ||
                            Number(qty) <= 0 ||
                            (hasVariants && !initialVariant && !selectedVariant) ||
                            (!isIn && Number(qty) > activeStock)
                        }
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${
                            isIn
                                ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-green-700"
                                : "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30 hover:from-red-600 hover:to-rose-700"
                        }`}
                    >
                        {processing ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
