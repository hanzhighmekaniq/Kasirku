import { PackageX } from "lucide-react";
import useKasir from "../useKasir";
import ProductCard from "../components/ProductCard";
import RetailProductModal from "../components/retail/RetailProductModal";
import KasirLayout from "./KasirLayout";

export default function RetailKasir(props) {
    const k = useKasir(props);
    const { categories } = props;

    const chipClass = (active) =>
        `shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
            active
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
        }`;

    const categoryChips = (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        </div>
    );

    const mainContent = (
        <div className="@container flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {k.filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-2xl bg-slate-100 p-6">
                        <PackageX size={44} className="text-slate-300" />
                    </div>
                    <p className="text-base font-semibold text-slate-600">
                        {k.search ? "Produk tidak ditemukan" : "Belum ada produk"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                        {k.search
                            ? "Coba kata kunci atau barcode lain"
                            : "Tambahkan produk terlebih dahulu"}
                    </p>
                </div>
            ) : (
                <>
                    <p className="mb-3 text-[11.5px] font-medium text-slate-400">
                        {k.filtered.length} produk
                    </p>
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
