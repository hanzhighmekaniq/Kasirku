import { useState, useRef } from "react";
import useKasir from "../useKasir";
import ProductCard from "../components/ProductCard";
import KasirLayout from "./KasirLayout";
import {
    Search, ScanLine, UserRound, X, UtensilsCrossed,
    ShoppingBag, Bike, Grid3x3, ChevronRight, PauseCircle,
    Bell, Maximize2, Clock,
} from "lucide-react";
import TipButton from "../components/ui/TipButton";

/* ── Gradient palette (12 warna ala kasirFnB.html) ── */
const GRADS = [
    "from-orange-400 to-rose-500",
    "from-amber-700 to-yellow-900",
    "from-stone-200 to-amber-600",
    "from-zinc-900 to-stone-700",
    "from-green-300 to-emerald-600",
    "from-amber-900 to-stone-900",
    "from-yellow-200 to-amber-500",
    "from-orange-200 to-amber-500",
    "from-amber-500 to-yellow-800",
    "from-yellow-200 to-amber-400",
    "from-stone-100 to-amber-300",
    "from-stone-900 to-zinc-950",
];
const grad = (id) => GRADS[(id ?? 0) % GRADS.length];

/* ── Badge label dari produk ── */
function productBadge(p) {
    if (!p.badge && !p.is_featured) return null;
    const label = p.badge || (p.is_featured ? "Best Seller" : null);
    if (!label) return null;
    const cls =
        label === "Best Seller" ? "bg-amber-100 text-amber-700" :
        label === "Promo"       ? "bg-rose-100 text-rose-700" :
                                  "bg-sky-100 text-sky-700";
    return (
        <span className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
            {label}
        </span>
    );
}

/* ── FnB Menu Card — persis kasirFnB.html ── */
function MenuCard({ product, onClick }) {
    const hasImage = !!product.image;
    const isOut = product.track_stock && (product.stock ?? 0) <= 0;
    const isLow = !isOut && product.track_stock && (product.stock ?? 0) <= 3;

    return (
        <div
            onClick={() => !isOut && onClick?.()}
            className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200
                ${isOut ? "opacity-55 cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"}`}
        >
            {/* Image / gradient area */}
            <div className={`relative h-24 w-full sm:h-28 bg-gradient-to-br ${grad(product.id)} overflow-hidden`}>
                {hasImage && (
                    <img
                        src={`/storage/${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                )}
                {productBadge(product)}
                {isOut && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white">
                        Habis
                    </span>
                )}
                {!isOut && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                        className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-md transition hover:bg-primary hover:text-white group-hover:scale-110"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                )}
                {isOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
                        <span className="rounded-lg bg-foreground px-3 py-1 text-[11px] font-bold text-background">HABIS</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-2.5">
                <p className="line-clamp-2 min-h-[34px] text-[13px] font-semibold leading-snug text-card-foreground">
                    {product.name}
                </p>
                <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-card-foreground">
                        Rp {Number(product.sell_price ?? 0).toLocaleString("id-ID")}
                    </span>
                    <span className={`text-[10px] font-medium ${isOut ? "text-destructive" : isLow ? "text-amber-600" : "text-success"}`}>
                        {isOut ? "Habis" : isLow ? `Sisa ${product.stock}` : "Tersedia"}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function FnBKasir(props) {
    const k = useKasir(props);
    const { categories, tables = [] } = props;

    const [deliveryPlatform, setDeliveryPlatform] = useState("GoFood");

    const orderTypes = [
        { v: "dine_in",  l: "Dine In",   icon: <UtensilsCrossed size={14} /> },
        { v: "takeaway", l: "Take Away",  icon: <ShoppingBag size={14} /> },
        { v: "delivery", l: "Delivery",   icon: <Bike size={14} /> },
    ];

    const deliveryPlatforms = ["GoFood", "GrabFood", "ShopeeFood", "Pesanan Langsung"];

    /* Table status */
    const tStyle = {
        available: { cls: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer", label: "Tersedia" },
        occupied:  { cls: "border-red-200   bg-red-50   text-red-700   opacity-70 cursor-not-allowed",             label: "Terisi"   },
        reserved:  { cls: "border-amber-200 bg-amber-50 text-amber-700 opacity-70 cursor-not-allowed",             label: "Reserved" },
    };

    /* Kitchen queue placeholder */
    const kitchenQueue = [
        { table: "A-01", status: "Cooking", items: "Cafe Latte ×2",         time: "4:32", tone: "warn"    },
        { table: "B-02", status: "New",     items: "Cappuccino ×1",          time: "0:12", tone: "brand"   },
        { table: "TA-19",status: "Ready",   items: "Kopi Susu Gula Aren ×3", time: "—",    tone: "success" },
        { table: "O-01", status: "Cooking", items: "Roti Bakar Keju ×2",     time: "6:04", tone: "warn"    },
    ];
    const toneCls = {
        warn:    "bg-warning/10 text-warning border border-warning/20",
        brand:   "bg-primary/10 text-primary border border-primary/20",
        success: "bg-success/10 text-success border border-success/20",
    };

    const selectedCustomerObj = k.customers?.find(
        (c) => String(c.id) === String(k.selectedCustomer),
    );

    /* ══════════════════════════════════════════════
       SEARCH BAR (override default KasirLayout)
    ══════════════════════════════════════════════ */
    const searchBar = (
        <div className="shrink-0 space-y-3 border-b border-border bg-card px-4 pt-3 pb-3">

            {/* Row 1: Order type + table/extra + customer */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

                {/* Order type pill + context */}
                <div className="lg:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/40 px-3 py-2.5 shadow-sm">
                    {/* Pill switcher */}
                    <div className="inline-flex rounded-xl bg-muted p-1 gap-0.5">
                        {orderTypes.map((o) => (
                            <button
                                key={o.v}
                                type="button"
                                onClick={() => k.handleOrderTypeChange(o.v)}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all
                                    ${k.orderType === o.v
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {o.icon}
                                {o.l}
                            </button>
                        ))}
                    </div>

                    {/* Dine In: meja */}
                    {k.orderType === "dine_in" && (
                        k.selectedTable ? (
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
                                <Grid3x3 size={14} className="text-primary" />
                                <span className="text-[13px] font-medium text-card-foreground">Meja</span>
                                <span className="text-[13px] font-bold text-foreground">
                                    {tables.find((t) => String(t.id) === String(k.selectedTable))?.table_number}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => { k.setSelectedTable(""); k.setTableSearch?.(""); }}
                                    className="ml-1 rounded-full p-0.5 text-muted-foreground/50 hover:text-destructive"
                                >
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-[13px] text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition"
                            >
                                <Grid3x3 size={14} />
                                <span className="font-medium">Meja</span>
                                <span className="font-bold text-foreground">—</span>
                            </button>
                        )
                    )}

                    {/* Take Away: badge */}
                    {k.orderType === "takeaway" && (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
                            <ShoppingBag size={14} className="text-muted-foreground" />
                            <span className="text-[13px] text-muted-foreground">No.</span>
                            <span className="text-[13px] font-bold text-foreground">TA-024</span>
                        </div>
                    )}

                    {/* Delivery: platform chips */}
                    {k.orderType === "delivery" && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {deliveryPlatforms.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setDeliveryPlatform(p)}
                                    className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition
                                        ${deliveryPlatform === p
                                            ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                                            : "border-border text-muted-foreground hover:bg-muted/50"}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Customer selector */}
                <button
                    type="button"
                    onClick={() => k.setShowCustomerModal?.(true)}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        {selectedCustomerObj
                            ? <span className="text-sm font-bold text-primary">{selectedCustomerObj.name?.charAt(0)}</span>
                            : <UserRound size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">Pelanggan</p>
                        <p className="truncate text-[13px] font-semibold text-foreground">
                            {selectedCustomerObj ? selectedCustomerObj.name : "Pelanggan Umum"}
                        </p>
                    </div>
                    <ChevronRight size={15} className="shrink-0 text-muted-foreground/50" />
                </button>
            </div>

            {/* Delivery extra fields */}
            {k.orderType === "delivery" && (
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        placeholder="Nama pelanggan"
                        value={k.deliveryCustomerName ?? ""}
                        onChange={(e) => k.setDeliveryCustomerName?.(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/50 focus:border-primary"
                    />
                    <input
                        type="text"
                        placeholder="No. order platform"
                        value={k.deliveryOrderNo ?? ""}
                        onChange={(e) => k.setDeliveryOrderNo?.(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/50 focus:border-primary"
                    />
                </div>
            )}

            {/* Search bar */}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm">
                <Search size={16} className="shrink-0 text-muted-foreground/50 ml-1" />
                <input
                    ref={k.barcodeRef}
                    type="text"
                    value={k.search}
                    onChange={(e) => k.setSearch(e.target.value)}
                    placeholder="Cari menu, SKU, atau scan barcode... (F2)"
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
                />
                {k.search && (
                    <button type="button" onClick={() => k.setSearch("")}
                        className="shrink-0 rounded-full p-1 text-muted-foreground/50 hover:text-foreground">
                        <X size={13} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => k.setShowScanner(true)}
                    className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
                >
                    <ScanLine size={15} />
                </button>
            </div>
        </div>
    );

    /* ══════════════════════════════════════════════
       CATEGORY CHIPS — dark active (ala HTML ref)
    ══════════════════════════════════════════════ */
    const categoryChips = (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
                onClick={() => k.setActiveCat("")}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-medium transition
                    ${!k.activeCat
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30"}`}
            >
                Semua
            </button>
            {categories.map((c) => (
                <button
                    key={c.id}
                    onClick={() => k.setActiveCat(String(c.id) === k.activeCat ? "" : String(c.id))}
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-medium transition
                        ${String(c.id) === k.activeCat
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/30"}`}
                >
                    {c.name}
                </button>
            ))}
        </div>
    );

    /* ══════════════════════════════════════════════
       MAIN CONTENT
    ══════════════════════════════════════════════ */
    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden space-y-5">

            {/* ── Floor Map + Kitchen Queue (grid lg:3col) ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                {/* Floor Map */}
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-end justify-between">
                        <div>
                            <p className="text-[15px] font-semibold text-card-foreground">Floor Map</p>
                            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                                {tables.length} meja terdaftar
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded bg-emerald-50 border border-emerald-300" />Available
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded bg-red-50 border border-red-200" />Occupied
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded bg-amber-50 border border-amber-200" />Reserved
                            </span>
                        </div>
                    </div>

                    {tables.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">
                            <Grid3x3 size={28} className="mb-2 opacity-30" />
                            <p className="text-sm font-medium">Belum ada meja</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                            {tables.map((t) => {
                                const st = t.status || "available";
                                const s  = tStyle[st] || tStyle.available;
                                const isSelected = String(k.selectedTable) === String(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        disabled={st !== "available"}
                                        onClick={() => {
                                            if (st === "available") {
                                                k.setSelectedTable(t.id);
                                                if (k.orderType !== "dine_in") k.handleOrderTypeChange("dine_in");
                                            }
                                        }}
                                        className={`relative aspect-square rounded-xl border-2 p-2 transition-all flex flex-col items-center justify-between
                                            ${s.cls}
                                            ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                                    >
                                        {isSelected && (
                                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-success" />
                                        )}
                                        <span className="text-[9.5px] font-medium uppercase tracking-wider opacity-60">Table</span>
                                        <span className="text-[20px] font-bold leading-none tracking-tight">{t.table_number}</span>
                                        <span className="text-[9.5px] font-medium opacity-75">{s.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Kitchen Queue */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col">
                    <div className="mb-3 flex items-end justify-between">
                        <div>
                            <p className="text-[15px] font-semibold text-card-foreground">Kitchen Queue</p>
                            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{kitchenQueue.length} tiket</p>
                        </div>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {kitchenQueue.map((item, i) => (
                            <div key={i} className="rounded-xl border border-border bg-card p-3">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-[12px] font-semibold text-card-foreground">{item.table}</span>
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${toneCls[item.tone]}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p className="text-[12px] text-card-foreground">{item.items}</p>
                                <p className="mt-1 text-[10.5px] text-muted-foreground">Elapsed {item.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Product Grid ── */}
            <div id="productGrid">
                {/* Header */}
                <div className="mb-3 flex items-end justify-between">
                    <p className="text-[15px] font-semibold text-foreground">Menu</p>
                    <p className="text-[12px] text-muted-foreground">{k.filtered.length} item</p>
                </div>

                {k.filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground">
                        <UtensilsCrossed size={36} className="mb-2 opacity-30" />
                        <p className="text-sm font-medium">
                            {k.search ? "Menu tidak ditemukan" : "Tidak ada menu"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
                        {k.filtered.map((p) => (
                            <MenuCard
                                key={p.id}
                                product={p}
                                onClick={() => k.handleProductClick(p)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <KasirLayout
            k={k}
            props={props}
            mainContent={mainContent}
            searchBar={searchBar}
            categoryChips={categoryChips}
            showSearch={true}
        />
    );
}
