import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useMemo, useRef, useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

/* ── constants ───────────────────────────────────────── */
const TYPE_META = {
    cash: {
        label: "Tunai",
        color: "bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
        icon: "💵",
    },
    digital: {
        label: "Digital / QRIS",
        color: "bg-indigo-50 text-indigo-700",
        dot: "bg-indigo-500",
        icon: "📱",
    },
    card: {
        label: "Kartu",
        color: "bg-violet-50 text-violet-700",
        dot: "bg-violet-500",
        icon: "💳",
    },
    credit: {
        label: "Kredit / Tempo",
        color: "bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
        icon: "📋",
    },
};

const PG_METHOD_LABELS = {
    qris: { label: "QRIS", icon: "📱" },
    bca_va: { label: "VA BCA", icon: "🏦" },
    mandiri_va: { label: "VA Mandiri", icon: "🏦" },
    bri_va: { label: "VA BRI", icon: "🏦" },
    bni_va: { label: "VA BNI", icon: "🏦" },
    permata_va: { label: "VA Permata", icon: "🏦" },
};

const PG_PROVIDER_META = {
    midtrans: {
        label: "Midtrans",
        gradient: "from-green-500 to-teal-600",
        desc: "QRIS, VA Bank",
    },
};

/* ── tiny components ─────────────────────────────────── */
function TypeBadge({ type }) {
    const meta = TYPE_META[type] ?? {
        label: type,
        color: "bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
        icon: "💳",
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Nonaktif
        </span>
    );
}

function inputCls(err = false) {
    return `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${err ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"}`;
}

/* ── Payment Gateway provider card ──────────────────── */
function PgProviderCard({ provider, config }) {
    const meta = PG_PROVIDER_META[provider] ?? {
        label: provider,
        gradient: "from-slate-500 to-slate-600",
        desc: "",
    };
    const [saving, setSaving] = useState(false);
    const { data, setData, post, processing } = useForm({
        is_active: config?.is_active ?? false,
        environment: config?.environment ?? "sandbox",
        server_key: "",
        client_key: "",
        merchant_id: config?.merchant_id ?? "",
        enabled_methods: config?.enabled_methods ?? [],
    });

    const allMethods = Object.keys(PG_METHOD_LABELS);

    const toggleMethod = (method) => {
        setData(
            "enabled_methods",
            data.enabled_methods.includes(method)
                ? data.enabled_methods.filter((m) => m !== method)
                : [...data.enabled_methods, method],
        );
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        post(route("admin.payment-methods.pg.save", provider), {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <form onSubmit={handleSave}>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div
                    className={`flex items-center justify-between bg-gradient-to-r ${meta.gradient} px-5 py-4`}
                >
                    <div>
                        <h3 className="font-bold text-white">{meta.label}</h3>
                        <p className="text-xs text-white/70 mt-0.5">
                            {meta.desc}
                        </p>
                    </div>
                    <span
                        role="switch"
                        aria-checked={data.is_active}
                        onClick={() => setData("is_active", !data.is_active)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 select-none ${data.is_active ? "bg-white/40" : "bg-black/25"}`}
                    >
                        <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${data.is_active ? "translate-x-6" : "translate-x-1"}`}
                        />
                    </span>
                </div>

                {data.is_active && (
                    <>
                        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
                            <p className="text-xs font-medium text-slate-600">
                                Konfigurasi API
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    Environment
                                </label>
                                <select
                                    value={data.environment}
                                    onChange={(e) =>
                                        setData("environment", e.target.value)
                                    }
                                    className={inputCls()}
                                >
                                    <option value="sandbox">Sandbox</option>
                                    <option value="production">
                                        Production
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    Merchant ID
                                </label>
                                <input
                                    type="text"
                                    value={data.merchant_id}
                                    onChange={(e) =>
                                        setData("merchant_id", e.target.value)
                                    }
                                    className={inputCls()}
                                    placeholder="G123456"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    Server Key
                                </label>
                                <input
                                    type="password"
                                    value={data.server_key}
                                    onChange={(e) =>
                                        setData("server_key", e.target.value)
                                    }
                                    className={inputCls()}
                                    placeholder={
                                        config?.server_key
                                            ? "••••••••••••••••••••••••"
                                            : "Midtrans server key"
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                    Client Key
                                </label>
                                <input
                                    type="password"
                                    value={data.client_key}
                                    onChange={(e) =>
                                        setData("client_key", e.target.value)
                                    }
                                    className={inputCls()}
                                    placeholder={
                                        config?.client_key
                                            ? "••••••••••••••••••••••••"
                                            : "Midtrans client key"
                                    }
                                />
                            </div>
                        </div>
                        <div className="border-t border-slate-100 px-5 py-4">
                            <p className="mb-2 text-sm font-medium text-slate-700">
                                Metode Aktif
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {allMethods.map((m) => {
                                    const active =
                                        data.enabled_methods.includes(m);
                                    const lbl = PG_METHOD_LABELS[m];
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => toggleMethod(m)}
                                            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${active ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            {lbl.icon} {lbl.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                            <button
                                type="submit"
                                disabled={processing || saving}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {processing || saving
                                    ? "Menyimpan..."
                                    : "Simpan Konfigurasi"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </form>
    );
}

/* ── empty state ────────────────────────────────────── */
function EmptyState({ search, filterType }) {
    if (search || filterType !== "all") {
        return (
            <div className="py-16 text-center">
                <p className="text-slate-400">
                    Tidak ada metode yang cocok dengan filter.
                </p>
            </div>
        );
    }
    return (
        <div className="py-16 text-center">
            <svg
                className="mx-auto mb-3 h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.2}
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
            </svg>
            <p className="text-sm text-slate-400">
                Belum ada metode pembayaran
            </p>
        </div>
    );
}

/* ── Main component ─────────────────────────────────── */
export default function Index({ paymentMethods, pgConfigs, pgProviders = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(null);
    const [activeTab, setActiveTab] = useState("methods");
    const [dragOverIdx, setDragOverIdx] = useState(null);
    const [draggingIdx, setDraggingIdx] = useState(null);

    const filtered = useMemo(() => {
        let list = [...(paymentMethods ?? [])];
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter(
                (m) =>
                    m.name?.toLowerCase().includes(q) ||
                    m.code?.toLowerCase().includes(q),
            );
        }
        if (filterType !== "all") {
            list = list.filter((m) => m.type === filterType);
        }
        return list;
    }, [paymentMethods, filterType, search]);

    // Sorted by sort_order for display
    const sorted = useMemo(() => {
        return [...filtered].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
    }, [filtered]);

    const handleToggle = (method) => {
        setToggling(method.id);
        router.patch(
            route("admin.payment-methods.toggle", method.id),
            {},
            { preserveScroll: true, onFinish: () => setToggling(null) },
        );
    };

    const handleDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.payment-methods.destroy", target.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setTarget(null);
            },
        });
    };

    const handleSortUpdate = (method, value) => {
        const newOrder = parseInt(value) || 0;
        axios.patch(route("admin.payment-methods.sort", method.id), {
            sort_order: newOrder,
        });
    };

    // ── Drag & Drop handlers ──
    const dragItem = useRef(null);
    const dragOverIdxRef = useRef(null);
    const rowRefs = useRef({});
    const sortedRef = useRef(sorted);
    sortedRef.current = sorted;

    const handleGripMouseDown = (e, idx) => {
        e.preventDefault();
        dragItem.current = idx;
        dragOverIdxRef.current = idx;
        setDragOverIdx(idx);
        setDraggingIdx(idx);
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";

        const onMove = (ev) => {
            let closestIdx = null,
                closestDist = Infinity;
            Object.entries(rowRefs.current).forEach(([i, el]) => {
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const dist = Math.abs(
                    ev.clientY - (rect.top + rect.height / 2),
                );
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIdx = parseInt(i);
                }
            });
            if (closestIdx !== null && closestIdx !== dragOverIdxRef.current) {
                dragOverIdxRef.current = closestIdx;
                setDragOverIdx(closestIdx);
            }
        };

        const onUp = async () => {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            const from = dragItem.current;
            const to = dragOverIdxRef.current;
            dragItem.current = null;
            dragOverIdxRef.current = null;
            setDragOverIdx(null);
            setDraggingIdx(null);
            if (from === null || to === null || from === to) return;
            const a = sortedRef.current[from];
            const b = sortedRef.current[to];
            if (!a || !b) return;
            await axios.patch(route("admin.payment-methods.sort", a.id), {
                sort_order: b.sort_order ?? 0,
            });
            await axios.patch(route("admin.payment-methods.sort", b.id), {
                sort_order: a.sort_order ?? 0,
            });
            router.reload({ only: ["paymentMethods"] });
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    // Handle arrow moves
    const handleMove = async (method, direction) => {
        const idx = sorted.findIndex((m) => m.id === method.id);
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;
        const other = sorted[swapIdx];
        const aOrder = method.sort_order ?? 0;
        const bOrder = other.sort_order ?? 0;
        await axios.patch(route("admin.payment-methods.sort", method.id), {
            sort_order: bOrder,
        });
        await axios.patch(route("admin.payment-methods.sort", other.id), {
            sort_order: aOrder,
        });
        router.reload({ only: ["paymentMethods"] });
    };

    const activePgCount =
        pgProviders?.filter((p) => pgConfigs?.[p]?.is_active).length ?? 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Metode Pembayaran
                        </h2>
                        <p className="text-sm text-slate-400">
                            Atur metode bayar & payment gateway
                        </p>
                    </div>
                    <Link
                        href={route("admin.payment-methods.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
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
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Tambah
                    </Link>
                </div>
            }
        >
            <Head title="Metode Pembayaran" />

            <div className="space-y-5">
                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-white px-5 py-3 text-sm font-medium text-red-700 shadow-sm">
                        {flash.error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex rounded-2xl bg-slate-100 p-1">
                    <button
                        onClick={() => setActiveTab("methods")}
                        className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${activeTab === "methods" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Metode Bayar
                        {paymentMethods && (
                            <span
                                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeTab === "methods" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"}`}
                            >
                                {paymentMethods.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("gateway")}
                        className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${activeTab === "gateway" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Payment Gateway
                        {activePgCount > 0 && (
                            <span
                                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeTab === "gateway" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                                {activePgCount} aktif
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === "methods" && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                <p className="text-2xl font-bold text-slate-800">
                                    {paymentMethods.length}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Total Metode
                                </p>
                            </div>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-sm">
                                <p className="text-2xl font-bold text-emerald-700">
                                    {
                                        paymentMethods.filter(
                                            (m) => m.is_active,
                                        ).length
                                    }
                                </p>
                                <p className="text-xs text-emerald-600 mt-0.5">
                                    Aktif
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-sm">
                                <p className="text-2xl font-bold text-slate-500">
                                    {
                                        paymentMethods.filter(
                                            (m) => !m.is_active,
                                        ).length
                                    }
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Nonaktif
                                </p>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-sm">
                                <p className="text-2xl font-bold text-amber-700">
                                    {
                                        new Set(
                                            paymentMethods.map((m) => m.type),
                                        ).size
                                    }
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Tipe
                                </p>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-4 py-3 shadow-sm">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm">
                                💡
                            </span>
                            <p className="text-sm text-indigo-700">
                                Metode <strong>aktif</strong> tampil di kasir.{" "}
                                <strong>Drag ⠿</strong> atau klik ▲▼ untuk atur
                                urutan.
                            </p>
                        </div>

                        {/* Search + filter */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full max-w-xs">
                                <svg
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.8}
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
                                    placeholder="Cari metode..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="block w-full rounded-xl border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                {[
                                    "all",
                                    "cash",
                                    "digital",
                                    "card",
                                    "credit",
                                ].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFilterType(t)}
                                        className={`rounded-lg px-3 py-2 text-xs font-medium transition ${filterType === t ? "bg-indigo-100 text-indigo-700" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                                    >
                                        {t === "all"
                                            ? "Semua"
                                            : (TYPE_META[t]?.label ?? t)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {sorted.length === 0 ? (
                            <EmptyState
                                search={search}
                                filterType={filterType}
                            />
                        ) : (
                            <>
                                {/* Desktop */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                <th className="w-10 px-3 py-3.5"></th>
                                                <th className="px-5 py-3.5 w-20 text-center">
                                                    Posisi
                                                </th>
                                                <th className="px-5 py-3.5">
                                                    Metode
                                                </th>
                                                <th className="px-5 py-3.5">
                                                    Tipe
                                                </th>
                                                <th className="px-5 py-3.5">
                                                    Provider
                                                </th>
                                                <th className="px-5 py-3.5 text-center">
                                                    Transaksi
                                                </th>
                                                <th className="px-5 py-3.5 text-center">
                                                    Status
                                                </th>
                                                <th className="px-5 py-3.5 text-right">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sorted.map((m, idx) => (
                                                <tr
                                                    key={m.id}
                                                    ref={(el) => {
                                                        rowRefs.current[idx] =
                                                            el;
                                                    }}
                                                    className={`transition-all duration-200 hover:bg-slate-50/70 ${!m.is_active ? "opacity-60" : ""} ${
                                                        draggingIdx === idx
                                                            ? "relative z-50 scale-105 rotate-1 shadow-2xl bg-white opacity-90"
                                                            : ""
                                                    } ${dragOverIdx === idx && draggingIdx !== idx ? "border-t-4 border-indigo-500 bg-indigo-50" : ""}`}
                                                >
                                                    {/* Drag handle */}
                                                    <td className="px-3 py-4">
                                                        <div
                                                            onMouseDown={(e) =>
                                                                handleGripMouseDown(
                                                                    e,
                                                                    idx,
                                                                )
                                                            }
                                                            className="flex cursor-grab select-none items-center justify-center text-slate-300 transition hover:text-slate-500 active:cursor-grabbing"
                                                        >
                                                            <svg
                                                                className="h-4 w-4 pointer-events-none"
                                                                fill="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <circle
                                                                    cx="9"
                                                                    cy="5"
                                                                    r="2"
                                                                />
                                                                <circle
                                                                    cx="15"
                                                                    cy="5"
                                                                    r="2"
                                                                />
                                                                <circle
                                                                    cx="9"
                                                                    cy="12"
                                                                    r="2"
                                                                />
                                                                <circle
                                                                    cx="15"
                                                                    cy="12"
                                                                    r="2"
                                                                />
                                                                <circle
                                                                    cx="9"
                                                                    cy="19"
                                                                    r="2"
                                                                />
                                                                <circle
                                                                    cx="15"
                                                                    cy="19"
                                                                    r="2"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </td>
                                                    {/* Position */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                                                                {idx + 1}
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleMove(
                                                                            m,
                                                                            "up",
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        idx ===
                                                                        0
                                                                    }
                                                                    className="flex h-4 items-center justify-center rounded px-1 text-slate-400 transition hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-30"
                                                                >
                                                                    <svg
                                                                        className="h-2.5 w-2.5"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            3
                                                                        }
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="m4.5 15.75 7.5-7.5 7.5 7.5"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleMove(
                                                                            m,
                                                                            "down",
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        idx ===
                                                                        sorted.length -
                                                                            1
                                                                    }
                                                                    className="flex h-4 items-center justify-center rounded px-1 text-slate-400 transition hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-30"
                                                                >
                                                                    <svg
                                                                        className="h-2.5 w-2.5"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            3
                                                                        }
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                                                                {TYPE_META[
                                                                    m.type
                                                                ]?.icon ?? "💳"}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800">
                                                                    {m.name}
                                                                </p>
                                                                <p className="text-xs font-mono text-slate-400">
                                                                    {m.code}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <TypeBadge
                                                            type={m.type}
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500">
                                                        {m.provider || "—"}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="font-medium text-slate-700">
                                                            {(m.sale_payments_count ??
                                                                0) +
                                                                (m.purchase_payments_count ??
                                                                    0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button
                                                            onClick={() =>
                                                                handleToggle(m)
                                                            }
                                                            disabled={
                                                                toggling ===
                                                                m.id
                                                            }
                                                            className="disabled:opacity-50"
                                                        >
                                                            <StatusBadge
                                                                active={
                                                                    m.is_active
                                                                }
                                                            />
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link
                                                                href={route(
                                                                    "admin.payment-methods.edit",
                                                                    m.id,
                                                                )}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                            >
                                                                <svg
                                                                    className="h-5 w-5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={
                                                                        1.7
                                                                    }
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                                                    />
                                                                </svg>
                                                            </Link>
                                                            <button
                                                                onClick={() =>
                                                                    setTarget(m)
                                                                }
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                <svg
                                                                    className="h-5 w-5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={
                                                                        1.7
                                                                    }
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="space-y-3 md:hidden">
                                    {sorted.map((m, idx) => (
                                        <div
                                            key={m.id}
                                            className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${!m.is_active ? "opacity-60" : ""}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex cursor-grab items-center justify-center text-slate-300 active:cursor-grabbing">
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                cx="9"
                                                                cy="5"
                                                                r="2"
                                                            />
                                                            <circle
                                                                cx="15"
                                                                cy="5"
                                                                r="2"
                                                            />
                                                            <circle
                                                                cx="9"
                                                                cy="12"
                                                                r="2"
                                                            />
                                                            <circle
                                                                cx="15"
                                                                cy="12"
                                                                r="2"
                                                            />
                                                            <circle
                                                                cx="9"
                                                                cy="19"
                                                                r="2"
                                                            />
                                                            <circle
                                                                cx="15"
                                                                cy="19"
                                                                r="2"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-600">
                                                        {idx + 1}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="font-semibold text-slate-800 truncate">
                                                            {m.name}
                                                        </p>
                                                        <button
                                                            onClick={() =>
                                                                handleToggle(m)
                                                            }
                                                            disabled={
                                                                toggling ===
                                                                m.id
                                                            }
                                                            className="shrink-0 disabled:opacity-50"
                                                        >
                                                            <StatusBadge
                                                                active={
                                                                    m.is_active
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <TypeBadge
                                                            type={m.type}
                                                        />
                                                        <span className="text-xs text-slate-400">
                                                            {m.provider || "—"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {m.code}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleMove(m, "up")
                                                        }
                                                        disabled={idx === 0}
                                                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleMove(
                                                                m,
                                                                "down",
                                                            )
                                                        }
                                                        disabled={
                                                            idx ===
                                                            sorted.length - 1
                                                        }
                                                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
                                                    >
                                                        ▼
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={route(
                                                            "admin.payment-methods.edit",
                                                            m.id,
                                                        )}
                                                        className="rounded-lg border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            setTarget(m)
                                                        }
                                                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {activeTab === "gateway" && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-4 py-3 shadow-sm">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm">
                                🔌
                            </span>
                            <p className="text-sm text-indigo-700">
                                Payment Gateway memungkinkan pelanggan bayar via{" "}
                                <strong>QRIS, GoPay, VA Bank</strong>, dll. API
                                keys dienkripsi sebelum disimpan. Aktifkan
                                provider di sini, lalu metode PG otomatis tampil
                                di kasir.
                            </p>
                        </div>
                        {pgProviders?.map((provider) => (
                            <PgProviderCard
                                key={provider}
                                provider={provider}
                                config={pgConfigs?.[provider]}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus metode pembayaran?"
                description={
                    target
                        ? `"${target.name}" akan dihapus permanen. Jika sudah pernah dipakai dalam transaksi, hapus tidak bisa dilakukan — nonaktifkan saja.`
                        : ""
                }
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
