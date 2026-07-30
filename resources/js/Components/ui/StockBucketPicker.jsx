import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, ChevronDown, ChevronRight, ArrowLeft, Search } from "lucide-react";

/**
 * Pemilih bucket stok (Cascading).
 *
 * Stok disimpan per produk + variant + satuan + cabang.
 * Pemilih ini menggunakan pendekatan step-by-step:
 * 1. Pilih Produk
 * 2. Pilih Variant (jika ada)
 * 3. Pilih Satuan (jika ada multi-satuan)
 *
 * Props:
 *   buckets      — array dari BuildsStockBucketOptions
 *   branchId     — cabang yang stoknya ditampilkan
 *   excludeKeys  — Set/array key bucket yang sudah dipilih (opsional)
 *   onSelect     — (bucket) => void
 *   disabled     — boolean
 *   placeholder  — teks tombol saat belum memilih
 */
export default function StockBucketPicker({
    buckets = [],
    branchId = null,
    excludeKeys = [],
    onSelect,
    disabled = false,
    placeholder = "Pilih produk / variant / satuan",
    /**
     * Izinkan memilih produk induk (variant & satuan null) meski produk itu
     * punya varian. Form stok TIDAK memakai ini karena stok selalu hidup di
     * varian; form promo memakainya supaya satu promo bisa menargetkan
     * seluruh varian sebuah produk sekaligus.
     */
    allowParentSelection = false,
    parentOptionLabel = "Semua varian",
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [step, setStep] = useState("product"); // "product", "variant", "unit"
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [selectedVariantId, setSelectedVariantId] = useState(null);

    const containerRef = useRef(null);
    const searchRef = useRef(null);

    const excluded = useMemo(
        () => (excludeKeys instanceof Set ? excludeKeys : new Set(excludeKeys)),
        [excludeKeys],
    );

    useEffect(() => {
        const onClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                // Reset state when closed
                setTimeout(() => {
                    setStep("product");
                    setSelectedProductId(null);
                    setSelectedVariantId(null);
                    setQuery("");
                }, 200);
            }
        };
        if (open) document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [open]);

    useEffect(() => {
        if (open) searchRef.current?.focus();
    }, [open, step]);

    const stockOf = (bucket) => {
        if (branchId === null || branchId === "" || branchId === undefined) return null;
        return bucket.stock_by_branch?.[String(branchId)] ?? 0;
    };

    /** Bucket induk produk: tanpa varian dan tanpa satuan. */
    const parentBucketOf = (productId) =>
        buckets.find(
            (b) =>
                b.product_id === productId &&
                b.variant_id === null &&
                b.packaging_unit_id === null,
        );

    const handleProductClick = (productId) => {
        const prodBuckets = buckets.filter((b) => b.product_id === productId);
        const hasVariants = prodBuckets.some((b) => b.variant_id !== null);

        if (hasVariants) {
            setSelectedProductId(productId);
            setStep("variant");
            setQuery("");
        } else {
            const hasUnits = prodBuckets.length > 1;
            if (hasUnits) {
                setSelectedProductId(productId);
                setSelectedVariantId(null);
                setStep("unit");
                setQuery("");
            } else {
                onSelect?.(prodBuckets[0]);
                setOpen(false);
                setStep("product");
                setQuery("");
            }
        }
    };

    const handleVariantClick = (variantId) => {
        const varBuckets = buckets.filter(
            (b) => b.product_id === selectedProductId && b.variant_id === variantId
        );
        const hasUnits = varBuckets.length > 1;

        if (hasUnits) {
            setSelectedVariantId(variantId);
            setStep("unit");
            setQuery("");
        } else {
            onSelect?.(varBuckets[0]);
            setOpen(false);
            setStep("product");
            setQuery("");
        }
    };

    const visibleOptions = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (step === "product") {
            const uniqueProds = [];
            const seen = new Set();
            buckets.forEach((b) => {
                if (!seen.has(b.product_id)) {
                    // Check if this product has ANY available buckets not excluded
                    const prodBuckets = buckets.filter((x) => x.product_id === b.product_id);
                    const allExcluded = prodBuckets.every((x) => excluded.has(x.key));
                    
                    // We only hide the product if ALL its combinations are excluded
                    // BUT for simplicity and UX, we show it and let the user drill down. 
                    // Actually, let's just filter it out if all are excluded.
                    if (allExcluded) return;

                    if (!q || b.product_name.toLowerCase().includes(q) || b.sku?.toLowerCase().includes(q)) {
                        seen.add(b.product_id);
                        uniqueProds.push({
                            id: b.product_id,
                            name: b.product_name,
                            sku: b.sku,
                            hasChildren: prodBuckets.length > 1,
                        });
                    }
                }
            });
            return uniqueProds;
        } 
        else if (step === "variant") {
            const uniqueVars = [];
            const seen = new Set();
            const prodBuckets = buckets.filter((b) => b.product_id === selectedProductId);

            // Opsi "semua varian" muncul paling atas supaya user bisa memilih
            // produk induk tanpa harus menyebut varian tertentu.
            if (allowParentSelection) {
                const parent = prodBuckets.find(
                    (b) => b.variant_id === null && b.packaging_unit_id === null,
                );

                if (parent && !excluded.has(parent.key)) {
                    uniqueVars.push({
                        id: null,
                        name: parentOptionLabel,
                        hasChildren: false,
                        isParent: true,
                    });
                }
            }

            prodBuckets.forEach((b) => {
                if (b.variant_id !== null && !seen.has(b.variant_id)) {
                    const varBuckets = prodBuckets.filter((x) => x.variant_id === b.variant_id);
                    const allExcluded = varBuckets.every((x) => excluded.has(x.key));
                    
                    if (allExcluded) return;

                    if (!q || b.variant_name.toLowerCase().includes(q)) {
                        seen.add(b.variant_id);
                        uniqueVars.push({
                            id: b.variant_id,
                            name: b.variant_name,
                            hasChildren: varBuckets.length > 1,
                        });
                    }
                }
            });
            return uniqueVars;
        } 
        else if (step === "unit") {
            return buckets
                .filter((b) => b.product_id === selectedProductId && b.variant_id === selectedVariantId)
                .filter((b) => !excluded.has(b.key))
                .filter((b) => {
                    const label = b.unit_name || b.base_unit || "Dasar";
                    return !q || label.toLowerCase().includes(q);
                });
        }
        return [];
    }, [
        buckets,
        step,
        selectedProductId,
        selectedVariantId,
        query,
        excluded,
        allowParentSelection,
        parentOptionLabel,
    ]);

    const goBack = () => {
        if (step === "unit") {
            // Check if product had variants to know where to go back
            const prodBuckets = buckets.filter((b) => b.product_id === selectedProductId);
            const hasVariants = prodBuckets.some((b) => b.variant_id !== null);
            if (hasVariants) {
                setStep("variant");
            } else {
                setStep("product");
                setSelectedProductId(null);
            }
        } else if (step === "variant") {
            setStep("product");
            setSelectedProductId(null);
        }
        setQuery("");
    };

    // Helper for title
    const currentProduct = useMemo(() => buckets.find((b) => b.product_id === selectedProductId), [buckets, selectedProductId]);
    const currentVariant = useMemo(() => buckets.find((b) => b.product_id === selectedProductId && b.variant_id === selectedVariantId), [buckets, selectedProductId, selectedVariantId]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    if (!open) {
                        setStep("product");
                        setSelectedProductId(null);
                        setSelectedVariantId(null);
                        setQuery("");
                    }
                    setOpen(!open);
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
                <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                <span className="flex-1 truncate text-left text-muted-foreground">
                    {placeholder}
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    strokeWidth={2}
                />
            </button>

            {open && !disabled && (
                <div className="absolute z-50 mt-2 w-full rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
                    <div className="border-b border-border bg-muted/20">
                        {step !== "product" && (
                            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                    <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-foreground">
                                        {currentProduct?.product_name}
                                    </p>
                                    {step === "unit" && currentVariant?.variant_name && (
                                        <p className="truncate text-[10px] text-muted-foreground">
                                            Variant: {currentVariant.variant_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="relative p-2">
                            <Search
                                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                strokeWidth={1.8}
                            />
                            <input
                                ref={searchRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={
                                    step === "product"
                                        ? "Cari produk..."
                                        : step === "variant"
                                        ? "Cari variant..."
                                        : "Cari satuan..."
                                }
                                className="w-full rounded-lg border border-input bg-background py-1.5 pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto p-1.5">
                        {visibleOptions.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                                {buckets.length === 0 ? "Belum ada produk." : "Tidak ada yang cocok."}
                            </p>
                        ) : (
                            visibleOptions.map((opt) => {
                                if (step === "product") {
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => handleProductClick(opt.id)}
                                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="block truncate font-medium">{opt.name}</span>
                                                {opt.sku && (
                                                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                                                        {opt.sku}
                                                    </span>
                                                )}
                                            </div>
                                            {opt.hasChildren && (
                                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                                            )}
                                        </button>
                                    );
                                }
                                if (step === "variant") {
                                    // Opsi induk langsung memilih bucket produk,
                                    // tidak menelusuri varian lebih dalam.
                                    if (opt.isParent) {
                                        return (
                                            <button
                                                key="parent"
                                                type="button"
                                                onClick={() => {
                                                    const parent = parentBucketOf(selectedProductId);
                                                    if (!parent) return;
                                                    onSelect?.(parent);
                                                    setOpen(false);
                                                    setStep("product");
                                                    setQuery("");
                                                }}
                                                className="mb-1 flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-left text-sm transition hover:bg-primary/10"
                                            >
                                                <span className="block truncate font-semibold text-primary">
                                                    {opt.name}
                                                </span>
                                            </button>
                                        );
                                    }

                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => handleVariantClick(opt.id)}
                                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <span className="block truncate font-medium">{opt.name}</span>
                                            {opt.hasChildren && (
                                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                                            )}
                                        </button>
                                    );
                                }
                                if (step === "unit") {
                                    // opt is a bucket
                                    const stock = stockOf(opt);
                                    return (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => {
                                                onSelect?.(opt);
                                                setOpen(false);
                                                setStep("product");
                                                setQuery("");
                                            }}
                                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="block truncate font-medium">
                                                    {opt.unit_name || opt.base_unit || "Satuan Dasar"}
                                                </span>
                                                {opt.conversion_qty ? (
                                                    <span className="block truncate text-[11px] text-muted-foreground">
                                                        1 {opt.unit_name} = {opt.conversion_qty} {opt.unit || "pcs"}
                                                    </span>
                                                ) : (
                                                    <span className="block truncate text-[11px] text-muted-foreground">
                                                        Satuan Dasar
                                                    </span>
                                                )}
                                            </div>
                                            {stock !== null && (
                                                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                                    Stok: {stock}
                                                </span>
                                            )}
                                        </button>
                                    );
                                }
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Label ringkas satu bucket untuk ditampilkan di baris item yang sudah dipilih.
 * Dipakai bersama supaya ketiga form stok menuliskannya dengan cara yang sama.
 */
export function BucketItemLabel({ item }) {
    return (
        <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
                {item.product_name}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
                {item.variant_name && (
                    <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {item.variant_name}
                    </span>
                )}
                {item.unit_name && (
                    <span className="inline-flex items-center rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                        {item.unit_name}
                        {item.conversion_qty
                            ? ` · ${item.conversion_qty} ${item.unit || "pcs"}`
                            : ""}
                    </span>
                )}
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {item.product_sku}
                </span>
            </div>
        </div>
    );
}
