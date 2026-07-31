import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    CircleCheck,
    LayoutList,
    Pencil,
    Plus,
    Sparkles,
    Trash2,
    TriangleAlert,
} from "lucide-react";

export default function Index({ storeTypes = [] }) {
    const { flash } = usePage().props;
    const [deleting, setDeleting] = useState(null);

    const handleDelete = (template) => {
        if (!confirm(`Hapus template "${template.label}"?`)) return;
        setDeleting(template.id);
        router.delete(route("developer.business-templates.destroy", template.id), {
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
                            Template Bisnis
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Kategori & produk contoh yang ditawarkan saat
                            registrasi
                        </p>
                    </div>
                    <Link
                        href={route("developer.business-templates.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        Tambah Template
                    </Link>
                </div>
            }
        >
            <Head title="Template Bisnis" />

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

            <div className="space-y-5">
                {storeTypes.map((type) => (
                    <div
                        key={type.id}
                        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                    >
                        <div className="flex items-center gap-2.5 border-b border-border bg-muted/60 px-5 py-3">
                            <span className="text-lg" aria-hidden="true">
                                {type.icon}
                            </span>
                            <h3 className="text-sm font-bold text-foreground">
                                {type.label}
                            </h3>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground ring-1 ring-border">
                                {type.business_templates.length} template
                            </span>
                        </div>

                        {type.business_templates.length === 0 ? (
                            <p className="px-5 py-4 text-sm text-muted-foreground">
                                Belum ada template untuk jenis usaha ini.
                            </p>
                        ) : (
                            <div className="divide-y divide-border">
                                {type.business_templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-muted/40"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-lg ring-1 ring-border">
                                            {template.icon || "📦"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {template.label}
                                                </p>
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground ring-1 ring-border">
                                                    {template.code}
                                                </span>
                                                {template.is_ready ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success ring-1 ring-success/20">
                                                        <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                                                        Siap Pakai
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        Segera Hadir
                                                    </span>
                                                )}
                                                {!template.is_active && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>
                                            {template.description && (
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {template.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="hidden text-center sm:block">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Kategori
                                            </p>
                                            <p className="font-bold text-foreground">
                                                {template.categories_count}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Link
                                                href={route(
                                                    "developer.business-templates.categories",
                                                    template.id,
                                                )}
                                                title="Kelola Kategori & Produk"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                            >
                                                <LayoutList className="h-4 w-4" strokeWidth={1.7} />
                                            </Link>
                                            <Link
                                                href={route(
                                                    "developer.business-templates.edit",
                                                    template.id,
                                                )}
                                                title="Edit"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                                            >
                                                <Pencil className="h-4 w-4" strokeWidth={1.7} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(template)}
                                                disabled={deleting === template.id}
                                                title="Hapus"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                                            >
                                                <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </DeveloperLayout>
    );
}
