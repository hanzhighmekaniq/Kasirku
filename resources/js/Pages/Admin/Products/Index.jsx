import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import QuickStockModal from "@/Components/QuickStockModal";
import TreePicker from "@/Components/TreePicker";
import Select from "@/Components/ui/Select";

const TYPE_LABEL = {
    finished_goods: {
        label: "Barang Jadi",
        bg: "bg-indigo-100",
        text: "text-indigo-700",
    },
    raw_material: {
        label: "Bahan Baku",
        bg: "bg-amber-100",
        text: "text-amber-700",
    },
    combo: {
        label: "Combo/Paket",
        bg: "bg-violet-100",
        text: "text-violet-700",
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
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${t.bg} ${t.text}`}
        >
            {t.label}
        </span>
    );
}

function StockBadge({ product }) {
    if (!product.track_stock) {
        return <span className="text-xs text-slate-400">—</span>;
    }
    const low = product.stock <= product.stock_minimum;
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${low ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
            {product.stock} {product.unit}
        </span>
    );
}

export default function Index({
    products,
    allCategories = [],
    storeType = "retail",
}) {
    const { storeTypeFeatures = [] } = usePage().props;
    const has = (f) => storeTypeFeatures.includes(f);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [stockModal, setStockModal] = useState(null); // { product, type: "in"|"out" }

    const pageTitle = PAGE_TITLE[storeType] ?? "Produk";
    const filterTypeOptions = FILTER_TYPES[storeType] ?? FILTER_TYPES.retail;

    // Kolom yang tampil — derived from storeTypeFeatures (database)
    const showStock = has("stock");
    const showMargin = has("purchase");
    const showCapacity = storeType === "ticket";
    const showDuration = ["session", "parking"].includes(storeType);
    const showRateHour = [
        "session",
        "parking",
        "rental",
        "hospitality",
    ].includes(storeType);
    const showDeposit = storeType === "rental";
    const showMaxGuests = storeType === "hospitality";
    const showPrepTime = has("kitchen");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products.filter((p) => {
            const matchSearch =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.barcode ?? "").toLowerCase().includes(q);
            const matchType = !filterType || p.type === filterType;
            const matchCategory =
                !filterCategory || String(p.category_id) === filterCategory;
            const matchStatus =
                filterStatus === ""
                    ? true
                    : filterStatus === "1"
                      ? p.is_active
                      : !p.is_active;
            return matchSearch && matchType && matchCategory && matchStatus;
        });
    }, [products, search, filterType, filterCategory, filterStatus]);

    const stats = useMemo(
        () => ({
            total: products.length,
            active: products.filter((p) => p.is_active).length,
            lowStock: showStock
                ? products.filter(
                      (p) => p.track_stock && p.stock <= p.stock_minimum,
                  ).length
                : null,
            inactive: products.filter((p) => !p.is_active).length,
        }),
        [products, showStock],
    );

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

    const hasFilters = search || filterType || filterCategory || filterStatus;

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
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Manajemen {pageTitle}
                    </h2>
                    <Link
                        href={route("admin.products.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        <span className="hidden sm:inline">
                            Tambah {pageTitle}
                        </span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title={`Manajemen ${pageTitle}`} />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    {
                        label: `Total ${pageTitle}`,
                        value: stats.total,
                        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10",
                        color: "text-slate-700",
                    },
                    {
                        label: "Aktif",
                        value: stats.active,
                        icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                        color: "text-emerald-600",
                    },
                    {
                        label: "Nonaktif",
                        value: stats.inactive,
                        icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
                        color: "text-slate-400",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <svg
                                    className={`h-5 w-5 ${s.color}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.8}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d={s.icon}
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    {s.label}
                                </p>
                                <p className={`text-xl font-bold ${s.color}`}>
                                    {s.value}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {showStock && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <svg
                                    className="h-5 w-5 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.8}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    Stok Menipis
                                </p>
                                <p className="text-xl font-bold text-red-600">
                                    {stats.lowStock}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.8}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                    />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, SKU, atau barcode..."
                                className="block w-full rounded-xl border-slate-300 pl-9 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Select
                                options={filterTypeOptions.map(
                                    ([val, lbl]) => ({
                                        value: val,
                                        label: lbl,
                                    }),
                                )}
                                value={filterType}
                                onChange={setFilterType}
                                placeholder="Semua Tipe"
                                className="min-w-[160px]"
                            />
                            <div className="min-w-[200px]">
                                <TreePicker
                                    categories={allCategories}
                                    value={filterCategory}
                                    onChange={(v) => setFilterCategory(v)}
                                    onClear={() => setFilterCategory("")}
                                    placeholder="Semua Kategori"
                                    size="sm"
                                />
                            </div>
                            <Select
                                options={[
                                    { value: "", label: "Semua Status" },
                                    { value: "1", label: "Aktif" },
                                    { value: "0", label: "Nonaktif" },
                                ]}
                                value={filterStatus}
                                onChange={setFilterStatus}
                                placeholder="Semua Status"
                                className="min-w-[150px]"
                            />
                            {hasFilters && (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setFilterType("");
                                        setFilterCategory("");
                                        setFilterStatus("");
                                    }}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.8}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan{" "}
                            <span className="font-semibold text-slate-700">
                                {filtered.length}
                            </span>{" "}
                            dari {products.length} {pageTitle.toLowerCase()}
                        </p>
                    </div>
                </div>

                {/* Empty state */}
                {filtered.length === 0 ? (
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
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                                Tambah {pageTitle}
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-3.5">Produk</th>
                                        <th className="px-5 py-3.5">Tipe</th>
                                        <th className="px-5 py-3.5 hidden lg:table-cell">
                                            Kategori
                                        </th>
                                        {showMargin && (
                                            <th className="px-5 py-3.5 text-right hidden xl:table-cell">
                                                Harga Beli
                                            </th>
                                        )}
                                        <th className="px-5 py-3.5 text-right">
                                            {sellPriceLabel}
                                        </th>
                                        {showRateHour && (
                                            <th className="px-5 py-3.5 text-right hidden xl:table-cell">
                                                Per Jam
                                            </th>
                                        )}
                                        {showCapacity && (
                                            <th className="px-5 py-3.5 text-center hidden lg:table-cell">
                                                Kapasitas
                                            </th>
                                        )}
                                        {showMaxGuests && (
                                            <th className="px-5 py-3.5 text-center hidden lg:table-cell">
                                                Max Tamu
                                            </th>
                                        )}
                                        {showDuration && (
                                            <th className="px-5 py-3.5 text-center hidden lg:table-cell">
                                                Durasi
                                            </th>
                                        )}
                                        {showDeposit && (
                                            <th className="px-5 py-3.5 text-right hidden lg:table-cell">
                                                Deposit
                                            </th>
                                        )}
                                        {showPrepTime && (
                                            <th className="px-5 py-3.5 text-center hidden lg:table-cell">
                                                Prep
                                            </th>
                                        )}
                                        {showStock && (
                                            <th className="px-5 py-3.5 text-center">
                                                Stok
                                            </th>
                                        )}
                                        <th className="px-5 py-3.5 text-center">
                                            Status
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product.image ? (
                                                        <img
                                                            src={`/storage/${product.image}`}
                                                            alt={product.name}
                                                            className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                                                            <svg
                                                                className="h-5 w-5 text-indigo-400"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={
                                                                    1.5
                                                                }
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
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={route(
                                                                "admin.products.show",
                                                                product.id,
                                                            )}
                                                            className="font-medium text-slate-800 hover:text-indigo-600 transition-colors truncate max-w-[200px] block"
                                                        >
                                                            {product.name}
                                                        </Link>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-xs text-slate-400">
                                                                SKU:{" "}
                                                                {product.sku}
                                                            </span>
                                                            {product.barcode && (
                                                                <span className="text-xs text-slate-400">
                                                                    &middot;{" "}
                                                                    {
                                                                        product.barcode
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs text-slate-400">
                                                                Satuan:{" "}
                                                                {product.unit}
                                                            </span>
                                                            {product.track_stock &&
                                                                !product.supplier && (
                                                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-px text-[10px] font-medium text-amber-700 border border-amber-200">
                                                                        Tanpa
                                                                        Supplier
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <TypeBadge
                                                    type={product.type}
                                                />
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 hidden lg:table-cell">
                                                {product.category?.name ?? (
                                                    <span className="text-slate-300 italic text-xs">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </td>

                                            {/* Harga Beli — hanya retail/fnb */}
                                            {showMargin && (
                                                <td className="px-5 py-4 text-right text-slate-500 hidden xl:table-cell">
                                                    Rp{" "}
                                                    {Number(
                                                        product.cost_price || 0,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                            )}
                                            {/* Harga Jual / Tarif */}
                                            <td className="px-5 py-4 text-right font-medium text-slate-800">
                                                Rp{" "}
                                                {Number(
                                                    product.sell_price || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            {/* Tarif per jam */}
                                            {showRateHour && (
                                                <td className="px-5 py-4 text-right text-slate-600 hidden xl:table-cell">
                                                    {product.price_per_hour >
                                                    0 ? (
                                                        `Rp ${Number(product.price_per_hour).toLocaleString("id-ID")}`
                                                    ) : (
                                                        <span className="text-slate-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {/* Kapasitas — ticket */}
                                            {showCapacity && (
                                                <td className="px-5 py-4 text-center text-slate-600 hidden lg:table-cell">
                                                    {product.capacity ?? (
                                                        <span className="text-slate-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {/* Max Guests — hospitality */}
                                            {showMaxGuests && (
                                                <td className="px-5 py-4 text-center text-slate-600 hidden lg:table-cell">
                                                    {product.max_guests ? (
                                                        `${product.max_guests} tamu`
                                                    ) : (
                                                        <span className="text-slate-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {/* Durasi Paket — session/parking */}
                                            {showDuration && (
                                                <td className="px-5 py-4 text-center text-slate-600 hidden lg:table-cell">
                                                    {product.session_duration_minutes ===
                                                    0 ? (
                                                        <span className="text-xs text-emerald-600 font-medium">
                                                            Unlimited
                                                        </span>
                                                    ) : product.session_duration_minutes ? (
                                                        `${product.session_duration_minutes} mnt`
                                                    ) : (
                                                        <span className="text-slate-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {/* Deposit — rental */}
                                            {showDeposit && (
                                                <td className="px-5 py-4 text-right text-slate-600 hidden lg:table-cell">
                                                    {product.deposit_amount >
                                                    0 ? (
                                                        `Rp ${Number(product.deposit_amount).toLocaleString("id-ID")}`
                                                    ) : (
                                                        <span className="text-slate-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {/* Prep Time — fnb */}
                                            {showPrepTime && (
                                                <td className="px-5 py-4 text-center text-slate-500 hidden lg:table-cell">
                                                    {product.preparation_time ? (
                                                        `${product.preparation_time}m`
                                                    ) : (
                                                        <span className="text-slate-300">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {/* Stok — hanya yang relevan */}
                                            {showStock && (
                                                <td className="px-5 py-4 text-center">
                                                    <div className="inline-flex items-center gap-1">
                                                        <StockBadge
                                                            product={product}
                                                        />
                                                        {product.track_stock && (
                                                            <div className="ml-0.5 inline-flex gap-0.5">
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        if (
                                                                            product.supplier
                                                                        ) {
                                                                            router.visit(
                                                                                route(
                                                                                    "admin.purchases.create",
                                                                                ) +
                                                                                    "?product_id=" +
                                                                                    product.id +
                                                                                    "&supplier_id=" +
                                                                                    product.supplier_id,
                                                                            );
                                                                        } else {
                                                                            setStockModal(
                                                                                {
                                                                                    product,
                                                                                    type: "in",
                                                                                },
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200"
                                                                    title={
                                                                        product.supplier
                                                                            ? "Beli dari Supplier"
                                                                            : "Tambah Stok"
                                                                    }
                                                                >
                                                                    <svg
                                                                        className="h-3 w-3"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path d="M12 4.5v15m7.5-7.5h-15" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        setStockModal(
                                                                            {
                                                                                product,
                                                                                type: "out",
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-600 transition hover:bg-red-200"
                                                                    title="Kurangi Stok"
                                                                >
                                                                    <svg
                                                                        className="h-3 w-3"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path d="M5 12h14" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                                >
                                                    {product.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Tombol Varian — hanya retail/fnb */}
                                                    {["retail", "fnb"].includes(
                                                        storeType,
                                                    ) && (
                                                        <Link
                                                            href={route(
                                                                "admin.products.variants.index",
                                                                product.id,
                                                            )}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                                                            title="Kelola Varian"
                                                        >
                                                            <svg
                                                                className="h-5 w-5"
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
                                                    {/* Tombol Resep — hanya fnb */}
                                                    {storeType === "fnb" &&
                                                        product.type !==
                                                            "raw_material" && (
                                                            <Link
                                                                href={route(
                                                                    "admin.products.recipes.index",
                                                                    product.id,
                                                                )}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-orange-50 hover:text-orange-600"
                                                                title="Kelola Resep"
                                                            >
                                                                <svg
                                                                    className="h-5 w-5"
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
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                        title="Edit"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.7}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                                            />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            setTarget(product)
                                                        }
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                        title="Hapus"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.7}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-slate-100 md:hidden">
                            {filtered.map((product) => (
                                <div key={product.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        {product.image ? (
                                            <img
                                                src={`/storage/${product.image}`}
                                                alt={product.name}
                                                className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                                                <svg
                                                    className="h-6 w-6 text-indigo-400"
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
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-medium text-slate-800">
                                                    {product.name}
                                                </p>
                                                <TypeBadge
                                                    type={product.type}
                                                />
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                SKU: {product.sku}
                                                {product.barcode
                                                    ? ` · ${product.barcode}`
                                                    : ""}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                                <span className="text-sm font-semibold text-slate-800">
                                                    Rp{" "}
                                                    {Number(
                                                        product.sell_price || 0,
                                                    ).toLocaleString("id-ID")}
                                                </span>
                                                {showRateHour &&
                                                    product.price_per_hour >
                                                        0 && (
                                                        <span className="text-xs text-slate-500">
                                                            /jam: Rp{" "}
                                                            {Number(
                                                                product.price_per_hour,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </span>
                                                    )}
                                                {showDuration && (
                                                    <span className="text-xs text-slate-500">
                                                        {product.session_duration_minutes ===
                                                        0
                                                            ? "Unlimited"
                                                            : product.session_duration_minutes
                                                              ? `${product.session_duration_minutes} mnt`
                                                              : null}
                                                    </span>
                                                )}
                                                {showDeposit &&
                                                    product.deposit_amount >
                                                        0 && (
                                                        <span className="text-xs text-slate-500">
                                                            Deposit: Rp{" "}
                                                            {Number(
                                                                product.deposit_amount,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </span>
                                                    )}
                                                {product.category?.name && (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                                        {product.category.name}
                                                    </span>
                                                )}
                                                {showStock && (
                                                    <div className="inline-flex items-center gap-1">
                                                        <StockBadge
                                                            product={product}
                                                        />
                                                        {product.track_stock && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        if (
                                                                            product.supplier
                                                                        ) {
                                                                            router.visit(
                                                                                route(
                                                                                    "admin.purchases.create",
                                                                                ) +
                                                                                    "?product_id=" +
                                                                                    product.id +
                                                                                    "&supplier_id=" +
                                                                                    product.supplier_id,
                                                                            );
                                                                        } else {
                                                                            setStockModal(
                                                                                {
                                                                                    product,
                                                                                    type: "in",
                                                                                },
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                                                    title={
                                                                        product.supplier
                                                                            ? "Beli dari Supplier"
                                                                            : "Tambah Stok"
                                                                    }
                                                                >
                                                                    <svg
                                                                        className="h-3 w-3"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path d="M12 4.5v15m7.5-7.5h-15" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setStockModal(
                                                                            {
                                                                                product,
                                                                                type: "out",
                                                                            },
                                                                        )
                                                                    }
                                                                    className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200"
                                                                    title="Kurangi Stok"
                                                                >
                                                                    <svg
                                                                        className="h-3 w-3"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path d="M5 12h14" />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                                >
                                                    {product.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-center gap-1">
                                                {["retail", "fnb"].includes(
                                                    storeType,
                                                ) && (
                                                    <Link
                                                        href={route(
                                                            "admin.products.variants.index",
                                                            product.id,
                                                        )}
                                                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                                                    >
                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.7}
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
                                                            />
                                                        </svg>
                                                        Varian
                                                    </Link>
                                                )}
                                                {storeType === "fnb" &&
                                                    product.type !==
                                                        "raw_material" && (
                                                        <Link
                                                            href={route(
                                                                "admin.products.recipes.index",
                                                                product.id,
                                                            )}
                                                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-orange-600 transition hover:bg-orange-50"
                                                        >
                                                            <svg
                                                                className="h-3.5 w-3.5"
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
                                                            Resep
                                                        </Link>
                                                    )}
                                                <Link
                                                    href={route(
                                                        "admin.products.edit",
                                                        product.id,
                                                    )}
                                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.7}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                                        />
                                                    </svg>
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        setTarget(product)
                                                    }
                                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.7}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                        />
                                                    </svg>
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmDeleteModal
                open={!!target}
                title="Hapus produk?"
                description={
                    target
                        ? `Produk "${target.name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`
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
