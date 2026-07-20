import { Link } from '@inertiajs/react';

function inputClass(hasError) {
    return `mt-1.5 block w-full rounded-xl shadow-sm transition focus:ring-2 ${
        hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-200'
    }`;
}

export default function BranchForm({ data, setData, errors, processing, onSubmit, submitLabel = 'Simpan', cancelHref }) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                        Kode Cabang <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="code"
                        type="text"
                        value={data.code}
                        autoFocus
                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                        placeholder="cth. BR001"
                        className={inputClass(!!errors.code)}
                    />
                    {errors.code && <p className="mt-1.5 text-sm text-red-600">{errors.code}</p>}
                    <p className="mt-1.5 text-xs text-slate-400">Gunakan huruf, angka, strip, atau underscore.</p>
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                        Nama Cabang <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="cth. Cabang Utama"
                        className={inputClass(!!errors.name)}
                    />
                    {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Telepon</label>
                <input
                    id="phone"
                    type="text"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className={inputClass(!!errors.phone)}
                />
                {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700">Alamat</label>
                <textarea
                    id="address"
                    value={data.address}
                    rows={3}
                    onChange={(e) => setData('address', e.target.value)}
                    placeholder="Alamat lengkap outlet atau cabang"
                    className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
                {errors.address && <p className="mt-1.5 text-sm text-red-600">{errors.address}</p>}
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-primary-600 shadow-sm focus:ring-primary-500"
                />
                <span>
                    <span className="block text-sm font-medium text-slate-800">Cabang aktif</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Cabang aktif bisa dipakai untuk transaksi, stok, dan penugasan karyawan.</span>
                </span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link
                    href={cancelHref}
                    className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
                >
                    {processing ? 'Menyimpan...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
