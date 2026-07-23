import { useState, useMemo } from 'react';
import {
    AlertTriangle,
    NotebookPen,
    Search,
} from 'lucide-react';
import { fmt } from '../helpers';
import DenominationGrid from '../DenominationGrid';
import PaymentMethodCards from './PaymentMethodCards';

/**
 * KasbonPanel — Refined Kasbon UI with direct DP selector (0%, 25%, 50%, 75%, 100%).
 * Disables Online PG button when no payment gateway is active.
 */
export default function KasbonPanel({
    paymentMethods = [],
    pgMethods = [],
    displayTotal = 0,
    grandTotal = 0,
    subtotal = 0,
    discount = 0,
    tax = 0,
    selectedCustomer,
    customers = [],
    onSelectCustomer,
    isFinalizing = false,
    onPay,
    onPayPg,
}) {
    const debtMethod = paymentMethods.find((m) => m.type === 'debt');
    const offlineMethods = paymentMethods.filter((m) => m.type !== 'debt');
    const cashMethod = offlineMethods.find((m) => m.type === 'cash');

    const hasPgMethods = Array.isArray(pgMethods) && pgMethods.length > 0;

    // ── Local State ──
    const [customerQuery, setCustomerQuery] = useState('');
    const [payNow, setPayNow] = useState(0); // 0 = Full Hutang
    const [dpPaymentType, setDpPaymentType] = useState('offline'); // 'offline' | 'pg'
    const [selectedDpMethod, setSelectedDpMethod] = useState(cashMethod || offlineMethods[0] || null);
    const [selectedPgMethod, setSelectedPgMethod] = useState(pgMethods[0] || null);
    const [cashReceived, setCashReceived] = useState(0);
    const [dueDate, setDueDate] = useState('');
    const [note, setNote] = useState('');

    const customer = useMemo(
        () => customers.find((c) => String(c.id) === String(selectedCustomer)),
        [customers, selectedCustomer],
    );

    const filteredCustomers = useMemo(() => {
        if (!customerQuery.trim()) return customers;
        const q = customerQuery.toLowerCase();
        return customers.filter(
            (c) =>
                c.name?.toLowerCase().includes(q) ||
                c.phone?.includes(q) ||
                c.code?.toLowerCase().includes(q),
        );
    }, [customers, customerQuery]);

    const previousDebt = Number(customer?.debt_balance ?? 0);
    const creditLimit = Number(customer?.credit_limit ?? 0);
    const availableCredit = creditLimit - previousDebt;

    // Remaining debt for current transaction after DP
    const remainingDebt = Math.max(0, displayTotal - payNow);
    const newTotalDebt = previousDebt + remainingDebt;
    const isOverCreditLimit = creditLimit > 0 && newTotalDebt > creditLimit;

    const changeCustomer = () => {
        onSelectCustomer(null);
        setPayNow(0);
        setCashReceived(0);
    };

    // Quick DP percentage setter
    const setDpPercentage = (percent) => {
        const amt = Math.round((displayTotal * percent) / 100);
        setPayNow(amt);
        setCashReceived(amt);
    };

    const handlePaySubmit = async () => {
        if (!debtMethod || !customer) return;

        // 0% DP = Full Hutang
        if (payNow <= 0) {
            onPay('full', displayTotal, dueDate || null, note || null, [
                {
                    method_id: debtMethod.id,
                    amount: displayTotal,
                    is_pg: false,
                },
            ]);
            return;
        }

        // Partial DP paid via PG
        if (dpPaymentType === 'pg' && hasPgMethods && selectedPgMethod) {
            if (onPayPg) {
                onPayPg(selectedPgMethod.provider, selectedPgMethod.payment_type, payNow);
            }
            return;
        }

        // Offline DP (Cash or Transfer) + Remaining Debt
        const dpMethodId = selectedDpMethod?.id || cashMethod?.id;
        const payments = [
            {
                method_id: dpMethodId,
                amount: payNow,
                is_pg: false,
            },
        ];

        if (remainingDebt > 0) {
            payments.push({
                method_id: debtMethod.id,
                amount: remainingDebt,
                is_pg: false,
            });
        }

        onPay(
            remainingDebt > 0 ? 'partial' : 'full',
            remainingDebt,
            dueDate || null,
            note || null,
            payments,
        );
    };

    const canSubmit = useMemo(() => {
        if (isFinalizing || !customer || !debtMethod) return false;
        if (payNow <= 0) return true; // Full Hutang
        if (payNow > displayTotal) return false;

        if (dpPaymentType === 'offline') {
            if (selectedDpMethod?.type === 'cash') {
                return cashReceived >= payNow;
            }
            return !!selectedDpMethod;
        }

        if (dpPaymentType === 'pg') {
            return hasPgMethods && !!selectedPgMethod;
        }

        return false;
    }, [isFinalizing, customer, debtMethod, payNow, displayTotal, dpPaymentType, selectedDpMethod, cashReceived, hasPgMethods, selectedPgMethod]);

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
            {/* Header */}
            <div className="shrink-0 border-b border-border bg-card px-5 py-3.5">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2 text-foreground">
                        <NotebookPen size={17} strokeWidth={2} className="text-primary" />
                        Hutang / Kasbon
                    </h3>
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground">Total Tagihan: </span>
                        <span className="text-base font-bold text-foreground">{fmt(displayTotal)}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* ── STEP 1: Customer Picker (if none selected) ── */}
                {!customer ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                            <AlertTriangle size={15} className="shrink-0" />
                            Pilih pelanggan terlebih dahulu untuk memproses transaksi kasbon.
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Cari Pelanggan
                            </label>
                            <div className="relative mt-1.5">
                                <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={customerQuery}
                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                    placeholder="Cari nama, nomor HP, atau kode pelanggan..."
                                    className="block w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                            {filteredCustomers.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Pelanggan tidak ditemukan.
                                </p>
                            ) : (
                                filteredCustomers.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => onSelectCustomer(c.id)}
                                        className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary hover:shadow-sm"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">{c.name}</div>
                                            <div className="text-xs text-muted-foreground">{c.phone || 'Tanpa No HP'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] text-muted-foreground">Hutang Aktif</div>
                                            <div className="text-sm font-bold text-destructive">
                                                {fmt(c.debt_balance ?? 0)}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    /* ── STEP 2: Customer Selected & DP Options ── */
                    <div className="space-y-4">
                        {/* Customer Info Card */}
                        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-bold text-foreground">{customer.name}</div>
                                    <div className="text-xs text-muted-foreground">{customer.phone || 'Tanpa No HP'}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={changeCustomer}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    Ganti Pelanggan
                                </button>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                                <div>
                                    <div className="text-muted-foreground">Hutang Aktif</div>
                                    <div className="font-bold text-destructive">{fmt(previousDebt)}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Limit Kredit</div>
                                    <div className="font-bold text-foreground">
                                        {creditLimit > 0 ? fmt(creditLimit) : 'Tanpa Limit'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Sisa Limit</div>
                                    <div className={`font-bold ${availableCredit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {creditLimit > 0 ? fmt(availableCredit) : '∞'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── DP SETTINGS BLOCK ── */}
                        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Nominal DP (Uang Muka)
                            </h4>

                            {/* Percentage Quick Buttons */}
                            <div className="grid grid-cols-5 gap-1.5">
                                {[
                                    { l: '0% (Full)', p: 0 },
                                    { l: '25%', p: 25 },
                                    { l: '50%', p: 50 },
                                    { l: '75%', p: 75 },
                                ].map((opt) => {
                                    const calculatedVal = Math.round((displayTotal * opt.p) / 100);
                                    const isSelected = payNow === calculatedVal;
                                    return (
                                        <button
                                            key={opt.p}
                                            type="button"
                                            onClick={() => setDpPercentage(opt.p)}
                                            className={`rounded-lg border py-2 text-xs font-semibold transition ${isSelected
                                                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                                                    : 'border-border bg-muted/30 text-foreground hover:bg-muted'
                                                }`}
                                        >
                                            <div className="text-center leading-tight">
                                                <div>{opt.l}</div>
                                                <div className="text-[10px] opacity-75 font-normal">
                                                    {opt.p === 0 ? 'Hutang' : fmt(calculatedVal).replace('Rp', '')}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom DP Input */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Input Nominal DP</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={payNow ? fmt(payNow).replace('Rp', '') : ''}
                                    onChange={(e) => {
                                        const n = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                        setPayNow(n);
                                        setCashReceived(n);
                                    }}
                                    placeholder="Rp0 (Full Hutang)"
                                    className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base font-bold text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>

                            {/* DP Payment Method Selector (Only when payNow > 0) */}
                            {payNow > 0 && (
                                <div className="space-y-3 pt-1 border-t border-border">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Metode Pembayaran DP ({fmt(payNow)})
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDpPaymentType('offline')}
                                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${dpPaymentType === 'offline'
                                                    ? 'border-primary bg-primary/10 text-primary font-bold'
                                                    : 'border-border bg-background text-muted-foreground'
                                                }`}
                                        >
                                            Tunai / Transfer Manual
                                        </button>

                                        {/* Online PG Button — Disabled when no active PG */}
                                        <button
                                            type="button"
                                            onClick={() => hasPgMethods && setDpPaymentType('pg')}
                                            disabled={!hasPgMethods}
                                            title={!hasPgMethods ? 'Payment Gateway tidak aktif' : 'Bayar DP via PG'}
                                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${!hasPgMethods
                                                    ? 'opacity-40 bg-muted border-border text-muted-foreground cursor-not-allowed'
                                                    : dpPaymentType === 'pg'
                                                        ? 'border-primary bg-primary/10 text-primary font-bold'
                                                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                                                }`}
                                        >
                                            Online PG {hasPgMethods ? '(QRIS / VA)' : '(Non-aktif)'}
                                        </button>
                                    </div>

                                    {/* Offline DP Methods */}
                                    {dpPaymentType === 'offline' && (
                                        <div className="space-y-3 pt-1">
                                            <PaymentMethodCards
                                                methods={offlineMethods}
                                                selectedMethodId={selectedDpMethod?.id}
                                                onSelect={(m) => setSelectedDpMethod(m)}
                                            />

                                            {selectedDpMethod?.type === 'cash' && (
                                                <div className="space-y-2 rounded-lg bg-muted/20 p-3 border border-border">
                                                    <label className="text-xs font-semibold text-muted-foreground">
                                                        Uang Diterima Kasir
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={cashReceived ? fmt(cashReceived).replace('Rp', '') : ''}
                                                        onChange={(e) =>
                                                            setCashReceived(
                                                                parseInt(e.target.value.replace(/\D/g, '')) || 0,
                                                            )
                                                        }
                                                        placeholder="Rp0"
                                                        className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold focus:border-primary focus:outline-none"
                                                    />
                                                    <DenominationGrid
                                                        totalAmount={payNow}
                                                        currentValue={cashReceived}
                                                        onSelect={(val) => setCashReceived(val)}
                                                    />
                                                    {cashReceived >= payNow && (
                                                        <div className="flex justify-between text-xs pt-1">
                                                            <span className="text-muted-foreground">Kembalian:</span>
                                                            <span className="font-bold text-success">
                                                                {fmt(cashReceived - payNow)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Online PG DP Methods */}
                                    {dpPaymentType === 'pg' && hasPgMethods && (
                                        <div className="space-y-2 pt-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Pilih Channel Payment Gateway
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {pgMethods.map((pg) => (
                                                    <button
                                                        key={`${pg.provider}-${pg.payment_type}`}
                                                        type="button"
                                                        onClick={() => setSelectedPgMethod(pg)}
                                                        className={`rounded-lg border p-2.5 text-xs font-semibold uppercase transition ${selectedPgMethod?.payment_type === pg.payment_type
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : 'border-border bg-background text-muted-foreground'
                                                            }`}
                                                    >
                                                        {pg.payment_type.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Breakdown Summary */}
                        <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm shadow-sm">
                            {(subtotal > 0 || discount > 0 || tax > 0) && (
                                <div className="space-y-1 pb-2 border-b border-border text-xs text-muted-foreground">
                                    {subtotal > 0 && (
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>{fmt(subtotal)}</span>
                                        </div>
                                    )}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-destructive">
                                            <span>Diskon</span>
                                            <span>-{fmt(discount)}</span>
                                        </div>
                                    )}
                                    {tax > 0 && (
                                        <div className="flex justify-between">
                                            <span>Pajak</span>
                                            <span>+{fmt(tax)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Transaksi</span>
                                <span className="font-semibold">{fmt(displayTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Dibayar Sekarang (DP)</span>
                                <span className="font-semibold text-success">{fmt(payNow)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sisa Menjadi Hutang Baru</span>
                                <span className="font-bold text-destructive">{fmt(remainingDebt)}</span>
                            </div>
                            <div className="border-t border-border pt-2 flex justify-between text-xs">
                                <span className="text-muted-foreground">Hutang Sebelumnya</span>
                                <span>{fmt(previousDebt)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border">
                                <span>Total Hutang Setelah Transaksi</span>
                                <span className={isOverCreditLimit ? 'text-destructive' : 'text-foreground'}>
                                    {fmt(newTotalDebt)}
                                </span>
                            </div>
                            {isOverCreditLimit && (
                                <p className="text-xs text-destructive pt-1 flex items-center gap-1 font-semibold">
                                    <AlertTriangle size={13} />
                                    Melebihi limit kredit pelanggan ({fmt(creditLimit)})
                                </p>
                            )}
                        </div>

                        {/* Due Date & Notes */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Jatuh Tempo (Opsional)
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Catatan Kasbon</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Catatan..."
                                    className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={handlePaySubmit}
                            disabled={!canSubmit || isFinalizing}
                            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isFinalizing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                            {isFinalizing
                                ? 'Memproses...'
                                : payNow <= 0
                                    ? `Simpan Sebagai Hutang ${fmt(displayTotal)}`
                                    : dpPaymentType === 'pg'
                                        ? `Bayar DP ${fmt(payNow)} via Online PG`
                                        : remainingDebt > 0
                                            ? `Simpan — DP ${fmt(payNow)} & Hutang ${fmt(remainingDebt)}`
                                            : `Bayar Lunas ${fmt(displayTotal)}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
