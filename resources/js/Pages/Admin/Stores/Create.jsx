import { useMemo, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArrowRight,
    Check,
    Sparkles,
} from "lucide-react";

const iCls = (err) =>
    `block w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
        err
            ? "border-destructive bg-destructive/10 focus:ring-destructive/20"
            : "border-input bg-background focus:border-ring focus:ring-ring/20"
    }`;

export default function CreateStore({ storeTypes = [] }) {
    const [activeStoreTypeId, setActiveStoreTypeId] = useState(storeTypes[0]?.id ?? null);

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        store_type_id: storeTypes[0]?.id ?? "",
        business_template_code: "",
    });

    const activeStoreType = useMemo(
        () => storeTypes.find((t) => t.id === activeStoreTypeId) ?? null,
        [storeTypes, activeStoreTypeId],
    );

    const selectStoreType = (type) => {
        setActiveStoreTypeId(type.id);
        setData("store_type_id", type.id);
        setData("business_template_code", "");
    };

    const selectTemplate = (code) => {
        setData("business_template_code", code === data.business_template_code ? "" : code);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.stores.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-lg font-bold text-foreground">Tambah Toko Baru</h2>
                    <p className="text-xs text-muted-foreground">
                        Toko baru akan menggunakan plan yang sama dengan akun kamu
                    </p>
                </div>
            }
        >
            <Head title="Tambah Toko Baru" />

            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
                {/* Nama toko */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-foreground">Nama Toko</h3>
                    <div>
                        <input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className={iCls(errors.name)}
                            placeholder="cth. Kafe Senja Malioboro"
                            autoFocus
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                        )}
                    </div>
                </div>

                {/* Jenis usaha */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-foreground">Jenis Usaha</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {storeTypes.map((type) => {
                            const isActive = activeStoreType?.id === type.id;
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => selectStoreType(type)}
                                    className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3.5 transition ${
                                        isActive
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/30"
                                    }`}
                                >
                                    <span className="text-lg">{type.icon}</span>
                                    <span className="text-xs font-semibold text-foreground">
                                        {type.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {errors.store_type_id && (
                        <p className="mt-1 text-xs text-destructive">{errors.store_type_id}</p>
                    )}

                    {/* Template bisnis */}
                    {activeStoreType && (
                        <div className="mt-5">
                            <p className="mb-2 text-sm font-medium text-foreground">
                                Template data awal (opsional)
                            </p>
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => selectTemplate("")}
                                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                                        !data.business_template_code
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/30"
                                    }`}
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm">
                                        ✨
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Mulai kosong</p>
                                        <p className="text-xs text-muted-foreground">Tanpa kategori & produk contoh</p>
                                    </div>
                                </button>

                                {activeStoreType.business_templates.map((tpl) => {
                                    const isActive = data.business_template_code === tpl.code;
                                    return (
                                        <button
                                            key={tpl.code}
                                            type="button"
                                            onClick={() => selectTemplate(tpl.code)}
                                            className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                                                isActive
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/30"
                                            }`}
                                        >
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm">
                                                {tpl.icon}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{tpl.label}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Kategori & produk contoh siap pakai
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 pb-6">
                    <Link
                        href={route("admin.dashboard")}
                        className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={processing || !data.name.trim() || !data.store_type_id}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                    >
                        {processing ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Membuat toko...
                            </>
                        ) : (
                            <>
                                Buat Toko
                                <ArrowRight size={16} strokeWidth={2.5} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
