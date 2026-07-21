import { useState } from "react";
import { fmt, PG_METHOD_LABELS, findPgPaymentMethod } from "./helpers";

export default function PaymentModal({
    grandTotal,
    roundedGrandTotal,
    roundingAdjustment = 0,
    paymentMethods,
    pgMethods,
    onConfirm,
    onClose,
    submitting,
    selectedCustomer = null,
    customers = [],
    onSelectCustomer,
}) {
    const displayTotal = roundedGrandTotal ?? grandTotal;

    // Metode non-hutang dipakai di mode "offline" — hutang punya alur sendiri.
    const offlineMethods = paymentMethods.filter((m) => m.type !== "debt");
    const debtMethod = paymentMethods.find((m) => m.type === "debt");

    const [mode, setMode] = useState(null); // null = choose, 'offline', 'online', 'debt'
    const [payments, setPayments] = useState([
        {
            method_id: offlineMethods[0]?.id ?? "",
            amount: displayTotal,
            reference_no: "",
            is_pg: false,
            pg_provider: "",
            pg_method: "",
        },
    ]);

    const customer = customers.find(
        (c) => String(c.id) === String(selectedCustomer),
    );
    const availableCredit = customer
        ? (customer.credit_limit ?? 0) - (customer.debt_balance ?? 0)
        : 0;

    // Pencarian pelanggan — dipakai saat mode hutang & belum ada yang dipilih
    const [customerQuery, setCustomerQuery] = useState("");
    // null = belum pilih, 'full' = full hutang, 'partial' = bayar sebagian
    const [debtSubMode, setDebtSubMode] = useState(null);
    const filteredCustomers = customers.filter((c) => {
        const q = customerQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            c.name?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.code?.toLowerCase().includes(q)
        );
    });

    /** When a PG method button is clicked */
    const selectPgMethod = (pg) => {
        const matched = findPgPaymentMethod(pg.payment_type, paymentMethods);
        setPayments([
            {
                method_id: matched?.id ?? offlineMethods[0]?.id ?? "",
                amount: displayTotal,
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
                method_id: offlineMethods[0]?.id ?? "",
                amount: displayTotal,
                reference_no: "",
                is_pg: false,
                pg_provider: "",
                pg_method: "",
            },
        ]);
        setMode("offline");
    };

    /** Switch to debt/kasbon mode */
    const goDebt = () => {
        setPayments([
            {
                method_id: debtMethod?.id ?? "",
                amount: displayTotal,
                reference_no: "",
                is_pg: false,
                pg_provider: "",
                pg_method: "",
            },
        ]);
        setCustomerQuery("");
        setDebtSubMode(null);
        setMode("debt");
    };

    /** Go back to mode chooser */
    const goBack = () => {
        setPayments([
            {
                method_id: offlineMethods[0]?.id ?? "",
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
    const change = Math.max(0, totalPaid - displayTotal);
    const remaining = Math.max(0, displayTotal - totalPaid);

    // Porsi yang dibayar via metode hutang pada mode debt (dipakai utk cek limit)
    const debtPortion = payments
        .filter((p) => p.method_id === debtMethod?.id)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const debtExceedsLimit =
        mode === "debt" &&
        customer &&
        Number(customer.credit_limit) > 0 &&
        Number(customer.debt_balance) + debtPortion > Number(customer.credit_limit);

    const update = (i, key, val) =>
        setPayments((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)),
        );
    const add = () =>
        setPayments((prev) => [
            ...prev,
            {
                method_id: offlineMethods[0]?.id ?? "",
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
              Math.ceil(displayTotal / 10000) * 10000,
              Math.ceil(displayTotal / 50000) * 50000,
          ].filter((v, i, a) => a.indexOf(v) === i)
        : [];

    /** Tambah baris tunai untuk split bayar-sebagian di mode hutang */
    const addCashSplit = () =>
        setPayments((prev) => [
            ...prev,
            {
                method_id: cashMethod?.id ?? offlineMethods[0]?.id ?? "",
                amount: remaining,
                reference_no: "",
                is_pg: false,
                pg_provider: "",
                pg_method: "",
            },
        ]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />

            <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl">
                <div className="shrink-0 flex items-center justify-between border-b border-border px-5 py-4">
                    <div className="flex items-center gap-2">
                        {mode && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="text-muted-foreground/60 hover:text-card-foreground transition"
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
                        <h3 className="font-semibold text-foreground">
                            {!mode
                                ? "Pilih Metode Pembayaran"
                                : mode === "offline"
                                  ? "Pembayaran Offline"
                                  : mode === "debt"
                                    ? "Hutang / Kasbon"
                                    : "Pembayaran Online"}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground/60 hover:text-card-foreground"
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
                <div className="shrink-0 bg-primary/10 px-5 py-4">
                    {roundingAdjustment !== 0 && (
                        <div className="flex justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Subtotal</span>
                            <span className="text-xs text-muted-foreground">{fmt(grandTotal)}</span>
                        </div>
                    )}
                    {roundingAdjustment !== 0 && (
                        <div className="flex justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Pembulatan</span>
                            <span className="text-xs text-success">
                                {roundingAdjustment > 0 ? '+' : ''}{fmt(roundingAdjustment)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                            Total Bayar
                        </span>
                        <span className="text-xl font-bold text-primary">
                            {fmt(displayTotal)}
                        </span>
                    </div>
                </div>

                {/* ═══ MODE: CHOOSE ═══ */}
                {!mode && (
                    <div className="flex-1 overflow-y-auto min-h-0 px-5 py-6 space-y-3">
                        <button
                            type="button"
                            onClick={goOffline}
                            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-5 text-left transition hover:border-emerald-400 hover:bg-success/10 hover:shadow-md"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl transition group-hover:bg-emerald-200">
                                💵
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-bold text-foreground group-hover:text-success">
                                    Bayar Offline
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Tunai, kartu debit/kredit, transfer bank
                                </p>
                            </div>
                            <svg
                                className="h-5 w-5 text-muted-foreground/30 group-hover:text-success transition"
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
                                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-5 text-left transition hover:border-indigo-400 hover:bg-primary/10 hover:shadow-md"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl transition group-hover:bg-indigo-200">
                                    🌐
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-foreground group-hover:text-primary">
                                        Bayar Online
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        QRIS, e-wallet, virtual account
                                    </p>
                                </div>
                                <svg
                                    className="h-5 w-5 text-muted-foreground/30 group-hover:text-indigo-500 transition"
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

                        {debtMethod && (
                            <button
                                type="button"
                                onClick={goDebt}
                                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-5 text-left transition hover:border-amber-400 hover:bg-warning/10 hover:shadow-md"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl transition group-hover:bg-amber-200">
                                    📒
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-foreground group-hover:text-warning">
                                        Hutang / Kasbon
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Catat sebagai hutang pelanggan
                                    </p>
                                </div>
                                <svg
                                    className="h-5 w-5 text-muted-foreground/30 group-hover:text-amber-500 transition"
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
                    <>
                        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">
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
                                                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${Number(payments[0].amount) === v ? "border-emerald-500 bg-success/10 text-success" : "border-border text-muted-foreground hover:border-emerald-300"}`}
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
                                    className="space-y-2 rounded-xl border border-border p-3"
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
                                            {offlineMethods.map((m) => (
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
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground/60">
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
                                                className="shrink-0 rounded-lg border border-emerald-200 bg-success/10 px-2.5 py-2 text-[11px] font-bold text-success hover:bg-emerald-100 transition"
                                                title="Isi sisa pembayaran"
                                            >
                                                Sisa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {payments.length < offlineMethods.length && (
                                <button
                                    type="button"
                                    onClick={add}
                                    className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-xs font-medium text-muted-foreground hover:border-emerald-300 hover:text-success transition"
                                >
                                    + Tambah metode pembayaran (split)
                                </button>
                            )}
                        </div>

                        {/* Fixed: Summary */}
                        <div className="shrink-0 border-t border-border px-5 py-3 bg-card">
                            <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Dibayar
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {fmt(totalPaid)}
                                    </span>
                                </div>
                                {change > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Kembalian
                                        </span>
                                        <span className="font-bold text-success">
                                            {fmt(change)}
                                        </span>
                                    </div>
                                )}
                                {remaining > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Kurang
                                        </span>
                                        <span className="font-bold text-red-600">
                                            {fmt(remaining)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ MODE: DEBT / KASBON ═══ */}
                {mode === "debt" && (
                    <>
                        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">
                            {/* ── Pelanggan belum dipilih: tampilkan pencarian ── */}
                            {!customer && (
                                <div>
                                    <p className="mb-2 text-sm font-semibold text-foreground">
                                        Pilih Pelanggan <span className="text-destructive">*</span>
                                    </p>
                                    <div className="relative mb-2">
                                        <svg
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                            />
                                        </svg>
                                        <input
                                            type="text"
                                            value={customerQuery}
                                            onChange={(e) => setCustomerQuery(e.target.value)}
                                            placeholder="Cari nama, telepon, atau kode..."
                                            className="w-full rounded-xl border-slate-300 pl-9 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        {filteredCustomers.length === 0 ? (
                                            <p className="px-2 py-4 text-center text-xs text-muted-foreground/60">
                                                Pelanggan tidak ditemukan
                                            </p>
                                        ) : (
                                            filteredCustomers.map((c) => {
                                                const cCredit =
                                                    (c.credit_limit ?? 0) - (c.debt_balance ?? 0);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => onSelectCustomer?.(c.id)}
                                                        className="flex w-full items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-left transition hover:border-amber-300 hover:bg-warning/10"
                                                    >
                                                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-muted-foreground">
                                                            {c.name?.charAt(0)?.toUpperCase()}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-foreground">
                                                                {c.name}
                                                            </p>
                                                            <p className="truncate text-[10.5px] text-muted-foreground/60">
                                                                {c.phone ? c.phone : c.code ?? ""}
                                                            </p>
                                                        </div>
                                                        {c.credit_limit > 0 && (
                                                            <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                                                                Sisa limit{" "}
                                                                <span className={cCredit > 0 ? "text-success" : "text-destructive"}>
                                                                    {fmt(cCredit)}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Pelanggan sudah dipilih: tampilkan info + form ── */}
                            {customer && (
                                <>
                                    <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-warning/10 px-3 py-2.5">
                                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-800">
                                            {customer.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {customer.name}
                                            </p>
                                            <p className="truncate text-[10.5px] text-muted-foreground">
                                                {customer.phone ?? customer.code ?? ""}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onSelectCustomer?.("")}
                                            className="shrink-0 rounded-full p-1 text-amber-500 hover:bg-amber-200 hover:text-amber-800 transition"
                                            title="Ganti pelanggan"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Detail hutang pelanggan — ringkas tapi lengkap */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-xl bg-muted/50 px-3 py-2">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                                                Hutang saat ini
                                            </p>
                                            <p className="mt-0.5 text-sm font-bold text-foreground">
                                                {fmt(customer.debt_balance ?? 0)}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-muted/50 px-3 py-2">
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                                                Limit kredit
                                            </p>
                                            <p className="mt-0.5 text-sm font-bold text-foreground">
                                                {customer.credit_limit > 0
                                                    ? fmt(customer.credit_limit)
                                                    : "Tanpa limit"}
                                            </p>
                                        </div>
                                    </div>
                                    {customer.credit_limit > 0 && (
                                        <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                            Sisa limit tersedia:{" "}
                                            <strong>{fmt(availableCredit)}</strong>
                                        </div>
                                    )}

                                    {/* ─── Pilihan: Full Hutang vs Bayar Sebagian ─── */}
                                    {debtSubMode === null && (
                                        <div className="space-y-2 pt-1">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Bagaimana pelanggan ingin membayar?
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDebtSubMode("full");
                                                    setPayments([{
                                                        method_id: debtMethod?.id ?? "",
                                                        amount: displayTotal,
                                                        reference_no: "",
                                                        is_pg: false,
                                                        pg_provider: "",
                                                        pg_method: "",
                                                    }]);
                                                }}
                                                className="group flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition hover:border-amber-400 hover:bg-warning/10 hover:shadow-sm"
                                            >
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl transition group-hover:bg-amber-200">
                                                    📒
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-foreground group-hover:text-warning">
                                                        Full Hutang
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Seluruh {fmt(displayTotal)} dicatat sebagai hutang
                                                    </p>
                                                </div>
                                                <svg className="h-5 w-5 text-muted-foreground/30 group-hover:text-amber-500 transition" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDebtSubMode("partial");
                                                    // Default: hutang separuh, bayar separuh
                                                    const halfDebt = Math.ceil(displayTotal / 2);
                                                    setPayments([
                                                        {
                                                            method_id: cashMethod?.id ?? offlineMethods[0]?.id ?? "",
                                                            amount: displayTotal - halfDebt,
                                                            reference_no: "",
                                                            is_pg: false,
                                                            pg_provider: "",
                                                            pg_method: "",
                                                        },
                                                        {
                                                            method_id: debtMethod?.id ?? "",
                                                            amount: halfDebt,
                                                            reference_no: "",
                                                            is_pg: false,
                                                            pg_provider: "",
                                                            pg_method: "",
                                                        },
                                                    ]);
                                                }}
                                                className="group flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition hover:border-emerald-400 hover:bg-success/10 hover:shadow-sm"
                                            >
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl transition group-hover:bg-emerald-200">
                                                    💵
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-foreground group-hover:text-success">
                                                        Bayar Sebagian
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Bayar tunai/transfer dulu, sisanya hutang
                                                    </p>
                                                </div>
                                                <svg className="h-5 w-5 text-muted-foreground/30 group-hover:text-success transition" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {/* ─── Full Hutang — konfirmasi ringkas ─── */}
                                    {debtSubMode === "full" && (
                                        <div className="rounded-2xl border border-amber-200 bg-warning/10/50 p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-amber-800">
                                                    Seluruhnya dihutang
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setDebtSubMode(null)}
                                                    className="text-[11px] font-medium text-warning hover:text-amber-800 underline underline-offset-2"
                                                >
                                                    Ubah
                                                </button>
                                            </div>
                                            <p className="text-2xl font-bold text-warning tabular-nums">
                                                {fmt(displayTotal)}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Hutang {customer.name} akan bertambah menjadi{" "}
                                                <strong>{fmt((customer.debt_balance ?? 0) + displayTotal)}</strong>
                                            </p>
                                        </div>
                                    )}

                                    {/* ─── Bayar Sebagian — form split ─── */}
                                    {debtSubMode === "partial" && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-foreground">
                                                    Bayar Sebagian
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setDebtSubMode(null)}
                                                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
                                                >
                                                    Ubah
                                                </button>
                                            </div>

                                            {/* Baris pertama: bayar tunai/kartu */}
                                            <div className="space-y-2 rounded-xl border border-emerald-200 bg-success/10/30 p-3">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-success">
                                                    Dibayar sekarang
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={payments[0]?.method_id ?? ""}
                                                        onChange={(e) => update(0, "method_id", Number(e.target.value))}
                                                        className="flex-1 rounded-xl border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                    >
                                                        {offlineMethods.map((m) => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground/60">Rp</span>
                                                    <input
                                                        type="number"
                                                        value={payments[0]?.amount ?? ""}
                                                        onChange={(e) => {
                                                            const cashAmt = Number(e.target.value) || 0;
                                                            const debtAmt = Math.max(0, displayTotal - cashAmt);
                                                            update(0, "amount", e.target.value);
                                                            if (payments[1]) update(1, "amount", debtAmt);
                                                        }}
                                                        className="block w-full rounded-xl border-slate-300 pl-9 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                    />
                                                </div>
                                            </div>

                                            {/* Baris kedua: sisa menjadi hutang */}
                                            <div className="space-y-2 rounded-xl border border-amber-200 bg-warning/10/30 p-3">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-warning">
                                                    Dicatat sebagai hutang
                                                </p>
                                                <p className="text-lg font-bold text-warning tabular-nums">
                                                    {fmt(Number(payments[1]?.amount) || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {debtExceedsLimit && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                            Hutang melebihi limit kredit. Kurangi jumlah hutang atau tambah pembayaran tunai.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Fixed: Summary */}
                        {customer && debtSubMode && (
                            <div className="shrink-0 border-t border-border px-5 py-3 bg-card">
                                <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Dicatat sebagai hutang</span>
                                        <span className="font-semibold text-warning">{fmt(debtPortion)}</span>
                                    </div>
                                    {debtSubMode === "partial" && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Dibayar tunai</span>
                                            <span className="font-semibold text-foreground">{fmt(totalPaid - debtPortion)}</span>
                                        </div>
                                    )}
                                    {remaining > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Kurang</span>
                                            <span className="font-bold text-red-600">{fmt(remaining)}</span>
                                        </div>
                                    )}
                                    {change > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Kembalian</span>
                                            <span className="font-bold text-success">{fmt(change)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ MODE: ONLINE — PG method chooser ═══ */}
                {mode === "online" && !isPgPayment && pgMethods?.length > 0 && (
                    <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
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
                                                ? "col-span-2 border-indigo-200 bg-primary/10/50 hover:border-indigo-400 hover:bg-primary/10"
                                                : "border-border bg-card hover:border-primary/30 hover:bg-primary/10/30"
                                        }`}
                                    >
                                        <span className="text-2xl">
                                            {lbl.icon}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-foreground">
                                                {lbl.label}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60">
                                                {isQris
                                                    ? "Scan dengan semua aplikasi"
                                                    : "Pembayaran instan"}
                                            </p>
                                        </div>
                                        <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-primary group-hover:bg-indigo-200">
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
                    <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">
                        <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4">
                            <span className="text-2xl">
                                {PG_METHOD_LABELS[payments[0]?.pg_method]
                                    ?.icon ?? "💳"}
                            </span>
                            <div>
                                <p className="text-sm font-bold text-foreground">
                                    {PG_METHOD_LABELS[payments[0]?.pg_method]
                                        ?.label ?? payments[0]?.pg_method}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {fmt(displayTotal)}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-warning/10 px-4 py-3 text-xs text-warning">
                            <span className="font-semibold">
                                Pembayaran Online
                            </span>{" "}
                            — Pelanggan akan scan QR atau transfer ke VA.
                            Setelah pembayaran dikonfirmasi, stok otomatis
                            terpotong.
                        </div>
                        {/* Summary */}
                        <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-semibold text-foreground">
                                    {fmt(displayTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ BOTTOM BUTTON ═══ */}
                <div className="shrink-0 border-t border-border px-5 py-4">
                    {mode === "offline" && (
                        <button
                            type="button"
                            disabled={totalPaid < displayTotal || submitting}
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
                            ) : totalPaid < displayTotal ? (
                                `Kurang ${fmt(remaining)}`
                            ) : (
                                "Proses Pembayaran"
                            )}
                        </button>
                    )}
                    {mode === "debt" && customer && debtSubMode && (
                        <button
                            type="button"
                            disabled={
                                submitting ||
                                debtExceedsLimit ||
                                totalPaid < displayTotal ||
                                debtPortion <= 0
                            }
                            onClick={() => onConfirm(payments, change)}
                            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : debtExceedsLimit ? (
                                "Melebihi limit kredit"
                            ) : totalPaid < displayTotal ? (
                                `Kurang ${fmt(remaining)}`
                            ) : debtSubMode === "full" ? (
                                `Catat Hutang — ${fmt(displayTotal)}`
                            ) : (
                                `Proses — Hutang ${fmt(debtPortion)}`
                            )}
                        </button>
                    )}
                    {mode === "online" && isPgPayment && (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => onConfirm(payments, change)}
                            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
