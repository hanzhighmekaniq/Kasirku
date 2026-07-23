const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

/* ── History panel ───────────────────────────────────── */
export default function HistoryPanel({ sales, onPrint, onClose, loading, onResumeSplit, onCancelSplit }) {
    const STATUS_CLS = {
        completed: "bg-success/10 text-success",
        cancelled: "bg-red-50 text-red-600",
        draft: "bg-muted text-muted-foreground",
        pending: "bg-amber-50 text-amber-700",
    };
    return (
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
                        className="text-muted-foreground/60 hover:text-card-foreground"
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
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
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
                                                        className="hidden group-hover:inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700 transition hover:bg-violet-200"
                                                        title="Lanjutkan Split Bill"
                                                    >
                                                        Lanjutkan
                                                    </button>
                                                    <button
                                                        onClick={() => onCancelSplit?.(s.id)}
                                                        className="hidden group-hover:inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
                                                        title="Batalkan Split Bill"
                                                    >
                                                        Batal
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => onPrint(s.id)}
                                                    className="hidden group-hover:flex items-center gap-1 text-xs text-primary font-medium hover:text-primary"
                                                    title="Cetak Struk"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={2}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v2.796c0 1.18.91 2.164 2.09 2.201a51.964 51.964 0 006.32 0c1.18-.037 2.09-1.022 2.09-2.201V8.706z"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                            {isSplitInProgress ? (
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    isSplitStale
                                                        ? "bg-amber-50 text-amber-700"
                                                        : "bg-violet-50 text-violet-700"
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
    );
}
