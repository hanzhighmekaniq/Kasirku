import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm } from "@inertiajs/react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const iCls = (err) =>
    `block w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
        err
            ? "border-red-300 bg-red-50/30 focus:ring-red-200"
            : "border-slate-200 bg-white focus:ring-indigo-200 focus:border-indigo-400 hover:border-slate-300"
    }`;

const CAT_META = {
    pos:       { icon: "🛒", label: "POS & Transaksi",   cls: "bg-blue-50 text-blue-700 ring-blue-200"      },
    crm:       { icon: "👥", label: "Pelanggan & CRM",   cls: "bg-violet-50 text-violet-700 ring-violet-200" },
    inventory: { icon: "📦", label: "Inventaris & Stok", cls: "bg-amber-50 text-amber-700 ring-amber-200"   },
    finance:   { icon: "💰", label: "Keuangan",          cls: "bg-emerald-50 text-emerald-700 ring-emerald-200"},
    system:    { icon: "⚙️", label: "Sistem & Admin",    cls: "bg-slate-100 text-slate-600 ring-slate-200"  },
    other:     { icon: "📋", label: "Lainnya",           cls: "bg-slate-50 text-slate-500 ring-slate-200"   },
};
const CAT_ORDER = ["pos", "crm", "inventory", "finance", "system", "other"];

function Label({ children, required }) {
    return (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {children}{required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
    );
}
function FieldError({ msg }) {
    return msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null;
}

export default function Form({ plan, allFeatures = [] }) {
    const isEdit = !!plan;

    const { data, setData, post, put, processing, errors } = useForm({
        code:        plan?.code        ?? "",
        label:       plan?.label       ?? "",
        description: plan?.description ?? "",
        max_users:   plan?.max_users   ?? 1,
        max_branches: plan?.max_branches ?? 1,
        price:       plan?.price       ?? 0,
        trial_days:  plan?.trial_days  ?? 0,
        feature_ids: plan?.features?.map(f => f.id) ?? [],
        is_active:   plan?.is_active   ?? true,
        sort_order:  plan?.sort_order  ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit ? put(route("developer.plans.update", plan)) : post(route("developer.plans.store"));
    };

    // allFeatures adalah array of {id, code, label, category}
    const featureArr = Array.isArray(allFeatures)
        ? allFeatures
        : Object.entries(allFeatures).map(([id, label]) => ({ id: Number(id), label, code: "", category: "other" }));

    const allIds = featureArr.map(f => f.id);
    const selectedIds = data.feature_ids ?? [];
    const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;

    const toggleFeature = (id) => {
        setData("feature_ids", selectedIds.includes(id)
            ? selectedIds.filter(x => x !== id)
            : [...selectedIds, id]
        );
    };
    const toggleAll = () => setData("feature_ids", allSelected ? [] : allIds);

    // Group by category
    const grouped = {};
    featureArr.forEach(f => {
        const cat = f.category || "other";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(f);
    });

    const selectedCount = selectedIds.length;

    return (
        <DeveloperLayout header={
            <div className="flex items-center gap-3">
                <Link href={route("developer.plans.index")}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </Link>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {isEdit ? `Edit Paket — ${plan.label}` : "Tambah Paket Baru"}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {isEdit ? `Kode: ${plan.code}` : "Isi informasi paket langganan"}
                    </p>
                </div>
            </div>
        }>
            <Head title={isEdit ? `Edit Paket — ${plan.label}` : "Tambah Paket"} />

            <div className="mx-auto max-w-3xl">
                <form onSubmit={submit} className="space-y-5">

                    {/* ── Identitas Paket ── */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-slate-800">Identitas Paket</h3>
                            <p className="mt-0.5 text-xs text-slate-400">Kode unik dan nama yang tampil ke pengguna</p>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div>
                                <Label required>Kode</Label>
                                <input value={data.code}
                                    onChange={e => setData("code", e.target.value.toLowerCase())}
                                    className={iCls(errors.code)}
                                    placeholder="free / basic / pro"
                                />
                                <p className="mt-1 text-[11px] text-slate-400">Lowercase, tanpa spasi. Tidak bisa diubah setelah pakai.</p>
                                <FieldError msg={errors.code} />
                            </div>
                            <div>
                                <Label required>Label</Label>
                                <input value={data.label}
                                    onChange={e => setData("label", e.target.value)}
                                    className={iCls(errors.label)}
                                    placeholder="Free / Basic / Pro"
                                />
                                <FieldError msg={errors.label} />
                            </div>
                            <div className="col-span-2">
                                <Label>Deskripsi</Label>
                                <textarea value={data.description}
                                    onChange={e => setData("description", e.target.value)}
                                    rows={2}
                                    className={iCls(errors.description)}
                                    placeholder="Deskripsi singkat yang tampil di halaman pilih paket..."
                                />
                                <FieldError msg={errors.description} />
                            </div>
                        </div>
                    </section>

                    {/* ── Batas & Harga ── */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-slate-800">Batas & Harga</h3>
                            <p className="mt-0.5 text-xs text-slate-400">Limit penggunaan dan harga langganan</p>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div>
                                <Label required>Maks User</Label>
                                <div className="relative">
                                    <input type="number" min="1" value={data.max_users}
                                        onChange={e => setData("max_users", Number(e.target.value))}
                                        className={iCls(errors.max_users)}
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">user</span>
                                </div>
                                <FieldError msg={errors.max_users} />
                            </div>
                            <div>
                                <Label required>Maks Cabang</Label>
                                <div className="relative">
                                    <input type="number" min="1" value={data.max_branches}
                                        onChange={e => setData("max_branches", Number(e.target.value))}
                                        className={iCls(errors.max_branches)}
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">cabang</span>
                                </div>
                                <FieldError msg={errors.max_branches} />
                            </div>
                            <div>
                                <Label>Harga / Bulan</Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rp</span>
                                    <input type="number" min="0" step="1000" value={data.price}
                                        onChange={e => setData("price", Number(e.target.value))}
                                        className={`${iCls(errors.price)} pl-9`}
                                        placeholder="0 = Gratis"
                                    />
                                </div>
                                <FieldError msg={errors.price} />
                            </div>
                            <div>
                                <Label>Trial</Label>
                                <div className="relative">
                                    <input type="number" min="0" value={data.trial_days}
                                        onChange={e => setData("trial_days", Number(e.target.value))}
                                        className={iCls(errors.trial_days)}
                                        placeholder="0 = Tidak ada trial"
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">hari</span>
                                </div>
                                <FieldError msg={errors.trial_days} />
                            </div>

                            {/* Status & sort */}
                            <div className="col-span-2 flex items-center gap-6 pt-1">
                                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition hover:bg-slate-50">
                                    <div className={`relative h-5 w-9 rounded-full transition-colors ${data.is_active ? "bg-indigo-500" : "bg-slate-300"}`}>
                                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${data.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
                                    </div>
                                    <input type="checkbox" checked={data.is_active} onChange={e => setData("is_active", e.target.checked)} className="sr-only" />
                                    <span className="text-sm font-medium text-slate-700">{data.is_active ? "Aktif" : "Nonaktif"}</span>
                                </label>
                                <div>
                                    <Label>Urutan</Label>
                                    <input type="number" min="0" value={data.sort_order}
                                        onChange={e => setData("sort_order", Number(e.target.value))}
                                        className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-400">Bisa diubah via drag di Index</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Fitur ── */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Fitur yang Disertakan</h3>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    <span className="font-semibold text-indigo-600">{selectedCount}</span>
                                    {" dari "}
                                    <span className="font-semibold">{allIds.length}</span>
                                    {" fitur dipilih"}
                                </p>
                            </div>
                            <button type="button" onClick={toggleAll}
                                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                    allSelected
                                        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}>
                                {allSelected ? "✓ Semua Dipilih" : "Pilih Semua"}
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1 bg-slate-100">
                            <div className="h-1 bg-indigo-500 transition-all duration-300"
                                style={{ width: allIds.length > 0 ? `${(selectedCount / allIds.length) * 100}%` : "0%" }} />
                        </div>

                        <div className="p-6 space-y-5">
                            {CAT_ORDER.map(catKey => {
                                const catFeatures = grouped[catKey];
                                if (!catFeatures || catFeatures.length === 0) return null;
                                const cat = CAT_META[catKey] ?? CAT_META.other;
                                const catSelected = catFeatures.filter(f => selectedIds.includes(f.id)).length;
                                const catAllSelected = catSelected === catFeatures.length;
                                return (
                                    <div key={catKey}>
                                        <div className="mb-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{cat.icon}</span>
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">{cat.label}</h4>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${cat.cls}`}>
                                                    {catSelected}/{catFeatures.length}
                                                </span>
                                            </div>
                                            <button type="button"
                                                onClick={() => {
                                                    if (catAllSelected) {
                                                        setData("feature_ids", selectedIds.filter(id => !catFeatures.find(f => f.id === id)));
                                                    } else {
                                                        const newIds = [...new Set([...selectedIds, ...catFeatures.map(f => f.id)])];
                                                        setData("feature_ids", newIds);
                                                    }
                                                }}
                                                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition">
                                                {catAllSelected ? "Hapus semua" : "Pilih semua"}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {catFeatures.map(f => {
                                                const checked = selectedIds.includes(f.id);
                                                return (
                                                    <label key={f.id}
                                                        className={`group flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition select-none ${
                                                            checked
                                                                ? "border-indigo-300 bg-indigo-50"
                                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                        }`}>
                                                        <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                                            checked ? "border-indigo-500 bg-indigo-500" : "border-slate-300 group-hover:border-slate-400"
                                                        }`}>
                                                            {checked && (
                                                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <input type="checkbox" checked={checked} onChange={() => toggleFeature(f.id)} className="sr-only" />
                                                        <div className="min-w-0">
                                                            <p className={`text-xs font-semibold leading-tight ${checked ? "text-indigo-800" : "text-slate-700"}`}>{f.label}</p>
                                                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">{f.code}</p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {errors.feature_ids && (
                            <p className="px-6 pb-4 text-xs text-red-600">{errors.feature_ids}</p>
                        )}
                    </section>

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-between pb-6">
                        <p className="text-xs text-slate-400">
                            {selectedCount} fitur dipilih untuk paket <span className="font-semibold text-slate-600">{data.label || "ini"}</span>
                        </p>
                        <div className="flex items-center gap-3">
                            <Link href={route("developer.plans.index")}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                Batal
                            </Link>
                            <button type="submit" disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                                {processing ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Menyimpan...
                                    </>
                                ) : isEdit ? "Simpan Perubahan" : "Buat Paket"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
