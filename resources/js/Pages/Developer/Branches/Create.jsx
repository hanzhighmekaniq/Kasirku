import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import BranchForm from "./BranchForm";

export default function Create({ stores = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        store_id: "",
        code: "",
        name: "",
        phone: "",
        address: "",
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("developer.branches.store"));
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
                            Tambah Cabang
                        </h2>
                        <p className="text-xs text-slate-500">
                            Buat cabang baru untuk toko
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Tambah Cabang" />
            <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700">
                            Toko <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.store_id}
                            onChange={(e) =>
                                setData("store_id", e.target.value)
                            }
                            className="mt-1.5 block w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        >
                            <option value="">Pilih toko...</option>
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                        {errors.store_id && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.store_id}
                            </p>
                        )}
                    </div>
                    <BranchForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan"
                        cancelHref={route("developer.branches.index")}
                    />
                </div>
            </div>
        </DeveloperLayout>
    );
}
