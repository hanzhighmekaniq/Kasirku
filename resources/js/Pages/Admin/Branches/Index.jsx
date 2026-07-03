import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import ConfirmDeleteModal from "../Customers/ConfirmDeleteModal";

export default function Index({ branches }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return branches;

        return branches.filter(
            (branch) =>
                branch.name.toLowerCase().includes(q) ||
                (branch.code || "").toLowerCase().includes(q) ||
                (branch.phone || "").toLowerCase().includes(q) ||
                (branch.address || "").toLowerCase().includes(q),
        );
    }, [branches, search]);

    const activeCount = branches.filter((branch) => branch.is_active).length;
    const inactiveCount = branches.length - activeCount;

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.branches.destroy", target.id), {
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
                        Outlet / Cabang
                    </h2>
                    <Link
                        href={route("admin.branches.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        <span className="hidden sm:inline">Tambah Cabang</span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title="Outlet / Cabang" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total Cabang" value={branches.length} />
                <StatCard label="Aktif" value={activeCount} tone="emerald" />
                <StatCard label="Nonaktif" value={inactiveCount} tone="slate" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
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
                            placeholder="Cari kode, nama, telepon..."
                            className="block w-full rounded-xl border-slate-300 pl-9 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <p className="text-sm text-slate-500">
                        Total{" "}
                        <span className="font-semibold text-slate-700">
                            {filtered.length}
                        </span>{" "}
                        cabang
                    </p>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                            <svg
                                className="h-8 w-8 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 21h16.5M4.5 21V8.25A2.25 2.25 0 016.75 6h10.5a2.25 2.25 0 012.25 2.25V21M8.25 21v-5.25A1.5 1.5 0 019.75 14.25h4.5a1.5 1.5 0 011.5 1.5V21M8.25 10.5h.008v.008H8.25V10.5zm3.75 0h.008v.008H12V10.5zm3.75 0h.008v.008h-.008V10.5zM8.25 3h7.5"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {search
                                ? "Cabang tidak ditemukan"
                                : "Belum ada cabang"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {search
                                ? "Coba kata kunci lain."
                                : "Tambahkan cabang pertama untuk memisahkan stok dan transaksi per lokasi."}
                        </p>
                        {!search && (
                            <Link
                                href={route("admin.branches.create")}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                                Tambah Cabang
                            </Link>
                        )}
                    </div>
                ) : (
                    <BranchList items={filtered} onDelete={setTarget} />
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus cabang?"
                description={
                    target
                        ? `Cabang "${target.name}" akan dihapus jika belum dipakai pada data operasional.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}

function StatCard({ label, value, tone = "indigo" }) {
    const tones = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        slate: "bg-slate-50 text-slate-700 border-slate-200",
    };

    return (
        <div
            className={`rounded-2xl border px-4 py-3 shadow-sm ${tones[tone]}`}
        >
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                {label}
            </p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
    );
}

function BranchBadge({ name }) {
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-sm font-bold text-indigo-600">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function StatusBadge({ active }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
        >
            {active ? "Aktif" : "Nonaktif"}
        </span>
    );
}

function RowActions({ branch, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <Link
                href={route("admin.branches.edit", branch.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
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
                onClick={() => onDelete(branch)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
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

function BranchList({ items, onDelete }) {
    return (
        <>
            <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-6 py-3.5">Cabang</th>
                            <th className="px-6 py-3.5">Telepon</th>
                            <th className="px-6 py-3.5">Alamat</th>
                            <th className="px-6 py-3.5 text-center">
                                Karyawan
                            </th>
                            <th className="px-6 py-3.5 text-center">Status</th>
                            <th className="px-6 py-3.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((branch) => (
                            <tr
                                key={branch.id}
                                className="transition hover:bg-slate-50/70"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <BranchBadge name={branch.name} />
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800">
                                                {branch.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {branch.code}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {branch.phone || "-"}
                                </td>
                                <td className="max-w-xs px-6 py-4">
                                    <span className="line-clamp-1 text-slate-500">
                                        {branch.address || "-"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <CountBadge
                                        value={branch.employees_count || 0}
                                    />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge active={branch.is_active} />
                                </td>
                                <td className="px-6 py-4">
                                    <RowActions
                                        branch={branch}
                                        onDelete={onDelete}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
                {items.map((branch) => (
                    <div key={branch.id} className="flex items-start gap-3 p-4">
                        <BranchBadge name={branch.name} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-slate-800">
                                    {branch.name}
                                </p>
                                <StatusBadge active={branch.is_active} />
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-400">
                                {branch.code}
                            </p>
                            {branch.phone && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {branch.phone}
                                </p>
                            )}
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                {branch.address || "-"}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <CountBadge
                                    value={branch.employees_count || 0}
                                    label="karyawan"
                                />
                            </div>
                        </div>
                        <RowActions branch={branch} onDelete={onDelete} />
                    </div>
                ))}
            </div>
        </>
    );
}

function CountBadge({ value, label }) {
    return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {value}
            {label ? ` ${label}` : ""}
        </span>
    );
}
