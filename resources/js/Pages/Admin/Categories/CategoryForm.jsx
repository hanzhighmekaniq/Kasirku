import { Link } from '@inertiajs/react';

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl border text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        err ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
    }`;

export default function CategoryForm({
    data, setData, errors, processing, onSubmit,
    submitLabel = 'Simpan', cancelHref,
    parentCategories = [],
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Nama Kategori *
                </label>
                <input type="text" value={data.name} autoFocus
                    onChange={e => setData('name', e.target.value)}
                    placeholder="cth. Minuman, Makanan, Layanan Potong"
                    className={inp(errors.name)} />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Parent category - untuk subcategory */}
            {parentCategories.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Kategori Induk
                        <span className="ml-1 text-xs font-normal text-slate-400">(opsional, untuk sub-kategori)</span>
                    </label>
                    <select value={data.parent_id ?? ''} onChange={e => setData('parent_id', e.target.value || null)}
                        className={inp(errors.parent_id)}>
                        <option value="">— Tidak ada (kategori utama) —</option>
                        {parentCategories.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700">Deskripsi</label>
                <textarea value={data.description ?? ''} rows={3}
                    onChange={e => setData('description', e.target.value)}
                    placeholder="Keterangan singkat (opsional)"
                    className={inp(errors.description)} />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Link href={cancelHref}
                    className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Batal
                </Link>
                <button type="submit" disabled={processing}
                    className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                    {processing ? 'Menyimpan...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
