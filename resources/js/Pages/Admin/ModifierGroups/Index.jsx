import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/Components/ui/Button';
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const SELECTION_LABEL = {
    single: { label: 'Pilih 1', bg: 'bg-blue-100', text: 'text-blue-700' },
    multiple: { label: 'Pilih Banyak', bg: 'bg-violet-100', text: 'text-violet-700' },
};

export default function Index({ groups }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return groups;
        return groups.filter(
            (g) =>
                g.name.toLowerCase().includes(q) ||
                (g.description || '').toLowerCase().includes(q),
        );
    }, [groups, search]);

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route('admin.modifier-groups.destroy', target.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setTarget(null); },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">Grup Modifier</h2>
                    <Button as={Link} href={route('admin.modifier-groups.create')} icon={Plus}>
                        <span className="hidden sm:inline">Tambah Grup</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                </div>
            }
        >
            <Head title="Grup Modifier" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{flash.error}</div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
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
                            placeholder="Cari grup modifier..."
                            className="block w-full rounded-xl border-border pl-9 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Total <span className="font-semibold text-foreground">{filtered.length}</span> grup
                    </p>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search ? 'Grup tidak ditemukan' : 'Belum ada grup modifier'}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search ? 'Coba kata kunci lain.' : 'Buat grup modifier untuk menambahkan opsi kustomisasi pada produk (contoh: Topping, Level Pedas).'}
                        </p>
                        {!search && (
                            <Button as={Link} href={route('admin.modifier-groups.create')} icon={Plus} className="mt-5">
                                Tambah Grup Modifier
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
                                        <th className="px-5 py-3.5">Nama Grup</th>
                                        <th className="px-5 py-3.5 hidden lg:table-cell">Deskripsi</th>
                                        <th className="px-5 py-3.5 text-center">Tipe Pilihan</th>
                                        <th className="px-5 py-3.5 text-center">Wajib</th>
                                        <th className="px-5 py-3.5 text-center">Max Pilihan</th>
                                        <th className="px-5 py-3.5 text-center">Modifier</th>
                                        <th className="px-5 py-3.5 text-center">Status</th>
                                        <th className="px-5 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map((group) => {
                                        const sel = SELECTION_LABEL[group.selection_type] || SELECTION_LABEL.single;
                                        return (
                                            <tr key={group.id} className="transition hover:bg-muted/70">
                                                <td className="px-5 py-4">
                                                    <Link href={route('admin.modifier-groups.show', group.id)} className="font-medium text-primary-600 hover:text-primary-800 hover:underline">
                                                        {group.name}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">
                                                    {group.description || <span className="text-muted-foreground/50 italic text-xs">&mdash;</span>}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sel.bg} ${sel.text}`}>
                                                        {sel.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {group.is_required ? (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Wajib</span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Opsional</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center text-muted-foreground">
                                                    {group.max_selection ?? <span className="text-muted-foreground/50 italic text-xs">&mdash;</span>}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                                                        {group.modifiers_count} item
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${group.is_active ? 'bg-emerald-100 text-success' : 'bg-muted text-muted-foreground'}`}>
                                                        {group.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={route('admin.modifier-groups.edit', group.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600" title="Edit">
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                            </svg>
                                                        </Link>
                                                        <button onClick={() => setTarget(group)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" title="Hapus">
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y divide-border md:hidden">
                            {filtered.map((group) => {
                                const sel = SELECTION_LABEL[group.selection_type] || SELECTION_LABEL.single;
                                return (
                                    <div key={group.id} className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <Link href={route('admin.modifier-groups.show', group.id)} className="font-medium text-primary-600 hover:text-primary-800 hover:underline">
                                                    {group.name}
                                                </Link>
                                                {group.description && <p className="mt-0.5 text-xs text-muted-foreground truncate">{group.description}</p>}
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sel.bg} ${sel.text}`}>{sel.label}</span>
                                                    {group.is_required && <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Wajib</span>}
                                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">{group.modifiers_count} item</span>
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${group.is_active ? 'bg-emerald-100 text-success' : 'bg-muted text-muted-foreground'}`}>
                                                        {group.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-1">
                                            <Link href={route('admin.modifier-groups.show', group.id)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary-600 transition hover:bg-primary-50">
                                                Kelola
                                            </Link>
                                            <Link href={route('admin.modifier-groups.edit', group.id)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted">
                                                Edit
                                            </Link>
                                            <button onClick={() => setTarget(group)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10">
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus grup modifier?"
                description={target ? `Grup "${target.name}" beserta semua modifier di dalamnya akan dihapus permanen.` : ''}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
