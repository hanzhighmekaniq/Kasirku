import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, Fragment } from "react";
import Button from "@/Components/ui/Button";
import {
    ArrowDownUp,
    ChevronDown,
    Eye,
    Pencil,
    Plus,
    ShoppingCart,
    SlidersHorizontal,
    Trash2,
    ArrowUpDown,
} from "lucide-react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import QuickStockModal from "@/Pages/Admin/Products/QuickStockModal";
import TreePicker from "@/Components/TreePicker";
import Select from "@/Components/ui/Select";
import { useStoreModules } from "@/Hooks/useStoreModules";

const TYPE_LABEL = {
    finished_goods: {
        label: "Barang Jadi",
        bg: "bg-accent/10",
        text: "text-accent-foreground",
    },
    raw_material: {
        label: "Bahan Baku",
        bg: "bg-accent/10",
        text: "text-accent-foreground",
    },
    combo: {
        label: "Combo/Paket",
        bg: "bg-accent/10",
        text: "text-accent-foreground",
    },
    service: {
        label: "Jasa/Layanan",
        bg: "bg-accent/10",
        text: "text-accent-foreground",
    },
    rental_item: {
        label: "Item Rental",
        bg: "bg-accent/10",
        text: "text-accent-foreground",
    },
    time_based: {
        label: "Berbasis Waktu",
        bg: "bg-accent/10",
        text: "text-accent-foreground",
    },
};

const PAGE_TITLE = {
    retail: "Produk",
    fnb: "Menu & Produk",
    service: "Layanan & Produk",
    rental: "Item Sewa",
    ticket: "Tiket & Paket",
    hospitality: "Kamar & Layanan",
    parking: "Tarif Parkir",
    session: "Paket Sesi",
};

const FILTER_TYPES = {
    retail: [
        ["finished_goods", "Barang Jadi"],
        ["raw_material", "Bahan Baku"],
        ["combo", "Combo/Paket"],
    ],
    fnb: [
        ["finished_goods", "Menu/Makanan"],
        ["raw_material", "Bahan Baku"],
        ["combo", "Paket Menu"],
    ],
    service: [
        ["service", "Layanan Jasa"],
        ["finished_goods", "Produk Pendukung"],
    ],
    rental: [
        ["rental_item", "Item Sewa"],
        ["finished_goods", "Produk Pendukung"],
    ],
    ticket: [
        ["time_based", "Tiket"],
        ["finished_goods", "Produk Pendukung"],
    ],
    hospitality: [
        ["time_based", "Kamar/Unit"],
        ["service", "Layanan"],
        ["finished_goods", "Produk"],
    ],
    parking: [["time_based", "Tarif Parkir"]],
    session: [
        ["time_based", "Paket Sesi"],
        ["finished_goods", "Produk Pendukung"],
    ],
};

function TypeBadge({ type }) {
    const t = TYPE_LABEL[type] ?? {
        label: type,
        bg: "bg-muted",
        text: "text-muted-foreground",
    };
    return (
        <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${t.bg} ${t.text}`}
        >
            {t.label}
        </span>
    );
}

function StockBadge({ product }) {
    if (!product.track_stock) {
        return (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Tanpa Stok
            </span>
        );
    }
    const stock = product.stock ?? 0;
    const min = product.stock_minimum ?? 0;
    if (stock <= 0) {
        return (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                Habis
            </span>
        );
    }
    if (stock <= min) {
        return (
            <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                Menipis
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
            Cukup
        </span>
    );
}

function StatusBadge({ isActive }) {
    return isActive ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
            Nonaktif
        </span>
    );
}

function IndicatorBadges({ product, storeType = "retail" }) {
    const badges = [];
    const variantCount = product.variants?.length ?? 0;
    const hasUnits =
        (product.packaging_units?.length ?? 0) > 0 ||
        product.variants?.some((v) => (v.packaging_units?.length ?? 0) > 0);
    const hasTiers =
        (product.price_tiers?.length ?? 0) > 0 ||
        product.variants?.some((v) => (v.price_tiers?.length ?? 0) > 0);

    if (variantCount > 0) {
        badges.push(
            <span
                key="variant"
                className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
                Variant {variantCount}
            </span>,
        );
    }
    if (hasUnits) {
        badges.push(
            <span
                key="unit"
                className="inline-flex items-center rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-foreground"
            >
                Multi-Satuan
            </span>,
        );
    }
    if (hasTiers) {
        badges.push(
            <span
                key="tier"
                className="inline-flex items-center rounded-md border border-warning/20 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
            >
                Grosir
            </span>,
        );
    }
    if (storeType === "fnb" && (product.recipes_count ?? 0) > 0) {
        badges.push(
            <span
                key="recipe"
                className="inline-flex items-center rounded-md border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
            >
                Resep
            </span>,
        );
    }
    if (storeType === "fnb" && (product.modifier_groups_count ?? 0) > 0) {
        badges.push(
            <span
                key="modifier"
                className="inline-flex items-center rounded-md border border-violet-200 bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400"
            >
                Modifier
            </span>,
        );
    }

    if (badges.length === 0) {
        return <span className="text-xs text-muted-foreground">&mdash;</span>;
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
}

function SummaryCard({ label, value, color = "slate", icon }) {
    const bgColors = {
        blue: "bg-primary/10 text-primary",
        emerald: "bg-success/10 text-success",
        amber: "bg-warning/10 text-warning",
        slate: "bg-muted text-muted-foreground",
    };

    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColors[color] ?? bgColors.slate}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

/**
 * Satu baris satuan (Dus, Lusin, …) lengkap dengan aksinya.
 *
 * Tiap satuan punya bucket stok sendiri di `product_stocks` — bukan hasil
 * konversi dari satuan dasar — jadi "Stok" dan "Beli" di sini menargetkan
 * bucket itu langsung lewat `packaging_unit_id`.
 */
function UnitActionRow({ product, variant = null, unit, onStockModal }) {
    const purchaseHref =
        route("admin.purchases.create") +
        "?product_id=" +
        product.id +
        (variant ? "&variant_id=" + variant.id : "") +
        "&packaging_unit_id=" +
        unit.id +
        (product.supplier_id ? "&supplier_id=" + product.supplier_id : "");

    return (
        // Di layar sempit label dan tombol ditumpuk. Kalau dipaksa sebaris,
        // grup tombol kanan (yang tidak boleh menyusut) mendorong isi kartu
        // melebihi lebar container sehingga terpotong `overflow-hidden`.
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                    {unit.name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                    1 {unit.name} = {unit.conversion_qty} {product.unit || "pcs"}
                </p>
            </div>
            <div className="flex items-center gap-1.5 md:shrink-0">
                {product.track_stock && (
                    <span
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
                        title={`Stok satuan ${unit.name}`}
                    >
                        {unit.stock ?? 0}
                    </span>
                )}
                {product.track_stock && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStockModal?.({
                                product,
                                variant,
                                unit,
                                type: "in",
                            });
                        }}
                        className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-card-foreground transition hover:bg-muted"
                        title={`Atur stok manual — ${unit.name}`}
                    >
                        <ArrowDownUp className="h-3 w-3" />
                        Stok
                    </button>
                )}
                <Link
                    href={purchaseHref}
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition ${product.supplier_id
                        ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                    title={
                        product.supplier_id
                            ? `Beli ${unit.name} dari supplier`
                            : "Belum ada supplier — buka form pembelian"
                    }
                >
                    <ShoppingCart className="h-3 w-3" />
                    Beli
                </Link>
            </div>
        </div>
    );
}

function DetailRow({ product, onStockModal }) {
    const variants = product.variants ?? [];
    const packagingUnits = product.packaging_units ?? [];
    const priceTiers = product.price_tiers ?? [];
    const hasVariants = variants.length > 0;

    if (hasVariants) {
        return (
            <div className="overflow-hidden border-t border-border bg-gradient-to-b from-muted/80 to-card px-3 py-4 sm:px-5">
                <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                        </svg>
                    </span>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-card-foreground">
                        {variants.length} Variant
                    </h4>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {variants.map((v) => {
                        const vStock = v.stock ?? 0;
                        const isLow = product.track_stock && product.stock_minimum > 0 && vStock <= product.stock_minimum;
                        const isOut = product.track_stock && vStock <= 0;
                        const vUnits = v.packaging_units ?? [];
                        const tiers = v.price_tiers?.length
                            ? v.price_tiers.map((t) => `${t.min_qty}+ → Rp ${Number(t.price).toLocaleString("id-ID")}`).join(" · ")
                            : null;

                        return (
                            <div
                                key={v.id}
                                className={`group relative min-w-0 rounded-xl border bg-card p-3 transition-all hover:shadow-md sm:p-3.5 ${isOut ? "border-destructive/20 bg-destructive/5" : isLow ? "border-warning/20 bg-warning/5" : "border-border"}`}
                            >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">{v.name}</p>
                                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{v.sku}</p>
                                    </div>
                                    {product.track_stock && (
                                        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isOut ? "bg-destructive/10 text-destructive" : isLow ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                                            {isOut ? "Habis" : isLow ? "Menipis" : vStock}
                                        </span>
                                    )}
                                </div>

                                <div className="mb-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                    <div className="min-w-0">
                                        <span className="text-muted-foreground">Jual</span>
                                        <p className="truncate font-semibold text-card-foreground">Rp {Number(v.price || 0).toLocaleString("id-ID")}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-muted-foreground">Modal</span>
                                        <p className="truncate font-medium text-card-foreground">Rp {Number(v.cost_price || 0).toLocaleString("id-ID")}</p>
                                    </div>
                                </div>

                                {vUnits.length > 0 && (
                                    <div className="mb-2.5 space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Multi-Satuan
                                        </p>
                                        {vUnits.map((u) => (
                                            <UnitActionRow
                                                key={u.id}
                                                product={product}
                                                variant={v}
                                                unit={u}
                                                onStockModal={onStockModal}
                                            />
                                        ))}
                                    </div>
                                )}
                                {tiers && (
                                    <p className="mb-2.5 truncate text-[11px] text-muted-foreground" title={tiers}>
                                        <span className="font-medium text-card-foreground">Grosir:</span> {tiers}
                                    </p>
                                )}

                                <div className="flex items-center gap-1.5 border-t border-border pt-2.5">
                                    {product.track_stock && (
                                        <button
                                            onClick={() => onStockModal?.({ product, variant: v, type: "in" })}
                                            className="inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-xs font-medium text-card-foreground transition hover:border-ring hover:bg-muted"
                                            title={`Atur Stok ${v.name}`}
                                        >
                                            <ArrowUpDown className="h-3 w-3" strokeWidth={2} />
                                            Stok
                                        </button>
                                    )}
                                    <Link
                                        href={
                                            route("admin.purchases.create") +
                                            "?product_id=" + product.id +
                                            "&variant_id=" + v.id +
                                            (product.supplier_id ? "&supplier_id=" + product.supplier_id : "")
                                        }
                                        className={`inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition ${product.supplier_id ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20" : "border-border bg-card text-muted-foreground hover:border-ring hover:bg-muted"}`}
                                        title={product.supplier_id ? `Beli ${v.name} dari Supplier` : "Belum ada supplier — buka Purchase"}
                                    >
                                        <ShoppingCart className="h-3 w-3" strokeWidth={2} />
                                        Beli
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Non-variant: flat info strip
    const tiers = priceTiers.length
        ? priceTiers.map((t) => `${t.min_qty}+ → Rp ${Number(t.price).toLocaleString("id-ID")}`).join(" · ")
        : null;

    return (
        <div className="overflow-hidden border-t border-border bg-gradient-to-b from-[rgb(var(--color-surface-secondary))]/80 to-[rgb(var(--color-card))] px-3 py-4 sm:px-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
                <div>
                    <span className="text-muted-foreground">Harga Jual</span>
                    <p className="text-sm font-semibold text-foreground">Rp {Number(product.sell_price || 0).toLocaleString("id-ID")}</p>
                </div>
                <div>
                    <span className="text-muted-foreground">Harga Modal</span>
                    <p className="text-sm font-medium text-card-foreground">Rp {Number(product.cost_price || 0).toLocaleString("id-ID")}</p>
                </div>
                <div>
                    <span className="text-muted-foreground">
                        {packagingUnits.length > 0
                            ? `Stok ${product.unit || "satuan dasar"}`
                            : "Stok Saat Ini"}
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                        {packagingUnits.length > 0
                            ? (product.stock_base ?? product.stock ?? 0)
                            : (product.stock ?? 0)}
                    </p>
                </div>
                {tiers && (
                    <div className="col-span-2">
                        <span className="text-muted-foreground">Harga Grosir</span>
                        <p className="truncate text-sm text-card-foreground" title={tiers}>{tiers}</p>
                    </div>
                )}
            </div>

            {packagingUnits.length > 0 && (
                <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Multi-Satuan
                    </p>
                    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {packagingUnits.map((u) => (
                            <UnitActionRow
                                key={u.id}
                                product={product}
                                unit={u}
                                onStockModal={onStockModal}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Ringkasan isi baris detail — "2 variant · 3 satuan".
 * Dipakai sebagai tooltip tombol expand supaya user tahu apa yang akan
 * terbuka sebelum mengkliknya.
 */
function expandSummary(product) {
    const variants = product.variants ?? [];
    const parts = [];

    const unitCount =
        (product.packaging_units?.length ?? 0) +
        variants.reduce((n, v) => n + (v.packaging_units?.length ?? 0), 0);
    const tierCount =
        (product.price_tiers?.length ?? 0) +
        variants.reduce((n, v) => n + (v.price_tiers?.length ?? 0), 0);

    if (variants.length) parts.push(`${variants.length} variant`);
    if (unitCount) parts.push(`${unitCount} satuan`);
    if (tierCount) parts.push("harga grosir");

    return parts.join(" · ");
}

function hasExpandable(product) {
    return (
        (product.variants?.length ?? 0) > 0 ||
        (product.packaging_units?.length ?? 0) > 0 ||
        (product.price_tiers?.length ?? 0) > 0
    );
}

function PriceCell({ product, bold = true }) {
    const variants = product.variants ?? [];
    if (variants.length > 0) {
        const prices = variants.map((v) => Number(v.price || 0));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const text =
            min === max
                ? `Rp ${min.toLocaleString("id-ID")}`
                : `Rp ${min.toLocaleString("id-ID")} – Rp ${max.toLocaleString("id-ID")}`;
        return <span className="text-xs text-card-foreground">{text}</span>;
    }

    return (
        <span
            className={
                bold
                    ? "font-semibold text-foreground"
                    : "text-xs text-card-foreground"
            }
        >
            Rp {Number(product.sell_price || 0).toLocaleString("id-ID")}
        </span>
    );
}

function CostPriceCell({ product }) {
    const variants = product.variants ?? [];
    if (variants.length > 0) {
        const costs = variants.map((v) => Number(v.cost_price || 0)).filter((c) => c > 0);
        if (costs.length === 0) {
            return <span className="text-xs text-muted-foreground">&mdash;</span>;
        }
        const min = Math.min(...costs);
        const max = Math.max(...costs);
        const text =
            min === max
                ? `Rp ${min.toLocaleString("id-ID")}`
                : `Rp ${min.toLocaleString("id-ID")} – Rp ${max.toLocaleString("id-ID")}`;
        return <span className="text-xs text-muted-foreground">{text}</span>;
    }

    return (
        <span className="text-muted-foreground">
            Rp {Number(product.cost_price || 0).toLocaleString("id-ID")}
        </span>
    );
}

function StockWithVariant({ product }) {
    const variantCount = product.variants?.length ?? 0;
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-foreground">
                {product.stock ?? 0}
            </span>
            <StockBadge product={product} />
            {variantCount > 0 && (
                <span className="text-[10px] text-muted-foreground">
                    {variantCount} variant
                </span>
            )}
        </div>
    );
}

export default function Index({
    products,
    allCategories = [],
    storeType = "retail",
    stats = {},
    filters = {},
    currentBranch = null,
}) {
    const { storeTypeFeatures = [] } = usePage().props;
    const has = (f) => storeTypeFeatures.includes(f);
    const { can } = useStoreModules();
    const canCreate = can("product.create");
    const canEdit = can("product.edit");
    const canDelete = can("product.delete");
    const [search, setSearch] = useState(filters?.search ?? "");
    const [filterType, setFilterType] = useState(filters?.type ?? "");
    const [filterCategory, setFilterCategory] = useState(
        filters?.category ?? "",
    );
    const [filterStatus, setFilterStatus] = useState(filters?.status ?? "");
    const [sort, setSort] = useState(typeof filters?.sort === "string" ? filters.sort : "name");
    const [direction, setDirection] = useState(typeof filters?.direction === "string" ? filters.direction : "asc");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [stockModal, setStockModal] = useState(null);
    const [expanded, setExpanded] = useState(new Set());
    const [showFilter, setShowFilter] = useState(false);

    const pageTitle = PAGE_TITLE[storeType] ?? "Produk";
    const filterTypeOptions = FILTER_TYPES[storeType] ?? FILTER_TYPES.retail;

    const showStock = has("stock");
    const showMargin = has("purchase");
    const showCapacity = ["ticket", "hospitality"].includes(storeType);
    const showDuration = ["session", "parking", "ticket"].includes(storeType);
    const showRateHour = [
        "session",
        "parking",
        "rental",
        "hospitality",
    ].includes(storeType);
    const showDeposit = ["rental", "hospitality", "parking", "session"].includes(
        storeType,
    );
    const showMaxGuests = storeType === "hospitality";
    const showPrepTime = has("kitchen");

    const applyFilter = (key, value) => {
        router.get(
            route("admin.products.index"),
            {
                search:
                    key === "search"
                        ? value || undefined
                        : search || undefined,
                type:
                    key === "type"
                        ? value || undefined
                        : filterType || undefined,
                category:
                    key === "category"
                        ? value || undefined
                        : filterCategory || undefined,
                status:
                    key === "status"
                        ? value || undefined
                        : filterStatus || undefined,
                sort: key === "sort" ? value || undefined : sort || undefined,
                direction:
                    key === "direction"
                        ? value || undefined
                        : direction || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const toggleSort = (column) => {
        const newDir = sort === column && direction === "asc" ? "desc" : "asc";
        setSort(column);
        setDirection(newDir);
        router.get(
            route("admin.products.index"),
            {
                search: search || undefined,
                type: filterType || undefined,
                category: filterCategory || undefined,
                status: filterStatus || undefined,
                sort: column,
                direction: newDir,
            },
            { preserveState: true, replace: true },
        );
    };

    const list = products?.data ?? [];
    const hasFilters = search || filterType || filterCategory || filterStatus;

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.products.destroy", target.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setTarget(null);
            },
        });
    };

    const toggleExpand = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const sellPriceLabel =
        storeType === "session" || storeType === "parking"
            ? "Tarif"
            : storeType === "rental"
                ? "Tarif Sewa"
                : storeType === "service"
                    ? "Tarif Jasa"
                    : storeType === "hospitality" || storeType === "ticket"
                        ? "Tarif"
                        : "Harga Jual";

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Manajemen {pageTitle}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Katalog
                    </div>
                </div>
            }
        >
            <PageHeader
                title={`Katalog ${pageTitle}`}
                breadcrumbs={["Admin", "Master Data", "Produk"]}
                heading={
                    <>
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Manajemen {pageTitle.toLowerCase()}
                        </span>
                    </>
                }
                description="Cari, filter, dan atur stok, varian, harga, serta status dari satu tempat. Pantau stok menipis dan item nonaktif lewat ringkasan di bawah."
            />

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <SummaryCard
                    label={`Total ${pageTitle}`}
                    value={stats.total}
                    color="blue"
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 7 12 3 4 7v10l8 4 8-4V7Z" />
                            <path d="m4 7 8 4 8-4" />
                            <path d="M12 11v10" />
                        </svg>
                    }
                />
                <SummaryCard
                    label="Aktif"
                    value={stats.active}
                    color="emerald"
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    }
                />
                {showStock && (
                    <SummaryCard
                        label="Stok Menipis"
                        value={stats.lowStock}
                        color="amber"
                        icon={
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 9v4M12 17h.01" />
                                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                            </svg>
                        }
                    />
                )}
                <SummaryCard
                    label="Nonaktif"
                    value={stats.inactive}
                    color="slate"
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m4.9 4.9 14.2 14.2" />
                        </svg>
                    }
                />
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3">
                        {/* Search + Filter Toggle */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <svg
                                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            applyFilter("search", search);
                                        }
                                    }}
                                    placeholder="Cari nama, SKU, atau barcode..."
                                    className="w-full py-2.5 pl-10 pr-3 rounded-lg border border-border bg-background  text-sm text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>
                            {/* Filter toggle — mobile only */}
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`inline-flex items-center justify-center rounded-lg border px-3 transition lg:hidden ${showFilter || hasFilters
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "border-border text-card-foreground hover:bg-muted"
                                    }`}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" d="M3 4h18M3 10h12M3 16h6" />
                                </svg>
                            </button>
                        </div>

                        {/* Filters — collapsible on mobile, always visible on desktop */}
                        <div className={`flex-col gap-2 ${showFilter ? "flex" : "hidden"} lg:flex lg:flex-row lg:items-center`}>
                            <Select
                                options={filterTypeOptions.map(
                                    ([val, lbl]) => ({
                                        value: val,
                                        label: lbl,
                                    }),
                                )}
                                value={filterType}
                                onChange={(v) => {
                                    setFilterType(v);
                                    applyFilter("type", v);
                                }}
                                placeholder="Semua Tipe"
                                className="min-w-[140px]"
                            />
                            <div className="min-w-[180px]">
                                <TreePicker
                                    categories={allCategories}
                                    value={filterCategory}
                                    onChange={(v) => {
                                        setFilterCategory(v);
                                        applyFilter("category", v);
                                    }}
                                    onClear={() => setFilterCategory("")}
                                    placeholder="Semua Kategori"
                                />
                            </div>
                            <Select
                                options={[
                                    { value: "", label: "Semua Status" },
                                    { value: "1", label: "Aktif" },
                                    { value: "0", label: "Nonaktif" },
                                ]}
                                value={filterStatus}
                                onChange={(v) => {
                                    setFilterStatus(v);
                                    applyFilter("status", v);
                                }}
                                placeholder="Semua Status"
                                className="min-w-[140px]"
                            />
                            <div className="flex gap-2 lg:ml-auto">
                                {hasFilters && (
                                    <button
                                        onClick={() => {
                                            setSearch("");
                                            setFilterType("");
                                            setFilterCategory("");
                                            setFilterStatus("");
                                            setSort("name");
                                            setDirection("asc");
                                            router.get(
                                                route("admin.products.index"),
                                                {},
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                                            <path d="M3 3v5h5" />
                                        </svg>
                                        Reset
                                    </button>
                                )}
                                {canCreate && (
                                    <Link
                                        href={route("admin.products.create")}
                                        className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                                    >
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                                        </svg>
                                        Tambah {pageTitle}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Menampilkan{" "}
                        <span className="font-semibold text-card-foreground">
                            {list.length}
                        </span>{" "}
                        dari {products.total} {pageTitle.toLowerCase()}
                    </p>
                </div>

                {/* Empty state */}
                {list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <svg
                                className="h-8 w-8 text-muted-foreground"
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
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {hasFilters
                                ? `${pageTitle} tidak ditemukan`
                                : `Belum ada ${pageTitle.toLowerCase()}`}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {hasFilters
                                ? "Coba kata kunci atau filter lain."
                                : `Mulai dengan menambahkan ${pageTitle.toLowerCase()} pertama.`}
                        </p>
                        {!hasFilters && canCreate && (
                            <Link
                                href={route("admin.products.create")}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                            >
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        d="M12 5v14M5 12h14"
                                    />
                                </svg>
                                Tambah {pageTitle}
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full text-sm">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th
                                            className="cursor-pointer select-none px-4 py-3 text-left font-semibold transition hover:text-foreground"
                                            onClick={() => toggleSort("name")}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                Produk
                                                {sort === "name" && (
                                                    <svg className={`h-3 w-3 transition ${direction === "desc" ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                        <path d="m6 9 6 6 6-6" />
                                                    </svg>
                                                )}
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Tipe
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Kategori
                                        </th>
                                        {showMargin && (
                                            <th className="px-4 py-3 text-right font-semibold">
                                                Harga Beli
                                            </th>
                                        )}
                                        <th
                                            className="cursor-pointer select-none px-4 py-3 text-right font-semibold transition hover:text-foreground"
                                            onClick={() => toggleSort("sell_price")}
                                        >
                                            <span className="inline-flex items-center justify-end gap-1">
                                                {sellPriceLabel}
                                                {sort === "sell_price" && (
                                                    <svg className={`h-3 w-3 transition ${direction === "desc" ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                        <path d="m6 9 6 6 6-6" />
                                                    </svg>
                                                )}
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Badges
                                        </th>
                                        {storeType === "fnb" && (
                                            <th className="px-4 py-3 text-center font-semibold">
                                                Waktu Saji
                                            </th>
                                        )}
                                        {showStock && (
                                            <th
                                                className="cursor-pointer select-none px-4 py-3 text-center font-semibold transition hover:text-foreground"
                                                onClick={() => toggleSort("stock")}
                                            >
                                                <span className="inline-flex items-center justify-center gap-1">
                                                    Stok
                                                    {sort === "stock" && (
                                                        <svg className={`h-3 w-3 transition ${direction === "desc" ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                            <path d="m6 9 6 6 6-6" />
                                                        </svg>
                                                    )}
                                                </span>
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-center font-semibold">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {list.map((product) => {
                                        const isExp = expanded.has(product.id);
                                        const canExp = hasExpandable(product);
                                        return (
                                            <Fragment key={product.id}>
                                                <tr
                                                    key={product.id}
                                                    onClick={
                                                        canExp
                                                            ? () =>
                                                                toggleExpand(
                                                                    product.id,
                                                                )
                                                            : undefined
                                                    }
                                                    className={`group transition hover:bg-muted ${canExp
                                                        ? "cursor-pointer"
                                                        : ""
                                                        } ${isExp
                                                            ? "bg-[rgb(var(--color-table-hover))]"
                                                            : ""
                                                        }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {canExp ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        toggleExpand(
                                                                            product.id,
                                                                        );
                                                                    }}
                                                                    aria-expanded={
                                                                        isExp
                                                                    }
                                                                    title={
                                                                        isExp
                                                                            ? "Sembunyikan rincian"
                                                                            : `Lihat rincian${expandSummary(product) ? ` — ${expandSummary(product)}` : ""}`
                                                                    }
                                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-colors ${isExp
                                                                        ? "border-primary bg-primary text-primary-foreground"
                                                                        : "border-border bg-primary text-muted group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary"
                                                                        }`}
                                                                >
                                                                    <ChevronDown
                                                                        className={`h-4 w-4 transition-transform duration-200 ${isExp ? "rotate-180" : ""}`}
                                                                    />
                                                                </button>
                                                            ) : (
                                                                <span className="w-7 shrink-0" />
                                                            )}
                                                            {product.image ? (
                                                                <img
                                                                    src={`/storage/${product.image}`}
                                                                    alt={
                                                                        product.name
                                                                    }
                                                                    className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-card-foreground">
                                                                    {product.name
                                                                        .split(
                                                                            " ",
                                                                        )
                                                                        .slice(
                                                                            0,
                                                                            2,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                w,
                                                                            ) =>
                                                                                w[0],
                                                                        )
                                                                        .join(
                                                                            "",
                                                                        )
                                                                        .toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="block max-w-[200px] truncate font-semibold text-foreground">
                                                                    {
                                                                        product.name
                                                                    }
                                                                </p>
                                                                <p className="font-mono text-xs text-muted-foreground">
                                                                    {product.sku}
                                                                    {product.barcode
                                                                        ? ` · ${product.barcode}`
                                                                        : ""}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Satuan:{" "}
                                                                    {product.unit}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <TypeBadge
                                                            type={product.type}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-card-foreground">
                                                        {product.category
                                                            ?.name ?? (
                                                                <span className="text-xs italic text-muted-foreground">
                                                                    &mdash;
                                                                </span>
                                                            )}
                                                    </td>
                                                    {showMargin && (
                                                        <td className="px-4 py-3 text-right">
                                                            <CostPriceCell
                                                                product={product}
                                                            />
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-right">
                                                        <PriceCell
                                                            product={product}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <IndicatorBadges
                                                            product={product}
                                                            storeType={storeType}
                                                        />
                                                    </td>
                                                    {storeType === "fnb" && (
                                                        <td className="px-4 py-3 text-center text-muted-foreground">
                                                            {product.preparation_time
                                                                ? `${product.preparation_time} mnt`
                                                                : "—"}
                                                        </td>
                                                    )}
                                                    {showStock && (
                                                        <td className="px-4 py-3 text-center">
                                                            <StockWithVariant
                                                                product={product}
                                                            />
                                                            {product.track_stock && (
                                                                <div className="mt-1 flex items-center justify-center gap-1">
                                                                    <button
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            setStockModal(
                                                                                {
                                                                                    product,
                                                                                    type: "in",
                                                                                },
                                                                            );
                                                                        }}
                                                                        className="inline-flex h-6 items-center gap-1 rounded border border-border bg-card px-2 text-xs font-medium text-card-foreground shadow-sm transition hover:bg-muted"
                                                                        title="Stok Manual"
                                                                    >
                                                                        <svg
                                                                            className="h-3 w-3"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            stroke="currentColor"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                    <Link
                                                                        href={
                                                                            route(
                                                                                "admin.purchases.create",
                                                                            ) +
                                                                            "?product_id=" +
                                                                            product.id +
                                                                            (product.supplier_id
                                                                                ? "&supplier_id=" +
                                                                                product.supplier_id
                                                                                : "")
                                                                        }
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                        className="inline-flex h-6 items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 text-xs font-medium text-primary shadow-sm transition hover:bg-primary/20"
                                                                        title="Beli dari Supplier"
                                                                    >
                                                                        <svg
                                                                            className="h-3 w-3"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            stroke="currentColor"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H18a1.5 1.5 0 001.5-1.5V6.75A1.5 1.5 0 0018 5.25H6.54m1.34 9l-1.06-4m0 0L5.25 3m1.63 7.25h11.24"
                                                                            />
                                                                        </svg>
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-center">
                                                        <StatusBadge
                                                            isActive={
                                                                product.is_active
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div
                                                            className="flex items-center justify-center gap-1"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {canEdit &&
                                                                ["retail", "fnb"].includes(
                                                                    storeType,
                                                                ) && (
                                                                    <Link
                                                                        href={route(
                                                                            "admin.products.variants.index",
                                                                            product.id,
                                                                        )}
                                                                        className="rounded p-1.5 text-card-foreground transition hover:bg-warning/5 hover:text-warning"
                                                                        title="Kelola Varian"
                                                                    >
                                                                        <svg
                                                                            className="h-4 w-4"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            strokeWidth={
                                                                                1.7
                                                                            }
                                                                            stroke="currentColor"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
                                                                            />
                                                                        </svg>
                                                                    </Link>
                                                                )}
                                                            {canEdit &&
                                                                storeType ===
                                                                "fnb" &&
                                                                product.type !==
                                                                "raw_material" && (
                                                                    <Link
                                                                        href={route(
                                                                            "admin.products.recipes.index",
                                                                            product.id,
                                                                        )}
                                                                        className="rounded p-1.5 text-card-foreground transition hover:bg-orange-50 hover:text-orange-600"
                                                                        title="Kelola Resep"
                                                                    >
                                                                        <svg
                                                                            className="h-4 w-4"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            strokeWidth={
                                                                                1.7
                                                                            }
                                                                            stroke="currentColor"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l.43 2.146a2.25 2.25 0 01-2.19 2.754H6.01a2.25 2.25 0 01-2.19-2.754l.43-2.146M5 14.5l-.43.107"
                                                                            />
                                                                        </svg>
                                                                    </Link>
                                                                )}
                                                            {canEdit &&
                                                                storeType ===
                                                                "fnb" &&
                                                                product.type !==
                                                                "raw_material" && (
                                                                    <Link
                                                                        href={route(
                                                                            "admin.modifier-groups.index",
                                                                            {
                                                                                product_id:
                                                                                    product.id,
                                                                            },
                                                                        )}
                                                                        className="rounded p-1.5 text-card-foreground transition hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-400"
                                                                        title="Kelola Modifier"
                                                                    >
                                                                        <SlidersHorizontal
                                                                            className="h-4 w-4"
                                                                            strokeWidth={
                                                                                1.7
                                                                            }
                                                                        />
                                                                    </Link>
                                                                )}
                                                            <Link
                                                                href={route(
                                                                    "admin.products.show",
                                                                    product.id,
                                                                )}
                                                                className="rounded p-1.5 text-card-foreground transition hover:bg-primary/10 hover:text-primary"
                                                                title="Lihat Detail"
                                                            >
                                                                <Eye
                                                                    className="h-4 w-4"
                                                                    strokeWidth={
                                                                        1.7
                                                                    }
                                                                />
                                                            </Link>
                                                            {canEdit && (
                                                                <Link
                                                                    href={route(
                                                                        "admin.products.edit",
                                                                        product.id,
                                                                    )}
                                                                    className="rounded p-1.5 text-card-foreground transition hover:bg-warning/5 hover:text-warning"
                                                                    title="Edit"
                                                                >
                                                                    <svg
                                                                        className="h-4 w-4"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            1.7
                                                                        }
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                                                                        />
                                                                    </svg>
                                                                </Link>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() =>
                                                                        setTarget(
                                                                            product,
                                                                        )
                                                                    }
                                                                    className="rounded p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                                    title="Hapus"
                                                                >
                                                                    <svg
                                                                        className="h-4 w-4"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            1.7
                                                                        }
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExp && (
                                                    <tr key={`${product.id}-detail`}>
                                                        <td
                                                            colSpan={
                                                                9 +
                                                                (showMargin
                                                                    ? 1
                                                                    : 0) +
                                                                (showStock
                                                                    ? 1
                                                                    : 0) +
                                                                (storeType ===
                                                                    "fnb"
                                                                    ? 1
                                                                    : 0)
                                                            }
                                                            className="p-0"
                                                        >
                                                            <DetailRow
                                                                product={product}
                                                                onStockModal={setStockModal}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-[rgb(var(--color-divider))] lg:hidden">
                            {list.map((product) => {
                                const isExp = expanded.has(product.id);
                                const canExp = hasExpandable(product);
                                return (
                                    <div key={product.id} className="p-4">
                                        <div
                                            onClick={
                                                canExp
                                                    ? () =>
                                                        toggleExpand(
                                                            product.id,
                                                        )
                                                    : undefined
                                            }
                                            className={`flex items-start gap-3 ${canExp ? "cursor-pointer" : ""}`}
                                        >
                                            {product.image ? (
                                                <img
                                                    src={`/storage/${product.image}`}
                                                    alt={product.name}
                                                    className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-card-foreground">
                                                    {product.name
                                                        .split(" ")
                                                        .slice(0, 2)
                                                        .map((w) => w[0])
                                                        .join("")
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <Link
                                                        href={route(
                                                            "admin.products.show",
                                                            product.id,
                                                        )}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="font-semibold text-foreground transition-colors hover:text-primary"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        <TypeBadge
                                                            type={product.type}
                                                        />
                                                        {canExp && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleExpand(
                                                                        product.id,
                                                                    );
                                                                }}
                                                                aria-expanded={
                                                                    isExp
                                                                }
                                                                aria-label={
                                                                    isExp
                                                                        ? "Sembunyikan rincian"
                                                                        : "Lihat rincian"
                                                                }
                                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-colors ${isExp
                                                                    ? "border-primary bg-primary text-primary-foreground"
                                                                    : "border-border bg-primary text-muted"
                                                                    }`}
                                                            >
                                                                <ChevronDown
                                                                    className={`h-4 w-4 transition-transform duration-200 ${isExp ? "rotate-180" : ""}`}
                                                                />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                                    {product.sku}
                                                    {product.barcode
                                                        ? ` · ${product.barcode}`
                                                        : ""}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {product.category?.name ??
                                                        "—"}{" "}
                                                    · {product.unit}
                                                </p>
                                                <div className="mt-2 flex items-baseline gap-2">
                                                    <PriceCell
                                                        product={product}
                                                    />
                                                    {showMargin && (
                                                        <span className="text-xs text-muted-foreground">
                                                            <CostPriceCell product={product} />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <IndicatorBadges
                                                        product={product}
                                                        storeType={storeType}
                                                    />
                                                </div>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    {showStock && (
                                                        <>
                                                            <span className="text-sm">
                                                                Stok:{" "}
                                                                <b>
                                                                    {product.stock ??
                                                                        0}
                                                                </b>
                                                            </span>
                                                            <StockBadge
                                                                product={
                                                                    product
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                    <StatusBadge
                                                        isActive={
                                                            product.is_active
                                                        }
                                                    />
                                                </div>

                                                {/* Aksi STOK — sengaja dipisah dari aksi umum
                                                    di bawahnya, meniru desktop yang menaruh
                                                    Stok & Beli di kolom Stok, bukan kolom Aksi.
                                                    Diberi teks (bukan ikon polos) supaya jelas
                                                    keduanya menyangkut stok, bukan produknya. */}
                                                {showStock &&
                                                    product.track_stock && (
                                                        <div
                                                            className="mt-2 flex flex-wrap items-center gap-2"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setStockModal(
                                                                        {
                                                                            product,
                                                                            type: "in",
                                                                        },
                                                                    )
                                                                }
                                                                title="Atur Stok Manual"
                                                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-card-foreground shadow-sm transition-colors hover:bg-muted"
                                                            >
                                                                <ArrowUpDown className="h-3.5 w-3.5" />
                                                                Stok
                                                            </button>
                                                            <Link
                                                                href={
                                                                    route(
                                                                        "admin.purchases.create",
                                                                    ) +
                                                                    "?product_id=" +
                                                                    product.id +
                                                                    (product.supplier_id
                                                                        ? "&supplier_id=" +
                                                                        product.supplier_id
                                                                        : "")
                                                                }
                                                                title={
                                                                    product.supplier_id
                                                                        ? "Beli dari Supplier"
                                                                        : "Belum ada supplier — buka form pembelian"
                                                                }
                                                                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-sm transition-colors ${product.supplier_id
                                                                        ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                                                                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                                                                    }`}
                                                            >
                                                                <ShoppingCart className="h-3.5 w-3.5" />
                                                                Beli
                                                            </Link>
                                                        </div>
                                                    )}

                                                {/* Aksi PRODUK — ikon polos, sejajar tabel desktop.
                                                    Ukuran 36px supaya tetap nyaman disentuh,
                                                    dan tiap tombol wajib punya title+aria-label
                                                    karena tidak ada lagi teks yang menjelaskannya. */}
                                                <div
                                                    className="mt-3 flex flex-wrap items-center gap-2"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Link
                                                        href={route(
                                                            "admin.products.show",
                                                            product.id,
                                                        )}
                                                        title="Lihat Detail"
                                                        aria-label="Lihat detail produk"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                                    >
                                                        <Eye
                                                            className="h-4 w-4"
                                                            strokeWidth={1.7}
                                                        />
                                                    </Link>
                                                    {canEdit && (
                                                        <Link
                                                            href={route(
                                                                "admin.products.edit",
                                                                product.id,
                                                            )}
                                                            title="Edit"
                                                            aria-label="Edit produk"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-warning/40 hover:bg-warning/10 hover:text-warning"
                                                        >
                                                            <Pencil
                                                                className="h-4 w-4"
                                                                strokeWidth={
                                                                    1.7
                                                                }
                                                            />
                                                        </Link>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setTarget(product)
                                                            }
                                                            title="Hapus"
                                                            aria-label="Hapus produk"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                                        >
                                                            <Trash2
                                                                className="h-4 w-4"
                                                                strokeWidth={
                                                                    1.7
                                                                }
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* -mx-4/-mb-4 membatalkan padding kartu supaya
                                            rincian tampil full-bleed — tanpa ini padding
                                            kartu dan padding DetailRow bertumpuk dan
                                            menyisakan lebar isi yang terlalu sempit. */}
                                        {isExp && (
                                            <div className="-mx-4 -mb-4 mt-3">
                                                <DetailRow
                                                    product={product}
                                                    onStockModal={setStockModal}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {(products?.last_page ?? 1) > 1 && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                        Halaman {products.current_page} dari{" "}
                        {products.last_page} · {products.total}{" "}
                        {pageTitle.toLowerCase()}
                    </p>
                    <div className="flex items-center gap-1">
                        {(products.links ?? []).map((link, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={!link.url}
                                onClick={() => {
                                    if (link.url) {
                                        router.visit(link.url, {
                                            preserveState: true,
                                        });
                                    }
                                }}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${link.active
                                    ? "bg-primary text-primary-foreground"
                                    : link.url
                                        ? "border border-border text-card-foreground hover:bg-muted"
                                        : "cursor-default text-muted-foreground"
                                    }`}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* FAB Create — mobile/tablet only */}
            {canCreate && (
                <Button
                    as={Link}
                    href={route("admin.products.create")}
                    icon={Plus}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl lg:hidden"
                    title={`Tambah ${pageTitle}`}
                />
            )}

            {/* Confirm Delete Modal */}
            <ConfirmDeleteModal
                open={!!target}
                title="Hapus Produk"
                description={
                    target
                        ? `Yakin ingin menghapus "${target.name}"? Tindakan ini tidak dapat dibatalkan.`
                        : "Tindakan ini tidak dapat dibatalkan."
                }
                confirmLabel="Hapus"
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => {
                    if (!deleting) setTarget(null);
                }}
            />

            {/* Quick Stock Modal */}
            {stockModal && (
                <QuickStockModal
                    product={stockModal.product}
                    type={stockModal.type}
                    variant={stockModal.variant || null}
                    unit={stockModal.unit || null}
                    onClose={() => setStockModal(null)}
                    onSuccess={() => {
                        setStockModal(null);
                        router.reload({ only: ["products", "stats"] });
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
}
