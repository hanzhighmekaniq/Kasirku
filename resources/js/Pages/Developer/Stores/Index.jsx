import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import SelectDropdown from "@/Components/ui/SelectDropdown";
import {
    Building2,
    CircleCheck,
    CircleParking,
    Coffee,
    Eye,
    Hotel,
    KeyRound,
    Monitor,
    Pencil,
    Plus,
    Scissors,
    Search,
    Shirt,
    Store,
    Ticket,
    Trash2,
    X,
} from "lucide-react";

const STORE_TYPE = {
    retail: {
        label: "Retail",
        Icon: Store,
        cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    fnb: {
        label: "FnB",
        Icon: Coffee,
        cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    service: {
        label: "Service",
        Icon: Scissors,
        cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    },
    rental: {
        label: "Rental",
        Icon: KeyRound,
        cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    ticket: {
        label: "Tiket",
        Icon: Ticket,
        cls: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    },
    hospitality: {
        label: "Hospitality",
        Icon: Hotel,
        cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    },
    laundry: {
        label: "Laundry",
        Icon: Shirt,
        cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
    parking: {
        label: "Parkir",
        Icon: CircleParking,
        cls: "bg-muted text-muted-foreground",
    },
    session: {
        label: "Sesi",
        Icon: Monitor,
        cls: "bg-primary/10 text-primary",
    },
};

const PLAN_BADGE = {
    free: { label: "Free", cls: "bg-muted text-muted-foreground" },
    basic: {
        label: "Basic",
        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    pro: {
        label: "Pro",
        cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    enterprise: {
        label: "Enterprise",
        cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
};

export default function Index({ stores, storeTypes }) {
    const { flash } = usePage().props;
    const [deleting, setDeleting] = useState(null);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const perPage = 10;

    /* ── Filter logic ──────────────────────────────────── */
    const filtered = stores.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch =
            !search ||
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            (s.owner_names ?? "").toLowerCase().includes(q) ||
            (s.owners ?? []).some((o) =>
                (o.name ?? "").toLowerCase().includes(q),
            );
        const matchType = filterType === "all" || s.store_type === filterType;
        const matchFilter =
            filter === "all" ||
            (filter === "active" && s.is_active) ||
            (filter === "inactive" && !s.is_active) ||
            (filter === "has_owner" && s.has_owner) ||
            (filter === "no_owner" && !s.has_owner);
        return matchSearch && matchType && matchFilter;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    const stats = {
        all: stores.length,
        active: stores.filter((s) => s.is_active).length,
        inactive: stores.filter((s) => !s.is_active).length,
        has_owner: stores.filter((s) => s.has_owner).length,
        no_owner: stores.filter((s) => !s.has_owner).length,
    };

    useEffect(() => {
        setPage(1);
    }, [search, filterType, filter]);

    const handleDelete = (store) => {
        if (
            !confirm(
                `Hapus toko "${store.name}"? Semua data terkait akan ikut terhapus.`,
            )
        )
            return;
        setDeleting(store.id);
        router.delete(route("developer.stores.destroy", store.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    const FILTER_CHIPS = [
        { key: "all", label: `Semua (${stats.all})` },
        { key: "active", label: `Aktif (${stats.active})` },
        { key: "inactive", label: `Nonaktif (${stats.inactive})` },
        { key: "has_owner", label: `Punya Owner (${stats.has_owner})` },
        { key: "no_owner", label: `Belum Ada (${stats.no_owner})` },
    ];

    const typeOptions = [
        { key: "all", label: "Semua Tipe" },
        ...(storeTypes ?? []).map((t) => ({
            key: t.code,
            label: (t.icon ?? "🏬") + " " + (t.label ?? t.code),
        })),
    ];

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Kelola Toko
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {stores.length} toko
                        </p>
                    </div>
                    <Link
                        href={route("developer.stores.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        Tambah Toko
                    </Link>
                </div>
            }
        >
            <Head title="Kelola Toko" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    <CircleCheck className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                    {flash.success}
                </div>
            )}

            {/* ── Filter Bar ─────────────────────────── */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari toko, kode, atau owner..."
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                {/* Type dropdown */}
                <SelectDropdown
                    value={filterType}
                    options={typeOptions.map(t => ({ value: t.key, label: t.label }))}
                    onChange={(v) => setFilterType(v)}
                    placeholder="Semua Tipe"
                />
            </div>

            {/* ── Status Chips ───────────────────────── */}
            <div className="mb-5 flex flex-wrap gap-2">
                {FILTER_CHIPS.map((chip) => (
                    <button
                        key={chip.key}
                        onClick={() => setFilter(chip.key)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            filter === chip.key
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            {/* ── Table ──────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                            <Building2 className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                        </div>
                        <p className="mt-5 text-base font-semibold text-foreground">
                            {stores.length === 0
                                ? "Belum ada toko"
                                : "Tidak ada toko ditemukan"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {stores.length === 0
                                ? "Mulai dengan menambahkan toko pertama."
                                : "Coba ubah filter atau kata kunci pencarian."}
                        </p>
                        {stores.length === 0 ? (
                            <Link
                                href={route("developer.stores.create")}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                                Tambah Toko
                            </Link>
                        ) : (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setFilterType("all");
                                    setFilter("all");
                                }}
                                className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-sm">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th className="w-[24%] px-5 py-3.5 text-left font-semibold">
                                            Toko
                                        </th>
                                        <th className="w-[11%] px-5 py-3.5 text-left font-semibold">
                                            Tipe
                                        </th>
                                        <th className="w-[16%] px-5 py-3.5 text-left font-semibold">
                                            Owner
                                        </th>
                                        <th className="w-[9%] px-5 py-3.5 text-left font-semibold">
                                            Plan
                                        </th>
                                        <th className="w-[8%] px-5 py-3.5 text-center font-semibold">
                                            User
                                        </th>
                                        <th className="w-[8%] px-5 py-3.5 text-center font-semibold">
                                            Cabang
                                        </th>
                                        <th className="w-[9%] px-5 py-3.5 text-center font-semibold">
                                            Status
                                        </th>
                                        <th className="w-[15%] px-5 py-3.5 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {paginated.map((s) => {
                                        const tm = STORE_TYPE[s.store_type] ?? {
                                            label: s.store_type ?? "-",
                                            Icon: Building2,
                                            cls: "bg-muted text-muted-foreground",
                                        };
                                        const TypeIcon = tm.Icon;
                                        const pb =
                                            PLAN_BADGE[s.plan] ??
                                            PLAN_BADGE.free;
                                        const owners = s.owners ?? [];
                                        const showOwners = owners.slice(0, 1);
                                        const extraCount = owners.length - 1;

                                        return (
                                            <tr
                                                key={s.id}
                                                className="group transition hover:bg-[rgb(var(--color-table-hover))]"
                                            >
                                                {/* Toko */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                                            <TypeIcon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={route(
                                                                    "developer.stores.show",
                                                                    s.id,
                                                                )}
                                                                className="text-sm font-semibold text-foreground transition hover:text-primary truncate block"
                                                            >
                                                                {s.name}
                                                            </Link>
                                                            <p className="font-mono text-[11px] text-muted-foreground">
                                                                {s.code}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Tipe */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tm.cls}`}
                                                    >
                                                        {tm.label}
                                                    </span>
                                                </td>

                                                {/* Owner */}
                                                <td className="px-5 py-4">
                                                    {owners.length > 0 ? (
                                                        <div className="space-y-0.5">
                                                            {showOwners.map(
                                                                (o) => (
                                                                    <div
                                                                        key={
                                                                            o.id
                                                                        }
                                                                        className="min-w-0"
                                                                    >
                                                                        <p className="text-xs font-medium text-foreground truncate">
                                                                            {
                                                                                o.name
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                ),
                                                            )}
                                                            {extraCount > 0 && (
                                                                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                                    +
                                                                    {extraCount}{" "}
                                                                    lainnya
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs italic text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Plan */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${pb.cls}`}
                                                    >
                                                        {pb.label}
                                                    </span>
                                                </td>

                                                {/* User */}
                                                <td className="px-5 py-4 text-center">
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {s.users_count}
                                                    </span>
                                                </td>

                                                {/* Cabang */}
                                                <td className="px-5 py-4 text-center">
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {s.branches_count}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4 text-center">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                                            s.is_active
                                                                ? "bg-success/10 text-success"
                                                                : "bg-muted text-muted-foreground"
                                                        }`}
                                                    >
                                                        {s.is_active
                                                            ? "Aktif"
                                                            : "Nonaktif"}
                                                    </span>
                                                </td>

                                                {/* Aksi */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={route(
                                                                "developer.stores.show",
                                                                s.id,
                                                            )}
                                                            title="Detail"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            <Eye className="h-4 w-4" strokeWidth={1.7} />
                                                        </Link>
                                                        <Link
                                                            href={route(
                                                                "developer.stores.edit",
                                                                s.id,
                                                            )}
                                                            title="Edit"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                                                        >
                                                            <Pencil className="h-4 w-4" strokeWidth={1.7} />
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(s)
                                                            }
                                                            disabled={
                                                                deleting ===
                                                                s.id
                                                            }
                                                            title="Hapus"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ───────────────── */}
                        <div className="flex items-center justify-between border-t border-border px-5 py-3">
                            <p className="text-xs text-muted-foreground">
                                Menampilkan{" "}
                                {filtered.length === 0 ? 0 : start + 1}–
                                {Math.min(start + perPage, filtered.length)}{" "}
                                dari {filtered.length} toko
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={page === 1}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Sebelumnya
                                </button>
                                <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
                                    disabled={page === totalPages}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DeveloperLayout>
    );
}
