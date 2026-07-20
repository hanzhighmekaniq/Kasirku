import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useCallback } from "react";
import axios from "axios";
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
        ring: "ring-slate-200",
        bg: "bg-slate-100",
        text: "text-slate-600",
        dot: "bg-slate-400",
    },
    basic: {
        ring: "ring-blue-200",
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
    },
    pro: {
        ring: "ring-violet-200",
        bg: "bg-violet-50",
        text: "text-violet-700",
        dot: "bg-violet-500",
    },
    unlimited: {
        ring: "ring-primary-200",
        bg: "bg-primary-50",
        text: "text-primary-700",
        dot: "bg-primary-500",
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
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing transition-colors"
            title="Drag untuk mengubah urutan"
            tabIndex={-1}
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
                    d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
                />
            </svg>
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
            className={`group flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3.5 last:border-0 transition-colors ${
                isDragging ? "bg-primary-50/30" : "hover:bg-slate-50/60"
            } ${isDragOverlay ? "rounded-2xl shadow-xl ring-1 ring-black/10" : ""}`}
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
                    <p className="text-sm font-semibold text-slate-800">
                        {plan.label}
                    </p>
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${c.bg} ${c.text} ${c.ring}`}
                    >
                        {plan.code}
                    </span>
                    {!plan.is_active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Nonaktif
                        </span>
                    )}
                </div>
                {plan.description && (
                    <p className="mt-0.5 text-xs text-slate-400 truncate">
                        {plan.description}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-6 text-xs text-slate-600">
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        User
                    </p>
                    <p className="font-bold text-slate-800">{plan.max_users}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Cabang
                    </p>
                    <p className="font-bold text-slate-800">
                        {plan.max_branches}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Harga
                    </p>
                    <p className="font-bold text-slate-800">
                        {fmtPrice(plan.price)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Fitur
                    </p>
                    <p className="font-bold text-slate-800">
                        {plan.features?.length ?? 0}
                    </p>
                </div>
                {plan.trial_days > 0 && (
                    <div className="text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Trial
                        </p>
                        <p className="font-bold text-emerald-600">
                            {plan.trial_days}h
                        </p>
                    </div>
                )}
            </div>
            <div
                className={`h-2 w-2 shrink-0 rounded-full ${plan.is_active ? "bg-emerald-400" : "bg-slate-300"}`}
                title={plan.is_active ? "Aktif" : "Nonaktif"}
            />
            {/* Actions */}
            <div className="flex items-center gap-1">
                <Link
                    href={route("developer.plans.edit", plan)}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
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
                </Link>
                <button
                    onClick={() => onDelete(plan)}
                    disabled={deleting === plan.id}
                    title="Hapus"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
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
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                    </svg>
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
                        <h2 className="text-lg font-bold text-slate-800">
                            Paket Langganan
                        </h2>
                        <p className="text-xs text-slate-500">
                            {plans.length} paket · drag untuk mengubah urutan
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Saving indicator */}
                        {saving && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                                Menyimpan urutan...
                            </span>
                        )}
                        {saved && !saving && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                                <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.5 12.75l6 6 9-13.5"
                                    />
                                </svg>
                                Urutan disimpan
                            </span>
                        )}
                        <Link
                            href={route("developer.plans.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
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
                            Tambah Paket
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Paket Langganan" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
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
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H2.645c-1.73 0-2.813-1.874-1.948-3.374l7.26-12.547c.866-1.5 3.032-1.5 3.898 0l7.26 12.547zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {plans.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <span className="text-5xl mb-4">📦</span>
                        <p className="text-base font-semibold text-slate-800">
                            Belum ada paket
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            Buat paket langganan pertama.
                        </p>
                        <Link
                            href={route("developer.plans.create")}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                        >
                            Buat Paket
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Column header */}
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                            <div className="w-8" />
                            <div className="w-8" />
                            <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Paket
                            </div>
                            <div className="hidden sm:flex items-center gap-6 pr-2">
                                {["Aksi"].map((h) => (
                                    <div
                                        key={h}
                                        className="w-12 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400"
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
                        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
                            <svg
                                className="h-3.5 w-3.5 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
                                />
                            </svg>
                            <p className="text-[11px] text-slate-400">
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
