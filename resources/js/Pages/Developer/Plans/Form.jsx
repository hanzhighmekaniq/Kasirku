import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm } from "@inertiajs/react";

const iCls = (err) =>
    `block w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${err ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-200 focus:border-indigo-500"}`;

export default function Form({ plan, allFeatures = {} }) {
    const isEdit = !!plan;
    const { data, setData, post, put, processing, errors } = useForm({
        code: plan?.code ?? "",
        label: plan?.label ?? "",
        description: plan?.description ?? "",
        max_users: plan?.max_users ?? 1,
        max_branches: plan?.max_branches ?? 1,
        price: plan?.price ?? 0,
        trial_days: plan?.trial_days ?? 0,
        feature_ids: plan?.plan_features?.map((f) => f.id) ?? [],
        is_active: plan?.is_active ?? true,
        sort_order: plan?.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route("developer.plans.update", plan));
        } else {
            post(route("developer.plans.store"));
        }
    };

    const allFeatureIds = Object.keys(allFeatures).map(Number);
    const allSelected =
        allFeatureIds.length > 0 &&
        (data.feature_ids ?? []).length === allFeatureIds.length;

    const toggleFeature = (id) => {
        const current = data.feature_ids ?? [];
        if (current.includes(id)) {
            setData(
                "feature_ids",
                current.filter((f) => f !== id),
            );
        } else {
            setData("feature_ids", [...current, id]);
        }
    };

    const toggleAll = () => {
        if (allSelected) {
            setData("feature_ids", []);
        } else {
            setData("feature_ids", allFeatureIds);
        }
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.plans.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {isEdit ? "Edit Paket" : "Tambah Paket"}
                        </h2>
                        {isEdit && (
                            <p className="text-xs text-slate-500">
                                {plan.label}
                            </p>
                        )}
                    </div>
                </div>
            }
        >
            <Head
                title={isEdit ? `Edit Paket — ${plan.label}` : "Tambah Paket"}
            />
            <div className="mx-auto max-w-3xl">
                <form onSubmit={submit} className="space-y-6">
                    {/* Basic Info */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                            Informasi Paket
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Kode *
                                </label>
                                <input
                                    value={data.code}
                                    onChange={(e) =>
                                        setData(
                                            "code",
                                            e.target.value.toLowerCase(),
                                        )
                                    }
                                    className={iCls(errors.code)}
                                    placeholder="free, basic, pro"
                                />
                                {errors.code && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.code}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Label *
                                </label>
                                <input
                                    value={data.label}
                                    onChange={(e) =>
                                        setData("label", e.target.value)
                                    }
                                    className={iCls(errors.label)}
                                    placeholder="Basic, Premium"
                                />
                                {errors.label && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.label}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Deskripsi
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    rows={2}
                                    className={iCls(errors.description)}
                                    placeholder="Deskripsi singkat paket..."
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Maks User *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.max_users}
                                    onChange={(e) =>
                                        setData(
                                            "max_users",
                                            Number(e.target.value),
                                        )
                                    }
                                    className={iCls(errors.max_users)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Maks Cabang *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.max_branches}
                                    onChange={(e) =>
                                        setData(
                                            "max_branches",
                                            Number(e.target.value),
                                        )
                                    }
                                    className={iCls(errors.max_branches)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Harga / Bulan (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={data.price}
                                    onChange={(e) =>
                                        setData("price", Number(e.target.value))
                                    }
                                    className={iCls(errors.price)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Trial (hari)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.trial_days}
                                    onChange={(e) =>
                                        setData(
                                            "trial_days",
                                            Number(e.target.value),
                                        )
                                    }
                                    className={iCls(errors.trial_days)}
                                />
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            setData(
                                                "is_active",
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded"
                                    />
                                    <span className="text-sm text-slate-700">
                                        Aktif
                                    </span>
                                </label>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-0.5">
                                        Urutan
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.sort_order}
                                        onChange={(e) =>
                                            setData(
                                                "sort_order",
                                                Number(e.target.value),
                                            )
                                        }
                                        className="w-20 rounded-lg border-slate-300 px-2 py-1 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                                Fitur
                            </h2>
                            <button
                                type="button"
                                onClick={toggleAll}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${allSelected ? "bg-indigo-100 text-indigo-700" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            >
                                {allSelected ? "✓ Semua Fitur" : "Pilih Semua"}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {Object.entries(allFeatures).map(([id, label]) => (
                                <label
                                    key={id}
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${(data.feature_ids ?? []).includes(Number(id)) ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={(
                                            data.feature_ids ?? []
                                        ).includes(Number(id))}
                                        onChange={() =>
                                            toggleFeature(Number(id))
                                        }
                                        className="h-3.5 w-3.5 rounded"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                        {errors.feature_ids && (
                            <p className="mt-2 text-xs text-red-600">
                                {errors.feature_ids}
                            </p>
                        )}
                    </section>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link
                            href={route("developer.plans.index")}
                            className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {processing
                                ? "Menyimpan..."
                                : isEdit
                                  ? "Simpan Perubahan"
                                  : "Buat Paket"}
                        </button>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
