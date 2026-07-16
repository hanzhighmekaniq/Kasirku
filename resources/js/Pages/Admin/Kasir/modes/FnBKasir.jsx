import { useState, useMemo } from "react";
import useKasir from "../useKasir";
import ProductCard from "../components/ProductCard";
import KasirLayout from "./KasirLayout";

export default function FnBKasir(props) {
    const k = useKasir(props);
    const { categories, tables = [] } = props;
    const [activeTab, setActiveTab] = useState("menu");

    const orderTypeCards = [
        { v: "dine_in", l: "Dine In", ic: "🍽️", meta: tables.length > 0 ? `${tables.length} meja` : "Pilih meja" },
        { v: "takeaway", l: "Take Away", ic: "🥡", meta: "Bungkus" },
        { v: "delivery", l: "Delivery", ic: "🛵", meta: "GoFood · Grab" },
    ];

    const tableStatusMap = {
        free: { c: "bg-white border-slate-200 text-slate-700 hover:border-indigo-400", l: "Available" },
        occupied: { c: "bg-rose-50 border-rose-200 text-rose-700", l: "Occupied" },
        reserved: { c: "bg-amber-50 border-amber-200 text-amber-700", l: "Reserved" },
    };

    const kitchenQueue = [
        { table: "T-03", status: "Cooking", name: "Wagyu Burger ×2", time: "4:32", tone: "warn" },
        { table: "T-07", status: "New", name: "Truffle Carbonara ×1", time: "0:12", tone: "brand" },
        { table: "TA-19", status: "Ready", name: "Iced Latte ×3", time: "—", tone: "success" },
        { table: "T-11", status: "Cooking", name: "Margherita Pizza", time: "6:04", tone: "warn" },
    ];

    const toneMap = {
        warn: "bg-amber-50 text-amber-700 border border-amber-100",
        brand: "bg-indigo-50 text-indigo-700 border border-indigo-100",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    };

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
        </div>
    );

    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Order type selector */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {orderTypeCards.map((o) => (
                    <button
                        key={o.v}
                        onClick={() => k.handleOrderTypeChange(o.v)}
                        className={`rounded-xl border p-3 text-left transition-all flex items-center gap-3 ${k.orderType === o.v ? "border-indigo-500 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm" : "border-slate-200 bg-white hover:border-indigo-300"}`}
                    >
                        <div className={`h-10 w-10 rounded-lg grid place-items-center text-lg ${k.orderType === o.v ? "bg-white/10" : "bg-slate-50"}`}>{o.ic}</div>
                        <div>
                            <div className="text-[13px] font-semibold">{o.l}</div>
                            <div className={`text-[10.5px] mt-0.5 ${k.orderType === o.v ? "text-white/70" : "text-slate-500"}`}>{o.meta}</div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Floor map + Kitchen queue */}
            <div className="grid grid-cols-3 gap-5 mb-6">
                <div className="col-span-2 rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Floor Map</div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">{tables.length} tables</div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white border border-slate-200"></span>Free</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-100 border border-rose-200"></span>Occupied</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100 border border-amber-200"></span>Reserved</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-6 gap-2.5">
                        {tables.map((t) => {
                            const st = t.status || "free";
                            const s = tableStatusMap[st] || tableStatusMap.free;
                            return (
                                <div key={t.id} onClick={() => k.setSelectedTable(t.id)} className={`rounded-xl border ${s.c} p-3 aspect-square flex flex-col justify-between transition-all cursor-pointer hover:shadow-sm`}>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10.5px] uppercase tracking-wider font-medium opacity-70">Table</div>
                                        {k.selectedTable === t.id && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
                                    </div>
                                    <div className="text-[22px] font-semibold tracking-tight">{t.table_number}</div>
                                    <div className="text-[10.5px] opacity-80">{s.l}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Kitchen Queue</div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">{kitchenQueue.length} tickets</div>
                        </div>
                    </div>
                    <div className="space-y-2 flex-1">
                        {kitchenQueue.map((item, i) => (
                            <div key={i} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-[12px] font-semibold">{item.table}</div>
                                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium ${toneMap[item.tone]}`}>{item.status}</span>
                                </div>
                                <div className="text-[12px] text-slate-600">{item.name}</div>
                                <div className="text-[10.5px] text-slate-500 mt-1">Elapsed {item.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu grid */}
            <div className="mb-3 flex items-end justify-between">
                <div>
                    <p className="text-[15px] font-semibold tracking-tight text-slate-900">Menu</p>
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
                    <p className="text-base font-medium text-slate-600">{k.search ? "Menu tidak ditemukan" : "Tidak ada menu"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                    {k.filtered.map((p) => (
                        <ProductCard key={p.id} product={p} onClick={() => k.handleProductClick(p)} onUnitClick={(unit, qty) => k.addToCart(p, null, [], "", unit, qty)} />
                    ))}
                </div>
            )}
        </div>
    );

    return <KasirLayout k={k} props={props} mainContent={mainContent} categoryChips={categoryChips} />;
}
