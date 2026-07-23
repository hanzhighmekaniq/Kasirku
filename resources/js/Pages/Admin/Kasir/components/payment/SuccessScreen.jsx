import { useState } from 'react';
import { Check, Eye, Plus, Printer, Send } from 'lucide-react';
import { fmt } from '../helpers';
import ReceiptModal from '../ReceiptModal';

/**
 * SuccessScreen — shown after payment is complete.
 * Displays summary then offers 4 actions: View Receipt, Print, Send (placeholder), New Transaction.
 */
export default function SuccessScreen({ data, storeName, receiptFooter, onNewTransaction, onClose }) {
    const [showReceipt, setShowReceipt] = useState(false);

    const now = new Date();
    const time = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const receiptPayload = {
        saleNo: data.saleNo || '-',
        items: data.items || [],
        subtotal: data.grandTotal || 0,
        discount: 0,
        tax: 0,
        totalPromoDisc: 0,
        cartPromoDiscount: 0,
        cartPromoName: null,
        grandTotal: data.grandTotal || 0,
        change: data.change || 0,
        payments: [{
            methodName: data.methodLabel || '?',
            amount: data.paid || data.grandTotal || 0,
        }],
        customerName: null,
        tableName: null,
        orderType: 'retail',
    };

    if (showReceipt) {
        return (
            <ReceiptModal
                receipt={receiptPayload}
                storeName={storeName}
                footer={receiptFooter || 'Terima kasih telah berbelanja'}
                onClose={() => setShowReceipt(false)}
                onNewTransaction={onNewTransaction}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                        <Check size={32} className="text-success" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Pembayaran Berhasil</h2>
                    {data.saleNo && (
                        <p className="mt-1 text-sm text-muted-foreground font-mono">{data.saleNo}</p>
                    )}
                </div>

                <div className="border-y border-border py-4 mb-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold">{fmt(data.grandTotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Metode</span>
                        <span className="font-semibold">{data.methodLabel || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dibayar</span>
                        <span className="font-semibold">{fmt(data.paid || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Waktu</span>
                        <span className="font-semibold">{time}</span>
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
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => setShowReceipt(true)}
                        className="flex flex-col items-center gap-1 rounded-lg border border-border px-2 py-3 text-xs font-medium transition hover:bg-muted">
                        <Eye size={18} strokeWidth={1.8} />
                        Lihat Struk
                    </button>
                    <button onClick={() => setShowReceipt(true)}
                        className="flex flex-col items-center gap-1 rounded-lg border border-border px-2 py-3 text-xs font-medium transition hover:bg-muted">
                        <Printer size={18} strokeWidth={1.8} />
                        Cetak Struk
                    </button>
                    <button className="flex flex-col items-center gap-1 rounded-lg border border-border px-2 py-3 text-xs font-medium transition hover:bg-muted">
                        <Send size={18} strokeWidth={1.8} />
                        Kirim Struk
                    </button>
                    <button onClick={onNewTransaction}
                        className="flex flex-col items-center gap-1 rounded-lg bg-primary px-2 py-3 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90">
                        <Plus size={18} strokeWidth={2} />
                        Transaksi Baru
                    </button>
                </div>
            </div>
        </div>
    );
}
