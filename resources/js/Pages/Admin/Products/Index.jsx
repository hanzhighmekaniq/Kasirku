import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import QuickStockModal from "@/Pages/Admin/Products/QuickStockModal";
import TreePicker from "@/Components/TreePicker";
import Select from "@/Components/ui/Select";

const TYPE_LABEL = {
    finished_goods: {
        label: "Barang Jadi",
        bg: "bg-blue-100",
        text: "text-blue-700",
    },
    raw_material: {
        label: "Bahan Baku",
        bg: "bg-purple-100",
        text: "text-purple-700",
    },
    combo: {
        label: "Combo/Paket",
        bg: "bg-pink-100",
        text: "text-pink-700",
    },
    service: {
        label: "Jasa/Layanan",
        bg: "bg-teal-100",
        text: "text-teal-700",
    },
    rental_item: {
        label: "Item Rental",
        bg: "bg-cyan-100",
        text: "text-cyan-700",
    },
    time_based: {
        label: "Berbasis Waktu",
        bg: "bg-rose-100",
        text: "text-rose-700",
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
        bg: "bg-slate-100",
        text: "text-slate-600",
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
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                Tanpa Stok
            </span>
        );
    }
    const stock = product.stock ?? 0;
    const min = product.stock_minimum ?? 0;
    if (stock <= 0) {
        return (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                Habis
            </span>
        );
    }
    if (stock <= min) {
        return (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Menipis
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            Cukup
        </span>
    );
}

function StatusBadge({ isActive }) {
    return isActive ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
            Nonaktif
        </span>
    );
}

function IndicatorBadges({ product }) {
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
                className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
            >
                Variant {variantCount}
            </span>,
        );
    }
    if (hasUnits) {
        badges.push(
            <span
                key="unit"
                className="inline-flex items-center rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700"
            >
                Multi-Satuan
            </span>,
        );
    }
    if (hasTiers) {
        badges.push(
            <span
                key="tier"
                className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
            >
                Grosir
            </span>,
        );
    }

    if (badges.length === 0) {
        return <span className="text-xs text-slate-400">&mdash;</span>;
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
}

function SummaryCard({ label, value, color = "slate", icon }) {
    const bgColors = {
        blue: "bg-blue-100 text-blue-600",
        emerald: "bg-emerald-100 text-emerald-600",
        amber: "bg-amber-100 text-amber-600",
        slate: "bg-slate-100 text-slate-600",
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500 sm:text-sm">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
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

function DetailRow({ product }) {
    const variants = product.variants ?? [];
    const packagingUnits = product.packaging_units ?? [];
    const priceTiers = product.price_tiers ?? [];
    const hasVariants = variants.length > 0;

    const rows = [];

    if (hasVariants) {
        variants.forEach((v) => {
            const units = v.packaging_units?.length
                ? v.packaging_units
                      .map(
                          (u) =>
                              `${u.name} (${u.conversion_qty} ${product.unit}): Rp ${Number(u.sell_price || 0).toLocaleString("id-ID")}`,
                      )
                      .join(", ")
                : "—";
            const tiers = v.price_tiers?.length
                ? v.price_tiers
                      .map(
                          (t) =>
                              `${t.min_qty}+ Rp ${Number(t.price).toLocaleString("id-ID")}`,
                      )
                      .join(" · ")
                : "—";

            rows.push(
                <tr key={v.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">
                        {v.name}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">
                        {v.sku}
                    </td>
                    <td className="px-3 py-2 text-right">
                        Rp{" "}
                        {Number(v.price || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500">
                        Rp{" "}
                        {Number(v.cost_price || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                        {units}
                    </td>
                    <td className="px-3 py-2 text-xs">{tiers}</td>
                </tr>,
            );
        });
    } else {
        const units = packagingUnits.length
            ? packagingUnits
                  .map(
                      (u) =>
                          `${u.name} (${u.conversion_qty} ${product.unit}): Rp ${Number(u.sell_price || 0).toLocaleString("id-ID")}`,
                  )
                  .join(", ")
            : "—";
        const tiers = priceTiers.length
            ? priceTiers
                  .map(
                      (t) =>
                          `${t.min_qty}+ Rp ${Number(t.price).toLocaleString("id-ID")}`,
                  )
                  .join(" · ")
            : "—";

        rows.push(
            <tr key={product.id}>
                <td className="px-3 py-2 font-medium text-slate-800">
                    {product.name}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600">
                    {product.sku}
                </td>
                <td className="px-3 py-2 text-right">
                    Rp{" "}
                    {Number(product.sell_price || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-3 py-2 text-right text-slate-500">
                    Rp{" "}
                    {Number(product.cost_price || 0).toLocaleString("id-ID")}
                </td>
                <td className="px-3 py-2 text-center text-xs">{units}</td>
                <td className="px-3 py-2 text-xs">{tiers}</td>
            </tr>,
        );
    }

    return (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Detail {hasVariants ? "Variant" : "Produk"}
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                        <tr>
                            <th className="px-3 py-2 text-left">
                                {hasVariants ? "Variant" : "Produk"}
                            </th>
                            <th className="px-3 py-2 text-left">SKU</th>
                            <th className="px-3 py-2 text-right">Harga Jual</th>
                            <th className="px-3 py-2 text-right">Harga Modal</th>
                            <th className="px-3 py-2 text-left">Multi-Satuan</th>
                            <th className="px-3 py-2 text-left">Grosir</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function hasExpandable(product) {
    return (
        (product.variants?.length ?? 0) > 0 ||
        (product.packaging_units?.length ?? 0) > 0 ||
        (product.price_tiers?.length ?? 0) > 0
    );
}

export default function Index({
    products,
    allCategories = [],
    storeType = "retail",
    stats = {},
    filters = {},
}) {
    const { storeTypeFeatures = [] } = usePage().props;
    const has = (f) => storeTypeFeatures.includes(f);
    const [search, setSearch] = useState(filters?.search ?? "");
    const [filterType, setFilterType] = useState(filters?.type ?? "");
    const [filterCategory, setFilterCategory] = useState(
        filters?.category ?? "",
    );
    const [filterStatus, setFilterStatus] = useState(filters?.status ?? "");
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
                <div className="flex w-full items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Manajemen {pageTitle}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Kelola produk, variant, satuan, dan harga grosir
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Manajemen ${pageTitle}`} />

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
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-200 p-4">
                    <div className="flex flex-col gap-3">
                        {/* Search + Filter Toggle */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <svg
                                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
                                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {/* Filter toggle — mobile only */}
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`inline-flex items-center justify-center rounded-lg border px-3 transition lg:hidden ${
                                    showFilter || hasFilters
                                        ? "border-blue-300 bg-blue-50 text-blue-600"
                                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
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
                                            router.get(
                                                route("admin.products.index"),
                                                {},
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                                            <path d="M3 3v5h5" />
                                        </svg>
                                        Reset
                                    </button>
                                )}
                                <Link
                                    href={route("admin.products.create")}
                                    className="hidden lg:inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                                    </svg>
                                    Tambah {pageTitle}
                                </Link>
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                        Menampilkan{" "}
                        <span className="font-semibold text-slate-700">
                            {list.length}
                        </span>{" "}
                        dari {products.total} {pageTitle.toLowerCase()}
                    </p>
                </div>

                {/* Empty state */}
                {list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                            <svg
                                className="h-8 w-8 text-slate-400"
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
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {hasFilters
                                ? `${pageTitle} tidak ditemukan`
                                : `Belum ada ${pageTitle.toLowerCase()}`}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {hasFilters
                                ? "Coba kata kunci atau filter lain."
                                : `Mulai dengan menambahkan ${pageTitle.toLowerCase()} pertama.`}
                        </p>
                        {!hasFilters && (
                            <Link
                                href={route("admin.products.create")}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Produk
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
                                        <th className="px-4 py-3 text-right font-semibold">
                                            {sellPriceLabel}
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Badges
                                        </th>
                                        {showStock && (
                                            <th className="px-4 py-3 text-center font-semibold">
                                                Stok
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
                                <tbody className="divide-y divide-slate-100">
                                    {list.map((product) => {
                                        const isExp = expanded.has(product.id);
                                        const canExp = hasExpandable(product);
                                        return (
                                            <>
                                                <tr
                                                    key={product.id}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {product.image ? (
                                                                <img
                                                                    src={`/storage/${product.image}`}
                                                                    alt={
                                                                        product.name
                                                                    }
                                                                    className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-500">
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
                                                                <Link
                                                                    href={route(
                                                                        "admin.products.show",
                                                                        product.id,
                                                                    )}
                                                                    className="block max-w-[200px] truncate font-semibold text-slate-900 transition-colors hover:text-blue-600"
                                                                >
                                                                    {
                                                                        product.name
                                                                    }
                                                                </Link>
                                                                <p className="font-mono text-xs text-slate-500">
                                                                    {product.sku}
                                                                    {product.barcode
                                                                        ? ` · ${product.barcode}`
                                                                        : ""}
                                                                </p>
                                                                <p className="text-xs text-slate-400">
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
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {product.category
                                                            ?.name ?? (
                                                            <span className="text-xs italic text-slate-300">
                                                                &mdash;
                                                            </span>
                                                        )}
                                                    </td>
                                                    {showMargin && (
                                                        <td className="px-4 py-3 text-right text-slate-500">
                                                            Rp{" "}
                                                            {Number(
                                                                product.cost_price ||
                                                                    0,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                                        Rp{" "}
                                                        {Number(
                                                            product.sell_price ||
                                                                0,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <IndicatorBadges
                                                            product={product}
                                                        />
                                                    </td>
                                                    {showStock && (
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="font-semibold text-slate-900">
                                                                    {product.stock ??
                                                                        0}
                                                                </span>
                                                                <StockBadge
                                                                    product={
                                                                        product
                                                                    }
                                                                />
                                                                {product.track_stock && (
                                                                    <div className="mt-1 flex items-center gap-1">
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
                                                                            className="inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
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
                                                                            className="inline-flex h-6 items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 text-xs font-medium text-blue-700 shadow-sm transition hover:bg-blue-100"
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
                                                            </div>
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
                                                        <div className="flex items-center justify-center gap-1">
                                                            {canExp && (
                                                                <button
                                                                    onClick={() =>
                                                                        toggleExpand(
                                                                            product.id,
                                                                        )
                                                                    }
                                                                    className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100"
                                                                    title="Detail"
                                                                >
                                                                    <svg
                                                                        className={`h-4 w-4 transition ${isExp ? "rotate-180" : ""}`}
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                    >
                                                                        <path d="m6 9 6 6 6-6" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {["retail", "fnb"].includes(
                                                                storeType,
                                                            ) && (
                                                                <Link
                                                                    href={route(
                                                                        "admin.products.variants.index",
                                                                        product.id,
                                                                    )}
                                                                    className="rounded p-1.5 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
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
                                                            {storeType ===
                                                                "fnb" &&
                                                                product.type !==
                                                                    "raw_material" && (
                                                                    <Link
                                                                        href={route(
                                                                            "admin.products.recipes.index",
                                                                            product.id,
                                                                        )}
                                                                        className="rounded p-1.5 text-slate-500 transition hover:bg-orange-50 hover:text-orange-600"
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
                                                            <Link
                                                                href={route(
                                                                    "admin.products.edit",
                                                                    product.id,
                                                                )}
                                                                className="rounded p-1.5 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
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
                                                            <button
                                                                onClick={() =>
                                                                    setTarget(
                                                                        product,
                                                                    )
                                                                }
                                                                className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
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
                                                                    : 0)
                                                            }
                                                            className="p-0"
                                                        >
                                                            <DetailRow
                                                                product={product}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-slate-100 lg:hidden">
                            {list.map((product) => {
                                const isExp = expanded.has(product.id);
                                const canExp = hasExpandable(product);
                                return (
                                    <div key={product.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            {product.image ? (
                                                <img
                                                    src={`/storage/${product.image}`}
                                                    alt={product.name}
                                                    className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-500">
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
                                                    <p className="font-semibold text-slate-900">
                                                        {product.name}
                                                    </p>
                                                    <TypeBadge
                                                        type={product.type}
                                                    />
                                                </div>
                                                <p className="mt-0.5 font-mono text-xs text-slate-500">
                                                    {product.sku}
                                                    {product.barcode
                                                        ? ` · ${product.barcode}`
                                                        : ""}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {product.category?.name ??
                                                        "—"}{" "}
                                                    · {product.unit}
                                                </p>
                                                <div className="mt-2 flex items-baseline gap-2">
                                                    <span className="font-bold text-slate-900">
                                                        Rp{" "}
                                                        {Number(
                                                            product.sell_price ||
                                                                0,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </span>
                                                    {showMargin && (
                                                        <span className="text-xs text-slate-400 line-through">
                                                            Rp{" "}
                                                            {Number(
                                                                product.cost_price ||
                                                                    0,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <IndicatorBadges
                                                        product={product}
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
                                                <div className="mt-3 flex gap-3 text-sm font-medium">
                                                    {canExp && (
                                                        <button
                                                            onClick={() =>
                                                                toggleExpand(
                                                                    product.id,
                                                                )
                                                            }
                                                            className="text-slate-600"
                                                        >
                                                            {isExp
                                                                ? "Sembunyikan"
                                                                : "Detail"}
                                                        </button>
                                                    )}
                                                    {showStock &&
                                                        product.track_stock && (
                                                            <button
                                                                onClick={() =>
                                                                    setStockModal(
                                                                        {
                                                                            product,
                                                                            type: "in",
                                                                        },
                                                                    )
                                                                }
                                                                className="text-blue-600"
                                                            >
                                                                Stok
                                                            </button>
                                                        )}
                                                    <Link
                                                        href={route(
                                                            "admin.products.edit",
                                                            product.id,
                                                        )}
                                                        className="text-amber-600"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            setTarget(product)
                                                        }
                                                        className="text-red-600"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {isExp && (
                                            <DetailRow product={product} />
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
                <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
                    <p className="text-sm text-slate-500">
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
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                    link.active
                                        ? "bg-blue-600 text-white"
                                        : link.url
                                          ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                                          : "cursor-default text-slate-300"
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
            <Link
                href={route("admin.products.create")}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/40 transition hover:shadow-2xl hover:shadow-blue-500/50 lg:hidden"
                title={`Tambah ${pageTitle}`}
            >
                <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
            </Link>

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
                    onClose={() => setStockModal(null)}
                    onSuccess={() => setStockModal(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
