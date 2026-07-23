import { useEffect, useState, useCallback } from 'react';
import {
    ArrowLeft,
    Clock,
    CreditCard,
    NotebookTabs,
    Split,
    User,
    Wallet,
} from 'lucide-react';
import LangsungPanel from './payment/LangsungPanel';
import KasbonPanel from './payment/KasbonPanel';
import GatewayPanel from './payment/GatewayPanel';
import SplitView from './payment/SplitView';
import SuccessScreen from './payment/SuccessScreen';
import { fmt, findPgPaymentMethod } from './helpers';

/**
 * PaymentView — full-screen payment takeover (not a modal).
 * Renders when k.showPayment is true, replacing the entire POS viewport.
 * PG transactions (QRIS/VA/E-Wallet) are handled inline in GatewayPanel
 * instead of through a separate modal.
 */
export default function PaymentView({ k, paymentMethods, pgMethods, storeName, receiptFooter }) {
    const {
        cart, grandTotal, roundedGrandTotal, roundingAdjustment,
        showPayment, setShowPayment,
        selectedCustomer, customers, setSelectedCustomer,
        handleStartSale, handleFinalizePayment, handleCancelPendingSale,
        handleStartPg, handleRetryPg, handlePgSuccess: onPgPaidFromKasir,
        // Rounding
        cashRoundingEnabled, cashRoundingNearest, cashRoundingMode,
        roundingOverrideMode, setRoundingOverrideMode,
        roundingCustomValue, setRoundingCustomValue,
        // Split
        handleSplitStart, handleSplitPayOffline, handleSplitCreatePg,
    } = k;

    const displayTotal = roundedGrandTotal ?? grandTotal;

    // ── State ──
    const [mainTab, setMainTab] = useState('langsung'); // langsung | kasbon | gateway
    const [saleId, setSaleId] = useState(null);
    const [saleNo, setSaleNo] = useState(null);
    const [splitMode, setSplitMode] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    // PG transaction active in the GatewayPanel — null when grid is shown
    const [activePgTrx, setActivePgTrx] = useState(null);

    // Pre-create Sale on mount
    useEffect(() => {
        if (!showPayment) return;
        startSale();
    }, [showPayment]);

    const startSale = async () => {
        setIsStarting(true);
        try {
            const result = await handleStartSale();
            if (result?.success) {
                setSaleId(result.sale_id);
                setSaleNo(result.sale_no);
            }
        } finally {
            setIsStarting(false);
        }
    };

    const handleBack = async () => {
        if (saleId && !successData && !activePgTrx) {
            await handleCancelPendingSale(saleId);
        }
        setShowPayment(false);
    };

    const handleMethodPay = useCallback(async (payments, methodLabel, extra = {}) => {
        if (!saleId) return { success: false, message: 'Transaksi belum siap.' };
        const result = await handleFinalizePayment(saleId, payments, {
            ...extra,
            paymentMethodLabel: methodLabel,
            customer_id: selectedCustomer,
        });
        if (result?.success) {
            if (result.is_pg && result.pgTransaction) {
                const pg = result.pgTransaction;
                // Validasi minimal: pastikan ada data pembayaran yang bisa ditampilkan.
                // Kalau tidak ada (charge gagal total), tampilkan error.
                // Izinkan status pending/unknown/checking tanpa QR data —
                // ini bisa terjadi saat reconcile setelah 5xx. GatewayPanel
                // akan tampilkan "Menyiapkan data pembayaran..." dan polling
                // akan fetch data dari Status API.
                const canWaitWithoutData = pg.initialStatus === 'pending'
                    || pg.initialStatus === 'unknown'
                    || pg.initialStatus === 'checking'
                    || pg.canRetry;
                if (!pg.qrCode && !pg.qrImageUrl && !pg.vaNumber && !pg.paymentUrl && !canWaitWithoutData) {
                    alert('Gagal mendapatkan data pembayaran dari penyedia. Silakan coba lagi.');
                    return { success: false, message: 'Data pembayaran tidak tersedia.' };
                }
                setActivePgTrx(pg);
                return result;
            }
            setSuccessData({
                methodLabel,
                grandTotal: displayTotal,
                paid: payments.reduce((s, p) => s + Number(p.amount), 0),
                change: result.change ?? 0,
                debtNow: extra.debtNow ?? 0,
                saleNo,
                receipt: result.receipt,
            });
        }
        return result;
    }, [saleId, saleNo, displayTotal, selectedCustomer]);

    const handleKasbon = useCallback(async (type, amount, dueDate, note, subPayments) => {
        if (!saleId) return;
        const payments = subPayments?.length ? subPayments : [{
            method_id: paymentMethods.find(m => m.type === 'debt')?.id,
            amount: amount || displayTotal,
            is_pg: false,
            is_split: false,
        }];
        return handleMethodPay(payments, type === 'full' ? 'Kasbon Full' : 'Kasbon Sebagian', {
            debtNow: amount || displayTotal,
            kasbon_due_date: dueDate,
            kasbon_note: note,
        });
    }, [saleId, displayTotal, paymentMethods, handleMethodPay]);

    const handleGateway = useCallback(async (provider, paymentType) => {
        const matchedMethod = findPgPaymentMethod(paymentType, paymentMethods);
        console.log('[PG] handleGateway:', { provider, paymentType, matchedMethodId: matchedMethod?.id, fallbackId: paymentMethods[0]?.id });
        return handleMethodPay([{
            method_id: matchedMethod?.id ?? paymentMethods[0]?.id,
            amount: displayTotal,
            is_pg: true,
            pg_provider: provider,
            pg_method: paymentType,
        }], `PG · ${paymentType}`);
    }, [displayTotal, paymentMethods, handleMethodPay]);

    const onGatewayPaid = useCallback((pgResult) => {
        const pg = activePgTrx;
        // Build receipt and notify useKasir to clear cart, update history, etc.
        onPgPaidFromKasir(pg);
        setSuccessData({
            methodLabel: `PG · ${pg?.paymentType}`,
            grandTotal: displayTotal,
            paid: pg?.amount ?? displayTotal,
            change: 0,
            debtNow: 0,
            saleNo,
            receipt: null,
        });
        setActivePgTrx(null);
    }, [activePgTrx, displayTotal, saleNo, onPgPaidFromKasir]);

    const handleSplitDone = useCallback((data) => {
        setSuccessData(data);
        setSplitMode(false);
    }, []);

    // ── Render ──
    if (!showPayment) return null;

    if (successData) {
        return (
            <SuccessScreen
                data={successData}
                storeName={storeName || 'Toko'}
                receiptFooter={receiptFooter}
                onNewTransaction={() => {
                    setShowPayment(false);
                    setSuccessData(null);
                    setSaleId(null);
                    setSaleNo(null);
                }}
                onClose={() => {
                    setShowPayment(false);
                    setSuccessData(null);
                }}
            />
        );
    }

    const tabs = [
        { key: 'langsung', label: 'Langsung / Manual', icon: Wallet },
        { key: 'kasbon', label: 'Hutang / Kasbon', icon: NotebookTabs },
        { key: 'gateway', label: 'Payment Gateway', icon: CreditCard },
    ];

    const totalItems = cart.reduce((s, it) => s + Number(it.qty || 1), 0);

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-background">
            {/* HEADER */}
            <header className="shrink-0 border-b border-border bg-card">
                <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 h-14">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            disabled={isStarting}
                            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft size={18} strokeWidth={2} />
                            Kembali
                        </button>
                        {!isStarting && saleNo && (
                            <>
                                <div className="h-6 w-px bg-border" />
                                <div className="flex items-baseline gap-2">
                                    <h1 className="text-base font-semibold text-foreground">Pembayaran</h1>
                                    <span className="text-sm text-muted-foreground font-mono">{saleNo}</span>
                                </div>
                            </>
                        )}
                        {isStarting && (
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                Memproses...
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-5 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User size={14} />
                            <span className="font-medium text-foreground">Kasir</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock size={14} />
                            <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-5 pb-3">
                    <div className="inline-flex rounded-lg overflow-hidden border border-border" role="tablist">
                        {tabs.map(tab => {
                            const active = mainTab === tab.key;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => !splitMode && setMainTab(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
                                        active
                                            ? 'bg-primary/10 text-primary border-primary'
                                            : 'bg-card text-muted-foreground border-border hover:text-foreground'
                                    } ${!splitMode ? '' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                    <Icon size={15} strokeWidth={2} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setSplitMode(!splitMode)}
                        className={`ml-auto inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            splitMode
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card text-foreground hover:bg-muted'
                        }`}
                    >
                        <Split size={15} strokeWidth={2} />
                        {splitMode ? 'Tutup Pisah' : 'Pisah Pembayaran'}
                    </button>
                </div>
            </header>

            {/* MAIN */}
            <main className="flex-1 overflow-hidden">
                <div className="mx-auto flex h-full max-w-[1600px] gap-4 px-5 py-4">
                    {/* LEFT — Order Detail */}
                    <section className="flex w-7/12 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
                        <div className="shrink-0 border-b border-border px-5 py-3.5">
                            <h2 className="font-semibold text-foreground">Detail Pesanan</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {saleNo} · {totalItems} item
                                {selectedCustomer ? ` · ${customers.find(c => String(c.id) === String(selectedCustomer))?.name ?? 'Umum'}` : ' · Umum'}
                            </p>
                        </div>
                        <div className="flex-1 overflow-auto px-5">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
                                    <tr className="border-b border-border">
                                        <th className="py-2.5 text-left font-medium">Produk</th>
                                        <th className="py-2.5 text-center font-medium w-16">Qty</th>
                                        <th className="py-2.5 text-right font-medium w-24">Harga</th>
                                        <th className="py-2.5 text-right font-medium w-24">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item) => (
                                        <tr key={item.cartId} className="border-b border-border last:border-0">
                                            <td className="py-2.5">
                                                <div className="font-medium">{item.name}</div>
                                                {item.variantName && (
                                                    <div className="text-xs text-muted-foreground">{item.variantName}</div>
                                                )}
                                            </td>
                                            <td className="py-2.5 text-center text-muted-foreground">{item.qty}</td>
                                            <td className="py-2.5 text-right text-muted-foreground">{fmt(item.price)}</td>
                                            <td className="py-2.5 text-right font-medium">{fmt(item.price * item.qty)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="shrink-0 border-t border-border px-5 py-3.5 space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{fmt(grandTotal - roundingAdjustment)}</span>
                            </div>
                            {roundingAdjustment !== 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pembulatan</span>
                                    <span className="text-success">
                                        {roundingAdjustment > 0 ? '+' : ''}{fmt(roundingAdjustment)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-border pt-2 flex items-baseline justify-between">
                                <span className="text-sm font-medium text-muted-foreground">TOTAL</span>
                                <span className="text-3xl font-bold tracking-tight">{fmt(displayTotal)}</span>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT — Dynamic Panel */}
                    <aside className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
                        {splitMode ? (
                            <SplitView
                                k={k}
                                paymentMethods={paymentMethods}
                                pgMethods={pgMethods}
                                saleId={saleId}
                                saleNo={saleNo}
                                displayTotal={displayTotal}
                                onDone={handleSplitDone}
                            />
                        ) : mainTab === 'langsung' ? (
                            <LangsungPanel
                                paymentMethods={paymentMethods}
                                displayTotal={displayTotal}
                                grandTotal={grandTotal}
                                roundingAdjustment={roundingAdjustment}
                                cashRoundingEnabled={cashRoundingEnabled}
                                cashRoundingNearest={cashRoundingNearest}
                                cashRoundingMode={cashRoundingMode}
                                roundingOverrideMode={roundingOverrideMode}
                                setRoundingOverrideMode={setRoundingOverrideMode}
                                roundingCustomValue={roundingCustomValue}
                                setRoundingCustomValue={setRoundingCustomValue}
                                onPay={(payments) => handleMethodPay(payments, 'Langsung')}
                            />
                        ) : mainTab === 'kasbon' ? (
                            <KasbonPanel
                                paymentMethods={paymentMethods}
                                pgMethods={pgMethods}
                                displayTotal={displayTotal}
                                grandTotal={grandTotal}
                                selectedCustomer={selectedCustomer}
                                customers={customers}
                                onSelectCustomer={setSelectedCustomer}
                                onPay={handleKasbon}
                                onBack={() => setMainTab('langsung')}
                            />
                        ) : (
                            <GatewayPanel
                                pgMethods={pgMethods}
                                displayTotal={displayTotal}
                                onPay={handleGateway}
                                pgTransaction={activePgTrx}
                                onPgSuccess={onGatewayPaid}
                                onRetryPg={handleRetryPg}
                            />
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}
