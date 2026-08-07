import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, router, useForm } from "@inertiajs/react";
import { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import Button from "@/Components/ui/Button";
import Modal from "@/Components/Modal";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const FIELD_TYPES = [
    { value: "text", label: "Teks" },
    { value: "number", label: "Angka" },
    { value: "date", label: "Tanggal" },
    { value: "select", label: "Pilihan" },
    { value: "textarea", label: "Teks Panjang" },
];

export default function Index({ fields: initialFields, entityType }) {
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [tab, setTab] = useState(entityType || "product");

    const { data, setData, post, put, processing, errors, reset } = useForm({
        entity_type: tab,
        field_name: "",
        field_label: "",
        field_type: "text",
        options: "",
        is_required: false,
        sort_order: 0,
    });

    const filtered = useMemo(() => {
        if (!search) return initialFields;
        const q = search.toLowerCase();
        return initialFields.filter(
            (f) =>
                f.field_name?.toLowerCase().includes(q) ||
                f.field_label?.toLowerCase().includes(q),
        );
    }, [initialFields, search]);

    const openCreate = () => {
        reset();
        setData("entity_type", tab);
        setShowCreate(true);
    };

    const openEdit = (field) => {
        setEditTarget(field);
        setData({
            entity_type: field.entity_type,
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type,
            options: field.options ? field.options.join(", ") : "",
            is_required: field.is_required,
            sort_order: field.sort_order,
        });
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route("admin.custom-fields.store"), {
            onSuccess: () => {
                setShowCreate(false);
                reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        put(route("admin.custom-fields.update", editTarget.id), {
            onSuccess: () => {
                setEditTarget(null);
                reset();
            },
        });
    };

    const confirmDelete = () => {
        setDeleting(true);
        router.delete(route("admin.custom-fields.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const switchTab = (newTab) => {
        setTab(newTab);
        router.get(route("admin.custom-fields.index"), { entity_type: newTab }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Field Kustom
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Pengaturan
                    </div>
                </div>
            }
        >
            <PageHeader
                title="Field Kustom"
                breadcrumbs={["Admin", "Pengaturan", "Field Kustom"]}
                heading={
                    <>
                        Field{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Kustom
                        </span>
                    </>
                }
                description="Tambah kolom tambahan untuk produk atau pelanggan."
                actions={<Button onClick={openCreate} icon={Plus}>Tambah Field</Button>}
            />

            <div className="space-y-6 px-4 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => switchTab("product")}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            tab === "product"
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        Produk
                    </button>
                    <button
                        onClick={() => switchTab("customer")}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            tab === "customer"
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        Pelanggan
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari field..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 text-left font-semibold">Nama Field</th>
                                    <th className="px-5 py-3.5 text-left font-semibold">Label</th>
                                    <th className="px-5 py-3.5 text-left font-semibold">Tipe</th>
                                    <th className="px-5 py-3.5 text-center font-semibold">Wajib</th>
                                    <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">
                                            Belum ada field kustom. Klik "Tambah Field" untuk membuat.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((field) => (
                                        <tr key={field.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-card-foreground">
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{field.field_name}</code>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-card-foreground">{field.field_label}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                                                {FIELD_TYPES.find((t) => t.value === field.field_type)?.label || field.field_type}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {field.is_required ? (
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        Ya
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(field)}
                                                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(field)}
                                                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile */}
                    <div className="space-y-3 p-3 md:hidden">
                        {filtered.length === 0 ? (
                            <div className="py-16 text-center text-sm text-muted-foreground">
                                Belum ada field kustom.
                            </div>
                        ) : (
                            filtered.map((field) => (
                                <div key={field.id} className="rounded-xl border border-border bg-background p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-card-foreground">{field.field_label}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(field)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => setDeleteTarget(field)} className="rounded p-1 text-muted-foreground hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        <code className="rounded bg-muted px-1 py-0.5">{field.field_name}</code>
                                        {" "}&middot;{" "}
                                        {FIELD_TYPES.find((t) => t.value === field.field_type)?.label}
                                        {field.is_required && " &middot; Wajib"}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <Modal show={showCreate} onClose={() => setShowCreate(false)}>
                <form onSubmit={submitCreate} className="p-6">
                    <h2 className="text-lg font-semibold text-card-foreground">Tambah Field Kustom</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Tambah kolom baru untuk {tab === "product" ? "produk" : "pelanggan"}.
                    </p>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Nama Field (snake_case)</label>
                            <input
                                type="text"
                                value={data.field_name}
                                onChange={(e) => setData("field_name", e.target.value)}
                                placeholder="contoh: warna_produk"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                            {errors.field_name && <p className="mt-1 text-xs text-red-500">{errors.field_name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Label Tampilan</label>
                            <input
                                type="text"
                                value={data.field_label}
                                onChange={(e) => setData("field_label", e.target.value)}
                                placeholder="contoh: Warna Produk"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                            {errors.field_label && <p className="mt-1 text-xs text-red-500">{errors.field_label}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Tipe Field</label>
                            <select
                                value={data.field_type}
                                onChange={(e) => setData("field_type", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                {FIELD_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {data.field_type === "select" && (
                            <div>
                                <label className="block text-sm font-medium text-card-foreground">Opsi (pisahkan koma)</label>
                                <input
                                    type="text"
                                    value={data.options}
                                    onChange={(e) => setData("options", e.target.value)}
                                    placeholder="Merah, Biru, Hijau"
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        )}

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_required}
                                onChange={(e) => setData("is_required", e.target.checked)}
                                className="rounded border-border"
                            />
                            <span className="text-sm text-card-foreground">Wajib diisi</span>
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); reset(); }}>Batal</Button>
                        <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal show={!!editTarget} onClose={() => { setEditTarget(null); reset(); }}>
                <form onSubmit={submitEdit} className="p-6">
                    <h2 className="text-lg font-semibold text-card-foreground">Edit Field Kustom</h2>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Nama Field</label>
                            <input
                                type="text"
                                value={data.field_name}
                                disabled
                                className="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Label Tampilan</label>
                            <input
                                type="text"
                                value={data.field_label}
                                onChange={(e) => setData("field_label", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Tipe Field</label>
                            <select
                                value={data.field_type}
                                onChange={(e) => setData("field_type", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                {FIELD_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {data.field_type === "select" && (
                            <div>
                                <label className="block text-sm font-medium text-card-foreground">Opsi (pisahkan koma)</label>
                                <input
                                    type="text"
                                    value={data.options}
                                    onChange={(e) => setData("options", e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        )}

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.is_required}
                                onChange={(e) => setData("is_required", e.target.checked)}
                                className="rounded border-border"
                            />
                            <span className="text-sm text-card-foreground">Wajib diisi</span>
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => { setEditTarget(null); reset(); }}>Batal</Button>
                        <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Perbarui"}</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <ConfirmDeleteModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                processing={deleting}
                title={`Hapus field "${deleteTarget?.field_label}"?`}
                description="Field yang dihapus tidak bisa dikembalikan. Data yang sudah tersimpan di field ini akan tetap ada tapi tidak bisa diedit lagi."
            />
        </AuthenticatedLayout>
    );
}
