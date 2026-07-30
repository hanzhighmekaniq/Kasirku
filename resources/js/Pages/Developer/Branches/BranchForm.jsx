import { Link } from "@inertiajs/react";

export default function BranchForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = "Simpan",
    cancelHref,
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Kode <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.code}
                        autoFocus
                        onChange={(e) =>
                            setData("code", e.target.value.toUpperCase())
                        }
                        placeholder="BR001"
                        className="mt-1.5 block w-full rounded-xl border-input bg-background text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                    {errors.code && (
                        <p className="mt-1 text-xs text-destructive">
                            {errors.code}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Nama <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        placeholder="Cabang Utama"
                        className="mt-1.5 block w-full rounded-xl border-input bg-background text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-destructive">
                            {errors.name}
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground">
                    Telepon
                </label>
                <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => setData("phone", e.target.value)}
                    placeholder="08xxx"
                    className="mt-1.5 block w-full rounded-xl border-input bg-background text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground">
                    Alamat
                </label>
                <textarea
                    value={data.address}
                    rows={3}
                    onChange={(e) => setData("address", e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border-input bg-background text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
            </div>

            <div
                onClick={() => setData("is_active", !data.is_active)}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 hover:bg-muted select-none"
            >
                <span
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${data.is_active ? "bg-success" : "bg-muted-foreground/40"}`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${data.is_active ? "translate-x-5" : ""}`}
                    />
                </span>
                <span className="text-sm font-medium text-foreground">
                    Aktif
                </span>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-5">
                <Link
                    href={cancelHref}
                    className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
