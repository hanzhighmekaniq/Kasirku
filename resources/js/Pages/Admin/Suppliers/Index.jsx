import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Button from "@/Components/ui/Button";
import PageHeader from "@/Components/PageHeader";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

function SupplierAvatar({ name }) {
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

function CountBadge({ value, tone = "primary", label }) {
    const tones = {
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
    };

    return (
        <span
            className={`inline-flex min-w-[28px] items-center justify-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
        >
            {value ?? 0}
            {label && <span className="font-medium">{label}</span>}
        </span>
    );
}

function StatCard({ label, value, accent }) {
    return (
        <div
            className={`rounded-2xl border border-border bg-card p-4 shadow-sm border-l-4 ${accent}`}
        >
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
        </div>
    );
}

export default function Index({ suppliers, stats }) {
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

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                    label="Total Supplier"
                    value={stats.total}
                    accent="border-l-muted-foreground/30"
                />
                <StatCard
                    label="Total Produk"
                    value={stats.total_products}
                    accent="border-l-success"
                />
                <StatCard
                    label="Total Pembelian"
                    value={stats.total_purchases}
                    accent="border-l-primary"
                />
                <StatCard
                    label="Nilai Pembelian"
                    value={fmtCurrency(stats.total_purchase_value)}
                    accent="border-l-warning"
                />
            </div>

            {/* Main Content Area */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
                                className="block w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                    {/* Di mobile dipindah ke FAB kanan bawah */}
                    <Button
                        as={Link}
                        href={route("admin.suppliers.create")}
                        icon={Plus}
                        className="hidden sm:inline-flex sm:w-auto"
                    >
                        Tambah Supplier
                    </Button>
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
                        {!search && (
                            <Button
                                as={Link}
                                href={route("admin.suppliers.create")}
                                icon={Plus}
                                className="mt-5"
                            >
                                Tambah Supplier
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Supplier
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Kontak
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Telepon
                                        </th>
                                        <th className="px-6 py-3.5 text-center font-semibold">
                                            Produk
                                        </th>
                                        <th className="px-6 py-3.5 text-center font-semibold">
                                            Pembelian
                                        </th>
                                        <th className="px-6 py-3.5 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {filtered.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="transition hover:bg-[rgb(var(--color-table-hover))]"
                                        >
                                            <td className="px-6 py-3.5">
                                                <Link
                                                    href={route(
                                                        "admin.suppliers.show",
                                                        s.id,
                                                    )}
                                                    className="group flex items-center gap-3"
                                                >
                                                    <SupplierAvatar
                                                        name={s.name}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-foreground transition group-hover:text-primary">
                                                            {s.name}
                                                        </p>
                                                        <p className="font-mono text-xs text-muted-foreground">
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
                                                        className="transition hover:text-primary"
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
                                                <CountBadge
                                                    value={s.products_count}
                                                    tone="primary"
                                                />
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <CountBadge
                                                    value={s.purchases_count}
                                                    tone="success"
                                                />
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={route(
                                                            "admin.suppliers.show",
                                                            s.id,
                                                        )}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye
                                                            className="h-5 w-5"
                                                            strokeWidth={1.7}
                                                        />
                                                    </Link>
                                                    <Link
                                                        href={route(
                                                            "admin.suppliers.edit",
                                                            s.id,
                                                        )}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                                                        title="Edit"
                                                    >
                                                        <Pencil
                                                            className="h-5 w-5"
                                                            strokeWidth={1.7}
                                                        />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            setConfirmDelete(s)
                                                        }
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                        title="Hapus"
                                                    >
                                                        <Trash2
                                                            className="h-5 w-5"
                                                            strokeWidth={1.7}
                                                        />
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
                            {filtered.map((s) => (
                                <div key={s.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <SupplierAvatar name={s.name} />
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={route(
                                                    "admin.suppliers.show",
                                                    s.id,
                                                )}
                                                className="block truncate font-semibold text-foreground transition hover:text-primary"
                                            >
                                                {s.name}
                                            </Link>
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {s.code}
                                            </p>

                                            {s.contact_person && (
                                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                                    {s.contact_person}
                                                </p>
                                            )}
                                            {s.phone && (
                                                <a
                                                    href={`tel:${s.phone}`}
                                                    className="mt-0.5 block truncate text-sm text-primary"
                                                >
                                                    {s.phone}
                                                </a>
                                            )}

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <CountBadge
                                                    value={s.products_count}
                                                    tone="primary"
                                                    label="produk"
                                                />
                                                <CountBadge
                                                    value={s.purchases_count}
                                                    tone="success"
                                                    label="pembelian"
                                                />
                                            </div>

                                            {/* Aksi ikon 36px — sama seperti tabel desktop,
                                                diperbesar supaya nyaman disentuh. */}
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={route(
                                                        "admin.suppliers.show",
                                                        s.id,
                                                    )}
                                                    title="Lihat Detail"
                                                    aria-label="Lihat detail supplier"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Eye
                                                        className="h-4 w-4"
                                                        strokeWidth={1.7}
                                                    />
                                                </Link>
                                                <Link
                                                    href={route(
                                                        "admin.suppliers.edit",
                                                        s.id,
                                                    )}
                                                    title="Edit"
                                                    aria-label="Edit supplier"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-warning/40 hover:bg-warning/10 hover:text-warning"
                                                >
                                                    <Pencil
                                                        className="h-4 w-4"
                                                        strokeWidth={1.7}
                                                    />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setConfirmDelete(s)
                                                    }
                                                    title="Hapus"
                                                    aria-label="Hapus supplier"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2
                                                        className="h-4 w-4"
                                                        strokeWidth={1.7}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
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

            {/* FAB — mobile only. Disembunyikan saat modal terbuka supaya tidak
                menimpa panelnya. */}
            {!confirmDelete && (
                <Button
                    as={Link}
                    href={route("admin.suppliers.create")}
                    icon={Plus}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl sm:hidden"
                    title="Tambah Supplier"
                />
            )}
        </AuthenticatedLayout>
    );
}
