import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

const fmt = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const fmtDt = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "long",
              timeStyle: "medium",
          })
        : "-";

const STATUS_CLS = {
    open: "bg-emerald-100 text-success",
    closed: "bg-muted text-muted-foreground",
};
const STATUS_LBL = { open: "Berjalan", closed: "Tutup" };

function InfoRow({ label, children }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-50 py-2 last:border-0">
            <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
            <span className="text-right text-sm font-medium text-foreground">
                {children}
            </span>
        </div>
    );
}

function SumRow({ label, value, cls = "text-foreground" }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={`text-sm font-semibold ${cls}`}>{value}</span>
        </div>
    );
}

export default function Show({
    shift,
    summary,
    typeSummary,
    storeType,
    canClose,
    canManage,
    prevShift,
    nextShift,
    pendingCount = 0,
}) {
    const isOpen = shift.status === "open";

    // ── tutup shift ──
    const [showClose, setShowClose] = useState(false);
    const [closeData, setCloseData] = useState({
        actual_cash: "",
        closing_note: "",
        payment_actuals: {},
    });
    const [closing, setClosing] = useState(false);

    // ── admin: edit ──
    const [showEdit, setShowEdit] = useState(false);
    const [editData, setEditData] = useState({
        opening_cash: shift.opening_cash ?? "",
        actual_cash: shift.actual_cash ?? "",
        opening_note: shift.opening_note ?? "",
        closing_note: shift.closing_note ?? "",
    });
    const [editing, setEditing] = useState(false);

    // ── admin: hapus ──
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ── admin: buka ulang ──
    const [reopening, setReopening] = useState(false);

    const initPayActuals = useMemo(() => {
        const m = {};
        (summary?.payment_breakdown ?? []).forEach((p) => {
            m[p.payment_method_id] = "";
        });
        return m;
    }, [summary?.payment_breakdown]);

    const openCloseModal = () => {
        setCloseData({
            actual_cash: "",
            closing_note: "",
            payment_actuals: { ...initPayActuals },
        });
        setShowClose(true);
    };

    const handleClose = () => {
        setClosing(true);
        const payload = {
            actual_cash: closeData.actual_cash,
            closing_note: closeData.closing_note || null,
            payment_actuals: Object.entries(closeData.payment_actuals)
                .filter(([, v]) => v !== "")
                .map(([id, amt]) => ({
                    payment_method_id: parseInt(id),
                    actual_amount: parseFloat(amt),
                })),
        };
        router.post(route("admin.cashier-shifts.close", shift.id), payload, {
            preserveScroll: true,
            onFinish: () => {
                setClosing(false);
                setShowClose(false);
            },
            onError: () => setClosing(false),
        });
    };

    const handleEdit = () => {
        setEditing(true);
        router.patch(route("admin.cashier-shifts.update", shift.id), editData, {
            preserveScroll: true,
            onFinish: () => {
                setEditing(false);
                setShowEdit(false);
            },
            onError: () => setEditing(false),
        });
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.cashier-shifts.destroy", shift.id), {
            onFinish: () => {
                setDeleting(false);
                setShowDelete(false);
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

    const durasi = (from, to) => {
        if (!to) return "Masih berjalan";
        const ms = Math.abs(new Date(to) - new Date(from));
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 min-w-0">
                        <Link
                            href={route("admin.cashier-shifts.index")}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                                />
                            </svg>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate font-mono text-base font-semibold text-foreground">
                                {shift.shift_no}
                            </h2>
                            <p className="truncate text-xs text-muted-foreground">
                                Kasir: {shift.user?.name ?? "-"}
                            </p>
                        </div>
                    </div>

                    {/* Prev/Next navigation */}
                    <div className="flex items-center gap-1 sm:ml-auto">
                        {prevShift && (
                            <Link
                                href={route(
                                    "admin.cashier-shifts.show",
                                    prevShift.id,
                                )}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                title={prevShift.shift_no}
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
                                        d="M15.75 19.5L8.25 12l7.5-7.5"
                                    />
                                </svg>
                                Sebelumnya
                            </Link>
                        )}
                        {nextShift && (
                            <Link
                                href={route(
                                    "admin.cashier-shifts.show",
                                    nextShift.id,
                                )}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                title={nextShift.shift_no}
                            >
                                Berikutnya
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
                                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                    />
                                </svg>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Shift ${shift.shift_no}`} />
            <div className="space-y-4">
                {/* Banner tutup shift */}
                {isOpen && canClose && (
                    <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-success/10 px-5 py-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                                <Link
                                    href={route("admin.kasir.index")}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
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
                                            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.064v5.162c0 .737-.492 1.4-1.215 1.6a48.724 48.724 0 01-8.251 1.135 48.13 48.13 0 01-7.17-.408c-.839-.144-1.465-.844-1.465-1.689v-5.8a2.25 2.25 0 011.5-2.122M6.75 8.25h10.5a2.25 2.25 0 012.25 2.25v4.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 15V10.5a2.25 2.25 0 012.25-2.25z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8.25 8.25V6.375A2.625 2.625 0 0110.875 3.75h2.25a2.625 2.625 0 012.625 2.625V8.25"
                                        />
                                    </svg>
                                    Ke POS
                                </Link>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">
                                Shift Sedang{" "}
                                <span
                                    className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[shift.status] ?? "bg-muted text-muted-foreground"}`}
                                >
                                    {STATUS_LBL[shift.status] ?? shift.status}
                                </span>
                            </p>
                            <p className="text-xs text-emerald-600">
                                Durasi: {durasi(shift.opened_at, null)}
                            </p>
                        </div>
                        <button
                            onClick={openCloseModal}
                            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary/90"
                        >
                            Tutup Shift
                        </button>
                    </div>
                )}
                {isOpen && !canClose && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
                        <p className="text-sm text-amber-800">
                            Shift milik kasir lain. Hanya pemilik shift yang
                            dapat menutupnya.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Kiri: info + pembayaran */}
                    <div className="space-y-4 lg:col-span-2">
                        <div className="rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border bg-muted px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                    Informasi Shift
                                </p>
                                {canManage && (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => {
                                                setEditData({
                                                    opening_cash:
                                                        shift.opening_cash ??
                                                        "",
                                                    actual_cash:
                                                        shift.actual_cash ?? "",
                                                    opening_note:
                                                        shift.opening_note ??
                                                        "",
                                                    closing_note:
                                                        shift.closing_note ??
                                                        "",
                                                });
                                                setShowEdit(true);
                                            }}
                                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                                        >
                                            Edit
                                        </button>
                                        {!isOpen && (
                                            <button
                                                onClick={handleReopen}
                                                disabled={reopening}
                                                className="rounded-lg border border-success/20 bg-card px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10 disabled:opacity-50"
                                            >
                                                {reopening
                                                    ? "..."
                                                    : "Buka Ulang"}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowDelete(true)}
                                            className="rounded-lg border border-destructive/20 bg-card px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                                        >
                                            Hapus
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                                            title="Cetak rekap shift"
                                        >
                                            <svg
                                                className="h-4 w-4 inline mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.23c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                                                />
                                            </svg>
                                            Cetak
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="px-5 py-3">
                                <InfoRow label="No. Shift">
                                    <span className="font-mono">
                                        {shift.shift_no}
                                    </span>
                                </InfoRow>
                                <InfoRow label="Kasir">
                                    {shift.user?.name ?? "-"}
                                </InfoRow>
                                <InfoRow label="Cabang">
                                    {shift.branch?.name ?? "Pusat"}
                                </InfoRow>
                                <InfoRow label="Dibuka">
                                    {fmtDt(shift.opened_at)}
                                </InfoRow>
                                <InfoRow label="Ditutup">
                                    {fmtDt(shift.closed_at)}
                                </InfoRow>
                                {shift.closed_at && (
                                    <InfoRow label="Durasi">
                                        {durasi(
                                            shift.opened_at,
                                            shift.closed_at,
                                        )}
                                    </InfoRow>
                                )}
                                {shift.opening_note && (
                                    <div className="mt-3 rounded-lg bg-muted px-4 py-3">
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                                            Catatan Pembukaan
                                        </p>
                                        <p className="text-sm text-foreground">
                                            {shift.opening_note}
                                        </p>
                                    </div>
                                )}
                                {shift.closing_note && (
                                    <div className="mt-2 rounded-lg bg-muted px-4 py-3">
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                                            Catatan Penutupan
                                        </p>
                                        <p className="text-sm text-foreground">
                                            {shift.closing_note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rincian pembayaran */}
                        {(summary?.payment_breakdown ?? []).length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                <div className="border-b border-border bg-muted px-5 py-3">
                                    <p className="text-sm font-semibold text-foreground">
                                        Rincian Pembayaran
                                    </p>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border bg-muted/50">
                                        <tr>
                                            <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">
                                                Metode
                                            </th>
                                            <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                                                Total (Sistem)
                                            </th>
                                            {!isOpen && (
                                                <>
                                                    <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                                                        Aktual
                                                    </th>
                                                    <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                                                        Selisih
                                                    </th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {summary.payment_breakdown.map((p) => {
                                            const pm = (
                                                shift.payments ?? []
                                            ).find(
                                                (sp) =>
                                                    sp.payment_method_id ===
                                                    p.payment_method_id,
                                            );
                                            return (
                                                <tr
                                                    key={p.payment_method_id}
                                                    className="hover:bg-muted"
                                                >
                                                    <td className="px-5 py-2.5">
                                                        <span className="font-medium text-foreground">
                                                            {p.method_name}
                                                        </span>
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            {p.method_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-2.5 text-right font-medium text-foreground">
                                                        {fmt(p.total)}
                                                    </td>
                                                    {!isOpen && (
                                                        <>
                                                            <td className="px-5 py-2.5 text-right text-muted-foreground">
                                                                {pm?.actual_amount !=
                                                                null
                                                                    ? fmt(
                                                                          pm.actual_amount,
                                                                      )
                                                                    : "-"}
                                                            </td>
                                                            <td className="px-5 py-2.5 text-right">
                                                                {pm?.difference_amount !=
                                                                null ? (
                                                                    <span
                                                                        className={`font-semibold ${pm.difference_amount === 0 ? "text-muted-foreground" : pm.difference_amount > 0 ? "text-emerald-600" : "text-destructive"}`}
                                                                    >
                                                                        {pm.difference_amount >=
                                                                        0
                                                                            ? "+"
                                                                            : ""}
                                                                        {fmt(
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
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── TYPE-SPECIFIC SUMMARY ── */}
                        {/* Komisi Karyawan — service/ticket */}
                        {["service", "ticket"].includes(storeType) &&
                            (typeSummary?.commissions ?? []).length > 0 && (
                                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                    <div className="border-b border-border bg-muted px-5 py-3 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-foreground">
                                            Komisi Karyawan
                                        </p>
                                        <span className="text-sm font-semibold text-primary-700">
                                            {fmt(typeSummary.total_commission)}
                                        </span>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-border bg-muted/50">
                                            <tr>
                                                <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">
                                                    Karyawan
                                                </th>
                                                <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                                                    Transaksi
                                                </th>
                                                <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                                                    Total Komisi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {typeSummary.commissions.map(
                                                (c, i) => (
                                                    <tr
                                                        key={i}
                                                        className="hover:bg-muted"
                                                    >
                                                        <td className="px-5 py-2.5 font-medium text-foreground">
                                                            {c.employee_name}
                                                        </td>
                                                        <td className="px-5 py-2.5 text-right text-muted-foreground">
                                                            {
                                                                c.transaction_count
                                                            }
                                                        </td>
                                                        <td className="px-5 py-2.5 text-right font-semibold text-primary-700">
                                                            {fmt(
                                                                c.total_commission,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        {/* Breakdown Kategori — retail/fnb */}
                        {["retail", "fnb"].includes(storeType) &&
                            (typeSummary?.category_breakdown ?? []).length >
                                0 && (
                                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                    <div className="border-b border-border bg-muted px-5 py-3 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-foreground">
                                            Penjualan per Kategori
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                            {typeSummary.total_transactions}{" "}
                                            transaksi
                                        </span>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-border bg-muted/50">
                                            <tr>
                                                <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">
                                                    Kategori
                                                </th>
                                                <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                                                    Qty
                                                </th>
                                                <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {typeSummary.category_breakdown.map(
                                                (c, i) => (
                                                    <tr
                                                        key={i}
                                                        className="hover:bg-muted"
                                                    >
                                                        <td className="px-5 py-2.5 font-medium text-foreground">
                                                            {c.category_name}
                                                        </td>
                                                        <td className="px-5 py-2.5 text-right text-muted-foreground">
                                                            {c.qty}
                                                        </td>
                                                        <td className="px-5 py-2.5 text-right font-semibold text-foreground">
                                                            {fmt(c.total)}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        {/* Info booking/sesi — rental/session/dll */}
                        {[
                            "rental",
                            "session",
                            "parking",
                            "ticket",
                            "hospitality",
                        ].includes(storeType) &&
                            typeSummary?.total_transactions != null && (
                                <div className="rounded-2xl border border-border bg-card shadow-sm px-5 py-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Total Transaksi Shift
                                        </p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {typeSummary.total_transactions}
                                        </p>
                                    </div>
                                    {typeSummary.booking_count != null && (
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-sm text-muted-foreground">
                                                Booking Dibayar
                                            </p>
                                            <p className="text-sm font-semibold text-primary-700">
                                                {typeSummary.booking_count}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* Kanan: ringkasan keuangan */}
                    <div className="rounded-2xl border border-border bg-card shadow-sm self-start">
                        <div className="border-b border-border bg-muted px-5 py-3">
                            <p className="text-sm font-semibold text-foreground">
                                Ringkasan Keuangan
                            </p>
                        </div>
                        <div className="px-5 py-4">
                            <SumRow
                                label="Kas Awal"
                                value={fmt(shift.opening_cash)}
                            />
                            <SumRow
                                label="Total Penjualan"
                                value={fmt(summary?.total_sales)}
                            />
                            <SumRow
                                label="Penjualan Tunai"
                                value={fmt(summary?.cash_sales)}
                            />
                            <SumRow
                                label="Total Refund"
                                value={fmt(summary?.total_refunds)}
                            />
                            <div className="my-2 border-t border-border" />
                            <SumRow
                                label="Ekspektasi Kas"
                                value={fmt(summary?.expected_cash)}
                                cls="text-primary-700"
                            />
                            {!isOpen && (
                                <>
                                    <SumRow
                                        label="Kas Aktual"
                                        value={fmt(shift.actual_cash)}
                                    />
                                    <SumRow
                                        label="Selisih Kas"
                                        value={fmt(shift.cash_difference)}
                                        cls={
                                            shift.cash_difference === 0
                                                ? "text-foreground"
                                                : shift.cash_difference > 0
                                                  ? "text-emerald-600"
                                                  : "text-destructive"
                                        }
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL TUTUP SHIFT ── */}
            {showClose && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={() => !closing && setShowClose(false)}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-border bg-muted px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Tutup Shift — {shift.shift_no}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Masukkan kas aktual untuk menutup shift.
                            </p>
                        </div>
                        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
                            <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3">
                                <p className="text-xs font-medium text-primary-500">
                                    Ekspektasi Kas di Laci
                                </p>
                                <p className="text-xl font-bold text-primary-700">
                                    {fmt(summary?.expected_cash)}
                                </p>
                            </div>
                            {pendingCount > 0 && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-medium text-amber-800">
                                        ⚠️ Ada {pendingCount} transaksi tertunda
                                        (hold/draft) dalam shift ini. Tutup
                                        shift tetap akan melanjutkan.
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Kas Aktual (Fisik){" "}
                                    <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        value={closeData.actual_cash}
                                        onChange={(e) =>
                                            setCloseData((d) => ({
                                                ...d,
                                                actual_cash: e.target.value,
                                            }))
                                        }
                                        className="block w-full rounded-xl border-border pl-9 text-sm focus:border-ring focus:ring-ring/20"
                                        placeholder="0"
                                    />
                                </div>
                                {closeData.actual_cash !== "" && (
                                    <p
                                        className={`mt-1 text-xs font-medium ${parseFloat(closeData.actual_cash) >= (summary?.expected_cash ?? 0) ? "text-emerald-600" : "text-destructive"}`}
                                    >
                                        Selisih:{" "}
                                        {fmt(
                                            parseFloat(
                                                closeData.actual_cash || 0,
                                            ) - (summary?.expected_cash ?? 0),
                                        )}
                                    </p>
                                )}
                                {closeData.actual_cash !== "" &&
                                    Math.abs(
                                        parseFloat(closeData.actual_cash || 0) -
                                            (summary?.expected_cash ?? 0),
                                    ) > 50000 && (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                            <p className="text-xs font-medium text-amber-700">
                                                ⚠️ Selisih kas lebih dari Rp
                                                50.000. Pastikan perhitungan kas
                                                aktual sudah benar sebelum
                                                menutup shift.
                                            </p>
                                        </div>
                                    )}
                            </div>
                            {(summary?.payment_breakdown ?? []).length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-foreground">
                                        Aktual per Metode{" "}
                                        <span className="font-normal text-muted-foreground">
                                            (opsional)
                                        </span>
                                    </p>
                                    <div className="space-y-2">
                                        {summary.payment_breakdown.map((p) => (
                                            <div
                                                key={p.payment_method_id}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="w-36 shrink-0">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {p.method_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {fmt(p.total)}
                                                    </p>
                                                </div>
                                                <div className="relative flex-1">
                                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                                        Rp
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={
                                                            closeData
                                                                .payment_actuals[
                                                                p
                                                                    .payment_method_id
                                                            ] ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            setCloseData(
                                                                (d) => ({
                                                                    ...d,
                                                                    payment_actuals:
                                                                        {
                                                                            ...d.payment_actuals,
                                                                            [p.payment_method_id]:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                }),
                                                            )
                                                        }
                                                        className="block w-full rounded-xl border-border pl-9 text-sm focus:border-ring focus:ring-ring/20"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Catatan Penutupan
                                </label>
                                <textarea
                                    rows={2}
                                    maxLength={1000}
                                    value={closeData.closing_note}
                                    onChange={(e) =>
                                        setCloseData((d) => ({
                                            ...d,
                                            closing_note: e.target.value,
                                        }))
                                    }
                                    className="block w-full rounded-xl border-border text-sm focus:border-ring focus:ring-ring/20"
                                    placeholder="Opsional..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-border bg-muted px-6 py-4">
                            <button
                                onClick={() => setShowClose(false)}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleClose}
                                disabled={closing || !closeData.actual_cash}
                                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
                            >
                                {closing ? "Menutup..." : "Tutup Shift"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL EDIT ── */}
            {showEdit && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={() => !editing && setShowEdit(false)}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-border bg-muted px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Edit Shift — {shift.shift_no}
                            </h3>
                        </div>
                        <div className="space-y-4 p-6">
                            {[
                                {
                                    key: "opening_cash",
                                    label: "Kas Awal",
                                    type: "number",
                                },
                                {
                                    key: "actual_cash",
                                    label: "Kas Aktual",
                                    type: "number",
                                },
                                {
                                    key: "opening_note",
                                    label: "Catatan Pembukaan",
                                    type: "textarea",
                                },
                                {
                                    key: "closing_note",
                                    label: "Catatan Penutupan",
                                    type: "textarea",
                                },
                            ].map(({ key, label, type }) => (
                                <div key={key}>
                                    <label className="mb-1 block text-sm font-medium text-foreground">
                                        {label}
                                    </label>
                                    {type === "textarea" ? (
                                        <textarea
                                            rows={2}
                                            value={editData[key]}
                                            onChange={(e) =>
                                                setEditData((d) => ({
                                                    ...d,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                            className="block w-full rounded-xl border-border text-sm focus:border-ring focus:ring-ring/20"
                                        />
                                    ) : (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editData[key]}
                                            onChange={(e) =>
                                                setEditData((d) => ({
                                                    ...d,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                            className="block w-full rounded-xl border-border text-sm focus:border-ring focus:ring-ring/20"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 border-t border-border bg-muted px-6 py-4">
                            <button
                                onClick={() => setShowEdit(false)}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleEdit}
                                disabled={editing}
                                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                            >
                                {editing ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL HAPUS ── */}
            {showDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={() => !deleting && setShowDelete(false)}
                >
                    <div
                        className="w-full max-w-sm overflow-hidden rounded-2xl bg-card p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-semibold text-foreground">
                            Hapus Shift?
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Shift{" "}
                            <span className="font-mono font-semibold">
                                {shift.shift_no}
                            </span>{" "}
                            akan dihapus permanen.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => setShowDelete(false)}
                                disabled={deleting}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
