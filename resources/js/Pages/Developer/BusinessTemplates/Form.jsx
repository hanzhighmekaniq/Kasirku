import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

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

export default function Form({ template, storeTypes = [] }) {
    const isEdit = !!template;

    const { data, setData, post, put, processing, errors } = useForm({
        store_type_id: template?.store_type_id ?? storeTypes[0]?.id ?? "",
        code: template?.code ?? "",
        label: template?.label ?? "",
        icon: template?.icon ?? "",
        description: template?.description ?? "",
        is_active: template?.is_active ?? true,
        sort_order: template?.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit
            ? put(route("developer.business-templates.update", template.id))
            : post(route("developer.business-templates.store"));
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.business-templates.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {isEdit
                                ? `Edit Template — ${template.label}`
                                : "Tambah Template Baru"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {isEdit
                                ? `Kode: ${template.code} · Atur kategori & produk lewat tombol di halaman daftar`
                                : "Isi metadata template bisnis"}
                        </p>
                    </div>
                </div>
            }
        >
            <Head
                title={
                    isEdit
                        ? `Edit Template — ${template.label}`
                        : "Tambah Template"
                }
            />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={submit} className="space-y-5">
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">
                                Identitas
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-6">
                            <div className="col-span-2">
                                <Label required>Jenis Usaha</Label>
                                <select
                                    value={data.store_type_id}
                                    onChange={(e) =>
                                        setData(
                                            "store_type_id",
                                            Number(e.target.value),
                                        )
                                    }
                                    className={iCls(errors.store_type_id)}
                                >
                                    {storeTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                                <FieldError msg={errors.store_type_id} />
                            </div>
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
                                    placeholder="fnb_warteg"
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
                                    placeholder="Warteg / Rumah Makan"
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
                                    placeholder="🍚"
                                    maxLength={20}
                                />
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
                                    placeholder="Deskripsi singkat template ini..."
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
                                        Template bisa dipilih saat registrasi
                                    </p>
                                </div>
                            </label>
                            {isEdit && (
                                <div className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                                    Status <strong className="text-foreground">Siap Pakai</strong>{" "}
                                    otomatis mengikuti apakah template ini
                                    sudah punya kategori — kelola lewat tombol{" "}
                                    <strong className="text-foreground">Kategori & Produk</strong>{" "}
                                    di halaman daftar, tidak bisa di-toggle
                                    manual di sini.
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link
                            href={route("developer.business-templates.index")}
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
                                "Buat Template"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
