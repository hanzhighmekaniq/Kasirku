import { useEffect, useState } from "react";
import {
    getQueueCounts,
    getFailed,
    retryFailed,
} from "@/Services/mutationQueue";

export default function SyncBadge() {
    const [pendingCount, setPendingCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showModal, setShowModal] = useState(false);
    const [failedList, setFailedList] = useState([]);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        // Polling setiap 5 detik untuk cek antrian
        let mounted = true;
        const poll = async () => {
            try {
                const counts = await getQueueCounts();
                if (mounted) {
                    setPendingCount(counts.pending);
                    setFailedCount(counts.failed);
                }
            } catch {
                // IndexedDB might not be available yet
            }
        };

        // Initial check
        poll();

        const interval = setInterval(poll, 5000);

        // Listen to online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            mounted = false;
            clearInterval(interval);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const openModal = async () => {
        try {
            const failed = await getFailed();
            setFailedList(failed);
        } catch {
            setFailedList([]);
        }
        setShowModal(true);
    };

    const handleRetry = async () => {
        setRetrying(true);
        try {
            const count = await retryFailed();
            if (count > 0) {
                // Trigger processQueue via event — setupAutoReplay will catch it
                window.dispatchEvent(new Event("online"));
                alert(`${count} transaksi gagal akan dicoba ulang.`);
            }
            const counts = await getQueueCounts();
            setPendingCount(counts.pending);
            setFailedCount(counts.failed);
            setFailedList([]);
        } catch (e) {
            alert("Gagal meretry: " + e.message);
        } finally {
            setRetrying(false);
        }
        setShowModal(false);
    };

    const total = pendingCount + failedCount;
    if (total === 0) return null;

    return (
        <>
            {/* Floating badge — click to open details */}
            <button
                onClick={openModal}
                className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg transition-all hover:shadow-xl active:scale-95 ${
                    failedCount > 0
                        ? "bg-red-500 text-white"
                        : isOnline
                          ? "bg-amber-500 text-white"
                          : "bg-slate-600 text-white"
                }`}
            >
                <span className="text-sm">
                    {failedCount > 0 ? "⚠️" : isOnline ? "⏳" : "⏹️"}
                </span>
                <span className="text-xs font-semibold">{total} transaksi</span>
                {failedCount > 0 && (
                    <span className="rounded-full bg-white/30 px-1.5 py-0.5 text-[10px] font-bold">
                        {failedCount} gagal
                    </span>
                )}
            </button>

            {/* Modal detail antrian */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
                    <div
                        onClick={() => setShowModal(false)}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <div className="relative w-full max-w-sm rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h3 className="font-semibold text-slate-900">
                                Antrian Sinkronisasi
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-700"
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="px-5 py-4 space-y-4">
                            {/* Status summary */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
                                    <p className="text-2xl font-bold text-amber-700">
                                        {pendingCount}
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        Menunggu
                                    </p>
                                </div>
                                <div className="rounded-xl bg-red-50 px-4 py-3 text-center">
                                    <p className="text-2xl font-bold text-red-700">
                                        {failedCount}
                                    </p>
                                    <p className="text-xs text-red-600">
                                        Gagal
                                    </p>
                                </div>
                            </div>

                            {/* Failed list */}
                            {failedList.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Transaksi Gagal
                                    </p>
                                    <div className="max-h-48 space-y-2 overflow-y-auto">
                                        {failedList.map((m) => (
                                            <div
                                                key={m.id}
                                                className="rounded-xl border border-red-100 bg-red-50/50 px-3 py-2.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {m.type === "sale"
                                                            ? "Penjualan"
                                                            : m.type}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(
                                                            m.created_at,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </span>
                                                </div>
                                                {m.error && (
                                                    <p className="mt-0.5 text-xs text-red-600">
                                                        {m.error}
                                                    </p>
                                                )}
                                                {m.meta?.items && (
                                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                                        {m.meta.items
                                                            .map(
                                                                (i) =>
                                                                    `${i.name} × ${i.qty}`,
                                                            )
                                                            .join(", ")}
                                                    </p>
                                                )}
                                                {m.meta?.grandTotal && (
                                                    <p className="text-[10px] font-medium text-slate-600">
                                                        Rp{" "}
                                                        {Number(
                                                            m.meta.grandTotal,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {failedList.length === 0 && pendingCount > 0 && (
                                <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-700">
                                    {isOnline
                                        ? "Transaksi sedang disinkronkan secara otomatis..."
                                        : "Menunggu koneksi internet untuk mengirim transaksi..."}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="border-t border-slate-100 px-5 py-4">
                            {failedCount > 0 && (
                                <button
                                    type="button"
                                    disabled={retrying}
                                    onClick={handleRetry}
                                    className="w-full rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:from-red-600 hover:to-rose-700 disabled:opacity-50"
                                >
                                    {retrying
                                        ? "Menyiapkan ulang..."
                                        : `Coba Kirim Ulang (${failedCount} transaksi)`}
                                </button>
                            )}
                            {pendingCount > 0 && failedCount === 0 && (
                                <p className="text-center text-xs text-slate-400">
                                    {isOnline
                                        ? "Sinkronisasi otomatis sedang berjalan..."
                                        : "Sambungkan ke internet untuk sinkronisasi otomatis."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
