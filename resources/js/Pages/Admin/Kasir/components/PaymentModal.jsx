import { useState, useMemo, useEffect, useCallback } from "react";
import { fmt, PG_METHOD_LABELS, findPgPaymentMethod } from "./helpers";

/* ── uid kecil untuk split payers ── */
let _uid = 0;
const uid = () => ++_uid;

export default function PaymentModal({
    grandTotal,
    roundedGrandTotal,
    roundingAdjustment = 0,
    cashRoundingEnabled = false,
    cashRoundingNearest = 100,
    cashRoundingMode = "nearest",
    roundingOverrideMode = "store_default",
    setRoundingOverrideMode,
    roundingCustomValue = "",
    setRoundingCustomValue,
    paymentMethods,
    pgMethods = [],
    onConfirm,
    onClose,
    submitting,
    selectedCustomer = null,
    customers = [],
    onSelectCustomer,
    cartItems = [],
    // Split bill callbacks
    onSplitStart,
    onSplitPayOffline,
    onSplitCreatePg,
    resumeData = null,
}) {
    const displayTotal = roundedGrandTotal ?? grandTotal;

    // Metode non-hutang dipakai di mode "offline" — hutang punya alur sendiri.
    const offlineMethods = paymentMethods.filter((m) => m.type !== "debt");
    const debtMethod = paymentMethods.find((m) => m.type === "debt");

    const [mode, setMode] = useState(null); // null = choose, 'offline', 'online', 'debt', 'split'
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

    // ── Split Bill Wizard state ────────────────────────────────────
    // splitStep: 1 = pilih mode, 2 = jumlah orang, 3 = assign item, 4 = bayar
    const [splitStep, setSplitStep] = useState(1);
    const [splitMode, setSplitMode] = useState("item"); // 'item' | 'equal'
    const [splitReceiptMode, setSplitReceiptMode] = useState("per_payer"); // '1' | 'per_payer'

    const makePayer = (name) => ({
        _id: uid(),
        name,
        customer_id: null,
        customerQuery: "",
        showCustomerSearch: false,
        method_id: offlineMethods[0]?.id ?? "",
        assignments: [], // [{ cartId, unitIndex }]
        subtotal: 0,
        discount: 0,
        tax: 0,
        service: 0,
        total: 0,
        paid_amount: "",
        paid: false,
    });

    const [payers, setPayers] = useState([]);

    // Split bill new state
    const [splitSaleId, setSplitSaleId] = useState(null);
    const [splitStarting, setSplitStarting] = useState(false);
    const [imageModalMethod, setImageModalMethod] = useState(null);
    // Track pay mode per payer: { [payerId]: 'offline' | 'online' }
    const [payerPayModes, setPayerPayModes] = useState({});
    // Track which payer is currently processing PG
    const [activePgPayer, setActivePgPayer] = useState(null);

    // Initialize from resume data
    useEffect(() => {
        if (resumeData && resumeData.payers) {
            setMode("split");
            setSplitStep(4);
            setSplitSaleId(resumeData.sale_id);
            setPayers(
                resumeData.payers.map((p) => ({
                    _id: p.id,
                    name: p.name,
                    customer_id: p.customer_id,
                    customerQuery: "",
                    showCustomerSearch: false,
                    method_id: p.payment_method_id || offlineMethods[0]?.id || "",
                    assignments: [],
                    subtotal: p.subtotal,
                    discount: p.discount,
                    tax: p.tax,
                    service: 0,
                    total: p.total,
                    paid_amount: p.paid_amount || "",
                    paid: p.status === "paid",
                    pgLoading: false,
                })),
            );
        }
    }, [resumeData]);

    // Total unit assignable (qty dipecah per unit)
    const totalUnits = useMemo(
        () => cartItems.reduce((s, it) => s + Number(it.qty || 1), 0),
        [cartItems],
    );
    const cartSubtotal = useMemo(
        () => cartItems.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0),
        [cartItems],
    );
    // Total diskon & pajak yang berlaku di transaksi (dari total keseluruhan)
    const totalDiscTax = Math.max(0, cartSubtotal - displayTotal); // net effect, dipakai proporsional sederhana

    const updatePayer = (id, patch) =>
        setPayers((prev) => prev.map((p) => (p._id === id ? { ...p, ...patch } : p)));

    const removePayer = (id) =>
        setPayers((prev) => prev.filter((p) => p._id !== id));

    /** Set jumlah orang — generate ulang array payers, pertahankan nama yang sudah diketik jika masih ada */
    const setPayerCount = (count) => {
        setPayers((prev) => {
            const next = [];
            for (let i = 0; i < count; i++) {
                if (prev[i]) {
                    next.push(prev[i]);
                } else {
                    next.push(makePayer(`Orang ${i + 1}`));
                }
            }
            return next;
        });
    };

    /** Assign 1 unit item ke payer tertentu (atau null untuk "Belum") */
    const assignUnit = (cartId, unitIndex, payerId) => {
        setPayers((prev) =>
            prev.map((p) => {
                const filtered = p.assignments.filter(
                    (a) => !(a.cartId === cartId && a.unitIndex === unitIndex),
                );
                if (String(p._id) === String(payerId)) {
                    return { ...p, assignments: [...filtered, { cartId, unitIndex }] };
                }
                return { ...p, assignments: filtered };
            }),
        );
    };

    const getUnitOwner = (cartId, unitIndex) =>
        payers.find((p) => p.assignments.some((a) => a.cartId === cartId && a.unitIndex === unitIndex));

    const assignedUnitsCount = payers.reduce((s, p) => s + p.assignments.length, 0);
    const allUnitsAssigned = assignedUnitsCount === totalUnits && totalUnits > 0;

    /** Hitung subtotal per payer dari assignments (by-item mode) lalu alokasikan diskon/pajak proporsional */
    const recalcSplitFromItems = () => {
        const itemMap = {};
        cartItems.forEach((item) => { itemMap[item.cartId] = item; });

        setPayers((prev) => {
            const withSubtotal = prev.map((p) => {
                const subtotal = p.assignments.reduce((s, a) => {
                    const it = itemMap[a.cartId];
                    return s + (it ? Number(it.price) : 0);
                }, 0);
                return { ...p, subtotal };
            });

            const sumSubtotal = withSubtotal.reduce((s, p) => s + p.subtotal, 0) || 1;
            const totalAdjust = displayTotal - sumSubtotal; // bisa negatif (diskon) atau positif (pajak/service)

            let allocatedSoFar = 0;
            return withSubtotal.map((p, i) => {
                const share = p.subtotal / sumSubtotal;
                let adjust = Math.round(share * totalAdjust);
                if (i === withSubtotal.length - 1) {
                    // sisa pembulatan masuk ke orang terakhir
                    adjust = totalAdjust - allocatedSoFar;
                } else {
                    allocatedSoFar += adjust;
                }
                const total = Math.max(0, p.subtotal + adjust);
                return { ...p, discount: adjust < 0 ? -adjust : 0, tax: adjust > 0 ? adjust : 0, total };
            });
        });
    };

    /** Bagi rata — dipakai untuk mode 'equal' */
    const applyEqualSplit = () => {
        setPayers((prev) => {
            const n = prev.length;
            if (n === 0) return prev;
            const each = Math.floor(displayTotal / n);
            const remainder = displayTotal - each * n;
            return prev.map((p, i) => {
                const total = i === n - 1 ? each + remainder : each;
                return { ...p, subtotal: total, discount: 0, tax: 0, total };
            });
        });
    };

    const goSplit = () => {
        setSplitStep(1);
        setSplitMode("item");
        setPayers([]);
        setSplitSaleId(null);
        setPayerPayModes({});
        setActivePgPayer(null);
        setMode("split");
    };

    const splitAllPaid = payers.length > 0 && payers.every((p) => p.paid);

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
        setSplitStep(1);
        setPayers([]);
        setSplitSaleId(null);
        setPayerPayModes({});
        setActivePgPayer(null);
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
              displayTotal,
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
                                    : mode === "split"
                                      ? "Split Bill"
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

                        {/* Split Bill */}
                        <button
                            type="button"
                            onClick={goSplit}
                            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-5 text-left transition hover:border-violet-400 hover:bg-violet-50 hover:shadow-md"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl transition group-hover:bg-violet-200">
                                🧾
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-bold text-foreground group-hover:text-violet-600">
                                    Split Bill
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Bayar terpisah per orang, struk per orang
                                </p>
                            </div>
                            <svg
                                className="h-5 w-5 text-muted-foreground/30 group-hover:text-violet-500 transition"
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

                            {/* Rounding override — only for cash payments */}
                            {cashRoundingEnabled && payments.length === 1 && cashMethod && payments[0].method_id === cashMethod.id && (
                                <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pembulatan</p>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {[
                                            { v: "store_default", l: `Default (${cashRoundingMode === "up" ? "↑" : cashRoundingMode === "down" ? "↓" : "↕"})` },
                                            { v: "down", l: `Ke Bawah ${fmt(Math.floor(grandTotal / cashRoundingNearest) * cashRoundingNearest)}` },
                                            { v: "up", l: `Ke Atas ${fmt(Math.ceil(grandTotal / cashRoundingNearest) * cashRoundingNearest)}` },
                                            { v: "custom", l: "Custom" },
                                        ].map((opt) => (
                                            <button
                                                key={opt.v}
                                                type="button"
                                                onClick={() => setRoundingOverrideMode(opt.v)}
                                                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                                    roundingOverrideMode === opt.v
                                                        ? "bg-violet-100 text-violet-700 border border-violet-300"
                                                        : "bg-card text-muted-foreground border border-border hover:border-violet-300"
                                                }`}
                                            >
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                    {roundingOverrideMode === "custom" && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Rp</span>
                                            <input
                                                type="number"
                                                value={roundingCustomValue}
                                                onChange={(e) => setRoundingCustomValue(e.target.value)}
                                                placeholder={String(displayTotal)}
                                                className="flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs focus:border-violet-400 focus:outline-none"
                                            />
                                            {roundingCustomValue !== "" && Math.abs(Number(roundingCustomValue) - grandTotal) > cashRoundingNearest && (
                                                <span className="text-[10px] text-destructive">Maks ±{fmt(cashRoundingNearest)}</span>
                                            )}
                                        </div>
                                    )}
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
                                        {(() => {
                                            const selMethod = offlineMethods.find((m) => String(m.id) === String(p.method_id));
                                            return selMethod?.image ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setImageModalMethod(selMethod)}
                                                    className="shrink-0 rounded-lg border border-border px-2.5 py-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                    title="Lihat gambar QR"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>
                                                </button>
                                            ) : null;
                                        })()}
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
                                                <strong>{fmt(Number(customer.debt_balance ?? 0) + Number(displayTotal))}</strong>
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

                {/* ═══ MODE: SPLIT BILL — WIZARD 4 STEP ═══ */}
                {mode === "split" && (
                    <>
                        {/* Step indicator */}
                        <div className="shrink-0 flex items-center gap-1.5 px-5 py-3 border-b border-border">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex items-center gap-1.5 flex-1">
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition
                                        ${splitStep === s ? "bg-violet-600 text-white" : splitStep > s ? "bg-violet-100 text-violet-600" : "bg-muted text-muted-foreground/50"}`}>
                                        {splitStep > s ? "✓" : s}
                                    </span>
                                    {s < 4 && <span className={`h-0.5 flex-1 rounded ${splitStep > s ? "bg-violet-300" : "bg-muted"}`} />}
                                </div>
                            ))}
                        </div>

                        {/* ── STEP 1: Pilih Mode ── */}
                        {splitStep === 1 && (() => {
                            const uniqueItemCount = new Set(cartItems.map((i) => i.cartId)).size;
                            const canSplitPerItem = totalUnits > 1 || uniqueItemCount > 1;
                            return (
                            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-6 space-y-4">
                                <p className="text-center text-sm font-semibold text-foreground">Bagaimana cara membagi bill?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button"
                                        disabled={!canSplitPerItem}
                                        onClick={() => { setSplitMode("item"); setSplitStep(2); }}
                                        className={`group flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${
                                            canSplitPerItem
                                                ? 'border-border bg-card hover:border-violet-400 hover:bg-violet-50 cursor-pointer'
                                                : 'border-border/50 bg-muted/30 opacity-50 cursor-not-allowed'
                                        }`}>
                                        <span className="text-3xl">🧾</span>
                                        <p className={`text-sm font-bold ${canSplitPerItem ? 'text-foreground group-hover:text-violet-600' : 'text-muted-foreground'}`}>Per Item</p>
                                        <p className="text-[11px] text-muted-foreground text-center">
                                            {canSplitPerItem ? 'Bayar sesuai menu yang dipilih' : 'Butuh >1 item atau >1 jenis'}
                                        </p>
                                    </button>
                                    <button type="button"
                                        onClick={() => { setSplitMode("equal"); setSplitStep(2); }}
                                        className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-5 transition hover:border-violet-400 hover:bg-violet-50">
                                        <span className="text-3xl">⚖️</span>
                                        <p className="text-sm font-bold text-foreground group-hover:text-violet-600">Bagi Rata</p>
                                        <p className="text-[11px] text-muted-foreground text-center">Total dibagi rata per orang</p>
                                    </button>
                                </div>
                                <p className="text-center text-[12px] text-muted-foreground">
                                    Total transaksi: <span className="font-bold text-foreground">{fmt(displayTotal)}</span>
                                </p>
                            </div>
                            );
                        })()}

                        {/* ── STEP 2: Jumlah Orang + Nama ── */}
                        {splitStep === 2 && (
                            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">
                                <p className="text-sm font-semibold text-foreground">Berapa orang?</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {[2, 3, 4, 5, 6].map((n) => (
                                        <button key={n} type="button"
                                            onClick={() => setPayerCount(n)}
                                            className={`h-10 w-10 rounded-xl border-2 text-sm font-bold transition
                                                ${payers.length === n ? "border-violet-500 bg-violet-100 text-violet-700" : "border-border text-muted-foreground hover:border-violet-300"}`}>
                                            {n}
                                        </button>
                                    ))}
                                    <button type="button"
                                        onClick={() => setPayerCount(Math.min(10, payers.length + 1 || 2))}
                                        className="h-10 w-10 rounded-xl border-2 border-dashed border-border text-sm font-bold text-muted-foreground transition hover:border-violet-300">
                                        +
                                    </button>
                                </div>

                                {payers.length > 0 && (
                                    <div className="space-y-2">
                                        {payers.map((payer, i) => (
                                            <div key={payer._id} className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
                                                        {i + 1}
                                                    </span>
                                                    <input type="text"
                                                        placeholder={`Orang ${i + 1}`}
                                                        value={payer.name}
                                                        onChange={(e) => updatePayer(payer._id, { name: e.target.value })}
                                                        className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-[13px] outline-none focus:border-violet-400" />
                                                    <button type="button"
                                                        onClick={() => updatePayer(payer._id, { showCustomerSearch: !payer.showCustomerSearch })}
                                                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted transition"
                                                        title="Cari pelanggan">
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.773 4.773z" />
                                                        </svg>
                                                    </button>
                                                    {payers.length > 2 && (
                                                        <button type="button" onClick={() => removePayer(payer._id)}
                                                            className="rounded-lg p-1.5 text-destructive/60 hover:bg-destructive/10 transition">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                {payer.showCustomerSearch && (
                                                    <div className="ml-9 space-y-1.5">
                                                        <input type="text" placeholder="Cari pelanggan..."
                                                            value={payer.customerQuery}
                                                            onChange={(e) => updatePayer(payer._id, { customerQuery: e.target.value })}
                                                            className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-[12px] outline-none focus:border-violet-400" />
                                                        <div className="max-h-28 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border">
                                                            {customers.filter((c) => {
                                                                const q = (payer.customerQuery || "").toLowerCase();
                                                                return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
                                                            }).slice(0, 5).map((c) => (
                                                                <button key={c.id} type="button"
                                                                    onClick={() => updatePayer(payer._id, { customer_id: c.id, name: c.name, showCustomerSearch: false })}
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50">
                                                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                                                                        {c.name?.charAt(0)}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[12px] font-medium text-foreground truncate">{c.name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── STEP 3: Assign Item per Unit (hanya mode 'item') ── */}
                        {splitStep === 3 && splitMode === "item" && (
                            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">Assign menu ke siapa?</p>
                                    <span className={`text-[11px] font-semibold ${allUnitsAssigned ? "text-success" : "text-warning"}`}>
                                        {assignedUnitsCount}/{totalUnits} unit terbagi
                                    </span>
                                </div>
                                {cartItems.map((item) => {
                                    const qty = Number(item.qty) || 1;
                                    return (
                                        <div key={item.cartId} className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[12.5px] font-semibold text-foreground">{item.name}</p>
                                                <p className="text-[11px] text-muted-foreground">{fmt(item.price)}/unit</p>
                                            </div>
                                            <div className="space-y-1">
                                                {Array.from({ length: qty }).map((_, unitIndex) => {
                                                    const owner = getUnitOwner(item.cartId, unitIndex);
                                                    return (
                                                        <div key={unitIndex} className="flex items-center gap-2">
                                                            <span className={`w-14 shrink-0 text-[10.5px] font-medium ${owner ? "text-success" : "text-muted-foreground"}`}>
                                                                Unit {unitIndex + 1}
                                                            </span>
                                                            <select
                                                                value={owner?._id ?? ""}
                                                                onChange={(e) => assignUnit(item.cartId, unitIndex, e.target.value || null)}
                                                                className={`flex-1 rounded-lg border text-[11.5px] px-2 py-1.5 outline-none transition
                                                                    ${owner ? "border-success/30 bg-success/5 text-foreground" : "border-warning/40 bg-warning/5 text-warning"}`}>
                                                                <option value="">— Belum —</option>
                                                                {payers.map((p, i) => (
                                                                    <option key={p._id} value={p._id}>{p.name || `Orang ${i + 1}`}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── STEP 4: Bayar Gantian ── */}
                        {splitStep === 4 && (
                            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">
                                {/* Struk mode */}
                                <div className="rounded-2xl border border-border bg-muted/30 p-3.5 space-y-2">
                                    <p className="text-[12px] font-semibold text-foreground">Struk</p>
                                    {[["per_payer", `Struk per orang (${payers.length} struk)`], ["1", "1 struk total"]].map(([v, l]) => (
                                        <label key={v} className="flex items-center gap-2.5 cursor-pointer">
                                            <input type="radio" name="splitReceipt" value={v}
                                                checked={splitReceiptMode === v}
                                                onChange={() => setSplitReceiptMode(v)}
                                                className="accent-violet-600" />
                                            <span className="text-[13px] text-foreground">{l}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Payer cards */}
                                {payers.map((payer, i) => {
                                    const payMode = payerPayModes[payer._id] || "offline";
                                    const isPaid = payer.paid;
                                    const selectedMethod = offlineMethods.find((m) => String(m.id) === String(payer.method_id));
                                    const isCash = selectedMethod?.type === "cash";
                                    const hasImage = !!selectedMethod?.image;
                                    const paidAmt = Number(payer.paid_amount) || 0;
                                    const payerChange = isCash ? Math.max(0, paidAmt - payer.total) : 0;
                                    const itemCount = payer.assignments?.length ?? 0;

                                    return (
                                        <div key={payer._id}
                                            className={`rounded-2xl border-2 p-4 space-y-3 transition ${isPaid ? "border-success/30 bg-success/5" : "border-border bg-card"}`}>
                                            {/* Header */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{payer.name || `Orang ${i + 1}`}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {splitMode === "item" ? `${itemCount} item · ` : ""}Tagihan {fmt(payer.total)}
                                                    </p>
                                                </div>
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[12px] font-bold text-success">
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                        Lunas
                                                    </span>
                                                ) : null}
                                            </div>

                                            {splitMode === "item" && (payer.discount > 0 || payer.tax > 0) && (
                                                <div className="flex gap-3 text-[11px] text-muted-foreground">
                                                    {payer.discount > 0 && <span>Diskon −{fmt(payer.discount)}</span>}
                                                    {payer.tax > 0 && <span>Pajak +{fmt(payer.tax)}</span>}
                                                </div>
                                            )}

                                            {!isPaid && (
                                                <>
                                                    {/* Toggle Offline/Online */}
                                                    {pgMethods?.length > 0 && (
                                                        <div className="inline-flex rounded-lg bg-muted p-0.5">
                                                            <button type="button"
                                                                onClick={() => setPayerPayModes((prev) => ({ ...prev, [payer._id]: "offline" }))}
                                                                className={`rounded-md px-3 py-1 text-[11px] font-semibold transition ${payMode === "offline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                                                                Offline
                                                            </button>
                                                            <button type="button"
                                                                onClick={() => setPayerPayModes((prev) => ({ ...prev, [payer._id]: "online" }))}
                                                                className={`rounded-md px-3 py-1 text-[11px] font-semibold transition ${payMode === "online" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                                                                Online
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Method selector */}
                                                    {payMode === "offline" ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={payer.method_id}
                                                                    onChange={(e) => updatePayer(payer._id, { method_id: Number(e.target.value) })}
                                                                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-violet-400">
                                                                    {offlineMethods.map((m) => (
                                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                                    ))}
                                                                </select>
                                                                {hasImage && (
                                                                    <button type="button"
                                                                        onClick={() => setImageModalMethod(selectedMethod)}
                                                                        className="shrink-0 rounded-lg border border-border px-2.5 py-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                                        title="Lihat gambar QR">
                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {isCash && (
                                                                <div className="flex gap-2 items-center">
                                                                    <div className="relative flex-1">
                                                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground/60">Rp</span>
                                                                        <input type="number" min={0}
                                                                            placeholder={String(payer.total)}
                                                                            value={payer.paid_amount}
                                                                            onChange={(e) => updatePayer(payer._id, { paid_amount: e.target.value })}
                                                                            className="block w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-[13px] outline-none focus:border-violet-400" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {isCash && payerChange > 0 && (
                                                                <div className="flex justify-between rounded-lg bg-success/10 px-3 py-1.5">
                                                                    <span className="text-[11px] text-success">Kembalian</span>
                                                                    <span className="text-[11px] font-bold text-success">{fmt(payerChange)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] text-primary">
                                                            Pembayaran online — akan dibuka popup QR/VA setelah klik Bayar
                                                        </div>
                                                    )}

                                                    {/* Bayar button */}
                                                    <button type="button"
                                                        disabled={payer.pgLoading || (payMode === "offline" && isCash && Number(payer.paid_amount || 0) < payer.total)}
                                                        onClick={async () => {
                                                            if (payMode === "offline") {
                                                                const result = await onSplitPayOffline?.({
                                                                    saleId: splitSaleId,
                                                                    payerId: payer._id,
                                                                    methodId: payer.method_id,
                                                                    paidAmount: isCash ? Number(payer.paid_amount) || payer.total : payer.total,
                                                                    splitMode,
                                                                    payers: payers.map((p) => ({
                                                                        name: p.name,
                                                                        customer_id: p.customer_id,
                                                                        assignments: p.assignments,
                                                                    })),
                                                                    items: cartItems,
                                                                    displayTotal,
                                                                    splitReceiptMode,
                                                                });
                                                                if (result?.success) {
                                                                    updatePayer(payer._id, { paid: true });
                                                                    if (result.all_paid && result.receipt) {
                                                                        // All done — parent will handle receipt display
                                                                    }
                                                                }
                                                            } else {
                                                                // Online (PG)
                                                                updatePayer(payer._id, { pgLoading: true });
                                                                const result = await onSplitCreatePg?.({
                                                                    saleId: splitSaleId,
                                                                    payerId: payer._id,
                                                                    provider: pgMethods[0]?.provider,
                                                                    paymentType: pgMethods[0]?.payment_type,
                                                                    splitMode,
                                                                    payers: payers.map((p) => ({
                                                                        name: p.name,
                                                                        customer_id: p.customer_id,
                                                                        assignments: p.assignments,
                                                                    })),
                                                                    items: cartItems,
                                                                    displayTotal,
                                                                    splitReceiptMode,
                                                                });
                                                                if (result?.success) {
                                                                    setActivePgPayer(payer._id);
                                                                } else {
                                                                    updatePayer(payer._id, { pgLoading: false });
                                                                }
                                                            }
                                                        }}
                                                        className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-2.5 text-[13px] font-bold text-white shadow-md shadow-violet-500/20 transition hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        {payer.pgLoading ? "Memproses..." : `Bayar ${fmt(payer.total)}`}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Progress */}
                                <div className="flex justify-between text-[12px] px-1">
                                    <span className="text-muted-foreground">Terbayar</span>
                                    <span className="font-semibold text-foreground">
                                        {payers.filter((p) => p.paid).length}/{payers.length} orang
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── Footer navigasi wizard ── */}
                        <div className="shrink-0 border-t border-border px-5 py-4 flex gap-2">
                            {splitStep > 1 && splitStep < 4 && (
                                <button type="button"
                                    onClick={() => {
                                        if (splitStep === 3) setSplitStep(2);
                                        else setSplitStep((s) => s - 1);
                                    }}
                                    className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition">
                                    Kembali
                                </button>
                            )}

                            {splitStep === 2 && (
                                <button type="button"
                                    disabled={payers.length < 2}
                                    onClick={() => {
                                        if (splitMode === "equal") {
                                            applyEqualSplit();
                                            setSplitStep(4);
                                        } else {
                                            setSplitStep(3);
                                        }
                                    }}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Lanjut →
                                </button>
                            )}

                            {splitStep === 3 && (
                                <button type="button"
                                    disabled={!allUnitsAssigned}
                                    onClick={() => { recalcSplitFromItems(); setSplitStep(4); }}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {allUnitsAssigned ? "Lanjut →" : `Assign ${totalUnits - assignedUnitsCount} unit lagi`}
                                </button>
                            )}

                            {splitStep === 4 && (
                                <button type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition">
                                    {payers.every((p) => p.paid) ? "Tutup" : "Tutup (lanjutkan nanti)"}
                                </button>
                            )}
                        </div>
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

            {/* Image modal for payment method QR/gambar */}
            {imageModalMethod && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div onClick={() => setImageModalMethod(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm rounded-2xl bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <div>
                                <h3 className="font-semibold text-foreground">{imageModalMethod.name}</h3>
                                <p className="text-xs text-muted-foreground">Tunjukkan gambar ini ke pelanggan</p>
                            </div>
                            <button onClick={() => setImageModalMethod(null)} className="text-muted-foreground hover:text-foreground">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-5 flex flex-col items-center gap-4">
                            <img
                                src={`/storage/${imageModalMethod.image}`}
                                alt={imageModalMethod.name}
                                className="max-h-80 rounded-xl object-contain"
                            />
                            <button
                                type="button"
                                onClick={() => setImageModalMethod(null)}
                                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg transition hover:from-emerald-600 hover:to-teal-700"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
