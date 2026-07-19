import { Layers, Play, Trash2, TriangleAlert, ShoppingCart } from "lucide-react";
import PosModal from "../ui/PosModal";

/**
 * HeldTransactionsModal — daftar transaksi yang ditahan (localStorage).
 * Kasir bisa melanjutkan (resume) atau menghapusnya.
 */
export default function HeldTransactionsModal({ show, onClose, k }) {
    const held = k.heldTransactions || [];

    const orderLabel = (v) =>
        k.orderOpts.find((o) => o.v === v)?.l || v || "Transaksi";

    const timeLabel = (iso) => {
        try {
            const d = new Date(iso);
            const today = new Date();
            const sameDay = d.toDateString() === today.toDateString();
            const t = d.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            });
            return sameDay
                ? `Hari ini ${t}`
                : `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} ${t}`;
        } catch {
            return "";
        }
    };

    const resume = (item) => {
        k.resumeHeldTransaction(item);
        onClose();
    };

    return (
        <PosModal
            show={show}
            onClose={onClose}
            icon={Layers}
            title="Transaksi Ditahan"
            subtitle={held.length ? `${held.length} transaksi tersimpan` : "Belum ada transaksi ditahan"}
            maxWidth="md"
            bodyClass="!px-0 !py-0"
        >
            {k.cart.length > 0 && held.length > 0 && (
                <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50/70 px-5 py-2.5 text-[11px] font-medium text-amber-700">
                    <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                    <span>
                        Keranjang aktif akan tergantikan saat melanjutkan. Tahan
                        dulu bila belum selesai.
                    </span>
                </div>
            )}

            <div className="max-h-[52vh] overflow-y-auto p-2">
                {held.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <div className="mb-3 rounded-2xl bg-slate-100 p-4">
                            <ShoppingCart size={32} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">
                            Belum ada transaksi ditahan
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Tekan tombol "Tahan" untuk menyimpan transaksi
                            sementara.
                        </p>
                    </div>
                ) : (
                    held.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        {item.label || "Pelanggan Umum"}
                                    </p>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                        {orderLabel(item.orderType)}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    {item.itemCount} item · {k.fmt(item.total)} ·{" "}
                                    {timeLabel(item.heldAt)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => resume(item)}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                            >
                                <Play size={13} />
                                Lanjutkan
                            </button>
                            <button
                                type="button"
                                onClick={() => k.deleteHeldTransaction(item.id)}
                                aria-label="Hapus transaksi ditahan"
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </PosModal>
    );
}
