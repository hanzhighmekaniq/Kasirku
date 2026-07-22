import { useState, useRef, useEffect } from "react";
import { fmt } from "./helpers";

/**
 * Product card — gambar 4/3, badge status di pojok kiri atas, info produk
 * ringkas di bawah. Klik card = tambah produk (tombol + dihapus).
 * Semua keputusan modal diserahkan ke parent lewat `onClick`.
 */
export default function ProductCard({ product, onClick }) {
    const [showGrosir, setShowGrosir] = useState(false);
    const grosirRef = useRef(null);

    const packagingUnits = product.packaging_units ?? [];
    const hasUnits = packagingUnits.length > 0;
    const activeVariants = (product.variants ?? []).filter((v) => v.is_active);
    const hasActiveVariants = activeVariants.length > 0;

    // Total stok = product-level (variant_id=NULL) + semua variant.
    // Kalau produk punya variant tapi sell_base dimatikan, opsi "Default"
    // tidak dijual sama sekali — jadi stok product-level TIDAK dihitung,
    // supaya kartu tidak dianggap "In Stock" hanya karena bucket default
    // masih ada sisa padahal tidak bisa dipilih di modal.
    const defaultCountsTowardStock = hasActiveVariants ? !!product.sell_base : true;
    const totalStock = hasActiveVariants
        ? (defaultCountsTowardStock ? Number(product.stock ?? 0) : 0) +
          activeVariants.reduce((sum, v) => sum + Number(v.stock ?? 0), 0)
        : Number(product.stock ?? 0);

    const isOut = product.track_stock && totalStock <= 0;
    const hasRecipe = product.recipes?.length > 0;
    const ingredientShortage = hasRecipe
        ? product.recipes.filter(
              (r) =>
                  !r.is_nullable &&
                  (r.raw_material?.current_stock ?? 0) < r.quantity,
          )
        : [];
    const isIngredientOut = ingredientShortage.length > 0;
    const isDisabled = hasRecipe ? isIngredientOut : isOut;
    const isLowStock =
        !hasRecipe &&
        product.track_stock &&
        totalStock > 0 &&
        totalStock <= 10;

    const productTiers = (product.price_tiers ?? []).filter((t) => !t.variant_id);
    const hasGrosir = productTiers.length > 0 && !hasActiveVariants;
    const showGrosirButton = hasGrosir && !hasUnits && !isDisabled;

    useEffect(() => {
        if (!showGrosir) return;
        const handleClickOutside = (e) => {
            if (grosirRef.current && !grosirRef.current.contains(e.target)) {
                setShowGrosir(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showGrosir]);

    const handleCardClick = () => {
        if (isDisabled) return;
        onClick?.();
    };

    const priceBlock = hasActiveVariants ? (
        <div className="text-[10px] sm:text-[12.5px] text-muted-foreground">
            From{" "}
            <span className="font-semibold text-card-foreground">
                {fmt(Math.min(...activeVariants.map((v) => Number(v.price))))}
            </span>
        </div>
    ) : (
        <span className="text-[12px] sm:text-[15px] font-semibold tracking-tight text-card-foreground">
            {fmt(product.sell_price)}
            {hasUnits && (
                <span className="ml-1 text-[9px] sm:text-[10px] font-medium text-muted-foreground/60">
                    /{product.unit || "Pcs"}
                </span>
            )}
        </span>
    );



    return (
        <article
            onClick={handleCardClick}
            className={`group relative flex min-w-[150px] flex-col overflow-hidden rounded-3xl border border-2 bg-card transition-all duration-300 ${
                isDisabled
                    ? "border-border opacity-60 cursor-not-allowed"
                    : "border-border shadow-sm hover:-translate-y-1 hover:shadow-xl hover:border-border cursor-pointer"
            }`}
        >
            {/* Image area — aspek 4/3 ala index1.html */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/50">
                {product.image ? (
                    <img
                        src={`/storage/${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg
                            className="h-14 w-14 text-muted-foreground/30"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                            />
                        </svg>
                    </div>
                )}

                {/* Badge status — pojok kiri atas: Low stock > Has Variants > In Stock */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    {isLowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold text-warning shadow-sm">
                            <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-warning" />
                            Low stock
                        </span>
                    ) : hasActiveVariants ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold text-accent-foreground shadow-sm">
                            <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-accent" />
                            Has Variants
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold text-success shadow-sm">
                            <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-success" />
                            In Stock
                        </span>
                    )}
                </div>

                {/* Disabled overlay */}
                {isDisabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
                        <div className="rounded-lg bg-foreground px-3 py-1.5 sm:px-4 sm:py-2 font-bold text-background shadow-lg">
                            <span className="text-xs sm:text-sm">HABIS</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Info area */}
            <div className="flex flex-1 flex-col p-2 sm:p-4">
                <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                    <div className="min-w-0">
                        <h3 className="line-clamp-2 text-[11px] sm:text-[15px] font-semibold leading-tight text-card-foreground">
                            {product.name}
                        </h3>
                        <p className="mt-0.5 hidden sm:block text-xs text-muted-foreground">SKU · {product.sku}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-md bg-muted px-1 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[11px] font-medium text-muted-foreground">
                        {product.unit || "Pcs"}
                    </span>
                </div>

                <div className="mt-2 sm:mt-4 flex items-end justify-between gap-1.5 sm:gap-3">
                    <div className="min-w-0">
                        {priceBlock}
                        {hasUnits && (
                            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-medium text-primary">
                                Ada multi satuan
                            </p>
                        )}
                        {showGrosirButton ? (
                            <div className="relative mt-1" ref={grosirRef}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowGrosir((v) => !v);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success transition hover:bg-success/20"
                                >
                                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success text-[9px] font-bold text-success-foreground">
                                        !
                                    </span>
                                    Ada harga grosir
                                </button>
                                {showGrosir && (
                                    <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-border bg-popover p-3 shadow-xl">
                                        <p className="mb-2 text-[11px] font-semibold text-popover-foreground">
                                            Harga Grosir
                                        </p>
                                        <div className="space-y-1.5">
                                            {[...productTiers]
                                                .sort((a, b) => a.min_qty - b.min_qty)
                                                .map((tier, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between text-[11px]"
                                                    >
                                                        <span className="text-muted-foreground">
                                                            Min {tier.min_qty} {product.unit || "pcs"}
                                                        </span>
                                                        <span className="font-semibold text-popover-foreground">
                                                            {fmt(Number(tier.price))}/{product.unit || "pcs"}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                        <div className="mt-2 border-t border-border pt-2 text-[10px] text-muted-foreground">
                                            Harga berlaku otomatis sesuai jumlah
                                        </div>
                                        <div className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-b border-r border-border bg-popover" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            (hasGrosir || activeVariants.some((v) => v.price_tiers?.length > 0)) && (
                                <p className="mt-1 text-[11px] font-medium text-success">
                                    Ada harga grosir
                                </p>
                            )
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
