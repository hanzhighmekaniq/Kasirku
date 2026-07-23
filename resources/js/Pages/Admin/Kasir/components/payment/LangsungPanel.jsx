import { useState, useMemo } from 'react';
import { Banknote, Copy, CreditCard, MousePointerClick, QrCode, Wallet } from 'lucide-react';
import { fmt } from '../helpers';

/**
 * LangsungPanel — grid of payment methods (non-debt), cash calculator, QR scan,
 * manual transfer with copyable account number.
 */
export default function LangsungPanel({
    paymentMethods,
    displayTotal,
    grandTotal,
    roundingAdjustment,
    cashRoundingEnabled,
    cashRoundingNearest,
    cashRoundingMode,
    roundingOverrideMode,
    setRoundingOverrideMode,
    roundingCustomValue,
    setRoundingCustomValue,
    onPay,
}) {
    const methods = paymentMethods.filter(m => m.type !== 'debt');
    const cashMethod = methods.find(m => m.type === 'cash');

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [cashReceived, setCashReceived] = useState(0);
    const [manualConfirmed, setManualConfirmed] = useState(false);
    const [showQr, setShowQr] = useState(false);

    const handleSelect = (m) => {
        setSelectedMethod(m);
        setCashReceived(0);
        setManualConfirmed(false);
        setShowQr(false);
    };

    const change = Math.max(0, cashReceived - displayTotal);
    const isCash = selectedMethod?.type === 'cash';
    const hasImage = !!selectedMethod?.image;
    const hasAccount = !!(selectedMethod?.account_number);

    const canPay = useMemo(() => {
        if (!selectedMethod) return false;
        if (isCash) return cashReceived >= displayTotal;
        if (hasImage && !showQr) return false; // must show QR first
        return manualConfirmed;
    }, [selectedMethod, isCash, cashReceived, displayTotal, hasImage, showQr, manualConfirmed]);

    const handlePay = () => {
        if (!canPay || !selectedMethod) return;
        onPay([{
            method_id: selectedMethod.id,
            amount: displayTotal,
            is_pg: false,
        }]);
    };

    const displayMethod = selectedMethod && methods.find(m => String(m.id) === String(selectedMethod.id));
    const Icon = displayMethod ? getIcon(displayMethod) : null;

    return (
        <div className="flex flex-1 flex-col">
            <div className="shrink-0 border-b border-border px-5 py-3.5">
                <h3 className="font-semibold text-foreground">Pilih Cara Bayar</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Total tagihan <span className="font-semibold text-foreground">{fmt(displayTotal)}</span>
                </p>
            </div>

            {/* Method grid */}
            <div className="shrink-0 grid grid-cols-4 gap-2 px-4 py-3">
                {methods.map(m => {
                    const Icon2 = getIcon(m);
                    return (
                        <button
                            key={m.id}
                            onClick={() => handleSelect(m)}
                            className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition text-xs font-medium ${
                                selectedMethod?.id === m.id
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                                    : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                        >
                            <Icon2 size={20} strokeWidth={1.8} />
                            <span className="text-center leading-tight">{m.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Method detail */}
            <div className="flex-1 overflow-auto px-4 pb-4">
                {!selectedMethod ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MousePointerClick size={28} className="mb-2 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Pilih salah satu metode pembayaran di atas.</p>
                    </div>
                ) : isCash ? (
                    /* Cash view */
                    <div className="space-y-3 pt-2">
                        {cashRoundingEnabled && (
                            <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-2">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pembulatan</p>
                                <div className="flex gap-1.5 flex-wrap">
                                    {[
                                        { v: 'store_default', l: `Default` },
                                        { v: 'down', l: `↓ ${fmt(Math.floor(grandTotal / cashRoundingNearest) * cashRoundingNearest)}` },
                                        { v: 'up', l: `↑ ${fmt(Math.ceil(grandTotal / cashRoundingNearest) * cashRoundingNearest)}` },
                                        { v: 'custom', l: 'Custom' },
                                    ].map(opt => (
                                        <button
                                            key={opt.v}
                                            onClick={() => setRoundingOverrideMode(opt.v)}
                                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                                                roundingOverrideMode === opt.v
                                                    ? 'bg-primary/10 text-primary border border-primary/30'
                                                    : 'bg-white text-muted-foreground border border-border hover:border-primary/30'
                                            }`}
                                        >
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                                {roundingOverrideMode === 'custom' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Rp</span>
                                        <input
                                            type="number"
                                            value={roundingCustomValue}
                                            onChange={(e) => setRoundingCustomValue(e.target.value)}
                                            placeholder={String(displayTotal)}
                                            className="flex-1 rounded-lg border border-border bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-baseline justify-between rounded-lg border border-border bg-muted/30 p-3">
                            <span className="text-sm text-muted-foreground">Total Tagihan</span>
                            <span className="text-xl font-bold">{fmt(displayTotal)}</span>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Uang Diterima</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={cashReceived ? fmt(cashReceived).replace('Rp', '') : ''}
                                onChange={(e) => {
                                    const n = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                    setCashReceived(n);
                                }}
                                placeholder="Rp0"
                                className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-3 text-lg font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[displayTotal, Math.ceil(displayTotal / 10000) * 10000, Math.ceil(displayTotal / 50000) * 50000]
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setCashReceived(v)}
                                        className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                                            cashReceived === v
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border bg-white hover:border-primary/40 hover:text-primary'
                                        }`}
                                    >
                                        {fmt(v)}
                                    </button>
                                ))}
                        </div>

                        {cashReceived > 0 && (
                            <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dibayar</span>
                                    <span className="font-medium">{fmt(cashReceived)}</span>
                                </div>
                                <div className="border-t border-border pt-1.5 flex items-baseline justify-between">
                                    <span className="text-muted-foreground">Kembalian</span>
                                    <span className={`text-2xl font-bold ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {fmt(change)}
                                    </span>
                                </div>
                            </div>
                        )}
                        {cashReceived > 0 && cashReceived < displayTotal && (
                            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                Uang diterima masih kurang {fmt(displayTotal - cashReceived)}
                            </div>
                        )}

                        <button
                            onClick={handlePay}
                            disabled={!canPay}
                            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Bayar {fmt(displayTotal)}
                        </button>
                    </div>
                ) : hasImage ? (
                    /* QRIS / QR view */
                    <div className="space-y-3 pt-2">
                        <div className="flex items-baseline justify-between rounded-lg border border-border bg-muted/30 p-3">
                            <span className="text-sm text-muted-foreground">Total Pembayaran</span>
                            <span className="text-xl font-bold">{fmt(displayTotal)}</span>
                        </div>
                        {!showQr ? (
                            <button
                                onClick={() => setShowQr(true)}
                                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition hover:border-primary hover:bg-primary/5"
                            >
                                <Icon size={36} className="text-muted-foreground" strokeWidth={1.5} />
                                <span className="font-medium text-foreground">Tampilkan {selectedMethod.name}</span>
                                <span className="text-xs text-muted-foreground">Klik untuk menampilkan QR ke pelanggan</span>
                            </button>
                        ) : (
                            <div className="flex flex-col items-center rounded-lg border border-border p-5">
                                <img
                                    src={`/storage/${selectedMethod.image}`}
                                    alt={selectedMethod.name}
                                    className="h-48 w-48 rounded-xl object-contain"
                                />
                                <p className="mt-2 text-xs text-muted-foreground">Scan dengan aplikasi pembayaran pelanggan</p>
                            </div>
                        )}
                        <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={manualConfirmed}
                                onChange={(e) => setManualConfirmed(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded accent-primary"
                            />
                            <div>
                                <div className="text-sm font-medium">Pembayaran sudah diterima</div>
                                <div className="text-xs text-muted-foreground">Centang setelah pembayaran berhasil</div>
                            </div>
                        </label>
                        <button
                            onClick={handlePay}
                            disabled={!canPay}
                            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Konfirmasi Pembayaran
                        </button>
                    </div>
                ) : hasAccount ? (
                    /* Manual transfer / e-wallet view */
                    <div className="space-y-3 pt-2">
                        <div className="flex items-baseline justify-between rounded-lg border border-border bg-muted/30 p-3">
                            <span className="text-sm text-muted-foreground">Total Pembayaran</span>
                            <span className="text-xl font-bold">{fmt(displayTotal)}</span>
                        </div>
                        <div className="rounded-lg border border-border p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                                <Icon size={16} strokeWidth={1.8} />
                                {selectedMethod.name}{selectedMethod.provider ? ` (${selectedMethod.provider})` : ''}
                            </div>
                            <div>
                                <div className="text-2xl font-bold tracking-wider select-all">{selectedMethod.account_number}</div>
                                {selectedMethod.account_name && (
                                    <div className="text-sm text-muted-foreground mt-0.5">a.n. {selectedMethod.account_name}</div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    if (navigator.clipboard) navigator.clipboard.writeText(selectedMethod.account_number);
                                }}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium transition hover:bg-muted"
                            >
                                <Copy size={14} strokeWidth={2} />
                                Salin Nomor
                            </button>
                        </div>
                        <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={manualConfirmed}
                                onChange={(e) => setManualConfirmed(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded accent-primary"
                            />
                            <div>
                                <div className="text-sm font-medium">Pembayaran sudah diterima</div>
                                <div className="text-xs text-muted-foreground">Verifikasi mutasi masuk sebelum konfirmasi</div>
                            </div>
                        </label>
                        <button
                            onClick={handlePay}
                            disabled={!canPay}
                            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Konfirmasi Pembayaran
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function getIcon(method) {
    const c = method.code?.toLowerCase();
    if (c === 'cash' || method.type === 'cash') return Banknote;
    if (c === 'qris') return QrCode;
    if (c === 'card' || method.type === 'card') return CreditCard;
    return Wallet;
}
