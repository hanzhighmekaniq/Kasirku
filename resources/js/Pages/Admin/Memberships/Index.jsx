import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import LoyaltyTabs from "@/Components/LoyaltyTabs";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import Button from "@/Components/ui/Button";
import { CreditCard, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";

const DURATION_LABELS = {
    day: "Hari",
    month: "Bulan",
    year: "Tahun",
    visit: "Kunjungan",
};

function formatDuration(type, value) {
    const label = DURATION_LABELS[type] ?? type;
    return `${value} ${label}`;
}

function formatIDR(amount) {
    const n = parseFloat(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

/* Ringkasan untuk tabel diturunkan dari `benefits`, bukan kolom lama. Backend
   sudah menormalkan benefit (termasuk menaikkan kolom lama), jadi ini satu-satunya
   sumber yang perlu dibaca di sini. */

function benefitsOf(membership) {
    return Array.isArray(membership.benefits) ? membership.benefits : [];
}

/** Persen diskon terbesar milik membership, null kalau tidak ada. */
function discountPercentOf(membership) {
    const values = benefitsOf(membership)
        .filter((b) => b.type === "discount_percent")
        .map((b) => Number(b.value) || 0);

    return values.length ? Math.max(...values) : null;
}

/** Nama tier yang dipetakan membership, null kalau tidak memetakan tier. */
function tierOf(membership) {
    return benefitsOf(membership).find((b) => b.type === "maps_to_tier")?.tier ?? null;
}

/** Level tier (rank) untuk ditampilkan di tabel, 0 kalau tidak ada. */
function tierRankOf(membership, customerTiers) {
    const tierId = benefitsOf(membership).find((b) => b.type === "maps_to_tier")?.tier_id;

    return customerTiers.find((t) => t.id === tierId)?.rank ?? 0;
}

export default function Index({ memberships, customerTiers = [] }) {
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return memberships;
        return memberships.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                (m.code || "").toLowerCase().includes(q) ||
                (m.description || "").toLowerCase().includes(q),
        );
    }, [memberships, search]);

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        router.delete(route("admin.memberships.destroy", deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Membership
                    </div>
                    <div className="text-[11px] text-muted-foreground">Manajemen</div>
                </div>
            }
        >
            <Head title="Membership" />
            <PageHeader
                title="Membership"
                breadcrumbs={["Admin", "Membership"]}
                heading={
                    <>
                        Kelola <span className="text-primary">Membership</span> pelanggan
                    </>
                }
                description="Kelola level loyalitas dan program membership pelanggan."
            />

            <LoyaltyTabs />

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
                                placeholder="Cari nama, kode..."
                                className="block w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">
                                {filtered.length}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-foreground">
                                {memberships.length}
                            </span>
                        </p>
                    </div>
                    {/* Di mobile dipindah ke FAB kanan bawah */}
                    <Button
                        as={Link}
                        href={route("admin.memberships.create")}
                        icon={Plus}
                        className="hidden sm:inline-flex sm:w-auto"
                    >
                        Tambah Membership
                    </Button>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
                            <CreditCard
                                className="h-8 w-8 text-muted-foreground/50"
                                strokeWidth={1.5}
                            />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search
                                ? "Membership tidak ditemukan"
                                : "Belum ada membership"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search
                                ? "Coba kata kunci lain."
                                : "Mulai dengan menambahkan membership pertama untuk program loyalitas pelanggan."}
                        </p>
                        {!search && (
                            <Button
                                as={Link}
                                href={route("admin.memberships.create")}
                                icon={Plus}
                                className="mt-5"
                            >
                                Tambah Membership
                            </Button>
                        )}
                    </div>
                ) : (
                    <MembershipList
                        items={filtered}
                        customerTiers={customerTiers}
                        onDelete={setDeleting}
                    />
                )}
            </div>

            {/* Delete Confirmation Modal — reusable */}
            <ConfirmDeleteModal
                open={!!deleting}
                title="Hapus membership?"
                description={
                    deleting
                        ? `Membership "${deleting.name}" akan dihapus permanen.`
                        : "Tindakan ini tidak dapat dibatalkan."
                }
                confirmLabel="Hapus"
                processing={processing}
                onConfirm={confirmDelete}
                onClose={() => {
                    if (!processing) setDeleting(null);
                }}
            />

            {/* FAB — mobile only. Disembunyikan saat modal hapus terbuka supaya
                tidak menimpa panelnya. */}
            {!deleting && (
                <Link
                    href={route("admin.memberships.create")}
                    className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 sm:hidden"
                    aria-label="Tambah membership"
                    title="Tambah Membership"
                >
                    <Plus className="h-6 w-6" strokeWidth={2} />
                </Link>
            )}
        </AuthenticatedLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Table / List                                                       */
/* ------------------------------------------------------------------ */
/**
 * Penanda status aktif/nonaktif.
 *
 * Mengikuti standar Badge / Status Pill di TOKEN_MAPPING.md: status universal
 * wajib memakai token tema (`success` / `muted`), bukan warna hardcoded, supaya
 * ikut berubah mengikuti tema aktif.
 */
function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Nonaktif
        </span>
    );
}

function MemberBadge({ count }) {
    if (!count && count !== 0) return null;
    return (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {count} member
        </span>
    );
}

function RowActions({ item, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <Link
                href={route("admin.memberships.show", item.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="Lihat Detail"
            >
                <Eye className="h-4 w-4" strokeWidth={1.7} />
            </Link>
            <Link
                href={route("admin.memberships.edit", item.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                title="Edit"
            >
                <Pencil className="h-4 w-4" strokeWidth={1.7} />
            </Link>
            <button
                onClick={() => onDelete(item)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10"
                title="Hapus"
            >
                <Trash2 className="h-4 w-4" strokeWidth={1.7} />
            </button>
        </div>
    );
}

function MembershipList({ items, customerTiers = [], onDelete }) {
    const openShow = (id) => router.visit(route("admin.memberships.show", id));

    return (
        <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Kode</th>
                            <th className="px-4 py-3 text-left font-semibold">Nama</th>
                            <th className="px-4 py-3 text-left font-semibold">Durasi</th>
                            <th className="px-4 py-3 text-right font-semibold">Harga</th>
                            <th className="px-4 py-3 text-center font-semibold">Diskon</th>
                            <th className="px-4 py-3 text-center font-semibold">Tier</th>
                            <th className="px-4 py-3 text-center font-semibold">Member</th>
                            <th className="px-4 py-3 text-center font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {items.map((m) => (
                            <tr
                                key={m.id}
                                onClick={() => openShow(m.id)}
                                className="cursor-pointer transition hover:bg-[rgb(var(--color-table-hover))]"
                                title="Lihat detail membership"
                            >
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                                        {m.code}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground">
                                            {m.name}
                                        </p>
                                        {m.description && (
                                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                                                {m.description}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {formatDuration(m.duration_type, m.duration_value)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-foreground">
                                    {formatIDR(m.price)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {discountPercentOf(m) ? (
                                        <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                                            {discountPercentOf(m)}%
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {tierOf(m) ? (
                                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                            Lvl {tierRankOf(m, customerTiers)} —{" "}
                                            {tierOf(m)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <MemberBadge count={m.customer_memberships_count} />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <StatusBadge active={m.is_active} />
                                </td>
                                <td
                                    className="px-4 py-3"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <RowActions item={m} onDelete={onDelete} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
                {items.map((m) => (
                    <div
                        key={m.id}
                        onClick={() => openShow(m.id)}
                        className="cursor-pointer p-4 transition active:bg-muted/50"
                    >
                        <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                                        {m.code}
                                    </span>
                                    <StatusBadge active={m.is_active} />
                                </div>
                                <p className="mt-1 font-medium text-foreground">
                                    {m.name}
                                </p>
                                {m.description && (
                                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                                        {m.description}
                                    </p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {formatDuration(
                                            m.duration_type,
                                            m.duration_value,
                                        )}
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {formatIDR(m.price)}
                                    </span>
                                    {discountPercentOf(m) ? (
                                        <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                                            Diskon {discountPercentOf(m)}%
                                        </span>
                                    ) : null}
                                    {tierOf(m) ? (
                                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            Lvl {tierRankOf(m, customerTiers)} —{" "}
                                            {tierOf(m)}
                                        </span>
                                    ) : null}
                                    <MemberBadge count={m.customer_memberships_count} />
                                </div>
                            </div>
                        </div>
                        <div
                            className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Link
                                href={route("admin.memberships.show", m.id)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-muted px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                            >
                                <Eye className="h-3.5 w-3.5" strokeWidth={1.7} />
                                Detail
                            </Link>
                            <Link
                                href={route("admin.memberships.edit", m.id)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                            >
                                <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
                                Edit
                            </Link>
                            <button
                                onClick={() => onDelete(m)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
