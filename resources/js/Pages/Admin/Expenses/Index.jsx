import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Plus, Search, Eye, Trash2, Settings } from "lucide-react";
import Button from "@/Components/ui/Button";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const STATUS_CONFIG = {
    draft: { label: "Draft", className: "bg-amber-100 text-amber-700" },
    posted: { label: "Posted", className: "bg-emerald-100 text-success" },
    cancelled: {
        label: "Dibatalkan",
        className: "bg-muted text-muted-foreground",
    },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
        >
            {cfg.label}
        </span>
    );
}

function formatRupiah(val) {
    return "Rp " + Number(val || 0).toLocaleString("id-ID");
}

function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function Index({ expenses }) {
    const [search, setSearch] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return expenses;
        return expenses.filter(
            (e) =>
                e.expense_no.toLowerCase().includes(q) ||
                (e.notes || "").toLowerCase().includes(q) ||
                (e.expense_category?.name || "").toLowerCase().includes(q),
        );
    }, [expenses, search]);

    const stats = useMemo(() => {
        const total = expenses.length;
        const totalAmount = expenses.reduce(
            (s, e) => s + Number(e.amount || 0),
            0,
        );
        const postedCount = expenses.filter(
            (e) => e.status === "posted",
        ).length;
        const draftCount = expenses.filter((e) => e.status === "draft").length;
        return { total, totalAmount, postedCount, draftCount };
    }, [expenses]);

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.expenses.destroy", target.id), {
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
                        Pengeluaran
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <PageHeader
                title="Pengeluaran"
                breadcrumbs={["Admin", "Pengeluaran"]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pengeluaran
                        </span>
                    </>
                }
                description="Catat dan pantau pengeluaran toko seperti operasional, gaji, dan lainnya."
                action={
                    <div className="flex items-center gap-2">
                        <Link
                            href={route("admin.expense-categories.index")}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                        >
                            <Settings className="h-4 w-4" strokeWidth={1.8} />
                            Kategori
                        </Link>
                        <Button as={Link} href={route("admin.expenses.create")} icon={Plus}>
                            <span className="hidden sm:inline">
                                Catat Pengeluaran
                            </span>
                            <span className="sm:hidden">Tambah</span>
                        </Button>
                    </div>
                }
            />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground/30 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Transaksi</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-rose-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Pengeluaran</p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {formatRupiah(stats.totalAmount)}
                    </p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-emerald-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Posted</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.postedCount}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-amber-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Draft</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.draftCount}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                <Search className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari pengeluaran..."
                                className="block w-full rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                            dari{" "}
                            <span className="font-semibold text-foreground">{expenses.length}</span>{" "}
                            pengeluaran
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">No. Pengeluaran</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategori</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jumlah</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                                                    </svg>
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-muted-foreground">
                                                    {search ? "Pengeluaran tidak ditemukan" : "Belum ada pengeluaran"}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {search ? "Coba ubah kata kunci" : 'Klik "Catat Pengeluaran" untuk mencatat pengeluaran baru'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((exp) => (
                                        <tr key={exp.id} className="transition hover:bg-muted/50">
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-violet-50 text-sm">
                                                        <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">{exp.expense_no}</p>
                                                        {exp.notes && (
                                                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">{exp.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{formatDate(exp.expense_date)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{exp.expense_category?.name || "—"}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-foreground">{formatRupiah(exp.amount)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center"><StatusBadge status={exp.status} /></td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route("admin.expenses.show", exp.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                                                    </Link>
                                                    {exp.status === "draft" && (
                                                        <button
                                                            onClick={() => setTarget(exp)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-3 p-3 md:hidden">
                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                                </svg>
                            </div>
                            <p className="mt-4 text-sm font-medium text-muted-foreground">
                                {search ? "Pengeluaran tidak ditemukan" : "Belum ada pengeluaran"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {search ? "Coba ubah kata kunci" : 'Klik "Catat Pengeluaran" untuk mencatat pengeluaran baru'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((exp) => (
                            <div key={exp.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">{exp.expense_no}</p>
                                        {exp.notes && (
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{exp.notes}</p>
                                        )}
                                        <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(exp.expense_date)}</p>
                                    </div>
                                    <StatusBadge status={exp.status} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Kategori</p>
                                        <p className="mt-0.5 text-foreground">{exp.expense_category?.name || "Tanpa kategori"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground">Jumlah</p>
                                        <p className="mt-0.5 font-semibold text-foreground">{formatRupiah(exp.amount)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                                    <Link
                                        href={route("admin.expenses.show", exp.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/70"
                                    >
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Lihat
                                    </Link>
                                    {exp.status === "draft" && (
                                        <button
                                            onClick={() => setTarget(exp)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-red-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus pengeluaran?"
                description={
                    target
                        ? `Pengeluaran "${target.expense_no}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
