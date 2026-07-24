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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                onClick={() => !processing && onClose?.()}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            />
            <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl sm:my-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="mb-6 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground">
                            Atur Stok Cepat
                        </h3>
                        <p className="text-sm text-muted-foreground">Sesuaikan stok dengan cepat.</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-full bg-muted/50 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Info: pencatatan manual — tanpa supplier */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                        <div className="flex items-start gap-3">
                            <span className="text-lg leading-none">💡</span>
                            <div>
                                <p className="font-semibold">Pencatatan Manual</p>
                                <p className="mt-1 leading-relaxed text-primary/80 text-xs">
                                    Stok ini tidak melalui supplier. Untuk
                                    pembelian dari supplier, gunakan tombol{" "}
                                    <strong className="font-semibold">Beli Stok</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Toggle: Stok Masuk / Stok Keluar */}
                    <div className="flex rounded-xl bg-muted/50 p-1 border border-border/50">
                        <button
                            type="button"
                            onClick={() => handleTypeChange("in")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                                isIn
                                    ? "bg-card text-success shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <span className="text-base leading-none">➕</span> Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange("out")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                                !isIn
                                    ? "bg-card text-destructive shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <span className="text-base leading-none">➖</span> Keluar
                        </button>
                    </div>

                    {/* Variant Selector — hanya jika product punya variant */}
                    {hasVariants && !initialVariant && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">
                                Pilih Variant
                            </label>
                            <div className="space-y-2">
                                {variants.map((v) => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedVariant(v);
                                            setCostPrice(v.cost_price || "");
                                        }}
                                        className={`w-full group flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                                            selectedVariant?.id === v.id
                                                ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                                                : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                                        }`}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className={`font-semibold ${selectedVariant?.id === v.id ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"}`}>
                                                {v.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {v.sku}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Stok</span>
                                            <span className={`font-bold ${selectedVariant?.id === v.id ? "text-primary" : "text-foreground"}`}>
                                                {v.stock ?? 0}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Produk / Variant Info */}
                    {(!hasVariants || selectedVariant || initialVariant) && (
                        <>
                            <div className="flex items-start justify-between rounded-xl border border-border bg-base px-4 py-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {selectedVariant ? "Variant" : "Produk"}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {activeName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                        {activeSku} <span className="mx-1">&bull;</span> {activeUnit}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Stok Saat Ini
                                    </p>
                                    <p
                                        className={`mt-1 text-lg font-bold leading-none ${
                                            product.track_stock &&
                                            activeStock <= (product.stock_minimum || 0)
                                                ? "text-destructive"
                                                : "text-foreground"
                                        }`}
                                    >
                                        {product.track_stock
                                            ? `${activeStock}`
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* Qty */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Jumlah <span className="font-normal text-muted-foreground">({activeUnit})</span>
                                </label>
                                <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    placeholder="0"
                                    min="0.0001"
                                    step="any"
                                    className={`w-full rounded-xl border py-3 px-4 text-base font-semibold shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                                        isLargeQty
                                            ? "border-warning bg-warning/5 text-warning"
                                            : "border-border bg-card text-foreground"
                                    }`}
                                    autoFocus
                                />
                                {isLargeQty && (
                                    <p className="flex items-start gap-1.5 text-xs font-medium text-warning mt-2">
                                        <span>⚠️</span>
                                        <span>Jumlah sangat besar ({qtyNum.toLocaleString("id-ID")} {activeUnit}). Pastikan sudah benar.</span>
                                    </p>
                                )}
                                {!isIn && qty && Number(qty) > activeStock && (
                                    <p className="flex items-start gap-1.5 text-xs font-medium text-destructive mt-2">
                                        <span>⚠️</span>
                                        <span>Jumlah melebihi stok saat ini ({activeStock} {activeUnit}).</span>
                                    </p>
                                )}
                            </div>

                            {/* Harga Modal — hanya saat Stok Masuk */}
                            {isIn && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">
                                        Harga Modal / Unit{" "}
                                        <span className="font-normal text-muted-foreground">
                                            (opsional)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-muted-foreground">
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
                                            className="w-full rounded-xl border border-border bg-card py-2.5 pl-12 pr-4 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Alasan */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
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
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    Catatan{" "}
                                    <span className="font-normal text-muted-foreground">
                                        (opsional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Tulis catatan di sini..."
                                    className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                            {error}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-border/50">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-xl bg-transparent px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
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
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 ${
                            isIn
                                ? "bg-success shadow-success/20 hover:bg-success/90 hover:shadow-success/40"
                                : "bg-destructive shadow-destructive/20 hover:bg-destructive/90 hover:shadow-destructive/40"
                        }`}
                    >
                        {processing ? "Menyimpan..." : (isIn ? "Simpan Stok Masuk" : "Simpan Stok Keluar")}
                    </button>
                </div>
            </div>
        </div>
    );
}
