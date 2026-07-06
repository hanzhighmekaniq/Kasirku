import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import BranchForm from "./BranchForm";

export default function Edit({ branch, store, stores = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        store_id: String(branch.store_id),
        code: branch.code || "",
        name: branch.name || "",
        phone: branch.phone || "",
        address: branch.address || "",
        is_active: !!branch.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("developer.branches.update", branch.id));
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={route("developer.branches.index")}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        ← Kembali
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Edit Cabang
                        </h2>
                        <p className="text-xs text-slate-500">
                            {branch.code} — {store?.name ?? "Toko"}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit — ${branch.name}`} />
            <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700">
                            Toko
                        </label>
                        <select
                            value={data.store_id}
                            onChange={(e) =>
                                setData("store_id", e.target.value)
                            }
                            className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        >
                            {stores.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <BranchForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Perubahan"
                        cancelHref={route("developer.branches.index")}
                    />
                </div>
            </div>
        </DeveloperLayout>
    );
}
