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

export default function Form({ feature, displayGroups = {} }) {
    const isEdit = !!feature;

    const { data, setData, post, put, processing, errors } = useForm({
        code: feature?.code ?? "",
        label: feature?.label ?? "",
        description: feature?.description ?? "",
        category: feature?.category ?? "",
        display_group: feature?.display_group ?? "other",
        is_active: feature?.is_active ?? true,
        sort_order: feature?.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit
            ? put(route("developer.features.update", feature.id))
            : post(route("developer.features.store"));
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.features.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {isEdit
                                ? `Edit Fitur — ${feature.label}`
                                : "Tambah Fitur Baru"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {isEdit
                                ? `Kode: ${feature.code}`
                                : "Isi informasi fitur sistem"}
                        </p>
                    </div>
                </div>
            }
        >
            <Head
                title={
                    isEdit ? `Edit Fitur — ${feature.label}` : "Tambah Fitur"
                }
            />

            <div className="mx-auto max-w-2xl">
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                    <p>
                        Fitur ini cuma jadi toggle yang bisa diaktifkan per
                        plan atau jenis usaha — untuk benar-benar mengunci
                        sebuah halaman/menu di aplikasi, kode programmer
                        wajib memakai kode fitur ini di middleware/component
                        terkait.
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
                                    placeholder="stock_transfer"
                                    disabled={isEdit}
                                />
                                <Hint>
                                    Lowercase, huruf/angka/underscore saja.
                                    Ini yang dipakai programmer di kode —
                                    tidak bisa diubah setelah dibuat.
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
                                    placeholder="Transfer Stok"
                                />
                                <FieldError msg={errors.label} />
                            </div>
                            <div>
                                <Label required>Grup Tampilan</Label>
                                <select
                                    value={data.display_group}
                                    onChange={(e) =>
                                        setData(
                                            "display_group",
                                            e.target.value,
                                        )
                                    }
                                    className={iCls(errors.display_group)}
                                >
                                    {Object.entries(displayGroups).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <Hint>
                                    Menentukan kelompok tampilan di halaman
                                    ini & Fitur per Tipe Toko
                                </Hint>
                                <FieldError msg={errors.display_group} />
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
                                    placeholder="Deskripsi singkat fitur ini..."
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
                                        Fitur bisa dipilih di halaman Paket &
                                        Fitur per Tipe Toko
                                    </p>
                                </div>
                            </label>
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link
                            href={route("developer.features.index")}
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
                                "Buat Fitur"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
