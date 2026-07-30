import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowLeft, MapPin, Phone, User } from "lucide-react";

export default function Show({ branch, store, employees = [] }) {
    const { flash } = usePage().props;

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {branch.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {store?.name ?? "-"} — {branch.code}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href={route("developer.branches.edit", branch.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card text-card-foreground px-3.5 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                        >
                            <svg
                                className="h-4 w-4"
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
                            Edit
                        </Link>
                        <Link
                            href={route("developer.branches.index")}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                            Kembali
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={branch.name} />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                    </svg>
                    {flash.error}
                </div>
            )}

            <div className="mx-auto max-w-4xl space-y-5">
                {/* Info Card */}
                <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary shadow-sm">
                            {branch.code?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-bold text-foreground">
                                    {branch.name}
                                </h1>
                                <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                                    {branch.code}
                                </span>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        branch.is_active
                                            ? "bg-success/10 text-success"
                                            : "bg-destructive/10 text-destructive"
                                    }`}
                                >
                                    {branch.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                            </div>
                            {(branch.phone || branch.address) && (
                                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                                    {branch.phone && (
                                        <p className="flex items-center gap-1.5">
                                            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                            {branch.phone}
                                        </p>
                                    )}
                                    {branch.address && (
                                        <p className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                                            {branch.address}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Employees */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                        <h3 className="text-sm font-bold text-foreground">
                            Karyawan
                        </h3>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {employees.length}
                        </span>
                    </div>
                    {employees.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold">Nama</th>
                                    <th className="px-6 py-3 text-left font-semibold">Posisi</th>
                                    <th className="px-6 py-3 text-left font-semibold">Akun</th>
                                    <th className="px-6 py-3 text-center font-semibold">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {employees.map((e) => (
                                    <tr
                                        key={e.id}
                                        className="transition hover:bg-[rgb(var(--color-table-hover))]"
                                    >
                                        <td className="px-6 py-3.5 font-semibold text-foreground">
                                            {e.name}
                                        </td>
                                        <td className="px-6 py-3.5 text-muted-foreground">
                                            {e.position || "-"}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            {e.user ? (
                                                <span className="text-foreground">
                                                    {e.user.name}{" "}
                                                    <span className="text-xs text-muted-foreground">
                                                        ({e.user.email})
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    e.is_active
                                                        ? "bg-success/10 text-success"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {e.is_active
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center py-12 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                <User className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Belum ada karyawan
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Karyawan akan muncul saat ditugaskan ke cabang
                                ini
                            </p>
                        </div>
                    )}
                </div>

                <Link
                    href={route("developer.branches.index")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                    Kembali
                </Link>
            </div>
        </DeveloperLayout>
    );
}
