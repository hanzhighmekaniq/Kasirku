import { useState } from "react";
import { fmt, PG_METHOD_LABELS, findPgPaymentMethod } from "./helpers";

export default function PaymentModal({
    grandTotal,
    paymentMethods,
    pgMethods,
    onConfirm,
    onClose,
    submitting,
}) {
    const [mode, setMode] = useState(null); // null = choose, 'offline', 'online'
    const [payments, setPayments] = useState([
        {
            method_id: paymentMethods[0]?.id ?? "",
            amount: grandTotal,
            reference_no: "",
            is_pg: false,
            pg_provider: "",
            pg_method: "",
        },
    ]);

    /** When a PG method button is clicked */
    const selectPgMethod = (pg) => {
        const matched = findPgPaymentMethod(pg.payment_type, paymentMethods);
        setPayments([
            {
                method_id: matched?.id ?? paymentMethods[0]?.id ?? "",
                amount: grandTotal,
                reference_no: "",
                is_pg: true,
                pg_provider: pg.provider,
                pg_method: pg.payment_type,
            },
        ]);
        setMode("online");
    };

    /** Switch to offline mode */
    const goOffline = () => {
        setPayments([
            {
                method_id: paymentMethods[0]?.id ?? "",
                amount: grandTotal,
                reference_no: "",
                is_pg: false,
                pg_provider: "",
                pg_method: "",
            },
        ]);
        setMode("offline");
    };

    /** Go back to mode chooser */
    const goBack = () => {
        setPayments([
            {
                method_id: paymentMethods[0]?.id ?? "",
                amount: grandTotal,
                reference_no: "",
                is_pg: false,
                pg_provider: "",
                pg_method: "",
            },
        ]);
        setMode(null);
    };

    const isPgPayment = payments.some((p) => p.is_pg);

    const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const change = Math.max(0, totalPaid - grandTotal);
    const remaining = Math.max(0, grandTotal - totalPaid);

    const update = (i, key, val) =>
        setPayments((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)),
        );
    const add = () =>
        setPayments((prev) => [
            ...prev,
            {
                method_id: paymentMethods[0]?.id ?? "",
                amount: remaining,
                reference_no: "",
                is_pg: false,
                pg_provider: "",
                pg_method: "",
            },
        ]);
    const remove = (i) =>
        setPayments((prev) => prev.filter((_, idx) => idx !== i));

    const cashMethod = paymentMethods.find((m) => m.type === "cash");
    const quickCash = cashMethod
        ? [
              grandTotal,
              Math.ceil(grandTotal / 10000) * 10000,
              Math.ceil(grandTotal / 50000) * 50000,
          ].filter((v, i, a) => a.indexOf(v) === i)
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <div className="relative w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        {mode && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="text-slate-400 hover:text-slate-700 transition"
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
                                        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                                    />
                                </svg>
                            </button>
                        )}
                        <h3 className="font-semibold text-slate-900">
                            {!mode
                                ? "Pilih Metode Pembayaran"
                                : mode === "offline"
                                  ? "Pembayaran Offline"
                                  : "Pembayaran Online"}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700"
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

                {/* Total */}
                <div className="bg-indigo-50 px-5 py-4">
                    <div className="flex justify-between">
                        <span className="text-sm text-slate-600">
                            Total Belanja
                        </span>
                        <span className="text-xl font-bold text-indigo-700">
                            {fmt(grandTotal)}
                        </span>
                    </div>
                </div>

                {/* ═══ MODE: CHOOSE ═══ */}
                {!mode && (
                    <div className="px-5 py-6 space-y-3">
                        <button
                            type="button"
                            onClick={goOffline}
                            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl transition group-hover:bg-emerald-200">
                                💵
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-bold text-slate-900 group-hover:text-emerald-700">
                                    Bayar Offline
                                </p>
                                <p className="text-xs text-slate-500">
                                    Tunai, kartu debit/kredit, transfer bank
                                </p>
                            </div>
                            <svg
                                className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                />
                            </svg>
                        </button>

                        {pgMethods?.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setMode("online")}
                                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl transition group-hover:bg-indigo-200">
                                    🌐
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-slate-900 group-hover:text-indigo-700">
                                        Bayar Online
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        QRIS, e-wallet, virtual account
                                    </p>
                                </div>
                                <svg
                                    className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* ═══ MODE: OFFLINE ═══ */}
                {mode === "offline" && (
                    <div className="flex flex-col max-h-80">
                        {/* Scrollable: quick cash + payment rows + add button */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
                            {/* Quick cash buttons */}
                            {payments.length === 1 &&
                                cashMethod &&
                                payments[0].method_id === cashMethod.id && (
                                    <div className="flex flex-wrap gap-2">
                                        {quickCash.map((v) => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() =>
                                                    update(0, "amount", v)
                                                }
                                                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${Number(payments[0].amount) === v ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                                            >
                                                {fmt(v)}
                                            </button>
                                        ))}
                                    </div>
                                )}

                            {/* Payment rows */}
                            {payments.map((p, i) => (
                                <div
                                    key={i}
                                    className="space-y-2 rounded-xl border border-slate-200 p-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={p.method_id}
                                            onChange={(e) =>
                                                update(
                                                    i,
                                                    "method_id",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="flex-1 rounded-xl border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                        >
                                            {paymentMethods.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                    {m.provider
                                                        ? ` (${m.provider})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {payments.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(i)}
                                                className="text-red-400 hover:text-red-600"
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
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                value={p.amount}
                                                onChange={(e) =>
                                                    update(
                                                        i,
                                                        "amount",
                                                        e.target.value,
                                                    )
                                                }
                                                className="block w-full rounded-xl border-slate-300 pl-9 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                            />
                                        </div>
                                        {remaining > 0 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    update(
                                                        i,
                                                        "amount",
                                                        grandTotal -
                                                            (totalPaid -
                                                                Number(
                                                                    p.amount,
                                                                )),
                                                    )
                                                }
                                                className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-100 transition"
                                                title="Isi sisa pembayaran"
                                            >
                                                Sisa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {payments.length < paymentMethods.length && (
                                <button
                                    type="button"
                                    onClick={add}
                                    className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition"
                                >
                                    + Tambah metode pembayaran (split)
                                </button>
                            )}
                        </div>

                        {/* Fixed: Summary */}
                        <div className="shrink-0 border-t border-slate-100 px-5 py-3 bg-white rounded-b-2xl">
                            <div className="rounded-xl bg-slate-50 px-4 py-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">
                                        Dibayar
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                        {fmt(totalPaid)}
                                    </span>
                                </div>
                                {change > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Kembalian
                                        </span>
                                        <span className="font-bold text-emerald-600">
                                            {fmt(change)}
                                        </span>
                                    </div>
                                )}
                                {remaining > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Kurang
                                        </span>
                                        <span className="font-bold text-red-600">
                                            {fmt(remaining)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ MODE: ONLINE — PG method chooser ═══ */}
                {mode === "online" && !isPgPayment && pgMethods?.length > 0 && (
                    <div className="px-5 py-5 space-y-3">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Pilih metode pembayaran online
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {pgMethods.map((pg, idx) => {
                                const lbl = PG_METHOD_LABELS[
                                    pg.payment_type
                                ] ?? {
                                    label: pg.payment_type,
                                    icon: "💳",
                                    badge: "PG",
                                };
                                const isQris = pg.payment_type === "qris";
                                return (
                                    <button
                                        key={`${pg.provider}-${pg.payment_type}-${idx}`}
                                        type="button"
                                        onClick={() => selectPgMethod(pg)}
                                        className={`group flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition hover:shadow-md ${
                                            isQris
                                                ? "col-span-2 border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 hover:bg-indigo-50"
                                                : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
                                        }`}
                                    >
                                        <span className="text-2xl">
                                            {lbl.icon}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">
                                                {lbl.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {isQris
                                                    ? "Scan dengan semua aplikasi"
                                                    : "Pembayaran instan"}
                                            </p>
                                        </div>
                                        <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600 group-hover:bg-indigo-200">
                                            ONLINE
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ═══ MODE: ONLINE — selected PG, showing info ═══ */}
                {mode === "online" && isPgPayment && (
                    <div className="px-5 py-4 space-y-3">
                        <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4">
                            <span className="text-2xl">
                                {PG_METHOD_LABELS[payments[0]?.pg_method]
                                    ?.icon ?? "💳"}
                            </span>
                            <div>
                                <p className="text-sm font-bold text-slate-900">
                                    {PG_METHOD_LABELS[payments[0]?.pg_method]
                                        ?.label ?? payments[0]?.pg_method}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {fmt(grandTotal)}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                            <span className="font-semibold">
                                Pembayaran Online
                            </span>{" "}
                            — Pelanggan akan scan QR atau transfer ke VA.
                            Setelah pembayaran dikonfirmasi, stok otomatis
                            terpotong.
                        </div>
                        {/* Summary */}
                        <div className="rounded-xl bg-slate-50 px-4 py-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total</span>
                                <span className="font-semibold text-slate-800">
                                    {fmt(grandTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ BOTTOM BUTTON ═══ */}
                <div className="border-t border-slate-100 px-5 py-4">
                    {mode === "offline" && (
                        <button
                            type="button"
                            disabled={totalPaid < grandTotal || submitting}
                            onClick={() => onConfirm(payments, change)}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : totalPaid < grandTotal ? (
                                `Kurang ${fmt(remaining)}`
                            ) : (
                                "Proses Pembayaran"
                            )}
                        </button>
                    )}
                    {mode === "online" && isPgPayment && (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => onConfirm(payments, change)}
                            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                "Buat Link Pembayaran"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
