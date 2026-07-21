import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import Button from '@/Components/ui/Button';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);

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

/**
 * Modal yang tampil setelah kasir minta PG transaction.
 * Polling status setiap 3 detik sampai paid/expired.
 */
export default function PGPaymentModal({ pgData, amount, onSuccess, onClose }) {
    const [status, setStatus]     = useState('pending'); // pending | paid | expired | failed
    const [timeLeft, setTimeLeft] = useState(15 * 60);   // 15 menit countdown
    const [copied, setCopied]     = useState(false);
    const intervalRef = useRef(null);
    const countdownRef = useRef(null);

    const meta = METHOD_META[pgData.payment_type] ?? { label: pgData.payment_type, icon: '💳', hint: '' };

    // ── Polling ────────────────────────────────────
    useEffect(() => {
        const poll = async () => {
            try {
                const { data } = await axios.get(route('admin.payment-gateway.status', pgData.pg_trx_id));
                setStatus(data.status);
                if (data.status === 'paid') {
                    clearInterval(intervalRef.current);
                    clearInterval(countdownRef.current);
                    setTimeout(() => onSuccess(data), 800); // brief delay buat UX
                } else if (['expired', 'failed'].includes(data.status)) {
                    clearInterval(intervalRef.current);
                    clearInterval(countdownRef.current);
                }
            } catch { /* silent */ }
        };

        intervalRef.current  = setInterval(poll, 3000);
        countdownRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);

        return () => {
            clearInterval(intervalRef.current);
            clearInterval(countdownRef.current);
        };
    }, []);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const copyVA = () => {
        navigator.clipboard.writeText(pgData.va_number ?? '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm rounded-2xl bg-card shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h3 className="font-semibold text-foreground">{meta.icon} {meta.label}</h3>
                        <p className="text-xs text-muted-foreground">{meta.hint}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-5 space-y-4">
                    {/* Amount */}
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total Pembayaran</p>
                        <p className="text-2xl font-bold text-primary-700">{fmt(amount)}</p>
                    </div>

                    {/* Status indicator */}
                    <div className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold ${
                        status === 'paid'    ? 'bg-success/10 text-success' :
                        status === 'expired' ? 'bg-destructive/10 text-destructive'         :
                        status === 'failed'  ? 'bg-destructive/10 text-destructive'         :
                                              'bg-amber-50 text-amber-700'
                    }`}>
                        {status === 'paid' && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        {status === 'pending' && (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        )}
                        {{
                            pending: `Menunggu pembayaran… ${formatTime(timeLeft)}`,
                            paid:    'Pembayaran berhasil! ✓',
                            expired: 'Waktu habis',
                            failed:  'Pembayaran gagal',
                        }[status] ?? status}
                    </div>

                    {/* QR Code — render as actual scannable image */}
                    {(pgData.qr_code || pgData.qr_image_url) && status === 'pending' && (
                        <div className="flex flex-col items-center">
                            <div className="rounded-2xl border border-border bg-card p-4">
                                {pgData.qr_image_url ? (
                                    /* Use Midtrans QR image URL (actual scannable QR) */
                                    <img src={pgData.qr_image_url} alt="QR Code" className="h-52 w-52" />
                                ) : pgData.qr_code.startsWith('http') ? (
                                    /* qr_code is already an image URL */
                                    <img src={pgData.qr_code} alt="QR Code" className="h-52 w-52" />
                                ) : (
                                    /* qr_code is a raw QRIS payload string — render via QR API */
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=208x208&data=${encodeURIComponent(pgData.qr_code)}`}
                                        alt="QRIS QR Code"
                                        className="h-52 w-52"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                )}
                                {/* Hidden fallback — shown only if all QR image methods fail */}
                                <div className="hidden h-52 w-52 items-center justify-center rounded-xl bg-muted p-2">
                                    <p className="break-all text-center text-[10px] text-muted-foreground font-mono leading-tight">{pgData.qr_code}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">Scan dengan kamera HP atau aplikasi pembayaran</p>
                        </div>
                    )}

                    {/* VA Number */}
                    {pgData.va_number && (
                        <div className="rounded-xl border border-border bg-muted p-4 text-center">
                            <p className="mb-1 text-xs text-muted-foreground">{pgData.va_bank?.toUpperCase()} Virtual Account</p>
                            <p className="text-xl font-bold tracking-widest text-foreground font-mono">{pgData.va_number}</p>
                            <button
                                type="button"
                                onClick={copyVA}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                            >
                                {copied ? '✓ Disalin' : 'Salin Nomor VA'}
                            </button>
                        </div>
                    )}

                    {/* Payment URL — show when there's a redirect URL (e.g. e-wallet) */}
                    {pgData.payment_url && status === 'pending' && (
                        <Button
                            as="a"
                            href={pgData.payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-center"
                        >
                            {pgData.qr_code ? 'Buka di Aplikasi Pembayaran →' : 'Buka Halaman Pembayaran →'}
                        </Button>
                    )}

                    {/* Expired/failed actions */}
                    {['expired', 'failed'].includes(status) && (
                        <button onClick={onClose} className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">
                            Tutup & Coba Lagi
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
