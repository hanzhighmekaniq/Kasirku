import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function Index({ purchases, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = useMemo(() => {
        let list = [...purchases];
        const q = search.toLowerCase().trim();
        if (q) list = list.filter((p) =>
            p.purchase_no?.toLowerCase().includes(q) ||
            p.supplier?.name?.toLowerCase().includes(q)
        );
        if (filterStatus !== 'all') list = list.filter((p) => p.status === filterStatus);
        return list;
    }, [purchases, search, filterStatus]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setProcessing(true);
        router.delete(route('admin.purchases.destroy', deleteTarget.id), {
            onFinish: () => { setProcessing(false); setDeleteTarget(null); },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-800">Pembelian</h2>
                    <Link href={route('admin.purchases.create')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Tambah
                    </Link>
                </div>
            }
        >
            <Head title="Pembelian" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            {/* Summary cards */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label="Total" value={stats.total} color="slate" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0V6.75a2.25 2.25 0 00-2.25-2.25H5.25a2.25 2.25 0 00-2.25 2.25v.75" /></svg>} />
                <SummaryCard label="Draft" value={stats.draft} color="amber" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>} />
                <SummaryCard label="Selesai" value={stats.completed} color="emerald" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <SummaryCard label="Belum Bayar" value={stats.unpaid} color="rose" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            {/* Search + filter */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari no. faktur atau supplier..." className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
                    <option value="all">Semua Status</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                </select>
            </div>

            {/* Table (desktop) */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th className="px-5 py-3.5 font-medium text-slate-500">No. Faktur</th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">Supplier</th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">Tanggal</th>
                            <th className="px-5 py-3.5 text-right font-medium text-slate-500">Total</th>
                            <th className="px-5 py-3.5 text-right font-medium text-slate-500">Dibayar</th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">Status</th>
                            <th className="px-5 py-3.5 font-medium text-slate-500">Bayar</th>
                            <th className="px-5 py-3.5 text-right font-medium text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                                <svg className="mx-auto mb-2 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0V6.75a2.25 2.25 0 00-2.25-2.25H5.25a2.25 2.25 0 00-2.25 2.25v.75" /></svg>
                                Belum ada data pembelian
                            </td></tr>
                        ) : filtered.map((p) => (
                            <tr key={p.id} className="transition hover:bg-slate-50/50">
                                <td className="px-5 py-3.5 font-medium text-slate-800">{p.purchase_no}</td>
                                <td className="px-5 py-3.5 text-slate-600">{p.supplier?.name ?? '-'}</td>
                                <td className="px-5 py-3.5 text-slate-600">{new Date(p.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className="px-5 py-3.5 text-right font-medium text-slate-800">Rp {Number(p.grand_total).toLocaleString('id-ID')}</td>
                                <td className="px-5 py-3.5 text-right text-slate-600">Rp {Number(p.paid_amount).toLocaleString('id-ID')}</td>
                                <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                                <td className="px-5 py-3.5"><PaymentBadge status={p.payment_status} /></td>
                                <td className="px-5 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link href={route('admin.purchases.show', p.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            Detail
                                        </Link>
                                        {p.status === 'draft' && (
                                            <button onClick={() => setDeleteTarget(p)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Cards (mobile) */}
            <div className="space-y-3 lg:hidden">
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 shadow-sm">Belum ada data pembelian</div>
                ) : filtered.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{p.purchase_no}</p>
                                <p className="text-xs text-slate-500">{p.supplier?.name ?? '-'}</p>
                            </div>
                            <StatusBadge status={p.status} />
                        </div>
                        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-slate-400">Tanggal</span><p className="font-medium text-slate-700">{new Date(p.purchase_date).toLocaleDateString('id-ID')}</p></div>
                            <div><span className="text-slate-400">Total</span><p className="font-medium text-slate-700">Rp {Number(p.grand_total).toLocaleString('id-ID')}</p></div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('admin.purchases.show', p.id)} className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-50">Detail</Link>
                            {p.status === 'draft' && (
                                <button onClick={() => setDeleteTarget(p)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50">Hapus</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDeleteModal
                open={!!deleteTarget}
                title="Hapus Pembelian?"
                description={`Pembelian ${deleteTarget?.purchase_no} akan dihapus permanen. Stok yang sudah ditambahkan akan dikurangi kembali.`}
                confirmLabel="Hapus Pembelian"
                processing={processing}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, icon, color = 'slate' }) {
    const colors = { slate: 'bg-slate-50 text-slate-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600' };
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-400">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = { draft: 'bg-slate-100 text-slate-600', completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600' };
    const label = { draft: 'Draft', completed: 'Selesai', cancelled: 'Dibatalkan' };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{label[status] ?? status}</span>;
}

function PaymentBadge({ status }) {
    const map = { unpaid: 'bg-rose-100 text-rose-600', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700' };
    const label = { unpaid: 'Belum Bayar', partial: 'Sebagian', paid: 'Lunas' };
    return <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{label[status] ?? status}</span>;
}
