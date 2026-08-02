import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from "@inertiajs/react";
import Button from "@/Components/ui/Button";
import { Bell, CheckCheck } from "lucide-react";

export default function Index({ notifications, unreadCount, filter }) {
    const timeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return "Baru saja";
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        return `${Math.floor(diff / 86400)} hari lalu`;
    };

    const markAsRead = (id) => {
        router.post(route("admin.notifications.read", id), {}, { preserveScroll: true });
    };

    const markAllRead = () => {
        router.post(route("admin.notifications.read-all"), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Notifikasi" />

            <PageHeader
                title="Notifikasi"
                breadcrumbs={[{ label: "Notifikasi" }]}
                heading="Notifikasi"
                description="Pemberitahuan penting seperti stok menipis dan produk kadaluarsa."
                action={
                    unreadCount > 0 ? (
                        <Button variant="outline" size="sm" onClick={markAllRead}>
                            <CheckCheck className="mr-2 h-4 w-4" /> Tandai Semua Dibaca
                        </Button>
                    ) : null
                }
            />

            <div className="mb-6 flex gap-2">
                <Link
                    href={route("admin.notifications.index", { filter: "all" })}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                    Semua
                </Link>
                <Link
                    href={route("admin.notifications.index", { filter: "unread" })}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === "unread" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                    Belum Dibaca {unreadCount > 0 && `(${unreadCount})`}
                </Link>
            </div>

            <div className="rounded-xl border border-border bg-card">
                {notifications.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Bell className="mb-4 h-12 w-12 opacity-30" />
                        <p className="text-sm">Tidak ada notifikasi</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {notifications.data.map((n) => (
                            <div
                                key={n.id}
                                className={`flex items-start gap-4 px-6 py-4 transition hover:bg-muted/50 ${!n.read_at ? "bg-primary/5" : ""}`}
                            >
                                <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${!n.read_at ? "bg-primary" : "border border-border"}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-foreground">{n.data?.title ?? "Notifikasi"}</h3>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium
                                            ${n.data?.type === 'low_stock' ? 'bg-warning/10 text-warning' : 
                                              n.data?.type === 'expiry_alert' ? 'bg-destructive/10 text-destructive' : 
                                              'bg-muted text-muted-foreground'}`}
                                        >
                                            {n.data?.type === 'low_stock' ? 'Stok' : n.data?.type === 'expiry_alert' ? 'Kadaluarsa' : 'Info'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{n.data?.message ?? ""}</p>
                                    {n.data?.products && (
                                        <div className="mt-2 space-y-1">
                                            {n.data.products.slice(0, 3).map((p, i) => (
                                                <p key={i} className="text-xs text-muted-foreground">
                                                    <span className="font-medium text-foreground">{p.name}</span>: {p.current_stock}/{p.stock_minimum}
                                                </p>
                                            ))}
                                            {n.data.total_count > 3 && (
                                                <p className="text-xs text-muted-foreground">+{n.data.total_count - 3} lainnya</p>
                                            )}
                                        </div>
                                    )}
                                    <p className="mt-2 text-[11px] text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!n.read_at && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                                        >
                                            Tandai Dibaca
                                        </button>
                                    )}
                                    {n.data?.url && (
                                        <Link
                                            href={n.data.url}
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                                        >
                                            Lihat
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {notifications.data.length > 0 && notifications.links && (
                <div className="mt-4 flex justify-center gap-2">
                    {notifications.links.map((link, i) => (
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${link.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={i}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground/40"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        )
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
