import { useState } from "react";
import { fmt } from "../helpers";

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
                className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-md rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">Pilih satuan/kemasan</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground/60 hover:text-foreground">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto px-5 py-4 space-y-4">
                    <div>
                        <p className="mb-2 text-sm font-semibold text-foreground">
                            Satuan <span className="text-destructive">*</span>
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
                                                ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                                : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {o.name.slice(0, 2).toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                                                {o.name}
                                                {o.isBase && (
                                                    <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">(satuan dasar)</span>
                                                )}
                                            </p>
                                            {!o.isBase && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    1 {o.name} = {o.conversion} {product.unit || "pcs"}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className={`text-sm font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
                                                {fmt(o.price)}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
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
                        <p className="mb-2 text-sm font-semibold text-foreground">Jumlah</p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                </svg>
                            </button>
                            <span className="w-10 text-center text-lg font-bold text-foreground">{qty}</span>
                            <button
                                type="button"
                                onClick={() => setQty((q) => q + 1)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>
                            {selected && (
                                <span className="ml-auto text-sm font-bold text-primary">
                                    = {fmt(selected.price * qty)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border px-5 py-4">
                    <button
                        type="button"
                        disabled={!selected}
                        onClick={handleConfirm}
                        className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {selected ? `Tambah ke Keranjang — ${fmt(selected.price * qty)}` : "Pilih satuan dulu"}
                    </button>
                </div>
            </div>
        </div>
    );
}
