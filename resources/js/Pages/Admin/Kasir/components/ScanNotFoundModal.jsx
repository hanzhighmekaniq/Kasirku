/**
 * Modal notifikasi — muncul saat barcode yang di-scan tidak cocok dengan
 * produk, variant, atau packaging unit manapun. Menggantikan alert()
 * browser bawaan agar tampilannya konsisten dengan modal lain di Kasir.
 */
export default function ScanNotFoundModal({ barcode = "", onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-sm rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h3 className="font-semibold text-foreground">Produk Tidak Ditemukan</h3>
                    <button onClick={onClose} className="text-muted-foreground/60 hover:text-foreground">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col items-center px-5 py-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-2xl">
                        <svg className="h-7 w-7 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <p className="text-sm font-semibold text-foreground">
                        Barcode tidak dikenali
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Tidak ada produk, varian, atau kemasan dengan barcode berikut.
                    </p>

                    <div className="mt-4 w-full rounded-xl bg-muted px-4 py-3">
                        <p className="font-mono text-sm font-bold text-foreground">{barcode || "-"}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                    >
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    );
}
