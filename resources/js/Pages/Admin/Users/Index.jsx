import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import EmployeeTabs from "@/Components/EmployeeTabs";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useRef, useState, useEffect } from "react";
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
        bg: "bg-amber-50",
        text: "text-amber-700",
        ring: "ring-amber-200",
    },
    admin: {
        dot: "bg-blue-400",
        bg: "bg-blue-50",
        text: "text-blue-700",
        ring: "ring-blue-200",
    },
    supervisor: {
        dot: "bg-violet-400",
        bg: "bg-violet-50",
        text: "text-violet-700",
        ring: "ring-violet-200",
    },
    kasir: {
        dot: "bg-green-400",
        bg: "bg-green-50",
        text: "text-green-700",
        ring: "ring-green-200",
    },
    gudang: {
        dot: "bg-orange-400",
        bg: "bg-orange-50",
        text: "text-orange-700",
        ring: "ring-orange-200",
    },
    kitchen: {
        dot: "bg-red-400",
        bg: "bg-destructive/10",
        text: "text-destructive",
        ring: "ring-red-200",
    },
};

function RoleBadge({ role }) {
    const c = ROLE_COLOR[role] ?? {
        dot: "bg-slate-400",
        bg: "bg-muted",
        text: "text-muted-foreground",
        ring: "ring-slate-200",
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

function RoleDropdown({ currentRole, roles, onChange }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const btnRef = useRef(null);
    const c = ROLE_COLOR[currentRole] ??
        ROLE_COLOR.kasir ?? {
            dot: "bg-slate-400",
            bg: "bg-muted",
            text: "text-muted-foreground",
        };
    const isOwner = currentRole === "owner";

    useEffect(() => {
        const handler = (e) => {
            if (btnRef.current && !btnRef.current.contains(e.target))
                setOpen(false);
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const toggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
        setOpen(!open);
    };

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                disabled={isOwner}
                onClick={isOwner ? undefined : toggle}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${isOwner ? "cursor-not-allowed" : "hover:shadow-sm cursor-pointer"} ${c.bg} ${c.text} border-border/60`}
            >
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {currentRole || "Pilih Role"}
                {!isOwner && (
                    <ChevronDown
                        className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
                        strokeWidth={2.5}
                    />
                )}
            </button>
            {open && (
                <div
                    className="fixed z-[100] w-44 overflow-hidden rounded-xl border border-border bg-card shadow-xl ring-1 ring-black/5"
                    style={{ top: pos.top, left: pos.left }}
                >
                    {roles
                        .filter((r) => r.name !== "owner")
                        .map((r) => {
                            const rc = ROLE_COLOR[r.name] ??
                                ROLE_COLOR.kasir ?? {
                                    dot: "bg-slate-400",
                                    text: "text-muted-foreground",
                                };
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(r.name);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition hover:bg-muted ${
                                        r.name === currentRole
                                            ? "bg-primary-50/50 text-primary-700"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${rc.dot}`}
                                    />
                                    {r.name}
                                    {r.name === currentRole && (
                                        <Check
                                            className="ml-auto h-3 w-3 text-primary-500"
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </button>
                            );
                        })}
                </div>
            )}
        </>
    );
}

const inp = (err) =>
    `block w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
        err
            ? "border-red-300 bg-destructive/10/30 focus:ring-red-200"
            : "border-border bg-card hover:border-border focus:border-ring focus:ring-ring/20"
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
}) {
    const { flash } = usePage().props;
    const [showInvite, setShowInvite] = useState(false);

    const inviteForm = useForm({
        name: "",
        email: "",
        password: "",
        role: "kasir",
        branch_id: "",
        position: "",
    });

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
        if (!confirm(`Cabut akses "${user.name}" dari toko ini?`)) return;
        router.delete(route("admin.store-users.revoke", user.id));
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
                action={
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
                        <span className="hidden sm:inline">Undang User</span>
                        <span className="sm:hidden">Undang</span>
                    </Button>
                }
            />

            <EmployeeTabs />

            <Head title="Pengguna Aplikasi" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {flash.error}
                </div>
            )}

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
                                dot: "bg-slate-400",
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
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Batas {planInfo?.max_users} pengguna paket{" "}
                        {planInfo?.label} tercapai. Upgrade plan untuk menambah
                        lebih banyak.
                    </div>
                )}

                {/* ── User Table ── */}
                <div className="rounded-2xl border border-border bg-card shadow-sm">
                    {storeUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
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
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            <th className="px-6 py-3.5">
                                                Pengguna
                                            </th>
                                            <th className="px-6 py-3.5">
                                                Cabang
                                            </th>
                                            <th className="px-6 py-3.5">
                                                Role
                                            </th>
                                            <th className="px-6 py-3.5 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {storeUsers.map((u) => {
                                            const isOwner = (
                                                u.roles || []
                                            ).includes("owner");
                                            return (
                                                <tr
                                                    key={u.id}
                                                    className={`transition hover:bg-muted/60 ${isOwner ? "bg-amber-50/30" : ""}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1 ${
                                                                    isOwner
                                                                        ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-amber-100"
                                                                        : "bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 ring-primary-100"
                                                                }`}
                                                            >
                                                                {isOwner
                                                                    ? "👑"
                                                                    : u.name
                                                                          .charAt(
                                                                              0,
                                                                          )
                                                                          .toUpperCase()}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="truncate font-semibold text-foreground">
                                                                        {u.name}
                                                                    </p>
                                                                    {isOwner && (
                                                                        <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                                                                            Owner
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {u.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.branch?.name ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Building2
                                                                    className="h-3.5 w-3.5 text-muted-foreground"
                                                                    strokeWidth={
                                                                        1.8
                                                                    }
                                                                />
                                                                <span className="text-sm text-muted-foreground">
                                                                    {
                                                                        u.branch
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm italic text-muted-foreground">
                                                                Semua cabang
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 overflow-visible">
                                                        <div className="flex flex-col gap-1.5">
                                                            <RoleDropdown
                                                                currentRole={
                                                                    u
                                                                        .roles?.[0] ??
                                                                    ""
                                                                }
                                                                roles={roles}
                                                                onChange={(
                                                                    role,
                                                                ) =>
                                                                    assignRole(
                                                                        u.id,
                                                                        role,
                                                                    )
                                                                }
                                                            />
                                                            {u.roles?.length >
                                                                0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {u.roles.map(
                                                                        (r) => (
                                                                            <RoleBadge
                                                                                key={
                                                                                    r
                                                                                }
                                                                                role={
                                                                                    r
                                                                                }
                                                                            />
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {!isOwner && (
                                                            <button
                                                                onClick={() =>
                                                                    revoke(u)
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <Trash2
                                                                    className="h-3.5 w-3.5"
                                                                    strokeWidth={
                                                                        1.8
                                                                    }
                                                                />
                                                                Cabut
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="divide-y divide-border md:hidden">
                                {storeUsers.map((u) => {
                                    const isOwner = (u.roles || []).includes(
                                        "owner",
                                    );
                                    return (
                                        <div
                                            key={u.id}
                                            className={`p-4 ${isOwner ? "bg-amber-50/30" : ""}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span
                                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                                            isOwner
                                                                ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700"
                                                                : "bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600"
                                                        }`}
                                                    >
                                                        {isOwner
                                                            ? "👑"
                                                            : u.name
                                                                  .charAt(0)
                                                                  .toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="truncate text-sm font-semibold text-foreground">
                                                                {u.name}
                                                            </p>
                                                            {isOwner && (
                                                                <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                                                                    Owner
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {u.email}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <Building2
                                                                className="h-3 w-3 text-muted-foreground"
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                            />
                                                            <span className="text-xs text-muted-foreground">
                                                                {u.branch
                                                                    ?.name ??
                                                                    "Semua cabang"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isOwner && (
                                                    <button
                                                        onClick={() =>
                                                            revoke(u)
                                                        }
                                                        className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-destructive/10 hover:text-destructive"
                                                        title="Cabut akses"
                                                    >
                                                        <Trash2
                                                            className="h-4 w-4"
                                                            strokeWidth={1.8}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <RoleDropdown
                                                    currentRole={
                                                        u.roles?.[0] ?? ""
                                                    }
                                                    roles={roles}
                                                    onChange={(role) =>
                                                        assignRole(u.id, role)
                                                    }
                                                />
                                                {u.roles?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {u.roles.map((r) => (
                                                            <RoleBadge
                                                                key={r}
                                                                role={r}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Invite Modal ── */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowInvite(false)}
                    />
                    <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
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
                                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-muted-foreground"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={submitInvite} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>
                                        Nama Lengkap *
                                    </label>
                                    <input
                                        value={inviteForm.data.name}
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
                                    className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
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
        </AuthenticatedLayout>
    );
}
