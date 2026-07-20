import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link } from "@inertiajs/react";
import { useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const STORE_TYPE = {
    retail: { label: "Retail", icon: "🏪" },
    fnb: { label: "FnB / Cafe", icon: "☕" },
    service: { label: "Service", icon: "✂️" },
    rental: { label: "Rental", icon: "🔑" },
    ticket: { label: "Tiket", icon: "🎟️" },
    hospitality: { label: "Hospitality", icon: "🏨" },
};

const PLAN_STYLE = {
    free: { cls: "bg-slate-100 text-slate-600 ring-slate-200" },
    basic: { cls: "bg-blue-50 text-blue-700 ring-blue-100" },
    pro: { cls: "bg-violet-50 text-violet-700 ring-violet-100" },
    unlimited: { cls: "bg-primary-50 text-primary-700 ring-primary-100" },
};

const CAT_META = {
    pos: { icon: "🛒", label: "POS & Transaksi" },
    crm: { icon: "👥", label: "Pelanggan & CRM" },
    inventory: { icon: "📦", label: "Inventaris & Stok" },
    finance: { icon: "💰", label: "Keuangan" },
    system: { icon: "⚙️", label: "Sistem & Admin" },
    other: { icon: "📋", label: "Lainnya" },
};
const CAT_ORDER = ["pos", "crm", "inventory", "finance", "system", "other"];

const ROLE_STYLE = {
    owner: "bg-amber-50 text-amber-700 ring-amber-200",
    manager: "bg-violet-50 text-violet-700 ring-violet-200",
    kasir: "bg-sky-50 text-sky-700 ring-sky-200",
    gudang: "bg-teal-50 text-teal-700 ring-teal-200",
    admin: "bg-blue-50 text-blue-700 ring-blue-200",
};

// ── Feature Grid per Store ────────────────────────────────────────────────────
function FeatureGrid({ featureStatus }) {
    const [filter, setFilter] = useState("all"); // all | accessible | blocked

    const grouped = {};
    featureStatus.forEach((f) => {
        const cat = f.category || "other";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(f);
    });

    const accessCount = featureStatus.filter((f) => f.can_access).length;
    const blockedCount = featureStatus.length - accessCount;

    const visible = featureStatus.filter((f) =>
        filter === "all"
            ? true
            : filter === "accessible"
              ? f.can_access
              : !f.can_access,
    );

    const visibleGrouped = {};
    visible.forEach((f) => {
        const cat = f.category || "other";
        if (!visibleGrouped[cat]) visibleGrouped[cat] = [];
        visibleGrouped[cat].push(f);
    });

    return (
        <div>
            {/* Filter tabs */}
            <div className="mb-4 flex items-center gap-2">
                {[
                    { key: "all", label: `Semua (${featureStatus.length})` },
                    {
                        key: "accessible",
                        label: `Dapat Diakses (${accessCount})`,
                        cls: "text-emerald-700",
                    },
                    {
                        key: "blocked",
                        label: `Tidak Bisa (${blockedCount})`,
                        cls: "text-red-600",
                    },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            filter === tab.key
                                ? "bg-slate-900 text-white shadow-sm"
                                : `border border-slate-200 bg-white ${tab.cls ?? "text-slate-600"} hover:bg-slate-50`
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid per kategori */}
            <div className="space-y-4">
                {CAT_ORDER.map((catKey) => {
                    const items = visibleGrouped[catKey];
                    if (!items || items.length === 0) return null;
                    const cat = CAT_META[catKey] ?? CAT_META.other;
                    const catAccess = items.filter((f) => f.can_access).length;
                    return (
                        <div key={catKey}>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-sm">{cat.icon}</span>
                                <h5 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    {cat.label}
                                </h5>
                                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                    {catAccess}/{items.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((f) => {
                                    const blockedByPlan = !f.plan_ok;
                                    const blockedByType = !f.type_ok;
                                    const blockedByBoth =
                                        blockedByPlan && blockedByType;
                                    const borderClass = f.can_access
                                        ? "border-emerald-200 bg-emerald-50/70"
                                        : blockedByBoth
                                          ? "border-rose-200 bg-rose-50/40"
                                          : blockedByPlan
                                            ? "border-amber-200 bg-amber-50/40"
                                            : "border-slate-200 bg-slate-50";
                                    return (
                                        <div
                                            key={f.code}
                                            className={`flex items-start gap-2 rounded-xl border p-2.5 ${borderClass}`}
                                        >
                                            {/* Status icon */}
                                            <div
                                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                                    f.can_access
                                                        ? "bg-emerald-500"
                                                        : blockedByBoth
                                                          ? "bg-rose-400"
                                                          : blockedByPlan
                                                            ? "bg-amber-400"
                                                            : "bg-slate-300"
                                                }`}
                                            >
                                                {f.can_access ? (
                                                    <svg
                                                        className="h-2.5 w-2.5 text-white"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={3}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M4.5 12.75l6 6 9-13.5"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        className="h-2.5 w-2.5 text-white"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={3}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={`text-xs font-semibold leading-tight ${f.can_access ? "text-emerald-800" : blockedByBoth ? "text-rose-700" : blockedByPlan ? "text-amber-700" : "text-slate-500"}`}
                                                >
                                                    {f.label}
                                                </p>
                                                {/* Reason badges */}
                                                {!f.can_access && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {blockedByBoth ? (
                                                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600">
                                                                Bukan Paket &
                                                                Tipe
                                                            </span>
                                                        ) : blockedByPlan ? (
                                                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                                                                Bukan Paket
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                                                                Bukan Tipe
                                                            </span>
                                                        )}
                                                    </div>
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
        </div>
    );
}

// ── Store Access Card ─────────────────────────────────────────────────────────
function StoreAccessCard({ access }) {
    const [expanded, setExpanded] = useState(false);
    const tm = STORE_TYPE[access.store_type] ?? {
        label: access.store_type,
        icon: "🏬",
    };
    const planStyle = PLAN_STYLE[access.plan_code] ?? PLAN_STYLE.free;
    const accessCount = access.feature_status.filter(
        (f) => f.can_access,
    ).length;
    const totalCount = access.feature_status.length;

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-slate-200">
                        {tm.icon}
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800">
                                {access.store_name}
                            </p>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${planStyle.cls}`}
                            >
                                {access.plan_label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            {access.store_code} · {tm.label}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Access ratio */}
                    <div className="hidden sm:flex flex-col items-end">
                        <p className="text-xs font-semibold text-slate-700">
                            <span className="text-emerald-600">
                                {accessCount}
                            </span>
                            /{totalCount} fitur
                        </p>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                                style={{
                                    width:
                                        totalCount > 0
                                            ? `${(accessCount / totalCount) * 100}%`
                                            : "0%",
                                }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <svg
                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Roles & Permissions summary */}
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-5 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Role
                    </span>
                    {access.roles.length > 0 ? (
                        access.roles.map((r, i) => (
                            <span
                                key={i}
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${ROLE_STYLE[r] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
                            >
                                {r}
                            </span>
                        ))
                    ) : (
                        <span className="text-[11px] italic text-slate-400">
                            Tidak ada role
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Permission
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {access.permissions.length} hak akses
                    </span>
                </div>
            </div>

            {/* Permissions list (collapsed by default, shown when expanded) */}
            {expanded && (
                <div className="border-b border-slate-100 p-5">
                    {/* Permissions */}
                    {access.permissions.length > 0 && (
                        <div className="mb-5">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Hak Akses (Permission)
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {access.permissions.map((p, i) => (
                                    <span
                                        key={i}
                                        className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600"
                                    >
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Feature grid */}
                    <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Status Fitur
                        </p>
                        <FeatureGrid featureStatus={access.feature_status} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Show({ user, storeAccess = [], allFeatures = [] }) {
    const totalAccessible = storeAccess.reduce(
        (sum, sa) => sum + sa.feature_status.filter((f) => f.can_access).length,
        0,
    );
    const totalFeatures = allFeatures.length;

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href={route("developer.users.index")}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 transition-colors"
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
                                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                                />
                            </svg>
                        </Link>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-slate-800 truncate">
                                {user.name}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("developer.users.edit", user.id)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
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
                </div>
            }
        >
            <Head title={`User — ${user.name}`} />

            {/* Profile + Stats */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
                {/* Profile card */}
                <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-4 p-5">
                        <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm ${
                                user.is_developer
                                    ? "bg-gradient-to-br from-violet-500 to-purple-600"
                                    : "bg-gradient-to-br from-primary-400 to-primary-600"
                            }`}
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-base font-bold text-slate-800">
                                    {user.name}
                                </p>
                                {user.is_developer && (
                                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200">
                                        ⚡ Developer
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                                {user.email}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                                Bergabung{" "}
                                {new Date(user.created_at).toLocaleDateString(
                                    "id-ID",
                                    {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    },
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {[
                    {
                        label: "Toko",
                        value: storeAccess.length,
                        icon: "🏪",
                        color: "bg-primary-50 text-primary-600",
                    },
                    {
                        label: "Total Fitur",
                        value: totalFeatures,
                        icon: "🧩",
                        color: "bg-slate-100 text-slate-600",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${s.color}`}
                        >
                            {s.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {s.value}
                            </p>
                            <p className="text-xs text-slate-400">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Developer notice */}
            {user.is_developer && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
                    <span className="text-2xl">⚡</span>
                    <div>
                        <p className="text-sm font-bold text-violet-800">
                            Developer Mode Aktif
                        </p>
                        <p className="text-xs text-violet-600">
                            User ini memiliki akses penuh ke semua toko dan
                            semua fitur tanpa batasan plan atau tipe.
                        </p>
                    </div>
                </div>
            )}

            {/* Per-Store Access */}
            {!user.is_developer && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800">
                            Akses per Toko
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            {storeAccess.length} toko
                        </span>
                    </div>

                    {storeAccess.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                                🔒
                            </div>
                            <p className="text-sm font-medium text-slate-500">
                                Belum punya akses toko
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Assign user ini ke toko di menu Edit
                            </p>
                            <Link
                                href={route("developer.users.edit", user.id)}
                                className="mt-4 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
                            >
                                Edit User
                            </Link>
                        </div>
                    ) : (
                        storeAccess.map((access) => (
                            <StoreAccessCard
                                key={access.store_id}
                                access={access}
                            />
                        ))
                    )}

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
                        <span className="font-semibold">Keterangan:</span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-emerald-500" />{" "}
                            Dapat diakses
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-amber-400" />{" "}
                            Diblokir Plan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-slate-300" />{" "}
                            Diblokir Tipe Toko
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-rose-400" />{" "}
                            Diblokir Keduanya
                        </span>
                    </div>
                </div>
            )}
        </DeveloperLayout>
    );
}
