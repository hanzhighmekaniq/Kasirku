import { useState } from "react";
import { fmt } from "./helpers";

/**
 * Modal pemilihan satuan/kemasan (packaging unit) — dipakai saat produk
 * punya lebih dari satu satuan jual (misal: Pcs, Lusin, Dus).
 * Semua pilihan satuan ditampilkan sekaligus dalam modal terpusat (bukan
 * pill kecil di card) agar terlihat jelas & mudah dipilih.
 */
export default function UnitModal({ product, onConfirm, onClose }) {
    const packagingUnits = product.packaging_units ?? [];

    // Opsi satuan = satuan dasar produk + semua kemasan tambahan.
    const options = [
        {
            id: "base",
            name: product.unit || "Pcs",
            price: Number(product.sell_price),
            conversion: 1,
            isBase: true,
        },
        ...packagingUnits.map((pu) => ({
            id: pu.id,
            name: pu.name,
            price: Number(pu.sell_price),
            conversion: pu.conversion_qty,
            isBase: false,
            raw: pu,
        })),
    ];

    const [selectedId, setSelectedId] = useState("base");
    const [qty, setQty] = useState(1);

    const selected = options.find((o) => o.id === selectedId);

    const handleConfirm = () => {
        if (!selected) return;
        onConfirm(selected.isBase ? null : selected.raw, qty);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                        <p className="text-xs text-slate-500">Pilih satuan/kemasan</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto px-5 py-4 space-y-4">
                    <div>
                        <p className="mb-2 text-sm font-semibold text-slate-800">
                            Satuan <span className="text-red-500">*</span>
                        </p>
                        <div className="space-y-2">
                            {options.map((o) => {
                                const isActive = selectedId === o.id;
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => setSelectedId(o.id)}
                                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                                            isActive
                                                ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                                                : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                                isActive
                                                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {o.name.slice(0, 2).toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold ${isActive ? "text-indigo-900" : "text-slate-800"}`}>
                                                {o.name}
                                                {o.isBase && (
                                                    <span className="ml-1.5 text-[10px] font-medium text-slate-400">(satuan dasar)</span>
                                                )}
                                            </p>
                                            {!o.isBase && (
                                                <p className="text-[11px] text-slate-400">
                                                    1 {o.name} = {o.conversion} {product.unit || "pcs"}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className={`text-sm font-bold ${isActive ? "text-indigo-700" : "text-slate-700"}`}>
                                                {fmt(o.price)}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <svg className="h-5 w-5 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Qty selector */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-slate-800">Jumlah</p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                </svg>
                            </button>
                            <span className="w-10 text-center text-lg font-bold text-slate-800">{qty}</span>
                            <button
                                type="button"
                                onClick={() => setQty((q) => q + 1)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>
                            {selected && (
                                <span className="ml-auto text-sm font-bold text-indigo-700">
                                    = {fmt(selected.price * qty)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-5 py-4">
                    <button
                        type="button"
                        disabled={!selected}
                        onClick={handleConfirm}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {selected ? `Tambah ke Keranjang — ${fmt(selected.price * qty)}` : "Pilih satuan dulu"}
                    </button>
                </div>
            </div>
        </div>
    );
}
