import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                        Kembali
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Tambah Cabang
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Buat cabang baru untuk toko
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Tambah Cabang" />
            <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-6">
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-foreground">
                            Toko <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={data.store_id}
                            onChange={(e) =>
                                setData("store_id", e.target.value)
                            }
                            className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        >
                            <option value="">Pilih toko...</option>
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                        {errors.store_id && (
                            <p className="mt-1 text-xs text-destructive">
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
