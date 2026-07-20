import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";

// Warna per tipe toko (index-based)
const TYPE_COLORS = [
    {
        bg: "bg-blue-50",
        text: "text-blue-700",
        ring: "ring-blue-200",
        active: "bg-blue-600",
    },
    {
        bg: "bg-orange-50",
        text: "text-orange-700",
        ring: "ring-orange-200",
        active: "bg-orange-500",
    },
    {
        bg: "bg-violet-50",
        text: "text-violet-700",
        ring: "ring-violet-200",
        active: "bg-violet-600",
    },
    {
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        ring: "ring-cyan-200",
        active: "bg-cyan-600",
    },
    {
        bg: "bg-rose-50",
        text: "text-rose-700",
        ring: "ring-rose-200",
        active: "bg-rose-600",
    },
    {
        bg: "bg-amber-50",
        text: "text-amber-700",
        ring: "ring-amber-200",
        active: "bg-amber-500",
    },
    {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        ring: "ring-emerald-200",
        active: "bg-emerald-600",
    },
    {
        bg: "bg-pink-50",
        text: "text-pink-700",
        ring: "ring-pink-200",
        active: "bg-pink-600",
    },
];

// Label kategori fitur
const CAT_LABELS = {
    pos: { label: "POS & Transaksi", icon: "🛒" },
    inventory: { label: "Inventaris & Stok", icon: "📦" },
    crm: { label: "Pelanggan & CRM", icon: "👥" },
    finance: { label: "Keuangan", icon: "💰" },
    system: { label: "Sistem", icon: "⚙️" },
    other: { label: "Lainnya", icon: "📋" },
};

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

    // Group fitur by category
    const featuresByCategory = {};
    allFeatures.forEach((f) => {
        const cat = f.category || "other";
        if (!featuresByCategory[cat]) featuresByCategory[cat] = [];
        featuresByCategory[cat].push(f);
    });

    const type = activeTab;
    const typeIdx = types.indexOf(type);
    const tm = allStoreTypes.find((t) => t.code === type) ?? {
        icon: "🏬",
        label: type,
    };
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
                        <h2 className="text-lg font-bold text-slate-800">
                            Fitur per Tipe Toko
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Tentukan fitur apa saja yang tersedia untuk setiap
                            tipe toko
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={processing || !hasChanges}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
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
                                        d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17 3v4H7V3M12 12v6m-3-3h6"
                                    />
                                </svg>
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
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <svg
                        className="h-5 w-5 shrink-0"
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
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H2.645c-1.73 0-2.813-1.874-1.948-3.374l7.26-12.547c.866-1.5 3.032-1.5 3.898 0l7.26 12.547zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                    {flash.error}
                </div>
            )}

            <div className="flex gap-5">
                {/* ── Sidebar: Daftar Tipe ── */}
                <aside
                    className={`shrink-0 transition-all duration-200 ${sidebarOpen ? "w-52" : "w-14"}`}
                >
                    <div className="sticky top-16 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-2 py-2">
                            {sidebarOpen && (
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
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
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                title={
                                    sidebarOpen
                                        ? "Perkecil sidebar"
                                        : "Perbesar sidebar"
                                }
                            >
                                <svg
                                    className={`h-4 w-4 transition-transform ${sidebarOpen ? "" : "rotate-180"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
                                    />
                                </svg>
                            </button>
                        </div>
                        <nav
                            className={`space-y-1 ${sidebarOpen ? "p-2" : "p-1"}`}
                        >
                            {types.map((t, idx) => {
                                const info = allStoreTypes.find(
                                    (st) => st.code === t,
                                ) ?? { icon: "🏬", label: t };
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
                                        className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium transition ${isActive ? "bg-primary-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"} ${sidebarOpen ? "" : "justify-center"}`}
                                    >
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition ${isActive ? "bg-white/20" : `${c.bg} ${c.text}`}`}
                                        >
                                            {info.icon}
                                        </span>
                                        {sidebarOpen && (
                                            <>
                                                <span className="flex-1 truncate">
                                                    {info.label}
                                                </span>
                                                <span
                                                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold transition ${isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}
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
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                            <p className="font-semibold">Ada perubahan</p>
                            <p className="mt-0.5 text-amber-600">
                                Klik "Simpan Perubahan" untuk menyimpan.
                            </p>
                        </div>
                    )}
                </aside>

                {/* ── Main: Feature Grid ── */}
                <div className="flex-1 min-w-0">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Header tipe aktif */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ring-1 ${colors.bg} ${colors.ring}`}
                                >
                                    {tm.icon}
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">
                                        {tm.label}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        <span className="font-semibold text-primary-600">
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
                                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                {allChecked ? "Hapus Semua" : "Pilih Semua"}
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1 bg-slate-100">
                            <div
                                className="h-1 bg-primary-500 transition-all duration-300"
                                style={{
                                    width:
                                        totalCount > 0
                                            ? `${(selectedCount / totalCount) * 100}%`
                                            : "0%",
                                }}
                            />
                        </div>

                        {/* Feature list by category */}
                        <div className="p-6 space-y-6">
                            {allFeatures.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-center">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                                        📋
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">
                                        Belum ada fitur
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Tambah fitur terlebih dahulu di menu
                                        Fitur.
                                    </p>
                                </div>
                            ) : (
                                Object.entries(featuresByCategory).map(
                                    ([catKey, catFeatures]) => {
                                        const cat = CAT_LABELS[catKey] ?? {
                                            label: catKey,
                                            icon: "📋",
                                        };
                                        const checkedInCat = catFeatures.filter(
                                            (f) =>
                                                checkState[type]?.has(f.code),
                                        ).length;
                                        const allCatChecked =
                                            checkedInCat === catFeatures.length;
                                        return (
                                            <div key={catKey}>
                                                {/* Category header */}
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">
                                                            {cat.icon}
                                                        </span>
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                            {cat.label}
                                                        </h4>
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                                            {checkedInCat}/
                                                            {catFeatures.length}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCheckState(
                                                                (prev) => {
                                                                    const s =
                                                                        new Set(
                                                                            prev[
                                                                                type
                                                                            ],
                                                                        );
                                                                    catFeatures.forEach(
                                                                        (f) =>
                                                                            allCatChecked
                                                                                ? s.delete(
                                                                                      f.code,
                                                                                  )
                                                                                : s.add(
                                                                                      f.code,
                                                                                  ),
                                                                    );
                                                                    return {
                                                                        ...prev,
                                                                        [type]: s,
                                                                    };
                                                                },
                                                            );
                                                        }}
                                                        className="text-[11px] font-medium text-primary-600 hover:text-primary-800 transition"
                                                    >
                                                        {allCatChecked
                                                            ? "Hapus kategori"
                                                            : "Pilih kategori"}
                                                    </button>
                                                </div>

                                                {/* Feature chips */}
                                                <div
                                                    className={`grid gap-2 ${sidebarOpen ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}
                                                >
                                                    {catFeatures.map((f) => {
                                                        const checked =
                                                            checkState[
                                                                type
                                                            ]?.has(f.code) ??
                                                            false;
                                                        return (
                                                            <label
                                                                key={f.code}
                                                                className={`group flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition select-none ${
                                                                    checked
                                                                        ? "border-primary-300 bg-primary-50 text-primary-800 shadow-sm"
                                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                                                        checked
                                                                            ? "border-primary-500 bg-primary-500"
                                                                            : "border-slate-300 bg-white group-hover:border-slate-400"
                                                                    }`}
                                                                >
                                                                    {checked && (
                                                                        <svg
                                                                            className="h-3 w-3 text-white"
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
                                                                                d="M5 13l4 4L19 7"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        checked
                                                                    }
                                                                    onChange={() =>
                                                                        toggleFeature(
                                                                            type,
                                                                            f.code,
                                                                        )
                                                                    }
                                                                    className="sr-only"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-semibold leading-tight">
                                                                        {
                                                                            f.label
                                                                        }
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
                                    },
                                )
                            )}
                        </div>

                        {/* Footer save */}
                        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-100 text-xs text-primary-600">
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                            />
                                        </svg>
                                    </span>
                                    <p className="text-xs text-slate-500">
                                        Berlaku untuk semua toko bertipe{" "}
                                        <span className="font-semibold text-slate-700">
                                            {tm.label}
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={processing || !hasChanges}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                                >
                                    {processing ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
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
                                                    d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 12v6m-3-3h6"
                                                />
                                            </svg>
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
