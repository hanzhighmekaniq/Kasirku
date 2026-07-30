import { useState } from "react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { fmt } from "./helpers";

/* ── History panel ───────────────────────────────────── */
export default function HistoryPanel({
    sales,
    paymentMethods = [],
    onPrint,
    onClose,
    loading,
    onResumeSplit,
    onCancelSplit,
    onVoid,
    onUpdatePayment,
    paymentEditLimitMinutes = null,
    paymentEditLimitLabel = null,
}) {
    const [changePaymentSaleId, setChangePaymentSaleId] = useState(null);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Metode pembayaran hanya bisa diganti selama masih dalam batas waktu yang
     * diatur di Pengaturan Toko. null = tidak ada batas waktu.
     */
    const canChangePayment = (sale) => {
        if (paymentEditLimitMinutes === null) {
            return true;
        }

        // Pakai created_at supaya perhitungan di layar sama dengan validasi
        // server. Kalau tidak ada, biarkan server yang memutuskan.
        const createdAt = sale.created_at;
        if (!createdAt) {
            return true;
        }

        const deadline =
            new Date(createdAt).getTime() + paymentEditLimitMinutes * 60_000;

        return Date.now() < deadline;
    };
    const STATUS_CLS = {
        completed: "bg-success/10 text-success",
        cancelled: "bg-destructive/10 text-destructive",
        draft: "bg-muted text-muted-foreground",
        pending: "bg-warning/10 text-warning",
    };
    return (
        <>
        <div className="fixed inset-0 z-40 flex justify-end">
            <div
                onClick={onClose}
                className="flex-1 bg-primary/40 backdrop-blur-sm"
            />
            <div className="w-full max-w-sm bg-card shadow-2xl flex flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h3 className="font-semibold text-foreground">
                        Riwayat Hari Ini
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground/60 hover:text-foreground"
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
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {sales.length === 0 ? (
                        <div className="flex flex-col items-center py-12 text-center">
                            <p className="text-sm text-muted-foreground/60">
                                Belum ada transaksi hari ini.
                            </p>
                        </div>
                    ) : (
                        sales.map((s) => {
                            const isSplitInProgress = s.split_status === "in_progress";
                            const isSplitStale = s.is_split_stale;
                            const paidCount = s.split_payers?.filter((p) => p.status === "paid").length ?? 0;
                            const totalCount = s.split_payers?.length ?? 0;

                            return (
                                <div
                                    key={s.id}
                                    className={`px-5 py-3 group hover:bg-muted transition-colors ${isSplitInProgress ? "border-l-4 border-l-violet-400" : ""}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-semibold text-primary">
                                            {s.sale_no}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {isSplitInProgress ? (
                                                <>
                                                    <button
                                                        onClick={() => onResumeSplit?.(s.id)}
                                                        className="hidden group-hover:inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700 transition hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400"
                                                        title="Lanjutkan Split Bill"
                                                    >
                                                        Lanjutkan
                                                    </button>
                                                    <button
                                                        onClick={() => onCancelSplit?.(s.id)}
                                                        className="hidden group-hover:inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-[11px] font-bold text-destructive transition hover:bg-destructive/20"
                                                        title="Batalkan Split Bill"
                                                    >
                                                        Batal
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => onPrint(s.id)}
                                                        className="hidden group-hover:flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                        title="Cetak Struk"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v2.796c0 1.18.91 2.164 2.09 2.201a51.964 51.964 0 006.32 0c1.18-.037 2.09-1.022 2.09-2.201V8.706z" />
                                                        </svg>
                                                    </button>
                                                    
                                                    {s.status === 'completed' && (
                                                        <>
                                                            {canChangePayment(s) && (
                                                            <button
                                                                onClick={() => setChangePaymentSaleId(s.id)}
                                                                className="hidden group-hover:flex items-center justify-center size-7 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                                title="Ganti Metode Pembayaran"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                                                </svg>
                                                            </button>
                                                            )}
                                                            
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`Yakin ingin membatalkan (void) transaksi ${s.sale_no}? Stok akan dikembalikan.`)) {
                                                                        onVoid(s.id);
                                                                    }
                                                                }}
                                                                className="hidden group-hover:flex items-center justify-center size-7 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                                                title="Batalkan (Void)"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            {isSplitInProgress ? (
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    isSplitStale
                                                        ? "bg-warning/10 text-warning"
                                                        : "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                                                }`}>
                                                    {isSplitStale ? "⏰" : "🧾"}
                                                    Split {paidCount}/{totalCount}
                                                </span>
                                            ) : (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[s.status] ?? STATUS_CLS.draft}`}
                                                >
                                                    {s.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-sm text-muted-foreground">
                                            {s.customer?.name ?? "Umum"}
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {fmt(s.grand_total)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground/60">
                                        {new Date(s.sale_date).toLocaleTimeString(
                                            "id-ID",
                                            { hour: "2-digit", minute: "2-digit" },
                                        )}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            </div>
            
            {/* Modal Ubah Pembayaran */}
            <Modal
                show={!!changePaymentSaleId}
                onClose={() => {
                    setChangePaymentSaleId(null);
                    setSelectedPaymentMethodId("");
                }}
                maxWidth="sm"
            >
                <div className="p-6">
                    <h2 className="text-lg font-medium text-foreground">
                        Ganti Metode Pembayaran
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-muted-foreground">
                        {paymentEditLimitLabel
                            ? `Hanya bisa diganti dalam ${paymentEditLimitLabel} setelah transaksi.`
                            : "Total transaksi tidak berubah, hanya metode pembayarannya."}
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Pilih metode pembayaran baru
                            </label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {paymentMethods.map(pm => (
                                    <label key={pm.id} className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-muted transition-colors">
                                        <input 
                                            type="radio" 
                                            name="payment_method" 
                                            value={pm.id}
                                            checked={String(selectedPaymentMethodId) === String(pm.id)}
                                            onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-foreground">{pm.name}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <SecondaryButton onClick={() => setChangePaymentSaleId(null)}>
                                Batal
                            </SecondaryButton>
                            <PrimaryButton 
                                disabled={!selectedPaymentMethodId || isSubmitting}
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    await onUpdatePayment(changePaymentSaleId, selectedPaymentMethodId);
                                    setIsSubmitting(false);
                                    setChangePaymentSaleId(null);
                                    setSelectedPaymentMethodId("");
                                }}
                            >
                                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
