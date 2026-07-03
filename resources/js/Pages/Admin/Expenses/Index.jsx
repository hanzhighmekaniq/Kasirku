import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const STATUS_CONFIG = {
    draft: { label: 'Draft', className: 'bg-amber-100 text-amber-700' },
    posted: { label: 'Posted', className: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Dibatalkan', className: 'bg-slate-100 text-slate-500' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

function formatRupiah(val) {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Index({ expenses, branches = [], filters = {} }) {
    const [search, setSearch] = useState('');
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedBranchIds, setSelectedBranchIds] = useState(filters.branch_ids ?? []);

    // Sync selectedBranchIds when filters prop changes (e.g., on navigation)
    useEffect(() => {
        setSelectedBranchIds(filters.branch_ids ?? []);
    }, [filters.branch_ids]);

    const applyBranchFilter = (ids) => {
        router.get(route('admin.expenses.index'), { branch_ids: ids }, { preserveScroll: true });
    };

    const toggleBranch = (branchId) => {
        const next = selectedBranchIds.includes(branchId)
            ? selectedBranchIds.filter((id) => id !== branchId)
            : [...selectedBranchIds, branchId];
        setSelectedBranchIds(next);
        applyBranchFilter(next);
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return expenses;
        return expenses.filter(
            (e) =>
                e.expense_no.toLowerCase().includes(q) ||
                (e.notes || '').toLowerCase().includes(q) ||
                (e.expense_category?.name || '').toLowerCase().includes(q),
        );
    }, [expenses, search]);

    const stats = useMemo(() => {
        const total = expenses.length;
        const totalAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
        const postedCount = expenses.filter((e) => e.status === 'posted').length;
        const draftCount = expenses.filter((e) => e.status === 'draft').length;
        return { total, totalAmount, postedCount, draftCount };
    }, [expenses]);

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route('admin.expenses.destroy', target.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setTarget(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">Pengeluaran</h2>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('admin.expense-categories.index')}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Kategori
                        </Link>
                        <Link
                            href={route('admin.expenses.create')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span className="hidden sm:inline">Catat Pengeluaran</span>
                            <span className="sm:hidden">Tambah</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Pengeluaran" />

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Total Transaksi</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Total Pengeluaran</p>
                    <p className="mt-1 text-2xl font-bold text-rose-600">{formatRupiah(stats.totalAmount)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Posted</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.postedCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">Draft</p>
                    <p className="mt-1 text-2xl font-bold text-amber-600">{stats.draftCount}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:flex-wrap">
                    {/* Branch checkboxes */}
                    {branches.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">Cabang:</span>
                            {branches.map((b) => (
                                <label
                                    key={b.id}
                                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition select-none ${
                                        selectedBranchIds.includes(b.id)
                                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedBranchIds.includes(b.id)}
                                        onChange={() => toggleBranch(b.id)}
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {b.name}
                                </label>
                            ))}
                        </div>
                    )}
                    <div className="relative w-full sm:max-w-xs sm:ml-auto">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari pengeluaran..."
                            className="block w-full rounded-xl border-slate-300 pl-9 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    {selectedBranchIds.length > 0 && (
                        <p className="text-xs text-slate-400">
                            Menampilkan {selectedBranchIds.length} cabang
                        </p>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {search ? 'Pengeluaran tidak ditemukan' : 'Belum ada pengeluaran'}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {search ? 'Coba kata kunci lain.' : 'Catat pengeluaran pertama untuk melacak arus kas.'}
                        </p>
                        {!search && (
                            <Link
                                href={route('admin.expenses.create')}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Catat Pengeluaran
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <th className="px-6 py-3.5">No. Pengeluaran</th>
                                        <th className="px-6 py-3.5">Tanggal</th>
                                        <th className="px-6 py-3.5">Cabang</th>
                                        <th className="px-6 py-3.5">Kategori</th>
                                        <th className="px-6 py-3.5 text-right">Jumlah</th>
                                        <th className="px-6 py-3.5 text-center">Status</th>
                                        <th className="px-6 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((exp) => (
                                        <tr key={exp.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-sm font-bold text-indigo-600">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-slate-800">{exp.expense_no}</p>
                                                        {exp.notes && (
                                                            <p className="max-w-[200px] truncate text-xs text-slate-400">{exp.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{formatDate(exp.expense_date)}</td>
                                            <td className="px-6 py-4 text-slate-500">{exp.branch?.name || '—'}</td>
                                            <td className="px-6 py-4 text-slate-500">{exp.expense_category?.name || '—'}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-rose-600">{formatRupiah(exp.amount)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={exp.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('admin.expenses.show', exp.id)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                        title="Lihat Detail"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </Link>
                                                    {exp.status === 'draft' && (
                                                        <button
                                                            onClick={() => setTarget(exp)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-slate-100 md:hidden">
                            {filtered.map((exp) => (
                                <Link
                                    key={exp.id}
                                    href={route('admin.expenses.show', exp.id)}
                                    className="block p-4 transition hover:bg-slate-50/70"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-sm font-bold text-indigo-600">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-800">{exp.expense_no}</p>
                                                <p className="text-xs text-slate-400">{formatDate(exp.expense_date)}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={exp.status} />
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                                        <span>{exp.branch?.name || '—'}</span>
                                        <span className="text-slate-300">·</span>
                                        <span>{exp.expense_category?.name || 'Tanpa kategori'}</span>
                                        <span className="ml-auto font-semibold text-rose-600">{formatRupiah(exp.amount)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus pengeluaran?"
                description={target ? `Pengeluaran "${target.expense_no}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.` : ''}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
