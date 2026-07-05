import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import ConfirmDeleteModal from "../Customers/ConfirmDeleteModal";

const STATUS_STYLES = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    terminated: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
    active: "Aktif",
    inactive: "Nonaktif",
    terminated: "Berhenti",
};

const ROLE_STYLES = {
    admin: "bg-emerald-100 text-emerald-700",
    kasir: "bg-blue-100 text-blue-700",
    developer: "bg-purple-100 text-purple-700",
};

const ROLE_LABELS = {
    admin: "Admin",
    kasir: "Kasir",
    developer: "Developer",
};

export default function Index({ employees, storeType = 'retail' }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Label per store type
    const PAGE_LABEL = {
        retail:      'Karyawan',
        fnb:         'Karyawan',
        service:     'Terapis / Staf',
        rental:      'Staf',
        ticket:      'Staf & Operator',
        hospitality: 'Staf Hotel',
        parking:     'Petugas Parkir',
        session:     'Operator',
    };
    const ADD_LABEL = {
        service:     'Tambah Terapis',
        hospitality: 'Tambah Staf',
        parking:     'Tambah Petugas',
        session:     'Tambah Operator',
    };
    const pageLabel = PAGE_LABEL[storeType] ?? 'Karyawan';
    const addLabel  = ADD_LABEL[storeType]  ?? 'Tambah Karyawan';
    const showCommission = ['service', 'ticket', 'fnb', 'retail'].includes(storeType);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return employees;

        return employees.filter(
            (emp) =>
                emp.name.toLowerCase().includes(q) ||
                (emp.email || "").toLowerCase().includes(q) ||
                (emp.employee_code || "").toLowerCase().includes(q) ||
                (emp.phone || "").toLowerCase().includes(q) ||
                (emp.position || "").toLowerCase().includes(q) ||
                (emp.branch?.name || "").toLowerCase().includes(q) ||
                (emp.user?.role || "").toLowerCase().includes(q),
        );
    }, [employees, search]);

    const employeeDataCount = employees.length;
    const activeCount = employees.filter(
        (emp) => emp.status === "active",
    ).length;

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.employees.destroy", target.id), {
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
                        {pageLabel}
                    </h2>
                    <Link
                        href={route("admin.employees.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="hidden sm:inline">{addLabel}</span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>
            }
        >
            <Head title={pageLabel} />

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
                <StatCard label={`Total ${pageLabel}`} value={employees.length} />
                <StatCard label="Ada Akun Login" value={employees.filter((e) => e.user).length} tone="sky" />
                <StatCard label="Aktif" value={activeCount} tone="emerald" />
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
                            placeholder="Cari nama, kode, cabang..."
                            className="block w-full rounded-xl border-slate-300 pl-9 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <p className="text-sm text-slate-500">
                        Total{" "}
                        <span className="font-semibold text-slate-700">
                            {filtered.length}
                        </span>{" "}
                        {pageLabel.toLowerCase()}
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
                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {search
                                ? "Karyawan tidak ditemukan"
                                : "Belum ada karyawan"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {search
                                ? "Coba kata kunci lain."
                                : "Tambahkan karyawan untuk mengelola akses dan cabang."}
                        </p>
                        {!search && (
                            <Link
                                href={route("admin.employees.create")}
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
                                Tambah Karyawan
                            </Link>
                        )}
                    </div>
                ) : (
                    <EmployeeList items={filtered} onDelete={setTarget} showCommission={showCommission} />
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus karyawan?"
                description={
                    target
                        ? `Data karyawan "${target.name}" dan akun login terkait akan dihapus.`
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
        sky: "bg-sky-50 text-sky-700 border-sky-100",
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

function EmployeeBadge({ name }) {
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-sm font-bold text-indigo-600">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.inactive}`}
        >
            {STATUS_LABELS[status] || status}
        </span>
    );
}

function RoleBadge({ role }) {
    if (!role) {
        return (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                Tanpa akun
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[role] || "bg-slate-100 text-slate-600"}`}
        >
            {ROLE_LABELS[role] || role}
        </span>
    );
}

function RowActions({ employee, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <Link
                href={route("admin.employees.edit", employee.id)}
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
                onClick={() => onDelete(employee)}
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

function EmployeeList({ items, onDelete, showCommission = true }) {
    return (
        <>
            <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-6 py-3.5">Karyawan</th>
                            <th className="px-6 py-3.5">Cabang</th>
                            <th className="px-6 py-3.5">Kontak</th>
                            <th className="px-6 py-3.5">Jabatan</th>
                            {showCommission && <th className="px-6 py-3.5 text-center">Komisi</th>}
                            <th className="px-6 py-3.5 text-center">Role</th>
                            <th className="px-6 py-3.5 text-center">Status</th>
                            <th className="px-6 py-3.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((emp) => (
                            <tr
                                key={emp.id}
                                className="transition hover:bg-slate-50/70"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <EmployeeBadge name={emp.name} />
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800">
                                                {emp.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {emp.employee_code}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {emp.branch
                                        ? `${emp.branch.name} (${emp.branch.code})`
                                        : "-"}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-slate-600">
                                        {emp.phone || "-"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {emp.email || "-"}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {emp.position || "-"}
                                </td>
                                {showCommission && (
                                <td className="px-6 py-4 text-center">
                                    {emp.commission_type === "none" || !emp.commission_type ? (
                                        <span className="text-xs text-slate-400">-</span>
                                    ) : emp.commission_type === "percent" ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                            {emp.commission_value}%
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                                            Rp {Number(emp.commission_value).toLocaleString("id-ID")}
                                        </span>
                                    )}
                                </td>
                                )}
                                <td className="px-6 py-4 text-center">
                                    <RoleBadge role={emp.user_roles?.[0]} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={emp.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <RowActions
                                        employee={emp}
                                        onDelete={onDelete}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
                {items.map((emp) => (
                    <div key={emp.id} className="flex items-start gap-3 p-4">
                        <EmployeeBadge name={emp.name} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-slate-800">
                                    {emp.name}
                                </p>
                                <StatusBadge status={emp.status} />
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-400">
                                {emp.employee_code}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {emp.branch
                                    ? emp.branch.name
                                    : "Belum ada cabang"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {emp.email || "-"}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <RoleBadge role={emp.user_roles?.[0]} />
                                {emp.position && (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                        {emp.position}
                                    </span>
                                )}
                                {emp.commission_type && emp.commission_type !== "none" && (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                        {emp.commission_type === "percent"
                                            ? `Komisi ${emp.commission_value}%`
                                            : `Komisi Rp ${Number(emp.commission_value).toLocaleString("id-ID")}`}
                                    </span>
                                )}
                            </div>
                        </div>
                        <RowActions employee={emp} onDelete={onDelete} />
                    </div>
                ))}
            </div>
        </>
    );
}
