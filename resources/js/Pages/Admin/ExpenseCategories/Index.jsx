import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, FolderOpen } from 'lucide-react';
import Button from "@/Components/ui/Button";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import CategoryFormModal from './CategoryFormModal';

function formatRupiah(val) {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

export default function Index({ categories }) {
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Form modal state
    const [showForm, setShowForm] = useState(false);
    const [editCategory, setEditCategory] = useState(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.code || '').toLowerCase().includes(q),
        );
    }, [categories, search]);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route('admin.expense-categories.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const openCreate = () => {
        setEditCategory(null);
        setShowForm(true);
    };

    const openEdit = (cat) => {
        setEditCategory(cat);
        setShowForm(true);
    };

    return (
        <AuthenticatedLayout>
            <PageHeader
                title="Kategori Pengeluaran"
                breadcrumbs={["Admin", "Kategori Pengeluaran"]}
                heading={
                    <>
                        Kelola{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Kategori
                        </span>{" "}
                        Pengeluaran
                    </>
                }
                description="Kelola kategori pengeluaran dan lihat total pengeluaran per kategori."
                action={
                    <Button onClick={openCreate} icon={Plus}>
                        <span className="hidden sm:inline">Tambah Kategori</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                }
            />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            <Search className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kategori..."
                            className="block w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Total <span className="font-semibold text-foreground">{filtered.length}</span> kategori
                    </p>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <FolderOpen className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search ? 'Coba kata kunci lain.' : 'Buat kategori pengeluaran pertama untuk mengelola transaksi.'}
                        </p>
                        {!search && (
                            <Button onClick={openCreate} icon={Plus} className="mt-5">
                                Tambah Kategori
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
                                        <th className="px-6 py-3.5">Nama Kategori</th>
                                        <th className="px-6 py-3.5">Kode</th>
                                        <th className="px-6 py-3.5">Deskripsi</th>
                                        <th className="px-6 py-3.5 text-center">Jumlah Transaksi</th>
                                        <th className="px-6 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map((cat) => (
                                        <tr key={cat.id} className="transition hover:bg-muted/70">
                                            <td className="px-6 py-4 font-medium text-foreground">{cat.name}</td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">{cat.code}</td>
                                            <td className="max-w-[250px] truncate px-6 py-4 text-muted-foreground">{cat.description || '—'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                                                    {cat.expenses_count ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(cat)}
                                                        className="inline-flex h-9 w-9
 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" strokeWidth={1.7} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(cat)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" strokeWidth={1.7} />
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
                            {filtered.map((cat) => (
                                <div key={cat.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">{cat.name}</p>
                                            <p className="text-xs text-muted-foreground">{cat.code}</p>
                                            {cat.description && (
                                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <button
                                                onClick={() => openEdit(cat)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                            >
                                                <Pencil className="h-4 w-4" strokeWidth={1.7} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(cat)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                                            {cat.expenses_count ?? 0} transaksi
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Form Modal (Create + Edit) */}
            <CategoryFormModal
                open={showForm}
                category={editCategory}
                onClose={() => {
                    setShowForm(false);
                    setEditCategory(null);
                }}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                open={!!deleteTarget}
                title={`Hapus kategori "${deleteTarget?.name}"?`}
                description="Data pengeluaran yang sudah tercatat tidak akan terpengaruh."
                confirmLabel="Hapus Kategori"
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setDeleteTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
