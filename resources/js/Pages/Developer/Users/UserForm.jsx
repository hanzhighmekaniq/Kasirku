import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const STORE_TYPE_INFO = {
    retail:  { icon: '🏪', label: 'Retail' },
    fnb:     { icon: '☕', label: 'FnB' },
    service: { icon: '✂️', label: 'Service' },
    laundry: { icon: '👕', label: 'Laundry' },
    rental:  { icon: '🔑', label: 'Rental' },
    parking: { icon: '🅿️', label: 'Parkir' },
    session: { icon: '🖥️', label: 'Sesi' },
};

const STORE_ROLES = [
    { value: 'owner',      label: 'Owner',      desc: 'Akses penuh toko, kelola role & user' },
    { value: 'admin',      label: 'Admin',       desc: 'Kelola operasional harian' },
    { value: 'supervisor', label: 'Supervisor',  desc: 'Pengawas shift & laporan' },
    { value: 'kasir',      label: 'Kasir',       desc: 'Operator POS harian' },
    { value: 'gudang',     label: 'Gudang',      desc: 'Kelola stok & pembelian' },
    { value: 'kitchen',    label: 'Kitchen',     desc: 'Update status masak (FnB)' },
];

const inp = (err) =>
    `block w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${err ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-primary-400 focus:ring-primary-100'}`;

export default function UserForm({
    title, data, setData, errors, processing, onSubmit,
    cancelHref, isEdit = false, user, stores,
    storeRoles = [], // [{ store_id, role }] untuk edit
}) {
    const [storeSearch, setStoreSearch] = useState('');

    const filteredStores = (stores ?? []).filter(s =>
        !storeSearch ||
        s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(storeSearch.toLowerCase())
    );

    // Tambah/update store role assignment
    const setStoreRole = (storeId, role) => {
        const existing = [...(data.store_roles ?? [])];
        const idx = existing.findIndex(sr => sr.store_id === storeId);
        if (role === '') {
            // hapus dari list
            setData('store_roles', existing.filter(sr => sr.store_id !== storeId));
        } else if (idx >= 0) {
            existing[idx] = { store_id: storeId, role };
            setData('store_roles', existing);
        } else {
            setData('store_roles', [...existing, { store_id: storeId, role }]);
        }
    };

    const getStoreRole = (storeId) =>
        (data.store_roles ?? []).find(sr => sr.store_id === storeId)?.role ?? '';

    const selectedCount = (data.store_roles ?? []).length;

    return (
        <DeveloperLayout header={
            <div className="flex items-center gap-3">
                <Link href={cancelHref} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </Link>
                <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            </div>
        }>
            <div className="mx-auto max-w-2xl">
                <form onSubmit={onSubmit} className="space-y-5">

                    {/* Info dasar */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Informasi User</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Lengkap *</label>
                                <input value={data.name} onChange={e => setData('name', e.target.value)}
                                    className={inp(errors.name)} placeholder="Nama lengkap" />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className={inp(errors.email)} placeholder="user@email.com" />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Password {isEdit && <span className="text-xs font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
                                    {!isEdit && ' *'}
                                </label>
                                <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                                    className={inp(errors.password)} placeholder={isEdit ? '••••••••' : 'Min. 6 karakter'} />
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Konfirmasi Password</label>
                                <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                                    className={inp()} placeholder="Ulangi password" />
                            </div>
                        </div>
                    </section>

                    {/* Tipe akses */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Tipe Akses</h3>
                        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${data.is_developer ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input type="checkbox" checked={!!data.is_developer}
                                onChange={e => setData('is_developer', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded" />
                            <div>
                                <p className="font-semibold text-slate-800">⚡ Developer / Super Admin</p>
                                <p className="text-xs text-slate-500 mt-0.5">Akses penuh ke seluruh platform, tidak terikat toko manapun.</p>
                            </div>
                        </label>
                        {!data.is_developer && (
                            <p className="mt-2 text-xs text-slate-500">Tanpa akses developer, user hanya bisa masuk ke toko yang di-assign di bawah.</p>
                        )}
                    </section>

                    {/* Assign ke toko */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Assign ke Toko</h3>
                                {selectedCount > 0 && <p className="text-xs text-primary-600 mt-0.5">{selectedCount} toko dipilih</p>}
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-3">
                            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input value={storeSearch} onChange={e => setStoreSearch(e.target.value)}
                                placeholder="Cari toko..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100" />
                        </div>

                        {/* Store list */}
                        <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-100">
                            {filteredStores.length === 0 && (
                                <p className="py-8 text-center text-sm text-slate-400">Tidak ada toko.</p>
                            )}
                            {filteredStores.map(s => {
                                const tm = STORE_TYPE_INFO[s.store_type] ?? { icon: '🏬', label: s.store_type };
                                const currentRole = getStoreRole(s.id);
                                return (
                                    <div key={s.id} className={`flex items-center gap-3 px-4 py-3 transition ${currentRole ? 'bg-primary-50' : 'hover:bg-slate-50'}`}>
                                        <span className="text-lg">{tm.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                                            <p className="text-xs text-slate-400">{s.code} · {tm.label}</p>
                                        </div>
                                        <select value={currentRole} onChange={e => setStoreRole(s.id, e.target.value)}
                                            className={`rounded-lg border px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-200 ${currentRole ? 'border-primary-300 bg-white text-primary-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                                            <option value="">— Tidak assign —</option>
                                            {STORE_ROLES.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Role legend */}
                        <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                            {STORE_ROLES.map(r => (
                                <div key={r.value} className="text-xs text-slate-500">
                                    <span className="font-semibold text-slate-700">{r.label}:</span> {r.desc}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link href={cancelHref} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing}
                            className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-60">
                            {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat User'}
                        </button>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
