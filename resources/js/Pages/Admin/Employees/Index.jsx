import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/Components/ui/Button";
import Dropdown from "@/Components/Dropdown";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

const STATUS_STYLES = {
    active: "bg-emerald-100 text-success",
    inactive: "bg-muted text-muted-foreground",
    terminated: "bg-red-100 text-destructive",
};

const STATUS_LABELS = {
    active: "Aktif",
    inactive: "Nonaktif",
    terminated: "Berhenti",
};

const ROLE_STYLES = {
    admin: "bg-emerald-100 text-success",
    kasir: "bg-blue-100 text-blue-700",
    developer: "bg-purple-100 text-purple-700",
};

const ROLE_LABELS = {
    admin: "Admin",
    kasir: "Kasir",
    developer: "Developer",
};

export default function Index({ employees, storeType = "retail" }) {
    const { flash, storeTypeFeatures = [] } = usePage().props;
    const has = (f) => storeTypeFeatures.includes(f);
    const [search, setSearch] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");

    // Label per store type
    const PAGE_LABEL = {
        retail: "Karyawan",
        fnb: "Karyawan",
        service: "Terapis / Staf",
        rental: "Staf",
        ticket: "Staf & Operator",
        hospitality: "Staf Hotel",
        parking: "Petugas Parkir",
        session: "Operator",
    };
    const ADD_LABEL = {
        service: "Tambah Terapis",
        hospitality: "Tambah Staf",
        parking: "Tambah Petugas",
        session: "Tambah Operator",
    };
    const pageLabel = PAGE_LABEL[storeType] ?? "Karyawan";
    const addLabel = ADD_LABEL[storeType] ?? "Tambah Karyawan";
    const showCommission = has("commission");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let result = employees;

        if (q) {
            result = result.filter(
                (emp) =>
                    emp.name.toLowerCase().includes(q) ||
                    (emp.email || "").toLowerCase().includes(q) ||
                    (emp.employee_code || "").toLowerCase().includes(q) ||
                    (emp.phone || "").toLowerCase().includes(q) ||
                    (emp.position || "").toLowerCase().includes(q) ||
                    (emp.branch?.name || "").toLowerCase().includes(q) ||
                    (emp.user_roles || []).some((r) =>
                        r.toLowerCase().includes(q),
                    ),
            );
        }

        if (statusFilter) {
            result = result.filter((emp) => emp.status === statusFilter);
        }

        return result;
    }, [employees, search, statusFilter]);

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
                    <h2 className="text-lg font-semibold text-foreground">
                        {pageLabel}
                    </h2>
                    <Button as={Link} href={route("admin.employees.create")} icon={Plus}>
                        <span className="hidden sm:inline">{addLabel}</span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                </div>
            }
        >
            <Head title={pageLabel} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {flash.error}
                </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border border-l-4 border-l-primary-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                        Total {pageLabel}
                    </p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {employees.length}
                    </p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-sky-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                        Ada Akun Login
                    </p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {employees.filter((e) => e.user).length}
                    </p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-emerald-400 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Aktif</p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {activeCount}
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
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
                                placeholder="Cari nama, kode, cabang..."
                                className="block w-full rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm shadow-sm transition hover:bg-muted">
                                        <span className={statusFilter ? "text-foreground" : "text-muted-foreground"}>
                                            {statusFilter
                                                ? STATUS_LABELS[statusFilter]
                                                : "Semua Status"}
                                        </span>
                                        <svg
                                            className="h-3.5 w-3.5 text-muted-foreground"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                            />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content width="48">
                                    <button
                                        onClick={() => setStatusFilter("")}
                                        className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                                            !statusFilter
                                                ? "bg-primary-50 font-medium text-primary-600"
                                                : "text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        Semua Status
                                    </button>
                                    <button
                                        onClick={() =>
                                            setStatusFilter("active")
                                        }
                                        className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                                            statusFilter === "active"
                                                ? "bg-primary-50 font-medium text-primary-600"
                                                : "text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        Aktif
                                    </button>
                                    <button
                                        onClick={() =>
                                            setStatusFilter("inactive")
                                        }
                                        className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                                            statusFilter === "inactive"
                                                ? "bg-primary-50 font-medium text-primary-600"
                                                : "text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        Nonaktif
                                    </button>
                                    <button
                                        onClick={() =>
                                            setStatusFilter("terminated")
                                        }
                                        className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                                            statusFilter === "terminated"
                                                ? "bg-primary-50 font-medium text-primary-600"
                                                : "text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        Berhenti
                                    </button>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">
                                {filtered.length}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-foreground">
                                {employees.length}
                            </span>{" "}
                            {pageLabel.toLowerCase()}
                        </p>
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
                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search
                                ? "Karyawan tidak ditemukan"
                                : "Belum ada karyawan"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search
                                ? "Coba kata kunci lain."
                                : "Tambahkan karyawan untuk mengelola akses dan cabang."}
                        </p>
                        {!search && (
                            <Button as={Link} href={route("admin.employees.create")} icon={Plus} className="mt-5">
                                Tambah Karyawan
                            </Button>
                        )}
                    </div>
                ) : (
                    <EmployeeList
                        items={filtered}
                        onDelete={setTarget}
                        showCommission={showCommission}
                    />
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

function EmployeeBadge({ name }) {
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-500/10 text-sm font-bold text-primary-600">
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
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Tanpa akun
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[role] || "bg-muted text-muted-foreground"}`}
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
                onClick={() => onDelete(employee)}
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

function EmployeeList({ items, onDelete, showCommission = true }) {
    return (
        <>
            <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <th className="px-6 py-3.5">Karyawan</th>
                            <th className="px-6 py-3.5">Cabang</th>
                            <th className="px-6 py-3.5">Kontak</th>
                            <th className="px-6 py-3.5">Jabatan</th>
                            {showCommission && (
                                <th className="px-6 py-3.5 text-center">
                                    Komisi
                                </th>
                            )}
                            <th className="px-6 py-3.5 text-center">Role</th>
                            <th className="px-6 py-3.5 text-center">Status</th>
                            <th className="px-6 py-3.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((emp) => (
                            <tr
                                key={emp.id}
                                className="transition hover:bg-muted/70"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <EmployeeBadge name={emp.name} />
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">
                                                {emp.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {emp.employee_code}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    {emp.branch
                                        ? `${emp.branch.name} (${emp.branch.code})`
                                        : "-"}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-muted-foreground">
                                        {emp.phone || "-"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {emp.email || "-"}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    {emp.position || "-"}
                                </td>
                                {showCommission && (
                                    <td className="px-6 py-4 text-center">
                                        {emp.commission_type === "none" ||
                                        !emp.commission_type ? (
                                            <span className="text-xs text-muted-foreground">
                                                -
                                            </span>
                                        ) : emp.commission_type ===
                                          "percent" ? (
                                            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                                                {emp.commission_value}%
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                                                Rp{" "}
                                                {Number(
                                                    emp.commission_value,
                                                ).toLocaleString("id-ID")}
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

            <div className="divide-y divide-border lg:hidden">
                {items.map((emp) => (
                    <div key={emp.id} className="flex items-start gap-3 p-4">
                        <EmployeeBadge name={emp.name} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-foreground">
                                    {emp.name}
                                </p>
                                <StatusBadge status={emp.status} />
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                {emp.employee_code}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {emp.branch
                                    ? emp.branch.name
                                    : "Belum ada cabang"}
                            </p>
                            {emp.phone && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {emp.phone}
                                </p>
                            )}
                            <p className="mt-1 text-sm text-muted-foreground">
                                {emp.email || "-"}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <RoleBadge role={emp.user_roles?.[0]} />
                                {emp.position && (
                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                        {emp.position}
                                    </span>
                                )}
                                {showCommission &&
                                    emp.commission_type &&
                                    emp.commission_type !== "none" && (
                                        <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
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
