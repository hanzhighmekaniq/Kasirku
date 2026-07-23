import { useState } from 'react';
import { Check, Eye, Plus, Printer, Send } from 'lucide-react';
import { fmt } from '../helpers';
import ReceiptModal from '../ReceiptModal';

/**
 * SuccessScreen — shown after payment is complete.
 * Displays transaction summary and offers 4 action buttons:
 * 1. Lihat Struk
 * 2. Cetak Struk (auto-print)
 * 3. Kirim Struk (WhatsApp)
 * 4. Transaksi Baru
 */
export default function SuccessScreen({
    data = {},
    storeName,
    receiptFooter,
    onNewTransaction,
    onSendWa,
    onClose,
}) {
    const [showReceipt, setShowReceipt] = useState(false);
    const [autoPrint, setAutoPrint] = useState(false);

    const now = new Date();
    const time =
        now.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }) +
        ' ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const receiptPayload = data.receipt || {
        saleNo: data.saleNo || '-',
        items: data.items || [],
        subtotal: data.subtotal || data.grandTotal || 0,
        discount: Number(data.discount || 0),
        tax: Number(data.tax || 0),
        totalPromoDisc: Number(data.totalPromoDisc || 0),
        cartPromoDiscount: Number(data.cartPromoDiscount || 0),
        cartPromoName: data.cartPromoName || null,
        grandTotal: data.grandTotal || 0,
        change: data.change || 0,
        payments:
            data.payments && data.payments.length > 0
                ? data.payments
                : [
                      {
                          methodName: data.methodLabel || '?',
                          amount: data.paid || data.grandTotal || 0,
                      },
                  ],
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        tableName: data.tableName || null,
        orderType: data.orderType || 'retail',
        rentalInfo: data.rentalInfo || null,
        hospitalityInfo: data.hospitalityInfo || null,
        parkingInfo: data.parkingInfo || null,
        sessionInfo: data.sessionInfo || null,
        deliveryAddress: data.deliveryAddress || null,
        employeeName: data.employeeName || null,
    };

    const hasPhone = !!receiptPayload.customerPhone;

    const handlePrintClick = () => {
        setAutoPrint(true);
        setShowReceipt(true);
    };

    const handleViewClick = () => {
        setAutoPrint(false);
        setShowReceipt(true);
    };

    const handleSendWaClick = () => {
        if (onSendWa) {
            onSendWa(receiptPayload);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl space-y-6 text-foreground">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                        <Check size={32} className="text-success" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Pembayaran Berhasil</h2>
                    {receiptPayload.saleNo && (
                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                            {receiptPayload.saleNo}
                        </p>
                    )}
                </div>

                {/* Summary Table */}
                <div className="mb-6 space-y-2 border-y border-border py-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tagihan</span>
                        <span className="font-semibold">{fmt(receiptPayload.grandTotal || 0)}</span>
                    </div>
                    {receiptPayload.discount > 0 && (
                        <div className="flex justify-between text-destructive">
                            <span>Diskon</span>
                            <span>-{fmt(receiptPayload.discount)}</span>
                        </div>
                    )}
                    {receiptPayload.tax > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Pajak</span>
                            <span>+{fmt(receiptPayload.tax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Metode</span>
                        <span className="font-semibold">{data.methodLabel || 'Tunai'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dibayar</span>
                        <span className="font-semibold">{fmt(data.paid || receiptPayload.grandTotal)}</span>
                    </div>
                    {data.change > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Kembalian</span>
                            <span className="font-semibold text-success">{fmt(data.change)}</span>
                        </div>
                    )}
                    {data.debtNow > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Kasbon</span>
                            <span className="font-semibold text-destructive">{fmt(data.debtNow)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Waktu</span>
                        <span className="font-semibold">{time}</span>
                    </div>
                </div>

                {/* 2x2 Grid of Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleViewClick}
                        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-semibold text-foreground transition hover:bg-muted"
                    >
                        <Eye size={17} strokeWidth={2} />
                        Lihat Struk
                    </button>

                    <button
                        type="button"
                        onClick={handlePrintClick}
                        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-semibold text-foreground transition hover:bg-muted"
                    >
                        <Printer size={17} strokeWidth={2} />
                        Cetak Struk
                    </button>

                    <button
                        type="button"
                        onClick={handleSendWaClick}
                        className={`flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-semibold transition ${
                            hasPhone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300'
                                : 'bg-card text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        <Send size={17} strokeWidth={2} />
                        {hasPhone ? 'Kirim Struk (WA)' : 'Salin Struk (WA)'}
                    </button>

                    <button
                        type="button"
                        onClick={onNewTransaction}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-md transition hover:bg-primary/90"
                    >
                        <Plus size={17} strokeWidth={2.5} />
                        Transaksi Baru
                    </button>
                </div>
            </div>

            {/* Receipt Modal Portal Overlay */}
            {showReceipt && (
                <ReceiptModal
                    receipt={receiptPayload}
                    storeName={storeName}
                    footer={receiptFooter || 'Terima kasih telah berbelanja'}
                    autoPrint={autoPrint}
                    onClose={() => setShowReceipt(false)}
                    onNewTransaction={onNewTransaction}
                />
            )}
        </div>
    );
}
