import { useMemo, useState } from "react";
import { fmt, getTierPrice } from "../helpers";

/**
 * Modal produk terpusat untuk retail — menggantikan VariantModal + UnitModal
 * yang lama. Alurnya adaptif dalam SATU modal:
 *
 *   Choose Variant (kalau produk punya varian aktif)
 *     → Choose Unit (kalau varian/produk punya packaging unit)
 *       → Quantity → Notes → Subtotal real-time
 *
 * Logika harga & tier mengikuti index1.html `updateSubtotal()`:
 * - Unit dasar + varian dipilih → tier price varian (fallback harga varian)
 * - Unit dasar tanpa varian     → tier price produk (fallback sell_price)
 * - Packaging unit dipilih      → harga flat packaging unit (tier tidak berlaku)
 */
export default function RetailProductModal({ product, onConfirm, onClose }) {
    const activeVariants = useMemo(
        () => (product.variants ?? []).filter((v) => v.is_active),
        [product],
    );
    const hasActiveVariants = activeVariants.length > 0;

    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [expandedVariantId, setExpandedVariantId] = useState(null);
    const [selectedUnitKey, setSelectedUnitKey] = useState("base");
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState("");

    const selectedVariant = hasActiveVariants
        ? activeVariants.find((v) => v.id === selectedVariantId) ?? null
        : null;

    // Opsi satuan: satuan dasar selalu ada + packaging unit yang relevan
    // dengan konteks saat ini (punya varian → punya packaging unit varian;
    // tanpa varian → packaging unit level produk).
    const unitOptions = useMemo(() => {
        const base = {
            key: "base",
            isBase: true,
            name: product.unit || "Pcs",
            conversion: 1,
        };
        if (hasActiveVariants) {
            if (!selectedVariant) return [base];
            const variantUnits = (selectedVariant.packaging_units ?? []).map((pu) => ({
                key: `pu-${pu.id}`,
                isBase: false,
                name: pu.name,
                conversion: pu.conversion_qty,
                price: Number(pu.sell_price),
                raw: pu,
            }));
            return [base, ...variantUnits];
        }
        const productUnits = (product.packaging_units ?? [])
            .filter((pu) => !pu.variant_id)
            .map((pu) => ({
                key: `pu-${pu.id}`,
                isBase: false,
                name: pu.name,
                conversion: pu.conversion_qty,
                price: Number(pu.sell_price),
                raw: pu,
            }));
        return [base, ...productUnits];
    }, [product, hasActiveVariants, selectedVariant]);

    const selectedUnit =
        unitOptions.find((u) => u.key === selectedUnitKey) ?? unitOptions[0];

    const handlePickVariant = (variant) => {
        setSelectedVariantId(variant.id);
        setSelectedUnitKey("base"); // reset satuan setiap ganti varian
    };

    // Harga dasar per-unit sebelum dikali qty
    const unitPrice = useMemo(() => {
        if (!selectedUnit || selectedUnit.isBase) {
            if (hasActiveVariants) {
                if (!selectedVariant) return 0;
                const tier = getTierPrice(product, qty, selectedVariant.id);
                return tier ?? Number(selectedVariant.price);
            }
            const tier = getTierPrice(product, qty, null);
            return tier ?? Number(product.sell_price);
        }
        return selectedUnit.price ?? 0;
    }, [selectedUnit, hasActiveVariants, selectedVariant, product, qty]);

    const subtotal = unitPrice * qty;
    const canConfirm = !hasActiveVariants || !!selectedVariant;

    const handleConfirm = () => {
        if (!canConfirm) return;
        onConfirm(
            selectedVariant,
            selectedUnit?.isBase ? null : selectedUnit?.raw ?? null,
            qty,
            note,
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
                {/* Header */}
                <div className="flex items-start gap-4 border-b border-slate-100 p-5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                        {product.image ? (
                            <img
                                src={`/storage/${product.image}`}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-slate-900">{product.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            SKU · {product.sku} · {product.unit || "Pcs"}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {/* Choose Variant */}
                    {hasActiveVariants && (
                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-900">Choose Variant</h4>
                                <span className="text-[11px] text-slate-500">Required</span>
                            </div>
                            <div className="space-y-2.5">
                                {activeVariants.map((v) => {
                                    const isActive = selectedVariantId === v.id;
                                    const isExpanded = expandedVariantId === v.id;
                                    const tiers = (v.price_tiers ?? []).slice().sort((a, b) => a.min_qty - b.min_qty);
                                    return (
                                        <div
                                            key={v.id}
                                            className={`overflow-hidden rounded-2xl border transition-all ${
                                                isActive
                                                    ? "border-indigo-500 bg-gradient-to-b from-indigo-50/60 to-white ring-1 ring-indigo-200"
                                                    : "border-slate-200 bg-white"
                                            }`}
                                        >
                                            <div
                                                className="flex cursor-pointer items-center gap-3 p-3.5"
                                                onClick={() => handlePickVariant(v)}
                                            >
                                                <span
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                                        isActive
                                                            ? "border-indigo-500 bg-indigo-500 text-white"
                                                            : "border-slate-200 bg-white text-transparent"
                                                    }`}
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                                                    </svg>
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-slate-900">{v.name}</p>
                                                    {v.sku && <p className="mt-0.5 text-[11px] text-slate-400">SKU · {v.sku}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-900">{fmt(v.price)}</p>
                                                    <p className="text-[10px] text-slate-400">Retail</p>
                                                </div>
                                                {tiers.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedVariantId((cur) => (cur === v.id ? null : v.id));
                                                        }}
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                                                    >
                                                        <svg
                                                            className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2.5}
                                                            stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            {tiers.length > 0 && isExpanded && (
                                                <div className="space-y-1.5 border-t border-slate-100 px-3.5 pb-4 pt-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500">Retail</span>
                                                        <span className="font-medium text-slate-900">{fmt(v.price)}</span>
                                                    </div>
                                                    {tiers.map((t) => (
                                                        <div key={t.id ?? t.min_qty} className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-500">{t.min_qty}+ pcs</span>
                                                            <span className="font-medium text-emerald-600">{fmt(t.price)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Choose Unit — muncul kalau ada opsi selain satuan dasar */}
                    {unitOptions.length > 1 && (
                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-900">Choose Unit</h4>
                                <span className="text-[11px] text-slate-500">Multi-unit</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5">
                                {unitOptions.map((u) => {
                                    const isActive = selectedUnitKey === u.key;
                                    return (
                                        <button
                                            key={u.key}
                                            type="button"
                                            onClick={() => setSelectedUnitKey(u.key)}
                                            className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                                                isActive
                                                    ? "border-indigo-500 bg-gradient-to-b from-indigo-50/60 to-white ring-1 ring-indigo-200"
                                                    : "border-slate-200 bg-white hover:border-indigo-300"
                                            }`}
                                        >
                                            <span
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                                    isActive
                                                        ? "border-indigo-500 bg-indigo-500 text-white"
                                                        : "border-slate-200 bg-white text-transparent"
                                                }`}
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                                                </svg>
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {u.name}
                                                    {u.isBase && (
                                                        <span className="ml-1.5 text-[10px] font-medium text-slate-400">(satuan dasar)</span>
                                                    )}
                                                </p>
                                                {!u.isBase && (
                                                    <p className="text-[11px] text-slate-400">
                                                        1 {u.name} = {u.conversion} {product.unit || "pcs"}
                                                    </p>
                                                )}
                                            </div>
                                            {!u.isBase && (
                                                <span className="shrink-0 text-sm font-semibold text-slate-900">{fmt(u.price)}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Quantity */}
                    <section>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900">Quantity</h4>
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                </svg>
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    setQty(Number.isFinite(v) && v >= 1 ? v : 1);
                                }}
                                className="w-16 border-0 bg-transparent text-center text-base font-semibold text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                                type="button"
                                onClick={() => setQty((q) => q + 1)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-black"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                </svg>
                            </button>
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900">Item Notes</h4>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Catatan opsional..."
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </section>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 border-t border-slate-100 bg-white/80 px-5 py-4 backdrop-blur">
                    <div className="flex-1">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Subtotal</div>
                        <div className="text-lg font-semibold text-slate-900">{fmt(subtotal)}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-900 hover:bg-slate-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                        className="h-11 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {canConfirm ? "Add to Cart" : "Pilih varian dulu"}
                    </button>
                </div>
            </div>
        </div>
    );
}
