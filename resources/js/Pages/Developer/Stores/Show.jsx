import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import axios from "axios";

// ── Konstanta ─────────────────────────────────────────────────────────────────
const STORE_TYPE = {
    retail: { label: "Retail", icon: "🏪", color: "blue" },
    fnb: { label: "FnB / Cafe", icon: "☕", color: "orange" },
    service: { label: "Service", icon: "✂️", color: "violet" },
    rental: { label: "Rental", icon: "🔑", color: "yellow" },
    ticket: { label: "Tiket", icon: "🎟️", color: "rose" },
    hospitality: { label: "Hospitality", icon: "🏨", color: "amber" },
    laundry: { label: "Service", icon: "👕", color: "violet" },
    parking: { label: "Parkir", icon: "🅿️", color: "slate" },
    session: { label: "Rental", icon: "🖥️", color: "yellow" },
};

const PLAN_STYLE = {
    free: { label: "Free", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
    basic: { label: "Basic", cls: "bg-blue-50 text-blue-700 ring-blue-100" },
    pro: { label: "Pro", cls: "bg-violet-50 text-violet-700 ring-violet-100" },
    unlimited: {
        label: "Unlimited",
        cls: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    },
};

const ROLE_STYLE = {
    owner: "bg-amber-50 text-amber-700",
    manager: "bg-violet-50 text-violet-700",
    kasir: "bg-sky-50 text-sky-700",
    gudang: "bg-teal-50 text-teal-700",
};

const FEATURE_CAT = {
    pos: {
        icon: "🛒",
        label: "POS & Transaksi",
        bg: "bg-blue-50 text-blue-600",
    },
    inventory: {
        icon: "📦",
        label: "Inventaris & Stok",
        bg: "bg-amber-50 text-amber-600",
    },
    crm: {
        icon: "👥",
        label: "Pelanggan & CRM",
        bg: "bg-violet-50 text-violet-600",
    },
    finance: {
        icon: "💰",
        label: "Keuangan",
        bg: "bg-emerald-50 text-emerald-600",
    },
    system: {
        icon: "⚙️",
        label: "Sistem & Admin",
        bg: "bg-slate-100 text-slate-600",
    },
    other: { icon: "📋", label: "Lainnya", bg: "bg-slate-50 text-slate-500" },
};

// ── Branch Slide Panel ────────────────────────────────────────────────────────
function BranchPanel({ branch, storeId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setData(null);
        axios
            .get(`/developer/branches/${branch.id}`)
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [branch.id]);

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-black/5">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                            <svg
                                className="h-5 w-5 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.7}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3 9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v4.099"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                                Cabang
                            </p>
                            <h3 className="text-sm font-bold text-slate-900">
                                {branch.name}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
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
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                            <p className="text-xs text-slate-400">
                                Memuat data cabang...
                            </p>
                        </div>
                    ) : data ? (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    {
                                        label: "Kode",
                                        value: (
                                            <span className="font-mono text-slate-800">
                                                {data.branch.code}
                                            </span>
                                        ),
                                    },
                                    {
                                        label: "Status",
                                        value: (
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${data.branch.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                            >
                                                {data.branch.is_active
                                                    ? "● Aktif"
                                                    : "○ Nonaktif"}
                                            </span>
                                        ),
                                    },
                                    {
                                        label: "Telepon",
                                        value: data.branch.phone || (
                                            <span className="text-slate-300">
                                                —
                                            </span>
                                        ),
                                    },
                                    {
                                        label: "Karyawan",
                                        value: (
                                            <span className="font-semibold text-slate-800">
                                                {data.employees.length} orang
                                            </span>
                                        ),
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-xl bg-slate-50 px-4 py-3"
                                    >
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                                            {item.label}
                                        </p>
                                        <div className="text-sm font-medium text-slate-700">
                                            {item.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {data.branch.address && (
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                                        Alamat
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        {data.branch.address}
                                    </p>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Karyawan & Akun
                                    </h4>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                        {data.employees.length}
                                    </span>
                                </div>
                                {data.employees.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.employees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-xs font-bold text-white shadow-sm">
                                                    {emp.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                                            {emp.name}
                                                        </p>
                                                        <span
                                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${emp.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                                        >
                                                            {emp.is_active
                                                                ? "Aktif"
                                                                : "Nonaktif"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400">
                                                        {emp.position ||
                                                            "Tidak ada jabatan"}
                                                    </p>
                                                    {emp.user ? (
                                                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                                                            <p className="text-[11px] font-semibold text-slate-700">
                                                                {emp.user.name}
                                                            </p>
                                                            <span className="text-slate-300">
                                                                ·
                                                            </span>
                                                            <p className="text-[10px] text-slate-400">
                                                                {emp.user.email}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="mt-1.5 text-[11px] italic text-slate-300">
                                                            Belum ada akun user
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                                        <p className="text-xs text-slate-400">
                                            Belum ada karyawan di cabang ini
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-16 text-center text-sm text-slate-400">
                            Gagal memuat data
                        </div>
                    )}
                </div>
                <div className="border-t border-slate-100 p-4">
                    <Link
                        href={route("developer.stores.branches.edit", [
                            storeId,
                            branch.id,
                        ])}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
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
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                            />
                        </svg>
                        Edit Cabang
                    </Link>
                </div>
            </div>
        </>
    );
}

// ── Add Owner Modal ───────────────────────────────────────────────────────────
function AddOwnerModal({ allUsers, storeId, onClose }) {
    const [selected, setSelected] = useState("");
    const [processing, setProcessing] = useState(false);

    const handle = () => {
        if (!selected) return;
        setProcessing(true);
        router.post(
            route("developer.stores.assign-owner", storeId),
            { user_id: selected },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">
                        Tambah Owner
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                        User yang dipilih akan dapat akses penuh ke toko ini
                        sebagai owner
                    </p>
                </div>
                <div className="p-6">
                    <select
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                        <option value="">Pilih user...</option>
                        {allUsers?.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name} — {u.email}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2 px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handle}
                        disabled={!selected || processing}
                        className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                        {processing ? "Menyimpan..." : "Tambah Owner"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Section: Detail Plan ──────────────────────────────────────────────────────
function PlanDetailSection({ store, planMeta, planFeatures }) {
    const plan = store.planModel;
    const effectiveMaxUsers = store.max_users ?? plan?.max_users ?? "—";
    const effectiveMaxBranches =
        store.max_branches ?? plan?.max_branches ?? "—";
    const hasOverrideUsers =
        store.max_users !== null && store.max_users !== undefined;
    const hasOverrideBranches =
        store.max_branches !== null && store.max_branches !== undefined;

    const isExpired = store.plan_expires_at
        ? new Date(store.plan_expires_at) < new Date()
        : false;

    // Group fitur by category
    const grouped = {};
    planFeatures.forEach((f) => {
        const cat = f.category || "other";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(f);
    });

    const catOrder = ["pos", "crm", "inventory", "finance", "system", "other"];

    return (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-xl">
                        🛡️
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Paket & Fitur
                        </h3>
                        <p className="text-xs text-slate-400">
                            {planFeatures.length} fitur dari paket{" "}
                            <span className="font-semibold">
                                {planMeta.label}
                            </span>
                        </p>
                    </div>
                </div>
                <Link
                    href={route("developer.stores.edit", store.id)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Ubah Plan
                </Link>
            </div>

            {/* Plan info grid */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 sm:grid-cols-4">
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Paket
                    </p>
                    <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${planMeta.cls}`}
                    >
                        {planMeta.label}
                    </span>
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Maks User
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                        {effectiveMaxUsers}
                        {hasOverrideUsers && (
                            <span className="ml-1 text-[10px] font-normal text-amber-600">
                                (override)
                            </span>
                        )}
                    </p>
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Maks Cabang
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                        {effectiveMaxBranches}
                        {hasOverrideBranches && (
                            <span className="ml-1 text-[10px] font-normal text-amber-600">
                                (override)
                            </span>
                        )}
                    </p>
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Berlaku Sampai
                    </p>
                    {store.plan_expires_at ? (
                        <p
                            className={`text-sm font-semibold ${isExpired ? "text-red-600" : "text-slate-800"}`}
                        >
                            {isExpired && "⚠ "}
                            {new Date(store.plan_expires_at).toLocaleDateString(
                                "id-ID",
                                {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                },
                            )}
                        </p>
                    ) : (
                        <p className="text-sm text-emerald-600 font-semibold">
                            ∞ Tidak terbatas
                        </p>
                    )}
                </div>
            </div>

            {/* Fitur per kategori */}
            {planFeatures.length > 0 ? (
                <div className="p-5 space-y-5">
                    {catOrder.map((catKey) => {
                        const catFeatures = grouped[catKey];
                        if (!catFeatures || catFeatures.length === 0)
                            return null;
                        const cat = FEATURE_CAT[catKey] ?? FEATURE_CAT.other;
                        return (
                            <div key={catKey}>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <span className="text-sm">{cat.icon}</span>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                        {cat.label}
                                    </h4>
                                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                        {catFeatures.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                                    {catFeatures.map((f) => {
                                        const types = f.store_types ?? [];
                                        const typeMatch =
                                            types.length === 0 ||
                                            types.includes(store.store_type);
                                        return (
                                            <div
                                                key={f.code}
                                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                                                    !typeMatch
                                                        ? "border-amber-100 bg-amber-50/50 opacity-70"
                                                        : "border-emerald-200 bg-emerald-50/70"
                                                }`}
                                            >
                                                <div
                                                    className={`h-2 w-2 shrink-0 rounded-full ${!typeMatch ? "bg-amber-400" : "bg-emerald-500"}`}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-slate-700 truncate">
                                                        {f.label}
                                                    </p>
                                                    {!typeMatch && (
                                                        <p className="text-[10px] text-amber-600">
                                                            Tipe tidak cocok
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center py-10 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        🔒
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                        Paket {planMeta.label} belum punya fitur
                    </p>
                    <Link
                        href={route("developer.plans.edit", store.plan_id ?? 0)}
                        className="mt-2 text-xs text-indigo-600 hover:underline"
                    >
                        Kelola fitur paket →
                    </Link>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                    Tersedia untuk toko ini
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> Tipe
                    toko tidak mendukung
                </span>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Show({ store, owners, allUsers, planFeatures = [] }) {
    const { flash } = usePage().props;
    const [activeBranch, setActiveBranch] = useState(null);
    const [showAddOwner, setShowAddOwner] = useState(false);

    const tm = STORE_TYPE[store.store_type] ?? {
        label: store.store_type,
        icon: "🏬",
        color: "slate",
    };
    const planLabel = store.planModel?.label ?? store.plan ?? "Free";
    const planCode = store.planModel?.code ?? store.plan ?? "free";
    const planMeta = PLAN_STYLE[planCode] ?? {
        label: planLabel,
        cls: "bg-slate-100 text-slate-600 ring-slate-200",
    };

    const handleRevokeOwner = (userId) => {
        if (!confirm("Cabut akses owner ini dari toko?")) return;
        router.delete(route("developer.stores.revoke-owner", store.id), {
            data: { user_id: userId },
            preserveScroll: true,
        });
    };

    const stats = [
        {
            label: "Cabang",
            value: store.branches_count ?? store.branches?.length ?? 0,
            sub: `Maks ${store.max_branches ?? store.planModel?.max_branches ?? "∞"}`,
            color: "indigo",
            icon: (
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v4.099"
                    />
                </svg>
            ),
        },
        {
            label: "Owner",
            value: owners?.length ?? 0,
            sub: null,
            color: "amber",
            icon: (
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                </svg>
            ),
        },
        {
            label: "Karyawan",
            value: store.employees_count ?? 0,
            sub: `Maks ${store.max_users ?? store.planModel?.max_users ?? "∞"} user`,
            color: "emerald",
            icon: (
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                </svg>
            ),
        },
        {
            label: "Fitur",
            value: planFeatures.length,
            sub: `Paket ${planMeta.label}`,
            color: "violet",
            icon: (
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                </svg>
            ),
        },
    ];

    const colorMap = {
        indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
        amber: { bg: "bg-amber-50", text: "text-amber-600" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
        violet: { bg: "bg-violet-50", text: "text-violet-600" },
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl shadow-sm ring-1 ring-black/5">
                            {tm.icon}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900 truncate">
                                    {store.name}
                                </h2>
                                <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${store.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}
                                >
                                    {store.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                            </div>
                            <p className="text-xs font-mono text-slate-400">
                                {store.code} · {tm.label}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href={route("developer.stores.edit", store.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.7}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                />
                            </svg>
                            Edit
                        </Link>
                        <Link
                            href={route("developer.stores.index")}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            ← Kembali
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`${store.name} — Detail`} />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <svg
                        className="h-4 w-4 shrink-0"
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
                    {flash.success}
                </div>
            )}

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => {
                    const c = colorMap[s.color];
                    return (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                        {s.label}
                                    </p>
                                    <p className="mt-1.5 text-2xl font-bold text-slate-900">
                                        {s.value}
                                    </p>
                                    {s.sub && (
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            {s.sub}
                                        </p>
                                    )}
                                </div>
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.text}`}
                                >
                                    {s.icon}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info Toko */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">
                        Informasi Toko
                    </h3>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
                    {[
                        {
                            label: "Kode",
                            value: (
                                <span className="font-mono text-slate-800">
                                    {store.code}
                                </span>
                            ),
                        },
                        {
                            label: "Tipe",
                            value: (
                                <span className="font-medium text-slate-800">
                                    {tm.icon} {tm.label}
                                </span>
                            ),
                        },
                        {
                            label: "Plan",
                            value: (
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${planMeta.cls}`}
                                >
                                    {planMeta.label}
                                </span>
                            ),
                        },
                        {
                            label: "Dibuat",
                            value: (
                                <span className="text-slate-700">
                                    {store.created_at
                                        ? new Date(
                                              store.created_at,
                                          ).toLocaleDateString("id-ID", {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                          })
                                        : "—"}
                                </span>
                            ),
                        },
                    ].map((row) => (
                        <div key={row.label} className="px-6 py-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                                {row.label}
                            </p>
                            <div className="text-sm">{row.value}</div>
                        </div>
                    ))}
                </div>
                {(store.phone || store.email || store.address) && (
                    <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        {store.phone && (
                            <div className="px-6 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                    Telepon
                                </p>
                                <p className="text-sm text-slate-700">
                                    {store.phone}
                                </p>
                            </div>
                        )}
                        {store.email && (
                            <div className="px-6 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                    Email
                                </p>
                                <p className="text-sm text-slate-700">
                                    {store.email}
                                </p>
                            </div>
                        )}
                        {store.address && (
                            <div className="px-6 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                    Alamat
                                </p>
                                <p className="text-sm text-slate-700">
                                    {store.address}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Paket & Fitur */}
            <PlanDetailSection
                store={store}
                planMeta={planMeta}
                planFeatures={planFeatures}
            />

            {/* Cabang */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                            Cabang
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            {store.branches?.length ?? 0}
                        </span>
                    </div>
                    <Link
                        href={route("developer.branches.create")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                        <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Tambah Cabang
                    </Link>
                </div>
                {store.branches?.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {store.branches.map((b, i) => (
                            <div
                                key={b.id}
                                className="group flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {b.name}
                                        </p>
                                        <p className="text-xs font-mono text-slate-400">
                                            {b.code}
                                            {b.phone ? ` · ${b.phone}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                    >
                                        {b.is_active ? "Aktif" : "Nonaktif"}
                                    </span>
                                    <button
                                        onClick={() => setActiveBranch(b)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        title="Lihat detail"
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
                                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    </button>
                                    <Link
                                        href={route(
                                            "developer.branches.edit",
                                            b.id,
                                        )}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                        title="Edit"
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
                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                            />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl mb-3">
                            🏢
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Belum ada cabang
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Tambahkan cabang pertama untuk toko ini
                        </p>
                    </div>
                )}
            </div>

            {/* Owner */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                            Owner Toko
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            {owners?.length ?? 0}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAddOwner(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                        <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Tambah Owner
                    </button>
                </div>
                {owners?.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {owners.map((u) => (
                            <div
                                key={u.id}
                                className="group flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-sm">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {u.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {u.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-wrap gap-1">
                                        {u.roles?.map((r, i) => (
                                            <span
                                                key={i}
                                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${ROLE_STYLE[r] ?? "bg-indigo-50 text-indigo-700"}`}
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleRevokeOwner(u.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Cabut akses"
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
                                                d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl mb-3">
                            👤
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Belum ada owner
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Tambahkan user sebagai owner toko ini
                        </p>
                    </div>
                )}
            </div>

            {/* Panels & Modals */}
            {activeBranch && (
                <BranchPanel
                    branch={activeBranch}
                    storeId={store.id}
                    onClose={() => setActiveBranch(null)}
                />
            )}
            {showAddOwner && (
                <AddOwnerModal
                    allUsers={allUsers}
                    storeId={store.id}
                    onClose={() => setShowAddOwner(false)}
                />
            )}
        </DeveloperLayout>
    );
}
