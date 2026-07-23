import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import Button from "@/Components/ui/Button";

export default function Show({ sale, paymentMethods, pgConfigs, canUpdateServiceStatus, canUpdateRentalStatus, canCheckInTicket, canCheckOutHospitality, canExitParking, canEndSession, storeType = "retail" }) {
    const { flash } = usePage().props;
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Page title & label per store type
    const PAGE_TITLE = {
        retail: "Penjualan",
        fnb: "Transaksi",
        service: "Transaksi Jasa",
        rental: "Transaksi Sewa",
        ticket: "Penjualan Tiket",
        hospitality: "Transaksi Penginapan",
        parking: "Transaksi Parkir",
        session: "Transaksi Sesi",
    };
    const pageTitle = PAGE_TITLE[storeType] ?? "Penjualan";

    const ORDER_TYPE_LABEL = {
        retail: "Tipe Pesanan",
        fnb: "Tipe Pesanan",
        service: "Tipe Layanan",
        rental: "Tipe Sewa",
        ticket: "Tipe Tiket",
        hospitality: "Tipe Menginap",
        parking: "Tipe Parkir",
        session: "Tipe Sesi",
    };
    const orderTypeLabel = ORDER_TYPE_LABEL[storeType] ?? "Tipe Pesanan";

    const {
        customer,
        user,
        items,
        payments,
        table,
        pg_transactions: pgTransactions,
    } = sale;
    const [checkingPgId, setCheckingPgId] = useState(null);
    const [showSwitchModal, setShowSwitchModal] = useState(
        () => new URLSearchParams(window.location.search).get("switch") === "1",
    );
    const [switching, setSwitching] = useState(false);
    const [switchMethod, setSwitchMethod] = useState(""); // payment_method_id
    const [switchPgType, setSwitchPgType] = useState(""); // PG payment_type (qris, gopay, etc.)

    /** Extract QR image URL or VA number from raw_response */
    const getPgDisplay = (trx) => {
        const raw = trx.raw_response || {};
        let qrImageUrl = null;
        if (raw.actions) {
            const genQr = (raw.actions || []).find(
                (a) => a.name === "generate-qr-code",
            );
            qrImageUrl = genQr?.url || raw.actions[0]?.url || null;
        }
        const vaNumber =
            raw.va_numbers?.[0]?.va_number || raw.permata_va_number || null;
        const vaBank = raw.va_numbers?.[0]?.bank || null;
        // Derive bank name from payment_type if raw_response doesn't have it
        const bankMap = {
            bca_va: "BCA",
            mandiri_va: "Mandiri",
            bri_va: "BRI",
            bni_va: "BNI",
            permata_va: "Permata",
        };
        const vaBankName = vaBank
            ? vaBank.toUpperCase()
            : bankMap[trx.payment_type] || null;
        const qrCode = raw.qr_string || raw.qr_code || null;
        const paymentUrl = raw.redirect_url || null;
        return { qrImageUrl, qrCode, vaNumber, vaBank: vaBankName, paymentUrl };
    };

    /** Poll PG status and refresh page */
    const checkPgStatus = async (pgTrxId) => {
        setCheckingPgId(pgTrxId);
        try {
            const { data } = await axios.get(
                route("admin.payment-gateway.status", pgTrxId),
            );
            if (
                data.status === "paid" ||
                data.status === "expired" ||
                data.status === "failed"
            ) {
                router.reload({ only: ["sale"] });
            }
        } catch (e) {
            console.error("PG status check failed", e);
        } finally {
            setCheckingPgId(null);
        }
    };

    const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
    const fmtDate = (d) =>
        new Date(d).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    const fmtShort = (d) =>
        new Date(d).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    const fmtTime = (d) =>
        new Date(d).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });

    const handleStatus = (status) => {
        setProcessing(true);
        router.patch(
            route("admin.sales.updateStatus", sale.id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setConfirmingStatus(null);
                },
            },
        );
    };

    const handleServiceStatus = (status) => {
        setProcessing(true);
        router.patch(
            route("admin.sales.updateServiceStatus", sale.id),
            { service_status: status },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleRentalStatus = (status) => {
        setProcessing(true);
        router.patch(
            route("admin.sales.updateRentalStatus", sale.id),
            { rental_status: status },
            { preserveScroll: true, onFinish: () => setProcessing(false) }
        );
    };

    const handleCheckOut = () => {
        setProcessing(true);
        router.patch(
            route('admin.sales.checkOutHospitality', sale.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            }
        );
    };

    const handleParkingExit = () => {
        setProcessing(true);
        router.patch(
            route('admin.sales.exitParking', sale.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            }
        );
    };

    const handleEndSession = () => {
        setProcessing(true);
        router.patch(
            route('admin.sales.endSession', sale.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            }
        );
    };

    /* ── Switch Payment ── */
    const PG_LABELS = {
        qris: "QRIS",
        gopay: "GoPay",
        shopeepay: "ShopeePay",
        dana: "DANA",
        ovo: "OVO",
        bca_va: "BCA VA",
        mandiri_va: "Mandiri VA",
        bri_va: "BRI VA",
        bni_va: "BNI VA",
        permata_va: "Permata VA",
    };
    const allPgMethods = (pgConfigs || []).flatMap((c) =>
        (c.enabled_methods || []).map((m) => ({
            provider: c.provider,
            method: m,
            label: PG_LABELS[m] ?? m,
        })),
    );
    const nonPgMethods = (paymentMethods || []).filter(
        (m) =>
            !["QRIS", "GoPay", "ShopeePay", "DANA", "OVO"].some((pg) =>
                m.name?.toLowerCase().includes(pg.toLowerCase()),
            ),
    );

    const handleSwitchPayment = async () => {
        if (!switchMethod && !switchPgType) return;
        setSwitching(true);
        try {
            const isPg = !!switchPgType;
            const pgInfo = isPg
                ? allPgMethods.find((m) => m.method === switchPgType)
                : null;

            const { data } = await axios.post(
                route("admin.sales.switchPayment", sale.id),
                {
                    payment_method_id: isPg
                        ? (nonPgMethods[0]?.id ?? switchMethod)
                        : Number(switchMethod),
                    is_pg: isPg,
                    pg_provider: pgInfo?.provider ?? null,
                    pg_method: pgInfo?.method ?? null,
                },
            );

            if (data.need_pg) {
                // Backend has switched to pending, now create PG transaction
                const { data: pgRes } = await axios.post(
                    route("admin.payment-gateway.create"),
                    {
                        sale_id: sale.id,
                        provider: pgInfo.provider,
                        payment_type: pgInfo.method,
                    },
                );
                // Reload to show new PG transaction
                setShowSwitchModal(false);
                router.reload({ only: ["sale"] });
            } else {
                setShowSwitchModal(false);
                router.reload({ only: ["sale"] });
            }
        } catch (e) {
            alert(
                "Gagal mengganti metode bayar: " +
                    (e.response?.data?.message ?? e.message),
            );
        } finally {
            setSwitching(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <PageHeader
                title={`${pageTitle} ${sale.sale_no}`}
                breadcrumbs={["Admin", pageTitle, sale.sale_no]}
                heading={
                    <>
                        Detail{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {pageTitle}
                        </span>
                    </>
                }
                description={`Lihat rincian transaksi ${pageTitle.toLowerCase()}.`}
                backUrl={route("admin.sales.index")}
            />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}

            {/* Status badges + actions */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <StatusBadge status={sale.status} />
                <PaymentBadge status={sale.payment_status} />
                <OrderTypeBadge type={sale.order_type} />
                {sale.status === "draft" && (
                    <>
                        <button
                            onClick={() => setConfirmingStatus("completed")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Selesaikan
                        </button>
                        <button
                            onClick={() => setConfirmingStatus("cancelled")}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-card px-3.5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            Batalkan
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Main */}
                <div className="space-y-5 lg:col-span-2">
                    {/* Info */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Informasi {pageTitle}
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoRow
                                    label="No. Struk"
                                    value={sale.sale_no}
                                />
                                <InfoRow
                                    label="Tanggal"
                                    value={fmtDate(sale.sale_date)}
                                />
                                <InfoRow
                                    label="Pelanggan"
                                    value={customer?.name ?? "Umum"}
                                />
                                <InfoRow
                                    label="Kasir"
                                    value={user?.name ?? "-"}
                                />
                                <InfoRow
                                    label={orderTypeLabel}
                                    value={
                                        <OrderTypeBadge
                                            type={sale.order_type}
                                        />
                                    }
                                    isRaw
                                />
                                {table && (
                                    <InfoRow
                                        label="Meja"
                                        value={`Meja ${table.table_number}`}
                                    />
                                )}
                                {sale.notes && (
                                    <InfoRow
                                        label="Catatan"
                                        value={sale.notes}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Service Status — hanya untuk pos_mode service/laundry */}
                    {(sale.pos_mode === 'service' || sale.pos_mode === 'laundry') && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border bg-muted/50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-foreground">Status Pengerjaan</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Tap untuk update status layanan</p>
                            </div>
                            <div className="p-5">
                                {/* Step indicator */}
                                <div className="flex items-center gap-0">
                                    {[
                                        { key: 'waiting',     label: 'Menunggu',   icon: '⏳', color: 'amber' },
                                        { key: 'in_progress', label: 'Dikerjakan', icon: '✂️', color: 'blue' },
                                        { key: 'done',        label: 'Selesai',    icon: '✅', color: 'emerald' },
                                    ].map((step, idx) => {
                                        const steps = ['waiting', 'in_progress', 'done'];
                                        const currentIdx = steps.indexOf(sale.service_status ?? 'waiting');
                                        const stepIdx = steps.indexOf(step.key);
                                        const isActive = sale.service_status === step.key;
                                        const isDone = stepIdx < currentIdx;
                                        const isNext = stepIdx === currentIdx + 1;

                                        const colorMap = {
                                            amber:   { active: 'bg-amber-500 text-white border-amber-500',     done: 'bg-amber-100 text-amber-600 border-amber-200',     next: 'border-border text-muted-foreground hover:border-amber-300 hover:bg-amber-50' },
                                            blue:    { active: 'bg-blue-500 text-white border-blue-500',       done: 'bg-blue-100 text-blue-600 border-blue-200',         next: 'border-border text-muted-foreground hover:border-blue-300 hover:bg-blue-50' },
                                            emerald: { active: 'bg-success/100 text-white border-emerald-500', done: 'bg-emerald-100 text-emerald-600 border-success/20', next: 'border-border text-muted-foreground hover:border-emerald-300 hover:bg-success/10' },
                                        };
                                        const cls = colorMap[step.color];

                                        return (
                                            <div key={step.key} className="flex flex-1 items-center">
                                                <button
                                                    onClick={() => isNext && canUpdateServiceStatus && handleServiceStatus(step.key)}
                                                    disabled={!isNext || !canUpdateServiceStatus || processing}
                                                    className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-center transition ${
                                                        isActive ? cls.active :
                                                        isDone   ? cls.done :
                                                        isNext && canUpdateServiceStatus ? cls.next :
                                                        'border-border text-muted-foreground/50 cursor-default'
                                                    }`}
                                                >
                                                    <span className="text-2xl">{step.icon}</span>
                                                    <span className="text-xs font-semibold">{step.label}</span>
                                                    {isActive && (
                                                        <span className="rounded-full bg-card/30 px-2 py-0.5 text-[10px] font-bold">
                                                            Saat ini
                                                        </span>
                                                    )}
                                                    {isDone && (
                                                        <span className="text-[10px]">✓ Selesai</span>
                                                    )}
                                                    {isNext && canUpdateServiceStatus && (
                                                        <span className="text-[10px]">Tap untuk update →</span>
                                                    )}
                                                </button>
                                                {idx < 2 && (
                                                    <div className={`mx-1 h-0.5 w-4 shrink-0 ${stepIdx < currentIdx ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Waktu pengerjaan */}
                                {sale.service_started_at && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                        <div className="rounded-xl bg-muted px-3 py-2">
                                            <p className="text-muted-foreground mb-0.5">Mulai dikerjakan</p>
                                            <p className="font-semibold text-foreground">
                                                {new Date(sale.service_started_at).toLocaleString('id-ID', { timeStyle: 'short', dateStyle: 'short' })}
                                            </p>
                                        </div>
                                        {sale.service_finished_at && (
                                            <div className="rounded-xl bg-success/10 px-3 py-2">
                                                <p className="text-emerald-500 mb-0.5">Selesai</p>
                                                <p className="font-semibold text-success">
                                                    {new Date(sale.service_finished_at).toLocaleString('id-ID', { timeStyle: 'short', dateStyle: 'short' })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Rental Status — hanya untuk pos_mode rental */}
                    {sale.pos_mode === 'rental' && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border bg-muted/50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-foreground">Status Sewa</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Status badge */}
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                                        sale.rental_status === 'returned'  ? 'bg-emerald-100 text-success' :
                                        sale.rental_status === 'overdue'   ? 'bg-red-100 text-destructive' :
                                        sale.rental_status === 'cancelled' ? 'bg-muted text-muted-foreground' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {sale.rental_status === 'active'    && '🔑 Sedang Disewa'}
                                        {sale.rental_status === 'returned'  && '✅ Sudah Dikembalikan'}
                                        {sale.rental_status === 'overdue'   && '⚠️ Terlambat Kembali'}
                                        {sale.rental_status === 'cancelled' && '❌ Dibatalkan'}
                                        {!sale.rental_status               && '🔑 Sedang Disewa'}
                                    </span>
                                </div>

                                {/* Info sewa */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {sale.rent_start_at && (
                                        <div className="rounded-xl bg-muted px-3 py-2.5">
                                            <p className="text-muted-foreground mb-0.5">Mulai sewa</p>
                                            <p className="font-semibold text-foreground">
                                                {new Date(sale.rent_start_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    )}
                                    {sale.rent_end_at && (
                                        <div className={`rounded-xl px-3 py-2.5 ${
                                            sale.rental_status === 'active' && new Date(sale.rent_end_at) < new Date()
                                                ? 'bg-destructive/10' : 'bg-muted'
                                        }`}>
                                            <p className="text-muted-foreground mb-0.5">Estimasi kembali</p>
                                            <p className={`font-semibold ${
                                                sale.rental_status === 'active' && new Date(sale.rent_end_at) < new Date()
                                                    ? 'text-destructive' : 'text-foreground'
                                            }`}>
                                                {new Date(sale.rent_end_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                {sale.rental_status === 'active' && new Date(sale.rent_end_at) < new Date() && ' ⚠️ Terlambat!'}
                                            </p>
                                        </div>
                                    )}
                                    {sale.actual_return_at && (
                                        <div className="rounded-xl bg-success/10 px-3 py-2.5">
                                            <p className="text-emerald-500 mb-0.5">Dikembalikan</p>
                                            <p className="font-semibold text-success">
                                                {new Date(sale.actual_return_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                {canUpdateRentalStatus && (sale.rental_status === 'active' || !sale.rental_status) && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRentalStatus('returned')}
                                            disabled={processing}
                                            className="flex-1 rounded-xl bg-success/100 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition"
                                        >
                                            {processing ? '...' : '✅ Tandai Sudah Dikembalikan'}
                                        </button>
                                        <button
                                            onClick={() => handleRentalStatus('overdue')}
                                            disabled={processing}
                                            className="rounded-xl border border-destructive/20 bg-card px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 transition"
                                        >
                                            ⚠️ Terlambat
                                        </button>
                                    </div>
                                )}
                                {canUpdateRentalStatus && sale.rental_status === 'overdue' && (
                                    <button
                                        onClick={() => handleRentalStatus('returned')}
                                        disabled={processing}
                                        className="w-full rounded-xl bg-success/100 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition"
                                    >
                                        {processing ? '...' : '✅ Sudah Dikembalikan (Terlambat)'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Menginap — hanya untuk pos_mode hospitality */}
                    {sale.pos_mode === 'hospitality' && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border bg-muted/50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-foreground">🏨 Info Menginap</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Status badge */}
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                                        sale.rental_status === 'returned'
                                            ? 'bg-muted text-muted-foreground'
                                            : sale.rental_status === 'overdue'
                                            ? 'bg-red-100 text-destructive'
                                            : 'bg-emerald-100 text-success'
                                    }`}>
                                        {sale.rental_status === 'returned' ? '✓ Check-out' :
                                         sale.rental_status === 'overdue'  ? '⚠️ Terlambat Check-out' :
                                         '🟢 Sedang Menginap'}
                                    </span>
                                    {canCheckOutHospitality && sale.rental_status === 'active' && (
                                        <Button
                                            size="sm"
                                            onClick={handleCheckOut}
                                            disabled={processing}
                                        >
                                            {processing ? '...' : '🏨 Check-out Sekarang'}
                                        </Button>
                                    )}
                                </div>

                                {/* Grid info */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {sale.extra_data?.room_number && (
                                        <div className="rounded-xl bg-primary-50 px-3 py-2.5">
                                            <p className="text-primary-400 mb-0.5">No. Kamar / Unit</p>
                                            <p className="font-bold text-primary-700 text-sm">🔑 {sale.extra_data.room_number}</p>
                                        </div>
                                    )}
                                    {sale.extra_data?.guest_count && (
                                        <div className="rounded-xl bg-muted px-3 py-2.5">
                                            <p className="text-muted-foreground mb-0.5">Jumlah Tamu</p>
                                            <p className="font-semibold text-foreground text-sm">👥 {sale.extra_data.guest_count} tamu</p>
                                        </div>
                                    )}
                                    {sale.rent_start_at && (
                                        <div className="rounded-xl bg-muted px-3 py-2.5">
                                            <p className="text-muted-foreground mb-0.5">Check-in</p>
                                            <p className="font-semibold text-foreground">
                                                {new Date(sale.rent_start_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    )}
                                    {sale.rent_end_at && (
                                        <div className={`rounded-xl px-3 py-2.5 ${
                                            new Date(sale.rent_end_at) < new Date() && sale.rental_status === 'active'
                                                ? 'bg-destructive/10' : 'bg-muted'
                                        }`}>
                                            <p className="text-muted-foreground mb-0.5">Check-out (Rencana)</p>
                                            <p className={`font-semibold ${
                                                new Date(sale.rent_end_at) < new Date() && sale.rental_status === 'active'
                                                    ? 'text-destructive' : 'text-foreground'
                                            }`}>
                                                {new Date(sale.rent_end_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                            {new Date(sale.rent_end_at) < new Date() && sale.rental_status === 'active' && (
                                                <p className="text-destructive text-[10px] mt-0.5">⚠️ Sudah lewat batas!</p>
                                            )}
                                        </div>
                                    )}
                                    {sale.actual_return_at && (
                                        <div className="rounded-xl bg-success/10 px-3 py-2.5 col-span-2">
                                            <p className="text-emerald-500 mb-0.5">Check-out Aktual</p>
                                            <p className="font-semibold text-success">
                                                {new Date(sale.actual_return_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Parkir — hanya untuk pos_mode parking */}
                    {sale.pos_mode === 'parking' && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border bg-muted/50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-foreground">🅿️ Info Parkir</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Plat Nomor — menonjol */}
                                {sale.plate_number && (
                                    <div className={`rounded-2xl border-2 p-4 text-center ${
                                        sale.exit_at ? 'border-border bg-muted' : 'border-primary-200 bg-primary-50'
                                    }`}>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Plat Nomor</p>
                                        <p className="font-mono text-3xl font-bold tracking-widest text-primary-700">
                                            {sale.plate_number}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {sale.vehicle_type === 'motorcycle' ? '🏍️ Motor' :
                                             sale.vehicle_type === 'car'        ? '🚗 Mobil' :
                                             sale.vehicle_type === 'truck'      ? '🚛 Truk/Bus' :
                                             sale.vehicle_type ?? '-'}
                                        </p>
                                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                            sale.exit_at ? 'bg-slate-200 text-muted-foreground' : 'bg-emerald-100 text-success'
                                        }`}>
                                            {sale.exit_at ? '✓ Sudah Keluar' : '🟢 Masih di Area Parkir'}
                                        </span>
                                    </div>
                                )}

                                {/* Grid info waktu */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {sale.entry_at && (
                                        <div className="rounded-xl bg-muted px-3 py-2.5">
                                            <p className="text-muted-foreground mb-0.5">⏰ Masuk</p>
                                            <p className="font-semibold text-foreground">
                                                {new Date(sale.entry_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    )}
                                    {sale.exit_at ? (
                                        <div className="rounded-xl bg-success/10 px-3 py-2.5">
                                            <p className="text-emerald-500 mb-0.5">✓ Keluar</p>
                                            <p className="font-semibold text-success">
                                                {new Date(sale.exit_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                            {sale.entry_at && (
                                                <p className="text-emerald-400 text-[10px] mt-0.5">
                                                    Durasi: {Math.round((new Date(sale.exit_at) - new Date(sale.entry_at)) / 60000)} menit
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-muted px-3 py-2.5 flex items-center justify-center">
                                            <p className="text-muted-foreground text-center text-xs">Belum keluar</p>
                                        </div>
                                    )}
                                    {sale.parking_ticket_no && (
                                        <div className="rounded-xl bg-muted px-3 py-2.5 col-span-2">
                                            <p className="text-muted-foreground mb-0.5">No. Tiket</p>
                                            <p className="font-mono font-semibold text-foreground">{sale.parking_ticket_no}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Tombol catat keluar */}
                                {canExitParking && !sale.exit_at && (
                                    <Button
                                        className="w-full"
                                        onClick={handleParkingExit}
                                        disabled={processing}
                                    >
                                        {processing ? 'Memproses...' : '🚗 Catat Kendaraan Keluar'}
                                    </Button>
                                )}
                                {sale.exit_at && (
                                    <div className="rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                                        Kendaraan sudah tercatat keluar dari area parkir
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Sesi — hanya untuk pos_mode session */}
                    {sale.pos_mode === 'session' && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border bg-muted/50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-foreground">🎮 Info Sesi</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Unit dan status */}
                                <div className={`rounded-2xl border-2 p-4 text-center ${
                                    sale.session_status === 'ended'  ? 'border-border bg-muted' :
                                    sale.session_status === 'paused' ? 'border-amber-200 bg-amber-50' :
                                    'border-success/20 bg-success/10'
                                }`}>
                                    {sale.unit_name && (
                                        <>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Unit / Room</p>
                                            <p className="font-mono text-2xl font-bold text-primary-700">{sale.unit_name}</p>
                                        </>
                                    )}
                                    <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                        sale.session_status === 'ended'  ? 'bg-slate-200 text-muted-foreground' :
                                        sale.session_status === 'paused' ? 'bg-amber-100 text-amber-700' :
                                        'bg-emerald-100 text-success'
                                    }`}>
                                        {sale.session_status === 'ended'  ? '✓ Sesi Selesai' :
                                         sale.session_status === 'paused' ? '⏸ Dijeda' :
                                         '▶ Sesi Berjalan'}
                                    </span>
                                </div>

                                {/* Grid info waktu */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {sale.session_started_at && (
                                        <div className="rounded-xl bg-muted px-3 py-2.5">
                                            <p className="text-muted-foreground mb-0.5">▶ Mulai</p>
                                            <p className="font-semibold text-foreground">
                                                {new Date(sale.session_started_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    )}
                                    {sale.session_ended_at ? (
                                        <div className="rounded-xl bg-muted px-3 py-2.5">
                                            <p className="text-muted-foreground mb-0.5">✓ Selesai</p>
                                            <p className="font-semibold text-muted-foreground">
                                                {new Date(sale.session_ended_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                            {sale.session_started_at && (
                                                <p className="text-muted-foreground text-[10px] mt-0.5">
                                                    {Math.round((new Date(sale.session_ended_at) - new Date(sale.session_started_at)) / 60000)} menit
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-success/10 px-3 py-2.5 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-emerald-600 text-xs font-semibold">⏱ Berjalan</p>
                                                {sale.session_started_at && (
                                                    <p className="text-emerald-500 text-[10px]">
                                                        {Math.round((Date.now() - new Date(sale.session_started_at)) / 60000)} menit
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {sale.guest_count && (
                                        <div className="rounded-xl bg-muted px-3 py-2.5 col-span-2">
                                            <p className="text-muted-foreground mb-0.5">Pengguna</p>
                                            <p className="font-semibold text-foreground">👥 {sale.guest_count} orang</p>
                                        </div>
                                    )}
                                </div>

                                {/* Tombol akhiri sesi */}
                                {canEndSession && sale.session_status !== 'ended' && (
                                    <button
                                        onClick={handleEndSession}
                                        disabled={processing}
                                        className="w-full rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 py-3 text-sm font-bold text-white shadow transition hover:from-slate-700 hover:to-slate-800 disabled:opacity-50"
                                    >
                                        {processing ? 'Memproses...' : '⏹ Akhiri Sesi'}
                                    </button>
                                )}
                                {sale.session_status === 'ended' && (
                                    <div className="rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                                        Sesi sudah selesai
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Item {pageTitle}
                            </h3>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-6 py-3 font-medium text-muted-foreground">
                                                #
                                            </th>
                                            <th className="px-6 py-3 font-medium text-muted-foreground">
                                                Produk
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                                                Qty
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                                                Harga
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                                                Diskon
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item, idx) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-muted/50"
                                            >
                                                <td className="px-6 py-3.5 text-muted-foreground">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <p className="font-medium text-foreground">
                                                        {item.product?.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.product?.sku}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-muted-foreground">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-muted-foreground">
                                                    {fmtRp(item.price)}
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-muted-foreground">
                                                    {Number(
                                                        item.discount_amount,
                                                    ) > 0
                                                        ? `- ${fmtRp(item.discount_amount)}`
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-medium text-foreground">
                                                    {fmtRp(item.subtotal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Financial */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Rincian Biaya
                            </h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <Row
                                    label="Subtotal"
                                    value={fmtRp(sale.subtotal)}
                                />
                                {Number(sale.discount_amount) > 0 && (
                                    <Row
                                        label="Diskon"
                                        value={`- ${fmtRp(sale.discount_amount)}`}
                                        valueCls="text-destructive"
                                    />
                                )}
                                {Number(sale.tax_amount) > 0 && (
                                    <Row
                                        label="Pajak"
                                        value={`+ ${fmtRp(sale.tax_amount)}`}
                                    />
                                )}
                                {Number(sale.shipping_amount) > 0 && (
                                    <Row
                                        label="Ongkir"
                                        value={`+ ${fmtRp(sale.shipping_amount)}`}
                                    />
                                )}
                                <div className="my-2 border-t border-border" />
                                <div className="flex items-center justify-between">
                                    <dt className="font-semibold text-foreground">
                                        Grand Total
                                    </dt>
                                    <dd className="text-lg font-bold text-primary-600">
                                        {fmtRp(sale.grand_total)}
                                    </dd>
                                </div>
                                <div className="my-2 border-t border-border" />
                                <Row
                                    label="Dibayar"
                                    value={fmtRp(sale.paid_amount)}
                                />
                                {Number(sale.change_amount) > 0 && (
                                    <Row
                                        label="Kembalian"
                                        value={fmtRp(sale.change_amount)}
                                        valueCls="text-emerald-600"
                                    />
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Payments */}
                    {pgTransactions &&
                        pgTransactions.length > 0 &&
                        pgTransactions.some((t) => t.status === "pending") && (
                            <div className="overflow-hidden rounded-2xl border border-primary-200 bg-card shadow-sm">
                                <div className="border-b border-primary-100 bg-primary-50/60 px-6 py-4">
                                    <h3 className="text-base font-semibold text-primary-900">
                                        Pembayaran Online
                                    </h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {pgTransactions
                                        .filter((t) => t.status === "pending")
                                        .map((trx) => {
                                            const display = getPgDisplay(trx);
                                            const pgLabels = {
                                                qris: "QRIS",
                                                gopay: "GoPay",
                                                shopeepay: "ShopeePay",
                                                dana: "DANA",
                                                ovo: "OVO",
                                                bca_va: "BCA VA",
                                                mandiri_va: "Mandiri VA",
                                                bri_va: "BRI VA",
                                                bni_va: "BNI VA",
                                                permata_va: "Permata VA",
                                            };
                                            const label =
                                                pgLabels[trx.payment_type] ??
                                                trx.payment_type;
                                            return (
                                                <div
                                                    key={trx.id}
                                                    className="rounded-xl border border-border p-4 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-foreground">
                                                            {label}
                                                        </span>
                                                        <span className="inline-flex rounded-lg bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                                            PENDING
                                                        </span>
                                                    </div>
                                                    {/* QR Code Image */}
                                                    {display.qrImageUrl && (
                                                        <div className="flex justify-center">
                                                            <img
                                                                src={
                                                                    display.qrImageUrl
                                                                }
                                                                alt={`QR ${label}`}
                                                                className="h-48 w-48 rounded-xl border border-border object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    {/* QR Code text fallback */}
                                                    {!display.qrImageUrl &&
                                                        display.qrCode && (
                                                            <div className="rounded-xl bg-muted p-3 text-center">
                                                                <p className="text-[10px] text-muted-foreground mb-1">
                                                                    QR Code
                                                                </p>
                                                                <p className="text-xs text-muted-foreground break-all font-mono">
                                                                    {
                                                                        display.qrCode
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    {/* VA Number */}
                                                    {display.vaNumber && (
                                                        <div className="rounded-xl bg-muted p-3 text-center">
                                                            <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                                                                Virtual Account
                                                            </p>
                                                            {display.vaBank && (
                                                                <p className="text-sm font-bold text-primary-600 mb-1">
                                                                    {
                                                                        display.vaBank
                                                                    }
                                                                </p>
                                                            )}
                                                            <p className="text-lg font-bold text-foreground tracking-wider">
                                                                {
                                                                    display.vaNumber
                                                                }
                                                            </p>
                                                            <button
                                                                onClick={() =>
                                                                    navigator.clipboard.writeText(
                                                                        display.vaNumber,
                                                                    )
                                                                }
                                                                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-card border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                            >
                                                                <svg
                                                                    className="h-3 w-3"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                                                                    />
                                                                </svg>
                                                                Salin
                                                            </button>
                                                        </div>
                                                    )}
                                                    {/* Payment URL */}
                                                    {display.paymentUrl && (
                                                        <a
                                                            href={
                                                                display.paymentUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={2}
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                                                                />
                                                            </svg>
                                                            Buka Halaman
                                                            Pembayaran
                                                        </a>
                                                    )}
                                                    <p className="text-[11px] text-center text-muted-foreground">
                                                        Rp{" "}
                                                        {Number(
                                                            trx.amount,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            checkPgStatus(
                                                                trx.id,
                                                            )
                                                        }
                                                        disabled={
                                                            checkingPgId ===
                                                            trx.id
                                                        }
                                                        className="w-full rounded-xl border border-primary-200 bg-card px-4 py-2 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 disabled:opacity-50"
                                                    >
                                                        {checkingPgId === trx.id
                                                            ? "Mengecek..."
                                                            : "Cek Status Pembayaran"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                    {payments && payments.length > 0 && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border bg-muted/50 px-6 py-4">
                                <h3 className="text-base font-semibold text-foreground">
                                    Riwayat Pembayaran
                                </h3>
                            </div>
                            <div className="divide-y divide-border p-4">
                                {payments.map((pay) => (
                                    <div
                                        key={pay.id}
                                        className="py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {fmtShort(pay.paid_at)}{" "}
                                                {fmtTime(pay.paid_at)}
                                            </span>
                                            <span className="text-sm font-semibold text-emerald-600">
                                                {fmtRp(pay.amount)}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                                {pay.paymentMethod?.name ?? "-"}
                                            </span>
                                            {pay.reference_no && (
                                                <span>
                                                    • {pay.reference_no}
                                                </span>
                                            )}
                                        </div>
                                        {pay.note && (
                                            <p className="mt-1 text-xs text-muted-foreground italic">
                                                {pay.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status history */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Status
                            </h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-2.5 text-sm">
                                <InfoRow
                                    label="Status"
                                    value={<StatusBadge status={sale.status} />}
                                    isRaw
                                />
                                <InfoRow
                                    label="Pembayaran"
                                    value={
                                        <PaymentBadge
                                            status={sale.payment_status}
                                        />
                                    }
                                    isRaw
                                />
                                <InfoRow
                                    label="Dibuat"
                                    value={fmtDate(sale.created_at)}
                                />
                                {sale.updated_at !== sale.created_at && (
                                    <InfoRow
                                        label="Diupdate"
                                        value={fmtDate(sale.updated_at)}
                                    />
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm status modal */}
            {confirmingStatus && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onMouseDown={() => !processing && setConfirmingStatus(null)}
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
                    <div
                        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-foreground">
                            {confirmingStatus === "completed"
                                ? "Selesaikan Penjualan?"
                                : "Batalkan Penjualan?"}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {confirmingStatus === "completed"
                                ? "Stok produk akan dikurangi sesuai qty item. Tindakan ini tidak dapat dibatalkan."
                                : "Penjualan akan dibatalkan. Jika sudah selesai, stok produk akan dikembalikan."}
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmingStatus(null)}
                                disabled={processing}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleStatus(confirmingStatus)}
                                disabled={processing}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 ${confirmingStatus === "completed" ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700" : "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30 hover:from-red-600 hover:to-red-700"}`}
                            >
                                {processing
                                    ? "Memproses..."
                                    : confirmingStatus === "completed"
                                      ? "Ya, Selesaikan"
                                      : "Ya, Batalkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Switch Payment modal */}
            {showSwitchModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onMouseDown={() => !switching && setShowSwitchModal(false)}
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
                    <div
                        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-foreground">
                                Ganti Metode Bayar
                            </h3>
                            <button
                                onClick={() =>
                                    !switching && setShowSwitchModal(false)
                                }
                                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Current payment info */}
                        <div className="mb-5 rounded-xl bg-muted p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                Pembayaran Saat Ini
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                {payments?.length > 0
                                    ? payments
                                          .map((p) => p.paymentMethod?.name)
                                          .filter(Boolean)
                                          .join(", ")
                                    : pgTransactions?.some(
                                            (t) => t.status === "pending",
                                        )
                                      ? `PG: ${pgTransactions.find((t) => t.status === "pending")?.payment_type?.toUpperCase()}`
                                      : "-"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Total: {fmtRp(sale.grand_total)}
                            </p>
                        </div>

                        {/* Non-PG options (Tunai, Card, etc.) */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                                Bayar Langsung
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {nonPgMethods.map((m) => (
                                    <button
                                        key={m.id}
                                        disabled={switching}
                                        onClick={() => {
                                            setSwitchMethod(String(m.id));
                                            setSwitchPgType("");
                                        }}
                                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                                            switchMethod === String(m.id) &&
                                            !switchPgType
                                                ? "border-primary-500 bg-primary-50 text-primary-700"
                                                : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                                        } disabled:opacity-50`}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* PG options */}
                        {allPgMethods.length > 0 && (
                            <div className="mb-5">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                                    Pembayaran Online
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {allPgMethods.map((pg) => (
                                        <button
                                            key={pg.method}
                                            disabled={switching}
                                            onClick={() => {
                                                setSwitchPgType(pg.method);
                                                setSwitchMethod("");
                                            }}
                                            className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                                                switchPgType === pg.method
                                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                                    : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                                            } disabled:opacity-50`}
                                        >
                                            {pg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-border">
                            <button
                                onClick={() =>
                                    !switching && setShowSwitchModal(false)
                                }
                                disabled={switching}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSwitchPayment}
                                disabled={
                                    switching ||
                                    (!switchMethod && !switchPgType)
                                }
                                className="rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60 bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700"
                            >
                                {switching
                                    ? "Memproses..."
                                    : "Ganti Metode Bayar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

/* ── Helpers ── */
function InfoRow({ label, value, isRaw }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd
                className={`text-right ${isRaw ? "" : "font-medium text-foreground"}`}
            >
                {value}
            </dd>
        </div>
    );
}

function Row({ label, value, valueCls = "" }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={`font-medium text-foreground ${valueCls}`}>
                {value}
            </dd>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        draft: "bg-muted text-muted-foreground",
        completed: "bg-emerald-100 text-success",
        cancelled: "bg-red-100 text-destructive",
    };
    const label = {
        draft: "Draft",
        completed: "Selesai",
        cancelled: "Dibatalkan",
    };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
        >
            {label[status] ?? status}
        </span>
    );
}

function PaymentBadge({ status }) {
    const map = {
        unpaid: "bg-rose-100 text-rose-600",
        partial: "bg-amber-100 text-amber-700",
        paid: "bg-emerald-100 text-success",
    };
    const label = { unpaid: "Belum Bayar", partial: "Sebagian", paid: "Lunas" };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
        >
            {label[status] ?? status}
        </span>
    );
}

function OrderTypeBadge({ type }) {
    const map = {
        // FnB
        dine_in: { label: "Dine In", cls: "bg-blue-100 text-blue-700" },
        takeaway: { label: "Takeaway", cls: "bg-orange-100 text-orange-700" },
        delivery: { label: "Delivery", cls: "bg-purple-100 text-purple-700" },
        // Retail
        wholesale: { label: "Grosir", cls: "bg-cyan-100 text-cyan-700" },
        // Service
        walk_in: { label: "Walk-in", cls: "bg-emerald-100 text-success" },
        booking: { label: "Booking", cls: "bg-violet-100 text-violet-700" },
        pickup_delivery: {
            label: "Jemput & Antar",
            cls: "bg-purple-100 text-purple-700",
        },
        // Rental
        per_hour: { label: "Per Jam", cls: "bg-amber-100 text-amber-700" },
        per_day: { label: "Per Hari", cls: "bg-amber-100 text-amber-700" },
        per_week: { label: "Per Minggu", cls: "bg-amber-100 text-amber-700" },
        // Ticket
        online: { label: "Online", cls: "bg-rose-100 text-rose-700" },
        group: { label: "Group", cls: "bg-pink-100 text-pink-700" },
        // Hospitality
        check_in: { label: "Check-in", cls: "bg-teal-100 text-teal-700" },
        reservation: {
            label: "Reservasi",
            cls: "bg-primary-100 text-primary-700",
        },
        short_stay: { label: "Short Stay", cls: "bg-sky-100 text-sky-700" },
        // Parking
        entry: { label: "Masuk", cls: "bg-muted text-foreground" },
        exit: { label: "Keluar", cls: "bg-slate-200 text-muted-foreground" },
        lost_ticket: { label: "Tiket Hilang", cls: "bg-red-100 text-destructive" },
        // Session
        postpaid: { label: "Postpaid", cls: "bg-primary-100 text-primary-700" },
        prepaid: { label: "Prepaid", cls: "bg-violet-100 text-violet-700" },
    };
    const config = map[type] ?? {
        label: type ?? "-",
        cls: "bg-muted text-muted-foreground",
    };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${config.cls}`}
        >
            {config.label}
        </span>
    );
}
