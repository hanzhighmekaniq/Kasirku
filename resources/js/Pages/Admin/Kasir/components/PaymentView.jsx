import { useEffect, useState, useCallback } from 'react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Clock,
    CreditCard,
    NotebookTabs,
    ShoppingBag,
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
import { playPaymentSuccess } from '@/Hooks/useSound';

/**
 * PaymentView — full-screen payment takeover (not a modal).
 * Renders when k.showPayment is true, replacing the entire POS viewport.
 * PG transactions (QRIS/VA/E-Wallet) are handled inline in GatewayPanel
 * instead of through a separate modal.
 */
export default function PaymentView({
    k,
    paymentMethods,
    pgMethods,
    storeName,
    receiptFooter,
    initialSaleId = null,
    initialSaleNo = null,
    initialPgTransaction = null,
}) {
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
    const [mainTab, setMainTab] = useState(initialPgTransaction ? 'gateway' : 'langsung'); // langsung | kasbon | gateway
    const [saleId, setSaleId] = useState(initialSaleId || null);
    const [saleNo, setSaleNo] = useState(initialSaleNo || null);
    const [splitMode, setSplitMode] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [showMobileOrder, setShowMobileOrder] = useState(false);
    // PG transaction active in the GatewayPanel — null when grid is shown
    const [activePgTrx, setActivePgTrx] = useState(initialPgTransaction || null);

    // Pre-create Sale on mount
    useEffect(() => {
        if (!showPayment) return;
        if (k.successData || successData) return;
        if (saleId) return; // SKIP: sale already exists from refresh restore
        if (!cart || cart.length === 0) return;
        startSale();
    }, [showPayment, k.successData, successData, cart, saleId]);

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

    const [isFinalizing, setIsFinalizing] = useState(false);

    const handleMethodPay = useCallback(async (payments, methodLabel, extra = {}) => {
        if (!saleId || isFinalizing) return { success: false, message: 'Transaksi sedang dipproses.' };
        setIsFinalizing(true);
        try {
            const result = await handleFinalizePayment(saleId, payments, {
                ...extra,
                paymentMethodLabel: methodLabel,
                customer_id: selectedCustomer,
            });
            if (result?.success) {
                if (result.is_pg && result.pgTransaction) {
                    const pg = result.pgTransaction;
                    // Validasi minimal: pastikan ada data pembayaran yang bisa ditampilkan.
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
                const builtReceipt = result.receipt || {
                    saleNo,
                    items: (k.cart || []).map(c => ({
                        name: c.name,
                        variantName: c.variantName,
                        qty: c.qty,
                        price: c.price,
                        subtotal: c.price * c.qty,
                        promoDiscount: c.promoDiscount ?? 0,
                        promoName: c.promoName ?? null,
                        modifiers: c.modifiers,
                    })),
                    subtotal: k.subtotal ?? displayTotal,
                    discount: Number(k.discount ?? 0),
                    tax: Number(k.tax ?? 0),
                    totalPromoDisc: k.totalPromoDisc ?? 0,
                    cartPromoDiscount: k.cartPromoDiscount ?? 0,
                    cartPromoName: k.cartPromoName ?? null,
                    grandTotal: displayTotal,
                    change: result.change ?? 0,
                    payments: payments.map(p => ({
                        methodName: p.is_pg ? 'Online PG' : (p.paymentMethodLabel || methodLabel || '?'),
                        amount: Number(p.amount),
                    })),
                    customerName: k.selectedCustomerObj?.name ?? null,
                    customerPhone: k.selectedCustomerObj?.phone ?? null,
                    tableName: k.selectedTableObj?.table_number ?? null,
                    orderType: k.orderType ?? 'retail',
                    rentalInfo: k.rentalInfo ?? null,
                    hospitalityInfo: k.hospitalityInfo ?? null,
                    parkingInfo: k.parkingInfo ?? null,
                    sessionInfo: k.sessionInfo ?? null,
                    deliveryAddress: k.deliveryAddress ?? null,
                    employeeName: k.selectedEmployeeObj?.name ?? null,
                };
                setSuccessData({
                    methodLabel,
                    grandTotal: displayTotal,
                    paid: payments.reduce((s, p) => s + Number(p.amount), 0),
                    change: result.change ?? 0,
                    debtNow: extra.debtNow ?? 0,
                    saleNo,
                    receipt: builtReceipt,
                    items: builtReceipt.items,
                    subtotal: builtReceipt.subtotal,
                    discount: builtReceipt.discount,
                    tax: builtReceipt.tax,
                    totalPromoDisc: builtReceipt.totalPromoDisc,
                    cartPromoDiscount: builtReceipt.cartPromoDiscount,
                    cartPromoName: builtReceipt.cartPromoName,
                    payments: builtReceipt.payments,
                    customerName: builtReceipt.customerName,
                    customerPhone: builtReceipt.customerPhone,
                    tableName: builtReceipt.tableName,
                    orderType: builtReceipt.orderType,
                    rentalInfo: builtReceipt.rentalInfo,
                    hospitalityInfo: builtReceipt.hospitalityInfo,
                    parkingInfo: builtReceipt.parkingInfo,
                    sessionInfo: builtReceipt.sessionInfo,
                    deliveryAddress: builtReceipt.deliveryAddress,
                    employeeName: builtReceipt.employeeName,
                });
                playPaymentSuccess();
            }
            return result;
        } finally {
            setIsFinalizing(false);
        }
    }, [saleId, saleNo, displayTotal, selectedCustomer, isFinalizing, handleFinalizePayment, k]);

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

    const handleKasbonPg = useCallback(async (provider, paymentType, customAmount) => {
        if (!saleId) return;
        const pgResult = await handleStartPg(saleId, provider, paymentType, customAmount);
        if (pgResult?.success && pgResult?.pg_trx_id) {
            const pg = {
                pgTrxId: pgResult.pg_trx_id,
                amount: customAmount,
                saleId: saleId,
                saleNo: saleNo,
                change: 0,
                grandTotal: displayTotal,
                paymentType: paymentType,
                qrCode: pgResult.qr_code,
                qrImageUrl: pgResult.qr_image_url,
                vaNumber: pgResult.va_number,
                vaBank: pgResult.va_bank,
                paymentUrl: pgResult.payment_url,
                initialStatus: pgResult.status ?? 'pending',
                canRetry: !!pgResult.can_retry,
            };
            setActivePgTrx(pg);
            setMainTab('gateway');
        } else {
            alert(pgResult?.message || 'Gagal membuat transaksi pembayaran online.');
        }
    }, [saleId, saleNo, displayTotal, handleStartPg]);

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
            items: (k.cart || []).map(c => ({
                name: c.name,
                variantName: c.variantName,
                qty: c.qty,
                price: c.price,
                subtotal: c.price * c.qty,
                promoDiscount: c.promoDiscount ?? 0,
                promoName: c.promoName ?? null,
                modifiers: c.modifiers,
            })),
            subtotal: k.subtotal ?? displayTotal,
            discount: Number(k.discount ?? 0),
            tax: Number(k.tax ?? 0),
            totalPromoDisc: k.totalPromoDisc ?? 0,
            cartPromoDiscount: k.cartPromoDiscount ?? 0,
            cartPromoName: k.cartPromoName ?? null,
            payments: [{
                methodName: `Online PG (${pg?.paymentType || 'Gateway'})`,
                amount: Number(pg?.amount ?? displayTotal),
            }],
            customerName: k.selectedCustomerObj?.name ?? null,
            customerPhone: k.selectedCustomerObj?.phone ?? null,
            tableName: k.selectedTableObj?.table_number ?? null,
            orderType: k.orderType ?? 'retail',
            rentalInfo: k.rentalInfo ?? null,
            hospitalityInfo: k.hospitalityInfo ?? null,
            parkingInfo: k.parkingInfo ?? null,
            sessionInfo: k.sessionInfo ?? null,
            deliveryAddress: k.deliveryAddress ?? null,
            employeeName: k.selectedEmployeeObj?.name ?? null,
        });
        playPaymentSuccess();
        setActivePgTrx(null);
    }, [activePgTrx, displayTotal, saleNo, onPgPaidFromKasir, k]);

    const handleSplitDone = useCallback((data) => {
        setSuccessData(data);
        setSplitMode(false);
    }, []);

    // ── Render ──
    if (!showPayment) return null;

    const activeSuccessData = k.successData || successData;

    if (activeSuccessData) {
        return (
            <SuccessScreen
                data={activeSuccessData}
                storeName={storeName || 'Toko'}
                receiptFooter={receiptFooter}
                onNewTransaction={() => {
                    setSuccessData(null);
                    setActivePgTrx(null);
                    setSaleId(null);
                    setSaleNo(null);
                    if (k.clearCart) k.clearCart();
                    setShowPayment(false);
                }}
                onSendWa={(receipt) => {
                    if (k.sendWhatsApp) {
                        k.sendWhatsApp(receipt, storeName || 'Toko');
                    }
                }}
                onClose={() => {
                    setShowPayment(false);
                    setSuccessData(null);
                    if (k.setSuccessData) k.setSuccessData(null);
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
        <div className="flex flex-1 flex-col overflow-y-auto lg:overflow-hidden bg-background min-h-screen lg:min-h-0">
            {/* RESPONSIVE HEADER */}
            <div className="shrink-0 border-b border-border bg-card px-3 sm:px-5 py-2.5 sm:py-3 shadow-xs">
                <div className="mx-auto flex flex-wrap max-w-[1600px] items-center justify-between gap-2.5">
                   

                    {/* Mode Tabs */}
                    <div className="flex-1 overflow-x-auto no-scrollbar py-0.5">
                        <div className="inline-flex rounded-xl p-1 bg-muted/60 border border-border/60" role="tablist">
                            {tabs.map(tab => {
                                const active = mainTab === tab.key;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => !splitMode && setMainTab(tab.key)}
                                        className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                                            active
                                                ? 'bg-card text-primary shadow-xs font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                            } ${!splitMode ? '' : 'opacity-50 cursor-not-allowed'}`}
                                    >
                                        <Icon size={16} strokeWidth={2.2} />
                                        <span className="whitespace-nowrap">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isStarting && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <span className="hidden md:inline">Memproses...</span>
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={() => setSplitMode(!splitMode)}
                            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${
                                splitMode
                                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                                    : 'border-border bg-background text-foreground hover:bg-muted'
                                }`}
                        >
                            <Split size={15} strokeWidth={2.2} />
                            <span className="hidden sm:inline">{splitMode ? 'Tutup Pisah' : 'Pisah Pembayaran'}</span>
                            <span className="sm:hidden">{splitMode ? 'Batal' : 'Pisah'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE ORDER ACCORDION TOGGLE (< lg) */}
            <div className="lg:hidden shrink-0 border-b border-border bg-card/60 px-4 py-2.5">
                <button
                    type="button"
                    onClick={() => setShowMobileOrder(!showMobileOrder)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground shadow-xs transition hover:bg-muted"
                >
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={17} className="text-primary" />
                        <span>Detail Pesanan ({totalItems} item)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{fmt(displayTotal)}</span>
                        {showMobileOrder ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </button>
            </div>

            {/* MAIN CONTENT GRID */}
            <main className="flex-1 overflow-y-auto lg:overflow-hidden p-3 sm:p-5">
                <div className="mx-auto flex flex-col lg:flex-row h-full max-w-[1600px] gap-4">
                    {/* LEFT — Order Detail Card */}
                    <section className={`w-full lg:w-7/12 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs ${
                        showMobileOrder ? 'flex' : 'hidden lg:flex'
                    }`}>
                        {/* Detail Header */}
                        <div className="shrink-0 border-b border-border px-4 sm:px-5 py-3 space-y-1 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm sm:text-base font-bold text-foreground">Detail Pesanan</h2>
                                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary uppercase tracking-wider">
                                    {k.orderType || 'retail'}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-mono font-semibold text-foreground">{saleNo}</span>
                                <span>• {totalItems} item</span>
                                {k.selectedCustomerObj && (
                                    <span>• Pelanggan: <strong className="text-foreground">{k.selectedCustomerObj.name}</strong> ({k.selectedCustomerObj.phone || 'Tanpa No HP'})</span>
                                )}
                                {k.selectedTableObj && (
                                    <span>• Meja: <strong className="text-foreground">{k.selectedTableObj.table_number}</strong></span>
                                )}
                                {k.takeawayCustomerName && (
                                    <span>• Pengambilan: <strong className="text-foreground">{k.takeawayCustomerName}</strong> {k.pickupTime ? `(${k.pickupTime})` : ''}</span>
                                )}
                                {k.deliveryAddress && (
                                    <span>• Alamat: <strong className="text-foreground">{k.deliveryAddress}</strong></span>
                                )}
                                {k.selectedEmployeeObj && (
                                    <span>• Kasir: <strong className="text-foreground">{k.selectedEmployeeObj.name}</strong></span>
                                )}
                            </div>
                            {k.notes && (
                                <p className="text-xs text-amber-800 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 font-medium mt-1">
                                    Catatan Pesanan: {k.notes}
                                </p>
                            )}
                        </div>

                        {/* Order Items Table */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-5 max-h-[300px] lg:max-h-none">
                            <table className="w-full text-xs sm:text-sm">
                                <thead className="sticky top-0 bg-card text-[11px] uppercase tracking-wider text-muted-foreground z-10 border-b border-border font-bold">
                                    <tr>
                                        <th className="py-2.5 text-left">Produk</th>
                                        <th className="py-2.5 text-center w-12 sm:w-16">Qty</th>
                                        <th className="py-2.5 text-right w-20 sm:w-24">Harga</th>
                                        <th className="py-2.5 text-right w-20 sm:w-24">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item) => (
                                        <tr key={item.cartId} className="border-b border-border/50 last:border-0 align-top">
                                            <td className="py-2.5 pr-2">
                                                <div className="font-semibold text-foreground">{item.name}</div>
                                                {item.variantName && (
                                                    <div className="text-xs text-muted-foreground">{item.variantName}</div>
                                                )}
                                                {item.modifiers && item.modifiers.length > 0 && (
                                                    <div className="text-[11px] text-muted-foreground/80 pl-2">
                                                        {item.modifiers.map(m => `+ ${m.name} (${fmt(m.price_addition || 0)})`).join(', ')}
                                                    </div>
                                                )}
                                                {item.note && (
                                                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pl-2">
                                                        Catatan: {item.note}
                                                    </div>
                                                )}
                                                {(item.promoDiscount ?? 0) > 0 && (
                                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pl-2">
                                                        Promo {item.promoName || ''}: -{fmt(item.promoDiscount)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2.5 text-center text-muted-foreground font-semibold">{item.qty}</td>
                                            <td className="py-2.5 text-right text-muted-foreground">{fmt(item.price)}</td>
                                            <td className="py-2.5 text-right font-bold text-foreground">{fmt(item.price * item.qty)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Order Summary Footer */}
                        <div className="shrink-0 border-t border-border px-4 sm:px-5 py-3 space-y-1.5 text-xs sm:text-sm bg-muted/20">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal Produk</span>
                                <span className="font-medium text-foreground">{fmt(k.subtotal || (grandTotal - roundingAdjustment))}</span>
                            </div>
                            {(k.totalPromoDisc ?? 0) > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                    <span>Diskon Promo Produk</span>
                                    <span>-{fmt(k.totalPromoDisc)}</span>
                                </div>
                            )}
                            {(k.cartPromoDiscount ?? 0) > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                    <span>{k.cartPromoName || 'Promo Keranjang'}</span>
                                    <span>-{fmt(k.cartPromoDiscount)}</span>
                                </div>
                            )}
                            {Number(k.discount ?? 0) > 0 && (
                                <div className="flex justify-between text-destructive">
                                    <span>Diskon Manual</span>
                                    <span>-{fmt(k.discount)}</span>
                                </div>
                            )}
                            {Number(k.tax ?? 0) > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Pajak</span>
                                    <span>+{fmt(k.tax)}</span>
                                </div>
                            )}
                            {roundingAdjustment !== 0 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Pembulatan</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        {roundingAdjustment > 0 ? '+' : ''}{fmt(roundingAdjustment)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-border pt-2 flex items-baseline justify-between">
                                <span className="text-xs sm:text-sm font-bold text-muted-foreground tracking-wider uppercase">TOTAL TAGIHAN</span>
                                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">{fmt(displayTotal)}</span>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT — Dynamic Payment Panel */}
                    <aside className="w-full lg:w-5/12 flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs min-h-[460px] lg:min-h-0">
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
                                subtotal={k.subtotal}
                                discount={Number(k.discount || 0)}
                                tax={Number(k.tax || 0)}
                                roundingAdjustment={roundingAdjustment}
                                cashRoundingEnabled={cashRoundingEnabled}
                                cashRoundingNearest={cashRoundingNearest}
                                cashRoundingMode={cashRoundingMode}
                                roundingOverrideMode={roundingOverrideMode}
                                setRoundingOverrideMode={setRoundingOverrideMode}
                                roundingCustomValue={roundingCustomValue}
                                setRoundingCustomValue={setRoundingCustomValue}
                                isFinalizing={isFinalizing}
                                onPay={(payments) => handleMethodPay(payments, 'Langsung')}
                            />
                        ) : mainTab === 'kasbon' ? (
                            <KasbonPanel
                                paymentMethods={paymentMethods}
                                pgMethods={pgMethods}
                                displayTotal={displayTotal}
                                grandTotal={grandTotal}
                                subtotal={k.subtotal}
                                discount={Number(k.discount || 0)}
                                tax={Number(k.tax || 0)}
                                selectedCustomer={selectedCustomer}
                                customers={customers}
                                onSelectCustomer={setSelectedCustomer}
                                isFinalizing={isFinalizing}
                                onPay={handleKasbon}
                                onPayPg={handleKasbonPg}
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
