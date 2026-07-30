import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    Building2,
    Car,
    Check,
    ChevronLeft,
    CircleCheck,
    ClipboardList,
    Coffee,
    Gamepad2,
    Hotel,
    KeyRound,
    Loader2,
    Save,
    Scissors,
    Store,
    Ticket,
    TriangleAlert,
} from "lucide-react";
import {
    FEATURE_GROUPS,
    FEATURE_GROUP_ORDER,
    featureGroupOf,
} from "@/Utils/featureGroups";

/**
 * Ikon per kode tipe toko (store_types.code).
 *
 * `store_types.icon` di database masih emoji ("🏪", "☕", dst) karena kolom itu
 * ditulis sebelum halaman ini dipindah ke lucide. Daripada mengandalkan emoji
 * mentah dari server (tidak konsisten dengan ikon lain di seluruh app), tipe
 * yang dikenal dipetakan ke lucide di sini — sama seperti pola SelectStore.jsx
 * dan Developer/Stores/Show.jsx. Tipe baru yang belum dikenal jatuh ke
 * `Building2` sebagai default netral.
 */
const TYPE_ICONS = {
    retail: Store,
    fnb: Coffee,
    service: Scissors,
    rental: KeyRound,
    ticket: Ticket,
    hospitality: Hotel,
    parking: Car,
    session: Gamepad2,
};

// Warna aksen per tipe toko (index-based) — dipertahankan dari desain lama,
// hanya dipakai untuk highlight kartu sidebar, bukan status.
const TYPE_COLORS = [
    { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", ring: "ring-blue-200 dark:ring-blue-800" },
    { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", ring: "ring-orange-200 dark:ring-orange-800" },
    { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", ring: "ring-violet-200 dark:ring-violet-800" },
    { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", ring: "ring-cyan-200 dark:ring-cyan-800" },
    { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", ring: "ring-rose-200 dark:ring-rose-800" },
    { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" },
    { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
    { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400", ring: "ring-pink-200 dark:ring-pink-800" },
];

export default function Index({ types, allFeatures, mapping }) {
    const { flash, allStoreTypes = [] } = usePage().props;
    const [activeTab, setActiveTab] = useState(types[0] ?? "");
    const [processing, setProcessing] = useState(false);

    // State: { retail: Set(["stock","purchase",...]), fnb: Set([...]), ... }
    const [checkState, setCheckState] = useState(() => {
        const state = {};
        types.forEach((t) => {
            state[t] = new Set(mapping[t] || []);
        });
        return state;
    });

    const toggleFeature = (type, code) => {
        setCheckState((prev) => {
            const s = new Set(prev[type]);
            s.has(code) ? s.delete(code) : s.add(code);
            return { ...prev, [type]: s };
        });
    };

    const toggleAll = (type) => {
        const allCodes = allFeatures.map((f) => f.code);
        const allOn = allCodes.every((c) => checkState[type]?.has(c));
        setCheckState((prev) => {
            const s = new Set();
            if (!allOn) allCodes.forEach((c) => s.add(c));
            return { ...prev, [type]: s };
        });
    };

    const handleSave = () => {
        // Build array: [{ store_type, feature_code }, ...]
        const features = [];
        Object.entries(checkState).forEach(([type, codes]) => {
            codes.forEach((code) =>
                features.push({ store_type: type, feature_code: code }),
            );
        });

        setProcessing(true);
        router.post(
            route("developer.type-features.update"),
            { features },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    // Group fitur mengikuti pengelompokan sidebar Admin (bukan kolom DB category)
    const featuresByGroup = {};
    allFeatures.forEach((f) => {
        const g = featureGroupOf(f);
        if (!featuresByGroup[g]) featuresByGroup[g] = [];
        featuresByGroup[g].push(f);
    });
        const orderedGroupKeys = FEATURE_GROUP_ORDER.filter((g) => featuresByGroup[g]?.length > 0);

    const type = activeTab;
    const typeIdx = types.indexOf(type);
    const tm = allStoreTypes.find((t) => t.code === type) ?? {
        icon: null,
        label: type,
    };
    const TypeIcon = TYPE_ICONS[type] ?? Building2;
    const colors = TYPE_COLORS[typeIdx % TYPE_COLORS.length] ?? TYPE_COLORS[0];
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("tf-sidebar") ?? "true");
        } catch {
            return true;
        }
    });

    const selectedCount = checkState[type]?.size ?? 0;
    const totalCount = allFeatures.length;
    const allChecked = selectedCount === totalCount && totalCount > 0;

    // Deteksi perubahan dari mapping awal
    const hasChanges = types.some((t) => {
        const original = new Set(mapping[t] || []);
        const current = checkState[t] ?? new Set();
        if (original.size !== current.size) return true;
        for (const c of original) if (!current.has(c)) return true;
        return false;
    });

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Fitur per Tipe Toko
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Tentukan fitur apa saja yang tersedia untuk setiap
                            tipe toko
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={processing || !hasChanges}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" strokeWidth={2} />
                                {hasChanges ? "Simpan Perubahan" : "Tersimpan"}
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <Head title="Fitur per Tipe Toko" />

            {/* Flash messages */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CircleCheck className="h-5 w-5 shrink-0" strokeWidth={2} />
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    <TriangleAlert className="h-5 w-5 shrink-0" strokeWidth={2} />
                    {flash.error}
                </div>
            )}

            <div className="flex gap-5">
                {/* ── Sidebar: Daftar Tipe ── */}
                <aside
                    className={`shrink-0 transition-all duration-200 ${sidebarOpen ? "w-52" : "w-14"}`}
                >
                    <div className="sticky top-16 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                        <div className="flex items-center justify-between border-b border-border px-2 py-2">
                            {sidebarOpen && (
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Tipe Toko
                                </p>
                            )}
                            <button
                                onClick={() => {
                                    const next = !sidebarOpen;
                                    setSidebarOpen(next);
                                    try {
                                        localStorage.setItem(
                                            "tf-sidebar",
                                            JSON.stringify(next),
                                        );
                                    } catch {}
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                title={
                                    sidebarOpen
                                        ? "Perkecil sidebar"
                                        : "Perbesar sidebar"
                                }
                            >
                                <ChevronLeft
                                    className={`h-4 w-4 transition-transform ${sidebarOpen ? "" : "rotate-180"}`}
                                    strokeWidth={2}
                                />
                            </button>
                        </div>
                        <nav
                            className={`space-y-1 ${sidebarOpen ? "p-2" : "p-1"}`}
                        >
                            {types.map((t, idx) => {
                                const info = allStoreTypes.find(
                                    (st) => st.code === t,
                                ) ?? { label: t };
                                const ItemIcon = TYPE_ICONS[t] ?? Building2;
                                const c =
                                    TYPE_COLORS[idx % TYPE_COLORS.length] ??
                                    TYPE_COLORS[0];
                                const count = checkState[t]?.size ?? 0;
                                const isActive = activeTab === t;
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t)}
                                        title={
                                            !sidebarOpen
                                                ? info.label
                                                : undefined
                                        }
                                        className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium transition ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted"} ${sidebarOpen ? "" : "justify-center"}`}
                                    >
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${isActive ? "bg-primary-foreground/20" : `${c.bg} ${c.text}`}`}
                                        >
                                            <ItemIcon className="h-4 w-4" strokeWidth={1.8} />
                                        </span>
                                        {sidebarOpen && (
                                            <>
                                                <span className="flex-1 truncate">
                                                    {info.label}
                                                </span>
                                                <span
                                                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold transition ${isActive ? "bg-primary-foreground/25 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                                                >
                                                    {count}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Info perubahan */}
                    {sidebarOpen && hasChanges && (
                        <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2.5 text-xs text-warning">
                            <p className="font-semibold">Ada perubahan</p>
                            <p className="mt-0.5 text-warning/80">
                                Klik "Simpan Perubahan" untuk menyimpan.
                            </p>
                        </div>
                    )}
                </aside>

                {/* ── Main: Feature Grid ── */}
                <div className="flex-1 min-w-0">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                        {/* Header tipe aktif */}
                        <div className="flex items-center justify-between border-b border-border bg-muted/60 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${colors.bg} ${colors.ring}`}
                                >
                                    <TypeIcon className={`h-5 w-5 ${colors.text}`} strokeWidth={1.8} />
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        {tm.label}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="font-semibold text-primary">
                                            {selectedCount}
                                        </span>
                                        {" dari "}
                                        <span className="font-semibold">
                                            {totalCount}
                                        </span>
                                        {" fitur aktif"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleAll(type)}
                                className="rounded-xl border border-border bg-card text-card-foreground px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                            >
                                {allChecked ? "Hapus Semua" : "Pilih Semua"}
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1 bg-muted">
                            <div
                                className="h-1 bg-primary transition-all duration-300"
                                style={{
                                    width:
                                        totalCount > 0
                                            ? `${(selectedCount / totalCount) * 100}%`
                                            : "0%",
                                }}
                            />
                        </div>

                        {/* Feature list by group (mengikuti sidebar Admin) */}
                        <div className="p-6 space-y-6">
                            {allFeatures.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                                        <ClipboardList className="h-7 w-7 text-muted-foreground/50" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Belum ada fitur
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Tambah fitur terlebih dahulu di menu
                                        Fitur.
                                    </p>
                                </div>
                            ) : (
                                orderedGroupKeys.map((groupKey) => {
                                    const groupFeatures = featuresByGroup[groupKey];
                                    const group = FEATURE_GROUPS[groupKey] ?? FEATURE_GROUPS.other;
                                    const checkedInGroup = groupFeatures.filter(
                                        (f) => checkState[type]?.has(f.code),
                                    ).length;
                                    const allGroupChecked =
                                        checkedInGroup === groupFeatures.length;
                                    return (
                                        <div key={groupKey}>
                                            {/* Group header */}
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <group.Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                        {group.label}
                                                    </h4>
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                        {checkedInGroup}/
                                                        {groupFeatures.length}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCheckState((prev) => {
                                                            const s = new Set(prev[type]);
                                                            groupFeatures.forEach((f) =>
                                                                allGroupChecked
                                                                    ? s.delete(f.code)
                                                                    : s.add(f.code),
                                                            );
                                                            return { ...prev, [type]: s };
                                                        });
                                                    }}
                                                    className="text-[11px] font-medium text-primary transition hover:text-primary/80"
                                                >
                                                    {allGroupChecked
                                                        ? "Hapus grup"
                                                        : "Pilih grup"}
                                                </button>
                                            </div>

                                            {/* Feature chips */}
                                            <div
                                                className={`grid gap-2 ${sidebarOpen ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}
                                            >
                                                {groupFeatures.map((f) => {
                                                    const checked =
                                                        checkState[type]?.has(f.code) ??
                                                        false;
                                                    return (
                                                        <label
                                                            key={f.code}
                                                            className={`group flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition select-none ${
                                                                checked
                                                                    ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                                                                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted"
                                                            }`}
                                                        >
                                                            <div
                                                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                                                    checked
                                                                        ? "border-primary bg-primary"
                                                                        : "border-border bg-card group-hover:border-muted-foreground"
                                                                }`}
                                                            >
                                                                {checked && (
                                                                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                                                                )}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    toggleFeature(type, f.code)
                                                                }
                                                                className="sr-only"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold leading-tight">
                                                                    {f.label}
                                                                </p>
                                                                <p className="mt-0.5 font-mono text-[10px] opacity-50">
                                                                    {f.code}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer save */}
                        <div className="border-t border-border bg-muted/60 px-4 py-4 sm:px-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} />
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                        Berlaku untuk semua toko bertipe{" "}
                                        <span className="font-semibold text-foreground">
                                            {tm.label}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={processing || !hasChanges}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" strokeWidth={2} />
                                            Simpan Semua Tipe
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DeveloperLayout>
    );
}
