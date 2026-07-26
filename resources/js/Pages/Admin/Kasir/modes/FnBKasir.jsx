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
        label === "Best Seller" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
        label === "Promo"       ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                                  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
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
                <p className="line-clamp-2 min-h-[34px] text-[13px] font-semibold leading-snug text-foreground">
                    {product.name}
                </p>
                <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">
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
    const { categories, tables = [], kitchenQueue = [] } = props;

    const orderTypes = [
        { v: "dine_in",  l: "Dine In",   icon: <UtensilsCrossed size={14} /> },
        { v: "takeaway", l: "Take Away",  icon: <ShoppingBag size={14} /> },
        { v: "delivery", l: "Delivery",   icon: <Bike size={14} /> },
    ];

    const deliveryPlatforms = ["GoFood", "GrabFood", "ShopeeFood", "Pesanan Langsung"];

    /* Table status */
    const tStyle = {
        available: { cls: "border-success/40 bg-success/10 text-success hover:bg-success/20 cursor-pointer", label: "Tersedia" },
        occupied:  { cls: "border-destructive/20 bg-destructive/10 text-destructive opacity-70 cursor-not-allowed", label: "Terisi" },
        // Reserved tetap bisa diklik — tamu yang punya reservasi justru perlu
        // dilayani di meja itu, jadi kasir harus bisa memilihnya.
        reserved:  { cls: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 cursor-pointer", label: "Reserved" },
    };

    /* Kitchen status — kosakata sama dengan Kitchen Display (KitchenController) */
    const kitchenStatusStyle = {
        pending: { label: "Baru",    cls: "bg-primary/10 text-primary border border-primary/20" },
        cooking: { label: "Dimasak", cls: "bg-warning/10 text-warning border border-warning/20" },
        ready:   { label: "Siap",    cls: "bg-success/10 text-success border border-success/20" },
        served:  { label: "Diantar", cls: "bg-muted text-muted-foreground border border-border" },
    };
    const kitchenStatusOf = (status) =>
        kitchenStatusStyle[status] ?? {
            label: status || "—",
            cls: "bg-muted text-muted-foreground border border-border",
        };
    const elapsedLabel = (minutes) => {
        if (minutes === null || minutes === undefined) return "—";
        if (minutes < 1) return "baru saja";
        if (minutes < 60) return `${minutes} mnt`;
        return `${Math.floor(minutes / 60)} jam ${minutes % 60} mnt`;
    };

    const selectedCustomerObj = k.customers?.find(
        (c) => String(c.id) === String(k.selectedCustomer),
    );

    /* ══════════════════════════════════════════════
       SEARCH BAR (override default KasirLayout)
       Hanya search input + delivery extra fields
       Order type + customer sudah ada di keranjang
    ══════════════════════════════════════════════ */
    const searchBar = (
        <div className="shrink-0 space-y-2 border-b border-border bg-card px-4 pt-3 pb-3">

            {/* Delivery extra fields */}
            {k.orderType === "delivery" && (
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {deliveryPlatforms.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => k.setDeliveryPlatform(p)}
                                className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition
                                    ${k.deliveryPlatform === p
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
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
                </div>
            )}

            {/* Jumlah tamu — hanya relevan untuk dine-in */}
            {k.orderType === "dine_in" && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                    <label className="text-[13px] font-medium text-foreground">Jumlah Tamu</label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => k.setGuestCount(Math.max(1, Number(k.guestCount || 1) - 1))}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-muted"
                            aria-label="Kurangi jumlah tamu"
                        >
                            −
                        </button>
                        <span className="w-7 text-center text-[13px] font-semibold text-foreground">
                            {k.guestCount || 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => k.setGuestCount(Number(k.guestCount || 1) + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-muted"
                            aria-label="Tambah jumlah tamu"
                        >
                            +
                        </button>
                    </div>
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
                            <p className="text-[15px] font-semibold text-foreground">Floor Map</p>
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
                                const active = t.active_sale;
                                const booking = t.upcoming_booking;
                                /* Hanya meja yang sedang memegang order yang tidak bisa
                                   dipilih. Meja 'reserved' HARUS tetap bisa dipilih —
                                   kalau tidak, kasir justru tidak bisa melayani tamu
                                   yang punya reservasi di meja itu. */
                                const isTaken = st === "occupied" || !!active;
                                const tooltip = active
                                    ? `${active.sale_no} — ${kitchenStatusOf(active.kitchen_status).label}`
                                    : booking
                                        ? `Reservasi ${booking.time} — ${booking.customer_name}`
                                        : undefined;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        disabled={isTaken}
                                        onClick={() => {
                                            if (isTaken) return;
                                            k.setSelectedTable(t.id);
                                            if (k.orderType !== "dine_in") k.handleOrderTypeChange("dine_in");
                                            if (booking?.guest_count) k.setGuestCount(booking.guest_count);
                                        }}
                                        title={tooltip}
                                        className={`relative aspect-square rounded-xl border-2 p-2 transition-all flex flex-col items-center justify-between
                                            ${isTaken ? tStyle.occupied.cls : booking ? tStyle.reserved.cls : s.cls}
                                            ${!isTaken ? "cursor-pointer" : ""}
                                            ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                                    >
                                        {isSelected && (
                                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-success" />
                                        )}
                                        <span className="text-[9.5px] font-medium uppercase tracking-wider opacity-60">
                                            {t.capacity ? `${t.capacity} org` : "Table"}
                                        </span>
                                        <span className="text-[20px] font-bold leading-none tracking-tight">{t.table_number}</span>
                                        {active ? (
                                            <span className="flex w-full flex-col items-center gap-0.5 overflow-hidden">
                                                <span className="w-full truncate text-center text-[9px] font-semibold opacity-80">
                                                    {active.sale_no}
                                                </span>
                                                <span className={`rounded px-1.5 py-px text-[8.5px] font-bold ${kitchenStatusOf(active.kitchen_status).cls}`}>
                                                    {kitchenStatusOf(active.kitchen_status).label}
                                                </span>
                                            </span>
                                        ) : booking ? (
                                            <span className="flex w-full flex-col items-center overflow-hidden leading-tight">
                                                <span className="text-[10px] font-bold">{booking.time}</span>
                                                <span className="w-full truncate text-center text-[8.5px] opacity-80">
                                                    {booking.customer_name}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-[9.5px] font-medium opacity-75">{s.label}</span>
                                        )}
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
                            <p className="text-[15px] font-semibold text-foreground">Kitchen Queue</p>
                            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{kitchenQueue.length} tiket</p>
                        </div>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {kitchenQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground">
                                <Clock size={24} className="mb-2 opacity-30" />
                                <p className="text-[12px] font-medium">Belum ada antrian</p>
                            </div>
                        ) : (
                            kitchenQueue.map((item) => (
                                <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <span className="truncate text-[12px] font-semibold text-foreground">{item.table}</span>
                                        <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${kitchenStatusOf(item.status).cls}`}>
                                            {kitchenStatusOf(item.status).label}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-foreground">{item.items || "—"}</p>
                                    <p className="mt-1 text-[10.5px] text-muted-foreground">
                                        {item.sale_no} • {elapsedLabel(item.minutes)}
                                    </p>
                                </div>
                            ))
                        )}
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
