import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import {
    ArrowLeft,
    Building2,
    Check,
    ChevronDown,
    ClipboardList,
    Coffee,
    Hotel,
    KeyRound,
    Lock,
    Package,
    Pencil,
    Puzzle,
    Scissors,
    Settings,
    ShoppingCart,
    Store,
    Ticket,
    Users,
    Wallet,
    X,
    Zap,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const STORE_TYPE = {
    retail: { label: "Retail", Icon: Store },
    fnb: { label: "FnB / Cafe", Icon: Coffee },
    service: { label: "Service", Icon: Scissors },
    rental: { label: "Rental", Icon: KeyRound },
    ticket: { label: "Tiket", Icon: Ticket },
    hospitality: { label: "Hospitality", Icon: Hotel },
};

const PLAN_STYLE = {
    free: { cls: "bg-muted text-muted-foreground ring-border" },
    basic: {
        cls: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800",
    },
    pro: {
        cls: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
    },
    unlimited: { cls: "bg-primary/10 text-primary ring-primary/20" },
};

const CAT_META = {
    pos: { Icon: ShoppingCart, label: "POS & Transaksi" },
    crm: { Icon: Users, label: "Pelanggan & CRM" },
    inventory: { Icon: Package, label: "Inventaris & Stok" },
    finance: { Icon: Wallet, label: "Keuangan" },
    system: { Icon: Settings, label: "Sistem & Admin" },
    other: { Icon: ClipboardList, label: "Lainnya" },
};
const CAT_ORDER = ["pos", "crm", "inventory", "finance", "system", "other"];

const ROLE_STYLE = {
    owner: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
    manager:
        "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
    kasir: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800",
    gudang: "bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-800",
    admin: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800",
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
                        cls: "text-success",
                    },
                    {
                        key: "blocked",
                        label: `Tidak Bisa (${blockedCount})`,
                        cls: "text-destructive",
                    },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            filter === tab.key
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : `border border-border bg-card ${tab.cls ?? "text-muted-foreground"} hover:bg-muted`
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
                                <cat.Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                                <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    {cat.label}
                                </h5>
                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
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
                                        ? "border-success/20 bg-success/10"
                                        : blockedByBoth
                                          ? "border-destructive/20 bg-destructive/10"
                                          : blockedByPlan
                                            ? "border-warning/20 bg-warning/10"
                                            : "border-border bg-muted";
                                    return (
                                        <div
                                            key={f.code}
                                            className={`flex items-start gap-2 rounded-xl border p-2.5 ${borderClass}`}
                                        >
                                            {/* Status icon */}
                                            <div
                                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                                    f.can_access
                                                        ? "bg-success text-success-foreground"
                                                        : blockedByBoth
                                                          ? "bg-destructive text-destructive-foreground"
                                                          : blockedByPlan
                                                            ? "bg-warning text-warning-foreground"
                                                            : "bg-muted-foreground/40 text-background"
                                                }`}
                                            >
                                                {f.can_access ? (
                                                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                                ) : (
                                                    <X className="h-2.5 w-2.5" strokeWidth={3} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={`text-xs font-semibold leading-tight ${f.can_access ? "text-success" : blockedByBoth ? "text-destructive" : blockedByPlan ? "text-warning" : "text-muted-foreground"}`}
                                                >
                                                    {f.label}
                                                </p>
                                                {/* Reason badges */}
                                                {!f.can_access && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {blockedByBoth ? (
                                                            <span className="rounded-full bg-destructive/20 px-1.5 py-0.5 text-[9px] font-semibold text-destructive">
                                                                Bukan Paket &
                                                                Tipe
                                                            </span>
                                                        ) : blockedByPlan ? (
                                                            <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[9px] font-semibold text-warning">
                                                                Bukan Paket
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
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
        Icon: Building2,
    };
    const TypeIcon = tm.Icon;
    const planStyle = PLAN_STYLE[access.plan_code] ?? PLAN_STYLE.free;
    const accessCount = access.feature_status.filter(
        (f) => f.can_access,
    ).length;
    const totalCount = access.feature_status.length;

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/60 px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm ring-1 ring-border">
                        <TypeIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground">
                                {access.store_name}
                            </p>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${planStyle.cls}`}
                            >
                                {access.plan_label}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {access.store_code} · {tm.label}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Access ratio */}
                    <div className="hidden sm:flex flex-col items-end">
                        <p className="text-xs font-semibold text-foreground">
                            <span className="text-success">
                                {accessCount}
                            </span>
                            /{totalCount} fitur
                        </p>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-1.5 rounded-full bg-success transition-all"
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
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ChevronDown
                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                            strokeWidth={2.5}
                        />
                    </button>
                </div>
            </div>

            {/* Roles & Permissions summary */}
            <div className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Role
                    </span>
                    {access.roles.length > 0 ? (
                        access.roles.map((r, i) => (
                            <span
                                key={i}
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${ROLE_STYLE[r] ?? "bg-muted text-muted-foreground ring-border"}`}
                            >
                                {r}
                            </span>
                        ))
                    ) : (
                        <span className="text-[11px] italic text-muted-foreground">
                            Tidak ada role
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Permission
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {access.permissions.length} hak akses
                    </span>
                </div>
            </div>

            {/* Permissions list (collapsed by default, shown when expanded) */}
            {expanded && (
                <div className="border-b border-border p-5">
                    {/* Permissions */}
                    {access.permissions.length > 0 && (
                        <div className="mb-5">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Hak Akses (Permission)
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {access.permissions.map((p, i) => (
                                    <span
                                        key={i}
                                        className="rounded-lg bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground"
                                    >
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Feature grid */}
                    <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                        </Link>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-foreground truncate">
                                {user.name}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("developer.users.edit", user.id)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                    >
                        <Pencil className="h-4 w-4" strokeWidth={1.7} />
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={`User — ${user.name}`} />

            {/* Profile + Stats */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
                {/* Profile card */}
                <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center gap-4 p-5">
                        <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm"
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-base font-bold text-foreground">
                                    {user.name}
                                </p>
                                {user.is_developer && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800">
                                        <Zap className="h-2.5 w-2.5" strokeWidth={2.5} />
                                        Developer
                                    </span>
                                )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
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
                        Icon: Store,
                        color: "bg-primary/10 text-primary",
                    },
                    {
                        label: "Total Fitur",
                        value: totalFeatures,
                        Icon: Puzzle,
                        color: "bg-muted text-muted-foreground",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-sm"
                    >
                        <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.color}`}
                        >
                            <s.Icon className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {s.value}
                            </p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Developer notice */}
            {user.is_developer && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4">
                    <Zap className="h-6 w-6 shrink-0 text-primary" strokeWidth={2} />
                    <div>
                        <p className="text-sm font-bold text-primary">
                            Developer Mode Aktif
                        </p>
                        <p className="text-xs text-muted-foreground">
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
                        <h3 className="text-sm font-bold text-foreground">
                            Akses per Toko
                        </h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {storeAccess.length} toko
                        </span>
                    </div>

                    {storeAccess.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-12 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                <Lock className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Belum punya akses toko
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Assign user ini ke toko di menu Edit
                            </p>
                            <Link
                                href={route("developer.users.edit", user.id)}
                                className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
                    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-muted px-4 py-3 text-[11px] text-muted-foreground">
                        <span className="font-semibold">Keterangan:</span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-success" />{" "}
                            Dapat diakses
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-warning" />{" "}
                            Diblokir Plan
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />{" "}
                            Diblokir Tipe Toko
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-destructive" />{" "}
                            Diblokir Keduanya
                        </span>
                    </div>
                </div>
            )}
        </DeveloperLayout>
    );
}
