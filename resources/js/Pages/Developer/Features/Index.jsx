import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    CircleCheck,
    ListTree,
    Pencil,
    Plus,
    Puzzle,
    Trash2,
    TriangleAlert,
} from "lucide-react";

export default function Index({ features = [], displayGroups = {} }) {
    const { flash } = usePage().props;
    const [deleting, setDeleting] = useState(null);

    const grouped = features.reduce((acc, f) => {
        (acc[f.display_group] ??= []).push(f);
        return acc;
    }, {});

    const handleDelete = (feature) => {
        if (!confirm(`Hapus fitur "${feature.label}"?`)) return;
        setDeleting(feature.id);
        router.delete(route("developer.features.destroy", feature.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Fitur Sistem
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {features.length} fitur · dipakai untuk toggle
                            akses per plan & jenis usaha
                        </p>
                    </div>
                    <Link
                        href={route("developer.features.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        Tambah Fitur
                    </Link>
                </div>
            }
        >
            <Head title="Fitur Sistem" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.error}
                </div>
            )}

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                <p>
                    Fitur baru di sini hanya jadi toggle yang bisa
                    diaktifkan per plan atau jenis usaha — untuk benar-benar
                    mengunci sebuah halaman/menu di aplikasi, kode
                    programmer wajib memakai kode fitur ini di
                    middleware/component terkait.
                </p>
            </div>

            <div className="space-y-5">
                {Object.entries(displayGroups).map(([groupKey, groupLabel]) => {
                    const items = grouped[groupKey] ?? [];
                    if (items.length === 0) return null;

                    return (
                        <div
                            key={groupKey}
                            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                        >
                            <div className="border-b border-border bg-muted/60 px-5 py-3">
                                <h3 className="text-sm font-bold text-foreground">
                                    {groupLabel}
                                </h3>
                            </div>
                            <div className="divide-y divide-border">
                                {items.map((feature) => (
                                    <div
                                        key={feature.id}
                                        className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-muted/40"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                            <Puzzle className="h-4 w-4 text-primary" strokeWidth={1.7} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {feature.label}
                                                </p>
                                                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                                    {feature.code}
                                                </span>
                                                {!feature.is_active && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>
                                            {feature.description && (
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {feature.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                                            <div className="text-center">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Plan
                                                </p>
                                                <p className="font-bold text-foreground">
                                                    {feature.plans_count}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Jenis Usaha
                                                </p>
                                                <p className="font-bold text-foreground">
                                                    {feature.store_types_count}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Link
                                                href={route("developer.features.details", feature.id)}
                                                title="Kelola Detail Fitur"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                            >
                                                <ListTree className="h-4 w-4" strokeWidth={1.7} />
                                            </Link>
                                            <Link
                                                href={route("developer.features.edit", feature.id)}
                                                title="Edit"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                                            >
                                                <Pencil className="h-4 w-4" strokeWidth={1.7} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(feature)}
                                                disabled={deleting === feature.id}
                                                title="Hapus"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                                            >
                                                <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </DeveloperLayout>
    );
}
