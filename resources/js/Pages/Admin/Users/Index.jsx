import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
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
        bg: "bg-red-50",
        text: "text-red-700",
        ring: "ring-red-200",
    },
};

function RoleBadge({ role }) {
    const c = ROLE_COLOR[role] ?? {
        dot: "bg-slate-400",
        bg: "bg-slate-50",
        text: "text-slate-600",
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
            bg: "bg-slate-50",
            text: "text-slate-600",
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
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${isOwner ? "cursor-not-allowed" : "hover:shadow-sm cursor-pointer"} ${c.bg} ${c.text} border-slate-200/60`}
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
                    className="fixed z-[100] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
                    style={{ top: pos.top, left: pos.left }}
                >
                    {roles
                        .filter((r) => r.name !== "owner")
                        .map((r) => {
                            const rc = ROLE_COLOR[r.name] ??
                                ROLE_COLOR.kasir ?? {
                                    dot: "bg-slate-400",
                                    text: "text-slate-600",
                                };
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(r.name);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition hover:bg-slate-50 ${
                                        r.name === currentRole
                                            ? "bg-primary-50/50 text-primary-700"
                                            : "text-slate-600"
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
            ? "border-red-300 bg-red-50/30 focus:ring-red-200"
            : "border-slate-200 bg-white hover:border-slate-300 focus:border-primary-400 focus:ring-primary-100"
    }`;

const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const errorClass = "mt-1 text-xs text-red-500";

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
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                            <Users className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Pengguna & Akses
                            </h2>
                            <p className="text-xs text-slate-400">
                                Kelola siapa yang bisa mengakses toko ini
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInvite(true)}
                        disabled={!canInvite}
                        title={
                            !canInvite
                                ? `Batas ${planInfo?.max_users} user paket ${planInfo?.label} tercapai`
                                : ""
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:from-primary-600 hover:to-primary-700 hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <UserPlus className="h-4 w-4" strokeWidth={2} />
                        <span className="hidden sm:inline">
                            Undang Pengguna
                        </span>
                        <span className="sm:hidden">Undang</span>
                    </button>
                </div>
            }
        >
            <Head title="Pengguna & Akses" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {flash.error}
                </div>
            )}

            <div className="space-y-5">
                {/* ── Stats Bar ── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-400">
                            Total Pengguna
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-800">
                            {storeUsers.length}
                        </p>
                        {planInfo && (
                            <p className="mt-0.5 text-xs text-slate-400">
                                dari {planInfo.max_users ?? "∞"} kuota
                            </p>
                        )}
                    </div>
                    {["admin", "supervisor", "kasir", "gudang", "kitchen"].map(
                        (role) => {
                            if (!roleCounts[role]) return null;
                            const c = ROLE_COLOR[role] ?? {
                                dot: "bg-slate-400",
                                text: "text-slate-600",
                            };
                            return (
                                <div
                                    key={role}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={`h-2 w-2 rounded-full ${c.dot}`}
                                        />
                                        <p className="text-xs font-medium capitalize text-slate-400">
                                            {role}
                                        </p>
                                    </div>
                                    <p className="mt-1 text-2xl font-bold text-slate-800">
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
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {storeUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                <Users
                                    className="h-8 w-8 text-slate-400"
                                    strokeWidth={1.4}
                                />
                            </div>
                            <h3 className="mt-4 text-sm font-semibold text-slate-700">
                                Belum ada pengguna
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Undang pengguna pertama untuk mulai beroperasi
                            </p>
                            <button
                                onClick={() => setShowInvite(true)}
                                disabled={!canInvite}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:from-primary-600 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <UserPlus className="h-4 w-4" strokeWidth={2} />
                                Undang Pengguna
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                                    <tbody className="divide-y divide-slate-100">
                                        {storeUsers.map((u) => {
                                            const isOwner = (
                                                u.roles || []
                                            ).includes("owner");
                                            return (
                                                <tr
                                                    key={u.id}
                                                    className={`transition hover:bg-slate-50/60 ${isOwner ? "bg-amber-50/30" : ""}`}
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
                                                                    <p className="truncate font-semibold text-slate-800">
                                                                        {u.name}
                                                                    </p>
                                                                    {isOwner && (
                                                                        <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                                                                            Owner
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="truncate text-xs text-slate-400">
                                                                    {u.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.branch?.name ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Building2
                                                                    className="h-3.5 w-3.5 text-slate-400"
                                                                    strokeWidth={
                                                                        1.8
                                                                    }
                                                                />
                                                                <span className="text-sm text-slate-600">
                                                                    {
                                                                        u.branch
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm italic text-slate-400">
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
                                                                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
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
                            <div className="divide-y divide-slate-100 md:hidden">
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
                                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                                {u.name}
                                                            </p>
                                                            {isOwner && (
                                                                <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                                                                    Owner
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="truncate text-xs text-slate-400">
                                                            {u.email}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <Building2
                                                                className="h-3 w-3 text-slate-400"
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                            />
                                                            <span className="text-xs text-slate-500">
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
                                                        className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
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
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowInvite(false)}
                    />
                    <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                                <UserPlus
                                    className="h-5 w-5"
                                    strokeWidth={1.8}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-slate-800">
                                    Undang Pengguna Baru
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Isi data untuk mengundang pengguna ke toko
                                    ini
                                </p>
                            </div>
                            <button
                                onClick={() => setShowInvite(false)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteForm.processing}
                                    className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60"
                                >
                                    {inviteForm.processing
                                        ? "Mengundang..."
                                        : "Undang Pengguna"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
