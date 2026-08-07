import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    Clock,
    Copy,
    CreditCard,
    QrCode,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : null;

const PAYMENT_TYPES = [
    { key: "qris", label: "QRIS", icon: QrCode },
    { key: "bca_va", label: "VA BCA", icon: CreditCard },
    { key: "mandiri_va", label: "VA Mandiri", icon: CreditCard },
    { key: "bri_va", label: "VA BRI", icon: CreditCard },
    { key: "bni_va", label: "VA BNI", icon: CreditCard },
    { key: "gopay", label: "GoPay", icon: CreditCard },
    { key: "shopeepay", label: "ShopeePay", icon: CreditCard },
    { key: "dana", label: "DANA", icon: CreditCard },
    { key: "ovo", label: "OVO", icon: CreditCard },
];

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
        >
            {copied ? (
                <>
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                    Disalin
                </>
            ) : (
                <>
                    <Copy className="h-3 w-3" strokeWidth={2} />
                    Salin
                </>
            )}
        </button>
    );
}

function PgCheckoutPanel({ order, pgData: initialPgData }) {
    // Jika pgData ada tapi tidak punya QR/VA/URL (transaksi lama sebelum fix),
    // fallback ke null supaya user bisa memilih metode baru
    const hasDisplayablePayment = (d) =>
        d && (d.qr_code || d.qr_image_url || d.va_number || d.payment_url);

    const [paymentType, setPaymentType] = useState(
        initialPgData?.payment_type ?? "qris"
    );
    const [pgData, setPgData] = useState(
        hasDisplayablePayment(initialPgData) ? initialPgData : null
    );
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const pollRef = useRef(null);

    const handlePay = async () => {
        setProcessing(true);
        setError(null);

        try {
            const res = await fetch(route("admin.plan.orders.pay", order.id), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-XSRF-TOKEN": decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ""
                    ),
                },
                body: JSON.stringify({ payment_type: paymentType }),
            });

            const data = await res.json();

            if (data.success) {
                setPgData(data);
            } else {
                setError(data.message || "Gagal membuat transaksi pembayaran.");
            }
        } catch (e) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setProcessing(false);
        }
    };

    const handleChangeMethod = async () => {
        if (!confirm("Ganti metode pembayaran? Kamu hanya bisa mengganti 1 kali.")) return;
        setProcessing(true);
        setError(null);

        try {
            const res = await fetch(route("admin.plan.orders.change-method", order.id), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-XSRF-TOKEN": decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ""
                    ),
                },
            });

            const data = await res.json();

            if (data.success) {
                setPgData(null);
            } else {
                setError(data.message || "Gagal mengganti metode pembayaran.");
            }
        } catch (e) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setProcessing(false);
        }
    };

    // Auto-poll status
    useEffect(() => {
        if (!pgData || pgData.status === "paid") return;

        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(route("admin.plan.orders.status", order.id), {
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                    },
                });
                const data = await res.json();

                if (data.order_status === "paid") {
                    clearInterval(pollRef.current);
                    router.visit(route("admin.plan.index"), {
                        only: ["flash"],
                        data: { success: "Pembayaran berhasil! Paket kamu sudah aktif." },
                    });
                }
            } catch (e) {
                // Biarkan polling coba lagi
            }
        }, 3000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [pgData, order.id]);

    // Redirect ke payment URL jika ada (hanya untuk e-wallet yang butuh redirect)
    useEffect(() => {
        if (pgData?.payment_url && !pgData?.qr_code && !pgData?.qr_image_url && !pgData?.va_number) {
            window.open(pgData.payment_url, "_blank");
        }
    }, [pgData]);

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/60 px-6 py-4">
                <h3 className="text-sm font-bold text-foreground">Pembayaran Online</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Pilih metode pembayaran dan selesaikan transaksi
                </p>
            </div>

            <div className="p-6 space-y-4">
                {error && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {!pgData ? (
                    <>
                        {/* Payment type selector */}
                        <div>
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Metode Pembayaran</p>
                            <div className="grid grid-cols-3 gap-2">
                                {PAYMENT_TYPES.map((pt) => {
                                    const Icon = pt.icon;
                                    return (
                                        <button
                                            key={pt.key}
                                            type="button"
                                            onClick={() => setPaymentType(pt.key)}
                                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                                paymentType === pt.key
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted"
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                                            {pt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pay button */}
                        <button
                            onClick={handlePay}
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                <CreditCard className="h-4 w-4" strokeWidth={2.5} />
                            )}
                            {processing ? "Memproses..." : `Bayar ${fmt(order.amount)}`}
                        </button>
                    </>
                ) : (
                    <>
                        {/* QR Code display - support qr_image_url (Midtrans QRIS) */}
                        {(pgData.qr_image_url || pgData.qr_code) && (
                            <div className="flex flex-col items-center gap-3">
                                <div className="rounded-xl border border-border bg-white p-4">
                                    <img
                                        src={pgData.qr_image_url || pgData.qr_code}
                                        alt="QR Code Pembayaran"
                                        className="h-48 w-48"
                                    />
                                </div>
                                <p className="text-center text-xs text-muted-foreground">
                                    Scan QR Code di atas menggunakan aplikasi bank atau e-wallet kamu
                                </p>
                            </div>
                        )}

                        {/* VA Number display */}
                        {pgData.va_number && (
                            <div className="flex flex-col items-center gap-3">
                                <div className="rounded-xl border border-border bg-muted p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Virtual Account</p>
                                    <p className="text-lg font-bold font-mono text-foreground">
                                        {pgData.va_number}
                                    </p>
                                    {pgData.va_bank && (
                                        <p className="text-xs text-muted-foreground mt-1">{pgData.va_bank}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">Salin nomor VA:</p>
                                    <CopyButton text={pgData.va_number} />
                                </div>
                            </div>
                        )}

                        {/* Payment URL */}
                        {pgData.payment_url && !pgData.qr_code && !pgData.va_number && (
                            <div className="flex flex-col items-center gap-3">
                                <a
                                    href={pgData.payment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                                >
                                    Buka Halaman Pembayaran
                                </a>
                                <p className="text-xs text-muted-foreground">
                                    Halaman pembayaran akan terbuka di tab baru
                                </p>
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center justify-center gap-2 rounded-xl bg-warning/10 px-4 py-3">
                            <Clock className="h-4 w-4 text-warning animate-pulse" strokeWidth={2} />
                            <p className="text-sm font-medium text-warning">
                                Menunggu pembayaran...
                            </p>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            Status akan diperiksa otomatis setiap 3 detik. Kamu juga bisa memuat ulang halaman ini.
                        </p>

                        {/* Tombol Ganti Pembayaran */}
                        {order.can_change_payment_method && (
                            <button
                                onClick={handleChangeMethod}
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
                            >
                                Ganti Metode Pembayaran
                            </button>
                        )}
                        {!order.can_change_payment_method && (
                            <p className="text-center text-xs text-destructive/80">
                                Batas ganti metode pembayaran sudah tercapai.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function PlanConfirm({ order, pgData = null, billingConfig = {} }) {
    const waUrl = billingConfig.whatsapp
        ? `https://wa.me/${billingConfig.whatsapp}?text=${encodeURIComponent(billingConfig.whatsapp_message ?? '')}`
        : null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.plan.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Konfirmasi Order</h2>
                        <p className="text-xs text-muted-foreground">
                            {order.idempotency_key}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Konfirmasi Order — ${order.idempotency_key}`} />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Kolom kiri — Ringkasan Order */}
                <div className="space-y-5 lg:col-span-2">
                    {/* Ringkasan order */}
                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">Ringkasan Order</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {[
                                { label: "Paket", value: order.plan_label },
                                { label: "Periode", value: order.period_label },
                                ...(order.is_prorated && order.original_amount ? [
                                    {
                                        label: "Harga Penuh",
                                        value: (
                                            <span className="line-through text-muted-foreground">
                                                {fmt(order.original_amount)}
                                            </span>
                                        ),
                                    },
                                    {
                                        label: "Harga Prorasi",
                                        value: (
                                            <span className="text-success font-semibold">
                                                Hemat {fmt(order.original_amount - order.amount)}
                                            </span>
                                        ),
                                    },
                                ] : []),
                                { label: "Total", value: fmt(order.amount), bold: true },
                                {
                                    label: "Aktif sampai",
                                    value: fmtDate(order.plan_active_until) ?? "—",
                                },
                                {
                                    label: "Kode Referensi",
                                    value: (
                                        <span className="inline-flex items-center font-mono text-sm">
                                            {order.idempotency_key}
                                            <CopyButton text={order.idempotency_key} />
                                        </span>
                                    ),
                                },
                                {
                                    label: "Status",
                                    value: (
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            order.status === "paid"
                                                ? "bg-success/10 text-success"
                                                : order.status === "pending"
                                                ? "bg-warning/10 text-warning"
                                                : "bg-muted text-muted-foreground"
                                        }`}>
                                            {order.status === "paid" ? "Lunas" : order.status === "pending" ? "Menunggu Pembayaran" : order.status}
                                        </span>
                                    ),
                                },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between gap-3 px-6 py-3.5">
                                    <p className="text-sm text-muted-foreground">{row.label}</p>
                                    <div className={`text-sm text-right ${row.bold ? "font-bold text-foreground text-base" : "text-foreground"}`}>
                                        {row.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tombol aksi */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {waUrl && order.status === "pending" && (
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Konfirmasi via WhatsApp
                            </a>
                        )}

                        {billingConfig.email && order.status === "pending" && (
                            <a
                                href={`mailto:${billingConfig.email}?subject=Konfirmasi+Pembayaran+${order.idempotency_key}`}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                            >
                                Kirim Email
                            </a>
                        )}

                        {order.status !== "pending" && (
                            <Link
                                href={route("admin.plan.index")}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                                <Check className="h-4 w-4" strokeWidth={2.5} />
                                Kembali ke Paket
                            </Link>
                        )}
                    </div>

                    {order.status === "pending" && order.is_manual && (
                        <p className="text-center text-xs text-muted-foreground">
                            <Clock className="inline h-3 w-3 mr-0.5" strokeWidth={2} />
                            Setelah pembayaran dikonfirmasi admin, paket kamu langsung aktif secara otomatis.
                        </p>
                    )}
                </div>

                {/* Kolom kanan — Pembayaran (sticky) */}
                <div className="space-y-5 lg:sticky lg:top-16 lg:self-start">
                    {/* PG Checkout (mode auto) */}
                    {!order.is_manual && order.status === "pending" && (
                        <PgCheckoutPanel order={order} pgData={pgData} />
                    )}

                    {/* Instruksi pembayaran manual */}
                    {order.is_manual && order.status === "pending" && (
                        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="border-b border-border bg-muted/60 px-6 py-4">
                                <h3 className="text-sm font-bold text-foreground">
                                    Instruksi Pembayaran
                                </h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Lakukan transfer sesuai nominal di atas ke rekening berikut
                                </p>
                            </div>

                            {(billingConfig.bank_name || billingConfig.bank_account) ? (
                                <div className="divide-y divide-border">
                                    {billingConfig.bank_name && (
                                        <div className="flex items-center justify-between gap-3 px-6 py-3.5">
                                            <p className="text-sm text-muted-foreground">Bank</p>
                                            <p className="font-semibold text-foreground">
                                                {billingConfig.bank_name}
                                            </p>
                                        </div>
                                    )}
                                    {billingConfig.bank_account && (
                                        <div className="flex items-center justify-between gap-3 px-6 py-3.5">
                                            <p className="text-sm text-muted-foreground">No. Rekening</p>
                                            <span className="inline-flex items-center font-mono font-bold text-foreground">
                                                {billingConfig.bank_account}
                                                <CopyButton text={billingConfig.bank_account} />
                                            </span>
                                        </div>
                                    )}
                                    {billingConfig.bank_holder && (
                                        <div className="flex items-center justify-between gap-3 px-6 py-3.5">
                                            <p className="text-sm text-muted-foreground">Atas Nama</p>
                                            <p className="font-semibold text-foreground">
                                                {billingConfig.bank_holder}
                                            </p>
                                        </div>
                                    )}
                                    <div className="px-6 py-3.5">
                                        <p className="text-xs text-muted-foreground">
                                            Sertakan kode referensi{" "}
                                            <span className="font-mono font-semibold text-foreground">
                                                {order.idempotency_key}
                                            </span>{" "}
                                            di berita transfer atau saat menghubungi admin.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-6 py-5 text-sm text-muted-foreground">
                                    Hubungi admin untuk info rekening transfer.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
