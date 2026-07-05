import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const STORE_TYPE = {
    retail:      { label: 'Retail',        icon: '🏪', cls: 'bg-blue-50 text-blue-700' },
    fnb:         { label: 'FnB / Cafe',    icon: '☕', cls: 'bg-orange-50 text-orange-700' },
    service:     { label: 'Service',       icon: '✂️', cls: 'bg-violet-50 text-violet-700' },
    rental:      { label: 'Rental',        icon: '🔑', cls: 'bg-yellow-50 text-yellow-700' },
    ticket:      { label: 'Tiket',         icon: '🎟️', cls: 'bg-rose-50 text-rose-700' },
    hospitality: { label: 'Hospitality',   icon: '🏨', cls: 'bg-amber-50 text-amber-700' },
    laundry: { label: 'Service', icon: '👕', cls: 'bg-violet-50 text-violet-700' },
    parking: { label: 'Parkir',  icon: '🅿️', cls: 'bg-slate-50 text-slate-700' },
    session: { label: 'Rental',  icon: '🖥️', cls: 'bg-yellow-50 text-yellow-700' },
};

export default function AllIndex({ branches, stores }) {
    const [search, setSearch] = useState('');
    const [filterStore, setFilterStore] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchDetail, setBranchDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    const filtered = branches.filter(b => {
        const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.code.toLowerCase().includes(search.toLowerCase());
        const matchStore = !filterStore || b.store_id == filterStore;
        return matchSearch && matchStore;
    });

    const openDetail = async (branch) => {
        setSelectedBranch(branch);
        setLoading(true);
        setShowModal(true);
        try {
            const res = await axios.get(`/developer/branches/${branch.id}`);
            setBranchDetail(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Semua Cabang</h2>
                    <Link href={route('developer.dashboard')}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        ← Kembali
                    </Link>
                </div>
            }
        >
            <Head title="Semua Cabang" />

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative max-w-sm">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari cabang..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
                </div>
                <select value={filterStore} onChange={e => setFilterStore(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option value="">Semua Toko</option>
                    {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <span className="text-5xl mb-4">🏢</span>
                        <p className="text-base font-semibold text-slate-800">Tidak ada cabang</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5">Cabang</th>
                                    <th className="px-5 py-3.5">Toko</th>
                                    <th className="px-5 py-3.5 text-center">User</th>
                                    <th className="px-5 py-3.5 text-center">Penjualan</th>
                                    <th className="px-5 py-3.5 text-center">Pembelian</th>
                                    <th className="px-5 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(b => {
                                    const tm = STORE_TYPE[b.store?.store_type] ?? { label: b.store?.store_type, icon: '🏬', cls: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <tr key={b.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">{b.code?.charAt(0) || '?'}</span>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{b.name}</p>
                                                        <p className="text-xs font-mono text-slate-400">{b.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {b.store ? (
                                                    <div>
                                                        <p className="text-slate-800">{b.store.name}</p>
                                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tm.cls}`}>{tm.label}</span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-5 py-4 text-center text-slate-600">{b.employees_count ?? 0}</td>
                                            <td className="px-5 py-4 text-center text-slate-600">{b.sales_count ?? 0}</td>
                                            <td className="px-5 py-4 text-center text-slate-600">{b.purchases_count ?? 0}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {b.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openDetail(b)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600" title="Lihat Detail">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-slate-200 px-6 py-4 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900">Detail Cabang</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Memuat...</div>
                        ) : branchDetail ? (
                            <div className="p-6">
                                {/* Branch Info */}
                                <div className="mb-6 rounded-xl bg-slate-50 p-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-400">Kode</span>
                                            <p className="font-semibold text-slate-800">{branchDetail.branch.code}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Nama</span>
                                            <p className="font-semibold text-slate-800">{branchDetail.branch.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Toko</span>
                                            <p className="font-semibold text-slate-800">{branchDetail.branch.store?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Tipe Toko</span>
                                            <p className="font-semibold text-slate-800 capitalize">{branchDetail.branch.store?.store_type || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Telepon</span>
                                            <p className="font-semibold text-slate-800">{branchDetail.branch.phone || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Status</span>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${branchDetail.branch.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {branchDetail.branch.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-slate-400">Alamat</span>
                                            <p className="font-semibold text-slate-800">{branchDetail.branch.address || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Employees/Users List */}
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                                        Karyawan & User Terhubung ({branchDetail.employees?.length || 0})
                                    </h3>

                                    {branchDetail.employees?.length > 0 ? (
                                        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                                            <table className="min-w-full divide-y divide-slate-100">
                                                <thead className="bg-slate-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Nama Karyawan</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Posisi</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Akun User</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {branchDetail.employees.map(emp => (
                                                        <tr key={emp.id}>
                                                            <td className="px-4 py-2 text-sm text-slate-800">{emp.name}</td>
                                                            <td className="px-4 py-2 text-sm text-slate-600">{emp.position || '-'}</td>
                                                            <td className="px-4 py-2 text-sm">
                                                                {emp.user ? (
                                                                    <div>
                                                                        <span className="font-medium text-slate-800">{emp.user.name}</span>
                                                                        <br />
                                                                        <span className="text-xs text-slate-400">{emp.user.email}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400">Belum ada akun</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {emp.is_active ? 'Aktif' : 'Nonaktif'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                                            Belum ada karyawan di cabang ini
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </DeveloperLayout>
    );
}
