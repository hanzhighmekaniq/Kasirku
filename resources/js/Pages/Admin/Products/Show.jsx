import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

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
        cls: "bg-accent/10 text-accent-foreground border border-accent/20",
    },
    raw_material: {
        label: "Bahan Baku",
        cls: "bg-warning/10 text-warning",
    },
    combo: { label: "Combo/Paket", cls: "bg-accent/10 text-accent-foreground" },
};

const EXPIRY_META = {
    active: {
        label: "Aktif",
        cls: "bg-success/10 text-success border border-success/20",
        dot: "bg-success/100",
    },
    expiring_soon: {
        label: "Hampir Habis",
        cls: "bg-warning/5 text-warning border border-warning/20",
        dot: "bg-warning/100",
    },
    expired: {
        label: "Kadaluarsa",
        cls: "bg-destructive/10 text-destructive border border-destructive/20",
        dot: "bg-destructive/100",
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
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Belum ada data stok.
            </p>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
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
                <tbody className="divide-y divide-border">
                    {stocks.map((s) => {
                        const avail = s.quantity - s.reserved_quantity;
                        return (
                            <tr
                                key={s.id}
                                className="hover:bg-muted transition"
                            >
                                <td className="px-6 py-3 font-medium text-foreground">
                                    {s.branch?.name ?? "Semua Cabang"}
                                </td>
                                <td className="px-6 py-3 text-right font-semibold text-muted-foreground">
                                    {s.quantity}
                                </td>
                                <td className="px-6 py-3 text-right text-muted-foreground">
                                    {s.reserved_quantity}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <span
                                        className={`font-semibold ${avail <= 0 ? "text-destructive" : "text-success"}`}
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
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Belum ada batch untuk produk ini.
            </p>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
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
                <tbody className="divide-y divide-border">
                    {batches.map((b) => {
                        const status = getBatchStatus(b);
                        const meta = status ? EXPIRY_META[status] : null;
                        return (
                            <tr
                                key={b.id}
                                className={`transition hover:bg-muted ${status === "expired" ? "bg-destructive/10/30" : ""}`}
                            >
                                <td className="px-6 py-3 font-mono text-xs font-semibold text-primary">
                                    {b.batch_no}
                                </td>
                                <td className="px-6 py-3 text-right font-semibold text-foreground">
                                    {b.quantity}
                                </td>
                                <td className="px-6 py-3 text-right text-muted-foreground">
                                    {fmt(b.cost_price)}
                                </td>
                                <td className="px-6 py-3 text-muted-foreground">
                                    {fmtDate(b.purchase_date)}
                                </td>
                                <td className="px-6 py-3 text-muted-foreground">
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
                                        <span className="text-xs text-muted-foreground">
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
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Belum ada data stok untuk menghitung margin per bucket.
            </p>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
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
                <tbody className="divide-y divide-border">
                    {bucketMargins.map((b, i) => (
                        <tr key={i} className="transition hover:bg-muted">
                            <td className="px-6 py-3 font-medium text-foreground">
                                {b.label}
                            </td>
                            <td className="px-6 py-3 text-right text-muted-foreground">
                                {b.quantity}
                            </td>
                            <td className="px-6 py-3 text-right text-foreground">
                                {fmt(b.sell_price)}
                            </td>
                            <td className="px-6 py-3 text-right text-muted-foreground">
                                {fmt(b.average_cost)}
                            </td>
                            <td className="px-6 py-3 text-right">
                                <span
                                    className={`font-semibold ${b.margin_rp < 0 ? "text-destructive" : "text-success"}`}
                                >
                                    {fmt(b.margin_rp)}
                                </span>
                                <span className="ml-1 text-xs text-muted-foreground">
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
                <p className="text-sm text-muted-foreground mb-3">
                    Produk ini belum memiliki varian.
                </p>
                <Link
                    href={route("admin.products.variants.index", productId)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
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
                        className="rounded-xl border border-border bg-muted/50 p-3"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-foreground">
                                {v.name}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${v.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${v.is_active ? "bg-success/100" : "bg-muted-foreground"}`}
                                />
                                {v.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                            {v.sku}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-foreground">
                                {fmt(v.price)}
                            </span>
                            <div className="flex gap-1">
                                {v.price_tiers?.length > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                        {v.price_tiers.length} grosir
                                    </span>
                                )}
                                {v.packaging_units?.length > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
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
                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
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
    storeType = "retail",
}) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState("stock");
    const [alertDismissed, setAlertDismissed] = useState(false);

    const pageTitle = PAGE_TITLE[storeType] ?? "Produk";

    const typeMeta = TYPE_META[product.type] ?? {
        label: product.type,
        cls: "bg-muted text-muted-foreground",
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
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Manajemen {pageTitle}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Detail
                    </div>
                </div>
            }
        >
            <PageHeader
                title={`Detail — ${product.name}`}
                breadcrumbs={[
                    `Detail ${pageTitle.toLowerCase()}`,
                    productTypes[product.type] ?? product.type,
                    ...(product.sku ? [`SKU: ${product.sku}`] : [])
                ]}
                heading={
                    <>
                        Detail{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {product.name}
                        </span>
                    </>
                }
                description="Lihat statistik, riwayat stok, resep, dan informasi detail terkait produk ini."
                backUrl={route("admin.products.index")}
            />

            {/* ── Low Stock Alert ── */}
            {isLowStock && !alertDismissed && (
                <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-destructive"
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
                        <p className="text-sm font-semibold text-destructive">
                            Perhatian: Stok menipis
                        </p>
                        <p className="text-sm text-destructive mt-0.5">
                            Stok produk ini <strong>{totalStock}</strong>{" "}
                            tersisa, minimum {product.stock_minimum}.
                            Pertimbangkan untuk melakukan pembelian.
                        </p>
                    </div>
                    <button
                        onClick={() => setAlertDismissed(true)}
                        className="flex-shrink-0 p-1 text-destructive/60 hover:text-destructive rounded"
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
                <div className="mb-6 bg-warning/5 border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-warning"
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
                        <p className="text-sm font-semibold text-warning">
                            Batch kadaluarsa
                        </p>
                        <p className="text-sm text-warning mt-0.5">
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
            <section className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                        {product.image ? (
                            <img
                                src={`/storage/${product.image}`}
                                alt={product.name}
                                className="w-32 h-32 rounded-2xl object-cover shadow-lg"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                                <span className="text-5xl font-bold text-primary-foreground">
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
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${product.is_active ? "bg-success/10 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${product.is_active ? "bg-success/100 animate-pulse" : "bg-muted-foreground"}`}
                                />
                                {product.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                            {product.track_stock && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium border border-accent/20">
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                    Dipantau
                                </span>
                            )}
                            {product.is_sellable && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                    Bisa Dijual
                                </span>
                            )}
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                            {product.name}
                        </h1>
                        {product.description && (
                            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
                                {product.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                            <span className="text-muted-foreground">
                                SKU:{" "}
                                <span className="font-mono font-medium text-foreground">
                                    {product.sku}
                                </span>
                            </span>
                            {product.barcode && (
                                <>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span className="text-muted-foreground">
                                        Barcode:{" "}
                                        <span className="font-mono font-medium text-foreground">
                                            {product.barcode}
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Link
                                href={route("admin.products.edit", product.id)}
                                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                            >
                                Edit
                            </Link>
                            <button
                                type="button"
                                onClick={() => setDeleteOpen(true)}
                                className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stat Cards ── */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-primary rounded-2xl p-5 text-primary-foreground shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-primary-foreground/60 uppercase tracking-wider">
                            Stok Tersedia
                        </span>
                        <svg
                            className="w-5 h-5 text-primary-foreground/60"
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
                    <div className="text-xs text-primary-foreground/60 mt-1">
                        Reserved: {reserved} • Tersedia:{" "}
                        {totalStock - reserved}
                    </div>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Harga Jual
                        </span>
                        <svg
                            className="w-5 h-5 text-success"
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
                    <div className="text-2xl font-bold text-foreground">
                        {fmt(product.sell_price)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        per {product.unit}
                    </div>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Harga Beli
                        </span>
                        <svg
                            className="w-5 h-5 text-muted-foreground"
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
                    <div className="text-2xl font-bold text-foreground">
                        {fmt(product.cost_price)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        rata-rata HPP
                    </div>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Margin
                        </span>
                        <svg
                            className="w-5 h-5 text-accent"
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
                    <div className="text-2xl font-bold text-success">
                        {margin}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {fmt(profitRp)} / unit
                    </div>
                </div>
            </section>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left / Main */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs Card */}
                    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="border-b border-border overflow-x-auto">
                            <div className="flex gap-1 p-2 min-w-max">
                                {tabs.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition whitespace-nowrap ${activeTab === t.id
                                                ? "text-primary border-primary/30 bg-primary/10"
                                                : "text-muted-foreground border-transparent hover:bg-muted"
                                            }`}
                                    >
                                        {t.label}
                                        {t.count !== undefined && (
                                            <span
                                                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeTab === t.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
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
                    <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
                        <h2 className="text-lg font-bold text-foreground mb-4">
                            Detail Produk
                        </h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div className="flex justify-between sm:block border-b sm:border-0 border-border pb-2 sm:pb-0">
                                <dt className="text-muted-foreground sm:mb-1">
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
                            <div className="flex justify-between sm:block border-b sm:border-0 border-border pb-2 sm:pb-0">
                                <dt className="text-muted-foreground sm:mb-1">
                                    Kategori
                                </dt>
                                <dd className="font-medium text-foreground">
                                    {product.category?.name ?? "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-border pb-2 sm:pb-0">
                                <dt className="text-muted-foreground sm:mb-1">
                                    Supplier
                                </dt>
                                <dd className="font-medium text-foreground">
                                    {product.supplier?.name ?? "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-border pb-2 sm:pb-0">
                                <dt className="text-muted-foreground sm:mb-1">
                                    Barcode
                                </dt>
                                <dd className="font-mono font-medium text-foreground">
                                    {product.barcode ?? "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-border pb-2 sm:pb-0">
                                <dt className="text-muted-foreground sm:mb-1">
                                    Satuan
                                </dt>
                                <dd className="font-medium text-foreground">
                                    {product.unit}
                                </dd>
                            </div>
                            <div className="flex justify-between sm:block border-b sm:border-0 border-border pb-2 sm:pb-0">
                                <dt className="text-muted-foreground sm:mb-1">
                                    Stok Minimum
                                </dt>
                                <dd className="font-semibold text-foreground">
                                    {product.stock_minimum}
                                </dd>
                            </div>
                            {product.preparation_time && (
                                <div className="flex justify-between sm:block border-b sm:border-0 border-border pb-2 sm:pb-0">
                                    <dt className="text-muted-foreground sm:mb-1">
                                        Waktu Saji
                                    </dt>
                                    <dd className="font-medium text-foreground">
                                        {product.preparation_time} menit
                                    </dd>
                                </div>
                            )}
                            <div className="flex justify-between sm:block border-b sm:border-0 border-border pb-2 sm:pb-0">
                                <dt className="text-muted-foreground sm:mb-1">
                                    Pantau Stok
                                </dt>
                                <dd>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${product.track_stock ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${product.track_stock ? "bg-success/100" : "bg-muted-foreground"}`}
                                        />
                                        {product.track_stock ? "Ya" : "Tidak"}
                                    </span>
                                </dd>
                            </div>
                            {product.description && (
                                <div className="sm:col-span-2">
                                    <dt className="text-muted-foreground mb-1">
                                        Deskripsi
                                    </dt>
                                    <dd className="text-foreground leading-relaxed">
                                        {product.description}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </section>
                    {/* Riwayat Stok */}
                {product.track_stock && stockMovements.length > 0 && (
                    <section className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">
                                    Riwayat Stok
                                </h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    10 mutasi terakhir
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                                <tbody className="divide-y divide-border">
                                    {stockMovements.map((m, i) => {
                                        const isIn =
                                            m.movement_type?.includes("_in") ||
                                            m.movement_type ===
                                            "adjustment_in";
                                        return (
                                            <tr
                                                key={i}
                                                className="transition hover:bg-muted/50"
                                            >
                                                <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                                                    {fmtDate(m.moved_at)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isIn ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                                                    >
                                                        {isIn ? "+" : "-"}
                                                        {movementLabel(
                                                            m.movement_type,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-foreground">
                                                    {m.quantity} {product.unit}
                                                </td>
                                                <td className="px-5 py-3 text-right text-muted-foreground hidden sm:table-cell">
                                                    {m.unit_cost > 0
                                                        ? fmt(m.unit_cost)
                                                        : "-"}
                                                </td>
                                                <td className="px-5 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                                                    {m.reference_no ?? "-"}
                                                </td>
                                                <td className="px-5 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
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

                {/* Right / Sidebar */}
                <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
                    {/* Aksi Cepat */}
                    <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
                        <h2 className="text-lg font-bold text-foreground mb-4">
                            Aksi Cepat
                        </h2>
                        <div className="space-y-2">
                            <Link
                                href={route(
                                    "admin.products.variants.index",
                                    product.id,
                                )}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted border border-border transition text-left group"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                                    <svg
                                        className="w-5 h-5 text-primary"
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
                                    <div className="text-sm font-semibold text-foreground">
                                        Kelola Varian
                                    </div>
                                    {product.variants?.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            {product.variants.length} varian
                                            aktif
                                        </div>
                                    )}
                                </div>
                                <svg
                                    className="w-4 h-4 text-muted-foreground group-hover:text-primary transition"
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
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted border border-border transition text-left group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition">
                                        <svg
                                            className="w-5 h-5 text-success"
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
                                        <div className="text-sm font-semibold text-foreground">
                                            Buat Purchase Order
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Beli stok dari supplier
                                        </div>
                                    </div>
                                    <svg
                                        className="w-4 h-4 text-muted-foreground group-hover:text-success transition"
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
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted border border-border transition text-left group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-warning/5 flex items-center justify-center group-hover:bg-warning/10 transition">
                                        <svg
                                            className="w-5 h-5 text-warning"
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
                                        <div className="text-sm font-semibold text-foreground">
                                            Riwayat Stok
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Lihat pergerakan stok
                                        </div>
                                    </div>
                                    <svg
                                        className="w-4 h-4 text-muted-foreground group-hover:text-warning transition"
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
                    <section className="bg-foreground rounded-2xl p-6 text-primary-foreground">
                        <div className="flex items-center gap-2 mb-3">
                            <svg
                                className="w-5 h-5 text-warning"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
                                Ringkasan
                            </span>
                        </div>
                        <p className="text-sm text-primary-foreground leading-relaxed">
                            Produk performa{" "}
                            <span
                                className={`font-semibold ${margin >= 30 ? "text-success" : margin >= 15 ? "text-warning" : "text-destructive/60"}`}
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
                                    <span className="text-warning font-semibold">
                                        {batchStats.expiring_soon} batch
                                    </span>{" "}
                                    yang mendekati kadaluarsa.
                                </>
                            )}
                            {batchStats.expired > 0 && (
                                <>
                                    {" "}
                                    <span className="text-destructive/60 font-semibold">
                                        {batchStats.expired} batch
                                    </span>{" "}
                                    sudah kadaluarsa.
                                </>
                            )}
                        </p>
                    </section>
                </aside>

                
            </div>

            <ConfirmDeleteModal
                open={deleteOpen}
                title="Hapus produk?"
                description={`Produk "${product.name}" akan dihapus permanen. Data stok terkait tidak ikut terhapus.`}
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => !deleting && setDeleteOpen(false)}
            />
        </AuthenticatedLayout>
    );
}
