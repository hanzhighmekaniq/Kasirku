import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import axios from "axios";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import ConfirmDeleteModal from "./ConfirmDeleteModal";

/* ── constants ───────────────────────────────────────── */
const TYPE_META = {
    cash: { label: "Tunai", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    digital: { label: "Digital / QRIS", color: "bg-primary-50 text-primary-700", dot: "bg-primary-500" },
    card: { label: "Kartu", color: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
    credit: { label: "Kredit / Tempo", color: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
};

function TypeBadge({ type }) {
    const meta = TYPE_META[type] ?? { label: type, color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

/* ── Drag handle ─────────────────────────────────────── */
function DragHandle({ listeners, attributes }) {
    return (
        <button
            {...listeners}
            {...attributes}
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing transition-colors"
            title="Drag untuk mengubah urutan"
            tabIndex={-1}
        >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
        </button>
    );
}

/* ── Type badge ──────────────────────────────────────── */


/* ── Status badge ────────────────────────────────────── */
function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Nonaktif
        </span>
    );
}

/* ── Sortable row ────────────────────────────────────── */
function PaymentMethodRow({ method, idx, toggling, onToggle, onDelete, isDragOverlay = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: method.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? undefined : style}
            className={`flex items-center gap-2 sm:gap-3 border-b border-slate-100 bg-white px-3 sm:px-4 py-3 last:border-0 transition-colors ${
                isDragging ? "bg-primary-50/30" : "hover:bg-slate-50/60"
            } ${isDragOverlay ? "rounded-2xl shadow-xl ring-1 ring-black/10" : ""} ${!method.is_active ? "opacity-60" : ""}`}
        >
            {/* Drag handle */}
            <DragHandle listeners={listeners} attributes={attributes} />

            {/* Position */}
            <span className="hidden sm:inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">
                {idx + 1}
            </span>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{method.name}</p>
                <p className="truncate font-mono text-xs text-slate-400">{method.code}</p>
            </div>

            {/* Type + Provider (desktop) */}
            <div className="hidden sm:flex items-center gap-2">
                <TypeBadge type={method.type} />
            </div>
            <span className="hidden sm:inline-block text-xs text-slate-400 w-24 truncate text-right">{method.provider || "—"}</span>

            {/* Status toggle */}
            <button onClick={() => onToggle(method)} disabled={toggling === method.id} className="shrink-0 disabled:opacity-50">
                <StatusBadge active={method.is_active} />
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <Link
                    href={route("admin.payment-methods.edit", method.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-primary-50 hover:text-primary-600"
                    title="Edit"
                >
                    <Pencil className="h-4 w-4" strokeWidth={1.8} />
                </Link>
                <button
                    onClick={() => onDelete(method)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Hapus"
                >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                </button>
            </div>
        </div>
    );
}

/* ── Main component ─────────────────────────────────── */
export default function Index({ paymentMethods: initialMethods }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(null);
    const [methods, setMethods] = useState(initialMethods);
    const [activeId, setActiveId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return methods;
        const q = search.toLowerCase().trim();
        return methods.filter((m) => m.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q));
    }, [methods, search]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }, [filtered]);

    const activeMethod = activeId ? methods.find((m) => m.id === activeId) : null;

    const handleToggle = (method) => {
        setToggling(method.id);
        router.patch(route("admin.payment-methods.toggle", method.id), {}, {
            preserveScroll: true,
            onFinish: () => setToggling(null),
        });
    };

    const handleDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.payment-methods.destroy", target.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setTarget(null); },
        });
    };

    /* ── Drag & drop handlers ── */
    const handleDragStart = ({ active }) => {
        setActiveId(active.id);
        setSaved(false);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const oldIdx = sorted.findIndex((m) => m.id === active.id);
        const newIdx = sorted.findIndex((m) => m.id === over.id);
        const reordered = arrayMove(sorted, oldIdx, newIdx).map((m, i) => ({
            ...m,
            sort_order: i,
        }));
        setMethods(reordered);

        // Simpan ke server per item
        setSaving(true);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        const promises = reordered.map((m) =>
            axios.patch(
                route("admin.payment-methods.sort", m.id),
                { sort_order: m.sort_order },
                { headers: { "X-CSRF-TOKEN": csrf } },
            ),
        );

        Promise.all(promises)
            .then(() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            })
            .catch(() => setMethods(initialMethods))
            .finally(() => setSaving(false));
    };

    const stats = useMemo(() => ({
        total: methods.length,
        active: methods.filter((m) => m.is_active).length,
        inactive: methods.filter((m) => !m.is_active).length,
        types: new Set(methods.map((m) => m.type)).size,
    }), [methods]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Metode Pembayaran</h2>
                        <p className="text-sm text-slate-400">Atur urutan & metode bayar di kasir</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {saving && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                                Menyimpan...
                            </span>
                        )}
                        {saved && !saving && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Tersimpan
                            </span>
                        )}
                        <Link
                            href={route("admin.payment-methods.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            <span className="hidden sm:inline">Tambah Metode</span>
                            <span className="sm:hidden">Tambah</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Metode Pembayaran" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Total Metode</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Aktif</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.active}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Nonaktif</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.inactive}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400">Tipe</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{stats.types}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-slate-100 p-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                        <input
                            type="text"
                            placeholder="Cari metode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan{' '}
                            <span className="font-semibold text-slate-700">{sorted.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-slate-700">{methods.length}</span>{' '}
                            metode
                        </p>
                    </div>
                </div>

                {sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-600">
                            {search ? "Metode tidak ditemukan" : "Belum ada metode pembayaran"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            {search ? "Coba kata kunci lain" : 'Klik "Tambah Metode" untuk menambahkan'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Column header */}
                        <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-100 bg-slate-50/60 px-3 sm:px-4 py-2.5">
                            <div className="w-8" />
                            <div className="hidden sm:block w-7" />
                            <div className="flex-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Metode</div>
                            <div className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipe</div>
                            <div className="hidden sm:block w-24 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Provider</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</div>
                            <div className="w-18" />
                        </div>

                        {/* Drag & drop list */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <SortableContext items={sorted.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                                {sorted.map((m, idx) => (
                                    <PaymentMethodRow
                                        key={m.id}
                                        method={m}
                                        idx={idx}
                                        toggling={toggling}
                                        onToggle={handleToggle}
                                        onDelete={setTarget}
                                    />
                                ))}
                            </SortableContext>

                            <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
                                {activeMethod && (
                                    <PaymentMethodRow
                                        method={activeMethod}
                                        idx={sorted.findIndex((m) => m.id === activeMethod.id)}
                                        toggling={null}
                                        onToggle={() => {}}
                                        onDelete={() => {}}
                                        isDragOverlay
                                    />
                                )}
                            </DragOverlay>
                        </DndContext>

                        {/* Footer hint */}
                        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                            </svg>
                            <p className="text-[11px] text-slate-400">
                                Tarik baris untuk mengubah urutan tampilan metode. Perubahan disimpan otomatis.
                            </p>
                        </div>
                    </>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus metode pembayaran?"
                description={target ? `"${target.name}" akan dihapus permanen. Jika sudah pernah dipakai dalam transaksi, hapus tidak bisa dilakukan — nonaktifkan saja.` : ""}
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
