import { useState } from "react";
import { router } from "@inertiajs/react";
import { X } from "lucide-react";

export default function QuickStockModal({ product, type, onClose, onSuccess }) {
    const [qty, setQty] = useState("");
    const [reason, setReason] = useState(
        type === "in" ? "received" : "correction",
    );
    const [notes, setNotes] = useState("");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const isIn = type === "in";

    const reasonsIn = [
        ["received", "Terima Barang"],
        ["initial_stock", "Stok Awal"],
        ["production", "Produksi Sendiri"],
        ["correction", "Koreksi Stok"],
        ["other", "Lainnya"],
    ];

    const reasonsOut = [
        ["correction", "Koreksi Stok"],
        ["damaged", "Barang Rusak"],
        ["expired", "Barang Expired"],
        ["lost", "Barang Hilang"],
        ["other", "Lainnya"],
    ];

    const reasonOptions = isIn ? reasonsIn : reasonsOut;

    const submit = () => {
        if (!qty || Number(qty) <= 0) return;
        setProcessing(true);
        setError(null);
        router.post(
            route("admin.stock-adjustments.quick"),
            {
                product_id: product.id,
                type: type,
                quantity: Number(qty),
                reason: reason,
                notes: notes,
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
            <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">
                        {isIn ? "➕ Tambah Stok" : "➖ Kurangi Stok"}
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
                    <div>
                        <p className="text-sm text-slate-500">Produk</p>
                        <p className="font-medium text-slate-800">
                            {product.name}
                        </p>
                        <p className="text-xs text-slate-400">
                            SKU: {product.sku} &middot; {product.unit}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">Stok Saat Ini</p>
                        <p
                            className={`text-xl font-bold ${
                                product.track_stock &&
                                product.stock <= (product.stock_minimum || 0)
                                    ? "text-red-600"
                                    : "text-slate-800"
                            }`}
                        >
                            {product.track_stock
                                ? `${product.stock ?? 0} ${product.unit}`
                                : "Tidak dilacak"}
                        </p>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Qty ({product.unit})
                        </label>
                        <input
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="0"
                            min="0.0001"
                            step="any"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            autoFocus
                        />
                        {!isIn && qty && Number(qty) > (product.stock ?? 0) && (
                            <p className="mt-1 text-xs text-red-600">
                                ⚠️ Qty melebihi stok saat ini (
                                {product.stock ?? 0} {product.unit})
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Alasan
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        >
                            {reasonOptions.map(([val, lbl]) => (
                                <option key={val} value={val}>
                                    {lbl}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Catatan{" "}
                            <span className="font-normal text-slate-400">
                                (opsional)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="misal: dari supplier baru"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>

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
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        onClick={submit}
                        disabled={
                            processing ||
                            !qty ||
                            Number(qty) <= 0 ||
                            (!isIn && Number(qty) > (product.stock ?? 0))
                        }
                        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${
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
