import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    Info,
    Loader2,
    Minus,
    Package,
    PackageMinus,
    PackagePlus,
    Plus,
    X,
} from "lucide-react";
import Dropdown from "@/Components/Dropdown";

export default function QuickStockModal({
    product,
    type,
    variant: initialVariant,
    unit: initialUnit = null,
    onClose,
    onSuccess,
}) {
    const variants = product.variants ?? [];
    // Saat menargetkan satuan tertentu, bucket-nya sudah pasti (produk +
    // variant + packaging unit), jadi pemilihan variant tidak relevan lagi.
    const hasVariants = !initialUnit && variants.length > 0;

    const [localType, setLocalType] = useState(type || "in");
    const [selectedVariant, setSelectedVariant] = useState(
        initialVariant || (hasVariants ? null : null),
    );
    const [qty, setQty] = useState("");
    const [costPrice, setCostPrice] = useState(
        initialVariant?.cost_price || product.cost_price || "",
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
    // Siap diisi jika produk tanpa variant, atau variant sudah dipilih
    const isReady = !hasVariants || !!selectedVariant || !!initialVariant;

    // Active target: bucket satuan → variant → produk
    const activeName = selectedVariant
        ? `${product.name} — ${selectedVariant.name}`
        : product.name;
    const activeSku = selectedVariant?.sku || product.sku;
    const activeStock = initialUnit
        ? (initialUnit.stock ?? 0)
        : selectedVariant
          ? (selectedVariant.stock ?? 0)
          : (product.stock ?? 0);
    // Qty diisi dalam satuan bucket-nya sendiri: 1 Dus = 1, bukan 12.
    const activeUnit = initialUnit?.name || product.unit;
    const activeCostPrice = selectedVariant?.cost_price || product.cost_price;

    // Kunci scroll halaman di belakang modal — mencegah scroll chaining
    // yang bikin overlay blur ikut repaint tiap frame.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

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
    const selectedReason = reasonOptions.find((r) => r.id === reason);

    const handleTypeChange = (newType) => {
        setLocalType(newType);
        setReason(newType === "in" ? "received" : "correction");
        setCostPrice(activeCostPrice || "");
    };

    const isOverStock = !isIn && !!qty && Number(qty) > activeStock;

    const submit = () => {
        if (!qty || Number(qty) <= 0) return;
        setProcessing(true);
        setError(null);
        router.post(
            route("admin.stock-adjustments.quick"),
            {
                product_id: product.id,
                ...(selectedVariant ? { variant_id: selectedVariant.id } : {}),
                ...(initialUnit ? { packaging_unit_id: initialUnit.id } : {}),
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

    // Di-portal ke <body> supaya modal keluar dari subtree halaman (tabel produk
    // yang besar + topbar sticky). Tanpa ini, overlay & panel ikut jadi bagian
    // layer halaman, dan tiap repaint halaman ikut menyeret modal.
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={() => !processing && onClose?.()}
                className="absolute inset-0 bg-background/80"
            />

            {/* transform-gpu: panel dipromosikan ke layer sendiri supaya scroll
                di dalamnya tidak memicu repaint halaman di belakangnya. */}
            <div className="relative flex max-h-[90vh] w-full max-w-3xl transform-gpu flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl duration-200 animate-in fade-in zoom-in-95">
                {/* ══ Header ══ */}
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                isIn
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                            }`}
                        >
                            {isIn ? (
                                <PackagePlus className="h-5 w-5" />
                            ) : (
                                <PackageMinus className="h-5 w-5" />
                            )}
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-lg font-semibold tracking-tight text-popover-foreground">
                                Atur Stok Cepat
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Sesuaikan stok dengan cepat.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        aria-label="Tutup"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ══ Body (area scroll) ══ */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        {/* ══ Kolom kiri: konteks ══ */}
                        <div className="space-y-4">
                            {/* Info: pencatatan manual — tanpa supplier */}
                            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                                <div className="flex items-start gap-3">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="font-semibold">
                                            Pencatatan Manual
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-primary/80">
                                            Stok ini tidak melalui supplier.
                                            Untuk pembelian dari supplier,
                                            gunakan tombol{" "}
                                            <strong className="font-semibold">
                                                Beli Stok
                                            </strong>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Toggle: Stok Masuk / Stok Keluar */}
                            <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange("in")}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                                        isIn
                                            ? "bg-success text-success-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    <Plus className="h-4 w-4" />
                                    Masuk
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange("out")}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                                        !isIn
                                            ? "bg-destructive text-destructive-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    <Minus className="h-4 w-4" />
                                    Keluar
                                </button>
                            </div>

                            {/* Variant Selector — hanya jika product punya variant */}
                            {hasVariants && !initialVariant && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">
                                        Pilih Variant
                                    </label>
                                    <div className="space-y-2">
                                        {variants.map((v) => {
                                            const active =
                                                selectedVariant?.id === v.id;
                                            return (
                                                <button
                                                    key={v.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedVariant(v);
                                                        setCostPrice(
                                                            v.cost_price || "",
                                                        );
                                                    }}
                                                    className={`group flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                                                        active
                                                            ? "border-primary bg-primary/10 shadow-sm"
                                                            : "border-border bg-card hover:border-primary/40 hover:bg-accent"
                                                    }`}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span
                                                            className={`font-semibold ${active ? "text-primary" : "text-card-foreground"}`}
                                                        >
                                                            {v.name}
                                                        </span>
                                                        <span className="font-mono text-xs text-muted-foreground">
                                                            {v.sku}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                Stok
                                                            </span>
                                                            <span
                                                                className={`font-bold ${active ? "text-primary" : "text-foreground"}`}
                                                            >
                                                                {v.stock ?? 0}
                                                            </span>
                                                        </div>
                                                        {active && (
                                                            <Check className="h-4 w-4 shrink-0 text-primary" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Produk / Variant Info */}
                            {isReady && (
                                <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {initialUnit
                                                    ? "Satuan"
                                                    : selectedVariant
                                                      ? "Variant"
                                                      : "Produk"}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-foreground">
                                                {activeName}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                                {activeSku}{" "}
                                                <span className="mx-1">
                                                    &bull;
                                                </span>{" "}
                                                {activeUnit}
                                            </p>
                                            {initialUnit && (
                                                <p className="mt-1 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                                    1 {initialUnit.name} ={" "}
                                                    {initialUnit.conversion_qty}{" "}
                                                    {product.unit}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Stok Saat Ini
                                        </p>
                                        <p
                                            className={`mt-1 text-lg font-bold leading-none ${
                                                product.track_stock &&
                                                activeStock <=
                                                    (product.stock_minimum || 0)
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
                            )}
                        </div>

                        {/* ══ Kolom kanan: input ══ */}
                        <div className="space-y-4">
                            {isReady ? (
                                <>
                                    {/* Qty */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-foreground">
                                            Jumlah{" "}
                                            <span className="font-normal text-muted-foreground">
                                                ({activeUnit})
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            value={qty}
                                            onChange={(e) =>
                                                setQty(e.target.value)
                                            }
                                            placeholder="0"
                                            min="0.0001"
                                            step="any"
                                            className={`w-full rounded-xl border bg-background py-3 px-4 text-base font-semibold text-foreground shadow-sm transition placeholder:text-muted-foreground focus:ring-2 ${
                                                isOverStock
                                                    ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                                                    : isLargeQty
                                                      ? "border-warning focus:border-warning focus:ring-warning/20"
                                                      : "border-input focus:border-ring focus:ring-ring/20"
                                            }`}
                                            autoFocus
                                        />
                                        {isLargeQty && !isOverStock && (
                                            <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-warning">
                                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                <span>
                                                    Jumlah sangat besar (
                                                    {qtyNum.toLocaleString(
                                                        "id-ID",
                                                    )}{" "}
                                                    {activeUnit}). Pastikan
                                                    sudah benar.
                                                </span>
                                            </p>
                                        )}
                                        {isOverStock && (
                                            <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive">
                                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                <span>
                                                    Jumlah melebihi stok saat
                                                    ini ({activeStock}{" "}
                                                    {activeUnit}).
                                                </span>
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
                                                        setCostPrice(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={
                                                        activeCostPrice || "0"
                                                    }
                                                    min="0"
                                                    step="any"
                                                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-12 pr-4 text-sm font-medium text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Alasan */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-foreground">
                                            Alasan
                                        </label>
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button
                                                    type="button"
                                                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                                                >
                                                    <span
                                                        className={`truncate ${selectedReason ? "" : "text-muted-foreground"}`}
                                                    >
                                                        {selectedReason?.name ??
                                                            "Pilih alasan..."}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                </button>
                                            </Dropdown.Trigger>

                                            <Dropdown.Content
                                                align="left"
                                                width="full"
                                                dropUp
                                                radiusClasses="rounded-xl"
                                                contentClasses="bg-popover text-popover-foreground p-1"
                                            >
                                                {reasonOptions.map((r) => (
                                                    <button
                                                        key={r.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setReason(r.id)
                                                        }
                                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                                            r.id === reason
                                                                ? "bg-primary/10 font-semibold text-primary"
                                                                : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                                                        }`}
                                                    >
                                                        <span className="flex-1 truncate">
                                                            {r.name}
                                                        </span>
                                                        {r.id === reason && (
                                                            <Check className="h-4 w-4 shrink-0 text-primary" />
                                                        )}
                                                    </button>
                                                ))}
                                            </Dropdown.Content>
                                        </Dropdown>
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
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            placeholder="Tulis catatan di sini..."
                                            className="w-full rounded-xl border border-input bg-background py-2.5 px-4 text-sm font-medium text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                                    <Package className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">
                                        Pilih variant terlebih dahulu untuk
                                        mengatur stok.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* ══ Footer ══ */}
                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border bg-muted/50 px-6 py-4">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        onClick={submit}
                        disabled={
                            processing ||
                            !qty ||
                            Number(qty) <= 0 ||
                            (hasVariants &&
                                !initialVariant &&
                                !selectedVariant) ||
                            isOverStock
                        }
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 ${
                            isIn
                                ? "bg-success text-success-foreground hover:bg-success/90"
                                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        }`}
                    >
                        {processing && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {processing
                            ? "Menyimpan..."
                            : isIn
                              ? "Simpan Stok Masuk"
                              : "Simpan Stok Keluar"}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
