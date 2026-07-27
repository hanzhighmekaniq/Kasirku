import { Link } from "@inertiajs/react";
import TreePicker from "@/Components/TreePicker";
import { Check, Folder, Save, X } from "lucide-react";

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl border bg-background text-foreground text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        err
            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
            : "border-input focus:border-ring focus:ring-ring/20"
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
    formId = "category-form",
}) {
    return (
        <>
            <form id={formId} onSubmit={onSubmit} className="space-y-5">
                {/* Nama */}
                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Nama Kategori <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        autoFocus
                        required
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
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                        <div className="mb-3">
                            <p className="text-sm font-semibold text-primary/80">
                                <Folder className="mr-1.5 inline-block h-4 w-4" />
                                Kategori Induk
                                <span className="ml-1.5 text-xs font-normal text-primary/60">
                                    (opsional)
                                </span>
                            </p>
                            <p className="mt-0.5 text-xs text-primary/80">
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

                {/* Actions — desktop */}
                <div className="hidden sm:flex justify-end gap-3 border-t border-border pt-4">
                    <Link
                        href={cancelHref}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? "Menyimpan..." : submitLabel}
                    </button>
                </div>
            </form>

            {/* Floating Action Buttons — mobile only, pola sama dengan Products/Create */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:hidden">
                <Link
                    href={cancelHref}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-lg ring-1 ring-border transition hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/30"
                    title="Batal"
                >
                    <X className="h-5 w-5" strokeWidth={2} />
                </Link>
                <button
                    type="submit"
                    form={formId}
                    disabled={processing}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary text-primary-foreground shadow-xl shadow-primary/40 transition hover:shadow-2xl hover:shadow-primary/50 disabled:opacity-60"
                    title={submitLabel}
                >
                    {processing ? (
                        <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <Check className="h-6 w-6" strokeWidth={2.5} />
                    )}
                </button>
            </div>

            {/* Spacer supaya konten tidak tertutup FAB di mobile */}
            <div className="h-24 sm:hidden" />
        </>
    );
}
