import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    ArrowLeft,
    Building2,
    CircleCheck,
    CircleParking,
    Coffee,
    Crown,
    Eye,
    Hotel,
    KeyRound,
    Lock,
    Monitor,
    Pencil,
    Plus,
    Scissors,
    ShieldCheck,
    Shirt,
    Store,
    Ticket,
    UserMinus,
    Users,
    X,
} from "lucide-react";
import {
    FEATURE_GROUPS,
    FEATURE_GROUP_ORDER,
    featureGroupOf,
} from "@/Utils/featureGroups";

// Badge per grup — aksen visual non-status, hardcoded + varian dark: diperbolehkan
// (TOKEN_MAPPING.md § Badge non-semantik).
const GROUP_BADGE_CLS = {
    home: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    transaction: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    operations: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    catalog: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    people: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    finance: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    system: "bg-muted text-muted-foreground",
    other: "bg-muted text-muted-foreground",
};

// ── Konstanta ─────────────────────────────────────────────────────────────────
const STORE_TYPE = {
    retail: { label: "Retail", Icon: Store, color: "blue" },
    fnb: { label: "FnB / Cafe", Icon: Coffee, color: "orange" },
    service: { label: "Service", Icon: Scissors, color: "violet" },
    rental: { label: "Rental", Icon: KeyRound, color: "yellow" },
    ticket: { label: "Tiket", Icon: Ticket, color: "rose" },
    hospitality: { label: "Hospitality", Icon: Hotel, color: "amber" },
    laundry: { label: "Service", Icon: Shirt, color: "violet" },
    parking: { label: "Parkir", Icon: CircleParking, color: "slate" },
    session: { label: "Rental", Icon: Monitor, color: "yellow" },
};

const PLAN_STYLE = {
    free: { label: "Free", cls: "bg-muted text-muted-foreground ring-border" },
    basic: {
        label: "Basic",
        cls: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800",
    },
    pro: {
        label: "Pro",
        cls: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
    },
    unlimited: {
        label: "Unlimited",
        cls: "bg-primary/10 text-primary ring-primary/20",
    },
};

const ROLE_STYLE = {
    owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    manager:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    kasir: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    gudang: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
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
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" strokeWidth={1.7} />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                                Cabang
                            </p>
                            <h3 className="text-sm font-bold text-foreground">
                                {branch.name}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="text-xs text-muted-foreground">
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
                                            <span className="font-mono text-foreground">
                                                {data.branch.code}
                                            </span>
                                        ),
                                    },
                                    {
                                        label: "Status",
                                        value: (
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${data.branch.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
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
                                            <span className="text-muted-foreground/50">
                                                —
                                            </span>
                                        ),
                                    },
                                    {
                                        label: "Karyawan",
                                        value: (
                                            <span className="font-semibold text-foreground">
                                                {data.employees.length} orang
                                            </span>
                                        ),
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-xl bg-muted px-4 py-3"
                                    >
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                                            {item.label}
                                        </p>
                                        <div className="text-sm font-medium text-foreground">
                                            {item.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {data.branch.address && (
                                <div className="rounded-xl bg-muted px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                                        Alamat
                                    </p>
                                    <p className="text-sm text-foreground">
                                        {data.branch.address}
                                    </p>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        Karyawan & Akun
                                    </h4>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                        {data.employees.length}
                                    </span>
                                </div>
                                {data.employees.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.employees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/20 hover:bg-primary/5"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                                                    {emp.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-foreground truncate">
                                                            {emp.name}
                                                        </p>
                                                        <span
                                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${emp.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                                                        >
                                                            {emp.is_active
                                                                ? "Aktif"
                                                                : "Nonaktif"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {emp.position ||
                                                            "Tidak ada jabatan"}
                                                    </p>
                                                    {emp.user ? (
                                                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
                                                            <p className="text-[11px] font-semibold text-foreground">
                                                                {emp.user.name}
                                                            </p>
                                                            <span className="text-muted-foreground/50">
                                                                ·
                                                            </span>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {emp.user.email}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="mt-1.5 text-[11px] italic text-muted-foreground/70">
                                                            Belum ada akun user
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-border p-8 text-center">
                                        <p className="text-xs text-muted-foreground">
                                            Belum ada karyawan di cabang ini
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                            Gagal memuat data
                        </div>
                    )}
                </div>
                <div className="border-t border-border p-4">
                    <Link
                        href={route("developer.stores.branches.edit", [
                            storeId,
                            branch.id,
                        ])}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-[2px]">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="px-6 py-5 border-b border-border">
                    <h3 className="text-base font-bold text-foreground">
                        Tambah Owner
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        User yang dipilih akan dapat akses penuh ke toko ini
                        sebagai owner
                    </p>
                </div>
                <div className="p-6">
                    <select
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20 outline-none transition"
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
                        className="flex-1 rounded-xl border border-border bg-card text-card-foreground py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handle}
                        disabled={!selected || processing}
                        className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
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

    // Group fitur mengikuti sidebar Admin (bukan f.category dari DB)
    const grouped = {};
    planFeatures.forEach((f) => {
        const g = featureGroupOf(f);
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(f);
    });

    const orderedGroupKeys = FEATURE_GROUP_ORDER.filter((g) => grouped[g]?.length > 0);

    return (
        <div className="mb-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.8} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">
                            Paket & Fitur
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {planFeatures.length} fitur dari paket{" "}
                            <span className="font-semibold">
                                {planMeta.label}
                            </span>
                        </p>
                    </div>
                </div>
                <Link
                    href={route("developer.stores.edit", store.id)}
                    className="rounded-xl border border-border bg-card text-card-foreground px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                    Ubah Plan
                </Link>
            </div>

            {/* Plan info grid */}
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border sm:grid-cols-4">
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Paket
                    </p>
                    <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${planMeta.cls}`}
                    >
                        {planMeta.label}
                    </span>
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Maks User
                    </p>
                    <p className="text-sm font-bold text-foreground">
                        {effectiveMaxUsers}
                        {hasOverrideUsers && (
                            <span className="ml-1 text-[10px] font-normal text-warning">
                                (override)
                            </span>
                        )}
                    </p>
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Maks Cabang
                    </p>
                    <p className="text-sm font-bold text-foreground">
                        {effectiveMaxBranches}
                        {hasOverrideBranches && (
                            <span className="ml-1 text-[10px] font-normal text-warning">
                                (override)
                            </span>
                        )}
                    </p>
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Berlaku Sampai
                    </p>
                    {store.plan_expires_at ? (
                        <p
                            className={`text-sm font-semibold ${isExpired ? "text-destructive" : "text-foreground"}`}
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
                        <p className="text-sm font-semibold text-success">
                            ∞ Tidak terbatas
                        </p>
                    )}
                </div>
            </div>

            {/* Fitur per grup (sidebar Admin) */}
            {planFeatures.length > 0 ? (
                <div className="p-5 space-y-5">
                    {orderedGroupKeys.map((groupKey) => {
                        const groupFeatures = grouped[groupKey];
                        const group = FEATURE_GROUPS[groupKey] ?? FEATURE_GROUPS.other;
                        const badgeCls = GROUP_BADGE_CLS[groupKey] ?? GROUP_BADGE_CLS.other;
                        return (
                            <div key={groupKey}>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <group.Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        {group.label}
                                    </h4>
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${badgeCls}`}>
                                        {groupFeatures.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                                    {groupFeatures.map((f) => {
                                        const types = f.store_types ?? [];
                                        const typeMatch =
                                            types.length === 0 ||
                                            types.includes(store.store_type);
                                        return (
                                            <div
                                                key={f.code}
                                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                                                    !typeMatch
                                                        ? "border-warning/20 bg-warning/10 opacity-70"
                                                        : "border-success/20 bg-success/10"
                                                }`}
                                            >
                                                <div
                                                    className={`h-2 w-2 shrink-0 rounded-full ${!typeMatch ? "bg-warning" : "bg-success"}`}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-foreground truncate">
                                                        {f.label}
                                                    </p>
                                                    {!typeMatch && (
                                                        <p className="text-[10px] text-warning">
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
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                        <Lock className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                        Paket {planMeta.label} belum punya fitur
                    </p>
                    <Link
                        href={route("developer.plans.edit", store.plan_id ?? 0)}
                        className="mt-2 text-xs text-primary hover:underline"
                    >
                        Kelola fitur paket →
                    </Link>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 border-t border-border bg-muted/60 px-5 py-3">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-success" />{" "}
                    Tersedia untuk toko ini
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-warning" /> Tipe
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
        Icon: Building2,
        color: "slate",
    };
    const TypeIcon = tm.Icon;
    const planLabel = store.planModel?.label ?? store.plan ?? "Free";
    const planCode = store.planModel?.code ?? store.plan ?? "free";
    const planMeta = PLAN_STYLE[planCode] ?? {
        label: planLabel,
        cls: "bg-muted text-muted-foreground ring-border",
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
            icon: <Building2 className="h-5 w-5" strokeWidth={1.7} />,
        },
        {
            label: "Owner",
            value: owners?.length ?? 0,
            sub: null,
            color: "amber",
            icon: <Crown className="h-5 w-5" strokeWidth={1.7} />,
        },
        {
            label: "Karyawan",
            value: store.employees_count ?? 0,
            sub: `Maks ${store.max_users ?? store.planModel?.max_users ?? "∞"} user`,
            color: "emerald",
            icon: <Users className="h-5 w-5" strokeWidth={1.7} />,
        },
        {
            label: "Fitur",
            value: planFeatures.length,
            sub: `Paket ${planMeta.label}`,
            color: "violet",
            icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.7} />,
        },
    ];

    const colorMap = {
        indigo: { bg: "bg-primary/10", text: "text-primary" },
        amber: { bg: "bg-warning/10", text: "text-warning" },
        emerald: { bg: "bg-success/10", text: "text-success" },
        violet: { bg: "bg-primary/10", text: "text-primary" },
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted shadow-sm ring-1 ring-border">
                            <TypeIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-foreground truncate">
                                    {store.name}
                                </h2>
                                <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${store.is_active ? "bg-success/10 text-success ring-success/20" : "bg-muted text-muted-foreground ring-border"}`}
                                >
                                    {store.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">
                                {store.code} · {tm.label}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href={route("developer.stores.edit", store.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                        >
                            <Pencil className="h-4 w-4" strokeWidth={1.7} />
                            Edit
                        </Link>
                        <Link
                            href={route("developer.stores.index")}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                            Kembali
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`${store.name} — Detail`} />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
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
                            className="rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                        {s.label}
                                    </p>
                                    <p className="mt-1.5 text-2xl font-bold text-foreground">
                                        {s.value}
                                    </p>
                                    {s.sub && (
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
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
            <div className="mb-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">
                        Informasi Toko
                    </h3>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
                    {[
                        {
                            label: "Kode",
                            value: (
                                <span className="font-mono text-foreground">
                                    {store.code}
                                </span>
                            ),
                        },
                        {
                            label: "Tipe",
                            value: (
                                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                    <TypeIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                                    {tm.label}
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
                                <span className="text-foreground">
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
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                                {row.label}
                            </p>
                            <div className="text-sm">{row.value}</div>
                        </div>
                    ))}
                </div>
                {(store.phone || store.email || store.address) && (
                    <div className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        {store.phone && (
                            <div className="px-6 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                    Telepon
                                </p>
                                <p className="text-sm text-foreground">
                                    {store.phone}
                                </p>
                            </div>
                        )}
                        {store.email && (
                            <div className="px-6 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                    Email
                                </p>
                                <p className="text-sm text-foreground">
                                    {store.email}
                                </p>
                            </div>
                        )}
                        {store.address && (
                            <div className="px-6 py-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                    Alamat
                                </p>
                                <p className="text-sm text-foreground">
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
            <div className="mb-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                            Cabang
                        </h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {store.branches?.length ?? 0}
                        </span>
                    </div>
                    <Link
                        href={route("developer.branches.create")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Tambah Cabang
                    </Link>
                </div>
                {store.branches?.length > 0 ? (
                    <div className="divide-y divide-border">
                        {store.branches.map((b, i) => (
                            <div
                                key={b.id}
                                className="group flex items-center justify-between px-6 py-4 hover:bg-muted/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {b.name}
                                        </p>
                                        <p className="font-mono text-xs text-muted-foreground">
                                            {b.code}
                                            {b.phone ? ` · ${b.phone}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${b.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                                    >
                                        {b.is_active ? "Aktif" : "Nonaktif"}
                                    </span>
                                    <button
                                        onClick={() => setActiveBranch(b)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                        title="Lihat detail"
                                    >
                                        <Eye className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                    <Link
                                        href={route(
                                            "developer.branches.edit",
                                            b.id,
                                        )}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" strokeWidth={2} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                            <Building2 className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Belum ada cabang
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Tambahkan cabang pertama untuk toko ini
                        </p>
                    </div>
                )}
            </div>

            {/* Owner */}
            <div className="mb-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                            Owner Toko
                        </h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {owners?.length ?? 0}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAddOwner(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Tambah Owner
                    </button>
                </div>
                {owners?.length > 0 ? (
                    <div className="divide-y divide-border">
                        {owners.map((u) => (
                            <div
                                key={u.id}
                                className="group flex items-center justify-between px-6 py-4 hover:bg-muted/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning text-sm font-bold text-warning-foreground shadow-sm">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {u.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {u.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-wrap gap-1">
                                        {u.roles?.map((r, i) => (
                                            <span
                                                key={i}
                                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${ROLE_STYLE[r] ?? "bg-primary/10 text-primary"}`}
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleRevokeOwner(u.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/70 opacity-0 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                                        title="Cabut akses"
                                    >
                                        <UserMinus className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10">
                            <Crown className="h-6 w-6 text-warning" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Belum ada owner
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
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
