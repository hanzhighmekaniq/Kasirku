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
                    <label className="block text-sm font-medium text-slate-700">
                        Kode <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.code}
                        autoFocus
                        onChange={(e) =>
                            setData("code", e.target.value.toUpperCase())
                        }
                        placeholder="BR001"
                        className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                    {errors.code && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.code}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Nama <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        placeholder="Cabang Utama"
                        className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.name}
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Telepon
                </label>
                <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => setData("phone", e.target.value)}
                    placeholder="08xxx"
                    className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Alamat
                </label>
                <textarea
                    value={data.address}
                    rows={3}
                    onChange={(e) => setData("address", e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
            </div>

            <div
                onClick={() => setData("is_active", !data.is_active)}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 select-none"
            >
                <span
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${data.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.is_active ? "translate-x-5" : ""}`}
                    />
                </span>
                <span className="text-sm font-medium text-slate-800">
                    Aktif
                </span>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Link
                    href={cancelHref}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
