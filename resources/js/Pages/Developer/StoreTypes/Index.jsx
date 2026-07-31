import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";
import {
    Check,
    CircleCheck,
    GripVertical,
    Pencil,
    Plus,
    Store,
    Trash2,
    TriangleAlert,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Drag handle icon ──────────────────────────────────────────────────────────
function DragHandle({ listeners, attributes }) {
    return (
        <button
            {...listeners}
            {...attributes}
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
            title="Drag untuk mengubah urutan"
            tabIndex={-1}
        >
            <GripVertical className="h-4 w-4" strokeWidth={2} />
        </button>
    );
}

// ── Sortable row ──────────────────────────────────────────────────────────────
function StoreTypeRow({ storeType, onDelete, deleting, isDragOverlay = false }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: storeType.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? undefined : style}
            className={`group flex items-center gap-3 border-b border-border bg-card text-card-foreground px-4 py-3.5 last:border-0 transition-colors ${
                isDragging ? "bg-primary/10" : "hover:bg-muted/60"
            } ${isDragOverlay ? "rounded-2xl shadow-xl ring-1 ring-border" : ""}`}
        >
            <DragHandle listeners={listeners} attributes={attributes} />

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-lg ring-1 ring-border">
                {storeType.icon || "🏪"}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground">
                        {storeType.label}
                    </p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground ring-1 ring-border">
                        {storeType.code}
                    </span>
                    {!storeType.is_active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Nonaktif
                        </span>
                    )}
                </div>
                {storeType.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {storeType.description}
                    </p>
                )}
            </div>

            <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Toko
                    </p>
                    <p className="font-bold text-foreground">
                        {storeType.stores_count}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Template
                    </p>
                    <p className="font-bold text-foreground">
                        {storeType.business_templates_count}
                    </p>
                </div>
            </div>

            <div
                className={`h-2 w-2 shrink-0 rounded-full ${storeType.is_active ? "bg-success" : "bg-muted-foreground/40"}`}
                title={storeType.is_active ? "Aktif" : "Nonaktif"}
            />

            <div className="flex items-center gap-1">
                <Link
                    href={route("developer.store-types.edit", storeType)}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                >
                    <Pencil className="h-4 w-4" strokeWidth={1.7} />
                </Link>
                <button
                    onClick={() => onDelete(storeType)}
                    disabled={deleting === storeType.id}
                    title="Hapus"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                    <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                </button>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Index({ storeTypes: initialStoreTypes }) {
    const { flash } = usePage().props;
    const [storeTypes, setStoreTypes] = useState(initialStoreTypes);
    const [deleting, setDeleting] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const activeStoreType = activeId
        ? storeTypes.find((t) => t.id === activeId)
        : null;

    const handleDragStart = ({ active }) => {
        setActiveId(active.id);
        setSaved(false);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const oldIdx = storeTypes.findIndex((t) => t.id === active.id);
        const newIdx = storeTypes.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(storeTypes, oldIdx, newIdx).map((t, i) => ({
            ...t,
            sort_order: i,
        }));
        setStoreTypes(reordered);

        setSaving(true);
        axios
            .post(
                route("developer.store-types.reorder"),
                {
                    orders: reordered.map((t) => ({
                        id: t.id,
                        sort_order: t.sort_order,
                    })),
                },
                {
                    headers: {
                        "X-CSRF-TOKEN": document.querySelector(
                            'meta[name="csrf-token"]',
                        )?.content,
                    },
                },
            )
            .then(() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            })
            .catch(() => {
                setStoreTypes(initialStoreTypes);
                alert("Gagal menyimpan urutan.");
            })
            .finally(() => setSaving(false));
    };

    const handleDelete = (storeType) => {
        if (!confirm(`Hapus jenis usaha "${storeType.label}"?`)) return;
        setDeleting(storeType.id);
        router.delete(route("developer.store-types.destroy", storeType), {
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
                            Jenis Usaha
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {storeTypes.length} jenis usaha · drag untuk
                            mengubah urutan
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {saving && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                Menyimpan urutan...
                            </span>
                        )}
                        {saved && !saving && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-xs font-medium text-success">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Urutan disimpan
                            </span>
                        )}
                        <Link
                            href={route("developer.store-types.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            Tambah Jenis Usaha
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Jenis Usaha" />

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

            <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                {storeTypes.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <Store className="mb-4 h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                        <p className="text-base font-semibold text-foreground">
                            Belum ada jenis usaha
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Buat jenis usaha pertama.
                        </p>
                        <Link
                            href={route("developer.store-types.create")}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            Buat Jenis Usaha
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
                            <div className="w-8" />
                            <div className="w-9" />
                            <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Jenis Usaha
                            </div>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={storeTypes.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {storeTypes.map((storeType) => (
                                    <StoreTypeRow
                                        key={storeType.id}
                                        storeType={storeType}
                                        onDelete={handleDelete}
                                        deleting={deleting}
                                    />
                                ))}
                            </SortableContext>

                            <DragOverlay
                                dropAnimation={{
                                    duration: 150,
                                    easing: "cubic-bezier(0.18,0.67,0.6,1.22)",
                                }}
                            >
                                {activeStoreType && (
                                    <StoreTypeRow
                                        storeType={activeStoreType}
                                        onDelete={() => {}}
                                        deleting={null}
                                        isDragOverlay
                                    />
                                )}
                            </DragOverlay>
                        </DndContext>

                        <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-5 py-3">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                            <p className="text-[11px] text-muted-foreground">
                                Tarik baris untuk mengubah urutan tampilan.
                                Perubahan disimpan otomatis.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </DeveloperLayout>
    );
}
