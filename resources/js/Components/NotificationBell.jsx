import { useState, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import { Bell } from "lucide-react";

export default function NotificationBell() {
    const { auth } = usePage().props;
    const unreadCount = auth?.user?.unreadNotifications ?? 0;
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (open && notifications.length === 0) {
            fetchNotifications();
        }
    }, [open]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch(route("admin.notifications.index") + "?per_page=10");
            const data = await res.json();
            setNotifications(data.notifications?.data ?? []);
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await fetch(route("admin.notifications.read", id), {
                method: "POST",
                headers: { "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content },
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
            );
        } catch (e) {
            console.error("Failed to mark as read", e);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch(route("admin.notifications.read-all"), {
                method: "POST",
                headers: { "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
        } catch (e) {
            console.error("Failed to mark all as read", e);
        }
    };

    const timeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return "Baru saja";
        if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
        return `${Math.floor(diff / 86400)}h lalu`;
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-popover shadow-xl">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <h3 className="text-sm font-semibold text-foreground">Notifikasi</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-primary hover:underline"
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">Memuat...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada notifikasi</div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`border-b border-border/50 px-4 py-3 transition hover:bg-muted/50 ${!n.read_at ? "bg-primary/5" : ""}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read_at ? "bg-primary" : "bg-transparent"}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{n.data?.title ?? "Notifikasi"}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{n.data?.message ?? ""}</p>
                                            <p className="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                                        </div>
                                        {!n.read_at && (
                                            <button
                                                onClick={() => markAsRead(n.id)}
                                                className="shrink-0 text-[10px] text-primary hover:underline"
                                            >
                                                Baca
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-border px-4 py-2 text-center">
                        <Link
                            href={route("admin.notifications.index")}
                            onClick={() => setOpen(false)}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            Lihat Semua Notifikasi
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
