import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/Components/ui/Button";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const TIER_STYLES = {
    bronze: "bg-amber-100 text-amber-700",
    silver: "bg-muted text-muted-foreground",
    gold: "bg-yellow-100 text-yellow-700",
};

export default function Index({ customers, storeType = "retail" }) {
    const [search, setSearch] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Poin & Tier hanya relevan untuk retail, fnb, service (membership/loyalty)
    const showLoyalty = ["retail", "fnb", "service", "hospitality"].includes(
        storeType,
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.phone || "").toLowerCase().includes(q) ||
                (c.email || "").toLowerCase().includes(q) ||
                (c.code || "").toLowerCase().includes(q),
        );
    }, [customers, search]);

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.customers.destroy", target.id), {
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
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Pelanggan
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <PageHeader
                title="Pelanggan"
                breadcrumbs={["Admin", "Pelanggan"]}
                heading={
                    <>
                        Kelola Data{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pelanggan
                        </span>
                    </>
                }
                description="Manajemen data pelanggan, riwayat transaksi, dan poin loyalitas."
                action={
                    <Button as={Link} href={route("admin.customers.create")} icon={Plus}>
                        <span className="hidden sm:inline">
                            Tambah Pelanggan
                        </span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                }
            />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, telepon, email..."
                            className="block w-full rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                    </div>
                    <div className="pt-4 flex items-center ">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">
                                {filtered.length}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-foreground">
                                {customers.length}
                            </span>{" "}
                            pelanggan
                        </p>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
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
                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search
                                ? "Pelanggan tidak ditemukan"
                                : "Belum ada pelanggan"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search
                                ? "Coba kata kunci lain."
                                : "Mulai dengan menambahkan pelanggan pertama untuk program loyalitas."}
                        </p>
                        {!search && (
                            <Button as={Link} href={route("admin.customers.create")} icon={Plus} className="mt-5">
                                Tambah Pelanggan
                            </Button>
                        )}
                    </div>
                ) : (
                    <CustomerList
                        items={filtered}
                        onDelete={setTarget}
                        showLoyalty={showLoyalty}
                    />
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus pelanggan?"
                description={
                    target
                        ? `Pelanggan "${target.name}" akan dihapus permanen. Riwayat transaksi terkait tidak akan terhapus.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}

function CustomerBadge({ name }) {
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-500/10 text-sm font-bold text-primary-600">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function RowActions({ customer, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <Link
                href={route("admin.customers.edit", customer.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
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
                onClick={() => onDelete(customer)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
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
    );
}

function CustomerList({ items, onDelete, showLoyalty = true }) {
    return (
        <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-3.5">Nama</th>
                            <th className="px-4 py-3.5">Telepon</th>
                            <th className="px-4 py-3.5">Email</th>
                            {showLoyalty && (
                                <th className="px-4 py-3.5 text-center">
                                    Poin
                                </th>
                            )}
                            {showLoyalty && (
                                <th className="px-4 py-3.5 text-center">
                                    Tier
                                </th>
                            )}
                            <th className="px-4 py-3.5 text-right">Hutang</th>
                            <th className="px-4 py-3.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((c) => (
                            <tr
                                key={c.id}
                                className="transition hover:bg-muted/70"
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <CustomerBadge name={c.name} />
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">
                                                {c.name}
                                            </p>
                                            {c.code && (
                                                <p className="text-xs text-muted-foreground">
                                                    {c.code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {c.phone || "—"}
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                    {c.email || "—"}
                                </td>
                                {showLoyalty && (
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                            {c.points || 0}
                                        </span>
                                    </td>
                                )}
                                {showLoyalty && (
                                    <td className="px-4 py-4 text-center">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TIER_STYLES[c.tier] || TIER_STYLES.bronze}`}
                                        >
                                            {c.tier || "bronze"}
                                        </span>
                                    </td>
                                )}
                                <td className="px-4 py-4 text-right">
                                    {(c.debt_balance ?? 0) > 0 ? (
                                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                                            Rp{Number(c.debt_balance).toLocaleString("id-ID")}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <RowActions
                                        customer={c}
                                        onDelete={onDelete}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
                {items.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 p-4">
                        <CustomerBadge name={c.name} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-foreground">
                                    {c.name}
                                </p>
                                {showLoyalty && (
                                    <span
                                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${TIER_STYLES[c.tier] || TIER_STYLES.bronze}`}
                                    >
                                        {c.tier || "bronze"}
                                    </span>
                                )}
                            </div>
                            {c.phone && (
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {c.phone}
                                </p>
                            )}
                            {c.email && (
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {c.email}
                                </p>
                            )}
                            <div className="mt-2 flex items-center gap-3">
                                {showLoyalty && (
                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        {c.points || 0} poin
                                    </span>
                                )}
                                <div className="flex items-center gap-1">
                                    <Link
                                        href={route(
                                            "admin.customers.edit",
                                            c.id,
                                        )}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
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
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => onDelete(c)}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
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
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
