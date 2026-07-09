import { Link } from "@inertiajs/react";
import TreePicker from "@/Components/TreePicker";

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl border text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        err
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
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
                <label className="block text-sm font-medium text-slate-700">
                    Nama Kategori <span className="text-red-500">*</span>
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
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
            </div>

            {/* Kategori Induk — Tree Picker */}
            {parentCategories.length > 0 && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                    <div className="mb-3">
                        <p className="text-sm font-semibold text-indigo-800">
                            📁 Kategori Induk
                            <span className="ml-1.5 text-xs font-normal text-indigo-400">
                                (opsional)
                            </span>
                        </p>
                        <p className="mt-0.5 text-xs text-indigo-500">
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
                <label className="block text-sm font-medium text-slate-700">
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
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Link
                    href={cancelHref}
                    className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
