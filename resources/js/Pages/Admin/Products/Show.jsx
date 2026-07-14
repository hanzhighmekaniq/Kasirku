import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import QuickStockModal from "./QuickStockModal";
import {
    ArrowLeft,
    BarChart3,
    Box,
    ChevronLeft,
    Clock,
    DollarSign,
    Edit,
    Eye,
    Image as ImageIcon,
    Info,
    Layers,
    Package,
    Plus,
    ShoppingCart,
    Trash2,
} from "lucide-react";

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
        cls: "bg-indigo-100 text-indigo-700",
    },
    raw_material: { label: "Bahan Baku", cls: "bg-amber-100 text-amber-700" },
    combo: { label: "Combo/Paket", cls: "bg-violet-100 text-violet-700" },
};

const EXPIRY_META = {
    active: {
        label: "Aktif",
        cls: "bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
    },
    expiring_soon: {
        label: "Hampir Habis",
        cls: "bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
    },
    expired: {
        label: "Kadaluarsa",
        cls: "bg-red-50 text-red-600",
        dot: "bg-red-500",
    },
};

/* ── tiny primitives ─────────────────────────────────── */
function Card({ children, className = "" }) {
    return (
        <div
            className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
        >
            {children}
        </div>
    );
}

function CardHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
            <div>
                <h3 className="text-sm font-semibold text-slate-900">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                )}
            </div>
            {action}
        </div>
    );
}

function InfoRow({ label, children }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
            <dt className="shrink-0 text-sm text-slate-500 w-36">{label}</dt>
            <dd className="text-sm font-medium text-slate-800 text-right">
                {children}
            </dd>
        </div>
    );
}

function Badge({ children, className }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
        >
            {children}
        </span>
    );
}

function StatusDot({ active, label }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`}
            />
            {label}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, sub, highlight }) {
    return (
        <div
            className={`rounded-2xl border p-4 ${highlight ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${highlight ? "bg-indigo-100" : "bg-slate-100"}`}
                >
                    <Icon
                        className={`h-5 w-5 ${highlight ? "text-indigo-600" : "text-slate-500"}`}
                        strokeWidth={1.8}
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">
                        {label}
                    </p>
                    <p
                        className={`text-xl font-bold leading-tight ${highlight ? "text-indigo-600" : "text-slate-800"}`}
                    >
                        {value}
                    </p>
                    {sub && (
                        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

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
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-3">Cabang</th>
                        <th className="px-6 py-3 text-right">Stok</th>
                        <th className="px-6 py-3 text-right">Reserved</th>
                        <th className="px-6 py-3 text-right">Tersedia</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {stocks.map((s) => {
                        const avail = s.quantity - s.reserved_quantity;
                        return (
                            <tr
                                key={s.id}
                                className="hover:bg-slate-50/70 transition"
                            >
                                <td className="px-6 py-3 font-medium text-slate-700">
                                    {s.branch?.name ?? "Semua Cabang"}
                                </td>
                                <td className="px-6 py-3 text-right text-slate-600">
                                    {s.quantity}
                                </td>
                                <td className="px-6 py-3 text-right text-slate-400">
                                    {s.reserved_quantity}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <span
                                        className={`font-semibold ${avail <= 0 ? "text-red-600" : "text-slate-800"}`}
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
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-3">No. Batch</th>
                        <th className="px-6 py-3 text-right">Qty</th>
                        <th className="px-6 py-3 text-right">HPP</th>
                        <th className="px-6 py-3">Tgl Beli</th>
                        <th className="px-6 py-3">Kadaluarsa</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {batches.map((b) => {
                        const status = getBatchStatus(b);
                        const meta = status ? EXPIRY_META[status] : null;
                        return (
                            <tr
                                key={b.id}
                                className={`transition hover:bg-slate-50/70 ${status === "expired" ? "bg-red-50/30" : ""}`}
                            >
                                <td className="px-6 py-3 font-mono text-xs font-semibold text-indigo-600">
                                    {b.batch_no}
                                </td>
                                <td className="px-6 py-3 text-right font-medium text-slate-800">
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

/* ── Variants table ──────────────────────────────────── */
function VariantsTable({ variants, productId }) {
    if (!variants?.length) {
        return (
            <div className="flex flex-col items-center px-6 py-8 text-center">
                <p className="text-sm text-slate-400 mb-3">
                    Produk ini belum memiliki varian.
                </p>
                <Link
                    href={route("admin.variants.index", productId)}
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
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-3">Nama</th>
                        <th className="px-6 py-3">SKU</th>
                        <th className="px-6 py-3 text-right">Harga Beli</th>
                        <th className="px-6 py-3 text-right">Harga Jual</th>
                        <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {variants.map((v) => (
                        <tr
                            key={v.id}
                            className="hover:bg-slate-50/70 transition"
                        >
                            <td className="px-6 py-3 font-medium text-slate-800">
                                {v.name}
                            </td>
                            <td className="px-6 py-3 font-mono text-xs text-slate-500">
                                {v.sku}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-500">
                                {fmt(v.cost_price)}
                            </td>
                            <td className="px-6 py-3 text-right font-semibold text-slate-800">
                                {fmt(v.price)}
                            </td>
                            <td className="px-6 py-3 text-center">
                                <StatusDot
                                    active={v.is_active}
                                    label={v.is_active ? "Aktif" : "Nonaktif"}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
}) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [stockModal, setStockModal] = useState(null);
    const [activeTab, setActiveTab] = useState("stock");

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
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href={route("admin.products.index")}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                            aria-label="Kembali"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 19.5L8.25 12l7.5-7.5"
                                />
                            </svg>
                        </Link>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold text-slate-800">
                                {product.name}
                            </h2>
                            <p className="text-xs text-slate-400">
                                SKU: {product.sku}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                                    title={
                                        product.supplier
                                            ? "Beli dari Supplier"
                                            : "Tambah Stok"
                                    }
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
                                    title="Kurangi Stok"
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
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
                            <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button
                            onClick={() => setDeleteOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
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
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                            </svg>
                            <span className="hidden sm:inline">Hapus</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={product.name} />

            {/* Alert: low stock */}
            {isLowStock && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <svg
                        className="h-5 w-5 shrink-0 text-red-500"
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
                    <p className="text-sm text-red-700">
                        Stok produk ini <strong>menipis</strong> ({totalStock}{" "}
                        tersisa, minimum {product.stock_minimum}). Pertimbangkan
                        untuk melakukan pembelian.
                    </p>
                </div>
            )}

            {/* Alert: expired batches */}
            {batchStats.expired > 0 && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <svg
                        className="h-5 w-5 shrink-0 text-amber-500"
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
                    <p className="text-sm text-amber-700">
                        <strong>{batchStats.expired} batch</strong> produk ini
                        sudah kadaluarsa.
                        <button
                            onClick={() => setActiveTab("batches")}
                            className="ml-2 underline font-medium"
                        >
                            Lihat batch
                        </button>
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* ── Left/main column ── */}
                <div className="space-y-5 lg:col-span-2">
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard
                            icon={Boxes}
                            label="Stok Tersedia"
                            value={totalStock}
                            sub={`Reserved: ${reserved}`}
                            highlight={true}
                        />
                        <StatCard
                            icon={DollarSign}
                            label="Harga Jual"
                            value={fmt(product.sell_price)}
                        />
                        <StatCard
                            icon={ShoppingCart}
                            label="Harga Beli"
                            value={fmt(product.cost_price)}
                        />
                        <StatCard
                            icon={BarChart3}
                            label="Margin"
                            value={`${margin}%`}
                            sub={fmt(profitRp) + " / unit"}
                        />
                    </div>

                    {/* Tab section */}
                    <Card>
                        {/* Tabs */}
                        <div className="flex border-b border-slate-100">
                            {tabs.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                                        activeTab === t.id
                                            ? "border-b-2 border-indigo-500 text-indigo-600"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {t.label}
                                    {t.count !== undefined && (
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeTab === t.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}
                                        >
                                            {t.count}
                                        </span>
                                    )}
                                </button>
                            ))}
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
                    </Card>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">
                    {/* Product image */}
                    <Card>
                        <div className="aspect-square w-full overflow-hidden bg-slate-50">
                            {product.image ? (
                                <img
                                    src={`/storage/${product.image}`}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center">
                                    <svg
                                        className="h-16 w-16 text-slate-200"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.2}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <p className="mt-2 text-xs text-slate-400">
                                        Tidak ada gambar
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className={typeMeta.cls}>
                                    {typeMeta.label}
                                </Badge>
                                <StatusDot
                                    active={product.is_active}
                                    label={
                                        product.is_active ? "Aktif" : "Nonaktif"
                                    }
                                />
                                {!product.is_sellable && (
                                    <Badge className="bg-slate-100 text-slate-500">
                                        Tidak Dijual
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Detail info */}
                    <Card>
                        <CardHeader title="Detail Produk" />
                        <dl className="px-6 py-2">
                            <InfoRow label="SKU">
                                <span className="font-mono text-xs">
                                    {product.sku}
                                </span>
                            </InfoRow>
                            {product.barcode && (
                                <InfoRow label="Barcode">
                                    <span className="font-mono text-xs">
                                        {product.barcode}
                                    </span>
                                </InfoRow>
                            )}
                            <InfoRow label="Satuan">{product.unit}</InfoRow>
                            <InfoRow label="Kategori">
                                {product.category?.name ?? "—"}
                            </InfoRow>
                            <InfoRow label="Supplier">
                                <span className="inline-flex items-center gap-1.5">
                                    {product.supplier?.name ?? "—"}
                                    {product.track_stock &&
                                        !product.supplier && (
                                            <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-px text-[10px] font-medium text-amber-700 border border-amber-200">
                                                Tanpa Supplier
                                            </span>
                                        )}
                                </span>
                            </InfoRow>
                            {product.preparation_time && (
                                <InfoRow label="Waktu Saji">
                                    {product.preparation_time} menit
                                </InfoRow>
                            )}
                            <InfoRow label="Stok Minimum">
                                {product.stock_minimum}
                            </InfoRow>
                            <InfoRow label="Pantau Stok">
                                <StatusDot
                                    active={product.track_stock}
                                    label={product.track_stock ? "Ya" : "Tidak"}
                                />
                            </InfoRow>
                            <InfoRow label="Komposisi">
                                <StatusDot
                                    active={product.is_composable}
                                    label={
                                        product.is_composable ? "Ya" : "Tidak"
                                    }
                                />
                            </InfoRow>
                        </dl>
                    </Card>

                    {/* Quick actions */}
                    <Card>
                        <CardHeader title="Aksi Cepat" />
                        <div className="space-y-2 p-4">
                            <Link
                                href={route("admin.variants.index", product.id)}
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                <svg
                                    className="h-5 w-5 shrink-0 text-indigo-500"
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
                                Kelola Varian
                                {product.variants?.length > 0 && (
                                    <span className="ml-auto text-xs text-slate-400">
                                        {product.variants.length} varian
                                    </span>
                                )}
                            </Link>
                            <Link
                                href={route(
                                    "admin.products.recipes.index",
                                    product.id,
                                )}
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                            >
                                <svg
                                    className="h-5 w-5 shrink-0 text-amber-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.7}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l.43 2.146a2.25 2.25 0 01-2.19 2.754H6.01a2.25 2.25 0 01-2.19-2.754l.43-2.146M5 14.5l-.43.107"
                                    />
                                </svg>
                                Kelola Resep Bahan
                            </Link>
                            <Link
                                href={
                                    route("admin.product-batches.index") +
                                    `?product_id=${product.id}`
                                }
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                <svg
                                    className="h-5 w-5 shrink-0 text-indigo-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.7}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
                                    />
                                </svg>
                                Lihat Semua Batch
                                {batchStats.total > 0 && (
                                    <span className="ml-auto text-xs text-slate-400">
                                        {batchStats.total} batch
                                    </span>
                                )}
                            </Link>
                            <Link
                                href={route("admin.products.edit", product.id)}
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                <svg
                                    className="h-5 w-5 shrink-0 text-indigo-500"
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
                                Edit Produk
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Riwayat Stok */}
                {product.track_stock && stockMovements.length > 0 && (
                    <Card className="mt-5">
                        <CardHeader
                            title="Riwayat Stok"
                            subtitle={`10 mutasi terakhir`}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-3">Tanggal</th>
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
                                            m.movement_type === "adjustment_in";
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
                    </Card>
                )}
            </div>

            <ConfirmDeleteModal
                open={deleteOpen}
                title="Hapus produk?"
                description={`Produk "${product.name}" akan dihapus permanen. Data stok terkait tidak ikut terhapus.`}
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => !deleting && setDeleteOpen(false)}
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
