/**
 * Modal peringatan stok — muncul saat produk yang diminta (qty di keranjang
 * + tambahan) melebihi stok yang tersedia. Menggantikan alert() browser
 * bawaan agar tampilannya konsisten dengan modal lain di Kasir (Variant,
 * Unit, Modifier).
 */
export default function StockAlertModal({ productName, available = 0, requested = 0, onClose }) {
    const isEmpty = available <= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-sm rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">Stok Tidak Cukup</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col items-center px-5 py-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                        <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zM12 15.75h.008" />
                        </svg>
                    </div>

                    <p className="text-sm font-semibold text-slate-900">
                        {isEmpty
                            ? `Stok "${productName}" habis di keranjang`
                            : `Stok "${productName}" tidak cukup`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {isEmpty
                            ? "Seluruh stok produk ini sudah masuk ke keranjang."
                            : "Jumlah yang diminta melebihi stok yang tersedia."}
                    </p>

                    {/* Detail angka */}
                    <div className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                        <div className="flex-1 text-center">
                            <p className="text-[10.5px] uppercase tracking-wide text-slate-400">Tersedia</p>
                            <p className="mt-0.5 font-bold text-slate-800">{available}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-200" />
                        <div className="flex-1 text-center">
                            <p className="text-[10.5px] uppercase tracking-wide text-slate-400">Diminta</p>
                            <p className="mt-0.5 font-bold text-red-600">{requested}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    );
}
