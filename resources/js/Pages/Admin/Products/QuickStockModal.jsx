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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">
                        Atur Stok
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
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
                    <div className="flex rounded-xl bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => handleTypeChange("in")}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                                isIn
                                    ? "bg-white text-emerald-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            ➕ Stok Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange("out")}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                                !isIn
                                    ? "bg-white text-red-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            ➖ Stok Keluar
                        </button>
                    </div>

                    {/* Variant Selector — hanya jika product punya variant */}
                    {hasVariants && !initialVariant && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
                                                ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200"
                                                : "border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div>
                                            <span className="font-medium text-slate-800">
                                                {v.name}
                                            </span>
                                            <span className="ml-2 text-xs text-slate-400 font-mono">
                                                {v.sku}
                                            </span>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600">
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
                                <p className="text-xs font-medium text-slate-400">
                                    {selectedVariant ? "Variant" : "Produk"}
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-slate-800">
                                    {activeName}
                                </p>
                                <p className="text-xs text-slate-400">
                                    SKU: {activeSku} &middot; {activeUnit}
                                </p>
                            </div>

                            {/* Stok Saat Ini */}
                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Stok Saat Ini
                                </p>
                                <p
                                    className={`mt-0.5 text-xl font-bold ${
                                        product.track_stock &&
                                        activeStock <= (product.stock_minimum || 0)
                                            ? "text-red-600"
                                            : "text-slate-800"
                                    }`}
                                >
                                    {product.track_stock
                                        ? `${activeStock} ${activeUnit}`
                                        : "Tidak dilacak"}
                                </p>
                            </div>

                            {/* Qty */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Qty ({activeUnit})
                                </label>
                                <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    placeholder="0"
                                    min="0.0001"
                                    step="any"
                                    className={`w-full rounded-xl border py-2.5 px-3.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${
                                        isLargeQty
                                            ? "border-amber-400 bg-amber-50"
                                            : "border-slate-300"
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
                                    <p className="mt-1 text-xs text-red-600">
                                        ⚠️ Qty melebihi stok saat ini (
                                        {activeStock} {activeUnit})
                                    </p>
                                )}
                            </div>

                            {/* Harga Modal — hanya saat Stok Masuk */}
                            {isIn && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Harga Modal / Unit{" "}
                                        <span className="font-normal text-slate-400">
                                            (opsional)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
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
                                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Harga produksi per unit. Kalau diisi, harga
                                        modal produk akan diperbarui.
                                    </p>
                                </div>
                            )}

                            {/* Alasan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Catatan{" "}
                                    <span className="font-normal text-slate-400">
                                        (opsional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="misal: produksi batch #45"
                                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
