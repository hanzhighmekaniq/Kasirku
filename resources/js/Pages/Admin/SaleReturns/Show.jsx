import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";

const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "long",
              timeStyle: "medium",
          })
        : "-";

const STATUS_CONFIG = {
    completed: {
        label: "Selesai",
        color: "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
    },
    cancelled: {
        label: "Dibatalkan",
        color: "bg-slate-100 text-slate-500",
        dot: "bg-slate-400",
    },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function InfoRow({ label, value, isRaw }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd
                className={`text-right text-sm ${
                    isRaw ? "" : "font-medium text-slate-800"
                }`}
            >
                {value}
            </dd>
        </div>
    );
}

export default function Show({ saleReturn }) {
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleCancel = () => {
        setProcessing(true);
        router.patch(
            route("admin.sale-returns.updateStatus", saleReturn.id),
            { status: "cancelled" },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setConfirmingCancel(false);
                },
            },
        );
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.sale-returns.destroy", saleReturn.id), {
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.sale-returns.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {saleReturn.return_no}
                        </h2>
                        <p className="text-sm text-slate-400">
                            Detail Retur Penjualan
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {saleReturn.status === "completed" && (
                            <button
                                onClick={() => setConfirmingCancel(true)}
                                className="rounded-lg border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                            >
                                Batalkan Retur
                            </button>
                        )}
                        <StatusBadge status={saleReturn.status} />
                    </div>
                </div>
            }
        >
            <Head title={`Retur ${saleReturn.return_no}`} />

            <div className="space-y-5">
                {/* Info Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                        <h3 className="text-base font-semibold text-slate-900">
                            Informasi Retur
                        </h3>
                    </div>
                    <div className="space-y-3 p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-slate-400">
                                    Penjualan Asal
                                </p>
                                {saleReturn.sale ? (
                                    <Link
                                        href={route(
                                            "admin.sales.show",
                                            saleReturn.sale.id,
                                        )}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    >
                                        {saleReturn.sale.sale_no}
                                    </Link>
                                ) : (
                                    <p className="text-sm text-slate-500">-</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">
                                    Pelanggan
                                </p>
                                <p className="text-sm font-medium text-slate-800">
                                    {saleReturn.customer?.name ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">
                                    Tanggal Retur
                                </p>
                                <p className="text-sm text-slate-800">
                                    {fmtDate(saleReturn.return_date)}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-slate-400">
                                    Dibuat Oleh
                                </p>
                                <p className="text-sm text-slate-800">
                                    {saleReturn.user?.name ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">
                                    Total Retur
                                </p>
                                <p className="text-sm font-bold text-indigo-600">
                                    {fmtRp(saleReturn.total_amount)}
                                </p>
                            </div>
                        </div>
                        {saleReturn.notes && (
                            <div className="border-t border-slate-100 pt-3">
                                <p className="text-xs text-slate-400 mb-1">
                                    Catatan
                                </p>
                                <p className="text-sm text-slate-600">
                                    {saleReturn.notes}
                                </p>
                            </div>
                        )}

                        {/* Status Info */}
                        {saleReturn.status === "completed" && (
                            <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                                <p className="text-xs text-amber-700">
                                    Total retur sebesar{" "}
                                    <span className="font-semibold">
                                        {fmtRp(saleReturn.total_amount)}
                                    </span>{" "}
                                    telah dikembalikan dari pembayaran penjualan. Stok produk
                                    dikembalikan ke inventaris.
                                </p>
                            </div>
                        )}
                        {saleReturn.status === "cancelled" && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">
                                    Retur telah dibatalkan. Pembayaran dan stok
                                    dikembalikan seperti semula.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                        <h3 className="text-base font-semibold text-slate-900">
                            Item Diretur
                        </h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    <th className="px-5 py-3 font-medium text-slate-500">
                                        Produk
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                        Qty
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                        Harga Satuan
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(saleReturn.items ?? []).map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/50"
                                    >
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-slate-800">
                                                {item.product?.name ?? "-"}
                                            </p>
                                            {item.product?.sku && (
                                                <p className="text-xs text-slate-400">
                                                    SKU: {item.product.sku}
                                                </p>
                                            )}
                                            {item.reason && (
                                                <p className="mt-0.5 text-xs italic text-amber-600">
                                                    Alasan: {item.reason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-600">
                                            {item.quantity}
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-600">
                                            {fmtRp(item.unit_price)}
                                        </td>
                                        <td className="px-5 py-3 text-right font-medium text-slate-700">
                                            {fmtRp(item.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-800">
                                    Total Retur
                                </span>
                                <span className="text-base font-bold text-indigo-600">
                                    {fmtRp(saleReturn.total_amount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {confirmingCancel && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                    onMouseDown={() =>
                        !processing && setConfirmingCancel(false)
                    }
                >
                    <div
                        className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <svg
                            className="mx-auto mb-4 h-12 w-12 text-amber-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                        </svg>
                        <h3 className="mb-2 text-center text-base font-semibold text-slate-900">
                            Batalkan Retur?
                        </h3>
                        <p className="mb-5 text-center text-sm text-slate-500">
                            Pembayaran akan dikembalikan ke penjualan dan stok
                            akan dikurangi kembali. Tindakan ini tidak bisa
                            di-undo.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmingCancel(false)}
                                disabled={processing}
                                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={processing}
                                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600"
                            >
                                {processing
                                    ? "Membatalkan..."
                                    : "Ya, Batalkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
