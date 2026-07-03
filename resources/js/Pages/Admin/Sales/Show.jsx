import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";

export default function Show({ sale, paymentMethods, pgConfigs }) {
    const { flash } = usePage().props;
    const [confirmingStatus, setConfirmingStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

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
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.sales.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {sale.sale_no}
                        </h2>
                        <p className="text-sm text-slate-400">
                            Detail Penjualan
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Penjualan ${sale.sale_no}`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">
                                Informasi Penjualan
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
                                    label="Tipe Pesanan"
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

                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">
                                Item Penjualan
                            </h3>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-6 py-3 font-medium text-slate-500">
                                                #
                                            </th>
                                            <th className="px-6 py-3 font-medium text-slate-500">
                                                Produk
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">
                                                Qty
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">
                                                Harga
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">
                                                Diskon
                                            </th>
                                            <th className="px-6 py-3 text-right font-medium text-slate-500">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, idx) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-slate-50/50"
                                            >
                                                <td className="px-6 py-3.5 text-slate-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <p className="font-medium text-slate-800">
                                                        {item.product?.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {item.product?.sku}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-slate-600">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-slate-600">
                                                    {fmtRp(item.price)}
                                                </td>
                                                <td className="px-6 py-3.5 text-right text-slate-600">
                                                    {Number(
                                                        item.discount_amount,
                                                    ) > 0
                                                        ? `- ${fmtRp(item.discount_amount)}`
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-medium text-slate-800">
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
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">
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
                                        valueCls="text-red-500"
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
                                <div className="my-2 border-t border-slate-100" />
                                <div className="flex items-center justify-between">
                                    <dt className="font-semibold text-slate-700">
                                        Grand Total
                                    </dt>
                                    <dd className="text-lg font-bold text-indigo-600">
                                        {fmtRp(sale.grand_total)}
                                    </dd>
                                </div>
                                <div className="my-2 border-t border-slate-100" />
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
                            <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
                                <div className="border-b border-indigo-100 bg-indigo-50/60 px-6 py-4">
                                    <h3 className="text-base font-semibold text-indigo-900">
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
                                                    className="rounded-xl border border-slate-200 p-4 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-slate-800">
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
                                                                className="h-48 w-48 rounded-xl border border-slate-200 object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    {/* QR Code text fallback */}
                                                    {!display.qrImageUrl &&
                                                        display.qrCode && (
                                                            <div className="rounded-xl bg-slate-50 p-3 text-center">
                                                                <p className="text-[10px] text-slate-400 mb-1">
                                                                    QR Code
                                                                </p>
                                                                <p className="text-xs text-slate-600 break-all font-mono">
                                                                    {
                                                                        display.qrCode
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    {/* VA Number */}
                                                    {display.vaNumber && (
                                                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                                                            <p className="text-[11px] font-semibold text-slate-500 mb-1">
                                                                Virtual Account
                                                            </p>
                                                            {display.vaBank && (
                                                                <p className="text-sm font-bold text-indigo-600 mb-1">
                                                                    {
                                                                        display.vaBank
                                                                    }
                                                                </p>
                                                            )}
                                                            <p className="text-lg font-bold text-slate-900 tracking-wider">
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
                                                                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
                                                            className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
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
                                                    <p className="text-[11px] text-center text-slate-400">
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
                                                        className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
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
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Riwayat Pembayaran
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100 p-4">
                                {payments.map((pay) => (
                                    <div
                                        key={pay.id}
                                        className="py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">
                                                {fmtShort(pay.paid_at)}{" "}
                                                {fmtTime(pay.paid_at)}
                                            </span>
                                            <span className="text-sm font-semibold text-emerald-600">
                                                {fmtRp(pay.amount)}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
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
                                            <p className="mt-1 text-xs text-slate-400 italic">
                                                {pay.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status history */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-900">
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    <div
                        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-slate-900">
                            {confirmingStatus === "completed"
                                ? "Selesaikan Penjualan?"
                                : "Batalkan Penjualan?"}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {confirmingStatus === "completed"
                                ? "Stok produk akan dikurangi sesuai qty item. Tindakan ini tidak dapat dibatalkan."
                                : "Penjualan akan dibatalkan. Jika sudah selesai, stok produk akan dikembalikan."}
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmingStatus(null)}
                                disabled={processing}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    <div
                        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-slate-900">
                                Ganti Metode Bayar
                            </h3>
                            <button
                                onClick={() =>
                                    !switching && setShowSwitchModal(false)
                                }
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                        <div className="mb-5 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-medium text-slate-500 mb-1">
                                Pembayaran Saat Ini
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
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
                            <p className="text-xs text-slate-400 mt-0.5">
                                Total: {fmtRp(sale.grand_total)}
                            </p>
                        </div>

                        {/* Non-PG options (Tunai, Card, etc.) */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
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
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
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
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                            } disabled:opacity-50`}
                                        >
                                            {pg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                onClick={() =>
                                    !switching && setShowSwitchModal(false)
                                }
                                disabled={switching}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
            <dt className="text-slate-500">{label}</dt>
            <dd
                className={`text-right ${isRaw ? "" : "font-medium text-slate-800"}`}
            >
                {value}
            </dd>
        </div>
    );
}

function Row({ label, value, valueCls = "" }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-slate-500">{label}</dt>
            <dd className={`font-medium text-slate-700 ${valueCls}`}>
                {value}
            </dd>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        draft: "bg-slate-100 text-slate-600",
        completed: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-red-100 text-red-600",
    };
    const label = {
        draft: "Draft",
        completed: "Selesai",
        cancelled: "Dibatalkan",
    };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-600"}`}
        >
            {label[status] ?? status}
        </span>
    );
}

function PaymentBadge({ status }) {
    const map = {
        unpaid: "bg-rose-100 text-rose-600",
        partial: "bg-amber-100 text-amber-700",
        paid: "bg-emerald-100 text-emerald-700",
    };
    const label = { unpaid: "Belum Bayar", partial: "Sebagian", paid: "Lunas" };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-600"}`}
        >
            {label[status] ?? status}
        </span>
    );
}

function OrderTypeBadge({ type }) {
    const map = {
        dine_in: { label: "Dine In", cls: "bg-blue-100 text-blue-700" },
        takeaway: { label: "Take Away", cls: "bg-orange-100 text-orange-700" },
        delivery: { label: "Delivery", cls: "bg-purple-100 text-purple-700" },
    };
    const config = map[type] ?? {
        label: type,
        cls: "bg-slate-100 text-slate-600",
    };
    return (
        <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${config.cls}`}
        >
            {config.label}
        </span>
    );
}
