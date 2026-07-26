import { useState } from "react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function VariantModal({ product, onConfirm, onClose }) {
    const variants = (product.variants ?? []).filter((v) => v.is_active);
    const [selected, setSelected] = useState(null);
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState("");

    const activeVariant = variants.find((v) => v.id === selected);

    const handleConfirm = () => {
        if (!activeVariant) return;
        onConfirm(activeVariant, qty, note);
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
                        <p className="text-xs text-muted-foreground">Pilih varian produk</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground/60 hover:text-foreground">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-80 overflow-y-auto px-5 py-4 space-y-4">
                    {/* Variant grid */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-foreground">
                            Pilih Varian <span className="text-destructive">*</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {variants.map((v) => {
                                const isActive = selected === v.id;
                                const variantTiers = (v.price_tiers ?? []).sort((a, b) => a.min_qty - b.min_qty);
                                const lowestTier = variantTiers[0];
                                return (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => setSelected(v.id)}
                                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                                            isActive
                                                ? "border-primary bg-primary/10"
                                                : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                                        }`}
                                    >
                                        <span className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                                            {v.name}
                                        </span>
                                        <span className={`mt-0.5 text-sm font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
                                            {fmt(v.price)}
                                        </span>
                                        {lowestTier && (
                                            <span className="mt-1 text-[10px] text-success font-medium">
                                                Grosir {lowestTier.min_qty}+ → {fmt(lowestTier.price)}
                                            </span>
                                        )}
                                        {v.sku && (
                                            <span className="mt-0.5 text-[10px] text-muted-foreground">{v.sku}</span>
                                        )}
                                        {isActive && (
                                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                                Dipilih
                                            </span>
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
                            {activeVariant && (
                                <span className="ml-auto text-sm font-bold text-primary">
                                    = {fmt(activeVariant.price * qty)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Catatan */}
                    <div>
                        <p className="mb-1 text-sm font-medium text-foreground">Catatan Item</p>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Catatan opsional..."
                            className="block w-full rounded-xl border-input bg-background text-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
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
                        {selected ? `Tambah ke Keranjang — ${fmt(activeVariant?.price * qty)}` : "Pilih varian dulu"}
                    </button>
                </div>
            </div>
        </div>
    );
}
