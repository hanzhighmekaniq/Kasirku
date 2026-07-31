import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, TriangleAlert } from "lucide-react";

const iCls = (err) =>
    `block w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
        err
            ? "border-destructive bg-destructive/10 focus:ring-destructive/20"
            : "border-input bg-background focus:border-ring focus:ring-ring/20"
    }`;

function Label({ children, required }) {
    return (
        <label className="mb-1.5 block text-sm font-medium text-foreground">
            {children}
            {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
    );
}
function FieldError({ msg }) {
    return msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;
}
function Hint({ children }) {
    return <p className="mt-1 text-[11px] text-muted-foreground">{children}</p>;
}

export default function Form({ storeType }) {
    const isEdit = !!storeType;

    const { data, setData, post, put, processing, errors } = useForm({
        code: storeType?.code ?? "",
        label: storeType?.label ?? "",
        icon: storeType?.icon ?? "",
        description: storeType?.description ?? "",
        is_active: storeType?.is_active ?? true,
        sort_order: storeType?.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit
            ? put(route("developer.store-types.update", storeType))
            : post(route("developer.store-types.store"));
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.store-types.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {isEdit
                                ? `Edit Jenis Usaha — ${storeType.label}`
                                : "Tambah Jenis Usaha Baru"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {isEdit
                                ? `Kode: ${storeType.code}`
                                : "Isi informasi jenis usaha"}
                        </p>
                    </div>
                </div>
            }
        >
            <Head
                title={
                    isEdit
                        ? `Edit Jenis Usaha — ${storeType.label}`
                        : "Tambah Jenis Usaha"
                }
            />

            <div className="mx-auto max-w-2xl">
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                    <p>
                        Jenis usaha baru hanya menentukan tampilan katalog,
                        ikon, dan mapping fitur — mode kasir teknis untuk
                        jenis usaha ini tetap perlu dikembangkan programmer
                        sebelum benar-benar bisa dipakai transaksi di kasir.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">
                                Identitas
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-6">
                            <div>
                                <Label required>Kode</Label>
                                <input
                                    value={data.code}
                                    onChange={(e) =>
                                        setData(
                                            "code",
                                            e.target.value.toLowerCase(),
                                        )
                                    }
                                    className={iCls(errors.code)}
                                    placeholder="retail / fnb / service"
                                    disabled={isEdit}
                                />
                                <Hint>
                                    Lowercase, huruf/angka/underscore saja.
                                    Tidak bisa diubah setelah dibuat.
                                </Hint>
                                <FieldError msg={errors.code} />
                            </div>
                            <div>
                                <Label required>Label</Label>
                                <input
                                    value={data.label}
                                    onChange={(e) =>
                                        setData("label", e.target.value)
                                    }
                                    className={iCls(errors.label)}
                                    placeholder="Retail / F&B / Service"
                                />
                                <FieldError msg={errors.label} />
                            </div>
                            <div>
                                <Label>Ikon</Label>
                                <input
                                    value={data.icon}
                                    onChange={(e) =>
                                        setData("icon", e.target.value)
                                    }
                                    className={iCls(errors.icon)}
                                    placeholder="🏪"
                                    maxLength={20}
                                />
                                <Hint>
                                    Emoji yang tampil di daftar & pilihan
                                    registrasi.
                                </Hint>
                                <FieldError msg={errors.icon} />
                            </div>
                            <div>
                                <Label>Urutan</Label>
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
                                    className={iCls(errors.sort_order)}
                                />
                                <Hint>
                                    Bisa diubah via drag & drop di halaman
                                    daftar
                                </Hint>
                                <FieldError msg={errors.sort_order} />
                            </div>
                            <div className="col-span-2">
                                <Label>Deskripsi</Label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) =>
                                        setData(
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    rows={2}
                                    className={iCls(errors.description)}
                                    placeholder="Deskripsi singkat jenis usaha ini..."
                                />
                                <FieldError msg={errors.description} />
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">
                                Visibilitas
                            </h3>
                        </div>
                        <div className="p-6">
                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition hover:bg-muted">
                                <div
                                    className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${data.is_active ? "bg-primary" : "bg-muted-foreground/30"}`}
                                >
                                    <div
                                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${data.is_active ? "translate-x-4" : "translate-x-0.5"}`}
                                    />
                                </div>
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData("is_active", e.target.checked)
                                    }
                                    className="sr-only"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Aktif
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Jenis usaha bisa dipilih saat
                                        registrasi & pengaturan toko
                                    </p>
                                </div>
                            </label>
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link
                            href={route("developer.store-types.index")}
                            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Menyimpan...
                                </>
                            ) : isEdit ? (
                                "Simpan Perubahan"
                            ) : (
                                "Buat Jenis Usaha"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
