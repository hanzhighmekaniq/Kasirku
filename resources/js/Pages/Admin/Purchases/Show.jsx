import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";

const PAGE_TITLE = {
    retail: "Pembelian",
    fnb: "Pembelian Bahan Baku",
    rental: "Pembelian Unit",
};
const PRODUCT_LABEL = {
    retail: "Produk",
    fnb: "Bahan Baku",
    rental: "Unit",
};

export default function Show({ purchase, storeType = "retail" }) {
    const { flash } = usePage().props;
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    const pageTitle = PAGE_TITLE[storeType] ?? "Pembelian";
    const productLabel = PRODUCT_LABEL[storeType] ?? "Produk";

    const { supplier, items, payments, user } = purchase;

    const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
    const fmtDate = (d) =>
        new Date(d).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    const fmtShort = (d) =>
        new Date(d).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    const fmtTime = (d) =>
        new Date(d).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });

    const handleStatus = (status) => {
        setProcessing(true);
        router.patch(
            route("admin.purchases.updateStatus", purchase.id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setConfirmingStatus(null);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <PageHeader
                title={`${pageTitle} ${purchase.purchase_no}`}
                breadcrumbs={["Admin", pageTitle, purchase.purchase_no]}
                heading={
                    <>
                        Detail{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {pageTitle}
                        </span>
                    </>
                }
                description="Lihat rincian pembelian, produk, dan status pembayaran."
                backUrl={route("admin.purchases.index")}
            />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}

            {/* Status badges */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <StatusBadge status={purchase.status} />
                <PaymentBadge status={purchase.payment_status} />
                {purchase.status === "draft" && (
                    <>
                        <Link
                            href={route("admin.purchases.edit", purchase.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-card px-3.5 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50"
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
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                />
                            </svg>
                            Edit
                        </Link>
                        <button
                            onClick={() => setConfirmingStatus("completed")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700"
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
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Selesaikan
                        </button>
                        <button
                            onClick={() => setConfirmingStatus("cancelled")}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-card px-3.5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            Batalkan
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Main */}
                <div className="space-y-5 lg:col-span-2">
                    {/* Info */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Informasi {pageTitle}
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoRow
                                    label="No. Faktur"
                                    value={purchase.purchase_no}
                                />
                                <InfoRow
                                    label="Tanggal"
                                    value={fmtDate(purchase.purchase_date)}
                                />
                                <InfoRow
                                    label="Supplier"
                                    value={supplier?.name ?? "-"}
                                />
                                <InfoRow
                                    label="Dicatat oleh"
                                    value={user?.name ?? "-"}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Item {pageTitle}
                            </h3>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-6 py-3 font-medium text-muted-foreground">
                                                #
                                            </th>
                                            <th className="px-6 py-3 font-medium text-muted-foreground">
                                                {productLabel}
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                                                Qty
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                                                Harga
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item, idx) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-muted/50"
                                            >
                                                <td className="px-6 py-3.5 text-muted-foreground">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <p className="font-medium text-foreground">
                                                        {item.product?.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.product?.sku}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-muted-foreground">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-muted-foreground">
                                                    {fmtRp(item.cost_price)}
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-medium text-foreground">
                                                    {fmtRp(item.subtotal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Financial */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Rincian Biaya
                            </h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <Row
                                    label="Subtotal"
                                    value={fmtRp(purchase.subtotal)}
                                />
                                {Number(purchase.discount_amount) > 0 && (
                                    <Row
                                        label="Diskon"
                                        value={`- ${fmtRp(purchase.discount_amount)}`}
                                        valueCls="text-destructive"
                                    />
                                )}
                                {Number(purchase.tax_amount) > 0 && (
                                    <Row
                                        label="Pajak"
                                        value={`+ ${fmtRp(purchase.tax_amount)}`}
                                    />
                                )}
                                {Number(purchase.shipping_amount) > 0 && (
                                    <Row
                                        label="Ongkir"
                                        value={`+ ${fmtRp(purchase.shipping_amount)}`}
                                    />
                                )}
                                <div className="my-2 border-t border-border" />
                                <div className="flex items-center justify-between">
                                    <dt className="font-semibold text-foreground">
                                        Grand Total
                                    </dt>
                                    <dd className="text-lg font-bold text-primary-600">
                                        {fmtRp(purchase.grand_total)}
                                    </dd>
                                </div>
                                <div className="my-2 border-t border-border" />
                                <Row
                                    label="Dibayar"
                                    value={fmtRp(purchase.paid_amount)}
                                />
                                <div className="flex items-center justify-between text-sm">
                                    <dt className="font-medium text-muted-foreground">
                                        Sisa Bayar
                                    </dt>
                                    <dd
                                        className={`font-semibold ${Number(purchase.grand_total) - Number(purchase.paid_amount) > 0 ? "text-rose-600" : "text-emerald-600"}`}
                                    >
                                        {fmtRp(
                                            Number(purchase.grand_total) -
                                                Number(purchase.paid_amount),
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Payments */}
                    {payments && payments.length > 0 && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border bg-muted/50 px-6 py-4">
                                <h3 className="text-base font-semibold text-foreground">
                                    Riwayat Pembayaran
                                </h3>
                            </div>
                            <div className="divide-y divide-border p-4">
                                {payments.map((pay) => (
                                    <div
                                        key={pay.id}
                                        className="py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {fmtShort(pay.paid_at)}{" "}
                                                {fmtTime(pay.paid_at)}
                                            </span>
                                            <span className="text-sm font-semibold text-emerald-600">
                                                {fmtRp(pay.amount)}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                                {pay.paymentMethod?.name ?? "-"}
                                            </span>
                                            {pay.reference_no && (
                                                <span>
                                                    • {pay.reference_no}
                                                </span>
                                            )}
                                        </div>
                                        {pay.note && (
                                            <p className="mt-1 text-xs text-muted-foreground italic">
                                                {pay.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status history */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Status
                            </h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <InfoRow
                                    label="Status"
                                    value={
                                        <StatusBadge status={purchase.status} />
                                    }
                                    isRaw
                                />
                                <InfoRow
                                    label="Pembayaran"
                                    value={
                                        <PaymentBadge
                                            status={purchase.payment_status}
                                        />
                                    }
                                    isRaw
                                />
                                <InfoRow
                                    label="Dibuat"
                                    value={`${fmtDate(purchase.created_at)}`}
                                />
                                {purchase.updated_at !==
                                    purchase.created_at && (
                                    <InfoRow
                                        label="Diupdate"
                                        value={`${fmtDate(purchase.updated_at)}`}
                                    />
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm status modal */}
            {confirmingStatus && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onMouseDown={() => !processing && setConfirmingStatus(null)}
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
                    <div
                        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-foreground">
                            {confirmingStatus === "completed"
                                ? "Selesaikan Pembelian?"
                                : "Batalkan Pembelian?"}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {confirmingStatus === "completed"
                                ? "Stok produk akan ditambahkan sesuai qty item. Tindakan ini tidak dapat dibatalkan."
                                : "Pembelian akan dibatalkan. Jika sudah selesai, stok produk akan dikurangi kembali."}
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmingStatus(null)}
                                disabled={processing}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleStatus(confirmingStatus)}
                                disabled={processing}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${confirmingStatus === "completed" ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700" : "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30 hover:from-red-600 hover:to-red-700"}`}
                            >
                                {processing
                                    ? "Memproses..."
                                    : confirmingStatus === "completed"
                                      ? "Ya, Selesaikan"
                                      : "Ya, Batalkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

/* ── Helpers ── */
function InfoRow({ label, value, isRaw }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd
                className={`text-right ${isRaw ? "" : "font-medium text-foreground"}`}
            >
                {value}
            </dd>
        </div>
    );
}

function Row({ label, value, valueCls = "" }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={`font-medium text-foreground ${valueCls}`}>
                {value}
            </dd>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        draft: "bg-muted text-muted-foreground",
        completed: "bg-emerald-100 text-success",
        cancelled: "bg-red-100 text-destructive",
    };
    const label = {
        draft: "Draft",
        completed: "Selesai",
        cancelled: "Dibatalkan",
    };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
        >
            {label[status] ?? status}
        </span>
    );
}

function PaymentBadge({ status }) {
    const map = {
        unpaid: "bg-rose-100 text-rose-600",
        partial: "bg-amber-100 text-amber-700",
        paid: "bg-emerald-100 text-success",
    };
    const label = { unpaid: "Belum Bayar", partial: "Sebagian", paid: "Lunas" };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
        >
            {label[status] ?? status}
        </span>
    );
}
