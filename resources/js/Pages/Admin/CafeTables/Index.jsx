import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/Components/ui/Button';
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const STATUS_LABELS = {
    available: 'Tersedia',
    occupied: 'Terisi',
    reserved: 'Direservasi',
};

const STATUS_COLORS = {
    available: 'bg-emerald-100 text-success',
    occupied: 'bg-red-100 text-destructive',
    reserved: 'bg-amber-100 text-amber-700',
};

export default function Index({ cafeTables, branches }) {
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filtered = useMemo(() => {
        let result = cafeTables;
        const q = search.trim().toLowerCase();
        if (q) {
            result = result.filter(
                (t) =>
                    t.table_number.toLowerCase().includes(q) ||
                    (t.branch?.name || '').toLowerCase().includes(q),
            );
        }
        if (branchFilter) {
            result = result.filter((t) => String(t.branch_id) === branchFilter);
        }
        if (statusFilter) {
            result = result.filter((t) => t.status === statusFilter);
        }
        return result;
    }, [cafeTables, search, branchFilter, statusFilter]);

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route('admin.cafe-tables.destroy', target.id), {
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
                    <h2 className="text-lg font-semibold text-foreground">Meja Cafe</h2>
                    <Button as={Link} href={route('admin.cafe-tables.create')} icon={Plus}>
                        <span className="hidden sm:inline">Tambah Meja</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                </div>
            }
        >
            <Head title="Meja Cafe" />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                        <div className="relative w-full sm:max-w-xs">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari meja..."
                                className="block w-full rounded-xl border-border pl-9 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="rounded-xl border border-border px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        >
                            <option value="">Semua Cabang</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-border px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        >
                            <option value="">Semua Status</option>
                            <option value="available">Tersedia</option>
                            <option value="occupied">Terisi</option>
                            <option value="reserved">Direservasi</option>
                        </select>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Total <span className="font-semibold text-foreground">{filtered.length}</span> meja
                    </p>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 21V8.25A2.25 2.25 0 016.75 6h10.5a2.25 2.25 0 012.25 2.25V21M8.25 21v-5.25A1.5 1.5 0 019.75 14.25h4.5a1.5 1.5 0 011.5 1.5V21M8.25 10.5h.008v.008H8.25V10.5zm3.75 0h.008v.008H12V10.5zm3.75 0h.008v.008h-.008V10.5zM8.25 3h7.5" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search || branchFilter || statusFilter ? 'Meja tidak ditemukan' : 'Belum ada meja'}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search || branchFilter || statusFilter ? 'Coba kata kunci atau filter lain.' : 'Tambahkan meja pertama untuk cafe.'}
                        </p>
                        {!search && !branchFilter && !statusFilter && (
                            <Button as={Link} href={route('admin.cafe-tables.create')} icon={Plus} className="mt-5">
                                Tambah Meja
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        <th className="px-6 py-3.5">Nomor Meja</th>
                                        <th className="px-6 py-3.5">Cabang</th>
                                        <th className="px-6 py-3.5 text-center">Kapasitas</th>
                                        <th className="px-6 py-3.5 text-center">Status</th>
                                        <th className="px-6 py-3.5 text-center">Aktif</th>
                                        <th className="px-6 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map((t) => (
                                        <tr key={t.id} className="transition hover:bg-muted/70">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-500/10 text-sm font-bold text-primary-600">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 21V8.25A2.25 2.25 0 016.75 6h10.5a2.25 2.25 0 012.25 2.25V21M8.25 21v-5.25A1.5 1.5 0 019.75 14.25h4.5a1.5 1.5 0 011.5 1.5V21M8.25 10.5h.008v.008H8.25V10.5zm3.75 0h.008v.008H12V10.5zm3.75 0h.008v.008h-.008V10.5zM8.25 3h7.5" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-medium text-foreground">{t.table_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{t.branch?.name || '—'}</td>
                                            <td className="px-6 py-4 text-center font-medium text-foreground">{t.capacity} orang</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-muted text-muted-foreground'}`}>
                                                    {STATUS_LABELS[t.status] || t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {t.is_active ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-success">Aktif</span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Nonaktif</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route('admin.cafe-tables.edit', t.id)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                                        title="Edit"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => setTarget(t)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                        title="Hapus"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-border md:hidden">
                            {filtered.map((t) => (
                                <div key={t.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-500/10 text-sm font-bold text-primary-600">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 21V8.25A2.25 2.25 0 016.75 6h10.5a2.25 2.25 0 012.25 2.25V21M8.25 21v-5.25A1.5 1.5 0 019.75 14.25h4.5a1.5 1.5 0 011.5 1.5V21M8.25 10.5h.008v.008H8.25V10.5zm3.75 0h.008v.008H12V10.5zm3.75 0h.008v.008h-.008V10.5zM8.25 3h7.5" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-foreground">{t.table_number}</p>
                                                <p className="text-xs text-muted-foreground">{t.branch?.name || '—'}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-muted text-muted-foreground'}`}>
                                            {STATUS_LABELS[t.status] || t.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>Kapasitas: <span className="font-medium text-foreground">{t.capacity} orang</span></span>
                                        {t.is_active ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-success">Aktif</span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Nonaktif</span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center justify-end gap-1">
                                        <Link
                                            href={route('admin.cafe-tables.edit', t.id)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={() => setTarget(t)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus meja?"
                description={target ? `Meja "${target.table_number}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.` : ''}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
