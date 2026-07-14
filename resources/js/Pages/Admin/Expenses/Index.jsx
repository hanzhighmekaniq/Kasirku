import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Plus, Search, Eye, Trash2, Settings } from "lucide-react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const STATUS_CONFIG = {
    draft: { label: "Draft", className: "bg-amber-100 text-amber-700" },
    posted: { label: "Posted", className: "bg-emerald-100 text-emerald-700" },
    cancelled: {
        label: "Dibatalkan",
        className: "bg-slate-100 text-slate-500",
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
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Pengeluaran
                    </h2>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route("admin.expense-categories.index")}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <Settings className="h-4 w-4" strokeWidth={1.8} />
                            Kategori
                        </Link>
                        <Link
                            href={route("admin.expenses.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            <span className="hidden sm:inline">
                                Catat Pengeluaran
                            </span>
                            <span className="sm:hidden">Tambah</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Pengeluaran" />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total Transaksi</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-rose-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total Pengeluaran</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                        {formatRupiah(stats.totalAmount)}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Posted</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.postedCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Draft</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.draftCount}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <Search className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari pengeluaran..."
                                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan{" "}
                            <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
                            dari{" "}
                            <span className="font-semibold text-slate-700">{expenses.length}</span>{" "}
                            pengeluaran
                        </p>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/60">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">No. Pengeluaran</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                                                    </svg>
                                                </div>
                                                <p className="mt-4 text-sm font-medium text-slate-600">
                                                    {search ? "Pengeluaran tidak ditemukan" : "Belum ada pengeluaran"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {search ? "Coba ubah kata kunci" : 'Klik "Catat Pengeluaran" untuk mencatat pengeluaran baru'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((exp) => (
                                        <tr key={exp.id} className="transition hover:bg-slate-50/50">
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-sm">
                                                        <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-800">{exp.expense_no}</p>
                                                        {exp.notes && (
                                                            <p className="max-w-[200px] truncate text-xs text-slate-400">{exp.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{formatDate(exp.expense_date)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{exp.expense_category?.name || "—"}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">{formatRupiah(exp.amount)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center"><StatusBadge status={exp.status} /></td>
                                            <td className="whitespace-nowrap px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route("admin.expenses.show", exp.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                                                    </Link>
                                                    {exp.status === "draft" && (
                                                        <button
                                                            onClick={() => setTarget(exp)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.859m-18.75 0V6a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v7.5m-18.75 0H21" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v5.25m0 0l2.25-2.25M12 13.5L9.75 11.25" />
                                </svg>
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-600">
                                {search ? "Pengeluaran tidak ditemukan" : "Belum ada pengeluaran"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                {search ? "Coba ubah kata kunci" : 'Klik "Catat Pengeluaran" untuk mencatat pengeluaran baru'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((exp) => (
                            <div key={exp.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-800">{exp.expense_no}</p>
                                        {exp.notes && (
                                            <p className="mt-0.5 truncate text-xs text-slate-400">{exp.notes}</p>
                                        )}
                                        <p className="mt-0.5 text-xs text-slate-400">{formatDate(exp.expense_date)}</p>
                                    </div>
                                    <StatusBadge status={exp.status} />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-400">Kategori</p>
                                        <p className="mt-0.5 text-slate-700">{exp.expense_category?.name || "Tanpa kategori"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400">Jumlah</p>
                                        <p className="mt-0.5 font-semibold text-slate-800">{formatRupiah(exp.amount)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                                    <Link
                                        href={route("admin.expenses.show", exp.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                                    >
                                        <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                                        Lihat
                                    </Link>
                                    {exp.status === "draft" && (
                                        <button
                                            onClick={() => setTarget(exp)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
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
