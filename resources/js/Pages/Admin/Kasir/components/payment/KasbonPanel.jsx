import { useState, useMemo } from 'react';
import { AlertTriangle, NotebookPen, Scale, Search, UserPlus } from 'lucide-react';
import { fmt } from '../helpers';

/**
 * KasbonPanel — customer selector, Full / Partial debt, optional due date.
 */
export default function KasbonPanel({
    paymentMethods,
    pgMethods,
    displayTotal,
    grandTotal,
    selectedCustomer,
    customers,
    onSelectCustomer,
    onPay,
}) {
    const debtMethod = paymentMethods.find(m => m.type === 'debt');

    const [customerQuery, setCustomerQuery] = useState('');
    const [kasbonType, setKasbonType] = useState(null); // full | partial
    const [payNow, setPayNow] = useState(0);
    const [dueDate, setDueDate] = useState('');
    const [note, setNote] = useState('');
    const [subMode, setSubMode] = useState(null); // langsung | gateway (for partial)
    const [subMethod, setSubMethod] = useState(null);

    const customer = useMemo(
        () => customers.find(c => String(c.id) === String(selectedCustomer)),
        [customers, selectedCustomer],
    );

    const filteredCustomers = useMemo(() => {
        if (!customerQuery.trim()) return customers;
        const q = customerQuery.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.code?.toLowerCase().includes(q),
        );
    }, [customers, customerQuery]);

    const availableCredit = customer
        ? (customer.credit_limit ?? 0) - (customer.debt_balance ?? 0)
        : 0;

    const changeCustomer = () => {
        onSelectCustomer(null);
        setKasbonType(null);
        setPayNow(0);
        setSubMode(null);
        setSubMethod(null);
    };

    const handlePay = () => {
        if (!debtMethod) return;
        if (kasbonType === 'full') {
            onPay('full', displayTotal, dueDate || null, note || null);
        } else if (kasbonType === 'partial' && payNow > 0 && payNow <= displayTotal) {
            const debt = displayTotal - payNow;
            const subPayments = subMode === 'gateway'
                ? [{
                    method_id: debtMethod.id,
                    amount: debt,
                    is_pg: false,
                }]
                : [{
                    method_id: debtMethod.id,
                    amount: debt,
                    is_pg: false,
                }];
            onPay('partial', debt, dueDate || null, note || null, subPayments);
        }
    };

    const canPayInPartial = payNow > 0 && payNow <= displayTotal;

    return (
        <div className="flex flex-1 flex-col">
            <div className="shrink-0 border-b border-border px-5 py-3.5">
                <h3 className="font-semibold flex items-center gap-2">
                    <NotebookPen size={16} strokeWidth={2} />
                    Hutang / Kasbon
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Total transaksi <span className="font-semibold text-foreground">{fmt(displayTotal)}</span>
                </p>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
                {!customer ? (
                    /* Customer Picker */
                    <>
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            <AlertTriangle size={14} strokeWidth={2} />
                            Pilih pelanggan terlebih dahulu untuk melanjutkan transaksi kasbon
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pelanggan Kasbon</label>
                            <div className="relative mt-1.5">
                                <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
                                <input
                                    value={customerQuery}
                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                    placeholder="Cari nama / nomor HP pelanggan..."
                                    className="block w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5 max-h-60 overflow-auto">
                            {filteredCustomers.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">Tidak ada pelanggan ditemukan</p>
                            ) : (
                                filteredCustomers.map(c => {
                                    const cCredit = (c.credit_limit ?? 0) - (c.debt_balance ?? 0);
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => onSelectCustomer(c.id)}
                                            className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary"
                                        >
                                            <div>
                                                <div className="text-sm font-medium">{c.name}</div>
                                                <div className="text-xs text-muted-foreground">{c.phone}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Hutang saat ini</div>
                                                <div className="font-medium text-sm text-destructive">{fmt(c.debt_balance ?? 0)}</div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted">
                            <UserPlus size={14} strokeWidth={2} />
                            Daftarkan Pelanggan Baru
                        </button>
                    </>
                ) : (
                    /* After customer selected */
                    <>
                        <div className="rounded-lg border border-border p-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-semibold">{customer.name}</div>
                                    <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                </div>
                                <button onClick={changeCustomer} className="text-xs font-medium text-primary hover:underline">
                                    Ganti Pelanggan
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                                <div>
                                    <div className="text-muted-foreground">Hutang Sebelumnya</div>
                                    <div className="font-semibold text-sm text-destructive">{fmt(customer.debt_balance ?? 0)}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Limit Kasbon</div>
                                    <div className="font-semibold text-sm">{fmt(customer.credit_limit ?? 0)}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Sisa Limit</div>
                                    <div className="font-semibold text-sm text-success">{fmt(availableCredit)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { setKasbonType('full'); setPayNow(0); setSubMode(null); setSubMethod(null); }}
                                className={`flex flex-col gap-1 rounded-lg border-2 p-3.5 text-left transition ${
                                    kasbonType === 'full'
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border bg-card hover:border-primary/30'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-medium">
                                    <NotebookPen size={14} strokeWidth={2} />
                                    Hutang Full
                                </div>
                                <div className="text-xs text-muted-foreground">Seluruh {fmt(displayTotal)} masuk kasbon</div>
                            </button>
                            <button
                                onClick={() => { setKasbonType('partial'); setPayNow(Math.ceil(displayTotal / 2)); setSubMode(null); setSubMethod(null); }}
                                className={`flex flex-col gap-1 rounded-lg border-2 p-3.5 text-left transition ${
                                    kasbonType === 'partial'
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border bg-card hover:border-primary/30'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-medium">
                                    <Scale size={14} strokeWidth={2} />
                                    Bayar Sebagian
                                </div>
                                <div className="text-xs text-muted-foreground">Bayar sebagian, sisa jadi kasbon</div>
                            </button>
                        </div>

                        {kasbonType === 'full' && (
                            <div className="space-y-3">
                                <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Total Transaksi</span><span>{fmt(displayTotal)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Dibayar Sekarang</span><span>Rp0</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Masuk Kasbon</span><span className="font-medium">{fmt(displayTotal)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Hutang Sebelumnya</span><span>{fmt(customer.debt_balance ?? 0)}</span></div>
                                    <div className="border-t border-border pt-1.5 flex items-baseline justify-between">
                                        <span className="font-medium">Total Hutang Setelah Transaksi</span>
                                        <span className="text-xl font-bold text-destructive">{fmt(Number(customer.debt_balance ?? 0) + Number(displayTotal))}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Jatuh Tempo (opsional)</label>
                                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Catatan Kasbon</label>
                                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan..."
                                            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                                    </div>
                                </div>
                                <button onClick={handlePay}
                                    className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90">
                                    Simpan Sebagai Hutang {fmt(displayTotal)}
                                </button>
                            </div>
                        )}

                        {kasbonType === 'partial' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bayar Sekarang</label>
                                    <input type="text" inputMode="numeric"
                                        value={payNow ? fmt(payNow).replace('Rp', '') : ''}
                                        onChange={(e) => setPayNow(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                                        placeholder="Rp0"
                                        className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3 py-3 text-lg font-semibold text-foreground focus:border-primary focus:outline-none" />
                                </div>
                                {payNow > displayTotal && (
                                    <div className="text-xs text-destructive">Tidak boleh melebihi total transaksi</div>
                                )}
                                <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{fmt(displayTotal)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Dibayar Sekarang</span><span className="text-success">{fmt(Math.min(payNow, displayTotal))}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Sisa Menjadi Hutang</span><span className="font-medium">{fmt(Math.max(0, displayTotal - payNow))}</span></div>
                                    <div className="border-t border-border pt-1.5 flex items-baseline justify-between">
                                        <span className="font-medium">Total Hutang Baru</span>
                                        <span className="text-lg font-bold text-destructive">{fmt(Number(customer.debt_balance ?? 0) + Math.max(0, Number(displayTotal) - Number(payNow)))}</span>
                                    </div>
                                </div>
                                <button onClick={handlePay} disabled={!canPayInPartial}
                                    className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {canPayInPartial ? `Simpan — Hutang ${fmt(Math.max(0, displayTotal - payNow))}` : 'Masukkan nominal pembayaran'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
