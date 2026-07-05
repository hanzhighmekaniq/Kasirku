import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useState, useEffect } from "react";
import BranchForm from "./BranchForm";

const STORE_TYPE = {
    retail: { icon: "🏪" },
    fnb: { icon: "☕" },
    service: { icon: "✂️" },
    rental: { icon: "🔑" },
    ticket: { icon: "🎟️" },
    hospitality: { icon: "🏨" },
    parking: { icon: "🅿️" },
    session: { icon: "🎮" },
};

export default function Create({ store, stores = [], selectedStoreId = null }) {
    const [targetStoreId, setTargetStoreId] = useState(
        selectedStoreId
            ? String(selectedStoreId)
            : store?.id
              ? String(store.id)
              : "",
    );
    const { data, setData, post, processing, errors } = useForm({
        code: "",
        name: "",
        phone: "",
        address: "",
        is_active: true,
        store_id: targetStoreId,
    });

    useEffect(() => {
        if (targetStoreId) setData("store_id", targetStoreId);
    }, [targetStoreId]);

    const targetStore = stores.find((s) => String(s.id) === targetStoreId);

    const submit = (e) => {
        e.preventDefault();
        if (!targetStoreId) return;
        post(route("developer.stores.branches.store", targetStoreId));
    };

    const backHref = targetStoreId
        ? route("developer.stores.branches.index", targetStoreId)
        : route("developer.branches.index");

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={backHref}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
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
                                d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Tambah Cabang
                        </h2>
                        {targetStore && (
                            <p className="text-xs text-slate-500">
                                {targetStore.name}
                            </p>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Tambah Cabang" />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">
                            Informasi Cabang
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Buat outlet untuk memisahkan stok, transaksi, dan
                            kasir per lokasi.
                        </p>
                    </div>
                    <div className="p-6">
                        {/* Store Selector */}
                        <div className="mb-6">
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                Kaitkan ke Toko
                            </label>
                            <select
                                value={targetStoreId}
                                onChange={(e) =>
                                    setTargetStoreId(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">Pilih toko...</option>
                                {stores.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {(STORE_TYPE[s.store_type] ?? {})
                                            .icon || "🏬"}{" "}
                                        {s.name} ({s.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {targetStoreId ? (
                            <BranchForm
                                data={data}
                                setData={setData}
                                errors={errors}
                                processing={processing}
                                onSubmit={submit}
                                submitLabel="Simpan Cabang"
                                cancelHref={backHref}
                            />
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                                <p className="text-sm text-slate-400">
                                    Pilih toko terlebih dahulu untuk
                                    melanjutkan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DeveloperLayout>
    );
}
