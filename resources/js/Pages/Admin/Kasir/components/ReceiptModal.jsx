import * as ReactDOM from "react-dom";
import { fmt, fmtShort } from "./helpers";

export default function ReceiptModal({
    receipt,
    storeName,
    footer,
    onClose,
    onNewTransaction,
}) {
    const receiptContent = (
        <>
            {receipt.isOffline && (
                <div className="-mx-6 -mt-5 mb-4 rounded-t-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-center">
                    <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-white">
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                            />
                        </svg>
                        STRUK SEMENTARA
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-white/80">
                        Akan diganti dengan struk asli setelah sinkron
                    </p>
                </div>
            )}
            <p className="text-center text-sm font-bold text-slate-900">
                {storeName}
            </p>
            <p className="mt-0.5 text-center text-slate-500">
                {receipt.saleNo}
                {receipt.isOffline && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                        TMP
                    </span>
                )}
            </p>
            <p className="text-center text-slate-400">
                {new Date().toLocaleString("id-ID")}
            </p>
            {receipt.tableName && (
                <p className="text-center text-slate-600 font-medium">
                    Meja {receipt.tableName}
                </p>
            )}
            {receipt.takeawayCustomerName && !receipt.deliveryAddress && (
                <p className="text-center text-slate-700 font-medium">
                    {receipt.takeawayCustomerName}
                </p>
            )}
            {receipt.customerName &&
                !receipt.deliveryAddress &&
                !receipt.takeawayCustomerName && (
                    <p className="text-center text-slate-500">
                        Pelanggan: {receipt.customerName}
                    </p>
                )}
            {receipt.employeeName && (
                <p className="text-center text-slate-600">
                    Dikerjakan oleh: <span className="font-medium">{receipt.employeeName}</span>
                </p>
            )}
            {receipt.rentalInfo && (
                <>
                    <p className="text-center text-slate-600">
                        Sewa: <span className="font-medium">{receipt.rentalInfo.duration} {receipt.rentalInfo.unit}</span>
                    </p>
                    <p className="text-center text-slate-500">
                        Kembali: {receipt.rentalInfo.returnDate}
                    </p>
                </>
            )}
            {receipt.hospitalityInfo && (
                <>
                    <div className="my-2 border-t border-dashed border-slate-200" />
                    <p className="text-center font-bold text-slate-800">🏨 INFO MENGINAP</p>
                    {receipt.hospitalityInfo.roomNumber && (
                        <p className="text-center text-slate-600">Kamar: {receipt.hospitalityInfo.roomNumber}</p>
                    )}
                    <p className="text-center text-slate-500">
                        {receipt.hospitalityInfo.duration} {receipt.hospitalityInfo.unitLabel}
                    </p>
                    <p className="text-center text-slate-500">
                        Check-out: {receipt.hospitalityInfo.checkoutDate}
                    </p>
                    {receipt.hospitalityInfo.guestCount > 1 && (
                        <p className="text-center text-slate-400">{receipt.hospitalityInfo.guestCount} tamu</p>
                    )}
                </>
            )}
            {receipt.parkingInfo && (
                <>
                    <div className="my-2 border-t border-dashed border-slate-200" />
                    <p className="text-center font-bold text-slate-800">🅿️ TIKET PARKIR</p>
                    <p className="text-center font-mono text-2xl font-bold tracking-widest text-indigo-700">
                        {receipt.parkingInfo.plateNumber}
                    </p>
                    <p className="text-center text-slate-600">
                        {receipt.parkingInfo.vehicleLabel}
                    </p>
                    <p className="text-center text-slate-500 text-xs">
                        Masuk: {receipt.parkingInfo.entryTime}
                    </p>
                    {receipt.parkingInfo.ticketNo && (
                        <p className="text-center text-slate-400 text-xs">Tiket: {receipt.parkingInfo.ticketNo}</p>
                    )}
                    <p className="text-center text-[10px] text-slate-400 mt-1">
                        Simpan tiket ini untuk keluar
                    </p>
                </>
            )}
            {receipt.sessionInfo && (
                <>
                    <div className="my-2 border-t border-dashed border-slate-200" />
                    <p className="text-center font-bold text-slate-800">🎮 INFO SESI</p>
                    {receipt.sessionInfo.unitName && (
                        <p className="text-center font-mono text-xl font-bold text-indigo-700">{receipt.sessionInfo.unitName}</p>
                    )}
                    <p className="text-center text-slate-500 text-xs">Mulai: {receipt.sessionInfo.startTime}</p>
                    {receipt.sessionInfo.guestCount > 1 && (
                        <p className="text-center text-slate-400 text-xs">{receipt.sessionInfo.guestCount} pengguna</p>
                    )}
                    <p className="text-center text-[10px] text-slate-400 mt-1">
                        {receipt.sessionInfo.orderType === 'prepaid' ? 'Prepaid — bayar di awal' : 'Postpaid — bayar saat selesai'}
                    </p>
                </>
            )}
            {receipt.deliveryAddress && (
                <>
                    {receipt.deliveryCustomerName && (
                        <p className="text-center text-slate-700 font-medium">
                            {receipt.deliveryCustomerName}
                        </p>
                    )}
                    <p className="text-center text-slate-500">
                        {receipt.deliveryAddress.replace(/^Penerima: .*\n/, "")}
                    </p>
                </>
            )}
            <div className="my-3 border-t border-dashed border-slate-300" />

            {receipt.items.map((item, i) => (
                <div key={i} className="mb-1">
                    <div className="flex justify-between">
                        <span className="text-slate-700">
                            {item.name}
                            {item.variantName ? ` (${item.variantName})` : ""}
                        </span>
                        <span className="text-slate-800">
                            {fmt(item.subtotal)}
                        </span>
                    </div>
                    <span className="text-slate-400">
                        {item.qty} × {fmt(item.price)}
                    </span>
                    {item.modifiers?.map((m, j) => (
                        <div key={j} className="text-slate-400 pl-2">
                            {m.name}{" "}
                            {m.price_addition > 0 &&
                                `+${fmtShort(m.price_addition)}`}
                        </div>
                    ))}
                    {(item.promoDiscount ?? 0) > 0 && (
                        <div className="text-emerald-600 text-xs pl-2">
                            Promo {item.promoName}: -{fmt(item.promoDiscount)}
                        </div>
                    )}
                </div>
            ))}

            <div className="my-3 border-t border-dashed border-slate-300" />
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{fmt(receipt.subtotal)}</span>
            </div>
            {(receipt.totalPromoDisc ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                    <span>Diskon Promo</span>
                    <span>-{fmt(receipt.totalPromoDisc)}</span>
                </div>
            )}
            {(receipt.cartPromoDiscount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                    <span>{receipt.cartPromoName || "Diskon Keranjang"}</span>
                    <span>-{fmt(receipt.cartPromoDiscount)}</span>
                </div>
            )}
            {receipt.discount > 0 && (
                <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-{fmt(receipt.discount)}</span>
                </div>
            )}
            {receipt.tax > 0 && (
                <div className="flex justify-between">
                    <span>Pajak</span>
                    <span>{fmt(receipt.tax)}</span>
                </div>
            )}
            {receipt.deliveryFee > 0 && (
                <div className="flex justify-between">
                    <span>Ongkir</span>
                    <span>{fmt(receipt.deliveryFee)}</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 text-sm mt-1">
                <span>Total</span>
                <span>{fmt(receipt.grandTotal)}</span>
            </div>
            {receipt.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                    <span>{p.methodName}</span>
                    <span>{fmt(p.amount)}</span>
                </div>
            ))}
            {receipt.change > 0 && (
                <div className="flex justify-between text-emerald-600">
                    <span>Kembalian</span>
                    <span>{fmt(receipt.change)}</span>
                </div>
            )}

            {receipt.isOffline && (
                <>
                    <div className="my-3 border-t border-dashed border-amber-300" />
                    <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center">
                        <p className="text-[10px] font-medium text-amber-800">
                            Transaksi akan dikirim otomatis saat koneksi
                            kembali.
                        </p>
                        <p className="mt-0.5 text-[9px] text-amber-600">
                            Simpan struk ini sebagai bukti transaksi sementara.
                        </p>
                    </div>
                </>
            )}

            {footer && (
                <>
                    <div className="my-3 border-t border-dashed border-slate-300" />
                    <p className="whitespace-pre-wrap text-center text-slate-500">
                        {footer}
                    </p>
                </>
            )}

            <div className="my-3 border-t border-dashed border-slate-300" />
            <p className="text-center text-slate-400">
                Terima kasih atas kunjungan Anda
            </p>
            <p className="text-center text-[9px] text-slate-300">
                Dicetak: {new Date().toLocaleString("id-ID")}
            </p>
        </>
    );

    return (
        <>
            {/* CSS untuk layar vs print */}
            <style>{`
                @media screen {
                    .print-only-receipt { display: none !important; }
                }
                @media print {
                    /* Sembunyikan semua direct-child body kecuali struk */
                    body > *:not(.print-only-receipt) {
                        display: none !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .print-only-receipt {
                        display: block !important;
                        width: 80mm !important;
                        margin: 0 auto !important;
                        padding: 15px 10px !important;
                        font-family: monospace !important;
                        font-size: 12px !important;
                        color: #1e293b !important;
                        background: white !important;
                    }
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }
                }
            `}</style>

            {/* ─── Tampilan layar — modal ─── */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <div className="relative w-full max-w-xs rounded-2xl bg-white shadow-2xl">
                    <div className="px-6 py-5 font-mono text-xs max-h-[70vh] overflow-y-auto">
                        {receiptContent}
                    </div>

                    <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={onNewTransaction}
                            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                        >
                            Transaksi Baru
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            🖨️ Print
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Tampilan print — Portal langsung ke body agar tidak ada extra space ─── */}
            {ReactDOM.createPortal(
                <div className="print-only-receipt">{receiptContent}</div>,
                document.body,
            )}
        </>
    );
}
