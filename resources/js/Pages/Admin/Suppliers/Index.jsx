import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import Button from "@/Components/ui/Button";
import PageHeader from "@/Components/PageHeader";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function Index({ suppliers, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = suppliers.filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            s.name.toLowerCase().includes(q) ||
            (s.code ?? "").toLowerCase().includes(q) ||
            (s.phone ?? "").includes(q) ||
            (s.email ?? "").toLowerCase().includes(q) ||
            (s.contact_person ?? "").toLowerCase().includes(q)
        );
    });

    const handleDelete = () => {
        if (!confirmDelete) return;
        setProcessing(true);
        router.delete(route("admin.suppliers.destroy", confirmDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setConfirmDelete(null);
            },
        });
    };

    const fmtCurrency = (v) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(v || 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Supplier
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }
        >
            <Head title="Supplier" />
            <PageHeader
                title="Supplier"
                breadcrumbs={["Admin", "Supplier"]}
                heading={
                    <>
                        Kelola{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Supplier
                        </span>{" "}
                        toko
                    </>
                }
                description="Manajemen data pemasok barang dan riwayat pembelian."
            />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}
            {flash?.errors && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {typeof flash.errors === "object"
                        ? Object.values(flash.errors).flat().join(". ")
                        : flash.errors}
                </div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground/30 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                        Total Supplier
                    </p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {stats.total}
                    </p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-emerald-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                        Total Produk
                    </p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {stats.total_products}
                    </p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-blue-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                        Total Pembelian
                    </p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {stats.total_purchases}
                    </p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-amber-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                        Nilai Pembelian
                    </p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {fmtCurrency(stats.total_purchase_value)}
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-4 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-col">
                        <div className="relative w-full sm:max-w-md">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                <Search className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, kode, telepon, email..."
                                className="block w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm shadow-sm transition outline-none focus:border-ring focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">
                                {filtered.length}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-foreground">
                                {suppliers.length}
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center self-start sm:self-auto">
                        <Button
                            as={Link}
                            href={route("admin.suppliers.create")}
                            icon={Plus}
                        >
                            Tambah Supplier
                        </Button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <svg
                                className="h-8 w-8 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search
                                ? "Supplier tidak ditemukan"
                                : "Belum ada supplier"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search
                                ? "Coba kata kunci lain."
                                : "Mulai dengan menambahkan supplier pertama."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-6 py-3.5 font-medium text-muted-foreground">
                                        Supplier
                                    </th>
                                    <th className="px-6 py-3.5 font-medium text-muted-foreground">
                                        Kontak
                                    </th>
                                    <th className="px-6 py-3.5 font-medium text-muted-foreground">
                                        Telepon
                                    </th>
                                    <th className="px-6 py-3.5 text-center font-medium text-muted-foreground">
                                        Produk
                                    </th>
                                    <th className="px-6 py-3.5 text-center font-medium text-muted-foreground">
                                        Pembelian
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-medium text-muted-foreground">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="transition hover:bg-muted/50"
                                    >
                                        <td className="px-6 py-3.5">
                                            <Link
                                                href={route(
                                                    "admin.suppliers.show",
                                                    s.id,
                                                )}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-xs font-bold text-white shadow-sm">
                                                    {s.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground hover:text-primary-600 transition">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {s.code}
                                                    </p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3.5 text-muted-foreground">
                                            {s.contact_person || (
                                                <span className="text-muted-foreground/50">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-muted-foreground">
                                            {s.phone ? (
                                                <a
                                                    href={`tel:${s.phone}`}
                                                    className="hover:text-primary-600 transition"
                                                >
                                                    {s.phone}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground/50">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className="inline-flex min-w-[28px] justify-center rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                                {s.products_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className="inline-flex min-w-[28px] justify-center rounded-lg bg-success/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                                {s.purchases_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={route(
                                                        "admin.suppliers.show",
                                                        s.id,
                                                    )}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-muted-foreground"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-5 w-5" strokeWidth={1.8} />
                                                </Link>
                                                <Link
                                                    href={route(
                                                        "admin.suppliers.edit",
                                                        s.id,
                                                    )}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                                    title="Edit"
                                                >
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.7}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                                        />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        setConfirmDelete(s)
                                                    }
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10"
                                                    title="Hapus"
                                                >
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.7}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Confirm delete modal */}
            <ConfirmDeleteModal
                open={!!confirmDelete}
                title="Hapus Supplier?"
                description={
                    confirmDelete
                        ? `Supplier "${confirmDelete.name}" beserta riwayatnya akan dihapus permanen.`
                        : "Tindakan ini tidak dapat dibatalkan."
                }
                confirmLabel="Hapus"
                processing={processing}
                onConfirm={handleDelete}
                onClose={() => {
                    if (!processing) setConfirmDelete(null);
                }}
            />
        </AuthenticatedLayout>
    );
}
