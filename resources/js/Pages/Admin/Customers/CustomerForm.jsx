import { Link } from '@inertiajs/react';

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl shadow-sm transition focus:ring-2 ${
        err ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
    }`;

export default function CustomerForm({ data, setData, errors, processing, onSubmit, submitLabel = 'Simpan', cancelHref }) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-slate-700">Nama Pelanggan *</label>
                <input type="text" value={data.name} autoFocus onChange={e => setData('name', e.target.value)}
                    placeholder="cth. John Doe" className={inp(errors.name)} />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Telepon</label>
                    <input type="text" value={data.phone ?? ''} onChange={e => setData('phone', e.target.value)}
                        placeholder="08xxxxxxxxxx" className={inp(errors.phone)} />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" value={data.email ?? ''} onChange={e => setData('email', e.target.value)}
                        placeholder="email@contoh.com" className={inp(errors.email)} />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Tanggal Lahir</label>
                    <input type="date" value={data.birth_date ?? ''} onChange={e => setData('birth_date', e.target.value)}
                        className={inp(errors.birth_date)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                    <select value={data.gender ?? ''} onChange={e => setData('gender', e.target.value)} className={inp(errors.gender)}>
                        <option value="">— Pilih —</option>
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Alamat</label>
                <textarea value={data.address ?? ''} onChange={e => setData('address', e.target.value)}
                    rows={2} placeholder="Alamat lengkap..." className={inp(errors.address)} />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Catatan</label>
                <textarea value={data.notes ?? ''} onChange={e => setData('notes', e.target.value)}
                    rows={2} placeholder="Preferensi, catatan khusus..." className={inp(errors.notes)} />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Link href={cancelHref} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
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
