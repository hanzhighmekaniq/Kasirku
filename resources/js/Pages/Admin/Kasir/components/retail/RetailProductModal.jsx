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

    // Cek stok habis — hanya berlaku kalau produk melacak stok (track_stock).
    // Kalau track_stock mati, stok dianggap tidak terbatas jadi tidak pernah
    // dianggap habis.
    const isOutOfStock = (stock) => !!product.track_stock && Number(stock ?? 0) <= 0;

    const isDefaultOutOfStock = isOutOfStock(product.stock);

    // Auto-pilih opsi pertama yang masih ada stoknya, sesuai urutan tampil:
    // Default (kalau sell_base aktif) dulu, baru varian pertama yang masih
    // tersedia. Tujuannya supaya user tidak wajib klik manual dan tidak ada
    // state "belum pilih produk" — kalau semua opsi habis, tidak ada yang
    // terpilih (tombol Add to Cart otomatis disabled).
    const getInitialSelection = () => {
        if (product.sell_base && !isDefaultOutOfStock) {
            return "default";
        }
        const firstAvailableVariant = activeVariants.find(
            (v) => !isOutOfStock(v.stock),
        );
        return firstAvailableVariant ? firstAvailableVariant.id : null;
    };

    const [selectedVariantId, setSelectedVariantId] = useState(getInitialSelection);
    const [expandedVariantId, setExpandedVariantId] = useState(null);
    const [selectedUnitKey, setSelectedUnitKey] = useState("base");
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState("");

    // null = tidak ada opsi tersedia (semua stok habis), "default" = product
    // dasar, number = variant ID
    const isDefaultSelected = selectedVariantId === "default";
    const selectedVariant = !isDefaultSelected && selectedVariantId !== null
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
        if (hasActiveVariants && selectedVariant) {
            // Variant dipilih → packaging unit dari variant
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
        // "Default" atau product tanpa variant → packaging unit dari product
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

    // Stok bucket yang relevan dengan kombinasi variant+unit yang sedang
    // dipilih. Tidak ada konversi otomatis — tiap bucket berdiri sendiri.
    const currentStock = useMemo(() => {
        if (selectedUnit && !selectedUnit.isBase) {
            return Number(selectedUnit.raw?.stock ?? 0);
        }
        if (hasActiveVariants && selectedVariant) {
            return Number(selectedVariant.stock ?? 0);
        }
        // "Default" atau product tanpa variant → product-level stock
        return Number(product.stock ?? 0);
    }, [selectedUnit, hasActiveVariants, selectedVariant, product]);

    const handlePickDefault = () => {
        if (isDefaultOutOfStock) return;
        setSelectedVariantId("default");
        setSelectedUnitKey("base");
    };

    const handlePickVariant = (variant) => {
        if (isOutOfStock(variant.stock)) return;
        setSelectedVariantId(variant.id);
        setSelectedUnitKey("base");
    };

    // Harga dasar per-unit sebelum dikali qty
    const unitPrice = useMemo(() => {
        if (!selectedUnit || selectedUnit.isBase) {
            if (hasActiveVariants && selectedVariant) {
                // Variant dipilih → harga variant + tier variant
                const tier = getTierPrice(product, qty, selectedVariant.id);
                return tier ?? Number(selectedVariant.price);
            }
            // "Default" atau product tanpa variant → harga product + tier product
            const tier = getTierPrice(product, qty, null);
            return tier ?? Number(product.sell_price);
        }
        return selectedUnit.price ?? 0;
    }, [selectedUnit, hasActiveVariants, selectedVariant, product, qty]);

    const subtotal = unitPrice * qty;
    const stockInsufficient =
        product.track_stock && currentStock !== null && qty > currentStock;
    const canConfirm =
        !stockInsufficient && (selectedVariantId !== null); // "default" atau variant ID

    const handleConfirm = () => {
        if (!canConfirm) return;
        // "default" → kirim null (product-level), variant → kirim variant object
        onConfirm(
            selectedVariant, // null jika "default"
            selectedUnit?.isBase ? null : selectedUnit?.raw ?? null,
            qty,
            note,
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div onClick={onClose} className="absolute inset-0 bg-black/60" />
            <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-popover text-popover-foreground shadow-2xl sm:rounded-3xl">
                {/* Header */}
                <div className="flex items-start gap-4 border-b border-border p-5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                        {product.image ? (
                            <img
                                src={`/storage/${product.image}`}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <svg className="h-7 w-7 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-popover-foreground">{product.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            SKU · {product.sku} · {product.unit || "Pcs"}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
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
                                <h4 className="text-sm font-semibold text-popover-foreground">Choose Variant</h4>
                                <span className="text-[11px] text-muted-foreground">Required</span>
                            </div>
                            <div className="space-y-2.5">
                                {/* Default (product dasar) — hanya tampil saat sell_base aktif */}
                                {product.sell_base && (
                                <div
                                    className={`overflow-hidden rounded-2xl border transition-colors ${
                                        isDefaultOutOfStock
                                            ? "border-border bg-muted/50 opacity-60"
                                            : isDefaultSelected
                                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                              : "border-border bg-card"
                                    }`}
                                >
                                    <div
                                        className={`flex items-center gap-3 p-3.5 ${isDefaultOutOfStock ? "cursor-not-allowed" : "cursor-pointer"}`}
                                        onClick={handlePickDefault}
                                    >
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                                isDefaultSelected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-card text-transparent"
                                            }`}
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                                            </svg>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-popover-foreground">
                                                {product.name} <span className="text-muted-foreground font-normal">(Default)</span>
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">SKU · {product.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            {isDefaultOutOfStock ? (
                                                <p className="text-xs font-semibold text-destructive">Stok habis</p>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-semibold text-popover-foreground">{fmt(product.sell_price)}</p>
                                                    <p className="text-[10px] text-muted-foreground">Retail</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* Variant list */}
                                {activeVariants.map((v) => {
                                    const isActive = selectedVariantId === v.id;
                                    const isExpanded = expandedVariantId === v.id;
                                    const variantOutOfStock = isOutOfStock(v.stock);
                                    const tiers = (v.price_tiers ?? []).slice().sort((a, b) => a.min_qty - b.min_qty);
                                    return (
                                        <div
                                            key={v.id}
                                            className={`overflow-hidden rounded-2xl border transition-colors ${
                                                variantOutOfStock
                                                    ? "border-border bg-muted/50 opacity-60"
                                                    : isActive
                                                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                      : "border-border bg-card"
                                            }`}
                                        >
                                            <div
                                                className={`flex items-center gap-3 p-3.5 ${variantOutOfStock ? "cursor-not-allowed" : "cursor-pointer"}`}
                                                onClick={() => handlePickVariant(v)}
                                            >
                                                <span
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                                        isActive
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border bg-card text-transparent"
                                                    }`}
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                                                    </svg>
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-popover-foreground">{v.name}</p>
                                                    {v.sku && <p className="mt-0.5 text-[11px] text-muted-foreground">SKU · {v.sku}</p>}
                                                </div>
                                                <div className="text-right">
                                                    {variantOutOfStock ? (
                                                        <p className="text-xs font-semibold text-destructive">Stok habis</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-semibold text-popover-foreground">{fmt(v.price)}</p>
                                                            <p className="text-[10px] text-muted-foreground">Retail</p>
                                                        </>
                                                    )}
                                                </div>
                                                {tiers.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedVariantId((cur) => (cur === v.id ? null : v.id));
                                                        }}
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
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
                                                <div className="space-y-1.5 border-t border-border px-3.5 pb-4 pt-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Retail</span>
                                                        <span className="font-medium text-popover-foreground">{fmt(v.price)}</span>
                                                    </div>
                                                    {tiers.map((t) => (
                                                        <div key={t.id ?? t.min_qty} className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground">{t.min_qty}+ pcs</span>
                                                            <span className="font-medium text-success">{fmt(t.price)}</span>
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
                                <h4 className="text-sm font-semibold text-popover-foreground">Choose Unit</h4>
                                <span className="text-[11px] text-muted-foreground">Multi-unit</span>
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
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                    : "border-border bg-card hover:border-primary/30"
                                            }`}
                                        >
                                            <span
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                                    isActive
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-card text-transparent"
                                                }`}
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                                                </svg>
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-popover-foreground">
                                                    {u.name}
                                                    {u.isBase && (
                                                        <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">(satuan dasar)</span>
                                                    )}
                                                </p>
                                                {!u.isBase && (
                                                    <p className="text-[11px] text-muted-foreground">
                                                        1 {u.name} = {u.conversion} {product.unit || "pcs"}
                                                    </p>
                                                )}
                                            </div>
                                            {!u.isBase && (
                                                <span className="shrink-0 text-sm font-semibold text-popover-foreground">{fmt(u.price)}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Quantity */}
                    <section>
                        <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-popover-foreground">Quantity</h4>
                            {product.track_stock && currentStock !== null && (
                                <span className={`text-[11px] font-medium ${currentStock <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                    Stok: {currentStock} {selectedUnit && !selectedUnit.isBase ? selectedUnit.name : product.unit || "pcs"}
                                </span>
                            )}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-muted/80"
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
                                className="w-16 border-0 bg-transparent text-center text-base font-semibold text-popover-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                                type="button"
                                onClick={() => setQty((q) => q + 1)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                </svg>
                            </button>
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <h4 className="mb-3 text-sm font-semibold text-popover-foreground">Item Notes</h4>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Catatan opsional..."
                            className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/10"
                        />
                    </section>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 border-t border-border bg-popover px-5 py-4">
                    <div className="flex-1">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Subtotal</div>
                        <div className="text-lg font-semibold text-popover-foreground">{fmt(subtotal)}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-2xl bg-muted px-4 text-sm font-medium text-popover-foreground hover:bg-muted/80"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                        className="h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {selectedVariantId === null
                            ? "Stok habis"
                            : stockInsufficient
                              ? "Stok tidak cukup"
                              : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}
