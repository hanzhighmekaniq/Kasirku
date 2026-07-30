import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import LoyaltyTabs from "@/Components/LoyaltyTabs";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { formatRupiah } from "@/Utils/currency";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import Button from "@/Components/ui/Button";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

/**
 * Kelas warna ditulis lengkap supaya tidak dibuang Tailwind saat build.
 * Kunci mengikuti CustomerTier::COLORS di backend.
 */
const TIER_STYLES = {
    slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function tierStyle(customer) {
    return TIER_STYLES[customer.customer_tier?.color] ?? TIER_STYLES.slate;
}

function tierName(customer) {
    return customer.customer_tier?.name ?? "—";
}

function activeMembership(customer) {
    return customer.memberships?.[0] ?? null;
}

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
                    <Button
                        as={Link}
                        href={route("admin.customers.create")}
                        icon={Plus}
                        className="hidden sm:inline-flex"
                    >
                        Tambah Pelanggan
                    </Button>
                }
            />

            <LoyaltyTabs />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <svg
                            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, telepon, email..."
                            className="w-full py-2.5 pl-10 pr-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
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

            {/* FAB — mobile only */}
            <Button
                as={Link}
                href={route("admin.customers.create")}
                icon={Plus}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl sm:hidden"
                title="Tambah Pelanggan"
            />
        </AuthenticatedLayout>
    );
}

function CustomerBadge({ name }) {
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function RowActions({ customer, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <Link
                href={route("admin.customers.show", customer.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Detail"
            >
                <Eye className="h-4 w-4" strokeWidth={1.7} />
            </Link>
            <Link
                href={route("admin.customers.edit", customer.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                title="Edit"
            >
                <Pencil className="h-4 w-4" strokeWidth={1.7} />
            </Link>
            <button
                onClick={() => onDelete(customer)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Hapus"
            >
                <Trash2 className="h-4 w-4" strokeWidth={1.7} />
            </button>
        </div>
    );
}

function MembershipBadge({ customer }) {
    const membership = activeMembership(customer)?.membership;

    if (!membership) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    return (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {membership.name}
        </span>
    );
}

function CustomerList({ items, onDelete, showLoyalty = true }) {
    return (
        <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                        <tr>
                            <th className="px-4 py-3.5 text-left font-semibold">Nama</th>
                            <th className="px-4 py-3.5 text-left font-semibold">Telepon</th>
                            <th className="px-4 py-3.5 text-left font-semibold">Email</th>
                            {showLoyalty && (
                                <th className="px-4 py-3.5 text-center font-semibold">
                                    Poin
                                </th>
                            )}
                            {showLoyalty && (
                                <th className="px-4 py-3.5 text-center font-semibold">
                                    Tier
                                </th>
                            )}
                            {showLoyalty && (
                                <th className="px-4 py-3.5 text-center font-semibold">
                                    Membership
                                </th>
                            )}
                            <th className="px-4 py-3.5 text-right font-semibold">Hutang</th>
                            <th className="px-4 py-3.5 text-right font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {items.map((c) => (
                            <tr
                                key={c.id}
                                className="transition hover:bg-[rgb(var(--color-table-hover))]"
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <CustomerBadge name={c.name} />
                                        <div className="min-w-0">
                                            <Link
                                                href={route("admin.customers.show", c.id)}
                                                className="font-medium text-foreground transition hover:text-primary"
                                            >
                                                {c.name}
                                            </Link>
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
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tierStyle(c)}`}
                                        >
                                            {tierName(c)}
                                        </span>
                                    </td>
                                )}
                                {showLoyalty && (
                                    <td className="px-4 py-4 text-center">
                                        <MembershipBadge customer={c} />
                                    </td>
                                )}
                                <td className="px-4 py-4 text-right">
                                    {(c.debt_balance ?? 0) > 0 ? (
                                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                                            {formatRupiah(c.debt_balance)}
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
                                <Link
                                    href={route("admin.customers.show", c.id)}
                                    className="truncate font-medium text-foreground transition hover:text-primary"
                                >
                                    {c.name}
                                </Link>
                                {showLoyalty && (
                                    <span
                                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tierStyle(c)}`}
                                    >
                                        {tierName(c)}
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
                                {showLoyalty && <MembershipBadge customer={c} />}
                                <div className="flex items-center gap-1">
                                    <Link
                                        href={route("admin.customers.show", c.id)}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                    >
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.7} />
                                        Detail
                                    </Link>
                                    <Link
                                        href={route("admin.customers.edit", c.id)}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                                    >
                                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => onDelete(c)}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
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
