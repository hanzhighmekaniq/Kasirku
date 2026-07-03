import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

const TYPE_COLORS = [
    "bg-blue-50 text-blue-700",
    "bg-orange-50 text-orange-700",
    "bg-violet-50 text-violet-700",
    "bg-cyan-50 text-cyan-700",
    "bg-rose-50 text-rose-700",
    "bg-amber-50 text-amber-700",
    "bg-emerald-50 text-emerald-700",
    "bg-pink-50 text-pink-700",
];

const FEATURE_CATEGORIES = {
    pos: "POS & Transaksi",
    inventory: "Inventaris",
    crm: "Pelanggan & CRM",
    finance: "Keuangan",
};

export default function Index({ types, allFeatures, mapping }) {
    const { flash, allStoreTypes = [] } = usePage().props;
    const [activeTab, setActiveTab] = useState(types[0]);
    const [checkState, setCheckState] = useState(() => {
        const state = {};
        types.forEach((t) => {
            state[t] = new Set(mapping[t] || []);
        });
        return state;
    });

    const toggleFeature = (type, code) => {
        setCheckState((prev) => {
            const next = { ...prev };
            const s = new Set(next[type]);
            s.has(code) ? s.delete(code) : s.add(code);
            next[type] = s;
            return next;
        });
    };

    const toggleAllInType = (type, features) => {
        const allOn = features.every((f) => checkState[type]?.has(f.code));
        setCheckState((prev) => {
            const next = { ...prev };
            const s = new Set(next[type]);
            features.forEach((f) => (allOn ? s.delete(f.code) : s.add(f.code)));
            next[type] = s;
            return next;
        });
    };

    const { post, processing } = useForm();
    const handleSave = () => {
        const features = [];
        Object.entries(checkState).forEach(([type, codes]) => {
            codes.forEach((code) =>
                features.push({ store_type: type, feature_code: code }),
            );
        });
        post(route("developer.type-features.update"), {
            data: { features },
            preserveScroll: true,
        });
    };

    const type = activeTab;
    const typeIdx = types.indexOf(type);
    const tm = allStoreTypes.find((t) => t.code === type) || {
        icon: "🏬",
        label: type,
    };
    const tmColor =
        TYPE_COLORS[typeIdx % TYPE_COLORS.length] ||
        "bg-slate-50 text-slate-700";
    const selectedCount = checkState[type]?.size ?? 0;

    const featuresByCategory = {};
    allFeatures.forEach((f) => {
        const cat = f.category || "other";
        if (!featuresByCategory[cat]) featuresByCategory[cat] = [];
        featuresByCategory[cat].push(f);
    });

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Fitur per Tipe Toko
                        </h2>
                        <p className="text-xs text-slate-500">
                            Atur fitur yang aktif untuk setiap tipe toko
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {processing ? "Menyimpan..." : "Simpan Semua"}
                    </button>
                </div>
            }
        >
            <Head title="Fitur per Tipe Toko" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
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
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                    {flash.error}
                </div>
            )}

            {/* Type Tabs */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {types.map((t, idx) => {
                    const info = allStoreTypes.find((st) => st.code === t) || {
                        icon: "🏬",
                        label: t,
                    };
                    const count = checkState[t]?.size ?? 0;
                    return (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === t ? "bg-indigo-600 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                        >
                            <span>{info.icon}</span>
                            <span>{info.label}</span>
                            <span
                                className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold ${activeTab === t ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Feature Grid */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${tmColor}`}
                        >
                            {tm.icon}
                        </span>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                {tm.label}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {selectedCount} fitur aktif
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => toggleAllInType(type, allFeatures)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                        {allFeatures.every((f) => checkState[type]?.has(f.code))
                            ? "Hapus Semua"
                            : "Pilih Semua"}
                    </button>
                </div>
                <div className="p-5 space-y-5">
                    {Object.entries(FEATURE_CATEGORIES).map(
                        ([catKey, catLabel]) => {
                            const catFeatures = featuresByCategory[catKey];
                            if (!catFeatures || catFeatures.length === 0)
                                return null;
                            return (
                                <div key={catKey}>
                                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        {catLabel}
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {catFeatures.map((f) => {
                                            const checked =
                                                checkState[type]?.has(f.code) ??
                                                false;
                                            return (
                                                <label
                                                    key={f.code}
                                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${checked ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() =>
                                                            toggleFeature(
                                                                type,
                                                                f.code,
                                                            )
                                                        }
                                                        className="h-3.5 w-3.5 rounded"
                                                    />
                                                    {f.label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>
            </div>
        </DeveloperLayout>
    );
}
