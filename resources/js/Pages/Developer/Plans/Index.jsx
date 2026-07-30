import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useCallback } from "react";
import axios from "axios";
import {
    Check,
    CircleCheck,
    GripVertical,
    Package,
    Pencil,
    Plus,
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

// ── Plan badge colors ─────────────────────────────────────────────────────────
const PLAN_COLOR = {
    free: {
        ring: "ring-border",
        bg: "bg-muted",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground",
    },
    basic: {
        ring: "ring-blue-200 dark:ring-blue-800",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        dot: "bg-blue-600 dark:bg-blue-500",
    },
    pro: {
        ring: "ring-violet-200 dark:ring-violet-800",
        bg: "bg-violet-100 dark:bg-violet-900/30",
        text: "text-violet-700 dark:text-violet-400",
        dot: "bg-violet-600 dark:bg-violet-500",
    },
    unlimited: {
        ring: "ring-primary/20",
        bg: "bg-primary/10",
        text: "text-primary",
        dot: "bg-primary",
    },
};

function planColor(code) {
    return PLAN_COLOR[code] ?? PLAN_COLOR.basic;
}

function fmtPrice(price) {
    if (!price || price <= 0) return "Gratis";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(price);
}

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
function PlanRow({ plan, onDelete, deleting, isDragOverlay = false }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: plan.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const c = planColor(plan.code);

    return (
        <div
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? undefined : style}
            className={`group flex items-center gap-3 border-b border-border bg-card text-card-foreground px-4 py-3.5 last:border-0 transition-colors ${
                isDragging ? "bg-primary/10" : "hover:bg-muted/60"
            } ${isDragOverlay ? "rounded-2xl shadow-xl ring-1 ring-border" : ""}`}
        >
            {/* Drag handle */}
            <DragHandle listeners={listeners} attributes={attributes} />

            {/* Badge urutan */}
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1 ${c.bg} ${c.text} ${c.ring}`}
            >
                {plan.sort_order ?? "—"}
            </div>

            {/* Info paket */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                        {plan.label}
                    </p>
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${c.bg} ${c.text} ${c.ring}`}
                    >
                        {plan.code}
                    </span>
                    {!plan.is_active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Nonaktif
                        </span>
                    )}
                </div>
                {plan.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {plan.description}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        User
                    </p>
                    <p className="font-bold text-foreground">{plan.max_users}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Cabang
                    </p>
                    <p className="font-bold text-foreground">
                        {plan.max_branches}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Harga
                    </p>
                    <p className="font-bold text-foreground">
                        {fmtPrice(plan.price)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Fitur
                    </p>
                    <p className="font-bold text-foreground">
                        {plan.features?.length ?? 0}
                    </p>
                </div>
                {plan.trial_days > 0 && (
                    <div className="text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Trial
                        </p>
                        <p className="font-bold text-success">
                            {plan.trial_days}h
                        </p>
                    </div>
                )}
            </div>
            <div
                className={`h-2 w-2 shrink-0 rounded-full ${plan.is_active ? "bg-success" : "bg-muted-foreground/40"}`}
                title={plan.is_active ? "Aktif" : "Nonaktif"}
            />
            {/* Actions */}
            <div className="flex items-center gap-1">
                <Link
                    href={route("developer.plans.edit", plan)}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                >
                    <Pencil className="h-4 w-4" strokeWidth={1.7} />
                </Link>
                <button
                    onClick={() => onDelete(plan)}
                    disabled={deleting === plan.id}
                    title="Hapus"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                    <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                </button>
            </div>
            {/* Status dot */}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Index({ plans: initialPlans }) {
    const { flash } = usePage().props;
    const [plans, setPlans] = useState(initialPlans);
    const [deleting, setDeleting] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const activePlan = activeId ? plans.find((p) => p.id === activeId) : null;

    const handleDragStart = ({ active }) => {
        setActiveId(active.id);
        setSaved(false);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const oldIdx = plans.findIndex((p) => p.id === active.id);
        const newIdx = plans.findIndex((p) => p.id === over.id);
        const reordered = arrayMove(plans, oldIdx, newIdx).map((p, i) => ({
            ...p,
            sort_order: i,
        }));
        setPlans(reordered);

        // Simpan ke server
        setSaving(true);
        axios
            .post(
                route("developer.plans.reorder"),
                {
                    orders: reordered.map((p) => ({
                        id: p.id,
                        sort_order: p.sort_order,
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
                setPlans(initialPlans);
                alert("Gagal menyimpan urutan.");
            })
            .finally(() => setSaving(false));
    };

    const handleDelete = (plan) => {
        if (!confirm(`Hapus paket "${plan.label}"?`)) return;
        setDeleting(plan.id);
        router.delete(route("developer.plans.destroy", plan), {
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
                            Paket Langganan
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {plans.length} paket · drag untuk mengubah urutan
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Saving indicator */}
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
                            href={route("developer.plans.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            Tambah Paket
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Paket Langganan" />

            {/* Flash */}
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
                {plans.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <Package className="mb-4 h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                        <p className="text-base font-semibold text-foreground">
                            Belum ada paket
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Buat paket langganan pertama.
                        </p>
                        <Link
                            href={route("developer.plans.create")}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            Buat Paket
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Column header */}
                        <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
                            <div className="w-8" />
                            <div className="w-8" />
                            <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Paket
                            </div>
                            <div className="hidden sm:flex items-center gap-6 pr-2">
                                {["Aksi"].map((h) => (
                                    <div
                                        key={h}
                                        className="w-12 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Drag & drop list */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={plans.map((p) => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {plans.map((plan) => (
                                    <PlanRow
                                        key={plan.id}
                                        plan={plan}
                                        onDelete={handleDelete}
                                        deleting={deleting}
                                    />
                                ))}
                            </SortableContext>

                            {/* Drag overlay — mengikuti kursor */}
                            <DragOverlay
                                dropAnimation={{
                                    duration: 150,
                                    easing: "cubic-bezier(0.18,0.67,0.6,1.22)",
                                }}
                            >
                                {activePlan && (
                                    <PlanRow
                                        plan={activePlan}
                                        onDelete={() => {}}
                                        deleting={null}
                                        isDragOverlay
                                    />
                                )}
                            </DragOverlay>
                        </DndContext>

                        {/* Footer hint */}
                        <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-5 py-3">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                            <p className="text-[11px] text-muted-foreground">
                                Tarik baris untuk mengubah urutan tampilan
                                paket. Perubahan disimpan otomatis.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </DeveloperLayout>
    );
}
