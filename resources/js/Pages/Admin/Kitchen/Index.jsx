import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { RefreshCw } from "lucide-react";

const STATUS_CONFIG = {
    pending: {
        label: "Menunggu",
        color: "border-destructive/20 bg-destructive/10",
        headerColor: "bg-destructive text-destructive-foreground",
        badge: "bg-destructive/10 text-destructive",
        dot: "bg-destructive",
    },
    cooking: {
        label: "Dimasak",
        color: "border-warning/20 bg-warning/10",
        headerColor: "bg-warning text-warning-foreground",
        badge: "bg-warning/10 text-warning",
        dot: "bg-warning",
    },
    ready: {
        label: "Siap Disajikan",
        color: "border-success/20 bg-success/10",
        headerColor: "bg-success text-success-foreground",
        badge: "bg-success/10 text-success",
        dot: "bg-success",
    },
};

const NEXT_STATUS = {
    pending: { status: "cooking", label: "Mulai Masak",      btnClass: "bg-warning hover:bg-warning/90 text-warning-foreground" },
    cooking: { status: "ready",   label: "Siap! ✓",          btnClass: "bg-success hover:bg-success/90 text-success-foreground" },
    ready:   { status: "served",  label: "Sudah Disajikan",  btnClass: "bg-secondary hover:bg-secondary/80 text-secondary-foreground" },
};

function timeSince(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}d`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}j`;
}

function OrderCard({ order, canUpdate, onStatusChange, updating }) {
    const cfg = STATUS_CONFIG[order.kitchen_status];
    const next = NEXT_STATUS[order.kitchen_status];
    const isUrgent =
        order.kitchen_status === "pending" &&
        Date.now() - new Date(order.sale_date) > 10 * 60 * 1000; // >10 menit

    return (
        <div
            className={`rounded-2xl border-2 p-4 shadow-sm transition ${cfg.color} ${
                isUrgent ? "animate-pulse border-destructive" : ""
            }`}
        >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">
                            {order.table
                                ? `Meja ${order.table.table_number}`
                                : order.order_type === "takeaway"
                                  ? "Takeaway"
                                  : "Delivery"}
                        </span>
                        {isUrgent && (
                            <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                                LAMA!
                            </span>
                        )}
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">
                        {order.sale_no}
                    </p>
                </div>
                <div className="text-right">
                    <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}
                    >
                        {timeSince(order.sale_date)}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className="mb-4 space-y-1.5">
                {(order.items ?? []).map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-bold text-foreground shadow-sm">
                            {item.quantity}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight text-foreground">
                                {item.product?.name ?? "Produk"}
                            </p>
                            {item.notes && (
                                <p className="text-[10px] italic text-muted-foreground">
                                    {item.notes}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="mb-3 rounded-lg bg-card/80 px-3 py-2 text-xs italic text-muted-foreground">
                    📝 {order.notes}
                </div>
            )}

            {/* Action button */}
            {canUpdate && next && (
                <button
                    onClick={() => onStatusChange(order.id, next.status)}
                    disabled={updating === order.id}
                    className={`w-full rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50 ${next.btnClass}`}
                >
                    {updating === order.id ? "..." : next.label}
                </button>
            )}
        </div>
    );
}

export default function Index({ orders, stats, canUpdate }) {
    const [updating, setUpdating] = useState(null);
    const [countdown, setCountdown] = useState(15);

    // Auto-refresh setiap 15 detik
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    router.reload({ only: ["orders", "stats"] });
                    return 15;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleStatusChange = async (saleId, newStatus) => {
        setUpdating(saleId);
        try {
            await axios.patch(route("admin.kitchen.update-status", saleId), {
                status: newStatus,
            });
            router.reload({ only: ["orders", "stats"] });
        } catch (e) {
            alert(
                "Gagal update status: " +
                    (e.response?.data?.message ?? e.message),
            );
        } finally {
            setUpdating(null);
        }
    };

    const columns = ["pending", "cooking", "ready"];
    const grouped = Object.fromEntries(
        columns.map((s) => [s, orders.filter((o) => o.kitchen_status === s)]),
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-foreground">
                        🍳 Kitchen Display
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* Stats */}
                        <div className="flex items-center gap-2">
                            {columns.map((s) => (
                                <span
                                    key={s}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CONFIG[s].badge}`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[s].dot}`}
                                    />
                                    {stats[s]} {STATUS_CONFIG[s].label}
                                </span>
                            ))}
                        </div>
                        {/* Refresh countdown */}
                        <button
                            onClick={() => {
                                router.reload({ only: ["orders", "stats"] });
                                setCountdown(15);
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                            Refresh {countdown}s
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Kitchen Display" />

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="mb-4 text-6xl">🍽️</div>
                    <h3 className="text-lg font-semibold text-foreground">
                        Tidak ada order aktif
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Order baru akan muncul di sini secara otomatis
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {columns.map((status) => {
                        const cfg = STATUS_CONFIG[status];
                        const col = grouped[status];
                        return (
                            <div key={status}>
                                {/* Column header */}
                                <div
                                    className={`mb-3 flex items-center justify-between rounded-xl px-4 py-2.5 ${cfg.headerColor}`}
                                >
                                    <span className="text-sm font-bold">
                                        {cfg.label}
                                    </span>
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                                        {col.length}
                                    </span>
                                </div>
                                {/* Cards */}
                                <div className="space-y-3">
                                    {col.length === 0 ? (
                                        <div className="rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                                            Tidak ada order
                                        </div>
                                    ) : (
                                        col.map((order) => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                canUpdate={canUpdate}
                                                onStatusChange={
                                                    handleStatusChange
                                                }
                                                updating={updating}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
