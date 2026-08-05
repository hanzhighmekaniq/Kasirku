import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    ChevronUp,
    CircleCheck,
    Clock,
    Search,
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

const STATUS_COLOR = {
    pending: "bg-warning/10 text-warning ring-warning/20",
    paid: "bg-success/10 text-success ring-success/20",
    cancelled: "bg-muted text-muted-foreground ring-border",
    failed: "bg-destructive/10 text-destructive ring-destructive/20",
    expired: "bg-muted text-muted-foreground ring-border",
};

function ApproveModal({ order, onClose }) {
    const [notes, setNotes] = useState("");
    const [processing, setProcessing] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route("developer.plan-orders.approve", order.id),
            { notes },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-popover-foreground">
                        Approve Order
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div className="rounded-xl bg-muted p-4 text-sm">
                        <p className="font-semibold text-foreground">{order.idempotency_key}</p>
                        <p className="text-muted-foreground mt-0.5">
                            {order.store_name} → {order.plan_label} · {order.period_label} · {fmt(order.amount)}
                        </p>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Catatan (opsional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="block w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                            placeholder="Catatan konfirmasi pembayaran..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-success-foreground transition hover:bg-success/90 disabled:opacity-60"
                        >
                            {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                            <Check className="h-4 w-4" strokeWidth={2.5} />
                            Approve & Aktifkan Plan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RejectModal({ order, onClose }) {
    const [notes, setNotes] = useState("");
    const [processing, setProcessing] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route("developer.plan-orders.reject", order.id),
            { notes },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-popover-foreground">
                        Tolak Order
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Alasan penolakan <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            required
                            className="block w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                            placeholder="cth. Bukti transfer tidak valid, jumlah tidak sesuai, dsb."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !notes.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-60"
                        >
                            {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                            Tolak Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function OrderHistoryRow({ order }) {
    const isPaid = order.status === "paid";
    const isCancelled = order.status === "cancelled";
    const isFailed = order.status === "failed";

    return (
        <div className="border-t border-border bg-muted/30 px-5 py-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Riwayat
            </p>
            <div className="space-y-3">
                {/* Step 1: Dibuat */}
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                            Dibuat
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {order.user_name
                                ? `oleh ${order.user_name} (Owner)`
                                : "Otomatis (PG)"}
                            {order.is_manual && order.created_by_name && (
                                <span> · diproses manual oleh {order.created_by_name}</span>
                            )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {fmtDate(order.created_at)}
                        </p>
                    </div>
                </div>

                {/* Step 2: Diproses (jika ada) */}
                {(isPaid || isCancelled || isFailed) && (
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            isPaid ? "bg-success/10" : "bg-destructive/10"
                        }`}>
                            <div className={`h-2 w-2 rounded-full ${
                                isPaid ? "bg-success" : "bg-destructive"
                            }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                                {isPaid ? "Disetujui" : isCancelled ? "Ditolak" : "Gagal"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {order.processed_by_name
                                    ? `oleh ${order.processed_by_name}`
                                    : "Sistem (webhook PG)"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {fmtDate(order.paid_at || order.created_at)}
                            </p>
                            {order.notes && (
                                <p className="mt-1.5 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground italic">
                                    "{order.notes}"
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Pending (belum diproses) */}
                {order.status === "pending" && (
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/10">
                            <div className="h-2 w-2 rounded-full bg-warning" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                                Menunggu Persetujuan
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Belum diproses oleh developer
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PlanOrdersIndex({ orders, filters = {}, statusOptions = {} }) {
    const { flash } = usePage().props;
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [expandedId, setExpandedId] = useState(null);

    const applyFilter = () => {
        router.get(route("developer.plan-orders.index"), { search, status }, {
            preserveState: true,
            replace: true,
        });
    };

    const pendingCount = orders.data?.filter((o) => o.status === "pending").length ?? 0;

    return (
        <DeveloperLayout
            header={
                <div>
                    <h2 className="text-lg font-bold text-foreground">
                        Order Upgrade Plan
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {orders.total} order ·{" "}
                        {pendingCount > 0 && (
                            <span className="text-warning font-semibold">
                                {pendingCount} menunggu konfirmasi
                            </span>
                        )}
                    </p>
                </div>
            }
        >
            <Head title="Order Upgrade Plan" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.error}
                </div>
            )}

            {/* Filter */}
            <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex-1 min-w-[180px]">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Cari toko</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                            className="block w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                            placeholder="Nama atau kode toko"
                        />
                    </div>
                </div>
                <div className="min-w-[140px]">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                    >
                        <option value="">Semua</option>
                        {Object.entries(statusOptions).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={applyFilter}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                    <Search className="h-4 w-4" strokeWidth={2.5} />
                    Cari
                </button>
            </div>

            {/* Tabel */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {orders.data?.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                        <p className="text-base font-semibold text-foreground">Belum ada order</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {orders.data?.map((order) => (
                            <div key={order.id}>
                                <div
                                    className={`flex items-center gap-4 px-5 py-4 transition hover:bg-muted/40 ${expandedId === order.id ? "bg-muted/20" : ""}`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-foreground">
                                                {order.store_name}
                                            </p>
                                            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {order.store_code}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_COLOR[order.status] ?? STATUS_COLOR.expired}`}>
                                                {order.status_label}
                                            </span>
                                            {order.is_manual && (
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                    Manual
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {order.idempotency_key} · {order.plan_label} · {order.period_label} · {fmt(order.amount)}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {fmtDate(order.created_at)}
                                            {order.processed_by_name && ` · diproses oleh ${order.processed_by_name}`}
                                        </p>
                                        {order.notes && (
                                            <p className="mt-0.5 text-xs text-muted-foreground italic">
                                                {order.notes}
                                            </p>
                                        )}
                                    </div>

                                    {order.status === "pending" && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setApproveTarget(order); }}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition hover:bg-success/20"
                                            >
                                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                Approve
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setRejectTarget(order); }}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    )}

                                    {order.store_id && (
                                        <Link
                                            href={route("developer.stores.show", { store: order.store_id })}
                                            className="shrink-0 text-xs text-muted-foreground hover:text-primary transition"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Lihat Toko →
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition"
                                    >
                                        {expandedId === order.id ? (
                                            <ChevronUp className="h-4 w-4" strokeWidth={2} />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" strokeWidth={2} />
                                        )}
                                    </button>
                                </div>

                                {expandedId === order.id && (
                                    <OrderHistoryRow order={order} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            {orders.from}–{orders.to} dari {orders.total}
                        </p>
                        <div className="flex items-center gap-1">
                            {orders.links?.map((link, i) => {
                                if (!link.url && !link.active) return null;
                                return (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url, { preserveState: true, replace: true })}
                                        className={`min-w-[36px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${link.active ? "bg-primary text-primary-foreground" : link.url ? "text-muted-foreground hover:bg-muted" : "cursor-default text-muted-foreground/50"}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {approveTarget && (
                <ApproveModal order={approveTarget} onClose={() => setApproveTarget(null)} />
            )}
            {rejectTarget && (
                <RejectModal order={rejectTarget} onClose={() => setRejectTarget(null)} />
            )}
        </DeveloperLayout>
    );
}
