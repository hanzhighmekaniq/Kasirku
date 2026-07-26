import { useState } from "react";
import { PackageX, SlidersHorizontal } from "lucide-react";
import useKasir from "../useKasir";
import ProductCard from "../components/ProductCard";
import RetailProductModal from "../components/retail/RetailProductModal";
import KasirLayout from "./KasirLayout";

const SORT_OPTIONS = [
    { value: "default", label: "Default" },
    { value: "name_asc", label: "Nama A-Z" },
    { value: "price_asc", label: "Harga Terendah" },
    { value: "price_desc", label: "Harga Tertinggi" },
];

export default function RetailKasir(props) {
    const k = useKasir(props);
    const { categories } = props;
    const [showFilters, setShowFilters] = useState(false);

    const chipClass = (active) =>
        `shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${active
            ? "bg-secondary text-secondary-foreground shadow-sm"
            : "border border-border bg-card text-muted-foreground hover:border-secondary hover:text-primary"
        }`;

    const hasActiveFilter = k.stockFilter !== "all" || k.sortBy !== "default";

    const categoryChips = (
        <div className="flex items-center gap-2 overflow-x-auto rounded-b-lg px-1 lg:px-2 py-2 tollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={() => k.setActiveCat("")} className={chipClass(!k.activeCat)}>
                Semua
            </button>
            {categories.map((c) => (
                <button
                    key={c.id}
                    onClick={() =>
                        k.setActiveCat(
                            String(c.id) === k.activeCat ? "" : String(c.id),
                        )
                    }
                    className={chipClass(String(c.id) === k.activeCat)}
                >
                    {c.name}{" "}
                    <span className="opacity-50">({c.products_count})</span>
                </button>
            ))}
            <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                    hasActiveFilter
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:border-secondary hover:text-primary"
                }`}
            >
                <SlidersHorizontal size={14} />
                Filter
                {hasActiveFilter && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[9px]">
                        •
                    </span>
                )}
            </button>
        </div>
    );

    const filterPanel = showFilters && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Stok:</span>
                <button
                    type="button"
                    onClick={() =>
                        k.setStockFilter(k.stockFilter === "in_stock" ? "all" : "in_stock")
                    }
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        k.stockFilter === "in_stock"
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:border-secondary"
                    }`}
                >
                    Stok ada saja
                </button>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Urutkan:</span>
                <select
                    value={k.sortBy}
                    onChange={(e) => k.setSortBy(e.target.value)}
                    className="rounded-lg border border-input bg-background px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            {hasActiveFilter && (
                <button
                    type="button"
                    onClick={() => {
                        k.setStockFilter("all");
                        k.setSortBy("default");
                    }}
                    className="ml-auto text-[11px] font-semibold text-destructive hover:underline"
                >
                    Reset
                </button>
            )}
        </div>
    );

    const mainContent = (
        <div className="@container flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filterPanel}
            {k.filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-2xl bg-muted p-6">
                        <PackageX size={44} className="text-muted-foreground/30" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                        {k.search ? "Produk tidak ditemukan" : "Belum ada produk"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {k.search
                            ? "Coba kata kunci atau barcode lain"
                            : "Tambahkan produk terlebih dahulu"}
                    </p>
                </div>
            ) : (
                <>

                    <div className="grid grid-cols-1 gap-3 @xs:grid-cols-2 @md:grid-cols-3 @xl:grid-cols-4 @4xl:grid-cols-5">
                        {k.filtered.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                onClick={() => k.handleProductClick(p)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <>
            <KasirLayout
                k={k}
                props={props}
                mainContent={mainContent}
                categoryChips={categoryChips}
            />
            {k.retailProductTarget && (
                <RetailProductModal
                    product={k.retailProductTarget}
                    onConfirm={(variant, packagingUnit, qty, note) => {
                        k.addToCart(
                            k.retailProductTarget,
                            variant,
                            [],
                            note,
                            packagingUnit,
                            qty,
                        );
                        k.setRetailProductTarget(null);
                    }}
                    onClose={() => k.setRetailProductTarget(null)}
                />
            )}
        </>
    );
}
