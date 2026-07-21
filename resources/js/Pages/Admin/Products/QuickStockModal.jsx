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
            <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground">
                        Atur Stok
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-60"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Info: pencatatan manual — tanpa supplier */}
                    <div className="rounded-xl border border-warning/10 bg-warning/5 px-3 py-2.5 text-xs text-warning">
                        <p className="font-medium">
                            📋 Pencatatan Manual (Tanpa Supplier)
                        </p>
                        <p className="mt-0.5 leading-relaxed text-warning">
                            Stok dicatat langsung tanpa melalui supplier. Untuk
                            pembelian dari supplier, gunakan tombol{" "}
                            <strong>Beli Stok</strong> di daftar produk.
                        </p>
                    </div>

                    {/* Toggle: Stok Masuk / Stok Keluar */}
                    <div className="flex rounded-xl bg-muted p-1">
                        <button
                            type="button"
                            onClick={() => handleTypeChange("in")}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                                isIn
                                    ? "bg-card text-success shadow-sm"
                                    : "text-muted-foreground hover:text-card-foreground"
                            }`}
                        >
                            ➕ Stok Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange("out")}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                                !isIn
                                    ? "bg-card text-destructive shadow-sm"
                                    : "text-muted-foreground hover:text-card-foreground"
                            }`}
                        >
                            ➖ Stok Keluar
                        </button>
                    </div>

                    {/* Variant Selector — hanya jika product punya variant */}
                    {hasVariants && !initialVariant && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
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
                                                ? "border-primary/30 bg-primary/10 ring-2 ring-primary/20"
                                                : "border-border hover:bg-muted"
                                        }`}
                                    >
                                        <div>
                                            <span className="font-medium text-foreground">
                                                {v.name}
                                            </span>
                                            <span className="ml-2 text-xs text-muted-foreground font-mono">
                                                {v.sku}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold text-card-foreground">
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
                                <p className="text-xs font-medium text-muted-foreground">
                                    {selectedVariant ? "Variant" : "Produk"}
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-foreground">
                                    {activeName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    SKU: {activeSku} &middot; {activeUnit}
                                </p>
                            </div>

                            {/* Stok Saat Ini */}
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Stok Saat Ini
                                </p>
                                <p
                                    className={`mt-0.5 text-xl font-bold ${
                                        product.track_stock &&
                                        activeStock <= (product.stock_minimum || 0)
                                            ? "text-destructive"
                                            : "text-foreground"
                                    }`}
                                >
                                    {product.track_stock
                                        ? `${activeStock} ${activeUnit}`
                                        : "Tidak dilacak"}
                                </p>
                            </div>

                            {/* Qty */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                                    Qty ({activeUnit})
                                </label>
                                <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    placeholder="0"
                                    min="0.0001"
                                    step="any"
                                    className={`w-full rounded-xl border py-2.5 px-3.5 text-sm shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 ${
                                        isLargeQty
                                            ? "border-warning bg-warning/5"
                                            : "border-border bg-card text-foreground"
                                    }`}
                                    autoFocus
                                />
                                {isLargeQty && (
                                    <p className="mt-1 text-xs font-medium text-warning">
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
                                    <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                                        Harga Modal / Unit{" "}
                                        <span className="font-normal text-muted-foreground">
                                            (opsional)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
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
                                            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3.5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Harga produksi per unit. Kalau diisi, harga
                                        modal produk akan diperbarui.
                                    </p>
                                </div>
                            )}

                            {/* Alasan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-card-foreground">
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
                                <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                                    Catatan{" "}
                                    <span className="font-normal text-muted-foreground">
                                        (opsional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="misal: produksi batch #45"
                                    className="w-full rounded-xl border border-border bg-card py-2.5 px-3.5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                        className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-60"
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
                                ? "bg-success shadow-success/30 hover:bg-success/90"
                                : "bg-destructive shadow-destructive/30 hover:bg-destructive/90"
                        }`}
                    >
                        {processing ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
