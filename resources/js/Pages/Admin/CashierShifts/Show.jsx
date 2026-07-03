import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;

const STATUS_MAP = {
    open: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
};
const STATUS_LABEL = {
    open: "Berjalan",
    closed: "Tutup",
};

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

function Row({ label, value, valueCls = "" }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className={`text-sm font-medium text-slate-700 ${valueCls}`}>
                {value}
            </dd>
        </div>
    );
}

export default function Show({ shift, summary, canClose }) {
    const { auth } = usePage().props;
    const isAdmin = (auth?.roles ?? []).some(r => ['owner','admin','supervisor'].includes(r)) || ['owner','admin','supervisor'].includes(auth?.role);

    const [confirmingClose, setConfirmingClose] = useState(false);
    const [closingData, setClosingData] = useState({
        actual_cash: "",
        closing_note: "",
        payment_actuals: {},
    });
    const [processing, setProcessing] = useState(false);

    // ── Admin override state ──
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [reopening, setReopening] = useState(false);
    const [confirmingEdit, setConfirmingEdit] = useState(false);
    const [editData, setEditData] = useState({
        opening_cash: shift.opening_cash ?? "",
        actual_cash: shift.actual_cash ?? "",
        opening_note: shift.opening_note ?? "",
        closing_note: shift.closing_note ?? "",
    });
    const [editing, setEditing] = useState(false);

    const isOpen = shift.status === "open";

    // Build payment actuals map from summary
    const defaultPaymentActuals = useMemo(() => {
        const map = {};
        (summary.payment_breakdown ?? []).forEach((p) => {
            map[p.payment_method_id] = "";
        });
        return map;
    }, [summary.payment_breakdown]);

    const handleOpenCloseForm = () => {
        setClosingData({
            actual_cash: "",
            closing_note: "",
            payment_actuals: { ...defaultPaymentActuals },
        });
        setConfirmingClose(true);
    };

    const handleClose = () => {
        setProcessing(true);
        const payload = {
            actual_cash: closingData.actual_cash,
            closing_note: closingData.closing_note || null,
            payment_actuals: Object.entries(closingData.payment_actuals)
                .filter(([, v]) => v !== "")
                .map(([payment_method_id, actual_amount]) => ({
                    payment_method_id: parseInt(payment_method_id),
                    actual_amount: parseFloat(actual_amount),
                })),
        };
        router.post(route("admin.cashier-shifts.close", shift.id), payload, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setConfirmingClose(false);
            },
            onError: () => {
                setProcessing(false);
            },
        });
    };

    // ── Admin handlers ──
    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.cashier-shifts.destroy", shift.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setConfirmingDelete(false);
            },
        });
    };

    const handleReopen = () => {
        setReopening(true);
        router.post(
            route("admin.cashier-shifts.reopen", shift.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setReopening(false),
            },
        );
    };

    const handleEdit = () => {
        setEditing(true);
        router.patch(route("admin.cashier-shifts.update", shift.id), editData, {
            preserveScroll: true,
            onFinish: () => {
                setEditing(false);
                setConfirmingEdit(false);
            },
            onError: () => setEditing(false),
        });
    };

    const openEditForm = () => {
        setEditData({
            opening_cash: shift.opening_cash ?? "",
            actual_cash: shift.actual_cash ?? "",
            opening_note: shift.opening_note ?? "",
            closing_note: shift.closing_note ?? "",
        });
        setConfirmingEdit(true);
    };

    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleString("id-ID", {
                  dateStyle: "long",
                  timeStyle: "medium",
              })
            : "-";

    const formatDuration = (from, to) => {
        if (!to) return "Masih berjalan";
        const diff = Math.abs(new Date(to) - new Date(from));
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        if (hours > 0) return `${hours} jam ${minutes} menit`;
        return `${minutes} menit`;
    };

    const totalActual = useMemo(() => {
        return Object.values(closingData.payment_actuals)
            .filter((v) => v !== "")
            .reduce((sum, v) => sum + parseFloat(v || 0), 0);
    }, [closingData.payment_actuals]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.cashier-shifts.index")}
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
                            {shift.shift_no}
                        </h2>
                        <p className="text-sm text-slate-400">
                            Detail Shift · Kasir: {shift.user?.name ?? "-"}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {/* Admin actions */}
                        {isAdmin && (
                            <>
                                <button
                                    onClick={openEditForm}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                                >
                                    Edit
                                </button>
                                {shift.status === "closed" && (
                                    <button
                                        onClick={handleReopen}
                                        disabled={reopening}
                                        className="rounded-lg border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                                    >
                                        {reopening ? "..." : "Buka Ulang"}
                                    </button>
                                )}
                                <button
                                    onClick={() => setConfirmingDelete(true)}
                                    className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                >
                                    Hapus
                                </button>
                            </>
                        )}
                        <span
                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                STATUS_MAP[shift.status] ??
                                "bg-slate-100 text-slate-600"
                            }`}
                        >
                            {STATUS_LABEL[shift.status] ?? shift.status}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title={`Shift ${shift.shift_no}`} />

            <div className="space-y-5">
                {/* Action Banner for open shift */}
                {isOpen && canClose && (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 shadow-sm">
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">
                                Shift Sedang Berjalan
                            </p>
                            <p className="text-xs text-emerald-600">
                                Sudah berjalan selama{" "}
                                {formatDuration(shift.opened_at, null)}
                            </p>
                        </div>
                        <button
                            onClick={handleOpenCloseForm}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
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
                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                />
                            </svg>
                            Tutup Shift
                        </button>
                    </div>
                )}

                {isOpen && !canClose && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
                        <p className="text-sm font-medium text-amber-800">
                            Shift ini sedang berjalan oleh kasir lain. Hanya
                            kasir pemilik shift yang dapat menutupnya.
                        </p>
                    </div>
                )}

                {/* ── GRID ── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* LEFT — Info & Payment Breakdown */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* Shift Info */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Informasi Shift
                                </h3>
                            </div>
                            <div className="space-y-3 p-6">
                                <InfoRow
                                    label="No. Shift"
                                    value={shift.shift_no}
                                />
                                <InfoRow
                                    label="Kasir"
                                    value={shift.user?.name ?? "-"}
                                />
                                <InfoRow
                                    label="Role"
                                    value={shift.user?.role ?? "-"}
                                />
                                <InfoRow
                                    label="Cabang"
                                    value={shift.branch?.name ?? "-"}
                                />
                                <InfoRow
                                    label="Dibuka"
                                    value={formatDate(shift.opened_at)}
                                    isRaw
                                />
                                <InfoRow
                                    label="Ditutup"
                                    value={formatDate(shift.closed_at)}
                                    isRaw
                                />
                                {shift.closed_at && (
                                    <InfoRow
                                        label="Durasi"
                                        value={formatDuration(
                                            shift.opened_at,
                                            shift.closed_at,
                                        )}
                                    />
                                )}
                                {shift.opening_note && (
                                    <div className="border-t border-slate-100 pt-3">
                                        <p className="text-xs text-slate-400 mb-1">
                                            Catatan Pembukaan
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {shift.opening_note}
                                        </p>
                                    </div>
                                )}
                                {shift.closing_note && (
                                    <div className="border-t border-slate-100 pt-3">
                                        <p className="text-xs text-slate-400 mb-1">
                                            Catatan Penutupan
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {shift.closing_note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        {summary.payment_breakdown &&
                            summary.payment_breakdown.length > 0 && (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                                        <h3 className="text-base font-semibold text-slate-900">
                                            Rincian Pembayaran
                                        </h3>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                                    <th className="px-5 py-3 font-medium text-slate-500">
                                                        Metode
                                                    </th>
                                                    <th className="px-5 py-3 text-right font-medium text-slate-500">
                                                        Total (Sistem)
                                                    </th>
                                                    {shift.status ===
                                                        "closed" && (
                                                        <>
                                                            <th className="px-5 py-3 text-right font-medium text-slate-500">
                                                                Aktual
                                                            </th>
                                                            <th className="px-5 py-3 text-right font-medium text-slate-500">
                                                                Selisih
                                                            </th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {summary.payment_breakdown.map(
                                                    (p, i) => {
                                                        const pm = (
                                                            shift.payments ?? []
                                                        ).find(
                                                            (sp) =>
                                                                sp.payment_method_id ===
                                                                p.payment_method_id,
                                                        );
                                                        return (
                                                            <tr
                                                                key={
                                                                    p.payment_method_id
                                                                }
                                                                className="transition hover:bg-slate-50/50"
                                                            >
                                                                <td className="px-5 py-3">
                                                                    <span className="font-medium text-slate-800">
                                                                        {
                                                                            p.method_name
                                                                        }
                                                                    </span>
                                                                    <span className="ml-2 text-xs text-slate-400">
                                                                        {
                                                                            p.method_type
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-3 text-right font-medium text-slate-700">
                                                                    {fmtRp(
                                                                        p.total,
                                                                    )}
                                                                </td>
                                                                {shift.status ===
                                                                    "closed" && (
                                                                    <>
                                                                        <td className="px-5 py-3 text-right">
                                                                            {pm?.actual_amount !==
                                                                                null &&
                                                                            pm?.actual_amount !==
                                                                                undefined
                                                                                ? fmtRp(
                                                                                      pm.actual_amount,
                                                                                  )
                                                                                : "-"}
                                                                        </td>
                                                                        <td className="px-5 py-3 text-right">
                                                                            {pm?.difference_amount !==
                                                                                null &&
                                                                            pm?.difference_amount !==
                                                                                undefined ? (
                                                                                <span
                                                                                    className={`font-medium ${
                                                                                        pm.difference_amount ===
                                                                                        0
                                                                                            ? "text-slate-500"
                                                                                            : pm.difference_amount >
                                                                                                0
                                                                                              ? "text-emerald-600"
                                                                                              : "text-red-500"
                                                                                    }`}
                                                                                >
                                                                                    {pm.difference_amount >=
                                                                                    0
                                                                                        ? "+"
                                                                                        : ""}
                                                                                    {fmtRp(
                                                                                        pm.difference_amount,
                                                                                    )}
                                                                                </span>
                                                                            ) : (
                                                                                "-"
                                                                            )}
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* RIGHT — Financial Summary */}
                    <div className="space-y-5">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Ringkasan Keuangan
                                </h3>
                            </div>
                            <div className="space-y-3 p-6">
                                <Row
                                    label="Kas Awal"
                                    value={fmtRp(shift.opening_cash)}
                                />
                                <Row
                                    label="Total Penjualan"
                                    value={fmtRp(summary.total_sales)}
                                />
                                <Row
                                    label="Penjualan Tunai"
                                    value={fmtRp(summary.cash_sales)}
                                />
                                <Row
                                    label="Total Refund"
                                    value={fmtRp(summary.total_refunds)}
                                />
                                <hr className="border-slate-100" />
                                <Row
                                    label="Ekspektasi Kas"
                                    value={fmtRp(summary.expected_cash)}
                                    valueCls="text-indigo-700"
                                />
                                {shift.status === "closed" && (
                                    <>
                                        <Row
                                            label="Kas Aktual"
                                            value={fmtRp(shift.actual_cash)}
                                        />
                                        <Row
                                            label="Selisih Kas"
                                            value={fmtRp(shift.cash_difference)}
                                            valueCls={
                                                shift.cash_difference === 0
                                                    ? "text-slate-700"
                                                    : shift.cash_difference > 0
                                                      ? "text-emerald-600"
                                                      : "text-red-500"
                                            }
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CLOSE MODAL ── */}
            {confirmingClose && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                    onMouseDown={() => !processing && setConfirmingClose(false)}
                >
                    <div
                        className="mx-4 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">
                                Tutup Shift — {shift.shift_no}
                            </h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Masukkan jumlah kas aktual untuk menutup shift.
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-5 p-6 max-h-[70vh] overflow-y-auto">
                            {/* Actual Cash */}
                            <div>
                                <label
                                    htmlFor="actual_cash"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Kas Aktual (Total){" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                        <span className="text-sm font-medium text-slate-400">
                                            Rp
                                        </span>
                                    </div>
                                    <input
                                        id="actual_cash"
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        value={closingData.actual_cash}
                                        onChange={(e) =>
                                            setClosingData((prev) => ({
                                                ...prev,
                                                actual_cash: e.target.value,
                                            }))
                                        }
                                        className="block w-full rounded-xl border-slate-300 pl-10 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Expected Cash Reference */}
                            <button
                                type="button"
                                onClick={() =>
                                    setClosingData((prev) => ({
                                        ...prev,
                                        actual_cash: summary.expected_cash,
                                    }))
                                }
                                className="w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-left transition hover:bg-indigo-100/80"
                            >
                                <p className="text-xs text-indigo-600">
                                    Ekspektasi kas menurut sistem:{" "}
                                    <span className="font-bold">
                                        {fmtRp(summary.expected_cash)}
                                    </span>
                                </p>
                                <p className="mt-0.5 text-[10px] text-indigo-400">
                                    Klik untuk isi otomatis ↑
                                </p>
                            </button>

                            {/* Per-Payment-Method Actuals */}
                            {summary.payment_breakdown &&
                                summary.payment_breakdown.length > 0 && (
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-slate-700">
                                            Jumlah Aktual per Metode Bayar{" "}
                                            <span className="text-xs font-normal text-slate-400">
                                                (opsional)
                                            </span>
                                        </p>
                                        <div className="space-y-3">
                                            {summary.payment_breakdown.map(
                                                (p) => (
                                                    <div
                                                        key={
                                                            p.payment_method_id
                                                        }
                                                    >
                                                        <label className="mb-1 flex items-center justify-between text-xs text-slate-500">
                                                            <span>
                                                                {p.method_name}{" "}
                                                                <span className="text-slate-400">
                                                                    (
                                                                    {
                                                                        p.method_type
                                                                    }
                                                                    )
                                                                </span>
                                                            </span>
                                                            <span className="font-medium">
                                                                Sistem:{" "}
                                                                {fmtRp(p.total)}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setClosingData(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            payment_actuals:
                                                                                {
                                                                                    ...prev.payment_actuals,
                                                                                    [p.payment_method_id]:
                                                                                        p.total,
                                                                                },
                                                                        }),
                                                                    )
                                                                }
                                                                className="text-[10px] text-indigo-500 hover:text-indigo-700 underline"
                                                            >
                                                                Isi sesuai
                                                                sistem
                                                            </button>
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                                <span className="text-xs text-slate-400">
                                                                    Rp
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={
                                                                    closingData
                                                                        .payment_actuals[
                                                                        p
                                                                            .payment_method_id
                                                                    ] ?? ""
                                                                }
                                                                onChange={(e) =>
                                                                    setClosingData(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            payment_actuals:
                                                                                {
                                                                                    ...prev.payment_actuals,
                                                                                    [p.payment_method_id]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                },
                                                                        }),
                                                                    )
                                                                }
                                                                className="block w-full rounded-lg border-slate-300 pl-7 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                                placeholder="Masukkan jumlah aktual..."
                                                            />
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        {totalActual > 0 && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                Total aktual:{" "}
                                                <span className="font-semibold">
                                                    {fmtRp(totalActual)}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                )}

                            {/* Closing Note */}
                            <div>
                                <label
                                    htmlFor="closing_note"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Catatan Penutupan
                                </label>
                                <textarea
                                    id="closing_note"
                                    rows={2}
                                    maxLength={1000}
                                    value={closingData.closing_note}
                                    onChange={(e) =>
                                        setClosingData((prev) => ({
                                            ...prev,
                                            closing_note: e.target.value,
                                        }))
                                    }
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    placeholder="Opsional: catatan saat menutup shift..."
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4">
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => setConfirmingClose(false)}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={handleClose}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                                >
                                    {processing ? (
                                        <>
                                            <svg
                                                className="h-4 w-4 animate-spin"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                />
                                            </svg>
                                            Menutup...
                                        </>
                                    ) : (
                                        <>
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
                                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                                />
                                            </svg>
                                            Konfirmasi Tutup Shift
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EDIT MODAL (Admin) ── */}
            {confirmingEdit && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                    onMouseDown={() => !editing && setConfirmingEdit(false)}
                >
                    <div
                        className="mx-4 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">
                                Edit Shift — {shift.shift_no}
                            </h3>
                        </div>
                        <div className="space-y-4 p-6 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Kas Awal
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                        <span className="text-sm text-slate-400">
                                            Rp
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editData.opening_cash}
                                        onChange={(e) =>
                                            setEditData((prev) => ({
                                                ...prev,
                                                opening_cash: e.target.value,
                                            }))
                                        }
                                        className="block w-full rounded-xl border-slate-300 pl-10 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                            </div>
                            {shift.status === "closed" && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Kas Aktual
                                    </label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                            <span className="text-sm text-slate-400">
                                                Rp
                                            </span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editData.actual_cash}
                                            onChange={(e) =>
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    actual_cash: e.target.value,
                                                }))
                                            }
                                            className="block w-full rounded-xl border-slate-300 pl-10 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Catatan Pembukaan
                                </label>
                                <textarea
                                    rows={2}
                                    value={editData.opening_note}
                                    onChange={(e) =>
                                        setEditData((prev) => ({
                                            ...prev,
                                            opening_note: e.target.value,
                                        }))
                                    }
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Catatan Penutupan
                                </label>
                                <textarea
                                    rows={2}
                                    value={editData.closing_note}
                                    onChange={(e) =>
                                        setEditData((prev) => ({
                                            ...prev,
                                            closing_note: e.target.value,
                                        }))
                                    }
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4">
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={editing}
                                    onClick={() => setConfirmingEdit(false)}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={editing}
                                    onClick={handleEdit}
                                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                                >
                                    {editing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DELETE MODAL (Admin) ── */}
            {confirmingDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                    onMouseDown={() => !deleting && setConfirmingDelete(false)}
                >
                    <div
                        className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <svg
                            className="mx-auto mb-4 h-12 w-12 text-red-400"
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
                            Hapus Shift?
                        </h3>
                        <p className="mb-5 text-center text-sm text-slate-500">
                            Shift{" "}
                            <span className="font-medium text-slate-700">
                                {shift.shift_no}
                            </span>{" "}
                            akan dihapus permanen.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmingDelete(false)}
                                disabled={deleting}
                                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600 disabled:opacity-50"
                            >
                                {deleting ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
