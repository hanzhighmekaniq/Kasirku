
import { useEffect, useRef, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import axios from 'axios';
import Button from '@/Components/ui/Button';
import { PG_METHOD_LABELS, fmt } from '../helpers';

// ── Constants ──────────────────────────────────────

const AMBIGUOUS_STATUSES = ['unknown', 'checking'];

const STATUS_LABEL = {
    initiating: 'Menyiapkan pembayaran…',
    pending: 'Menunggu pembayaran…',
    unknown: 'Status pembayaran belum dapat dipastikan. Sedang memeriksa…',
    checking: 'Memeriksa status ke penyedia pembayaran…',
    paid: 'Pembayaran berhasil! ✓',
    expired: 'Waktu habis',
    failed: 'Pembayaran belum berhasil',
};

const METHOD_META = {
    qris:       { label: 'QRIS',       icon: '📱', hint: 'Scan QR dengan aplikasi apapun' },
    gopay:      { label: 'GoPay',      icon: '🟢', hint: 'Buka GoPay → Bayar' },
    shopeepay:  { label: 'ShopeePay', icon: '🟠', hint: 'Buka ShopeePay → Bayar' },
    dana:       { label: 'DANA',       icon: '🔵', hint: 'Buka DANA → Bayar' },
    ovo:        { label: 'OVO',        icon: '🟣', hint: 'Buka OVO → Bayar' },
    bca_va:     { label: 'VA BCA',     icon: '🏦', hint: 'Transfer ke nomor VA BCA di bawah' },
    mandiri_va: { label: 'VA Mandiri', icon: '🏦', hint: 'Transfer ke nomor VA Mandiri di bawah' },
    bri_va:     { label: 'VA BRI',     icon: '🏦', hint: 'Transfer ke nomor VA BRI di bawah' },
    bni_va:     { label: 'VA BNI',     icon: '🏦', hint: 'Transfer ke nomor VA BNI di bawah' },
    permata_va: { label: 'VA Permata', icon: '🏦', hint: 'Transfer ke nomor VA Permata di bawah' },
};

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ── Component ──────────────────────────────────────

/**
 * GatewayPanel — saat tidak ada PG transaksi yang sedang berjalan,
 * tampilkan grid metode pembayaran. Begitu transaksi PG aktif,
 * tampilkan QR / VA / status / tombol retry secara inline (tidak
 * perlu modal terpisah).
 */
export default function GatewayPanel({
    pgMethods,
    displayTotal,
    onPay,
    pgTransaction,   // dari PaymentView — non-null saat PG charge sudah dibuat
    onPgSuccess,     // dipanggil saat polling lancar → paid
    onRetryPg,       // dipanggil saat user klik "Coba Lagi"
}) {
    // ── State ───────────────────────────────────────
    const [pendingMethod, setPendingMethod] = useState(null);
    const [error, setError] = useState(null);

    // PG inline state — di-sync via useEffect setiap pgTransaction berubah.
    // JANGAN pakai useState initial value dari pgTransaction — React hanya
    // pakai initial value di render pertama, re-render berikutnya diabaikan.
    const [pgStatus, setPgStatus] = useState('initiating');
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [pgTrxId, setPgTrxId] = useState(null);
    const [canRetry, setCanRetry] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [pollError, setPollError] = useState(null);
    const [copied, setCopied] = useState(false);
    const intervalRef = useRef(null);
    const countdownRef = useRef(null);

    const meta = pgTransaction
        ? (METHOD_META[pgTransaction.paymentType] ?? { label: 'PG', icon: '💳', hint: '' })
        : null;

    // ── Initiate PG charge (method grid click) ─────
    const handleSelect = async (pg) => {
        setPendingMethod(pg);
        setError(null);
        const result = await onPay(pg.provider, pg.payment_type);
        if (!result?.success) {
            setError(result?.message || 'Gagal membuat transaksi pembayaran online.');
            setPendingMethod(null);
        }
        // On success, the caller (PaymentView) will set pgTransaction
        // via the return value { is_pg: true, pgTransaction: {...} }
    };

    // ── Sync state dari pgTransaction prop ──────
    // Setiap pgTransaction berubah (baru dibuat, atau retry), reset semua state.
    useEffect(() => {
        if (!pgTransaction) {
            setPgTrxId(null);
            setPgStatus('initiating');
            return;
        }
        setPgTrxId(pgTransaction.pgTrxId);
        setPgStatus(pgTransaction.initialStatus || 'initiating');
        setCanRetry(!!pgTransaction.canRetry);
        setTimeLeft(15 * 60);
        setPollError(null);
    }, [pgTransaction]);

    // ── Polling (only when we have a pgTrxId) ───
    useEffect(() => {
        if (!pgTrxId) return;

        const poll = async () => {
            try {
                const { data } = await axios.get(route('admin.payment-gateway.status', pgTrxId));
                setPollError(null);
                setPgStatus(data.status);
                setCanRetry(!!data.can_retry);

                if (data.status === 'paid') {
                    clearInterval(intervalRef.current);
                    clearInterval(countdownRef.current);
                    setTimeout(() => onPgSuccess(data), 800);
                } else if (data.status === 'expired' || (data.status === 'failed' && !data.can_retry)) {
                    clearInterval(intervalRef.current);
                    clearInterval(countdownRef.current);
                } else if (data.status === 'failed' && data.can_retry) {
                    clearInterval(intervalRef.current);
                    clearInterval(countdownRef.current);
                }
            } catch (e) {
                setPollError(e.response?.data?.message || 'Gagal memeriksa status pembayaran. Mencoba lagi...');
            }
        };

        poll();
        intervalRef.current = setInterval(poll, 3000);
        countdownRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);

        return () => {
            clearInterval(intervalRef.current);
            clearInterval(countdownRef.current);
        };
    }, [pgTrxId]);

    // ── Retry ─────────────────────────────────────
    const handleRetryClick = async () => {
        if (!onRetryPg) return;
        setRetrying(true);
        setPollError(null);
        try {
            const result = await onRetryPg(pgTrxId);
            if (result?.pg_trx_id) {
                setPgTrxId(result.pg_trx_id);
            }
            if (result?.status) {
                setPgStatus(result.status);
            }
            setCanRetry(!!result?.can_retry);
            if (!result?.success && !result?.pg_trx_id) {
                setPollError(result?.message || 'Gagal mencoba ulang pembayaran.');
            }
        } finally {
            setRetrying(false);
        }
    };

    const copyVA = () => {
        navigator.clipboard.writeText(pgTransaction?.vaNumber ?? '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isAmbiguous = AMBIGUOUS_STATUSES.includes(pgStatus);
    const isFailedRetryable = pgStatus === 'failed' && canRetry;
    const isDeadEnd = (pgStatus === 'failed' && !canRetry) || pgStatus === 'expired';
    const showQRVA = (pgStatus === 'pending' || pgStatus === 'initiating');

    // Ada data pembayaran yang bisa ditampilkan?
    const hasPaymentData = pgTransaction && (
        pgTransaction.qrCode || pgTransaction.qrImageUrl ||
        pgTransaction.vaNumber || pgTransaction.paymentUrl
    );

    // ── Render: PG transaction active ─────────────
    if (pgTransaction) {
        return (
            <div className="flex flex-1 flex-col">
                <div className="shrink-0 border-b border-border px-5 py-3.5">
                    <h3 className="font-semibold text-foreground">{meta.icon} {meta.label}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{meta.hint}</p>
                </div>

                <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
                    {/* Amount */}
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total Pembayaran</p>
                        <p className="text-2xl font-bold text-primary-700">{fmt(pgTransaction.amount)}</p>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-sm font-semibold text-center ${
                        pgStatus === 'paid'    ? 'bg-success/10 text-success' :
                        pgStatus === 'expired' ? 'bg-destructive/10 text-destructive' :
                        pgStatus === 'failed'  ? (canRetry ? 'bg-amber-50 text-amber-700' : 'bg-destructive/10 text-destructive') :
                        isAmbiguous            ? 'bg-amber-50 text-amber-700' :
                                                  'bg-amber-50 text-amber-700'
                    }`}>
                        {pgStatus === 'paid' && (
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        )}
                        {(pgStatus === 'pending' || pgStatus === 'initiating' || isAmbiguous) && (
                            <svg className="h-4 w-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        )}
                        <span>{pgStatus === 'pending' ? `${STATUS_LABEL.pending} ${formatTime(timeLeft)}` : (STATUS_LABEL[pgStatus] ?? pgStatus)}</span>
                    </div>

                    {/* Polling error */}
                    {pollError && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{pollError}</div>
                    )}

                    {/* Tidak ada data pembayaran — tampilkan pesan yang jelas */}
                    {showQRVA && !hasPaymentData && !pollError && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
                            <div className="flex items-center justify-center gap-2">
                                <svg className="h-3.5 w-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                Menyiapkan data pembayaran dari penyedia...
                            </div>
                        </div>
                    )}

                    {/* QR Code */}
                    {(pgTransaction.qrCode || pgTransaction.qrImageUrl) && showQRVA && (
                        <div className="flex flex-col items-center">
                            <div className="rounded-2xl border border-border bg-card p-4">
                                {pgTransaction.qrImageUrl ? (
                                    <img src={pgTransaction.qrImageUrl} alt="QR Code" className="w-48 h-48" />
                                ) : pgTransaction.qrCode.startsWith('http') ? (
                                    <img src={pgTransaction.qrCode} alt="QR Code" className="w-48 h-48" />
                                ) : (
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(pgTransaction.qrCode)}`}
                                        alt="QRIS QR Code"
                                        className="w-48 h-48"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                )}
                                <div className="hidden w-48 h-48 items-center justify-center rounded-xl bg-muted p-2">
                                    <p className="break-all text-center text-[10px] text-muted-foreground font-mono leading-tight">{pgTransaction.qrCode}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">Scan dengan kamera HP atau aplikasi pembayaran</p>
                        </div>
                    )}

                    {/* VA Number */}
                    {pgTransaction.vaNumber && showQRVA && (
                        <div className="rounded-xl border border-border bg-muted p-4 text-center">
                            <p className="mb-1 text-xs text-muted-foreground">{pgTransaction.vaBank?.toUpperCase()} Virtual Account</p>
                            <p className="text-xl font-bold tracking-widest text-foreground font-mono">{pgTransaction.vaNumber}</p>
                            <button type="button" onClick={copyVA} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted">
                                {copied ? '✓ Disalin' : 'Salin Nomor VA'}
                            </button>
                        </div>
                    )}

                    {/* Payment URL */}
                    {pgTransaction.paymentUrl && showQRVA && (
                        <a href={pgTransaction.paymentUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center">
                            <Button className="w-full">{pgTransaction.qrCode ? 'Buka di Aplikasi →' : 'Buka Halaman Pembayaran →'}</Button>
                        </a>
                    )}

                    {/* Retry */}
                    {isFailedRetryable && (
                        <Button onClick={handleRetryClick} loading={retrying} className="w-full">
                            {retrying ? 'Mencoba lagi...' : 'Coba Lagi'}
                        </Button>
                    )}

                    {/* Dead-end */}
                    {isDeadEnd && (
                        <button onClick={() => window.location.reload()} className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">
                            Tutup & Pilih Metode Lain
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Render: method grid ────────────────────────
    return (
        <div className="flex flex-1 flex-col">
            <div className="shrink-0 border-b border-border px-5 py-3.5">
                <h3 className="font-semibold text-foreground">Payment Gateway</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Total <span className="font-semibold text-foreground">{fmt(displayTotal)}</span>
                </p>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
                {pgMethods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MousePointerClick size={28} className="mb-2 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Belum ada payment gateway aktif.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pilih Metode Pembayaran</p>
                        <div className="grid grid-cols-3 gap-2">
                            {pgMethods.map((pg, idx) => {
                                const lbl = PG_METHOD_LABELS[pg.payment_type] ?? { label: pg.payment_type, icon: '💳' };
                                const isQrisType = pg.payment_type === 'qris';
                                const isPending = pendingMethod?.payment_type === pg.payment_type && pendingMethod?.provider === pg.provider;
                                return (
                                    <button
                                        key={`${pg.provider}-${pg.payment_type}-${idx}`}
                                        onClick={() => handleSelect(pg)}
                                        disabled={!!pendingMethod}
                                        className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isQrisType
                                                ? 'col-span-3 border-primary/30 bg-primary/5 hover:border-primary'
                                                : 'border-border bg-card hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-lg">{lbl.icon}</span>
                                        <span className="text-center">{isPending ? 'Memproses...' : lbl.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {error && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
