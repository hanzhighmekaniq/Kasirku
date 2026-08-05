import { Head, Link, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    Clock,
    History,
    RotateCcw,
    X,
} from "lucide-react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "—";

const STATUS_STYLE = {
    pending: "bg-warning/10 text-warning",
    paid: "bg-success/10 text-success",
    cancelled: "bg-muted text-muted-foreground",
    failed: "bg-destructive/10 text-destructive",
    expired: "bg-muted text-muted-foreground",
};

const STATUS_LABEL = {
    pending: "Menunggu",
    paid: "Lunas",
    cancelled: "Dibatalkan",
    failed: "Gagal",
    expired: "Kadaluarsa",
};

export default function PlanOrders({ orders }) {
    const { flash } = usePage().props;

    const handleCancel = (orderId) => {
        if (!confirm("Batalkan order ini?")) return;
        router.post(route("admin.plan.orders.cancel", orderId));
    };

    const handleResume = (orderId) => {
        if (!confirm("Lanjutkan order ini? Kamu akan diarahkan ke halaman pembayaran.")) return;
        router.post(route("admin.plan.orders.resume", orderId));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.plan.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Riwayat Order</h2>
                        <p className="text-xs text-muted-foreground">
                            {orders.total} order tercatat
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Riwayat Order Plan" />

            {flash?.success && (
                <div className="mb-5 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.error}
                </div>
            )}

            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {orders.data.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <History className="mb-4 h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                        <p className="text-base font-semibold text-foreground">Belum ada order</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Belum pernah melakukan upgrade plan.
                        </p>
                        <Link
                            href={route("admin.plan.index")}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            Pilih Paket
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-border">
                            {orders.data.map((order) => (
                                <div key={order.id} className="px-5 py-4 hover:bg-muted/30 transition">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold text-foreground">
                                                    {order.plan_label}
                                                </p>
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[order.status] ?? STATUS_STYLE.expired}`}>
                                                    {STATUS_LABEL[order.status] ?? order.status}
                                                </span>
                                                {order.is_manual && (
                                                    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        Manual
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {order.period_label} · {fmt(order.amount)}
                                            </p>
                                            {order.is_prorated && order.original_amount && (
                                                <p className="mt-0.5 text-xs text-success font-medium">
                                                    Prorasi: {fmt(order.amount)} (harga penuh: {fmt(order.original_amount)})
                                                </p>
                                            )}
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Dibuat {fmtDate(order.created_at)}
                                                {order.paid_at && ` · Dibayar ${fmtDate(order.paid_at)}`}
                                            </p>
                                            {order.plan_active_until && (
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Aktif sampai {new Date(order.plan_active_until).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            )}
                                            {order.notes && (
                                                <p className="mt-1 text-xs text-muted-foreground italic">
                                                    &quot;{order.notes}&quot;
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {order.status === "pending" && (
                                                <>
                                                    <Link
                                                        href={route("admin.plan.confirm", order.idempotency_key)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning transition hover:bg-warning/20"
                                                    >
                                                        <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                        Selesaikan
                                                    </Link>
                                                    <button
                                                        onClick={() => handleCancel(order.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20"
                                                    >
                                                        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                        Batalkan
                                                    </button>
                                                </>
                                            )}

                                            {(order.status === "cancelled" || order.status === "failed" || order.status === "expired") && order.resume_count < 1 && order.is_latest_non_paid && (
                                                <button
                                                    onClick={() => handleResume(order.id)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                    Lanjutkan
                                                </button>
                                            )}

                                            {(order.status === "cancelled" || order.status === "failed" || order.status === "expired") && (order.resume_count >= 1 || !order.is_latest_non_paid) && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                    Sudah dilanjutkan
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                                        {order.idempotency_key}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-3.5">
                                <p className="text-xs text-muted-foreground">
                                    {orders.from}–{orders.to} dari {orders.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    {orders.links.map((link, i) => {
                                        if (!link.url && !link.active) return null;
                                        return (
                                            <button
                                                key={i}
                                                disabled={!link.url}
                                                onClick={() =>
                                                    link.url &&
                                                    router.visit(link.url, {
                                                        preserveState: true,
                                                        replace: true,
                                                    })
                                                }
                                                className={`min-w-[36px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                                    link.active
                                                        ? "bg-primary text-primary-foreground"
                                                        : link.url
                                                        ? "text-muted-foreground hover:bg-muted"
                                                        : "cursor-default text-muted-foreground/50"
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
