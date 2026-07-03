import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import BranchForm from "./BranchForm";
import { useState } from "react";

export default function Edit({ store, branch, stores = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        code: branch.code || "",
        name: branch.name || "",
        phone: branch.phone || "",
        address: branch.address || "",
        is_active: !!branch.is_active,
    });

    const [showStorePicker, setShowStorePicker] = useState(false);
    const [storeSearch, setStoreSearch] = useState("");

    const filteredStores = storeSearch.trim()
        ? stores.filter(
              (s) =>
                  s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                  s.code.toLowerCase().includes(storeSearch.toLowerCase()),
          )
        : stores;

    const submit = (e) => {
        e.preventDefault();
        put(route("developer.stores.branches.update", [store, branch]));
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.stores.branches.index", store)}
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
                        <h2 className="text-lg font-semibold text-slate-800">
                            Edit Cabang
                        </h2>
                        <p className="text-xs text-slate-500">{store.name}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit Cabang — ${store.name}`} />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">
                            Informasi Cabang
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Perbarui detail cabang "{branch.name}".
                        </p>
                    </div>
                    <div className="p-6">
                        {/* Store Selector */}
                        <div className="mb-5">
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Toko
                            </label>
                            {!showStorePicker ? (
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                                        {store.name} ({store.code})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowStorePicker(true)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800"
                                    >
                                        Pindah Toko
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative">
                                        <svg
                                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                            />
                                        </svg>
                                        <input
                                            type="text"
                                            value={storeSearch}
                                            onChange={(e) =>
                                                setStoreSearch(e.target.value)
                                            }
                                            placeholder="Cari toko..."
                                            autoFocus
                                            className="block w-full rounded-lg border-slate-300 py-1.5 pl-9 pr-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        />
                                    </div>
                                    <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-slate-200">
                                        {filteredStores.length > 0 ? (
                                            filteredStores.map((s) => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "developer.stores.branches.edit",
                                                                [s.id, branch],
                                                            ),
                                                        )
                                                    }
                                                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition border-b border-slate-100 last:border-0 ${s.id === store.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                                                >
                                                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                                                        {s.code?.charAt(0) ??
                                                            "?"}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-700 truncate">
                                                            {s.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {s.code}
                                                        </p>
                                                    </div>
                                                    {s.id === store.id && (
                                                        <span className="ml-auto shrink-0 text-xs text-indigo-500">
                                                            ← saat ini
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-3 py-3 text-center text-sm text-slate-400">
                                                Tidak ditemukan
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowStorePicker(false)
                                        }
                                        className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                                    >
                                        Batal
                                    </button>
                                </div>
                            )}
                        </div>

                        <BranchForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Perubahan"
                            cancelHref={route(
                                "developer.stores.branches.index",
                                store,
                            )}
                        />
                    </div>
                </div>
            </div>
        </DeveloperLayout>
    );
}
