import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import EmployeeTabs from "@/Components/EmployeeTabs";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import Dropdown from "@/Components/Dropdown";
import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
    Building2,
    Check,
    ChevronDown,
    Mail,
    Plus,
    Shield,
    Trash2,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import Button from "@/Components/ui/Button";

const ROLE_COLOR = {
    owner: {
        dot: "bg-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
        ring: "ring-amber-200 dark:ring-amber-800",
    },
    admin: {
        dot: "bg-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        ring: "ring-blue-200 dark:ring-blue-800",
    },
    supervisor: {
        dot: "bg-violet-400",
        bg: "bg-violet-100 dark:bg-violet-900/30",
        text: "text-violet-700 dark:text-violet-400",
        ring: "ring-violet-200 dark:ring-violet-800",
    },
    kasir: {
        dot: "bg-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        ring: "ring-green-200 dark:ring-green-800",
    },
    gudang: {
        dot: "bg-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-400",
        ring: "ring-orange-200 dark:ring-orange-800",
    },
    kitchen: {
        dot: "bg-red-400",
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        ring: "ring-red-200 dark:ring-red-800",
    },
};

function RoleBadge({ role }) {
    const c = ROLE_COLOR[role] ?? {
        dot: "bg-muted-foreground",
        bg: "bg-muted",
        text: "text-muted-foreground",
        ring: "ring-border",
    };
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            {role}
        </span>
    );
}

/**
 * Pemilih role per pengguna.
 *
 * Memakai komponen Dropdown bersama supaya perilaku buka/tutupnya sama dengan
 * dropdown lain di aplikasi. Versi sebelumnya memposisikan panel secara manual
 * (position: fixed + koordinat dihitung saat toggle) dengan penutup yang hanya
 * mengecek tombolnya sendiri — akibatnya klik pada item role dianggap "klik di
 * luar", panel tertutup lebih dulu, dan role tidak pernah berubah.
 */
function RoleDropdown({ currentRole, roles, onChange }) {
    const c = ROLE_COLOR[currentRole] ??
        ROLE_COLOR.kasir ?? {
            dot: "bg-muted-foreground",
            bg: "bg-muted",
            text: "text-muted-foreground",
        };
    const isOwner = currentRole === "owner";

    // Owner tidak bisa diubah rolenya — tampilkan sebagai badge statis.
    if (isOwner) {
        return (
            <span
                className={`inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold ${c.bg} ${c.text}`}
            >
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {currentRole}
            </span>
        );
    }

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold transition hover:shadow-sm ${c.bg} ${c.text}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    {currentRole || "Pilih Role"}
                    <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content
                align="left"
                width="48"
                radiusClasses="rounded-xl"
                contentClasses="py-1 bg-popover text-popover-foreground overflow-hidden"
            >
                {roles
                    .filter((r) => r.name !== "owner")
                    .map((r) => {
                        const rc = ROLE_COLOR[r.name] ??
                            ROLE_COLOR.kasir ?? {
                                dot: "bg-muted-foreground",
                                bg: "bg-muted",
                                text: "text-muted-foreground",
                            };
                        const active = r.name === currentRole;

                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => onChange(r.name)}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition hover:bg-accent hover:text-accent-foreground ${
                                    active
                                        ? `${rc.bg} ${rc.text} font-bold`
                                        : "text-muted-foreground"
                                }`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${rc.dot}`}
                                />
                                {r.name}
                                {active && (
                                    <Check
                                        className="ml-auto h-4 w-4"
                                        strokeWidth={3}
                                    />
                                )}
                            </button>
                        );
                    })}
            </Dropdown.Content>
        </Dropdown>
    );
}

const inp = (err) =>
    `block w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
        err
            ? "border-destructive bg-background focus:border-destructive focus:ring-destructive/20"
            : "border-input bg-background focus:border-ring focus:ring-ring/20"
    }`;

const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const errorClass = "mt-1 text-xs text-destructive";

export default function Index({
    storeUsers,
    roles,
    branches,
    canInvite,
    planInfo,
    unlinkedEmployees,
}) {
    const [showInvite, setShowInvite] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const inviteForm = useForm({
        name: "",
        email: "",
        password: "",
        role: "kasir",
        branch_id: "",
        position: "",
        employee_id: "",
    });

    const handleEmployeeSelect = (e) => {
        const empId = e.target.value;
        if (!empId) {
            inviteForm.setData(data => ({
                ...data,
                employee_id: "",
                name: "",
                email: "",
                branch_id: "",
                position: ""
            }));
            return;
        }
        const emp = unlinkedEmployees?.find(emp => emp.id == empId);
        if (emp) {
            inviteForm.setData(data => ({
                ...data,
                employee_id: emp.id,
                name: emp.name || "",
                email: emp.email || "",
                branch_id: emp.branch_id || "",
                position: emp.position || "",
            }));
        }
    };

    const submitInvite = (e) => {
        e.preventDefault();
        inviteForm.post(route("admin.store-users.invite"), {
            onSuccess: () => {
                setShowInvite(false);
                inviteForm.reset();
            },
        });
    };

    const assignRole = (userId, role) => {
        router.patch(route("admin.store-users.assign-role", userId), { role });
    };

    const revoke = (user) => {
        setUserToDelete(user);
    };

    const confirmRevoke = () => {
        if (!userToDelete) return;
        router.delete(route("admin.store-users.revoke", userToDelete.id), {
            onSuccess: () => setUserToDelete(null),
        });
    };

    const roleCounts = storeUsers.reduce((acc, u) => {
        (u.roles || []).forEach((r) => {
            acc[r] = (acc[r] || 0) + 1;
        });
        return acc;
    }, {});

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Pengguna Aplikasi
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <PageHeader
                title="Pengguna Aplikasi"
                breadcrumbs={["Admin", "Pengguna Aplikasi"]}
                heading={
                    <>
                        Manajemen{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pengguna Aplikasi
                        </span>
                    </>
                }
                description="Kelola siapa yang bisa mengakses toko ini dan menetapkan roles."
            />

            <EmployeeTabs />

            <Head title="Pengguna Aplikasi" />

            <div className="space-y-5">
                {/* ── Stats Bar ── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <p className="text-xs font-medium text-muted-foreground">
                            Total Pengguna
                        </p>
                        <p className="mt-1 text-2xl font-bold text-foreground">
                            {storeUsers.length}
                        </p>
                        {planInfo && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                dari {planInfo.max_users ?? "∞"} kuota
                            </p>
                        )}
                    </div>
                    {["admin", "supervisor", "kasir", "gudang", "kitchen"].map(
                        (role) => {
                            if (!roleCounts[role]) return null;
                            const c = ROLE_COLOR[role] ?? {
                                dot: "bg-muted-foreground",
                                text: "text-muted-foreground",
                            };
                            return (
                                <div
                                    key={role}
                                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={`h-2 w-2 rounded-full ${c.dot}`}
                                        />
                                        <p className="text-xs font-medium capitalize text-muted-foreground">
                                            {role}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-2xl font-bold text-foreground">
                                        {roleCounts[role]}
                                    </p>
                                </div>
                            );
                        },
                    )}
                </div>

                {/* Plan warning */}
                {!canInvite && (
                    <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                        Batas {planInfo?.max_users} pengguna paket{" "}
                        {planInfo?.label} tercapai. Upgrade plan untuk menambah
                        lebih banyak.
                    </div>
                )}

                {/* Actions — desktop; di mobile dipindah ke FAB kanan bawah */}
                <div className="hidden justify-end sm:flex">
                    <Button
                        onClick={() => setShowInvite(true)}
                        disabled={!canInvite}
                        icon={UserPlus}
                        title={
                            !canInvite
                                ? `Batas ${planInfo?.max_users} user paket ${planInfo?.label} tercapai`
                                : undefined
                        }
                    >
                        Undang Pengguna Baru
                    </Button>
                </div>

                {/* ── User Grid ── */}
                {storeUsers.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <Users
                                className="h-8 w-8 text-muted-foreground"
                                strokeWidth={1.4}
                            />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-foreground">
                            Belum ada pengguna
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Undang pengguna pertama untuk mulai beroperasi
                        </p>
                        <Button
                            onClick={() => setShowInvite(true)}
                            disabled={!canInvite}
                            icon={UserPlus}
                            className="mt-5"
                        >
                            Undang Pengguna
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {storeUsers.map((u) => {
                            const isOwner = (u.roles || []).includes("owner");
                            return (
                                <div
                                    key={u.id}
                                    className={`group flex flex-col rounded-2xl border border-border p-5 shadow-sm transition hover:shadow-md ${
                                        isOwner ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30" : "bg-card"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold shadow-sm ring-1 ${
                                                    isOwner
                                                        ? "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800"
                                                        : "bg-primary/10 text-primary ring-primary/20"
                                                }`}
                                            >
                                                {isOwner
                                                    ? "👑"
                                                    : u.name.charAt(0).toUpperCase()}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-semibold text-foreground">
                                                        {u.name}
                                                    </p>
                                                    {isOwner && (
                                                        <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800">
                                                            Owner
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {u.email}
                                                </p>
                                            </div>
                                        </div>
                                        {!isOwner && (
                                            <button
                                                onClick={() => revoke(u)}
                                                className="shrink-0 rounded-lg p-2 text-destructive transition hover:bg-destructive/10"
                                                title="Cabut akses"
                                            >
                                                <Trash2
                                                    className="h-4 w-4"
                                                    strokeWidth={2}
                                                />
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-5 flex-1">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Building2
                                                className="h-4 w-4 text-muted-foreground"
                                                strokeWidth={1.8}
                                            />
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {u.branch?.name ?? "Semua cabang"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Role
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <RoleDropdown
                                                    currentRole={u.roles?.[0] ?? ""}
                                                    roles={roles}
                                                    onChange={(role) =>
                                                        assignRole(u.id, role)
                                                    }
                                                />
                                                {u.roles?.length > 1 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {u.roles.slice(1).map((r) => (
                                                            <RoleBadge
                                                                key={r}
                                                                role={r}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Invite Modal ── */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setShowInvite(false)}
                    />
                    <div className="relative w-full max-w-lg rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <UserPlus
                                    className="h-5 w-5"
                                    strokeWidth={1.8}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-foreground">
                                    Undang Pengguna Baru
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Isi data untuk mengundang pengguna ke toko
                                    ini
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInvite(false)}
                                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={submitInvite} className="p-6 space-y-4">
                            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 mb-2">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-primary">
                                    Tautkan Karyawan (Opsional)
                                </label>
                                <select
                                    value={inviteForm.data.employee_id}
                                    onChange={handleEmployeeSelect}
                                    className={inp()}
                                    disabled={!unlinkedEmployees?.length}
                                >
                                    <option value="">
                                        {unlinkedEmployees?.length > 0
                                            ? "-- Buat Baru (Tidak Ditautkan) --"
                                            : "-- Tidak ada karyawan tersedia --"}
                                    </option>
                                    {unlinkedEmployees?.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} {emp.position ? `(${emp.position})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-xs text-primary/80">
                                    {unlinkedEmployees?.length > 0 
                                        ? "Jika dipilih, data di bawah akan terisi otomatis dan akun baru ini akan ditautkan ke karyawan tersebut."
                                        : "Semua karyawan di toko ini sudah tertaut dengan akun pengguna."}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>
                                        Nama Lengkap *
                                    </label>
                                    <input
                                        value={inviteForm.data.name}
                                        required
                                        onChange={(e) =>
                                            inviteForm.setData(
                                                "name",
                                                e.target.value,
                                            )
                                        }
                                        className={inp(inviteForm.errors.name)}
                                        placeholder="Nama lengkap"
                                    />
                                    {inviteForm.errors.name && (
                                        <p className={errorClass}>
                                            {inviteForm.errors.name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteForm.data.email}
                                        required
                                        onChange={(e) =>
                                            inviteForm.setData(
                                                "email",
                                                e.target.value,
                                            )
                                        }
                                        className={inp(inviteForm.errors.email)}
                                        placeholder="email@domain.com"
                                    />
                                    {inviteForm.errors.email && (
                                        <p className={errorClass}>
                                            {inviteForm.errors.email}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={inviteForm.data.password}
                                        required
                                        minLength={6}
                                        onChange={(e) =>
                                            inviteForm.setData(
                                                "password",
                                                e.target.value,
                                            )
                                        }
                                        className={inp(
                                            inviteForm.errors.password,
                                        )}
                                        placeholder="Minimal 6 karakter"
                                    />
                                    {inviteForm.errors.password && (
                                        <p className={errorClass}>
                                            {inviteForm.errors.password}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className={labelClass}>Role *</label>
                                    <select
                                        value={inviteForm.data.role}
                                        required
                                        onChange={(e) =>
                                            inviteForm.setData(
                                                "role",
                                                e.target.value,
                                            )
                                        }
                                        className={inp(inviteForm.errors.role)}
                                    >
                                        {roles
                                            .filter(
                                                (r) =>
                                                    !r.is_system ||
                                                    r.name !== "owner",
                                            )
                                            .map((r) => (
                                                <option
                                                    key={r.id}
                                                    value={r.name}
                                                >
                                                    {r.name}
                                                </option>
                                            ))}
                                    </select>
                                    {inviteForm.errors.role && (
                                        <p className={errorClass}>
                                            {inviteForm.errors.role}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className={labelClass}>Cabang</label>
                                    <select
                                        value={inviteForm.data.branch_id}
                                        onChange={(e) =>
                                            inviteForm.setData(
                                                "branch_id",
                                                e.target.value,
                                            )
                                        }
                                        className={inp()}
                                    >
                                        <option value="">Semua cabang</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>
                                        Posisi / Jabatan
                                    </label>
                                    <input
                                        value={inviteForm.data.position}
                                        onChange={(e) =>
                                            inviteForm.setData(
                                                "position",
                                                e.target.value,
                                            )
                                        }
                                        className={inp()}
                                        placeholder="cth: Kasir Senior, Barista..."
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowInvite(false)}
                                    className="rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <Button
                                    type="submit"
                                    loading={inviteForm.processing}
                                >
                                    {inviteForm.processing
                                        ? "Mengundang..."
                                        : "Undang Pengguna"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Modal ── */}
            <ConfirmDeleteModal
                open={userToDelete !== null}
                title="Cabut Akses Pengguna?"
                description={`Apakah Anda yakin ingin mencabut akses "${userToDelete?.name}" dari toko ini? Pengguna tersebut tidak akan bisa lagi mengakses data toko Anda.`}
                confirmLabel="Cabut Akses"
                onConfirm={confirmRevoke}
                onClose={() => setUserToDelete(null)}
            />

            {/* FAB — mobile only */}
            <Button
                onClick={() => setShowInvite(true)}
                disabled={!canInvite}
                icon={UserPlus}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl sm:hidden"
                title={
                    !canInvite
                        ? `Batas ${planInfo?.max_users} user paket ${planInfo?.label} tercapai`
                        : "Undang Pengguna Baru"
                }
            />
        </AuthenticatedLayout>
    );
}
