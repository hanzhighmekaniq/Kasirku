import * as ReactDOM from "react-dom";
import { useState } from "react";
import { fmt, fmtShort } from "./helpers";

export default function ReceiptModal({
    receipt,
    storeName,
    footer,
    onClose,
    onNewTransaction,
}) {
    // Split receipt state — jika ada splitPayers, user bisa ganti halaman struk
    const hasSplit = receipt.splitPayers && receipt.splitPayers.length > 0 && receipt.splitReceiptMode === "per_payer";
    const [splitPage, setSplitPage] = useState(0); // 0 = total, 1+ = per payer index

    const receiptContent = (splitPayer = null) => (
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
            <p className="text-center text-sm font-bold text-foreground">
                {storeName}
            </p>
            <p className="mt-0.5 text-center text-muted-foreground">
                {receipt.saleNo}
                {receipt.isOffline && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-warning">
                        TMP
                    </span>
                )}
            </p>
            <p className="text-center text-muted-foreground/60">
                {new Date().toLocaleString("id-ID")}
            </p>
            {receipt.tableName && (
                <p className="text-center text-muted-foreground font-medium">
                    Meja {receipt.tableName}
                </p>
            )}
            {receipt.takeawayCustomerName && !receipt.deliveryAddress && (
                <p className="text-center text-card-foreground font-medium">
                    {receipt.takeawayCustomerName}
                </p>
            )}
            {receipt.customerName &&
                !receipt.deliveryAddress &&
                !receipt.takeawayCustomerName && (
                    <p className="text-center text-muted-foreground">
                        Pelanggan: {receipt.customerName}
                    </p>
                )}
            {receipt.employeeName && (
                <p className="text-center text-muted-foreground">
                    Dikerjakan oleh: <span className="font-medium">{receipt.employeeName}</span>
                </p>
            )}
            {receipt.rentalInfo && (
                <>
                    <p className="text-center text-muted-foreground">
                        Sewa: <span className="font-medium">{receipt.rentalInfo.duration} {receipt.rentalInfo.unit}</span>
                    </p>
                    <p className="text-center text-muted-foreground">
                        Kembali: {receipt.rentalInfo.returnDate}
                    </p>
                </>
            )}
            {receipt.hospitalityInfo && (
                <>
                    <div className="my-2 border-t border-dashed border-border" />
                    <p className="text-center font-bold text-foreground">🏨 INFO MENGINAP</p>
                    {receipt.hospitalityInfo.roomNumber && (
                        <p className="text-center text-muted-foreground">Kamar: {receipt.hospitalityInfo.roomNumber}</p>
                    )}
                    <p className="text-center text-muted-foreground">
                        {receipt.hospitalityInfo.duration} {receipt.hospitalityInfo.unitLabel}
                    </p>
                    <p className="text-center text-muted-foreground">
                        Check-out: {receipt.hospitalityInfo.checkoutDate}
                    </p>
                    {receipt.hospitalityInfo.guestCount > 1 && (
                        <p className="text-center text-muted-foreground/60">{receipt.hospitalityInfo.guestCount} tamu</p>
                    )}
                </>
            )}
            {receipt.parkingInfo && (
                <>
                    <div className="my-2 border-t border-dashed border-border" />
                    <p className="text-center font-bold text-foreground">🅿️ TIKET PARKIR</p>
                    <p className="text-center font-mono text-2xl font-bold tracking-widest text-primary">
                        {receipt.parkingInfo.plateNumber}
                    </p>
                    <p className="text-center text-muted-foreground">
                        {receipt.parkingInfo.vehicleLabel}
                    </p>
                    <p className="text-center text-muted-foreground text-xs">
                        Masuk: {receipt.parkingInfo.entryTime}
                    </p>
                    {receipt.parkingInfo.ticketNo && (
                        <p className="text-center text-muted-foreground/60 text-xs">Tiket: {receipt.parkingInfo.ticketNo}</p>
                    )}
                    <p className="text-center text-[10px] text-muted-foreground/60 mt-1">
                        Simpan tiket ini untuk keluar
                    </p>
                </>
            )}
            {receipt.sessionInfo && (
                <>
                    <div className="my-2 border-t border-dashed border-border" />
                    <p className="text-center font-bold text-foreground">🎮 INFO SESI</p>
                    {receipt.sessionInfo.unitName && (
                        <p className="text-center font-mono text-xl font-bold text-primary">{receipt.sessionInfo.unitName}</p>
                    )}
                    <p className="text-center text-muted-foreground text-xs">Mulai: {receipt.sessionInfo.startTime}</p>
                    {receipt.sessionInfo.guestCount > 1 && (
                        <p className="text-center text-muted-foreground/60 text-xs">{receipt.sessionInfo.guestCount} pengguna</p>
                    )}
                    <p className="text-center text-[10px] text-muted-foreground/60 mt-1">
                        {receipt.sessionInfo.orderType === 'prepaid' ? 'Prepaid — bayar di awal' : 'Postpaid — bayar saat selesai'}
                    </p>
                </>
            )}
            {receipt.deliveryAddress && (
                <>
                    {receipt.deliveryCustomerName && (
                        <p className="text-center text-card-foreground font-medium">
                            {receipt.deliveryCustomerName}
                        </p>
                    )}
                    <p className="text-center text-muted-foreground">
                        {receipt.deliveryAddress.replace(/^Penerima: .*\n/, "")}
                    </p>
                </>
            )}
            <div className="my-3 border-t border-dashed border-slate-300" />

            {receipt.items.map((item, i) => (
                <div key={i} className="mb-1">
                    <div className="flex justify-between">
                        <span className="text-card-foreground">
                            {item.name}
                            {item.variantName ? ` (${item.variantName})` : ""}
                        </span>
                        <span className="text-foreground">
                            {fmt(item.subtotal)}
                        </span>
                    </div>
                    <span className="text-muted-foreground/60">
                        {item.qty} × {fmt(item.price)}
                    </span>
                    {item.modifiers?.map((m, j) => (
                        <div key={j} className="text-muted-foreground/60 pl-2">
                            {m.name}{" "}
                            {m.price_addition > 0 &&
                                `+${fmtShort(m.price_addition)}`}
                        </div>
                    ))}
                    {(item.promoDiscount ?? 0) > 0 && (
                        <div className="text-success text-xs pl-2">
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
                <div className="flex justify-between text-success">
                    <span>Diskon Promo</span>
                    <span>-{fmt(receipt.totalPromoDisc)}</span>
                </div>
            )}
            {(receipt.cartPromoDiscount ?? 0) > 0 && (
                <div className="flex justify-between text-success">
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
            <div className="flex justify-between font-bold text-foreground text-sm mt-1">
                <span>Total</span>
                <span>{fmt(receipt.grandTotal)}</span>
            </div>
            {receipt.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{p.methodName}</span>
                    <span>{fmt(p.amount)}</span>
                </div>
            ))}
            {receipt.change > 0 && (
                <div className="flex justify-between text-success">
                    <span>Kembalian</span>
                    <span>{fmt(receipt.change)}</span>
                </div>
            )}

            {receipt.isOffline && (
                <>
                    <div className="my-3 border-t border-dashed border-amber-300" />
                    <div className="rounded-xl bg-warning/10 px-3 py-2.5 text-center">
                        <p className="text-[10px] font-medium text-amber-800">
                            Transaksi akan dikirim otomatis saat koneksi
                            kembali.
                        </p>
                        <p className="mt-0.5 text-[9px] text-warning">
                            Simpan struk ini sebagai bukti transaksi sementara.
                        </p>
                    </div>
                </>
            )}

            {footer && (
                <>
            <div className="my-3 border-t border-dashed border-slate-300" />
            {/* Split bill summary jika ada */}
            {!splitPayer && receipt.splitPayers && receipt.splitPayers.length > 0 && (
                <>
                    <p className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Split Bill — {receipt.splitPayers.length} Orang
                    </p>
                    {receipt.splitPayers.map((p, i) => {
                        const method = p.methodName || "-";
                        const change = Math.max(0, (Number(p.paid_amount) || Number(p.amount)) - Number(p.amount));
                        return (
                            <div key={i} className="text-[10px] mb-1">
                                <div className="flex justify-between font-semibold text-foreground">
                                    <span>{p.name || `Orang ${i + 1}`}</span>
                                    <span>{fmt(p.amount)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>{method}</span>
                                    {change > 0 && <span>Kembalian {fmt(change)}</span>}
                                </div>
                            </div>
                        );
                    })}
                    <div className="my-2 border-t border-dashed border-slate-300" />
                </>
            )}
            {/* Payer header jika ini struk per orang */}
            {splitPayer && (
                <>
                    <p className="text-center text-[11px] font-bold text-violet-700 mb-0.5">
                        Struk untuk: {splitPayer.name || "Tamu"}
                    </p>
                    <p className="text-center text-[10px] text-muted-foreground mb-2">
                        Tagihan: {fmt(splitPayer.amount)}
                        {splitPayer.methodName ? ` · ${splitPayer.methodName}` : ""}
                    </p>
                    <div className="my-2 border-t border-dashed border-slate-300" />
                </>
            )}
            <div className="my-3 border-t border-dashed border-slate-300" />
                    <p className="whitespace-pre-wrap text-center text-muted-foreground">
                        {footer}
                    </p>
                </>
            )}

            <div className="my-3 border-t border-dashed border-slate-300" />
            <p className="text-center text-muted-foreground/60">
                Terima kasih atas kunjungan Anda
            </p>
            <p className="text-center text-[9px] text-muted-foreground/30">
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
                    className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
                />
                <div className="relative w-full max-w-xs rounded-2xl bg-card shadow-2xl">
                    {/* Split pager — navigasi antar struk per orang */}
                    {hasSplit && (
                        <div className="flex items-center justify-between border-b border-border px-4 py-2">
                            <button type="button"
                                onClick={() => setSplitPage(0)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${splitPage === 0 ? "bg-violet-100 text-violet-700" : "text-muted-foreground hover:bg-muted"}`}>
                                Total
                            </button>
                            <div className="flex items-center gap-1">
                                {receipt.splitPayers.map((p, i) => (
                                    <button key={i} type="button"
                                        onClick={() => setSplitPage(i + 1)}
                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${splitPage === i + 1 ? "bg-violet-100 text-violet-700" : "text-muted-foreground hover:bg-muted"}`}>
                                        {p.name || `#${i + 1}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="px-6 py-5 font-mono text-xs max-h-[70vh] overflow-y-auto">
                        {hasSplit && splitPage > 0
                            ? receiptContent(receipt.splitPayers[splitPage - 1])
                            : receiptContent()}
                    </div>

                    <div className="flex gap-2 border-t border-border px-5 py-4">
                        <button
                            type="button"
                            onClick={onNewTransaction}
                            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:from-indigo-600 hover:to-violet-700"
                        >
                            Transaksi Baru
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/50"
                        >
                            🖨️ Print
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/50"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Tampilan print — Portal langsung ke body agar tidak ada extra space ─── */}
            {ReactDOM.createPortal(
                <div className="print-only-receipt">
                    {hasSplit && splitPage > 0
                        ? receiptContent(receipt.splitPayers[splitPage - 1])
                        : receiptContent()}
                </div>,
                document.body,
            )}
        </>
    );
}
