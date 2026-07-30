import { useEffect, useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Clock,
    CreditCard,
    Minimize2,
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
    isFullscreen = false,
    setIsFullscreen = () => { },
}) {
    const {
        cart, grandTotal, roundedGrandTotal, roundingAdjustment,
        showPayment, setShowPayment,
        selectedCustomer, customers, setSelectedCustomer,
        handleStartSale, handleFinalizePayment, handleBackToKasir,
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
        if (saleId) return; // SALE ALREADY EXISTS —skip auto-startSale
        if (k.resumeSaleId) return; // Sudah dari payment route → sale sudah ada via redirect
        if (!cart || cart.length === 0) return;
        startSale();
    }, [showPayment, k.successData, successData, cart, saleId, k.resumeSaleId]);

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

    /**
     * Kembali ke halaman kasir dengan keranjang utuh.
     *
     * Pembatalan pending sale di-skip kalau pembayaran sudah jadi (successData)
     * atau ada transaksi PG yang masih berjalan — keduanya tidak boleh dibatalkan
     * dari tombol kembali.
     */
    const handleBack = () =>
        handleBackToKasir({
            saleId,
            skipCancel: !!successData || !!activePgTrx,
        });

    // Daftarkan handler ini supaya tombol "Kembali" di header layout memakai
    // logika yang sama (tahu soal struk & transaksi PG yang masih berjalan).
    useEffect(() => {
        k.registerPaymentBack(handleBack);
        return () => k.registerPaymentBack(null);
    }, [saleId, successData, activePgTrx]);

    // Escape menutup payment view — kecuali sedang di tengah split bill
    // (biar tidak tidak sengaja membatalkan pembagian yang sudah diisi).
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape" && !splitMode) {
                e.preventDefault();
                handleBack();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [splitMode, saleId, successData, activePgTrx]);

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
                        k.setApiError('Gagal mendapatkan data pembayaran dari penyedia. Silakan coba lagi.');
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
                // Save success data to sessionStorage (survives Inertia navigation)
                const successPayload = {
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
                };
                window.sessionStorage.setItem('pos_success', JSON.stringify(successPayload));
                playPaymentSuccess();
                router.visit(route('admin.kasir.index'));
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
            k.setApiError(pgResult?.message || 'Gagal membuat transaksi pembayaran online.');
        }
    }, [saleId, saleNo, displayTotal, handleStartPg]);

    const handleGateway = useCallback(async (provider, paymentType) => {
        const matchedMethod = findPgPaymentMethod(paymentType, paymentMethods);
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
        if (k.setShowPayment) k.setShowPayment(false);
        const pgPayload = {
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
        };
        window.sessionStorage.setItem('pos_success', JSON.stringify(pgPayload));
        router.visit(route('admin.kasir.index'));
    }, [activePgTrx, displayTotal, saleNo, onPgPaidFromKasir, k]);

    const handleSplitDone = useCallback((data) => {
        setSuccessData(data);
        setSplitMode(false);
    }, []);

    // ── Render ──
    if (!showPayment) return null;

    const activeSuccessData = k.successData || successData;

    if (activeSuccessData) {
        return null;
    }

    const tabs = [
        { key: 'langsung', desktopLabel: 'Langsung / Manual', mobileLabel: 'Langsung', icon: Wallet },
        { key: 'kasbon', desktopLabel: 'Hutang / Kasbon', mobileLabel: 'Hutang', icon: NotebookTabs },
        { key: 'gateway', desktopLabel: 'Payment Gateway', mobileLabel: 'Online', icon: CreditCard },
    ];

    const totalItems = cart.reduce((s, it) => s + Number(it.qty || 1), 0);

    return (
        <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-background">
            <Head title="Pembayaran" />

            {/* =========================================================
            MOBILE — FLOATING EXIT FULLSCREEN
        ========================================================== */}
            {isFullscreen && (
                <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    className="fixed right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-md transition hover:bg-accent hover:text-accent-foreground lg:hidden"
                    title="Keluar Fullscreen"
                >
                    <Minimize2 size={16} strokeWidth={2.2} />
                </button>
            )}

            {/* =========================================================
            MOBILE — ORDER ACCORDION
        ========================================================== */}
            <div className="shrink-0 border-b border-border bg-card/60 px-3 py-2.5 lg:hidden">
                <button
                    type="button"
                    onClick={() => setShowMobileOrder(!showMobileOrder)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted sm:text-sm"
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <ShoppingBag
                            size={17}
                            className="shrink-0 text-primary"
                        />

                        <div className="min-w-0 text-left">
                            <div className="truncate">
                                Detail Pesanan ({totalItems} item)
                            </div>

                            {saleNo && (
                                <div className="mt-0.5 truncate font-mono text-[10px] leading-none text-muted-foreground/80">
                                    {saleNo}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="font-bold text-primary">
                            {fmt(displayTotal)}
                        </span>

                        {showMobileOrder ? (
                            <ChevronUp size={16} />
                        ) : (
                            <ChevronDown size={16} />
                        )}
                    </div>
                </button>

                {/* MOBILE ORDER DETAIL */}
                {showMobileOrder && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">

                        {/* Detail */}
                        <div className="space-y-1 border-b border-border bg-muted/20 px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-bold text-foreground">
                                    Detail Pesanan
                                </span>

                                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                    {k.orderType || "retail"}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="font-mono font-semibold text-foreground">
                                    {saleNo}
                                </span>

                                <span>• {totalItems} item</span>

                                {k.selectedCustomerObj && (
                                    <span>
                                        • Pelanggan:{" "}
                                        <strong className="text-foreground">
                                            {k.selectedCustomerObj.name}
                                        </strong>
                                    </span>
                                )}

                                {k.selectedTableObj && (
                                    <span>
                                        • Meja:{" "}
                                        <strong className="text-foreground">
                                            {k.selectedTableObj.table_number}
                                        </strong>
                                    </span>
                                )}

                                {k.selectedEmployeeObj && (
                                    <span>
                                        • Kasir:{" "}
                                        <strong className="text-foreground">
                                            {k.selectedEmployeeObj.name}
                                        </strong>
                                    </span>
                                )}
                            </div>

                            {k.notes && (
                                <p className="mt-2 rounded-lg border border-warning/20 bg-warning/10 px-2.5 py-1.5 text-[11px] font-medium text-warning dark:text-warning">
                                    Catatan: {k.notes}
                                </p>
                            )}
                        </div>

                        {/* MOBILE ITEMS */}
                        <div className="max-h-[35dvh] overflow-y-auto">
                            {cart.map((item) => (
                                <div
                                    key={item.cartId}
                                    className="flex gap-3 border-b border-border/50 px-3 py-2.5 last:border-0"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xs font-semibold text-foreground">
                                            {item.name}
                                        </div>

                                        {item.variantName && (
                                            <div className="truncate text-[11px] text-muted-foreground">
                                                {item.variantName}
                                            </div>
                                        )}

                                        {item.modifiers?.length > 0 && (
                                            <div className="mt-1 text-[10px] leading-4 text-muted-foreground">
                                                {item.modifiers.map(
                                                    (modifier, index) => (
                                                        <div key={index}>
                                                            + {modifier.name} (
                                                            {fmt(
                                                                modifier.price_addition ||
                                                                0
                                                            )}
                                                            )
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {item.note && (
                                            <div className="mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                                Catatan: {item.note}
                                            </div>
                                        )}

                                        {(item.promoDiscount ?? 0) > 0 && (
                                            <div className="mt-1 text-[10px] font-medium text-success dark:text-success">
                                                Promo {item.promoName || ""}: -
                                                {fmt(item.promoDiscount)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <div className="text-[11px] text-muted-foreground">
                                            {item.qty} × {fmt(item.price)}
                                        </div>

                                        <div className="mt-0.5 text-xs font-bold text-foreground">
                                            {fmt(item.price * item.qty)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* MOBILE SUMMARY */}
                        <div className="space-y-1.5 border-t border-border bg-muted/20 px-3 py-3 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>

                                <span className="font-medium text-foreground">
                                    {fmt(
                                        k.subtotal ||
                                        grandTotal - roundingAdjustment
                                    )}
                                </span>
                            </div>

                            {(k.totalPromoDisc ?? 0) > 0 && (
                                <div className="flex justify-between text-success dark:text-success">
                                    <span>Promo Produk</span>
                                    <span>-{fmt(k.totalPromoDisc)}</span>
                                </div>
                            )}

                            {(k.cartPromoDiscount ?? 0) > 0 && (
                                <div className="flex justify-between text-success dark:text-success">
                                    <span>
                                        {k.cartPromoName || "Promo Keranjang"}
                                    </span>

                                    <span>
                                        -{fmt(k.cartPromoDiscount)}
                                    </span>
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
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Pembulatan</span>

                                    <span>
                                        {roundingAdjustment > 0 ? "+" : ""}
                                        {fmt(roundingAdjustment)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between border-t border-border pt-2">
                                <span className="font-bold uppercase tracking-wider text-muted-foreground">
                                    Total
                                </span>

                                <span className="text-lg font-extrabold text-primary">
                                    {fmt(displayTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* =========================================================
            MOBILE — PAYMENT CONTROLS
        ========================================================== */}
            <div className="shrink-0 border-b border-border bg-card px-3 py-2 lg:hidden">
                <div className="flex flex-col gap-2">

                    {/* Split */}
                    <div className="flex items-center gap-2">
                        {isStarting && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={() => setSplitMode(!splitMode)}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${splitMode
                                    ? "border-primary bg-primary/10 text-primary shadow-xs"
                                    : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                        >
                            <Split
                                size={15}
                                strokeWidth={2.2}
                                className="shrink-0"
                            />

                            <span>
                                {splitMode ? "Batal Pisah" : "Pisah Pembayaran"}
                            </span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="no-scrollbar w-full overflow-x-auto">
                        <div
                            className="grid min-w-max grid-cols-3 rounded-xl border border-border bg-muted/60 p-1 sm:min-w-0"
                            role="tablist"
                        >
                            {tabs.map((tab) => {
                                const active = mainTab === tab.key;
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() =>
                                            !splitMode && setMainTab(tab.key)
                                        }
                                        className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all ${active
                                                ? "bg-card text-primary shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                            } ${splitMode
                                                ? "cursor-not-allowed opacity-50"
                                                : ""
                                            }`}
                                    >
                                        <Icon
                                            size={15}
                                            strokeWidth={2.2}
                                            className="shrink-0"
                                        />

                                        <span>{tab.mobileLabel}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================
            DESKTOP — FULLSCREEN EXIT
        ========================================================== */}
            {isFullscreen && (
                <div className="hidden shrink-0 justify-end px-4 pt-3 lg:flex">
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
                        title="Keluar Fullscreen"
                    >
                        <Minimize2 size={15} strokeWidth={2.2} />
                    </button>
                </div>
            )}

            {/* =========================================================
            MAIN CONTENT
        ========================================================== */}
            <main className="min-h-0 flex-1 overflow-y-auto">

                {/* MOBILE + DESKTOP CONTAINER */}
                <div className="mx-auto w-full max-w-[1920px] p-3 sm:p-4">

                    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12 lg:gap-4">

                        {/* =================================================
                        LEFT — DESKTOP ONLY

                        5 / 12 columns
                        Sticky
                        Independent height
                    ================================================== */}
                        <div className="hidden lg:sticky lg:top-4 lg:col-span-5 lg:flex lg:max-h-[calc(100dvh-2rem)] lg:min-h-0 lg:flex-col lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-card xl:col-span-5">

                            {/* DESKTOP CONTROLS */}
                            <div className="shrink-0 border-b border-border px-4 py-2.5">
                                <div className="flex items-center justify-between gap-3">

                                    {/* Split */}
                                    <div className="flex shrink-0 items-center gap-2">
                                        {isStarting && (
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                <span className="hidden xl:inline">
                                                    Memproses...
                                                </span>
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSplitMode(!splitMode)
                                            }
                                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${splitMode
                                                    ? "border-primary bg-primary/10 text-primary shadow-xs"
                                                    : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                                                }`}
                                        >
                                            <Split
                                                size={14}
                                                strokeWidth={2.2}
                                                className="shrink-0"
                                            />

                                            <span className="whitespace-nowrap">
                                                {splitMode
                                                    ? "Tutup Pisah"
                                                    : "Pisah Pembayaran"}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="no-scrollbar min-w-0 overflow-x-auto">
                                        <div
                                            className="inline-flex rounded-xl border border-border bg-muted/60 p-1"
                                            role="tablist"
                                        >
                                            {tabs.map((tab) => {
                                                const active =
                                                    mainTab === tab.key;
                                                const Icon = tab.icon;

                                                return (
                                                    <button
                                                        key={tab.key}
                                                        type="button"
                                                        onClick={() =>
                                                            !splitMode &&
                                                            setMainTab(tab.key)
                                                        }
                                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all xl:px-3 ${active
                                                                ? "bg-card text-primary shadow-xs"
                                                                : "text-muted-foreground hover:text-foreground"
                                                            } ${splitMode
                                                                ? "cursor-not-allowed opacity-50"
                                                                : ""
                                                            }`}
                                                    >
                                                        <Icon
                                                            size={14}
                                                            strokeWidth={2.2}
                                                            className="shrink-0"
                                                        />

                                                        <span>
                                                            {tab.desktopLabel}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DETAIL HEADER */}
                            <div className="shrink-0 space-y-1 border-b border-border bg-muted/20 px-4 py-3 xl:px-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-sm font-bold text-foreground xl:text-base">
                                        Detail Pesanan
                                    </h2>

                                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                                        {k.orderType || "retail"}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                    <span className="font-mono font-semibold text-foreground">
                                        {saleNo}
                                    </span>

                                    <span>• {totalItems} item</span>

                                    {k.selectedCustomerObj && (
                                        <span>
                                            • Pelanggan:{" "}
                                            <strong className="text-foreground">
                                                {k.selectedCustomerObj.name}
                                            </strong>{" "}
                                            (
                                            {k.selectedCustomerObj.phone ||
                                                "Tanpa No HP"}
                                            )
                                        </span>
                                    )}

                                    {k.selectedTableObj && (
                                        <span>
                                            • Meja:{" "}
                                            <strong className="text-foreground">
                                                {
                                                    k.selectedTableObj
                                                        .table_number
                                                }
                                            </strong>
                                        </span>
                                    )}

                                    {k.takeawayCustomerName && (
                                        <span>
                                            • Pengambilan:{" "}
                                            <strong className="text-foreground">
                                                {k.takeawayCustomerName}
                                            </strong>{" "}
                                            {k.pickupTime
                                                ? `(${k.pickupTime})`
                                                : ""}
                                        </span>
                                    )}

                                    {k.deliveryAddress && (
                                        <span>
                                            • Alamat:{" "}
                                            <strong className="text-foreground">
                                                {k.deliveryAddress}
                                            </strong>
                                        </span>
                                    )}

                                    {k.selectedEmployeeObj && (
                                        <span>
                                            • Kasir:{" "}
                                            <strong className="text-foreground">
                                                {k.selectedEmployeeObj.name}
                                            </strong>
                                        </span>
                                    )}
                                </div>

                                {k.notes && (
                                    <p className="mt-1 rounded-xl border border-warning/20 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning dark:text-warning">
                                        Catatan Pesanan: {k.notes}
                                    </p>
                                )}
                            </div>

                            {/* =================================================
                            PRODUCT TABLE

                            THIS AREA SCROLLS
                        ================================================== */}
                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                                <table className="w-full table-fixed text-xs xl:text-sm">
                                    <thead className="sticky top-0 z-10 border-b border-border bg-popover text-[11px] uppercase tracking-wider text-card-foreground shadow-sm">
                                        <tr>
                                            <th className="w-auto px-4 py-2.5 text-left font-semibold xl:px-5">
                                                Produk
                                            </th>

                                            <th className="w-14 px-2 py-2.5 text-center font-semibold xl:w-16">
                                                Qty
                                            </th>

                                            <th className="w-24 px-2 py-2.5 text-right font-semibold xl:w-28">
                                                Harga
                                            </th>

                                            <th className="w-24 py-2.5 pl-2 pr-4 text-right font-semibold xl:w-28 xl:pr-5">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border bg-background">
                                        {cart.map((item) => (
                                            <tr
                                                key={item.cartId}
                                                className="align-top transition hover:bg-[rgb(var(--color-table-hover))]"
                                            >
                                                {/* Product */}
                                                <td className="px-4 py-3 xl:px-5">
                                                    <div className="min-w-0">
                                                        <div className="truncate font-semibold text-foreground">
                                                            {item.name}
                                                        </div>

                                                        {item.variantName && (
                                                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                {
                                                                    item.variantName
                                                                }
                                                            </div>
                                                        )}

                                                        {item.modifiers?.length >
                                                            0 && (
                                                                <div className="mt-1 space-y-0.5 text-[11px] leading-4 text-muted-foreground/80">
                                                                    {item.modifiers.map(
                                                                        (
                                                                            modifier,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                            >
                                                                                +{" "}
                                                                                {
                                                                                    modifier.name
                                                                                }{" "}
                                                                                (
                                                                                {fmt(
                                                                                    modifier.price_addition ||
                                                                                    0
                                                                                )}
                                                                                )
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}

                                                        {item.note && (
                                                            <div className="mt-1 text-[11px] font-medium leading-4 text-amber-600 dark:text-amber-400">
                                                                Catatan:{" "}
                                                                {item.note}
                                                            </div>
                                                        )}

                                                        {(item.promoDiscount ??
                                                            0) > 0 && (
                                                                <div className="mt-1 text-[11px] font-medium leading-4 text-success dark:text-success">
                                                                    Promo{" "}
                                                                    {item.promoName ||
                                                                        ""}
                                                                    : -
                                                                    {fmt(
                                                                        item.promoDiscount
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </td>

                                                {/* Qty */}
                                                <td className="px-2 py-3 text-center font-semibold text-muted-foreground">
                                                    {item.qty}
                                                </td>

                                                {/* Price */}
                                                <td className="whitespace-nowrap px-2 py-3 text-right text-muted-foreground">
                                                    {fmt(item.price)}
                                                </td>

                                                {/* Total */}
                                                <td className="whitespace-nowrap py-3 pl-2 pr-4 text-right font-bold text-foreground xl:pr-5">
                                                    {fmt(
                                                        item.price * item.qty
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* =================================================
                            SUMMARY — ALWAYS BOTTOM
                        ================================================== */}
                            <div className="shrink-0 space-y-1.5 border-t border-border bg-muted/20 px-4 py-3 text-xs xl:px-5 xl:text-sm">

                                <div className="flex justify-between gap-4 text-muted-foreground">
                                    <span>Subtotal Produk</span>

                                    <span className="shrink-0 font-medium text-foreground">
                                        {fmt(
                                            k.subtotal ||
                                            grandTotal -
                                            roundingAdjustment
                                        )}
                                    </span>
                                </div>

                                {(k.totalPromoDisc ?? 0) > 0 && (
                                    <div className="flex justify-between gap-4 text-success dark:text-success">
                                        <span>Diskon Promo Produk</span>

                                        <span className="shrink-0">
                                            -{fmt(k.totalPromoDisc)}
                                        </span>
                                    </div>
                                )}

                                {(k.cartPromoDiscount ?? 0) > 0 && (
                                    <div className="flex justify-between gap-4 text-success dark:text-success">
                                        <span>
                                            {k.cartPromoName ||
                                                "Promo Keranjang"}
                                        </span>

                                        <span className="shrink-0">
                                            -{fmt(k.cartPromoDiscount)}
                                        </span>
                                    </div>
                                )}

                                {Number(k.discount ?? 0) > 0 && (
                                    <div className="flex justify-between gap-4 text-destructive">
                                        <span>Diskon Manual</span>

                                        <span className="shrink-0">
                                            -{fmt(k.discount)}
                                        </span>
                                    </div>
                                )}

                                {Number(k.tax ?? 0) > 0 && (
                                    <div className="flex justify-between gap-4 text-muted-foreground">
                                        <span>Pajak</span>

                                        <span className="shrink-0">
                                            +{fmt(k.tax)}
                                        </span>
                                    </div>
                                )}

                                {roundingAdjustment !== 0 && (
                                    <div className="flex justify-between gap-4 text-muted-foreground">
                                        <span>Pembulatan</span>

                                        <span className="shrink-0">
                                            {roundingAdjustment > 0
                                                ? "+"
                                                : ""}
                                            {fmt(roundingAdjustment)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-end justify-between gap-4 border-t border-border pt-2.5">
                                    <span className="pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground xl:text-sm">
                                        Total Tagihan
                                    </span>

                                    <span className="shrink-0 text-2xl font-extrabold leading-none tracking-tight text-primary xl:text-3xl">
                                        {fmt(displayTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* =================================================
                        RIGHT — PAYMENT

                        Mobile  : 12/12
                        Desktop : 7/12

                        RIGHT CAN GROW NATURALLY.
                        LEFT DOES NOT FOLLOW ITS HEIGHT.
                    ================================================== */}
                        <div className="col-span-1 min-w-0 overflow-hidden rounded-xl border border-border bg-card lg:col-span-7">
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
                            ) : mainTab === "langsung" ? (
                                <LangsungPanel
                                    paymentMethods={paymentMethods}
                                    displayTotal={displayTotal}
                                    grandTotal={grandTotal}
                                    subtotal={k.subtotal}
                                    discount={Number(k.discount || 0)}
                                    tax={Number(k.tax || 0)}
                                    roundingAdjustment={roundingAdjustment}
                                    cashRoundingEnabled={
                                        cashRoundingEnabled
                                    }
                                    cashRoundingNearest={
                                        cashRoundingNearest
                                    }
                                    cashRoundingMode={cashRoundingMode}
                                    roundingOverrideMode={
                                        roundingOverrideMode
                                    }
                                    setRoundingOverrideMode={
                                        setRoundingOverrideMode
                                    }
                                    roundingCustomValue={
                                        roundingCustomValue
                                    }
                                    setRoundingCustomValue={
                                        setRoundingCustomValue
                                    }
                                    isFinalizing={isFinalizing}
                                    onPay={(payments) =>
                                        handleMethodPay(
                                            payments,
                                            "Langsung"
                                        )
                                    }
                                />
                            ) : mainTab === "kasbon" ? (
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
                                    onSelectCustomer={
                                        setSelectedCustomer
                                    }
                                    isFinalizing={isFinalizing}
                                    onPay={handleKasbon}
                                    onPayPg={handleKasbonPg}
                                    onBack={() =>
                                        setMainTab("langsung")
                                    }
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
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
