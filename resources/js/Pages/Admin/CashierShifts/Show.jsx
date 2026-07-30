import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Printer,
    ShoppingCart,
} from "lucide-react";

const fmt = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const fmtDt = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "long",
              timeStyle: "medium",
          })
        : "-";

const STATUS_CFG = {
    open: { label: "Berjalan", cls: "bg-success/10 text-success", dot: "bg-success" },
    closed: {
        label: "Tutup",
        cls: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
    },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] ?? {
        label: status,
        cls: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
    };

    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function InfoRow({ label, children }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-0">
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
            backUrl={route("admin.cashier-shifts.index")}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Shift
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        shift.shift_no
                    </div>
                </div>
            }>
            <PageHeader
                title={`Shift ${shift.shift_no}`}
                breadcrumbs={["Admin", "Shift", shift.shift_no]}
                heading={
                    <>
                        Detail{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Shift
                        </span>
                    </>
                }
                description={`Kasir: ${shift.user?.name ?? "-"}`}
                
                action={
                    <div className="flex items-center gap-1 sm:ml-auto">
                        {prevShift && (
                            <Link
                                href={route("admin.cashier-shifts.show", prevShift.id)}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                title={prevShift.shift_no}
                            >
                                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                                Sebelumnya
                            </Link>
                        )}
                        {nextShift && (
                            <Link
                                href={route("admin.cashier-shifts.show", nextShift.id)}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                title={nextShift.shift_no}
                            >
                                Berikutnya
                                <ChevronRight className="h-4 w-4" strokeWidth={2} />
                            </Link>
                        )}
                    </div>
                }
            />
            <div className="space-y-4">
                {/* Banner tutup shift */}
                {isOpen && canClose && (
                    <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-success/10 px-5 py-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                                <Link
                                    href={route("admin.kasir.index")}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                                >
                                    <ShoppingCart className="h-4 w-4" strokeWidth={2} />
                                    Ke POS
                                </Link>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-success">
                                Shift Sedang{" "}
                                <StatusBadge status={shift.status} />
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Durasi: {durasi(shift.opened_at, null)}
                            </p>
                        </div>
                        <button
                            onClick={openCloseModal}
                            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
                        >
                            Tutup Shift
                        </button>
                    </div>
                )}
                {isOpen && !canClose && (
                    <div className="rounded-2xl border border-warning/20 bg-warning/10 px-5 py-3">
                        <p className="text-sm text-warning">
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
                                            <Printer
                                                className="mr-1 inline h-4 w-4"
                                                strokeWidth={1.8}
                                            />
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
                                <table className="hidden w-full text-left text-sm md:table">
                                    <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                        <tr>
                                            <th className="px-5 py-2.5 font-semibold">
                                                Metode
                                            </th>
                                            <th className="px-5 py-2.5 text-right font-semibold">
                                                Total (Sistem)
                                            </th>
                                            {!isOpen && (
                                                <>
                                                    <th className="px-5 py-2.5 text-right font-semibold">
                                                        Aktual
                                                    </th>
                                                    <th className="px-5 py-2.5 text-right font-semibold">
                                                        Selisih
                                                    </th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-background">
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
                                                    className="transition hover:bg-[rgb(var(--color-table-hover))]"
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
                                                                        className={`font-semibold ${pm.difference_amount === 0 ? "text-muted-foreground" : pm.difference_amount > 0 ? "text-success" : "text-destructive"}`}
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

                                {/* Mobile Cards — rincian pembayaran */}
                                <div className="divide-y divide-border md:hidden">
                                    {summary.payment_breakdown.map((p) => {
                                        const pm = (shift.payments ?? []).find(
                                            (sp) =>
                                                sp.payment_method_id ===
                                                p.payment_method_id,
                                        );
                                        return (
                                            <div
                                                key={p.payment_method_id}
                                                className="bg-background p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-foreground">
                                                            {p.method_name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {p.method_type}
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-sm font-semibold text-foreground">
                                                        {fmt(p.total)}
                                                    </p>
                                                </div>
                                                {!isOpen && (
                                                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                                                        <div>
                                                            <p className="text-muted-foreground">
                                                                Aktual
                                                            </p>
                                                            <p className="mt-0.5 font-medium text-foreground">
                                                                {pm?.actual_amount != null
                                                                    ? fmt(pm.actual_amount)
                                                                    : "-"}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-muted-foreground">
                                                                Selisih
                                                            </p>
                                                            <p
                                                                className={`mt-0.5 font-semibold ${
                                                                    pm?.difference_amount == null
                                                                        ? "text-muted-foreground"
                                                                        : pm.difference_amount === 0
                                                                          ? "text-muted-foreground"
                                                                          : pm.difference_amount > 0
                                                                            ? "text-success"
                                                                            : "text-destructive"
                                                                }`}
                                                            >
                                                                {pm?.difference_amount != null
                                                                    ? `${pm.difference_amount >= 0 ? "+" : ""}${fmt(pm.difference_amount)}`
                                                                    : "-"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
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
                                        <span className="text-sm font-semibold text-primary">
                                            {fmt(typeSummary.total_commission)}
                                        </span>
                                    </div>
                                    <table className="hidden w-full text-left text-sm md:table">
                                        <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                            <tr>
                                                <th className="px-5 py-2.5 font-semibold">
                                                    Karyawan
                                                </th>
                                                <th className="px-5 py-2.5 text-right font-semibold">
                                                    Transaksi
                                                </th>
                                                <th className="px-5 py-2.5 text-right font-semibold">
                                                    Total Komisi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-background">
                                            {typeSummary.commissions.map(
                                                (c, i) => (
                                                    <tr
                                                        key={i}
                                                        className="transition hover:bg-[rgb(var(--color-table-hover))]"
                                                    >
                                                        <td className="px-5 py-2.5 font-medium text-foreground">
                                                            {c.employee_name}
                                                        </td>
                                                        <td className="px-5 py-2.5 text-right text-muted-foreground">
                                                            {
                                                                c.transaction_count
                                                            }
                                                        </td>
                                                        <td className="px-5 py-2.5 text-right font-semibold text-primary">
                                                            {fmt(
                                                                c.total_commission,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Mobile Cards — komisi karyawan */}
                                    <div className="divide-y divide-border md:hidden">
                                        {typeSummary.commissions.map((c, i) => (
                                            <div key={i} className="bg-background p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-foreground">
                                                            {c.employee_name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {c.transaction_count} transaksi
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-sm font-semibold text-primary">
                                                        {fmt(c.total_commission)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                    <table className="hidden w-full text-left text-sm md:table">
                                        <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                            <tr>
                                                <th className="px-5 py-2.5 font-semibold">
                                                    Kategori
                                                </th>
                                                <th className="px-5 py-2.5 text-right font-semibold">
                                                    Qty
                                                </th>
                                                <th className="px-5 py-2.5 text-right font-semibold">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-background">
                                            {typeSummary.category_breakdown.map(
                                                (c, i) => (
                                                    <tr
                                                        key={i}
                                                        className="transition hover:bg-[rgb(var(--color-table-hover))]"
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

                                    {/* Mobile Cards — penjualan per kategori */}
                                    <div className="divide-y divide-border md:hidden">
                                        {typeSummary.category_breakdown.map((c, i) => (
                                            <div key={i} className="bg-background p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-foreground">
                                                            {c.category_name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            Qty {c.qty}
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-sm font-semibold text-foreground">
                                                        {fmt(c.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                            <p className="text-sm font-semibold text-primary">
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
                                cls="text-primary"
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
                                                  ? "text-success"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    onMouseDown={() => !closing && setShowClose(false)}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
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
                            <div className="rounded-xl border border-primary/10 bg-primary/10 px-4 py-3">
                                <p className="text-xs font-medium text-primary/70">
                                    Ekspektasi Kas di Laci
                                </p>
                                <p className="text-xl font-bold text-primary">
                                    {fmt(summary?.expected_cash)}
                                </p>
                            </div>
                            {pendingCount > 0 && (
                                <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3">
                                    <p className="text-sm font-medium text-warning">
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
                                        className={`mt-1 text-xs font-medium ${parseFloat(closeData.actual_cash) >= (summary?.expected_cash ?? 0) ? "text-success" : "text-destructive"}`}
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
                                        <div className="mt-2 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2">
                                            <p className="text-xs font-medium text-warning">
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
                                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    onMouseDown={() => !editing && setShowEdit(false)}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
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
                                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    onMouseDown={() => !deleting && setShowDelete(false)}
                >
                    <div
                        className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl"
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
                                className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
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
