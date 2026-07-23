import { useState } from 'react';
import { Check, ListChecks, Plus, Users, X } from 'lucide-react';
import { fmt } from '../helpers';

/**
 * SplitView — two split-by modes: Per Orang (editable amounts) and Per Item.
 * Each payer individually chooses Langsung / Kasbon / PG and pays one by one.
 */
export default function SplitView({ k, paymentMethods, pgMethods, saleId, saleNo, displayTotal, onDone }) {
    const [splitBy, setSplitBy] = useState('orang'); // orang | item
    const [people, setPeople] = useState(() => {
        const eq = Math.round(displayTotal / 2);
        return [
            { _id: Date.now(), name: 'Orang 1', amount: eq, method: null, paid: false, cashReceived: 0, customerId: null, gateway: null },
            { _id: Date.now() + 1, name: 'Orang 2', amount: displayTotal - eq, method: null, paid: false, cashReceived: 0, customerId: null, gateway: null },
        ];
    });

    const totalAllocated = people.reduce((s, p) => s + (p.amount || 0), 0);
    const remaining = displayTotal - totalAllocated;
    const paidCount = people.filter(p => p.paid).length;
    const allPaid = paidCount === people.length && remaining === 0;

    const updatePerson = (id, patch) => setPeople(prev => prev.map(p => p._id === id ? { ...p, ...patch } : p));

    const addPerson = () => {
        const id = Date.now();
        setPeople(prev => [...prev, { _id: id, name: `Orang ${prev.length + 1}`, amount: 0, method: null, paid: false, cashReceived: 0, customerId: null, gateway: null }]);
    };

    const handlePay = (person) => {
        if (!person.method) return;
        if (person.method === 'kasbon') {
            // Simple kasbon per payer — just mark paid for now
            updatePerson(person._id, { paid: true });
        } else {
            updatePerson(person._id, { paid: true });
        }
    };

    // Recalculate amounts in "item" mode
    const recalcItems = (cart) => {
        people.forEach(p => p._assignments = p._assignments || []);
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="shrink-0 border-b border-border px-5 py-3.5">
                <h3 className="font-semibold flex items-center gap-2">
                    Pisah Pembayaran
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Bagi transaksi {fmt(displayTotal)} ke beberapa pembayaran
                </p>
            </div>

            {/* Mode selector */}
            <div className="shrink-0 border-b border-border px-4 py-3">
                <div className="inline-flex w-full rounded-lg border border-border">
                    <button onClick={() => setSplitBy('orang')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-l-lg px-3 py-2 text-sm font-medium transition ${
                            splitBy === 'orang' ? 'bg-primary/10 text-primary' : 'bg-white text-muted-foreground hover:text-foreground'
                        }`}>
                        <Users size={14} /> Per Orang
                    </button>
                    <button onClick={() => setSplitBy('item')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-r-lg px-3 py-2 text-sm font-medium transition ${
                            splitBy === 'item' ? 'bg-primary/10 text-primary' : 'bg-white text-muted-foreground hover:text-foreground'
                        }`}>
                        <ListChecks size={14} /> Per Item
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
                {splitBy === 'orang' && (
                    <>
                        <p className="text-xs text-muted-foreground">Isi nominal setiap orang. Total harus tepat {fmt(displayTotal)}.</p>
                        {people.map(p => (
                            <div key={p._id} className="rounded-lg border border-border p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <input value={p.name} onChange={(e) => updatePerson(p._id, { name: e.target.value })}
                                        className="flex-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none" />
                                    <input type="text" inputMode="numeric"
                                        value={p.amount ? p.amount.toLocaleString('id-ID') : ''}
                                        onChange={(e) => updatePerson(p._id, { amount: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                                        className="w-32 rounded-lg border border-border bg-white px-2.5 py-1.5 text-right text-sm font-semibold focus:border-primary focus:outline-none"
                                        placeholder="Rp0" />
                                    {people.length > 2 && (
                                        <button onClick={() => setPeople(prev => prev.filter(x => x._id !== p._id))}
                                            className="text-muted-foreground/50 hover:text-destructive">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                {/* Method selector */}
                                {p.amount > 0 ? (
                                    <select value={p.method || ''}
                                        onChange={(e) => updatePerson(p._id, { method: e.target.value || null })}
                                        className="w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none">
                                        <option value="">Pilih metode...</option>
                                        {paymentMethods.filter(m => m.type !== 'debt').map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                        <option value="kasbon">Kasbon</option>
                                    </select>
                                ) : null}
                                {p.method && p.amount > 0 && !p.paid && (
                                    <button onClick={() => handlePay(p)}
                                        className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90">
                                        Bayar {fmt(p.amount)}
                                    </button>
                                )}
                                {p.paid && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-bold text-success">
                                        <Check size={10} /> Lunas
                                    </span>
                                )}
                            </div>
                        ))}
                        <button onClick={addPerson}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary">
                            <Plus size={14} /> Tambah Orang
                        </button>
                    </>
                )}

                {splitBy === 'item' && (
                    <>
                        <p className="text-xs text-muted-foreground">Pilih orang untuk setiap item.</p>
                        {k.cart.map((item, i) => {
                            const assigned = people.find(p => p._assignments?.includes(item.cartId));
                            return (
                                <div key={item.cartId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                                    <div>
                                        <div className="text-sm font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.qty} × {fmt(item.price)} = {fmt(item.qty * item.price)}</div>
                                    </div>
                                    <select
                                        value={assigned?._id || ''}
                                        onChange={(e) => {
                                            const pid = e.target.value;
                                            setPeople(prev => prev.map(p => {
                                                const filtered = (p._assignments || []).filter(a => a !== item.cartId);
                                                if (String(p._id) === pid) return { ...p, _assignments: [...filtered, item.cartId] };
                                                return { ...p, _assignments: filtered };
                                            }));
                                        }}
                                        className="w-36 rounded-lg border border-border bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none">
                                        <option value="">— Belum —</option>
                                        {people.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </>
                )}

                <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Sudah Dialokasikan</span><span className="font-medium">{fmt(totalAllocated)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Sisa</span>
                        <span className={`font-medium ${remaining === 0 ? 'text-success' : 'text-amber-600'}`}>{fmt(Math.abs(remaining))}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{paidCount} dari {people.length} pembayaran selesai</span>
                    <span className="font-semibold">{fmt(displayTotal)}</span>
                </div>
                {allPaid && (
                    <button onClick={() => onDone({ methodLabel: 'Split Bill', grandTotal: displayTotal, paid: displayTotal, change: 0, debtNow: 0, saleNo })}
                        className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90">
                        Selesaikan Transaksi
                    </button>
                )}
            </div>
        </div>
    );
}
