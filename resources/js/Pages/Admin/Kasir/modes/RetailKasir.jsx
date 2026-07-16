import useKasir from "../useKasir";
import ProductCard from "../components/ProductCard";
import RetailProductModal from "../components/retail/RetailProductModal";
import KasirLayout from "./KasirLayout";

export default function RetailKasir(props) {
    const k = useKasir(props);
    const { categories } = props;

    const categoryChips = (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
                onClick={() => k.setActiveCat("")}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${!k.activeCat ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"}`}
            >
                All
            </button>
            {categories.map((c) => (
                <button
                    key={c.id}
                    onClick={() => k.setActiveCat(String(c.id) === k.activeCat ? "" : String(c.id))}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${String(c.id) === k.activeCat ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"}`}
                >
                    {c.name} <span className="opacity-60">({c.products_count})</span>
                </button>
            ))}
            <button className="ml-auto shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                Filters
            </button>
        </div>
    );

    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mb-3 flex items-end justify-between">
                <div>
                    <p className="text-[15px] font-semibold tracking-tight text-slate-900">Products</p>
                    <p className="mt-0.5 text-[11.5px] text-slate-400">{k.filtered.length} items</p>
                </div>
            </div>
            {k.filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-slate-100 p-6">
                        <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                        </svg>
                    </div>
                    <p className="text-base font-medium text-slate-600">{k.search ? "Produk tidak ditemukan" : "Tidak ada produk"}</p>
                    <p className="mt-1 text-sm text-slate-400">{k.search ? "Coba kata kunci lain" : "Tambahkan produk terlebih dahulu"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                    {k.filtered.map((p) => (
                        <ProductCard key={p.id} product={p} onClick={() => k.handleProductClick(p)} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <>
            <KasirLayout k={k} props={props} mainContent={mainContent} categoryChips={categoryChips} />
            {k.retailProductTarget && (
                <RetailProductModal
                    product={k.retailProductTarget}
                    onConfirm={(variant, packagingUnit, qty, note) => {
                        k.addToCart(k.retailProductTarget, variant, [], note, packagingUnit, qty);
                        k.setRetailProductTarget(null);
                    }}
                    onClose={() => k.setRetailProductTarget(null)}
                />
            )}
        </>
    );
}
