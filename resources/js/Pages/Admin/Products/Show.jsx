import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import QuickStockModal from "./QuickStockModal";
import { ChevronLeft } from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */
const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "—";

const MOVEMENT_LABEL = {
    purchase_in: "Pembelian",
    purchase_out: "Pembelian Batal",
    sale_out: "Penjualan",
    adjustment_in: "Penyesuaian",
    adjustment_out: "Penyesuaian",
    transfer_in: "Transfer Masuk",
    transfer_out: "Transfer Keluar",
    return_in: "Retur Masuk",
    return_out: "Retur Keluar",
    waste: "Waste/Rusak",
    opname_adjustment: "Opname",
};

const movementLabel = (type) => MOVEMENT_LABEL[type] ?? type ?? "—";

const TYPE_META = {
    finished_goods: {
        label: "Barang Jadi",
        cls: "bg-violet-50 text-violet-700 border border-violet-200",
    },
    raw_material: {
        label: "Bahan Baku",
        cls: "bg-amber-100 text-amber-700",
    },
    combo: { label: "Combo/Paket", cls: "bg-violet-100 text-violet-700" },
};

const EXPIRY_META = {
    active: {
        label: "Aktif",
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        dot: "bg-emerald-500",
    },
    expiring_soon: {
        label: "Hampir Habis",
        cls: "bg-amber-50 text-amber-700 border border-amber-200",
        dot: "bg-amber-500",
    },
    expired: {
        label: "Kadaluarsa",
        cls: "bg-red-50 text-red-600 border border-red-200",
        dot: "bg-red-500",
    },
};

/* ── batch expiry status helper ─────────────────────── */
function getBatchStatus(batch) {
    if (!batch.expiry_date) return null;
    const today = new Date();
    const exp = new Date(batch.expiry_date);
    if (exp < today) return "expired";
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diff <= 30) return "expiring_soon";
    return "active";
}

/* ── Stock per branch table ──────────────────────────── */
function StockTable({ stocks }) {
    if (!stocks?.length) {
        return (
            <p className="px-6 py-8 text-center text-sm text-slate-400">
                Belum ada data stok.
            </p>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                        <th className="text-left font-medium px-6 py-3 rounded-l-lg">
                            Cabang
                        </th>
                        <th className="text-right font-medium px-6 py-3">
                            Stok
                        </th>
                        <th className="text-right font-medium px-6 py-3">
                            Reserved
                        </th>
                        <th className="text-right font-medium px-6 py-3 rounded-r-lg">
                            Tersedia
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {stocks.map((s) => {
                        const avail = s.quantity - s.reserved_quantity;
                        return (
                            <tr
                                key={s.id}
                                className="hover:bg-slate-50 transition"
                            >
                                <td className="px-6 py-3 font-medium text-slate-700">
                                    {s.branch?.name ?? "Semua Cabang"}
                                </td>
                                <td className="px-6 py-3 text-right font-semibold text-slate-600">
                                    {s.quantity}
                                </td>
                                <td className="px-6 py-3 text-right text-slate-400">
                                    {s.reserved_quantity}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <span
                                        className={`font-semibold ${avail <= 0 ? "text-red-600" : "text-emerald-600"}`}
                                    >
                                        {avail}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ── Batch table ─────────────────────────────────────── */
function BatchTable({ batches }) {
    if (!batches?.length) {
        return (
            <p className="px-6 py-8 text-center text-sm text-slate-400">
                Belum ada batch untuk produk ini.
            </p>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                        <th className="text-left font-medium px-6 py-3 rounded-l-lg">
                            No. Batch
                        </th>
                        <th className="text-right font-medium px-6 py-3">
                            Qty
                        </th>
                        <th className="text-right font-medium px-6 py-3">
                            HPP
                        </th>
                        <th className="text-left font-medium px-6 py-3">
                            Tgl Beli
                        </th>
                        <th className="text-left font-medium px-6 py-3">
                            Kadaluarsa
                        </th>
                        <th className="text-left font-medium px-6 py-3 rounded-r-lg">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {batches.map((b) => {
                        const status = getBatchStatus(b);
                        const meta = status ? EXPIRY_META[status] : null;
                        return (
                            <tr
                                key={b.id}
                                className={`transition hover:bg-slate-50 ${status === "expired" ? "bg-red-50/30" : ""}`}
                            >
                                <td className="px-6 py-3 font-mono text-xs font-semibold text-indigo-600">
                                    {b.batch_no}
                                </td>
                                <td className="px-6 py-3 text-right font-semibold text-slate-800">
                                    {b.quantity}
                                </td>
                                <td className="px-6 py-3 text-right text-slate-500">
                                    {fmt(b.cost_price)}
                                </td>
                                <td className="px-6 py-3 text-slate-500">
                                    {fmtDate(b.purchase_date)}
                                </td>
                                <td className="px-6 py-3 text-slate-500">
                                    {fmtDate(b.expiry_date)}
                                </td>
                                <td className="px-6 py-3">
                                    {meta ? (
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                                            />
                                            {meta.label}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">
                                            —
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ── Margin per bucket table ─────────────────────────── */
function BucketMarginTable({ bucketMargins }) {
    if (!bucketMargins?.length) {
        return (
            <p className="px-6 py-8 text-center text-sm text-slate-400">
                Belum ada data stok untuk menghitung margin per bucket.
            </p>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                        <th className="text-left font-medium px-6 py-3 rounded-l-lg">
                            Bucket
                        </th>
                        <th className="text-right font-medium px-6 py-3">
                            Stok
                        </th>
                        <th className="text-right font-medium px-6 py-3">
                            Harga Jual
                        </th>
                        <th className="text-right font-medium px-6 py-3">
                            Modal (Avg)
                        </th>
                        <th className="text-right font-medium px-6 py-3 rounded-r-lg">
                            Margin
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {bucketMargins.map((b, i) => (
                        <tr key={i} className="transition hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-slate-700">
                                {b.label}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-600">
                                {b.quantity}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-800">
                                {fmt(b.sell_price)}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-500">
                                {fmt(b.average_cost)}
                            </td>
                            <td className="px-6 py-3 text-right">
                                <span
                                    className={`font-semibold ${b.margin_rp < 0 ? "text-red-600" : "text-emerald-600"}`}
                                >
                                    {fmt(b.margin_rp)}
                                </span>
                                <span className="ml-1 text-xs text-slate-400">
                                    ({b.margin_percent}%)
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── Variants table ──────────────────────────────────── */
function VariantsTable({ variants, productId }) {
    if (!variants?.length) {
        return (
            <div className="flex flex-col items-center px-6 py-8 text-center">
                <p className="text-sm text-slate-400 mb-3">
                    Produk ini belum memiliki varian.
                </p>
                <Link
                    href={route("admin.products.variants.index", productId)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                >
                    <svg
                        className="h-3.5 w-3.5"
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
                    Tambah Varian
                </Link>
            </div>
        );
    }
    return (
        <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {variants.map((v) => (
                    <div
                        key={v.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-800">
                                {v.name}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${v.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${v.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                                />
                                {v.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                            {v.sku}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-800">
                                {fmt(v.price)}
                            </span>
                            <div className="flex gap-1">
                                {v.price_tiers?.length > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                        {v.price_tiers.length} grosir
                                    </span>
                                )}
                                {v.packaging_units?.length > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                        {v.packaging_units.length} kemasan
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <Link
                href={route("admin.products.variants.index", productId)}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100"
            >
                <svg
                    className="h-4 w-4"
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
                Kelola Varian
            </Link>
        </div>
    );
}

/* ── Main Show page ──────────────────────────────────── */
export default function Show({
    product,
    totalStock,
    reserved,
    batchStats,
    margin,
    profitRp,
    stockMovements = [],
    bucketMargins = [],
}) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [stockModal, setStockModal] = useState(null);
    const [activeTab, setActiveTab] = useState("stock");
    const [alertDismissed, setAlertDismissed] = useState(false);

    const typeMeta = TYPE_META[product.type] ?? {
        label: product.type,
        cls: "bg-slate-100 text-slate-600",
    };
    const isLowStock =
        product.track_stock && totalStock <= product.stock_minimum;

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.products.destroy", product.id), {
            onSuccess: () => router.visit(route("admin.products.index")),
            onFinish: () => setDeleting(false),
        });
    };

    const tabs = [
        {
            id: "stock",
            label: "Stok per Cabang",
            count: product.stocks?.length,
        },
        {
            id: "batches",
            label: "Batch / Expiry",
            count: product.batches?.length,
        },
        { id: "variants", label: "Varian", count: product.variants?.length },
        ...(bucketMargins.length > 1
            ? [
                  {
                      id: "margins",
                      label: "Margin per Bucket",
                      count: bucketMargins.length,
                  },
              ]
            : []),
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("admin.products.index")}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Kembali"
                        >
                            <ChevronLeft
                                className="h-5 w-5"
                                strokeWidth={1.8}
                            />
                        </Link>
                        <div className="leading-tight">
                            <div className="text-sm font-semibold text-slate-900">
                                Retail POS
                            </div>
                            <div className="text-[11px] text-slate-500">
                                Detail Produk
                            </div>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center text-xs text-slate-500 gap-2">
                        <Link
                            href={route("admin.products.index")}
                            className="hover:text-slate-800"
                        >
                            Produk
                        </Link>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span className="text-slate-900 font-medium">
                            Detail
                        </span>
                    </nav>
                    <div className="flex items-center gap-2">
                        {product.track_stock && (
                            <>
                                <button
                                    onClick={() => {
                                        if (product.supplier) {
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
                                            setStockModal({
                                                product,
                                                type: "in",
                                            });
                                        }
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                    >
                                        <path d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    <span className="hidden sm:inline">
                                        Stok
                                    </span>
                                </button>
                                <button
                                    onClick={() =>
                                        setStockModal({ product, type: "out" })
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                    >
                                        <path d="M5 12h14" />
                                    </svg>
                                </button>
                            </>
                        )}
                        <Link
                            href={route("admin.products.edit", product.id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:from-indigo-700 hover:to-violet-700 shadow-sm transition"
                        >
                            Edit Produk
                        </Link>
                        <button
                            onClick={() => setDeleteOpen(true)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Detail — ${product.name}`} />

            {/* ── Low Stock Alert ── */}
            {isLowStock && !alertDismissed && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-900">
                            Perhatian: Stok menipis
                        </p>
                        <p className="text-sm text-red-700 mt-0.5">
                            Stok produk ini <strong>{totalStock}</strong>{" "}
                            tersisa, minimum {product.stock_minimum}.
                            Pertimbangkan untuk melakukan pembelian.
                        </p>
                    </div>
                    <button
                        onClick={() => setAlertDismissed(true)}
                        className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 rounded"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Expired Batch Alert ── */}
            {batchStats.expired > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900">
                            Batch kadaluarsa
                        </p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            <strong>{batchStats.expired} batch</strong> produk
                            ini sudah kadaluarsa.{" "}
                            <button
                                onClick={() => setActiveTab("batches")}
                                className="underline font-medium"
                            >
                                Lihat batch
                            </button>
                        </p>
                    </div>
                </div>
            )}

            {/* ── Product Header Card ── */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                        {product.image ? (
                            <img
                                src={`/storage/${product.image}`}
                                alt={product.name}
                                className="w-32 h-32 rounded-2xl object-cover shadow-lg"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <span className="text-5xl font-bold text-white">
                                    {product.name
                                        .split(" ")
                                        .map((w) => w[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${product.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${product.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                                />
                                {product.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                            {product.track_stock && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    Dipantau
                                </span>
                            )}
                            {product.is_sellable && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                    Bisa Dijual
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            {product.name}
                        </h1>
                        {product.description && (
                            <p className="text-slate-600 mt-1.5 text-sm sm:text-base">
                                {product.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                            <span className="text-slate-500">
                                SKU:{" "}
                                <span className="font-mono font-medium text-slate-800">
                                    {product.sku}
                                </span>
                            </span>
                            {product.barcode && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500">
                                        Barcode:{" "}
                                        <span className="font-mono font-medium text-slate-800">
                                            {product.barcode}
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stat Cards ── */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">
                            Stok Tersedia
                        </span>
                        <svg
                            className="w-5 h-5 text-indigo-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold">{totalStock}</div>
                    <div className="text-xs text-indigo-100 mt-1">
                        Reserved: {reserved} • Tersedia:{" "}
                        {totalStock - reserved}
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Harga Jual
                        </span>
                        <svg
                            className="w-5 h-5 text-emerald-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                        </svg>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {fmt(product.sell_price)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        per {product.unit}
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Harga Beli
                        </span>
                        <svg
                            className="w-5 h-5 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {fmt(product.cost_price)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        rata-rata HPP
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Margin
                        </span>
                        <svg
                            className="w-5 h-5 text-violet-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                        </svg>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                        {margin}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        {fmt(profitRp)} / unit
                    </div>
                </div>
            </section>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left / Main */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs Card */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="border-b border-slate-200 overflow-x-auto">
                            <div className="flex gap-1 p-2 min-w-max">
                                {tabs.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition whitespace-nowrap ${
                                            activeTab === t.id
                                                ? "text-indigo-600 border-indigo-300 bg-indigo-50"
                                                : "text-slate-600 border-transparent hover:bg-slate-50"
                                        }`}
                                    >
                                        {t.label}
                                        {t.count !== undefined && (
                                            <span
                                                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeTab === t.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}
                                            >
                                                {t.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {activeTab === "stock" && (
                            <StockTable stocks={product.stocks} />
                        )}
                        {activeTab === "batches" && (
                            <BatchTable batches={product.batches} />
                        )}
                        {activeTab === "variants" && (
                            <VariantsTable
                                variants={product.variants}
                                productId={product.id}
                            />
                        )}
                        {activeTab === "margins" && (
                            <BucketMarginTable bucketMargins={bucketMargins} />
                        )}
                    </section>

                    {/* Detail Produk */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">
                            Detail Produk
                        </h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
                                <dt className="text-slate-500 sm:mb-1">
                                    Tipe
                                </dt>
                                <dd>
                                    <span
                                        className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${typeMeta.cls}`}
                                    >
                                        {typeMeta.label}
                                    </span>
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
                                <dt className="text-slate-500 sm:mb-1">
                                    Kategori
                                </dt>
                                <dd className="font-medium text-slate-900">
                                    {product.category?.name ?? "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
                                <dt className="text-slate-500 sm:mb-1">
                                    Supplier
                                </dt>
                                <dd className="font-medium text-slate-900">
                                    {product.supplier?.name ?? "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
                                <dt className="text-slate-500 sm:mb-1">
                                    Barcode
                                </dt>
                                <dd className="font-mono font-medium text-slate-900">
                                    {product.barcode ?? "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
                                <dt className="text-slate-500 sm:mb-1">
                                    Satuan
                                </dt>
                                <dd className="font-medium text-slate-900">
                                    {product.unit}
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
                                <dt className="text-slate-500 sm:mb-1">
                                    Stok Minimum
                                </dt>
                                <dd className="font-semibold text-slate-900">
                                    {product.stock_minimum}
                                </dd>
                            </div>
                            {product.preparation_time && (
                                <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
                                    <dt className="text-slate-500 sm:mb-1">
                                        Waktu Saji
                                    </dt>
                                    <dd className="font-medium text-slate-900">
                                        {product.preparation_time} menit
                                    </dd>
                                </div>
                            )}
                            <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
                                <dt className="text-slate-500 sm:mb-1">
                                    Pantau Stok
                                </dt>
                                <dd>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${product.track_stock ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${product.track_stock ? "bg-emerald-500" : "bg-slate-400"}`}
                                        />
                                        {product.track_stock ? "Ya" : "Tidak"}
                                    </span>
                                </dd>
                            </div>
                            {product.description && (
                                <div className="sm:col-span-2">
                                    <dt className="text-slate-500 mb-1">
                                        Deskripsi
                                    </dt>
                                    <dd className="text-slate-700 leading-relaxed">
                                        {product.description}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </section>
                </div>

                {/* Right / Sidebar */}
                <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
                    {/* Aksi Cepat */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">
                            Aksi Cepat
                        </h2>
                        <div className="space-y-2">
                            <Link
                                href={route(
                                    "admin.products.variants.index",
                                    product.id,
                                )}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-200 transition text-left group"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition">
                                    <svg
                                        className="w-5 h-5 text-indigo-600"
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
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-slate-900">
                                        Kelola Varian
                                    </div>
                                    {product.variants?.length > 0 && (
                                        <div className="text-xs text-slate-500">
                                            {product.variants.length} varian
                                            aktif
                                        </div>
                                    )}
                                </div>
                                <svg
                                    className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </Link>

                            {product.track_stock && product.supplier && (
                                <Link
                                    href={
                                        route("admin.purchases.create") +
                                        "?product_id=" +
                                        product.id +
                                        "&supplier_id=" +
                                        product.supplier_id
                                    }
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-200 transition text-left group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
                                        <svg
                                            className="w-5 h-5 text-emerald-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.7}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-900">
                                            Buat Purchase Order
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Beli stok dari supplier
                                        </div>
                                    </div>
                                    <svg
                                        className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </Link>
                            )}

                            {product.track_stock && (
                                <Link
                                    href={
                                        route("admin.product-batches.index") +
                                        `?product_id=${product.id}`
                                    }
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-200 transition text-left group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition">
                                        <svg
                                            className="w-5 h-5 text-amber-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.7}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-900">
                                            Riwayat Stok
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Lihat pergerakan stok
                                        </div>
                                    </div>
                                    <svg
                                        className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </section>

                    {/* Ringkasan */}
                    <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                        <div className="flex items-center gap-2 mb-3">
                            <svg
                                className="w-5 h-5 text-amber-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Ringkasan
                            </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Produk performa{" "}
                            <span
                                className={`font-semibold ${margin >= 30 ? "text-emerald-400" : margin >= 15 ? "text-amber-400" : "text-red-400"}`}
                            >
                                {margin >= 30
                                    ? "baik"
                                    : margin >= 15
                                      ? "cukup"
                                      : "rendah"}
                            </span>{" "}
                            dengan margin {margin}%.
                            {batchStats.expiring_soon > 0 && (
                                <>
                                    {" "}
                                    Perhatikan{" "}
                                    <span className="text-amber-400 font-semibold">
                                        {batchStats.expiring_soon} batch
                                    </span>{" "}
                                    yang mendekati kadaluarsa.
                                </>
                            )}
                            {batchStats.expired > 0 && (
                                <>
                                    {" "}
                                    <span className="text-red-400 font-semibold">
                                        {batchStats.expired} batch
                                    </span>{" "}
                                    sudah kadaluarsa.
                                </>
                            )}
                        </p>
                    </section>
                </aside>

                {/* Riwayat Stok */}
                {product.track_stock && stockMovements.length > 0 && (
                    <section className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Riwayat Stok
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    10 mutasi terakhir
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-3">
                                            Tanggal
                                        </th>
                                        <th className="px-5 py-3">Tipe</th>
                                        <th className="px-5 py-3 text-right">
                                            Qty
                                        </th>
                                        <th className="px-5 py-3 text-right hidden sm:table-cell">
                                            Harga
                                        </th>
                                        <th className="px-5 py-3 hidden sm:table-cell">
                                            Ref
                                        </th>
                                        <th className="px-5 py-3 hidden md:table-cell">
                                            Keterangan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stockMovements.map((m, i) => {
                                        const isIn =
                                            m.movement_type?.includes("_in") ||
                                            m.movement_type ===
                                                "adjustment_in";
                                        return (
                                            <tr
                                                key={i}
                                                className="transition hover:bg-slate-50/50"
                                            >
                                                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                                                    {fmtDate(m.moved_at)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isIn ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                                                    >
                                                        {isIn ? "+" : "-"}
                                                        {movementLabel(
                                                            m.movement_type,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-slate-800">
                                                    {m.quantity} {product.unit}
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-500 hidden sm:table-cell">
                                                    {m.unit_cost > 0
                                                        ? fmt(m.unit_cost)
                                                        : "-"}
                                                </td>
                                                <td className="px-5 py-3 text-xs text-slate-400 hidden sm:table-cell">
                                                    {m.reference_no ?? "-"}
                                                </td>
                                                <td className="px-5 py-3 text-xs text-slate-400 hidden md:table-cell max-w-[200px] truncate">
                                                    {m.notes ?? "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>

            {/* ── Mobile FAB ── */}
            <div className="lg:hidden fixed bottom-6 right-6 flex flex-col gap-3 z-40">
                {product.track_stock && (
                    <button
                        onClick={() => {
                            if (product.supplier) {
                                router.visit(
                                    route("admin.purchases.create") +
                                        "?product_id=" +
                                        product.id +
                                        "&supplier_id=" +
                                        product.supplier_id,
                                );
                            } else {
                                setStockModal({ product, type: "in" });
                            }
                        }}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg flex items-center justify-center text-white hover:from-indigo-700 hover:to-violet-700 transition"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                )}
                <button
                    onClick={() => setDeleteOpen(true)}
                    className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition"
                >
                    <svg
                        className="w-5 h-5"
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

            <ConfirmDeleteModal
                open={deleteOpen}
                title="Hapus produk?"
                description={`Produk "${product.name}" akan dihapus permanen. Data stok terkait tidak ikut terhapus.`}
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => !deleting && setDeleteOpen(false)}
            />

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
