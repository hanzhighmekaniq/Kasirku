import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Building2, ChevronLeft, CircleParking, Coffee, KeyRound, Monitor, Scissors, Search, Shirt, Store, Zap } from 'lucide-react';

const STORE_TYPE_INFO = {
    retail:  { Icon: Store,         label: 'Retail' },
    fnb:     { Icon: Coffee,        label: 'FnB' },
    service: { Icon: Scissors,      label: 'Service' },
    laundry: { Icon: Shirt,         label: 'Laundry' },
    rental:  { Icon: KeyRound,      label: 'Rental' },
    parking: { Icon: CircleParking, label: 'Parkir' },
    session: { Icon: Monitor,       label: 'Sesi' },
};

const inp = (err) =>
    `block w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${err ? 'border-destructive focus:ring-destructive/20' : 'border-input focus:border-ring focus:ring-ring/20'}`;

export default function UserForm({
    title, data, setData, errors, processing, onSubmit,
    cancelHref, isEdit = false, user, stores,
    storeRoles = [], // [{ store_id, role }] untuk edit
    rolesByStoreType = {}, // { retail: [{value,label,desc}], fnb: [...] }
}) {
    const [storeSearch, setStoreSearch] = useState('');

    // Role dibaca per tipe toko: toko retail tidak boleh menawarkan role yang
    // hanya ada di FnB (mis. kitchen) — rolenya memang tidak dibuat di sana,
    // dan assign-nya akan ditolak server.
    const rolesFor = (storeType) => rolesByStoreType[storeType] ?? [];

    const filteredStores = (stores ?? []).filter(s =>
        !storeSearch ||
        s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(storeSearch.toLowerCase())
    );

    // Legend menjelaskan seluruh role yang mungkin muncul di daftar toko
    // sekarang, bukan seluruh role yang ada di sistem.
    const legendRoles = Object.values(
        filteredStores.reduce((acc, s) => {
            rolesFor(s.store_type).forEach(r => { acc[r.value] = r; });
            return acc;
        }, {}),
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
                <Link href={cancelHref} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
                </Link>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>
        }>
            <div className="mx-auto max-w-2xl">
                <form onSubmit={onSubmit} className="space-y-5">

                    {/* Info dasar */}
                    <section className="rounded-2xl border border-border bg-card text-card-foreground p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Informasi User</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">Nama Lengkap *</label>
                                <input value={data.name} onChange={e => setData('name', e.target.value)}
                                    className={inp(errors.name)} placeholder="Nama lengkap" />
                                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">Email *</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className={inp(errors.email)} placeholder="user@email.com" />
                                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Password {isEdit && <span className="text-xs font-normal text-muted-foreground">(kosongkan jika tidak diubah)</span>}
                                    {!isEdit && ' *'}
                                </label>
                                <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                                    className={inp(errors.password)} placeholder={isEdit ? '••••••••' : 'Min. 6 karakter'} />
                                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">Konfirmasi Password</label>
                                <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                                    className={inp()} placeholder="Ulangi password" />
                            </div>
                        </div>
                    </section>

                    {/* Tipe akses */}
                    <section className="rounded-2xl border border-border bg-card text-card-foreground p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tipe Akses</h3>
                        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${data.is_developer ? 'border-primary bg-primary/10' : 'border-border hover:border-border'}`}>
                            <input type="checkbox" checked={!!data.is_developer}
                                onChange={e => setData('is_developer', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded" />
                            <div>
                                <p className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <Zap className="h-4 w-4 text-primary" strokeWidth={2} />
                                    Developer / Super Admin
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">Akses penuh ke seluruh platform, tidak terikat toko manapun.</p>
                            </div>
                        </label>
                        {!data.is_developer && (
                            <p className="mt-2 text-xs text-muted-foreground">Tanpa akses developer, user hanya bisa masuk ke toko yang di-assign di bawah.</p>
                        )}
                    </section>

                    {/* Assign ke toko */}
                    <section className="rounded-2xl border border-border bg-card text-card-foreground p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Assign ke Toko</h3>
                                {selectedCount > 0 && <p className="text-xs text-primary mt-0.5">{selectedCount} toko dipilih</p>}
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-3">
                            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input value={storeSearch} onChange={e => setStoreSearch(e.target.value)}
                                placeholder="Cari toko..."
                                className="w-full rounded-xl border border-border bg-muted py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
                        </div>

                        {/* Store list */}
                        <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border">
                            {filteredStores.length === 0 && (
                                <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada toko.</p>
                            )}
                            {filteredStores.map(s => {
                                const tm = STORE_TYPE_INFO[s.store_type] ?? { Icon: Building2, label: s.store_type };
                                const TypeIcon = tm.Icon;
                                const currentRole = getStoreRole(s.id);
                                const storeRoleOptions = rolesFor(s.store_type);
                                return (
                                    <div key={s.id} className={`flex items-center gap-3 px-4 py-3 transition ${currentRole ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                                        <TypeIcon className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                                            <p className="text-xs text-muted-foreground">{s.code} · {tm.label}</p>
                                        </div>
                                        {storeRoleOptions.length === 0 ? (
                                            <span className="shrink-0 text-xs text-muted-foreground" title="Belum ada template role untuk tipe toko ini">
                                                Tidak ada role
                                            </span>
                                        ) : (
                                            <select value={currentRole} onChange={e => setStoreRole(s.id, e.target.value)}
                                                className={`rounded-lg border px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring/20 ${currentRole ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                                                <option value="">— Tidak assign —</option>
                                                {storeRoleOptions.map(r => (
                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                ))}
                                                {/* Role tersimpan yang sudah di luar cakupan tetap
                                                    ditampilkan supaya nilainya tidak hilang diam-diam */}
                                                {currentRole && !storeRoleOptions.some(r => r.value === currentRole) && (
                                                    <option value={currentRole}>{currentRole} (di luar cakupan)</option>
                                                )}
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Role legend */}
                        {legendRoles.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-muted p-3">
                                {legendRoles.map(r => (
                                    <div key={r.value} className="text-xs text-muted-foreground">
                                        <span className="font-semibold text-foreground">{r.label}:</span> {r.desc}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link href={cancelHref} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing}
                            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60">
                            {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat User'}
                        </button>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
