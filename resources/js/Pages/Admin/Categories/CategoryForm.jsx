import { Link } from "@inertiajs/react";
import TreePicker from "@/Components/TreePicker";

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl border bg-background text-foreground text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        err
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-border focus:border-ring focus:ring-ring/20"
    }`;

/* ── Main Form ──────────────────────────────────────────── */
export default function CategoryForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = "Simpan",
    cancelHref,
    parentCategories = [],
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* Nama */}
            <div>
                <label className="block text-sm font-medium text-foreground">
                    Nama Kategori <span className="text-destructive">*</span>
                </label>
                <input
                    type="text"
                    value={data.name}
                    autoFocus
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="cth. Minuman, Kaos, Lengan Panjang, Bordir"
                    className={inp(errors.name)}
                />
                {errors.name && (
                    <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                )}
            </div>

            {/* Kategori Induk — Tree Picker */}
            {parentCategories.length > 0 && (
                <div className="rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
                    <div className="mb-3">
                        <p className="text-sm font-semibold text-primary-800">
                            📁 Kategori Induk
                            <span className="ml-1.5 text-xs font-normal text-primary-400">
                                (opsional)
                            </span>
                        </p>
                        <p className="mt-0.5 text-xs text-primary-500">
                            Kosongkan untuk kategori utama. Pilih untuk membuat
                            sub-kategori di bawah kategori lain.
                        </p>
                    </div>

                    <TreePicker
                        categories={parentCategories}
                        value={data.parent_id}
                        onChange={(v) => setData("parent_id", v)}
                        onClear={() => setData("parent_id", null)}
                        showRoot
                        showSelectedBanner
                        bannerLabel="Sub-kategori dari:"
                    />
                </div>
            )}

            {/* Deskripsi */}
            <div>
                <label className="block text-sm font-medium text-foreground">
                    Deskripsi
                </label>
                <textarea
                    value={data.description ?? ""}
                    rows={3}
                    onChange={(e) => setData("description", e.target.value)}
                    placeholder="Keterangan singkat (opsional)"
                    className={inp(errors.description)}
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Link
                    href={cancelHref}
                    className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
